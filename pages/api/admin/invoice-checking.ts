import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'
import XLSX from 'xlsx'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check permission for all methods
  const userId = getAdminUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - Admin user not found' })
  }

  const hasPermission = await checkPermission(userId, 'check_invoices')
  if (!hasPermission) {
    return res.status(403).json({ message: 'Forbidden - You do not have permission to check invoices' })
  }

  if (req.method === 'POST') {
    // Mark invoice as checked
    try {
      const { invoiceCollectionId, checkerName } = req.body

      if (!invoiceCollectionId || !checkerName) {
        return res.status(400).json({
          message: 'Invoice collection ID and checker name are required',
        })
      }

      // Check if invoice collection exists
      const collectionCheck = await query(
        'SELECT id FROM invoice_collections WHERE id = $1',
        [invoiceCollectionId]
      )

      if (collectionCheck.rows.length === 0) {
        return res.status(404).json({
          message: 'Invoice collection not found',
        })
      }

      // Update invoice collection with checker info
      const result = await query(
        `UPDATE invoice_collections 
         SET checker_name = $1, checked_date = NOW()
         WHERE id = $2
         RETURNING id, invoice_number, checker_name, checked_date`,
        [checkerName.trim(), invoiceCollectionId]
      )

      res.status(200).json({
        success: true,
        message: 'Invoice marked as checked successfully',
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error('Invoice checking error:', error)
      res.status(500).json({
        message: 'Error marking invoice as checked',
        error: error.message,
      })
    }
  } else if (req.method === 'GET') {
    // Get invoice collections with checking status
    try {
      const { limit = 1000, offset = 0, download, date } = req.query

      // Build query with optional date filter
      let queryStr = `
        SELECT 
          ic.id,
          ic.invoice_number,
          ic.collector_name,
          ic.collection_date,
          ic.checker_name,
          ic.checked_date,
          au.name as collected_by_name,
          s.supplied_by,
          s.customer_name as supply_customer_name
        FROM invoice_collections ic
        LEFT JOIN admin_users au ON ic.collected_by = au.id
        LEFT JOIN supply s ON ic.invoice_number = s.invoice_number
        WHERE 1=1
      `
      
      const params: any[] = []
      let paramIndex = 1
      
      // Add date filter if provided
      if (date) {
        queryStr += ` AND DATE(ic.collection_date) = $${paramIndex}`
        params.push(date)
        paramIndex++
      }
      
      queryStr += ` ORDER BY ic.collection_date DESC`
      
      // Add limit and offset only if not downloading
      if (download !== 'true' && download !== 'excel') {
        queryStr += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
        params.push(parseInt(limit as string), parseInt(offset as string))
      }

      const result = await query(queryStr, params)

      // Check if Excel download is requested
      if (download === 'true' || download === 'excel') {
        // Generate Excel file
        const excelData = result.rows.map((row) => ({
          'Invoice Number': row.invoice_number,
          'Who Collected': row.collector_name,
          'Date and Time of Collection': new Date(row.collection_date).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          'Who Checked': row.checker_name || '',
          'Date and Time of Checking': row.checked_date
            ? new Date(row.checked_date).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            : '',
          'Supplied By': row.supplied_by || '',
          'Customer Name': row.supply_customer_name || '',
        }))

        const worksheet = XLSX.utils.json_to_sheet(excelData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Checking')

        // Generate filename with date if filtered
        let filename = 'Invoice_Checking'
        if (date) {
          filename += `_${date}`
        } else {
          filename += `_${new Date().toISOString().split('T')[0]}`
        }
        filename += '.xlsx'
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.status(200).send(excelBuffer)
        return
      }

      res.status(200).json({
        success: true,
        data: result.rows,
        total: result.rows.length,
      })
    } catch (error: any) {
      console.error('Get invoice checking error:', error)
      res.status(500).json({
        message: 'Error fetching invoice checking data',
        error: error.message,
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

