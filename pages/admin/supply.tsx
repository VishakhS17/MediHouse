import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

export default function Supply() {
  const { admin, hasPermission } = useAdminAuth()
  const [invoices, setInvoices] = useState<any[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  // Set default date filter to today's date (YYYY-MM-DD format for date input)
  const [checkedDateFilter, setCheckedDateFilter] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [supplyData, setSupplyData] = useState<Record<number, { suppliedBy: string; customerName: string }>>({})
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [dailySLNumbers, setDailySLNumbers] = useState<Record<number, number>>({})
  const [showMissing, setShowMissing] = useState(false)
  const [missingInvoiceNumbers, setMissingInvoiceNumbers] = useState<string[]>([])
  const [loadingMissing, setLoadingMissing] = useState(false)

  useEffect(() => {
    if (admin) {
      loadInvoices()
    }
  }, [admin])

  useEffect(() => {
    // Initialize supply data with existing values for already supplied invoices
    if (invoices.length > 0) {
      const initialData: Record<number, { suppliedBy: string; customerName: string }> = {}
      invoices.forEach((invoice) => {
        if (invoice.supply_id && invoice.supplied_by && invoice.supply_customer_name) {
          initialData[invoice.id] = {
            suppliedBy: invoice.supplied_by,
            customerName: invoice.supply_customer_name,
          }
        }
      })
      setSupplyData((prev) => ({ ...prev, ...initialData }))
    }
  }, [invoices])

  // Fuzzy search function using Levenshtein distance
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
    // Filter invoices based on search term and date filter
    let filtered = invoices

    // Filter by search term (invoice number or supplier name with fuzzy matching)
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter((invoice) => {
        // Check invoice number (exact substring match)
        const invoiceMatch = invoice.invoice_number?.toLowerCase().includes(searchLower)
        
        // Check supplier name with fuzzy matching
        const supplierName = invoice.supplied_by || ''
        const supplierMatch = fuzzyMatch(supplierName, searchTerm)
        
        return invoiceMatch || supplierMatch
      })
    }

    // Filter by checked date
    if (checkedDateFilter) {
      filtered = filtered.filter((invoice) => {
        if (!invoice.checked_date) return false
        const invoiceDate = new Date(invoice.checked_date).toISOString().split('T')[0]
        return invoiceDate === checkedDateFilter
      })
    }

    // Calculate SL numbers based on filtered (but unsorted) invoices
    const slMap: Record<string, number> = {}
    const slNumbers: Record<number, number> = {}
    
    filtered.forEach((invoice) => {
      const dateKey = invoice.checked_date 
        ? new Date(invoice.checked_date).toISOString().split('T')[0]
        : 'no-date'
      if (!slMap[dateKey]) {
        slMap[dateKey] = 0
      }
      slMap[dateKey]++
      slNumbers[invoice.id] = slMap[dateKey]
    })
    
    setDailySLNumbers(slNumbers)

    // Apply sorting
    if (sortColumn === 'invoice_number') {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a.invoice_number || ''
        const bValue = b.invoice_number || ''
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      })
    }

    setFilteredInvoices(filtered)
  }, [invoices, searchTerm, checkedDateFilter, sortColumn, sortDirection])

  const loadInvoices = async () => {
    if (!admin) {
      setError('Admin user not loaded')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/supply?invoices=true', {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })
      if (response.ok) {
        const data = await response.json()
        const invoicesData = data.data || []
        setInvoices(invoicesData)
        setFilteredInvoices(invoicesData)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to load invoices')
      }
    } catch (err: any) {
      console.error('Error loading invoices:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }


  const handleSupplyDataChange = (invoiceId: number, field: 'suppliedBy' | 'customerName', value: string) => {
    setSupplyData((prev) => ({
      ...prev,
      [invoiceId]: {
        ...prev[invoiceId],
        [field]: value,
      },
    }))
  }


  const handleSubmitSupply = async (invoiceId: number, invoiceNumber: string) => {
    const data = supplyData[invoiceId]
    const suppliedBy = data?.suppliedBy?.trim() || ''
    const customerName = data?.customerName?.trim() || ''
    
    if (!suppliedBy || !customerName) {
      setError('Supplied By and Customer Name are required')
      return
    }

    setSubmitting(true)
    setSubmittingId(invoiceId)
    setError('')
    setSuccess('')

    try {
      // Automatically get current date and time from device
      const now = new Date()
      const deliveryDate = now.toISOString()

      const response = await fetch('/api/admin/supply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-data': JSON.stringify(admin),
        },
        body: JSON.stringify({
          invoiceNumber: invoiceNumber.trim(),
          suppliedBy: suppliedBy,
          customerName: customerName,
          deliveryDate: deliveryDate,
        }),
      })

      const responseData = await response.json()

      if (response.ok) {
        setSuccess('Supply record created successfully!')
        loadInvoices()
        // Clear the input fields for this invoice
        setSupplyData((prev) => {
          const newData = { ...prev }
          delete newData[invoiceId]
          return newData
        })
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(responseData.message || 'Failed to create supply record')
      }
    } catch (err: any) {
      console.error('Error submitting supply:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
      setSubmittingId(null)
    }
  }

  const handleDownloadExcel = async () => {
    setDownloading(true)
    try {
      // Build query string with date filter and search term if selected
      let queryString = 'download=true'
      if (checkedDateFilter) {
        queryString += `&checkedDateFilter=${encodeURIComponent(checkedDateFilter)}`
      }
      if (searchTerm.trim()) {
        queryString += `&searchTerm=${encodeURIComponent(searchTerm.trim())}`
      }
      
      const response = await fetch(`/api/admin/supply?${queryString}`, {
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
          const text = await response.text()
          alert(`Error: Failed to download report - ${response.status} ${response.statusText}`)
        }
        setDownloading(false)
        return
      }

      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'Supply_Records.xlsx'
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
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }


  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to ascending
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Calculate missing invoice numbers from the sequence/series and check against database
  useEffect(() => {
    const calculateAndCheckMissing = async () => {
      if (!checkedDateFilter || !admin) {
        setMissingInvoiceNumbers([])
        return
      }

      // Get all invoice numbers from filtered invoices
      const invoiceNumbers = filteredInvoices
        .map((invoice) => invoice.invoice_number)
        .filter((invoiceNumber): invoiceNumber is string => Boolean(invoiceNumber))
      
      if (invoiceNumbers.length === 0) {
        setMissingInvoiceNumbers([])
        return
      }

      // Convert to numbers and filter out non-numeric values
      // Also filter out unreasonable values (likely data errors)
      const numericInvoices = invoiceNumbers
        .map((num) => {
          // Extract numeric part (handle cases like "18931(edit)" or "18931-1")
          const numericPart = num.toString().replace(/[^0-9]/g, '')
          return numericPart ? parseInt(numericPart, 10) : NaN
        })
        .filter((num) => !isNaN(num) && num > 0 && num < 1000000) // Reasonable range: 1 to 999,999
        .sort((a, b) => a - b)

      if (numericInvoices.length === 0) {
        setMissingInvoiceNumbers([])
        return
      }

      const min = numericInvoices[0]
      const max = numericInvoices[numericInvoices.length - 1]
      
      // Safety check: Don't check more than 1000 missing numbers to avoid performance issues
      const range = max - min
      if (range > 1000) {
        console.warn(`Invoice number range too large (${range}), limiting check to reasonable range`)
        setMissingInvoiceNumbers([])
        return
      }
      
      // Create a set of existing invoice numbers for quick lookup
      const existingNumbers = new Set(numericInvoices)
      
      // Find missing numbers in the sequence
      const missing: string[] = []
      for (let i = min; i <= max; i++) {
        if (!existingNumbers.has(i)) {
          missing.push(i.toString())
        }
      }

      if (missing.length === 0) {
        setMissingInvoiceNumbers([])
        return
      }

      // Check which missing invoice numbers exist in the database
      setLoadingMissing(true)
      try {
        const response = await fetch('/api/admin/check-invoice-numbers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-data': JSON.stringify(admin),
          },
          body: JSON.stringify({
            invoiceNumbers: missing,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const existingInDatabase = new Set(data.existingInvoiceNumbers || [])
          
          // Filter out invoice numbers that exist in database
          const trulyMissing = missing.filter((num) => !existingInDatabase.has(num))
          setMissingInvoiceNumbers(trulyMissing)
        } else {
          // If API fails, show all missing numbers
          console.error('API response not OK:', response.status, response.statusText)
          setMissingInvoiceNumbers(missing)
        }
      } catch (err: any) {
        console.error('Error checking missing invoice numbers:', err)
        // If API fails (network error, etc.), show all missing numbers
        setMissingInvoiceNumbers(missing)
      } finally {
        setLoadingMissing(false)
      }
    }

    calculateAndCheckMissing()
  }, [filteredInvoices, checkedDateFilter, admin])

  if (!hasPermission('manage_supply')) {
    return (
      <AdminProtectedRoute>
        <Head>
          <title>Access Denied - Admin | medi-house</title>
        </Head>
        <AdminLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">
              You don't have permission to manage supply. Please contact your administrator.
            </p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  return (
    <AdminProtectedRoute>
      <Head>
        <title>Supply - Admin | medi-house</title>
        <meta name="description" content="Manage supply records" />
      </Head>
      <AdminLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Supply Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Record and track invoice supplies. Enter supplier and customer information for each invoice.
            </p>
          </div>

          {/* Messages */}
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

          {/* Missing Invoice Numbers Section */}
          {checkedDateFilter && missingInvoiceNumbers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <button
                onClick={() => setShowMissing(!showMissing)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Missing Invoice Numbers
                    </h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {missingInvoiceNumbers.length} invoice number{missingInvoiceNumbers.length !== 1 ? 's' : ''} missing from the series for {checkedDateFilter ? new Date(checkedDateFilter).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'selected date'}
                    </p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${showMissing ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMissing && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {loadingMissing ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ocean-royal mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Checking database...</p>
                    </div>
                  ) : missingInvoiceNumbers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {missingInvoiceNumbers.map((invoiceNumber) => (
                        <span
                          key={invoiceNumber}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-50 text-orange-800 border border-orange-200"
                        >
                          {invoiceNumber}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No missing invoice numbers in the series for the selected date (or all missing numbers exist in database on other dates).
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Summary Cards */}
          {!loading && invoices.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Total Records */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{filteredInvoices.length}</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Supplied */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Supplied</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {filteredInvoices.filter((inv) => inv.supply_id).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {filteredInvoices.length > 0
                        ? Math.round((filteredInvoices.filter((inv) => inv.supply_id).length / filteredInvoices.length) * 100)
                        : 0}
                      % complete
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Pending */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-orange-600 mt-2">
                      {filteredInvoices.filter((inv) => !inv.supply_id).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {filteredInvoices.length > 0
                        ? Math.round((filteredInvoices.filter((inv) => !inv.supply_id).length / filteredInvoices.length) * 100)
                        : 0}
                      % remaining
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoices List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Invoices</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Search Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search invoice number or supplier name..."
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
                    value={checkedDateFilter}
                    onChange={(e) => setCheckedDateFilter(e.target.value)}
                    placeholder="Filter by checked date"
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent min-h-[44px] touch-manipulation w-full sm:w-auto"
                  />
                  {checkedDateFilter && (
                    <button
                      onClick={() => setCheckedDateFilter('')}
                      className="px-2 py-2 text-sm text-gray-600 hover:text-gray-800 min-h-[44px] touch-manipulation"
                      title="Clear date filter"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button
                  onClick={handleDownloadExcel}
                  disabled={downloading || invoices.length === 0}
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
                <p className="text-gray-600 mt-4">Loading invoices...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 text-center py-8">
                {searchTerm ? `No invoices found matching "${searchTerm}"` : 'No invoices found'}
              </p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SL
                      </th>
                      <th 
                        className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('invoice_number')}
                      >
                        <div className="flex items-center gap-1">
                          Invoice #
                          {sortColumn === 'invoice_number' && (
                            <svg
                              className={`w-4 h-4 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                          {sortColumn !== 'invoice_number' && (
                            <svg
                              className="w-4 h-4 opacity-30"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplied By
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Checked Date
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supply Datetime
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold text-gray-700">
                          {dailySLNumbers[invoice.id] || '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          {invoice.supply_id ? (
                            <span className="text-xs sm:text-sm text-gray-900 font-medium">
                              {invoice.supplied_by}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={supplyData[invoice.id]?.suppliedBy || ''}
                              onChange={(e) => handleSupplyDataChange(invoice.id, 'suppliedBy', e.target.value)}
                              placeholder="Enter supplier name"
                              className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation min-w-[120px]"
                            />
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          {invoice.supply_id ? (
                            <span className="text-xs sm:text-sm text-gray-900 font-medium">
                              {invoice.supply_customer_name}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={supplyData[invoice.id]?.customerName || ''}
                              onChange={(e) => handleSupplyDataChange(invoice.id, 'customerName', e.target.value)}
                              placeholder="Enter customer name"
                              className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation min-w-[120px]"
                            />
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                          {invoice.checked_date ? (
                            formatDate(invoice.checked_date)
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                          {invoice.supply_id && invoice.delivery_date ? (
                            formatDate(invoice.delivery_date)
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm">
                          {invoice.supply_id ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Supplied
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSubmitSupply(invoice.id, invoice.invoice_number)}
                              disabled={submitting || submittingId === invoice.id || !supplyData[invoice.id]?.suppliedBy?.trim() || !supplyData[invoice.id]?.customerName?.trim()}
                              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-ocean-royal to-ocean-cyan rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] touch-manipulation"
                            >
                              {submittingId === invoice.id ? 'Submitting...' : 'Submit'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
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

