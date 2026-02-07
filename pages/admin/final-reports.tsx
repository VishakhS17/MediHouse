import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

export default function FinalReports() {
  const { admin, hasPermission } = useAdminAuth()
  const [reports, setReports] = useState<any[]>([])
  const [filteredReports, setFilteredReports] = useState<any[]>([])
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showEditedOnly, setShowEditedOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (admin) {
      loadReports()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, fromDate, toDate])

  useEffect(() => {
    // Filter reports based on date filter and search term
    let filtered = reports

    // Filter by date range (already filtered on backend, but keep for consistency)
    if (fromDate || toDate) {
      filtered = filtered.filter((report) => {
        if (!report.collection_date) return false
        const reportDate = new Date(report.collection_date).toISOString().split('T')[0]
        const fromMatch = !fromDate || reportDate >= fromDate
        const toMatch = !toDate || reportDate <= toDate
        return fromMatch && toMatch
      })
    }

    // Filter by search term (invoice number, collected by, checked by, supplied by, customer name)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter((report) => {
        const invoiceNumber = (report.invoice_number || '').toLowerCase()
        const collectedBy = (report.collector_name || '').toLowerCase()
        const checkedBy = (report.checker_name || '').toLowerCase()
        const suppliedBy = (report.supplied_by || '').toLowerCase()
        const customerName = (report.customer_name || '').toLowerCase()
        
        return (
          invoiceNumber.includes(searchLower) ||
          collectedBy.includes(searchLower) ||
          checkedBy.includes(searchLower) ||
          suppliedBy.includes(searchLower) ||
          customerName.includes(searchLower)
        )
      })
    }

    // Filter by edited records only
    if (showEditedOnly) {
      filtered = filtered.filter((report) => {
        // Check if record has been updated (updated_at exists and is different from created_at)
        const hasBeenUpdated = report.updated_at && 
          report.created_at && 
          new Date(report.updated_at).getTime() !== new Date(report.created_at).getTime()
        
        // Check if notes contain remarks
        const hasRemarks = report.notes && report.notes.includes('[Remarks:')
        
        return hasBeenUpdated || hasRemarks
      })
    }

    setFilteredReports(filtered)
  }, [reports, fromDate, toDate, searchTerm, showEditedOnly])

  const loadReports = async () => {
    if (!admin) {
      setError('Admin user not loaded')
      return
    }

    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (fromDate) {
        params.append('fromDate', fromDate)
      }
      if (toDate) {
        params.append('toDate', toDate)
      }
      const queryString = params.toString()
      const url = `/api/admin/final-reports${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url, {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (response.ok) {
        const data = await response.json()
        const reportsData = data.data || []
        setReports(reportsData)
        setFilteredReports(reportsData)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to load reports')
      }
    } catch (err: any) {
      console.error('Error loading reports:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadExcel = async () => {
    setDownloading(true)
    try {
      const params = new URLSearchParams()
      params.append('download', 'true')
      if (fromDate) {
        params.append('fromDate', fromDate)
      }
      if (toDate) {
        params.append('toDate', toDate)
      }
      const queryString = params.toString()

      const response = await fetch(`/api/admin/final-reports?${queryString}`, {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json()
          alert(`Error: ${error.message || 'Failed to download report'}`)
        } else {
          alert(`Error: Failed to download report - ${response.status} ${response.statusText}`)
        }
        setDownloading(false)
        return
      }

      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'Final_Reports.xlsx'
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Check if user has at least one relevant permission
  const hasAccess =
    hasPermission('collect_invoices') ||
    hasPermission('check_invoices') ||
    hasPermission('manage_supply')

  if (!hasAccess) {
    return (
      <AdminProtectedRoute>
        <Head>
          <title>Access Denied - Admin | medi-house</title>
        </Head>
        <AdminLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">
              You don't have permission to view final reports. Please contact your administrator.
            </p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  return (
    <AdminProtectedRoute>
      <Head>
        <title>Final Reports - Admin | medi-house</title>
        <meta name="description" content="View comprehensive final reports combining collection, checking, and supply data" />
      </Head>
      <AdminLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Final Reports</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Comprehensive view of all invoice collections, checking, and supply data.
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Filters and Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Reports</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Search Filter */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by invoice, collector, checker, supplier, or customer name..."
                      className="px-3 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent min-h-[44px] touch-manipulation w-full sm:w-64"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
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
                {/* Date Range Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 whitespace-nowrap">From:</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      placeholder="From date"
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent min-h-[44px] touch-manipulation w-full sm:w-auto"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 whitespace-nowrap">To:</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      placeholder="To date"
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent min-h-[44px] touch-manipulation w-full sm:w-auto"
                    />
                  </div>
                  {(fromDate || toDate) && (
                    <button
                      onClick={() => {
                        setFromDate('')
                        setToDate('')
                      }}
                      className="px-2 py-2 text-sm text-gray-600 hover:text-gray-800 min-h-[44px] touch-manipulation"
                      title="Clear date filters"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {/* Edited Filter */}
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white min-h-[44px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEditedOnly}
                      onChange={(e) => setShowEditedOnly(e.target.checked)}
                      className="w-4 h-4 text-ocean-royal border-gray-300 rounded focus:ring-ocean-royal"
                    />
                    <span className="text-sm text-gray-700 whitespace-nowrap">Edited Only</span>
                  </label>
                </div>
                <button
                  onClick={handleDownloadExcel}
                  disabled={downloading || filteredReports.length === 0}
                  className="px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation w-full sm:w-auto"
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
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-royal mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 text-center py-8">
                {fromDate || toDate || searchTerm
                  ? `No reports found matching the filters`
                  : 'No reports found'}
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Collected By
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Collected Date & Time
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Checked By
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Checking Date & Time
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplied By
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplied Date & Time
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report, index) => {
                      // Check if this invoice has been edited
                      const isEdited = (report.updated_at && 
                        report.created_at && 
                        new Date(report.updated_at).getTime() !== new Date(report.created_at).getTime()) ||
                        (report.notes && report.notes.includes('[Remarks:'))
                      
                      return (
                        <tr key={report.invoice_number || index} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-4 py-3">
                            <div className={`text-sm font-medium ${isEdited ? 'text-red-600' : 'text-gray-900'}`}>
                              {report.invoice_number || '-'}
                            </div>
                          </td>
                        <td className="px-3 sm:px-4 py-3">
                          <span className="text-xs sm:text-sm text-gray-900">{report.collector_name || '-'}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                          {formatDate(report.collection_date)}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <span className="text-xs sm:text-sm text-gray-900">{report.checker_name || '-'}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                          {formatDate(report.checked_date)}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <span className="text-xs sm:text-sm text-gray-900">{report.supplied_by || '-'}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                          {formatDate(report.delivery_date)}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <span className="text-xs sm:text-sm text-gray-900 font-medium">{report.customer_name || '-'}</span>
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
