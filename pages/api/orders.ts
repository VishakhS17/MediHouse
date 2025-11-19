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

    // OPTIMIZATION: Batch fetch all products at once instead of N queries
    const productNames = [...new Set(orderData.items.map(item => item.name.toLowerCase()))]
    
    // Fetch all matching products in a single query - much faster than N queries
    const allProductsResult = await query(
      `SELECT id, name, manufacturer, stock_quantity 
       FROM products 
       WHERE LOWER(name) = ANY($1::text[])
       ORDER BY name, manufacturer`,
      [productNames]
    )

    // Create lookup maps for fast access
    const productMap = new Map<string, any>()
    allProductsResult.rows.forEach(product => {
      const key = `${product.name.toLowerCase()}|${product.manufacturer.toLowerCase()}`
      if (!productMap.has(key)) {
        productMap.set(key, product)
      }
    })

    // Also create a name-only map for fallback matching
    const productNameMap = new Map<string, any>()
    allProductsResult.rows.forEach(product => {
      const key = product.name.toLowerCase()
      if (!productNameMap.has(key)) {
        productNameMap.set(key, product)
      }
    })

    // Validate and prepare batch updates
    const results = []
    const errors: string[] = []
    const orderItems: Array<{ productId: number; productName: string; productManufacturer: string; quantity: number }> = []
    const stockUpdates: Array<{ productId: number; newStock: number }> = []
    const orderItemInserts: Array<{ orderId: number; productId: number; productName: string; productManufacturer: string; quantity: number }> = []

    // Validate all items first
    for (const item of orderData.items) {
      const key = `${item.name.toLowerCase()}|${item.manufacturer.toLowerCase()}`
      let product = productMap.get(key)

      // Fallback: try name-only match
      if (!product) {
        product = productNameMap.get(item.name.toLowerCase())
      }

      if (!product) {
        errors.push(`Product not found: ${item.name} (${item.manufacturer})`)
        continue
      }

      const currentStock = product.stock_quantity || 0
      if (currentStock < item.quantity) {
        errors.push(`The quantity you want (${item.quantity}) for ${item.name} is not available. Only ${currentStock} unit${currentStock === 1 ? '' : 's'} available in stock.`)
        continue
      }

      const newStock = Math.max(0, currentStock - item.quantity)
      stockUpdates.push({ productId: product.id, newStock })
      orderItemInserts.push({
        orderId,
        productId: product.id,
        productName: product.name,
        productManufacturer: product.manufacturer,
        quantity: item.quantity,
      })
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

    // OPTIMIZATION: Batch update stock in a single query using VALUES
    if (stockUpdates.length > 0) {
      const stockUpdateValues = stockUpdates.map((update, idx) => {
        const baseIdx = idx * 2
        return `($${baseIdx + 1}::int, $${baseIdx + 2}::int)`
      }).join(', ')
      
      const stockUpdateParams = stockUpdates.flatMap(update => [update.productId, update.newStock])
      
      await query(
        `UPDATE products p
         SET stock_quantity = v.stock, updated_at = NOW()
         FROM (VALUES ${stockUpdateValues}) AS v(id, stock)
         WHERE p.id = v.id`,
        stockUpdateParams
      )
    }

    // OPTIMIZATION: Batch insert order items in a single query
    if (orderItemInserts.length > 0) {
      const insertValues = orderItemInserts.map((item, idx) => {
        const baseIdx = idx * 5
        return `($${baseIdx + 1}::int, $${baseIdx + 2}::int, $${baseIdx + 3}::text, $${baseIdx + 4}::text, $${baseIdx + 5}::int)`
      }).join(', ')
      
      const insertParams = orderItemInserts.flatMap(item => [
        item.orderId,
        item.productId,
        item.productName,
        item.productManufacturer,
        item.quantity,
      ])
      
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_manufacturer, quantity)
         VALUES ${insertValues}`,
        insertParams
      )
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

