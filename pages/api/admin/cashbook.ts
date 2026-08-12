import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'
import XLSX from 'xlsx'
import bcrypt from 'bcrypt'

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
      const { transactionDate, receiptNumber, staffName, partyName, billNumbers, debitAmount, creditAmount, bankTransferAmount, notes } = req.body

      if (!transactionDate || !staffName) {
        return res.status(400).json({
          message: 'Transaction date and staff name are required',
        })
      }

      if ((!debitAmount || debitAmount <= 0) && (!creditAmount || creditAmount <= 0) && (!bankTransferAmount || bankTransferAmount <= 0)) {
        return res.status(400).json({
          message: 'Either debit amount, credit amount, or bank transfer amount must be greater than 0',
        })
      }

      // Ensure only one transaction type is set
      const typesSet = [debitAmount > 0, creditAmount > 0, bankTransferAmount > 0].filter(Boolean).length
      if (typesSet > 1) {
        return res.status(400).json({
          message: 'Cannot have multiple transaction types (debit, credit, or bank transfer) in a single transaction',
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
         (transaction_date, receipt_number, staff_name, party_name, bill_numbers, debit_amount, credit_amount, bank_transfer_amount, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, transaction_date, receipt_number, staff_name, party_name, bill_numbers, debit_amount, credit_amount, bank_transfer_amount, balance, notes, created_at`,
        [
          transactionDate,
          receiptNumber || null, // Will be auto-generated if null
          staffName,
          partyName || null,
          billNumbers || null,
          debitAmount || 0,
          creditAmount || 0,
          bankTransferAmount || 0,
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
      const isUniqueReceipt =
        error?.code === '23505' && String(error?.constraint || '').includes('receipt_number')
      const isDeadlock = error?.code === '40P01'
      res.status(500).json({
        message: isUniqueReceipt
          ? 'Receipt number already exists. Leave it blank to auto-generate, or use a different number.'
          : isDeadlock
            ? 'Cashbook is busy with another save. Please try again.'
            : 'Error recording cashbook transaction',
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
          ct.bank_transfer_amount,
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
      } else if (transactionType === 'bank_transfer') {
        queryStr += ` AND ct.bank_transfer_amount > 0`
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
      } else if (transactionType === 'bank_transfer') {
        countQuery += ` AND bank_transfer_amount > 0`
      }

      const countResult = await query(countQuery, countParams)

      // Get current balance (last transaction balance)
      const balanceResult = await query(
        `SELECT balance FROM cashbook_transactions ORDER BY transaction_date DESC, id DESC LIMIT 1`
      )
      const currentBalance = balanceResult.rows[0]?.balance || 0

      // Get total debit and credit amounts (using same filters as count query)
      let sumQuery = `SELECT COALESCE(SUM(debit_amount), 0) as total_debit, COALESCE(SUM(credit_amount), 0) as total_credit FROM cashbook_transactions WHERE 1=1`
      const sumParams: any[] = []
      let sumParamIndex = 1

      if (startDate) {
        sumQuery += ` AND transaction_date >= $${sumParamIndex}`
        sumParams.push(startDate)
        sumParamIndex++
      }

      if (endDate) {
        sumQuery += ` AND transaction_date <= $${sumParamIndex}`
        sumParams.push(endDate)
        sumParamIndex++
      }

      if (staffName) {
        sumQuery += ` AND staff_name ILIKE $${sumParamIndex}`
        sumParams.push(`%${staffName}%`)
        sumParamIndex++
      }

      if (partyName) {
        sumQuery += ` AND party_name ILIKE $${sumParamIndex}`
        sumParams.push(`%${partyName}%`)
        sumParamIndex++
      }

      if (receiptNumber) {
        sumQuery += ` AND receipt_number ILIKE $${sumParamIndex}`
        sumParams.push(`%${receiptNumber}%`)
        sumParamIndex++
      }

      if (transactionType === 'debit') {
        sumQuery += ` AND debit_amount > 0`
      } else if (transactionType === 'credit') {
        sumQuery += ` AND credit_amount > 0`
      }

      const sumResult = await query(sumQuery, sumParams)
      const totalDebit = parseFloat(sumResult.rows[0]?.total_debit || '0')
      const totalCredit = parseFloat(sumResult.rows[0]?.total_credit || '0')

      res.status(200).json({
        success: true,
        data: result.rows,
        total: parseInt(countResult.rows[0]?.total || '0'),
        currentBalance: parseFloat(currentBalance),
        totalDebit,
        totalCredit,
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
  } else if (req.method === 'PUT') {
    // Update cashbook transaction
    try {
      const { id } = req.query
      const { transactionDate, receiptNumber, staffName, partyName, billNumbers, debitAmount, creditAmount, bankTransferAmount, notes, password } = req.body

      if (!id) {
        return res.status(400).json({
          message: 'Transaction ID is required',
        })
      }

      if (!transactionDate || !staffName) {
        return res.status(400).json({
          message: 'Transaction date and staff name are required',
        })
      }

      if ((!debitAmount || debitAmount <= 0) && (!creditAmount || creditAmount <= 0) && (!bankTransferAmount || bankTransferAmount <= 0)) {
        return res.status(400).json({
          message: 'Either debit amount, credit amount, or bank transfer amount must be greater than 0',
        })
      }

      // Ensure only one transaction type is set
      const typesSet = [debitAmount > 0, creditAmount > 0, bankTransferAmount > 0].filter(Boolean).length
      if (typesSet > 1) {
        return res.status(400).json({
          message: 'Cannot have multiple transaction types (debit, credit, or bank transfer) in a single transaction',
        })
      }

      // Check user role and record age
      const userRoleCheck = await query(
        `SELECT r.name as role_name
         FROM admin_users au
         LEFT JOIN admin_roles r ON au.role_id = r.id
         WHERE au.id = $1`,
        [userId]
      )

      const isSuperAdmin = userRoleCheck.rows[0]?.role_name === 'super_admin'

      // Get the transaction to check its creation time
      const transactionCheck = await query(
        `SELECT id, created_at FROM cashbook_transactions WHERE id = $1`,
        [parseInt(id as string)]
      )

      if (transactionCheck.rows.length === 0) {
        return res.status(404).json({
          message: 'Transaction not found',
        })
      }

      const transaction = transactionCheck.rows[0]
      const createdAt = new Date(transaction.created_at)
      const now = new Date()
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      const isOlderThan24Hours = hoursDiff > 24

      // If manager (not super admin) and record is older than 24 hours, deny edit
      if (!isSuperAdmin && isOlderThan24Hours) {
        return res.status(403).json({
          message: 'You can only edit records within 24 hours of creation. Please contact a super admin for older records.',
        })
      }

      // If super admin and record is older than 24 hours, require password
      if (isSuperAdmin && isOlderThan24Hours) {
        if (!password) {
          return res.status(403).json({
            message: 'Password required to edit records older than 24 hours. Please provide your admin password.',
          })
        }

        // Verify password against the logged-in admin's password hash
        const userResult = await query(
          `SELECT password_hash FROM admin_users WHERE id = $1`,
          [userId]
        )

        if (userResult.rows.length === 0) {
          return res.status(404).json({
            message: 'Admin user not found',
          })
        }

        const passwordHash = userResult.rows[0].password_hash
        const passwordMatch = await bcrypt.compare(password, passwordHash)

        if (!passwordMatch) {
          return res.status(403).json({
            message: 'Invalid password. Please enter the same password you use to log in as super admin.',
          })
        }
      }

      // If receipt number is provided, check if it already exists (excluding current transaction)
      if (receiptNumber) {
        const existingCheck = await query(
          'SELECT id FROM cashbook_transactions WHERE receipt_number = $1 AND id != $2',
          [receiptNumber, parseInt(id as string)]
        )

        if (existingCheck.rows.length > 0) {
          return res.status(400).json({
            message: 'Receipt number already exists',
          })
        }
      }

      // Update transaction
      const result = await query(
        `UPDATE cashbook_transactions 
         SET transaction_date = $1, receipt_number = $2, staff_name = $3, party_name = $4, 
             bill_numbers = $5, debit_amount = $6, credit_amount = $7, bank_transfer_amount = $8, notes = $9, updated_at = NOW()
         WHERE id = $10
         RETURNING id, transaction_date, receipt_number, staff_name, party_name, bill_numbers, 
                   debit_amount, credit_amount, bank_transfer_amount, balance, notes, created_at, updated_at`,
        [
          transactionDate,
          receiptNumber || null,
          staffName,
          partyName || null,
          billNumbers || null,
          debitAmount || 0,
          creditAmount || 0,
          bankTransferAmount || 0,
          notes || null,
          parseInt(id as string),
        ]
      )

      // Recalculate balances for all transactions after this one
      await query('SELECT recalculate_all_cashbook_balances()')

      res.status(200).json({
        success: true,
        message: 'Cashbook transaction updated successfully',
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error('Update cashbook transaction error:', error)
      res.status(500).json({
        message: 'Error updating cashbook transaction',
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

