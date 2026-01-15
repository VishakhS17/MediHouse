import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'

// Helper to get admin user from request
async function getAdminUser(req: NextApiRequest): Promise<{ id: number; name: string } | null> {
  // Get from headers (set by frontend)
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
  
  // Fallback: try to get from body
  if (req.body?.admin) {
    try {
      const admin = req.body.admin
      if (admin && admin.id) {
        return { id: parseInt(admin.id), name: admin.name || 'Unknown' }
      }
    } catch {
      // Ignore errors
    }
  }
  
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check permission for all methods
  const userId = getAdminUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - Admin user not found' })
  }

  const hasPermission = await checkPermission(userId, 'collect_invoices')
  if (!hasPermission) {
    return res.status(403).json({ message: 'Forbidden - You do not have permission to collect invoices' })
  }

  if (req.method === 'POST') {
    // Create new invoice collection
    try {
      const { invoiceNumber, orderId, collectorName, notes } = req.body

      if (!invoiceNumber || !collectorName) {
        return res.status(400).json({
          message: 'Invoice number and collector name are required',
        })
      }

      const adminUser = await getAdminUser(req)
      const collectedBy = adminUser?.id || null

      // Check if invoice already collected
      const existingCheck = await query(
        'SELECT id FROM invoice_collections WHERE invoice_number = $1',
        [invoiceNumber]
      )

      if (existingCheck.rows.length > 0) {
        return res.status(400).json({
          message: 'Invoice number already collected',
          existingId: existingCheck.rows[0].id,
        })
      }

      // Insert invoice collection
      const result = await query(
        `INSERT INTO invoice_collections 
         (invoice_number, order_id, collected_by, collector_name, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, invoice_number, order_id, collector_name, collection_date, notes`,
        [invoiceNumber, orderId || null, collectedBy, collectorName, notes || null]
      )

      res.status(201).json({
        success: true,
        message: 'Invoice collection recorded successfully',
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error('Invoice collection error:', error)
      res.status(500).json({
        message: 'Error recording invoice collection',
        error: error.message,
      })
    }
  } else if (req.method === 'GET') {
    // Get invoice collections
    try {
      const { startDate, endDate, invoiceNumber, orderId, limit = 50, offset = 0 } = req.query

      let queryStr = `
        SELECT 
          ic.id,
          ic.invoice_number,
          ic.order_id,
          ic.collector_name,
          ic.collection_date,
          ic.notes,
          ic.created_at,
          ic.updated_at,
          au.name as collected_by_name,
          o.customer_name,
          o.customer_phone
        FROM invoice_collections ic
        LEFT JOIN admin_users au ON ic.collected_by = au.id
        LEFT JOIN orders o ON ic.order_id = o.id
        WHERE 1=1
      `
      const params: any[] = []
      let paramIndex = 1

      if (startDate) {
        queryStr += ` AND ic.collection_date >= $${paramIndex}`
        params.push(startDate)
        paramIndex++
      }

      if (endDate) {
        queryStr += ` AND ic.collection_date <= $${paramIndex}`
        params.push(endDate)
        paramIndex++
      }

      if (invoiceNumber) {
        queryStr += ` AND ic.invoice_number ILIKE $${paramIndex}`
        params.push(`%${invoiceNumber}%`)
        paramIndex++
      }

      if (orderId) {
        queryStr += ` AND ic.order_id = $${paramIndex}`
        params.push(parseInt(orderId as string))
        paramIndex++
      }

      queryStr += ` ORDER BY ic.collection_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(parseInt(limit as string), parseInt(offset as string))

      const result = await query(queryStr, params)

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM invoice_collections ic
        WHERE 1=1
        ${startDate ? `AND ic.collection_date >= '${startDate}'` : ''}
        ${endDate ? `AND ic.collection_date <= '${endDate}'` : ''}
        ${invoiceNumber ? `AND ic.invoice_number ILIKE '%${invoiceNumber}%'` : ''}
        ${orderId ? `AND ic.order_id = ${orderId}` : ''}
      `
      const countResult = await query(countQuery)

      res.status(200).json({
        success: true,
        data: result.rows,
        total: parseInt(countResult.rows[0]?.total || '0'),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      })
    } catch (error: any) {
      console.error('Get invoice collections error:', error)
      res.status(500).json({
        message: 'Error fetching invoice collections',
        error: error.message,
      })
    }
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    // Update invoice collection
    try {
      const { id, invoiceNumber, orderId, collectorName, notes, remarks } = req.body

      if (!id) {
        return res.status(400).json({
          message: 'Collection ID is required',
        })
      }

      if (!invoiceNumber || !collectorName) {
        return res.status(400).json({
          message: 'Invoice number and collector name are required',
        })
      }

      // Check if collection exists
      const existingCheck = await query(
        'SELECT id FROM invoice_collections WHERE id = $1',
        [id]
      )

      if (existingCheck.rows.length === 0) {
        return res.status(404).json({
          message: 'Invoice collection not found',
        })
      }

      // Check if invoice number is already used by another record
      const duplicateCheck = await query(
        'SELECT id FROM invoice_collections WHERE invoice_number = $1 AND id != $2',
        [invoiceNumber, id]
      )

      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({
          message: 'Invoice number already used by another collection',
        })
      }

      // Combine notes and remarks if remarks is provided
      let finalNotes = notes || ''
      if (remarks && remarks.trim()) {
        finalNotes = finalNotes 
          ? `${finalNotes}\n\n[Remarks: ${remarks.trim()}]`
          : `[Remarks: ${remarks.trim()}]`
      }

      // Update invoice collection
      const result = await query(
        `UPDATE invoice_collections 
         SET invoice_number = $1, 
             order_id = $2, 
             collector_name = $3, 
             notes = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, invoice_number, order_id, collector_name, collection_date, notes, updated_at`,
        [invoiceNumber, orderId || null, collectorName, finalNotes || null, id]
      )

      res.status(200).json({
        success: true,
        message: 'Invoice collection updated successfully',
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error('Update invoice collection error:', error)
      res.status(500).json({
        message: 'Error updating invoice collection',
        error: error.message,
      })
    }
  } else if (req.method === 'DELETE') {
    // Delete invoice collection
    try {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({
          message: 'Collection ID is required',
        })
      }

      // Check if collection exists
      const existingCheck = await query(
        'SELECT id, invoice_number FROM invoice_collections WHERE id = $1',
        [id]
      )

      if (existingCheck.rows.length === 0) {
        return res.status(404).json({
          message: 'Invoice collection not found',
        })
      }

      // Delete the invoice collection
      await query(
        'DELETE FROM invoice_collections WHERE id = $1',
        [id]
      )

      res.status(200).json({
        success: true,
        message: 'Invoice collection deleted successfully',
        deletedInvoiceNumber: existingCheck.rows[0].invoice_number,
      })
    } catch (error: any) {
      console.error('Delete invoice collection error:', error)
      res.status(500).json({
        message: 'Error deleting invoice collection',
        error: error.message,
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

