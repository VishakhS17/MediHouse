import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

interface OutstandingBill {
  id: number
  invoice_number: string
  customer_name: string
  bill_date: string
  ref?: string
  total_amount: number
  received_amount: number
  pending_balance: number
  as_of_date: string
  credit_days: number
  created_at: string
  updated_at: string
}

export default function OutstandingBills() {
  const { admin } = useAdminAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [refFilter, setRefFilter] = useState('PART OK') // Default to 'PART OK'
  const [dateSort, setDateSort] = useState<string>('asc') // Default to 'asc' (Oldest First)
  const [refValues, setRefValues] = useState<string[]>([])
  const [bills, setBills] = useState<OutstandingBill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState({ totalRecords: 0, totalPendingBalance: '0.00' })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const itemsPerPage = 50
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const refFilterTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadBills = async (search: string = '', ref: string = '', page: number = 1, resetPage: boolean = false, sort: string = 'desc') => {
    setLoading(true)
    setError('')

    try {
      const offset = (page - 1) * itemsPerPage
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
      })
      
      if (search.trim()) {
        params.append('customerNumber', search.trim())
      }
      
      if (ref && ref.trim()) {
        params.append('ref', ref.trim())
      }
      
      if (sort && sort !== 'none') {
        params.append('sortBy', 'bill_date')
        params.append('sortOrder', sort)
      }

      const response = await fetch(`/api/admin/outstanding-bills?${params.toString()}`, {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to load outstanding bills')
      }

      const data = await response.json()
      setBills(data.data || [])
      setSummary(data.summary || { totalRecords: 0, totalPendingBalance: '0.00' })
      setTotalRecords(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
      
      if (resetPage) {
        setCurrentPage(1)
      }
    } catch (err: any) {
      console.error('Error loading bills:', err)
      setError(err.message || 'An error occurred while loading outstanding bills')
    } finally {
      setLoading(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    if (!admin) return

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Only search if there's a term or if clearing
    if (searchTerm.trim() || searchTerm === '') {
      searchTimeoutRef.current = setTimeout(() => {
        loadBills(searchTerm, refFilter, 1, true, dateSort)
      }, 500) // 500ms debounce
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, admin])

  // REF filter effect - no debounce needed for dropdown
  useEffect(() => {
    if (!admin) return

    // Clear previous timeout
    if (refFilterTimeoutRef.current) {
      clearTimeout(refFilterTimeoutRef.current)
    }

    // Apply REF filter immediately (dropdown doesn't need debounce)
    loadBills(searchTerm, refFilter, 1, true, dateSort)

    return () => {
      if (refFilterTimeoutRef.current) {
        clearTimeout(refFilterTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refFilter, admin, dateSort])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Clear timeout and search immediately
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    if (refFilterTimeoutRef.current) {
      clearTimeout(refFilterTimeoutRef.current)
    }
    loadBills(searchTerm, refFilter, 1, true, dateSort)
  }

  const handleClear = () => {
    setSearchTerm('')
    setRefFilter('PART OK') // Reset to default 'PART OK'
    setDateSort('asc') // Reset to default 'asc' (Oldest First)
    setCurrentPage(1)
    setBills([])
    setSummary({ totalRecords: 0, totalPendingBalance: '0.00' })
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    loadBills(searchTerm, refFilter, newPage, false, dateSort)
  }
  
  const handleDateSortChange = (newSort: string) => {
    setDateSort(newSort)
    setCurrentPage(1)
    loadBills(searchTerm, refFilter, 1, true, newSort)
  }

  // Load distinct REF values
  const loadRefValues = async () => {
    try {
      const response = await fetch('/api/admin/outstanding-bills?refValues=true', {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })
      if (response.ok) {
        const data = await response.json()
        setRefValues(data.refValues || [])
      }
    } catch (err) {
      console.error('Error loading REF values:', err)
    }
  }

  // Load all records on initial mount with default filters
  useEffect(() => {
    if (admin) {
      loadBills('', refFilter, 1, false, dateSort)
      loadRefValues()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin])

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num)
  }

  return (
    <AdminProtectedRoute>
      <Head>
        <title>Outstanding Bills - medi-house Admin</title>
      </Head>
      <AdminLayout>
        <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Outstanding Bills (DRS)</h1>
              <a
                href="/admin/upload-drs"
                className="bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-md hover:bg-blue-700 transition-colors min-h-[44px] touch-manipulation text-sm sm:text-base whitespace-nowrap w-full sm:w-auto text-center"
              >
                Upload DRS File
              </a>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Customer, Name, or Invoice..."
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 sm:flex-none bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors min-h-[44px] touch-manipulation text-sm sm:text-base"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="bg-gray-500 text-white px-4 sm:px-6 py-2.5 sm:py-2 rounded-md hover:bg-gray-600 transition-colors min-h-[44px] touch-manipulation text-sm sm:text-base"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {!searchTerm && (
                <p className="mt-2 text-xs sm:text-sm text-gray-500">
                  Enter a search term above to view outstanding bills. Search by customer number, customer name, or invoice number.
                </p>
              )}
            </form>

            {/* Summary */}
            {summary.totalRecords > 0 && (
              <div className="mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-blue-700">Total Records</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-900">{summary.totalRecords}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-blue-700">Total Pending Balance</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-900">
                      {formatCurrency(summary.totalPendingBalance)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Bills Table */}
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading outstanding bills...</p>
              </div>
            ) : bills.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {searchTerm ? 'No outstanding bills found for your search.' : 'No outstanding bills found.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-1">
                          <span>Date of Bill</span>
                          <select
                            value={dateSort}
                            onChange={(e) => handleDateSortChange(e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white min-w-[100px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
                          </select>
                        </div>
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Invoice No
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col gap-1">
                          <span>REF</span>
                          <select
                            value={refFilter}
                            onChange={(e) => {
                              setRefFilter(e.target.value)
                              setCurrentPage(1)
                            }}
                            className="px-1.5 sm:px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white min-w-[90px] sm:min-w-[100px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">All REF</option>
                            {refValues.length > 0 ? (
                              refValues.map((ref) => (
                                <option key={ref} value={ref}>
                                  {ref}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>Loading...</option>
                            )}
                          </select>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Received
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending Balance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        As Of Date
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credit Days
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {formatDate(bill.bill_date)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          {bill.invoice_number}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                          <div className="max-w-[120px] sm:max-w-none truncate sm:whitespace-normal" title={bill.customer_name}>
                            {bill.customer_name}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {bill.ref || '-'}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-right text-gray-900">
                          {formatCurrency(bill.total_amount)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-right font-semibold text-green-600">
                          {formatCurrency(bill.received_amount)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-right font-bold text-red-600">
                          {formatCurrency(bill.pending_balance)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {formatDate(bill.as_of_date)}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-center text-gray-900">
                          {bill.credit_days !== null ? `${bill.credit_days} days` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && bills.length > 0 && totalRecords > itemsPerPage && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} results
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                  >
                    Previous
                  </button>
                  <span className="px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm text-gray-700 self-center">
                    Page {currentPage} of {Math.ceil(totalRecords / itemsPerPage)}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasMore}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

