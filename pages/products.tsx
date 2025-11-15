import { useState, useEffect } from 'react'
import Head from 'next/head'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { generatePageMeta } from '@/lib/siteMeta'
import { useCart } from '@/lib/cart'

interface Product {
  id: string
  name: string
  manufacturer: string
}

interface ProductsData {
  generatedAt: string
  totalProducts: number
  totalBrands: number
  productsByBrand: Record<string, Product[]>
  allProducts: Product[]
  brands: string[]
}

export default function Products() {
  const [productsData, setProductsData] = useState<ProductsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())
  const { addToCart, getCartItem, updateQuantity } = useCart()

  useEffect(() => {
    // Load products from API (which fetches from database)
    fetch('/api/products')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch products: ${res.statusText}`)
        }
        return res.json()
      })
      .then(data => {
        setProductsData(data)
        setLoading(false)
        // Expand first 5 brands by default
        const firstBrands = data.brands.slice(0, 5)
        setExpandedBrands(new Set(firstBrands))
      })
      .catch(err => {
        console.error('Error loading products:', err)
        setLoading(false)
        // Show more detailed error message
        const errorMsg = err.message || 'Unknown error occurred'
        alert(`Failed to load products: ${errorMsg}\n\nPlease check:\n1. Database connection is configured\n2. Products table exists\n3. Network connection is working`)
      })
  }, [])

  const toggleBrand = (brand: string) => {
    setExpandedBrands(prev => {
      const next = new Set(prev)
      if (next.has(brand)) {
        next.delete(brand)
      } else {
        next.add(brand)
      }
      return next
    })
  }

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    addToCart(product, quantity)
  }

  // Filter products based on search and brand
  const getFilteredProducts = () => {
    if (!productsData) return {}

    let filtered: Record<string, Product[]> = {}

    Object.entries(productsData.productsByBrand).forEach(([brand, products]) => {
      if (selectedBrand !== 'all' && brand !== selectedBrand) return

      const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.toLowerCase().includes(searchTerm.toLowerCase())
      )

      if (filteredProducts.length > 0) {
        filtered[brand] = filteredProducts
      }
    })

    return filtered
  }

  const filteredProducts = getFilteredProducts()
  const meta = generatePageMeta({
    title: 'Products',
    description: 'Browse our complete inventory of pharmaceutical products from trusted manufacturers.',
  })

  return (
    <>
      <SEO meta={meta} />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" role="main" className="pt-24">
        <section className="relative overflow-hidden py-12 px-4 bg-gradient-to-b from-white via-ocean-aqua/20 to-ocean-sky/10">
          <div className="container-custom relative z-10">
            <div className="mb-8 text-center animate-fade-in-up">
              <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-ocean-cyan/20 via-ocean-aqua/20 to-ocean-sky/20 px-4 py-2 text-sm font-semibold text-ocean-royal border border-ocean-cyan/30">
                Our Inventory
              </span>
              <h1 className="mb-6 font-display font-bold text-gray-900 text-4xl md:text-5xl">
                Product <span className="bg-gradient-to-r from-ocean-cyan via-ocean-teal to-ocean-royal bg-clip-text text-transparent">Catalog</span>
              </h1>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600">
                Browse our complete inventory of pharmaceutical products from trusted manufacturers
              </p>
            </div>

            {/* Search and Filter */}
            <div className="mb-8 space-y-4 md:flex md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search products or brands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-ocean-cyan focus:outline-none focus:ring-2 focus:ring-ocean-cyan/20"
                />
              </div>
              <div className="md:w-64">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-ocean-cyan focus:outline-none focus:ring-2 focus:ring-ocean-cyan/20"
                >
                  <option value="all">All Brands</option>
                  {productsData?.brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-ocean-cyan border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : !productsData ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No products found.</p>
                <p className="text-sm text-gray-500">Please check:</p>
                <ul className="text-sm text-gray-500 mt-2 list-disc list-inside">
                  <li>Database connection is configured (DATABASE_URL)</li>
                  <li>Products table exists (run migration)</li>
                  <li>Products have been imported to database</li>
                </ul>
              </div>
            ) : Object.keys(filteredProducts).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No products match your search criteria.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(filteredProducts)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([brand, products]) => {
                    const isExpanded = expandedBrands.has(brand)
                    const cartItem = products.length > 0 ? getCartItem(products[0].id) : null

                    return (
                      <div
                        key={brand}
                        className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleBrand(brand)}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-bold text-ocean-royal">{brand}</h2>
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                              {products.length} {products.length === 1 ? 'product' : 'products'}
                            </span>
                          </div>
                          <svg
                            className={`w-5 h-5 text-ocean-cyan transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isExpanded && (
                          <div className="px-6 py-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {products.map((product) => {
                                const cartItem = getCartItem(product.id)
                                const quantity = cartItem?.quantity || 0

                                return (
                                  <div
                                    key={product.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                  >
                                    <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{product.manufacturer}</p>
                                    
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => {
                                          if (quantity > 0) {
                                            updateQuantity(product.id, quantity - 1)
                                          }
                                        }}
                                        disabled={quantity === 0}
                                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        value={quantity}
                                        onChange={(e) => {
                                          const newQuantity = parseInt(e.target.value) || 0
                                          updateQuantity(product.id, newQuantity)
                                        }}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                      />
                                      <button
                                        onClick={() => handleAddToCart(product, 1)}
                                        className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                                      >
                                        +
                                      </button>
                                      <button
                                        onClick={() => handleAddToCart(product, 1)}
                                        className="flex-1 bg-ocean-cyan text-white px-4 py-2 rounded-lg hover:bg-ocean-teal transition-colors font-medium"
                                      >
                                        {quantity > 0 ? 'Update Cart' : 'Add to Cart'}
                                      </button>
                                    </div>
                                    {quantity > 0 && (
                                      <p className="text-sm text-ocean-cyan mt-2">In cart: {quantity}</p>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}

            {productsData && (
              <div className="mt-8 text-center text-sm text-gray-500">
                Total: {productsData.totalProducts} products from {productsData.totalBrands} brands
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

