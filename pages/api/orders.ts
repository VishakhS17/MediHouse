import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

interface OrderItem {
  id: string
  name: string
  manufacturer: string
  quantity: number
}

interface OrderRequest {
  customerName: string
  customerPhone: string
  customerAddress: string
  customerEmail?: string
  items: OrderItem[]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const orderData: OrderRequest = req.body

    // Validate order data
    if (!orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' })
    }

    if (!orderData.customerName || !orderData.customerPhone || !orderData.customerAddress) {
      return res.status(400).json({ message: 'Customer details are required' })
    }

    // Calculate total items
    const totalItems = orderData.items.reduce((sum, item) => sum + item.quantity, 0)

    // Create order record
    const orderResult = await query(
      `INSERT INTO orders (customer_name, customer_phone, customer_address, customer_email, total_items)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        orderData.customerName,
        orderData.customerPhone,
        orderData.customerAddress,
        orderData.customerEmail || null,
        totalItems,
      ]
    )

    const orderId = orderResult.rows[0].id

    // Process each item and update stock
    const results = []
    const errors: string[] = []
    const orderItems: Array<{ productId: number; productName: string; productManufacturer: string; quantity: number }> = []

    for (const item of orderData.items) {
      try {
        // Find product by name and manufacturer
        // The item.id format is "manufacturer-productname" but we'll match by actual name and manufacturer
        const productResult = await query(
          `SELECT id, name, manufacturer, stock_quantity 
           FROM products 
           WHERE LOWER(name) = LOWER($1) 
           AND LOWER(manufacturer) = LOWER($2)
           LIMIT 1`,
          [item.name, item.manufacturer]
        )

        if (productResult.rows.length === 0) {
          // Try matching by name only (case-insensitive)
          const altResult = await query(
            `SELECT id, name, manufacturer, stock_quantity 
             FROM products 
             WHERE LOWER(name) = LOWER($1)
             ORDER BY CASE WHEN LOWER(manufacturer) = LOWER($2) THEN 0 ELSE 1 END
             LIMIT 1`,
            [item.name, item.manufacturer]
          )

          if (altResult.rows.length === 0) {
            errors.push(`Product not found: ${item.name} (${item.manufacturer})`)
            continue
          }

          const product = altResult.rows[0]
          const currentStock = product.stock_quantity || 0

          if (currentStock < item.quantity) {
            errors.push(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`)
            continue
          }

          // Update stock
          const newStock = Math.max(0, currentStock - item.quantity)
          await query(
            `UPDATE products 
             SET stock_quantity = $1, updated_at = NOW() 
             WHERE id = $2`,
            [newStock, product.id]
          )

          // Save order item
          await query(
            `INSERT INTO order_items (order_id, product_id, product_name, product_manufacturer, quantity)
             VALUES ($1, $2, $3, $4, $5)`,
            [orderId, product.id, product.name, product.manufacturer, item.quantity]
          )

          orderItems.push({
            productId: product.id,
            productName: product.name,
            productManufacturer: product.manufacturer,
            quantity: item.quantity,
          })

          results.push({
            product: item.name,
            quantity: item.quantity,
            status: 'success',
          })
        } else {
          const product = productResult.rows[0]
          const currentStock = product.stock_quantity || 0

          if (currentStock < item.quantity) {
            errors.push(`Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${item.quantity}`)
            continue
          }

          // Update stock
          const newStock = Math.max(0, currentStock - item.quantity)
          await query(
            `UPDATE products 
             SET stock_quantity = $1, updated_at = NOW() 
             WHERE id = $2`,
            [newStock, product.id]
          )

          // Save order item
          await query(
            `INSERT INTO order_items (order_id, product_id, product_name, product_manufacturer, quantity)
             VALUES ($1, $2, $3, $4, $5)`,
            [orderId, product.id, product.name, product.manufacturer, item.quantity]
          )

          orderItems.push({
            productId: product.id,
            productName: product.name,
            productManufacturer: product.manufacturer,
            quantity: item.quantity,
          })

          results.push({
            product: item.name,
            quantity: item.quantity,
            status: 'success',
          })
        }
      } catch (error: any) {
        errors.push(`Error processing ${item.name}: ${error.message}`)
      }
    }

    // No caching - ensure real-time responses
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    
    res.status(200).json({
      success: true,
      message: 'Order processed and stock updated',
      orderId,
      processed: results.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Order processing error:', error)
    res.status(500).json({
      message: 'Error processing order',
      error: error.message,
    })
  }
}

