import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'
import XLSX from 'xlsx'

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

  const hasPermission = await checkPermission(userId, 'manage_supply')
  if (!hasPermission) {
    return res.status(403).json({ message: 'Forbidden - You do not have permission to manage supply' })
  }

  if (req.method === 'GET') {
    // Get supply records or download Excel
    try {
      const { download, invoices } = req.query

      // If download is requested, generate Excel file
      if (download === 'true' || download === 'excel') {
        const { checkedDateFilter, searchTerm } = req.query

        // Fuzzy match function (same as frontend)
        const fuzzyMatch = (text: string, pattern: string): boolean => {
          const normalizedText = (text || '').toLowerCase().trim()
          const normalizedPattern = (pattern || '').toLowerCase().trim()
          
          if (!normalizedPattern) return true
          
          // Exact substring match (case-insensitive)
          if (normalizedText.includes(normalizedPattern)) return true
          
          // Simple fuzzy matching using character similarity
          // Count matching characters in order
          let textIndex = 0
          let matchCount = 0
          
          for (let i = 0; i < normalizedPattern.length; i++) {
            const char = normalizedPattern[i]
            const foundIndex = normalizedText.indexOf(char, textIndex)
            if (foundIndex !== -1) {
              matchCount++
              textIndex = foundIndex + 1
            }
          }
          
          // If at least 70% of pattern characters match in order, consider it a match
          const matchRatio = matchCount / normalizedPattern.length
          return matchRatio >= 0.7
        }

        // Build query with optional date filter
        let queryStr = `SELECT 
            s.id,
            s.invoice_number,
            s.supplied_by,
            s.customer_name,
            s.delivery_date,
            s.latitude,
            s.longitude,
            s.location_address,
            s.created_at,
            s.updated_at,
            ic.checked_date,
            au.name as created_by_name
          FROM supply s
          LEFT JOIN admin_users au ON s.created_by = au.id
          LEFT JOIN invoice_collections ic ON s.invoice_number = ic.invoice_number
          WHERE 1=1`

        const params: any[] = []
        let paramIndex = 1

        // Add date filter if provided
        if (checkedDateFilter && typeof checkedDateFilter === 'string' && checkedDateFilter.trim() !== '') {
          queryStr += ` AND DATE(ic.checked_date) = $${paramIndex}`
          params.push(checkedDateFilter)
          paramIndex++
        }

        queryStr += ` ORDER BY s.created_at DESC`

        let result = await query(queryStr, params)

        // Apply search term filtering (fuzzy matching done in JavaScript)
        if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
          const searchLower = searchTerm.toLowerCase().trim()
          result.rows = result.rows.filter((row) => {
            // Check invoice number (exact substring match)
            const invoiceMatch = row.invoice_number?.toLowerCase().includes(searchLower)
            
            // Check supplier name with fuzzy matching
            const supplierName = row.supplied_by || ''
            const supplierMatch = fuzzyMatch(supplierName, searchTerm)
            
            return invoiceMatch || supplierMatch
          })
        }

        // Generate Excel file
        const excelData = result.rows.map((row) => ({
          'Invoice Number': row.invoice_number,
          'Supplied By': row.supplied_by,
          'Customer Name': row.customer_name,
          'Checked Date': row.checked_date
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
          'Delivery Date': row.delivery_date
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
          'Latitude': row.latitude || '',
          'Longitude': row.longitude || '',
          'Location Address': row.location_address || '',
          'Created At': new Date(row.created_at).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          'Created By': row.created_by_name || '',
        }))

        const worksheet = XLSX.utils.json_to_sheet(excelData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Supply Records')

        // Construct filename - avoid reassignment by building in one expression
        const baseDate = new Date().toISOString().split('T')[0]
        const dateSuffix = checkedDateFilter && typeof checkedDateFilter === 'string' && checkedDateFilter.trim() !== '' 
          ? `_${checkedDateFilter}` 
          : ''
        const searchSuffix = searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== ''
          ? `_${searchTerm.trim().replace(/[^a-zA-Z0-9]/g, '_')}`
          : ''
        const filename = `Supply_Records_${baseDate}${dateSuffix}${searchSuffix}.xlsx`
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.status(200).send(excelBuffer)
        return
      }

      // If invoices query parameter is set, return all invoices with supply status
      if (invoices === 'true') {
        const result = await query(
          `SELECT 
            ic.id,
            ic.invoice_number,
            ic.collector_name,
            ic.collection_date,
            ic.checked_date,
            s.id as supply_id,
            s.supplied_by,
            s.customer_name as supply_customer_name,
            s.delivery_date,
            s.latitude,
            s.longitude,
            s.location_address,
            s.created_at as supply_created_at
          FROM invoice_collections ic
          LEFT JOIN supply s ON ic.invoice_number = s.invoice_number
          ORDER BY ic.collection_date DESC`
        )

        res.status(200).json({
          success: true,
          data: result.rows,
        })
        return
      }

      // Otherwise, return JSON data (existing supply records)
      const result = await query(
        `SELECT 
          s.id,
          s.invoice_number,
          s.supplied_by,
          s.customer_name,
          s.delivery_date,
          s.latitude,
          s.longitude,
          s.location_address,
          s.created_at,
          s.updated_at,
          au.name as created_by_name
        FROM supply s
        LEFT JOIN admin_users au ON s.created_by = au.id
        ORDER BY s.created_at DESC`
      )

      res.status(200).json({
        success: true,
        data: result.rows,
      })
    } catch (error: any) {
      console.error('Get supply records error:', error)
      res.status(500).json({
        message: 'Error fetching supply records',
        error: error.message,
      })
    }
  } else if (req.method === 'POST') {
    // Create new supply record
    try {
      const { invoiceNumber, suppliedBy, customerName, deliveryDate, latitude, longitude, locationAddress } = req.body

      if (!invoiceNumber || !suppliedBy || !customerName) {
        return res.status(400).json({
          message: 'Invoice number, supplied by, and customer name are required',
        })
      }

      const adminUser = await getAdminUser(req)
      const createdBy = adminUser?.id || null

      // Check if invoice number already exists (case-insensitive check)
      const existingCheck = await query(
        'SELECT id FROM supply WHERE LOWER(TRIM(invoice_number)) = LOWER(TRIM($1))',
        [invoiceNumber]
      )

      if (existingCheck.rows.length > 0) {
        return res.status(400).json({
          message: `Invoice number "${invoiceNumber}" already exists in supply records`,
          existingId: existingCheck.rows[0].id,
        })
      }

      // Insert supply record
      const result = await query(
        `INSERT INTO supply 
         (invoice_number, supplied_by, customer_name, delivery_date, latitude, longitude, location_address, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, invoice_number, supplied_by, customer_name, delivery_date, latitude, longitude, location_address, created_at`,
        [
          invoiceNumber.trim(),
          suppliedBy.trim(),
          customerName.trim(),
          deliveryDate || null,
          latitude || null,
          longitude || null,
          locationAddress || null,
          createdBy,
        ]
      )

      res.status(201).json({
        success: true,
        message: 'Supply record created successfully',
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error('Create supply record error:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        detail: error.detail,
        constraint: error.constraint,
      })
      
      // Check for specific database errors
      let errorMessage = 'Error creating supply record'
      if (error.code === '23505') {
        // Unique constraint violation
        errorMessage = 'This invoice number already exists in supply records'
      } else if (error.code === '23503') {
        // Foreign key constraint violation
        errorMessage = 'Invalid reference. Please check your input data'
      } else if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
        errorMessage = 'Supply table does not exist. Please run the database migration script (scripts/migrate-supply.sql) first.'
      } else if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to database. Please check your database connection.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      res.status(500).json({
        message: errorMessage,
        error: error.message,
        code: error.code,
      })
    }
  } else if (req.method === 'PUT') {
    // Update supply record
    try {
      const { id, suppliedBy, customerName, deliveryDate, latitude, longitude, locationAddress } = req.body

      if (!id) {
        return res.status(400).json({
          message: 'Supply record ID is required',
        })
      }

      if (!suppliedBy || !customerName) {
        return res.status(400).json({
          message: 'Supplied by and customer name are required',
        })
      }

      // Check if record exists
      const existingCheck = await query(
        'SELECT id FROM supply WHERE id = $1',
        [id]
      )

      if (existingCheck.rows.length === 0) {
        return res.status(404).json({
          message: 'Supply record not found',
        })
      }

      // Update supply record
      const result = await query(
        `UPDATE supply 
         SET supplied_by = $1, 
             customer_name = $2, 
             delivery_date = $3,
             latitude = $4,
             longitude = $5,
             location_address = $6,
             updated_at = NOW()
         WHERE id = $7
         RETURNING id, invoice_number, supplied_by, customer_name, delivery_date, latitude, longitude, location_address, updated_at`,
        [
          suppliedBy.trim(),
          customerName.trim(),
          deliveryDate || null,
          latitude || null,
          longitude || null,
          locationAddress || null,
          id,
        ]
      )

      res.status(200).json({
        success: true,
        message: 'Supply record updated successfully',
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error('Update supply record error:', error)
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

      // Check if record exists
      const existingCheck = await query(
        'SELECT id FROM supply WHERE id = $1',
        [id]
      )

      if (existingCheck.rows.length === 0) {
        return res.status(404).json({
          message: 'Supply record not found',
        })
      }

      // Delete supply record
      await query('DELETE FROM supply WHERE id = $1', [id])

      res.status(200).json({
        success: true,
        message: 'Supply record deleted successfully',
      })
    } catch (error: any) {
      console.error('Delete supply record error:', error)
      res.status(500).json({
        message: 'Error deleting supply record',
        error: error.message,
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

