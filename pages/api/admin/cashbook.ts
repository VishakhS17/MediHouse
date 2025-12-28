import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'
import XLSX from 'xlsx'

// Helper to get admin user from request
async function getAdminUser(req: NextApiRequest): Promise<{ id: number; name: string } | null> {
  const adminDataHeader = req.headers['x-admin-data']
  if (adminDataHeader) {
    try {
      const admin = typeof adminDataHeader === 'string' ? JSON.parse(adminDataHeader) : adminDataHeader
      if (admin && admin.id) {
        return { id: parseInt(admin.id), name: admin.name || 'Unknown' }
      }
    } catch {
      // Ignore parse errors
    }
  }
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = getAdminUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - Admin user not found' })
  }

  const hasPermission = await checkPermission(userId, 'manage_cashbook')
  if (!hasPermission) {
    return res.status(403).json({ message: 'Forbidden - You do not have permission to manage cashbook' })
  }

  if (req.method === 'POST') {
    // Create new cashbook transaction
    try {
      const { transactionDate, receiptNumber, staffName, partyName, billNumbers, debitAmount, creditAmount, notes } = req.body

      if (!transactionDate || !staffName) {
        return res.status(400).json({
          message: 'Transaction date and staff name are required',
        })
      }

      if ((!debitAmount || debitAmount <= 0) && (!creditAmount || creditAmount <= 0)) {
        return res.status(400).json({
          message: 'Either debit amount or credit amount must be greater than 0',
        })
      }

      if (debitAmount > 0 && creditAmount > 0) {
        return res.status(400).json({
          message: 'Cannot have both debit and credit amounts',
        })
      }

      const adminUser = await getAdminUser(req)
      const createdBy = adminUser?.id || null

      // If receipt number is provided, check if it already exists
      if (receiptNumber) {
        const existingCheck = await query(
          'SELECT id FROM cashbook_transactions WHERE receipt_number = $1',
          [receiptNumber]
        )

        if (existingCheck.rows.length > 0) {
          return res.status(400).json({
            message: 'Receipt number already exists',
          })
        }
      }

      // Insert transaction (balance will be calculated by trigger)
      const result = await query(
        `INSERT INTO cashbook_transactions 
         (transaction_date, receipt_number, staff_name, party_name, bill_numbers, debit_amount, credit_amount, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, transaction_date, receipt_number, staff_name, party_name, bill_numbers, debit_amount, credit_amount, balance, notes, created_at`,
        [
          transactionDate,
          receiptNumber || null, // Will be auto-generated if null
          staffName,
          partyName || null,
          billNumbers || null,
          debitAmount || 0,
          creditAmount || 0,
          notes || null,
          createdBy,
        ]
      )

      res.status(201).json({
        success: true,
        message: 'Cashbook transaction recorded successfully',
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error('Cashbook transaction error:', error)
      res.status(500).json({
        message: 'Error recording cashbook transaction',
        error: error.message,
      })
    }
  } else if (req.method === 'GET') {
    // Get cashbook transactions
    try {
      const { startDate, endDate, staffName, partyName, receiptNumber, transactionType, limit = 100, offset = 0, download } = req.query

      const isExcelExport = download === 'true' || download === 'excel'

      let queryStr = `
        SELECT 
          ct.id,
          ct.transaction_date,
          ct.receipt_number,
          ct.staff_name,
          ct.party_name,
          ct.bill_numbers,
          ct.debit_amount,
          ct.credit_amount,
          ct.balance,
          ct.notes,
          ct.created_at,
          ct.updated_at,
          au.name as created_by_name
        FROM cashbook_transactions ct
        LEFT JOIN admin_users au ON ct.created_by = au.id
        WHERE 1=1
      `
      const params: any[] = []
      let paramIndex = 1

      if (startDate) {
        queryStr += ` AND ct.transaction_date >= $${paramIndex}`
        params.push(startDate)
        paramIndex++
      }

      if (endDate) {
        queryStr += ` AND ct.transaction_date <= $${paramIndex}`
        params.push(endDate)
        paramIndex++
      }

      if (staffName) {
        queryStr += ` AND ct.staff_name ILIKE $${paramIndex}`
        params.push(`%${staffName}%`)
        paramIndex++
      }

      if (partyName) {
        queryStr += ` AND ct.party_name ILIKE $${paramIndex}`
        params.push(`%${partyName}%`)
        paramIndex++
      }

      if (receiptNumber) {
        queryStr += ` AND ct.receipt_number ILIKE $${paramIndex}`
        params.push(`%${receiptNumber}%`)
        paramIndex++
      }

      if (transactionType === 'debit') {
        queryStr += ` AND ct.debit_amount > 0`
      } else if (transactionType === 'credit') {
        queryStr += ` AND ct.credit_amount > 0`
      }

      queryStr += ` ORDER BY ct.transaction_date DESC, ct.id DESC`

      // Only apply LIMIT and OFFSET for regular queries, not Excel exports
      if (!isExcelExport) {
        queryStr += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
        params.push(parseInt(limit as string), parseInt(offset as string))
      }

      const result = await query(queryStr, params)

      // Check if Excel download is requested
      if (download === 'true' || download === 'excel') {
        // Generate Excel file
        const excelData = result.rows.map((row) => ({
          'Transaction Date': new Date(row.transaction_date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }),
          'Receipt Number': row.receipt_number || '',
          'Staff Name': row.staff_name || '',
          'Party Name': row.party_name || '',
          'Bill Numbers': row.bill_numbers || '',
          'Debit Amount': parseFloat(row.debit_amount || 0),
          'Credit Amount': parseFloat(row.credit_amount || 0),
          'Balance': parseFloat(row.balance || 0),
          'Notes': row.notes || '',
          'Created By': row.created_by_name || '',
          'Created At': new Date(row.created_at).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }))

        const worksheet = XLSX.utils.json_to_sheet(excelData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Cashbook')

        // Generate filename with date filters if applicable
        const baseDate = new Date().toISOString().split('T')[0]
        let filename = `Cashbook_${baseDate}`
        
        if (startDate || endDate) {
          const start = startDate ? new Date(startDate as string).toISOString().split('T')[0] : 'all'
          const end = endDate ? new Date(endDate as string).toISOString().split('T')[0] : 'all'
          filename += `_${start}_to_${end}`
        }
        
        filename += '.xlsx'

        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.status(200).send(excelBuffer)
        return
      }

      // Get total count (only if not downloading)
      let countQuery = `SELECT COUNT(*) as total FROM cashbook_transactions WHERE 1=1`
      const countParams: any[] = []
      let countParamIndex = 1

      if (startDate) {
        countQuery += ` AND transaction_date >= $${countParamIndex}`
        countParams.push(startDate)
        countParamIndex++
      }

      if (endDate) {
        countQuery += ` AND transaction_date <= $${countParamIndex}`
        countParams.push(endDate)
        countParamIndex++
      }

      if (staffName) {
        countQuery += ` AND staff_name ILIKE $${countParamIndex}`
        countParams.push(`%${staffName}%`)
        countParamIndex++
      }

      if (partyName) {
        countQuery += ` AND party_name ILIKE $${countParamIndex}`
        countParams.push(`%${partyName}%`)
        countParamIndex++
      }

      if (receiptNumber) {
        countQuery += ` AND receipt_number ILIKE $${countParamIndex}`
        countParams.push(`%${receiptNumber}%`)
        countParamIndex++
      }

      if (transactionType === 'debit') {
        countQuery += ` AND debit_amount > 0`
      } else if (transactionType === 'credit') {
        countQuery += ` AND credit_amount > 0`
      }

      const countResult = await query(countQuery, countParams)

      // Get current balance (last transaction balance)
      const balanceResult = await query(
        `SELECT balance FROM cashbook_transactions ORDER BY transaction_date DESC, id DESC LIMIT 1`
      )
      const currentBalance = balanceResult.rows[0]?.balance || 0

      res.status(200).json({
        success: true,
        data: result.rows,
        total: parseInt(countResult.rows[0]?.total || '0'),
        currentBalance: parseFloat(currentBalance),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      })
    } catch (error: any) {
      console.error('Get cashbook transactions error:', error)
      res.status(500).json({
        message: 'Error fetching cashbook transactions',
        error: error.message,
      })
    }
  } else if (req.method === 'DELETE') {
    // Delete cashbook transaction
    try {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({
          message: 'Transaction ID is required',
        })
      }

      // Delete the transaction
      await query('DELETE FROM cashbook_transactions WHERE id = $1', [parseInt(id as string)])

      // Recalculate balances for all remaining transactions
      await query('SELECT recalculate_all_cashbook_balances()')

      res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully',
      })
    } catch (error: any) {
      console.error('Delete cashbook transaction error:', error)
      res.status(500).json({
        message: 'Error deleting transaction',
        error: error.message,
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

