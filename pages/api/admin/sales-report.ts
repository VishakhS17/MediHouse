import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import XLSX from 'xlsx'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get date range from query params (optional)
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined

    // Build query for sales data
    // Convert order_date to IST (Asia/Kolkata) timezone at database level
    // Assuming order_date is stored as timestamptz (timestamp with time zone) in UTC
    // AT TIME ZONE converts timestamptz to timestamp in the specified timezone
    let salesQuery = `
      SELECT 
        o.id as order_id,
        o.order_date AT TIME ZONE 'Asia/Kolkata' as order_date,
        o.customer_name,
        o.customer_phone,
        o.customer_address,
        o.customer_email,
        oi.product_name,
        oi.product_manufacturer,
        oi.quantity,
        oi.created_at
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `

    const queryParams: any[] = []
    let paramIndex = 1

    if (startDate) {
      salesQuery += ` AND o.order_date >= $${paramIndex}`
      queryParams.push(startDate)
      paramIndex++
    }

    if (endDate) {
      salesQuery += ` AND o.order_date <= $${paramIndex}`
      queryParams.push(endDate + ' 23:59:59')
      paramIndex++
    }

    salesQuery += ` ORDER BY o.order_date DESC, o.id DESC, oi.product_name`

    const salesResult = await query(salesQuery, queryParams)

    if (salesResult.rows.length === 0) {
      return res.status(404).json({ message: 'No sales data found for the selected period' })
    }

    // Prepare data for Excel
    const excelData = salesResult.rows.map((row, index) => {
      // Parse the date from database (already converted to IST by PostgreSQL)
      const dbDate = new Date(row.order_date)
      
      // Format date and time in IST (already in IST from database query)
      const formattedDate = dbDate.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', // Ensure IST formatting
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true, // Use 12-hour format with AM/PM
      })
      
      return {
        'Sl No': index + 1,
        'Order ID': row.order_id,
        'Order Date': formattedDate,
        'Customer Name': row.customer_name,
        'Customer Phone': row.customer_phone,
        'Customer Address': row.customer_address,
        'Customer Email': row.customer_email || '',
        'Product Name': row.product_name,
        'Manufacturer': row.product_manufacturer,
        'Quantity Sold': row.quantity,
      }
    })

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Set column widths
    const columnWidths = [
      { wch: 8 },   // Sl No
      { wch: 10 },  // Order ID
      { wch: 18 },  // Order Date
      { wch: 20 },  // Customer Name
      { wch: 15 },  // Customer Phone
      { wch: 30 },  // Customer Address
      { wch: 25 },  // Customer Email
      { wch: 35 },  // Product Name
      { wch: 20 },  // Manufacturer
      { wch: 12 },  // Quantity Sold
    ]
    worksheet['!cols'] = columnWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report')

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Set response headers for file download
    const filename = `Sales_Report_${startDate || 'all'}_${endDate || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', excelBuffer.length)

    res.status(200).send(excelBuffer)
  } catch (error: any) {
    console.error('Sales report error:', error)
    res.status(500).json({
      message: 'Error generating sales report',
      error: error.message,
    })
  }
}

