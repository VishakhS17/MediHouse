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
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products')
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
        <title>Products - Admin | MediHouse</title>
        <meta name="description" content="Manage products and stock" />
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage your product inventory and stock levels</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Search products or brands..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-ocean-royal focus:border-ocean-royal outline-none"
                />
              </div>
              <div>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-ocean-royal focus:border-ocean-royal outline-none"
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-ocean-royal focus:border-ocean-royal outline-none"
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manufacturer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{product.manufacturer}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-semibold ${
                              isOutOfStock ? 'text-red-600' : 
                              isLowStock ? 'text-yellow-600' : 
                              'text-green-600'
                            }`}>
                              {stock}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
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
                          <td className="px-6 py-4 whitespace-nowrap">
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

