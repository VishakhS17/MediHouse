import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const productsResult = await query(
      `SELECT id, name, manufacturer, stock_quantity, price, category, is_active, created_at, updated_at
       FROM products 
       ORDER BY manufacturer, name`
    )

    res.status(200).json({
      success: true,
      products: productsResult.rows,
    })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    res.status(500).json({
      message: 'Error fetching products',
      error: error.message,
    })
  }
}

