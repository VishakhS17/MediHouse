import { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not set')
      return res.status(500).json({
        error: 'Database configuration error',
        message: 'DATABASE_URL environment variable is not set. Please configure it in Vercel environment variables.',
      })
    }

    // Get all active products
    const productsResult = await query(
      `SELECT id, name, manufacturer 
       FROM products 
       WHERE is_active = true 
       ORDER BY manufacturer, name`
    )

    // Group products by manufacturer
    const productsByBrand: Record<string, any[]> = {}
    const brands = new Set<string>()
    const allProducts: any[] = []

    productsResult.rows.forEach((product) => {
      const manufacturer = product.manufacturer
      brands.add(manufacturer)

      // Generate ID similar to the JSON format: manufacturer-productname (lowercase, replace special chars with -)
      const productId = `${manufacturer}-${product.name}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      const productData = {
        id: productId,
        name: product.name,
        manufacturer: manufacturer,
      }

      allProducts.push(productData)

      if (!productsByBrand[manufacturer]) {
        productsByBrand[manufacturer] = []
      }
      productsByBrand[manufacturer].push(productData)
    })

    // Sort brands alphabetically
    const sortedBrands = Array.from(brands).sort()

    // Get total counts
    const totalProducts = allProducts.length
    const totalBrands = sortedBrands.length

    // Return data in the same format as the JSON file for compatibility
    const response = {
      generatedAt: new Date().toISOString(),
      totalProducts: totalProducts,
      totalBrands: totalBrands,
      productsByBrand: productsByBrand,
      allProducts: allProducts,
      brands: sortedBrands,
    }

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    res.status(200).json(response)
  } catch (error: any) {
    console.error('Error fetching products:', error)
    
    // Provide more specific error messages
    let errorMessage = error.message || 'Unknown error'
    let statusCode = 500
    
    if (error.message?.includes('DATABASE_URL')) {
      errorMessage = 'Database connection string is not configured. Please set DATABASE_URL in environment variables.'
      statusCode = 500
    } else if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      errorMessage = 'Products table does not exist. Please run the database migration first.'
      statusCode = 500
    } else if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Cannot connect to database. Please check your DATABASE_URL and ensure the database is accessible.'
      statusCode = 503
    }
    
    res.status(statusCode).json({
      error: 'Failed to fetch products',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}

