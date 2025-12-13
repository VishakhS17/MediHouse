import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

interface OrderItem {
  id: number
  product_id: number | null
  product_name: string
  product_manufacturer: string
  quantity: number
}

interface Order {
  id: number
  order_date: string
  customer_name: string
  customer_phone: string
  customer_address: string
  customer_email: string | null
  total_items: number
  created_at: string
  items: OrderItem[]
}

export default function AdminOrders() {
  const { admin } = useAdminAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    customerName: '',
    orderId: '',
  })
  const itemsPerPage = 20

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const offset = (currentPage - 1) * itemsPerPage
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      })

      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.customerName) params.append('customerName', filters.customerName)
      if (filters.orderId) params.append('orderId', filters.orderId)

      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to load orders')
      }

      const data = await response.json()
      setOrders(data.orders || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.message || 'Error loading orders')
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (admin) {
      loadOrders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, admin])

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
    setCurrentPage(1)
  }

  const handleApplyFilters = () => {
    setCurrentPage(1)
    loadOrders()
  }

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      customerName: '',
      orderId: '',
    })
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalPages = Math.ceil(total / itemsPerPage)

  return (
    <AdminProtectedRoute>
      <Head>
        <title>Orders - Admin | MediHouse</title>
        <meta name="description" content="View and manage orders" />
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 mt-1">View past orders and order details</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
                  Order ID
                </label>
                <input
                  type="text"
                  id="orderId"
                  value={filters.orderId}
                  onChange={(e) => handleFilterChange('orderId', e.target.value)}
                  placeholder="Enter order ID"
                  className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-ocean-royal focus:border-ocean-royal outline-none"
                />
              </div>
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name
                </label>
                <input
                  type="text"
                  id="customerName"
                  value={filters.customerName}
                  onChange={(e) => handleFilterChange('customerName', e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-ocean-royal focus:border-ocean-royal outline-none"
                />
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-ocean-royal focus:border-ocean-royal outline-none"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-ocean-royal focus:border-ocean-royal outline-none"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={handleApplyFilters}
                className="px-4 sm:px-6 py-2 bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white rounded-lg font-medium hover:shadow-lg transition-all min-h-[44px] touch-manipulation"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClearFilters}
                className="px-4 sm:px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors min-h-[44px] touch-manipulation"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-royal mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
              <p className="text-red-800">{error}</p>
              <button
                onClick={loadOrders}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[44px] touch-manipulation"
              >
                Retry
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No orders found</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase">
                          Order ID
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase">
                          Date
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase">
                          Customer
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase">
                          Phone
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase">
                          Items
                        </th>
                        <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium text-gray-900">
                            #{order.id}
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-600">
                            {formatDate(order.order_date)}
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-900">
                            {order.customer_name}
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-600">
                            {order.customer_phone}
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-600">
                            {order.total_items} item{order.total_items !== 1 ? 's' : ''}
                          </td>
                          <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm">
                            <details className="cursor-pointer">
                              <summary className="text-ocean-royal hover:text-ocean-cyan font-medium">
                                View Items
                              </summary>
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="space-y-2">
                                  {order.items.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex justify-between items-center text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0"
                                    >
                                      <div>
                                        <p className="font-medium text-gray-900">{item.product_name}</p>
                                        <p className="text-gray-600 text-xs">{item.product_manufacturer}</p>
                                      </div>
                                      <p className="text-gray-700 font-medium">Qty: {item.quantity}</p>
                                    </div>
                                  ))}
                                </div>
                                {order.customer_address && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Address:</span> {order.customer_address}
                                    </p>
                                    {order.customer_email && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        <span className="font-medium">Email:</span> {order.customer_email}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, total)} of {total} orders
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700 flex items-center">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

