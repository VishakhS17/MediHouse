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
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error.message,
    })
  }
}

