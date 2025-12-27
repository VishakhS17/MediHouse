import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

export default function InvoiceCollection() {
  const { admin, hasPermission } = useAdminAuth()
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [orderId, setOrderId] = useState('')
  const [collectorName, setCollectorName] = useState(admin?.name || '')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [collections, setCollections] = useState<any[]>([])
  const [filteredCollections, setFilteredCollections] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (admin?.name) {
      setCollectorName(admin.name)
    }
  }, [admin])

  useEffect(() => {
    if (showHistory && admin) {
      loadCollections()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory, dateFilter])

  // Fuzzy search function - matches words within the text
  const fuzzyMatch = (text: string, pattern: string): boolean => {
    const normalizedText = text.toLowerCase().trim()
    const normalizedPattern = pattern.toLowerCase().trim()
    
    if (!normalizedPattern) return true
    
    // Exact substring match (case-insensitive)
    if (normalizedText.includes(normalizedPattern)) return true
    
    // Simple fuzzy matching using character similarity
    // Count matching characters in order
    let textIndex = 0
    let matchCount = 0
    
    for (let i = 0; i < normalizedPattern.length; i++) {
      const char = normalizedPattern[i]
      const foundIndex = normalizedText.indexOf(char, textIndex)
      if (foundIndex !== -1) {
        matchCount++
        textIndex = foundIndex + 1
      }
    }
    
    // If at least 70% of pattern characters match in order, consider it a match
    const matchRatio = matchCount / normalizedPattern.length
    return matchRatio >= 0.7
  }

  useEffect(() => {
    // Filter collections based on search term and date filter
    let filtered = collections

    // Filter by search term (invoice number or collector name with fuzzy matching)
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter((collection) => {
        // Check invoice number (exact substring match)
        const invoiceMatch = collection.invoice_number?.toLowerCase().includes(searchLower)
        
        // Check collector name with fuzzy matching
        const collectorName = collection.collector_name || ''
        const collectorMatch = fuzzyMatch(collectorName, searchTerm)
        
        return invoiceMatch || collectorMatch
      })
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter((collection) => {
        if (!collection.collection_date) return false
        const collectionDate = new Date(collection.collection_date).toISOString().split('T')[0]
        return collectionDate === dateFilter
      })
    }

    setFilteredCollections(filtered)
  }, [collections, searchTerm, dateFilter])

  const loadCollections = async () => {
    setLoading(true)
    try {
      // Build query string with date filter if selected
      let queryString = 'limit=10000' // Get all records for filtering
      if (dateFilter) {
        queryString += `&startDate=${dateFilter}&endDate=${dateFilter}`
      }
      
      const response = await fetch(`/api/admin/invoice-collection?${queryString}`, {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })
      if (response.ok) {
        const data = await response.json()
        setCollections(data.data || [])
      }
    } catch (err) {
      console.error('Error loading collections:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = async () => {
    setDownloading(true)
    try {
      // Build query string with date filter and search term if selected
      let queryString = ''
      if (dateFilter) {
        queryString += `startDate=${dateFilter}&endDate=${dateFilter}`
      }
      if (searchTerm.trim()) {
        queryString += queryString ? `&searchTerm=${encodeURIComponent(searchTerm.trim())}` : `searchTerm=${encodeURIComponent(searchTerm.trim())}`
      }
      
      const response = await fetch(`/api/admin/invoice-collection-export?${queryString}`, {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to download report'}`)
        setDownloading(false)
        return
      }

      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'Invoice_Collections.xlsx'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error: any) {
      console.error('Download error:', error)
      alert('Error downloading report. Please try again.')
    } finally {
      setDownloading(false)
    }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!invoiceNumber.trim() || !collectorName.trim()) {
      setError('Invoice number and collector name are required')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/invoice-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-data': JSON.stringify(admin),
        },
        body: JSON.stringify({
          invoiceNumber: invoiceNumber.trim(),
          orderId: orderId ? parseInt(orderId) : null,
          collectorName: collectorName.trim(),
          notes: notes.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Invoice collection recorded successfully!')
        setInvoiceNumber('')
        setOrderId('')
        setNotes('')
        if (showHistory) {
          loadCollections()
        }
      } else {
        setError(data.message || 'Failed to record invoice collection')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (!hasPermission('collect_invoices')) {
    return (
      <AdminProtectedRoute>
        <Head>
          <title>Access Denied - Admin | medi-house</title>
        </Head>
        <AdminLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">
              You don't have permission to access invoice collection. Please contact your administrator.
            </p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  return (
    <AdminProtectedRoute>
      <Head>
        <title>Invoice Collection - Admin | medi-house</title>
        <meta name="description" content="Record invoice collections from warehouse" />
      </Head>
      <AdminLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoice Collection</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Record when medicines are collected from warehouse using invoice numbers
            </p>
          </div>

          {/* Summary Cards */}
          {!loading && showHistory && collections.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Total Records */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{filteredCollections.length}</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collection Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Record New Collection</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="invoiceNumber" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="invoiceNumber"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                    placeholder="Enter invoice number"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="orderId" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                    Order ID (Optional)
                  </label>
                  <input
                    type="number"
                    id="orderId"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                    placeholder="Enter order ID if available"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="collectorName" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                  Collector Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="collectorName"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                  placeholder="Enter collector name"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                  placeholder="Any additional notes..."
                  disabled={submitting}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[48px] touch-manipulation"
              >
                {submitting ? 'Recording...' : 'Record Collection'}
              </button>
            </form>
          </div>

          {/* Collection History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Collection History</h2>
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setShowHistory(!showHistory)
                    if (!showHistory) {
                      loadCollections()
                    }
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-ocean-royal hover:bg-ocean-royal/10 rounded-lg transition-colors min-h-[44px] touch-manipulation flex-1 sm:flex-none"
                >
                  {showHistory ? 'Hide History' : 'Show History'}
                </button>
                {showHistory && collections.length > 0 && (
                  <>
                    {/* Search Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search invoice number or collector name..."
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent min-h-[44px] touch-manipulation w-full sm:w-auto min-w-[200px]"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="px-2 py-2 text-sm text-gray-600 hover:text-gray-800 min-h-[44px] touch-manipulation"
                          title="Clear search"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {/* Date Filter */}
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        placeholder="Filter by date"
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent min-h-[44px] touch-manipulation w-full sm:w-auto"
                      />
                      {dateFilter && (
                        <button
                          onClick={() => {
                            const today = new Date()
                            const year = today.getFullYear()
                            const month = String(today.getMonth() + 1).padStart(2, '0')
                            const day = String(today.getDate()).padStart(2, '0')
                            const todayStr = `${year}-${month}-${day}`
                            if (dateFilter !== todayStr) {
                              setDateFilter(todayStr)
                              loadCollections()
                            }
                          }}
                          className="px-2 py-2 text-sm text-gray-600 hover:text-gray-800 min-h-[44px] touch-manipulation"
                          title="Reset to today"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleDownloadExcel}
                      disabled={downloading}
                      className="px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation flex-1 sm:flex-none"
                    >
                    {downloading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Downloading...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Download Excel
                      </span>
                    )}
                  </button>
                  </>
                )}
              </div>
            </div>

            {showHistory && (
              <div>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-royal mx-auto"></div>
                  </div>
                ) : filteredCollections.length === 0 ? (
                  <p className="text-sm sm:text-base text-gray-500 text-center py-8">
                    {searchTerm || dateFilter ? 'No collections found matching the filters' : 'No collections recorded yet'}
                  </p>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0 table-wrapper">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice #
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                            Collector
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                            Order ID
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCollections.map((collection) => (
                          <tr key={collection.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">{collection.invoice_number}</div>
                              <div className="text-xs text-gray-500 sm:hidden mt-1">{collection.collector_name}</div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                              {collection.collector_name}
                            </td>
                            <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                              {collection.order_id || '-'}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                              {new Date(collection.collection_date).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                              })}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                              {collection.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

