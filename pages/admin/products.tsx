import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'

interface Product {
  id: number
  name: string
  manufacturer: string
  stock_quantity: number
  price: number | null
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'manufacturer'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetchProducts(true) // Initial load with loading spinner
    
    // Refresh when page becomes visible (user returns from other pages)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProducts(false) // Refresh silently when page becomes visible
      }
    }
    
    // Refresh when window gains focus (user switches back to tab)
    const handleFocus = () => {
      fetchProducts(false) // Refresh silently when window gains focus
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProducts = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      // Add cache-busting query parameter and no-store cache option
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/products?t=${timestamp}`, {
        cache: 'no-store', // Ensure we don't use cached responses
      })
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        console.error('Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const brands = Array.from(new Set(products.map(p => p.manufacturer))).sort()

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesBrand = selectedBrand === 'all' || product.manufacturer === selectedBrand
      return matchesSearch && matchesBrand
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'manufacturer':
          comparison = a.manufacturer.localeCompare(b.manufacturer)
          break
        case 'stock':
          comparison = (a.stock_quantity || 0) - (b.stock_quantity || 0)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const totalProducts = filteredProducts.length
  const lowStockProducts = filteredProducts.filter(p => (p.stock_quantity || 0) < 10).length
  const outOfStockProducts = filteredProducts.filter(p => (p.stock_quantity || 0) === 0).length

  return (
    <AdminProtectedRoute>
      <Head>
        <title>Products - Admin | medi-house</title>
        <meta name="description" content="Manage products and stock" />
      </Head>
      <AdminLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your product inventory and stock levels</p>
            </div>
            <button
              onClick={() => fetchProducts(true)}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2.5 sm:py-2 bg-ocean-cyan text-white rounded-lg hover:bg-ocean-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[44px] touch-manipulation w-full sm:w-auto"
              title="Refresh products data"
            >
              <svg
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{totalProducts}</p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-ocean-royal to-ocean-cyan flex items-center justify-center text-3xl shadow-lg">
                  💊
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">{lowStockProducts}</p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl shadow-lg">
                  ⚠️
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">{outOfStockProducts}</p>
                </div>
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-3xl shadow-lg">
                  🚫
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <input
                  type="text"
                  placeholder="Search products or brands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-ocean-royal focus:border-ocean-royal outline-none touch-manipulation"
                />
              </div>
              <div>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-ocean-royal focus:border-ocean-royal outline-none touch-manipulation"
                >
                  <option value="all">All Brands</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-')
                    setSortBy(by as 'name' | 'stock' | 'manufacturer')
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-ocean-royal focus:border-ocean-royal outline-none touch-manipulation"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="manufacturer-asc">Brand (A-Z)</option>
                  <option value="manufacturer-desc">Brand (Z-A)</option>
                  <option value="stock-asc">Stock (Low to High)</option>
                  <option value="stock-desc">Stock (High to Low)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-ocean-cyan border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-600">No products found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-3 sm:mx-0 table-wrapper">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Manufacturer
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Status
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Category
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                      const stock = product.stock_quantity || 0
                      const isLowStock = stock > 0 && stock < 10
                      const isOutOfStock = stock === 0

                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                            <div className="text-sm font-medium text-gray-900 break-words">{product.name}</div>
                            <div className="text-xs text-gray-500 sm:hidden mt-1">{product.manufacturer}</div>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                            <div className="text-sm text-gray-500">{product.manufacturer}</div>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                            <div className={`text-sm font-semibold ${
                              isOutOfStock ? 'text-red-600' : 
                              isLowStock ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {stock}
                            </div>
                            <div className="md:hidden mt-1">
                              {isOutOfStock ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                  Out of Stock
                                </span>
                              ) : isLowStock ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  In Stock
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 hidden md:table-cell">
                            {isOutOfStock ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                            <div className="text-sm text-gray-500">
                              {product.category || '-'}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

