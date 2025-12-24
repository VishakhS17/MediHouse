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
  const [gettingLocation, setGettingLocation] = useState<Record<number, boolean>>({})

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

    setFilteredInvoices(filtered)
  }, [invoices, searchTerm, checkedDateFilter])

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

  const getCurrentLocation = (invoiceId: number): Promise<{ latitude: number; longitude: number; locationAddress: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }

      setGettingLocation((prev) => ({ ...prev, [invoiceId]: true }))

      let bestPosition: GeolocationPosition | null = null
      let attempts = 0
      const maxAttempts = 10

      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          attempts++
          const { latitude, longitude, accuracy } = position.coords

          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position
          }

          if (accuracy <= 50 || attempts >= maxAttempts) {
            navigator.geolocation.clearWatch(watchId)

            const finalPosition = bestPosition || position
            const finalLat = finalPosition.coords.latitude
            const finalLon = finalPosition.coords.longitude

            let locationAddress = ''
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${finalLat}&lon=${finalLon}&zoom=18&addressdetails=1`,
                {
                  headers: {
                    'User-Agent': 'MediHouse-Supply-Management'
                  }
                }
              )

              if (response.ok) {
                const data = await response.json()
                locationAddress = data.display_name || `${data.address?.road || ''} ${data.address?.city || data.address?.town || ''} ${data.address?.postcode || ''}`.trim()
              }
            } catch (err) {
              console.error('Error getting address:', err)
            }

            setGettingLocation((prev) => ({ ...prev, [invoiceId]: false }))
            resolve({ latitude: finalLat, longitude: finalLon, locationAddress })
          }
        },
        (error) => {
          navigator.geolocation.clearWatch(watchId)

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords
              let locationAddress = ''

              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                  {
                    headers: {
                      'User-Agent': 'MediHouse-Supply-Management'
                    }
                  }
                )

                if (response.ok) {
                  const data = await response.json()
                  locationAddress = data.display_name || `${data.address?.road || ''} ${data.address?.city || data.address?.town || ''} ${data.address?.postcode || ''}`.trim()
                }
              } catch (err) {
                console.error('Error getting address:', err)
              }

              setGettingLocation((prev) => ({ ...prev, [invoiceId]: false }))
              resolve({ latitude, longitude, locationAddress })
            },
            (fallbackError) => {
              setGettingLocation((prev) => ({ ...prev, [invoiceId]: false }))
              let errorMessage = 'Failed to get location'
              switch (fallbackError.code) {
                case fallbackError.PERMISSION_DENIED:
                  errorMessage = 'Location access denied. Please enable location permissions.'
                  break
                case fallbackError.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information unavailable.'
                  break
                case fallbackError.TIMEOUT:
                  errorMessage = 'Location request timed out.'
                  break
              }
              reject(new Error(errorMessage))
            },
            {
              enableHighAccuracy: true,
              timeout: 20000,
              maximumAge: 0
            }
          )
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      )
    })
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
      // Get current location
      let latitude: number | null = null
      let longitude: number | null = null
      let locationAddress: string | null = null

      try {
        const location = await getCurrentLocation(invoiceId)
        latitude = location.latitude
        longitude = location.longitude
        locationAddress = location.locationAddress || null
      } catch (locationError: any) {
        setError(locationError.message || 'Failed to get location. Please try again.')
        setSubmitting(false)
        setSubmittingId(null)
        return
      }

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
          latitude: latitude,
          longitude: longitude,
          locationAddress: locationAddress,
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

          {/* Summary Cards */}
          {!loading && invoices.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Total Records */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{invoices.length}</p>
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
                      {invoices.filter((inv) => inv.supply_id).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {invoices.length > 0
                        ? Math.round((invoices.filter((inv) => inv.supply_id).length / invoices.length) * 100)
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
                      {invoices.filter((inv) => !inv.supply_id).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {invoices.length > 0
                        ? Math.round((invoices.filter((inv) => !inv.supply_id).length / invoices.length) * 100)
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
                        Invoice #
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
                        Location
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
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
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                          {invoice.supply_id && invoice.latitude && invoice.longitude ? (
                            <a
                              href={`https://www.google.com/maps?q=${invoice.latitude},${invoice.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                              title={invoice.location_address || `${invoice.latitude}, ${invoice.longitude}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="hidden sm:inline">
                                {invoice.location_address ? invoice.location_address.substring(0, 30) + (invoice.location_address.length > 30 ? '...' : '') : 'View Map'}
                              </span>
                              <span className="sm:hidden">Map</span>
                            </a>
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
                              disabled={submitting || submittingId === invoice.id || gettingLocation[invoice.id] || !supplyData[invoice.id]?.suppliedBy?.trim() || !supplyData[invoice.id]?.customerName?.trim()}
                              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-ocean-royal to-ocean-cyan rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] touch-manipulation"
                            >
                              {gettingLocation[invoice.id] ? (
                                <span className="flex items-center gap-1">
                                  <svg
                                    className="animate-spin h-3 w-3"
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
                                  Getting Location...
                                </span>
                              ) : submittingId === invoice.id ? (
                                'Submitting...'
                              ) : (
                                'Submit'
                              )}
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

