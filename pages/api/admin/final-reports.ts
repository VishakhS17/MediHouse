import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'
import XLSX from 'xlsx'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Check permission - we'll use a permission that makes sense, or create a new one
  // For now, let's check if user has permission to view any of these sections
  const userId = getAdminUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - Admin user not found' })
  }

  // Check if user has permission to view reports (check for any relevant permission)
  const hasCollectionPermission = await checkPermission(userId, 'collect_invoices')
  const hasCheckingPermission = await checkPermission(userId, 'check_invoices')
  const hasSupplyPermission = await checkPermission(userId, 'manage_supply')
  
  if (!hasCollectionPermission && !hasCheckingPermission && !hasSupplyPermission) {
    return res.status(403).json({ message: 'Forbidden - You do not have permission to view final reports' })
  }

  try {
    const { date, download } = req.query

    // Build query to join invoice_collections with supply
    let queryStr = `
      SELECT 
        ic.invoice_number,
        ic.collector_name,
        ic.collection_date,
        ic.checker_name,
        ic.checked_date,
        ic.notes,
        ic.created_at,
        ic.updated_at,
        s.supplied_by,
        s.delivery_date,
        s.customer_name
      FROM invoice_collections ic
      LEFT JOIN supply s ON ic.invoice_number = s.invoice_number
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramIndex = 1
    
    // Add date filter if provided (filter by collection_date)
    if (date && typeof date === 'string' && date.trim() !== '') {
      queryStr += ` AND DATE(ic.collection_date) = $${paramIndex}`
      params.push(date)
      paramIndex++
    }
    
    queryStr += ` ORDER BY ic.collection_date DESC`
    
    // If download, get all records (no limit)
    // Otherwise, limit for UI display
    if (download !== 'true' && download !== 'excel') {
      queryStr += ` LIMIT 10000`
    }

    const result = await query(queryStr, params)

    // If downloading as Excel
    if (download === 'true' || download === 'excel') {
      // Generate Excel file
      const excelData = result.rows.map((row) => ({
        'Invoice Number': row.invoice_number || '',
        'Collected By': row.collector_name || '',
        'Collected Date and Time': row.collection_date
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
        'Checked By': row.checker_name || '',
        'Checking Date and Time': row.checked_date
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
        'Supplied Date and Time': row.delivery_date
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
        'Customer Name': row.customer_name || '',
      }))

      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Final Reports')

      const baseDate = new Date().toISOString().split('T')[0]
      const dateSuffix = date && typeof date === 'string' && date.trim() !== ''
        ? `_${date}`
        : ''
      const filename = `Final_Reports_${baseDate}${dateSuffix}.xlsx`

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.status(200).send(excelBuffer)
      return
    }

    // Return JSON data
    res.status(200).json({
      success: true,
      data: result.rows,
    })
  } catch (error: any) {
    console.error('Final reports error:', error)
    res.status(500).json({
      message: 'Error fetching final reports',
      error: error.message,
    })
  }
}
