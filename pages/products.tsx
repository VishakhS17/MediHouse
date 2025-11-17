import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { generatePageMeta } from '@/lib/siteMeta'
import { useCart } from '@/lib/cart'

interface Product {
  id: string
  name: string
  manufacturer: string
  stock_quantity?: number
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
  const [hideOutOfStock, setHideOutOfStock] = useState(false)
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
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

  // Filter products based on search, brand, and stock availability
  const getFilteredProducts = () => {
    if (!productsData) return {}

    let filtered: Record<string, Product[]> = {}

    Object.entries(productsData.productsByBrand).forEach(([brand, products]) => {
      if (selectedBrand !== 'all' && brand !== selectedBrand) return

      let filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.toLowerCase().includes(searchTerm.toLowerCase())
      )

      // Filter out of stock products if hideOutOfStock is enabled
      if (hideOutOfStock) {
        filteredProducts = filteredProducts.filter(product => 
          (product.stock_quantity || 0) > 0
        )
      }

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
            <div className="mb-6 sm:mb-8 text-center animate-fade-in-up px-2">
              <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-ocean-cyan/20 via-ocean-aqua/20 to-ocean-sky/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-ocean-royal border border-ocean-cyan/30">
                Our Inventory
              </span>
              <h1 className="mb-4 sm:mb-6 font-display font-bold text-gray-900 text-2xl sm:text-4xl md:text-5xl">
                Product <span className="bg-gradient-to-r from-ocean-cyan via-ocean-teal to-ocean-royal bg-clip-text text-transparent">Catalog</span>
              </h1>
              <p className="mx-auto max-w-3xl text-sm sm:text-lg leading-relaxed text-gray-600 px-2">
                Browse our complete inventory of pharmaceutical products from trusted manufacturers
              </p>
            </div>

            {/* Search and Filter */}
            <div className="mb-8 space-y-4">
              <div className="md:flex md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search products or brands..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-ocean-cyan focus:outline-none focus:ring-2 focus:ring-ocean-cyan/20"
                  />
                </div>
                <div className="w-full md:w-64">
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-ocean-cyan focus:outline-none focus:ring-2 focus:ring-ocean-cyan/20"
                  >
                    <option value="all">All Brands</option>
                    {productsData?.brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Hide Out of Stock Toggle */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideOutOfStock}
                    onChange={(e) => setHideOutOfStock(e.target.checked)}
                    className="w-5 h-5 text-ocean-cyan border-gray-300 rounded focus:ring-ocean-cyan focus:ring-2 cursor-pointer"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Hide out of stock products
                  </span>
                </label>
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
                          className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors touch-manipulation"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-ocean-royal truncate">{brand}</h2>
                            <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                              {products.length} {products.length === 1 ? 'product' : 'products'}
                            </span>
                          </div>
                          <svg
                            className={`w-5 h-5 text-ocean-cyan transition-transform flex-shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`}
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
                          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {products.map((product) => {
                                const cartItem = getCartItem(product.id)
                                const quantity = cartItem?.quantity || 0
                                const inputValue = inputValues[product.id] !== undefined ? inputValues[product.id] : quantity.toString()

                                return (
                                  <div
                                    key={product.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                  >
                                    <h3 className="font-semibold text-gray-900 mb-2 text-base sm:text-lg break-words">{product.name}</h3>
                                    <p className="text-xs sm:text-sm text-gray-500 mb-2">{product.manufacturer}</p>
                                    {/* Stock Count */}
                                    <div className="mb-4">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        (product.stock_quantity || 0) === 0 
                                          ? 'bg-red-100 text-red-800' 
                                          : (product.stock_quantity || 0) < 10
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        Stock: {product.stock_quantity || 0}
                                      </span>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                                      <div className="flex items-center justify-center sm:justify-start space-x-2">
                                        <button
                                          onClick={() => {
                                            if (quantity > 0) {
                                              const newQuantity = quantity - 1
                                              updateQuantity(product.id, newQuantity)
                                              setInputValues(prev => ({ ...prev, [product.id]: newQuantity.toString() }))
                                            }
                                          }}
                                          disabled={quantity === 0}
                                          className="px-4 py-2 min-w-[44px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-lg font-semibold"
                                        >
                                          -
                                        </button>
                                        <input
                                          type="number"
                                          min="0"
                                          max={product.stock_quantity || 0}
                                          value={inputValue}
                                          onChange={(e) => {
                                            const value = e.target.value
                                            // Store the raw input value to allow free typing
                                            setInputValues(prev => ({ ...prev, [product.id]: value }))
                                            
                                            // Only update cart if value is a valid number
                                            if (value !== '' && value !== '-') {
                                              const newQuantity = parseInt(value, 10)
                                              const maxStock = product.stock_quantity || 0
                                              if (!isNaN(newQuantity) && newQuantity >= 0) {
                                                const clampedQuantity = Math.min(newQuantity, maxStock)
                                                updateQuantity(product.id, clampedQuantity)
                                                if (clampedQuantity !== newQuantity) {
                                                  setInputValues(prev => ({ ...prev, [product.id]: clampedQuantity.toString() }))
                                                }
                                              }
                                            }
                                          }}
                                          onBlur={(e) => {
                                            // When input loses focus, ensure we have a valid quantity
                                            const value = e.target.value
                                            const numValue = parseInt(value, 10)
                                            const maxStock = product.stock_quantity || 0
                                            
                                            if (value === '' || isNaN(numValue) || numValue < 0) {
                                              updateQuantity(product.id, 0)
                                              setInputValues(prev => ({ ...prev, [product.id]: '0' }))
                                            } else {
                                              const clampedQuantity = Math.min(numValue, maxStock)
                                              updateQuantity(product.id, clampedQuantity)
                                              setInputValues(prev => ({ ...prev, [product.id]: clampedQuantity.toString() }))
                                              if (clampedQuantity < numValue) {
                                                alert(`Only ${maxStock} units available in stock.`)
                                              }
                                            }
                                          }}
                                          onFocus={(e) => {
                                            // When input is focused, sync with current quantity
                                            setInputValues(prev => ({ ...prev, [product.id]: quantity.toString() }))
                                          }}
                                          className="w-20 px-2 py-2 border border-gray-300 rounded text-center text-base"
                                        />
                                        <button
                                          onClick={() => {
                                            const maxStock = product.stock_quantity || 0
                                            if (maxStock === 0) {
                                              alert('This product is out of stock.')
                                              return
                                            }
                                            const newQuantity = Math.min(quantity + 1, maxStock)
                                            if (newQuantity > quantity) {
                                              handleAddToCart(product, 1)
                                              setInputValues(prev => ({ ...prev, [product.id]: newQuantity.toString() }))
                                            } else {
                                              alert(`Only ${maxStock} units available in stock.`)
                                            }
                                          }}
                                          disabled={(product.stock_quantity || 0) === 0 || quantity >= (product.stock_quantity || 0)}
                                          className="px-4 py-2 min-w-[44px] border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-lg font-semibold"
                                        >
                                          +
                                        </button>
                                      </div>
                                      {quantity > 0 ? (
                                        <Link
                                          href="/cart"
                                          className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base touch-manipulation min-h-[44px] flex items-center justify-center"
                                        >
                                          Go to Cart
                                        </Link>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            // Get the value from input field, or use current quantity + 1 if input is empty/invalid
                                            const inputVal = inputValues[product.id]
                                            let targetQuantity: number
                                            
                                            if (inputVal !== undefined && inputVal !== '') {
                                              const parsed = parseInt(inputVal, 10)
                                              if (!isNaN(parsed) && parsed >= 0) {
                                                targetQuantity = parsed
                                              } else {
                                                targetQuantity = 1
                                              }
                                            } else {
                                              // If no custom input, add 1
                                              targetQuantity = 1
                                            }
                                            
                                            // Check stock availability
                                            const availableStock = product.stock_quantity || 0
                                            if (availableStock === 0) {
                                              alert('This product is currently out of stock.')
                                              return
                                            }
                                            if (targetQuantity > availableStock) {
                                              alert(`Only ${availableStock} units available in stock.`)
                                              targetQuantity = availableStock
                                            }
                                            
                                            handleAddToCart(product, targetQuantity)
                                            setInputValues(prev => ({ ...prev, [product.id]: targetQuantity.toString() }))
                                          }}
                                          disabled={(product.stock_quantity || 0) === 0}
                                          className="flex-1 bg-ocean-cyan text-white px-4 py-3 rounded-lg hover:bg-ocean-teal transition-colors font-medium text-sm sm:text-base touch-manipulation min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Add to Cart
                                        </button>
                                      )}
                                    </div>
                                    {quantity > 0 && (
                                      <p className="text-xs sm:text-sm text-ocean-cyan mt-2 text-center sm:text-left">In cart: {quantity}</p>
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

