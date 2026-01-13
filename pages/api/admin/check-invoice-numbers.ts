import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Check permission
    const userId = getAdminUserIdFromRequest(req)
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - Admin user not found' })
    }

    const hasPermission = await checkPermission(userId, 'manage_supply')
    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' })
    }

    // Get invoice numbers from request body
    const { invoiceNumbers } = req.body

    if (!invoiceNumbers || !Array.isArray(invoiceNumbers)) {
      return res.status(400).json({ message: 'Invoice numbers array is required' })
    }

    const invoiceNumbersArray = invoiceNumbers

    if (!Array.isArray(invoiceNumbersArray) || invoiceNumbersArray.length === 0) {
      return res.status(200).json({
        success: true,
        existingInvoiceNumbers: [],
      })
    }

    // Check which invoice numbers exist in the database (across all dates)
    // Use parameterized query with IN clause
    const placeholders = invoiceNumbersArray.map((_, index) => `$${index + 1}`).join(', ')
    const queryStr = `
      SELECT DISTINCT invoice_number
      FROM invoice_collections
      WHERE invoice_number IN (${placeholders})
    `

    const result = await query(queryStr, invoiceNumbersArray)

    const existingInvoiceNumbers = result.rows.map((row) => row.invoice_number)

    res.status(200).json({
      success: true,
      existingInvoiceNumbers,
    })
  } catch (error: any) {
    console.error('Check invoice numbers error:', error)
    res.status(500).json({
      message: 'Error checking invoice numbers',
      error: error.message,
    })
  }
}

