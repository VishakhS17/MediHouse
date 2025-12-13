import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { getAdminUserIdFromRequest, checkPermission } from '@/lib/adminPermissions'

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

    const hasPermission = await checkPermission(userId, 'manage_orders')
    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' })
    }

    // Get query parameters
    const { limit = 50, offset = 0, startDate, endDate, customerName, orderId } = req.query

    // Build query
    let ordersQuery = `
      SELECT 
        o.id,
        o.order_date AT TIME ZONE 'Asia/Kolkata' as order_date,
        o.customer_name,
        o.customer_phone,
        o.customer_address,
        o.customer_email,
        o.total_items,
        o.created_at
      FROM orders o
      WHERE 1=1
    `

    const params: any[] = []
    let paramIndex = 1

    if (orderId) {
      ordersQuery += ` AND o.id = $${paramIndex}`
      params.push(parseInt(orderId as string))
      paramIndex++
    }

    if (startDate) {
      ordersQuery += ` AND o.order_date >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      ordersQuery += ` AND o.order_date <= $${paramIndex}`
      params.push(endDate + ' 23:59:59')
      paramIndex++
    }

    if (customerName) {
      ordersQuery += ` AND o.customer_name ILIKE $${paramIndex}`
      params.push(`%${customerName}%`)
      paramIndex++
    }

    ordersQuery += ` ORDER BY o.order_date DESC, o.id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(parseInt(limit as string), parseInt(offset as string))

    const ordersResult = await query(ordersQuery, params)

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await query(
          `SELECT 
            id,
            product_id,
            product_name,
            product_manufacturer,
            quantity
           FROM order_items
           WHERE order_id = $1
           ORDER BY product_name`,
          [order.id]
        )

        return {
          ...order,
          items: itemsResult.rows,
        }
      })
    )

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM orders WHERE 1=1`
    const countParams: any[] = []
    let countParamIndex = 1

    if (orderId) {
      countQuery += ` AND id = $${countParamIndex}`
      countParams.push(parseInt(orderId as string))
      countParamIndex++
    }

    if (startDate) {
      countQuery += ` AND order_date >= $${countParamIndex}`
      countParams.push(startDate)
      countParamIndex++
    }

    if (endDate) {
      countQuery += ` AND order_date <= $${countParamIndex}`
      countParams.push(endDate + ' 23:59:59')
      countParamIndex++
    }

    if (customerName) {
      countQuery += ` AND customer_name ILIKE $${countParamIndex}`
      countParams.push(`%${customerName}%`)
      countParamIndex++
    }

    const countResult = await query(countQuery, countParams)

    res.status(200).json({
      success: true,
      orders: ordersWithItems,
      total: parseInt(countResult.rows[0]?.total || '0'),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    })
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    res.status(500).json({
      message: 'Error fetching orders',
      error: error.message,
    })
  }
}

