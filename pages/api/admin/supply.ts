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

  const hasPermission = await checkPermission(userId, 'manage_supply')
  if (!hasPermission) {
    return res.status(403).json({ message: 'Forbidden - You do not have permission to manage supply' })
  }

  if (req.method === 'POST') {
    // Create new supply record
    try {
      const { invoiceNumber, suppliedBy, customerName, deliveryDate } = req.body

      if (!invoiceNumber || !suppliedBy || !customerName) {
        return res.status(400).json({
          message: 'Invoice number, supplied by, and customer name are required',
        })
      }

      // Check if invoice number exists in invoice_collections
      const invoiceCheck = await query(
        'SELECT id FROM invoice_collections WHERE invoice_number = $1',
        [invoiceNumber]
      )

      if (invoiceCheck.rows.length === 0) {
        return res.status(404).json({
          message: 'Invoice number not found in invoice collections',
        })
      }

      // Check if supply record already exists for this invoice
      const existingCheck = await query(
        'SELECT id FROM supply WHERE invoice_number = $1',
        [invoiceNumber]
      )

      if (existingCheck.rows.length > 0) {
        return res.status(400).json({
          message: 'Supply record already exists for this invoice number',
        })
      }

      // Check if delivery_date column exists
      const columnCheck = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'supply' AND column_name = 'delivery_date'
      `)
      const hasDeliveryDate = columnCheck.rows.length > 0

      // Insert supply record
      let result
      if (hasDeliveryDate) {
        result = await query(
          `INSERT INTO supply (invoice_number, supplied_by, customer_name, delivery_date, created_by)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, invoice_number, supplied_by, customer_name, delivery_date, created_at`,
          [invoiceNumber.trim(), suppliedBy.trim(), customerName.trim(), deliveryDate || null, userId]
        )
      } else {
        result = await query(
          `INSERT INTO supply (invoice_number, supplied_by, customer_name, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING id, invoice_number, supplied_by, customer_name, created_at`,
          [invoiceNumber.trim(), suppliedBy.trim(), customerName.trim(), userId]
        )
      }

      res.status(201).json({
        success: true,
        message: 'Supply record created successfully',
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error('Create supply error:', error)
      res.status(500).json({
        message: 'Error creating supply record',
        error: error.message,
      })
    }
  } else if (req.method === 'PUT') {
    // Update supply record
    try {
      const { id, suppliedBy, customerName, deliveryDate } = req.body

      if (!id || !suppliedBy || !customerName) {
        return res.status(400).json({
          message: 'ID, supplied by, and customer name are required',
        })
      }

      // Check if delivery_date column exists
      const columnCheck = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'supply' AND column_name = 'delivery_date'
      `)
      const hasDeliveryDate = columnCheck.rows.length > 0

      let result
      if (hasDeliveryDate) {
        result = await query(
          `UPDATE supply 
           SET supplied_by = $1, customer_name = $2, delivery_date = $3, updated_at = NOW()
           WHERE id = $4
           RETURNING id, invoice_number, supplied_by, customer_name, delivery_date, updated_at`,
          [suppliedBy.trim(), customerName.trim(), deliveryDate || null, id]
        )
      } else {
        result = await query(
          `UPDATE supply 
           SET supplied_by = $1, customer_name = $2, updated_at = NOW()
           WHERE id = $3
           RETURNING id, invoice_number, supplied_by, customer_name, updated_at`,
          [suppliedBy.trim(), customerName.trim(), id]
        )
      }

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'Supply record not found',
        })
      }

      res.status(200).json({
        success: true,
        message: 'Supply record updated successfully',
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error('Update supply error:', error)
      res.status(500).json({
        message: 'Error updating supply record',
        error: error.message,
      })
    }
  } else if (req.method === 'DELETE') {
    // Delete supply record
    try {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({
          message: 'Supply record ID is required',
        })
      }

      const result = await query('DELETE FROM supply WHERE id = $1 RETURNING id', [id])

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'Supply record not found',
        })
      }

      res.status(200).json({
        success: true,
        message: 'Supply record deleted successfully',
      })
    } catch (error: any) {
      console.error('Delete supply error:', error)
      res.status(500).json({
        message: 'Error deleting supply record',
        error: error.message,
      })
    }
  } else if (req.method === 'GET') {
    // Get supply records
    try {
      const { download } = req.query

      // Get all supply records with invoice collection and checking info
      // Check if delivery_date column exists first
      const columnCheck = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'supply' AND column_name = 'delivery_date'
      `)
      
      const hasDeliveryDate = columnCheck.rows.length > 0
      
      const queryStr = `
        SELECT 
          s.id,
          s.invoice_number,
          s.supplied_by,
          s.customer_name,
          ${hasDeliveryDate ? 's.delivery_date,' : 'NULL::timestamp with time zone as delivery_date,'}
          s.created_at,
          s.updated_at,
          ic.collector_name,
          ic.collection_date,
          ic.checker_name,
          ic.checked_date,
          au.name as created_by_name
        FROM supply s
        LEFT JOIN invoice_collections ic ON s.invoice_number = ic.invoice_number
        LEFT JOIN admin_users au ON s.created_by = au.id
        ORDER BY s.created_at DESC
      `

      const result = await query(queryStr)

      // Check if Excel download is requested
      if (download === 'true' || download === 'excel') {
        // Generate Excel file
        const excelData = result.rows.map((row) => ({
          'Invoice Number': row.invoice_number,
          'Who Collected': row.collector_name || '',
          'Date and Time of Collection': row.collection_date
            ? new Date(row.collection_date).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            : '',
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
          'Supplied By': row.supplied_by,
          'Customer Name': row.customer_name,
          'Date and Time of Delivery': row.delivery_date
            ? new Date(row.delivery_date).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            : '',
        }))

        const worksheet = XLSX.utils.json_to_sheet(excelData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Supply Records')

        const filename = `Supply_Records_${new Date().toISOString().split('T')[0]}.xlsx`
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
      console.error('Get supply error:', error)
      res.status(500).json({
        message: 'Error fetching supply records',
        error: error.message,
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

