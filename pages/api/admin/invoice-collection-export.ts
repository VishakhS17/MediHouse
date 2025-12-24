import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'
import XLSX from 'xlsx'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Check permission
  const userId = getAdminUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - Admin user not found' })
  }

  const hasPermission = await checkPermission(userId, 'collect_invoices')
  if (!hasPermission) {
    return res.status(403).json({ message: 'Forbidden - You do not have permission to export invoice collections' })
  }

  try {
    const { startDate, endDate, invoiceNumber, orderId, searchTerm } = req.query

    // Fuzzy match function (same as frontend)
    const fuzzyMatch = (text: string, pattern: string): boolean => {
      const normalizedText = (text || '').toLowerCase().trim()
      const normalizedPattern = (pattern || '').toLowerCase().trim()
      
      if (!normalizedPattern) return true
      
      // Exact substring match (case-insensitive)
      if (normalizedText.includes(normalizedPattern)) return true
      
      // Simple fuzzy matching using character similarity
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
      
      const matchRatio = matchCount / normalizedPattern.length
      return matchRatio >= 0.7
    }

    // Get invoice collections with supply data
    let queryStr = `
      SELECT 
        ic.id,
        ic.invoice_number,
        ic.order_id,
        ic.collector_name,
        ic.collection_date,
        ic.notes,
        ic.created_at,
        au.name as collected_by_name,
        o.customer_name as order_customer_name,
        o.customer_phone,
        s.supplied_by,
        s.customer_name as supply_customer_name
      FROM invoice_collections ic
      LEFT JOIN admin_users au ON ic.collected_by = au.id
      LEFT JOIN orders o ON ic.order_id = o.id
      LEFT JOIN supply s ON ic.invoice_number = s.invoice_number
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
      params.push(endDate + ' 23:59:59')
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

    queryStr += ` ORDER BY ic.collection_date DESC`

    let result = await query(queryStr, params)

    // Apply search term filtering (fuzzy matching done in JavaScript)
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim()
      result.rows = result.rows.filter((row) => {
        // Check invoice number (exact substring match)
        const invoiceMatch = row.invoice_number?.toLowerCase().includes(searchLower)
        
        // Check collector name with fuzzy matching
        const collectorName = row.collector_name || ''
        const collectorMatch = fuzzyMatch(collectorName, searchTerm)
        
        return invoiceMatch || collectorMatch
      })
    }

    // Generate Excel file with supply data
    const excelData = result.rows.map((row) => ({
      'Invoice Number': row.invoice_number,
      'Order ID': row.order_id || '',
      'Collected By': row.collector_name,
      'Collection Date': new Date(row.collection_date).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      'Supplied By': row.supplied_by || '',
      'Customer Name': row.supply_customer_name || row.order_customer_name || '',
      'Customer Phone': row.customer_phone || '',
      'Notes': row.notes || '',
      'Collected By (Admin)': row.collected_by_name || '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Collections')

    const baseDate = new Date().toISOString().split('T')[0]
    const dateSuffix = startDate && endDate && startDate === endDate
      ? `_${startDate}`
      : (startDate || endDate)
        ? `_${startDate ? new Date(startDate as string).toISOString().split('T')[0] : 'all'}_to_${endDate ? new Date(endDate as string).toISOString().split('T')[0] : 'all'}`
        : ''
    const searchSuffix = searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== ''
      ? `_${searchTerm.trim().replace(/[^a-zA-Z0-9]/g, '_')}`
      : ''
    const filename = `Invoice_Collections_${baseDate}${dateSuffix}${searchSuffix}.xlsx`

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(excelBuffer)
  } catch (error: any) {
    console.error('Export invoice collections error:', error)
    res.status(500).json({
      message: 'Error exporting invoice collections',
      error: error.message,
    })
  }
}




