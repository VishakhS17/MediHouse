import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Get all invoice numbers from invoice_collections that don't have supply records yet
    const result = await query(
      `SELECT DISTINCT ic.invoice_number
       FROM invoice_collections ic
       LEFT JOIN supply s ON ic.invoice_number = s.invoice_number
       WHERE s.invoice_number IS NULL
       ORDER BY ic.invoice_number ASC`
    )

    res.status(200).json({
      success: true,
      invoiceNumbers: result.rows.map(row => row.invoice_number),
    })
  } catch (error: any) {
    console.error('Get invoice numbers error:', error)
    res.status(500).json({
      message: 'Error fetching invoice numbers',
      error: error.message,
    })
  }
}



