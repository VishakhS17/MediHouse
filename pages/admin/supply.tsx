import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

export default function Supply() {
  const { admin, hasPermission } = useAdminAuth()
  const [supplyRecords, setSupplyRecords] = useState<any[]>([])
  const [invoiceNumbers, setInvoiceNumbers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    suppliedBy: '',
    customerName: '',
    latitude: '',
    longitude: '',
    locationAddress: '',
  })
  const [gettingLocation, setGettingLocation] = useState(false)

  useEffect(() => {
    if (admin) {
      loadSupplyRecords()
      loadInvoiceNumbers()
    }
  }, [admin])

  const loadSupplyRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/supply', {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSupplyRecords(data.data || [])
      } else {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          setError(errorData.message || 'Failed to load supply records')
        } else {
          const text = await response.text()
          setError(`Failed to load supply records: ${response.status} ${response.statusText}`)
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadInvoiceNumbers = async () => {
    try {
      const response = await fetch('/api/admin/invoice-numbers', {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setInvoiceNumbers(data.invoiceNumbers || [])
      }
    } catch (err) {
      console.error('Error loading invoice numbers:', err)
    }
  }

  const handleAdd = () => {
    setFormData({
      invoiceNumber: '',
      suppliedBy: '',
      customerName: '',
      latitude: '',
      longitude: '',
      locationAddress: '',
    })
    setError('')
    setSuccess('')
    setShowAddModal(true)
  }
  
  const handleCloseModal = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setError('')
    setFormData({
      invoiceNumber: '',
      suppliedBy: '',
      customerName: '',
      latitude: '',
      longitude: '',
      locationAddress: '',
    })
  }
  
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    setError('')

    // Use watchPosition to continuously get location updates until we have good accuracy
    let bestPosition: GeolocationPosition | null = null
    let attempts = 0
    const maxAttempts = 10 // Try up to 10 position updates to get best accuracy
    
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        attempts++
        const { latitude, longitude, accuracy } = position.coords
        
        // Log accuracy for debugging
        console.log(`Location attempt ${attempts}: accuracy ${accuracy.toFixed(0)} meters`)
        
        // Keep track of the best (most accurate) position
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position
        }
        
        // Accept position if accuracy is good (within 50 meters) or we've tried enough times
        if (accuracy <= 50 || attempts >= maxAttempts) {
          // Stop watching
          navigator.geolocation.clearWatch(watchId)
          
          // Use the best position we got
          const finalPosition = bestPosition || position
          const finalLat = finalPosition.coords.latitude
          const finalLon = finalPosition.coords.longitude
          const finalAccuracy = finalPosition.coords.accuracy
          
          if (finalAccuracy > 100) {
            console.warn(`Final location accuracy: ${finalAccuracy.toFixed(0)} meters - may not be very accurate`)
          }
          
          // Clear any previous errors since location was successfully retrieved
          setError('')
        
          setFormData(prev => ({
            ...prev,
            latitude: finalLat.toString(),
            longitude: finalLon.toString(),
          }))

          // Try to get address from coordinates using reverse geocoding
          try {
            // Using OpenStreetMap Nominatim API (free, no key required)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${finalLat}&lon=${finalLon}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'MediHouse-Supply-Management' // Required by Nominatim
              }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            const address = data.display_name || `${data.address?.road || ''} ${data.address?.city || data.address?.town || ''} ${data.address?.postcode || ''}`.trim()
            
              setFormData(prev => ({
                ...prev,
                locationAddress: address || '',
              }))
            }
          } catch (err) {
            console.error('Error getting address:', err)
            // Location captured even if address lookup fails - don't show error to user
          }

          setGettingLocation(false)
        }
      },
      (error) => {
        // Stop watching on error
        navigator.geolocation.clearWatch(watchId)
        
        // If watchPosition fails, fall back to getCurrentPosition with high accuracy
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            
            setError('')
            
            setFormData(prev => ({
              ...prev,
              latitude: latitude.toString(),
              longitude: longitude.toString(),
            }))

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
                const address = data.display_name || `${data.address?.road || ''} ${data.address?.city || data.address?.town || ''} ${data.address?.postcode || ''}`.trim()
                
                setFormData(prev => ({
                  ...prev,
                  locationAddress: address || '',
                }))
              }
            } catch (err) {
              console.error('Error getting address:', err)
            }

            setGettingLocation(false)
          },
          (fallbackError) => {
            setGettingLocation(false)
            let errorMessage = 'Failed to get location'
            switch (fallbackError.code) {
              case fallbackError.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permissions in your browser settings.'
                break
              case fallbackError.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Please ensure GPS/location services are enabled on your device.'
                break
              case fallbackError.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again and ensure you are in an area with good GPS signal.'
                break
              default:
                errorMessage = 'An error occurred while getting your location. Please try again.'
                break
            }
            setError(errorMessage)
          },
          {
            enableHighAccuracy: true,
            timeout: 20000, // Increased timeout to 20 seconds
            maximumAge: 0 // Don't use cached location
          }
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout to 20 seconds
        maximumAge: 0 // Don't use cached location - always get fresh location
      }
    )
  }

  const handleEdit = (record: any) => {
    setSelectedRecord(record)
    setFormData({
      invoiceNumber: record.invoice_number,
      suppliedBy: record.supplied_by,
      customerName: record.customer_name,
      latitude: record.latitude ? record.latitude.toString() : '',
      longitude: record.longitude ? record.longitude.toString() : '',
      locationAddress: record.location_address || '',
    })
    setShowEditModal(true)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.invoiceNumber || !formData.suppliedBy || !formData.customerName) {
      setError('Invoice number, supplied by, and customer name are required')
      return
    }

    // Location is only required when creating a new record, not when editing
    if (!showEditModal && (!formData.latitude || !formData.longitude)) {
      setError('Location is required. Please click "Get Current Location" to capture your location.')
      return
    }

    setSubmitting(true)

    try {
      const url = '/api/admin/supply'
      const method = showEditModal ? 'PUT' : 'POST'
      
      // Automatically get current date and time from device
      const now = new Date()
      const deliveryDate = now.toISOString() // Full ISO string with timezone
      
      const body: any = showEditModal
        ? {
            id: selectedRecord.id,
            suppliedBy: formData.suppliedBy.trim(),
            customerName: formData.customerName.trim(),
            deliveryDate: deliveryDate,
            // Location is not editable - keep existing values from the record
            latitude: selectedRecord.latitude || null,
            longitude: selectedRecord.longitude || null,
            locationAddress: selectedRecord.location_address || null,
          }
        : {
            invoiceNumber: formData.invoiceNumber.trim(),
            suppliedBy: formData.suppliedBy.trim(),
            customerName: formData.customerName.trim(),
            deliveryDate: deliveryDate,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            locationAddress: formData.locationAddress.trim() || null,
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-data': JSON.stringify(admin),
        },
        body: JSON.stringify(body),
      })

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        setError(`Failed to save supply record: ${response.status} ${response.statusText}`)
        setSubmitting(false)
        return
      }

      const data = await response.json()

      if (response.ok) {
        setSuccess(showEditModal ? 'Supply record updated successfully!' : 'Supply record created successfully!')
        setShowAddModal(false)
        setShowEditModal(false)
        setFormData({
          invoiceNumber: '',
          suppliedBy: '',
          customerName: '',
          latitude: '',
          longitude: '',
          locationAddress: '',
        })
        loadSupplyRecords()
        loadInvoiceNumbers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        // Show detailed error message if available
        const errorMessage = data.message || data.error || 'Failed to save supply record'
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error('Error submitting form:', err)
      setError(err.message || 'An error occurred while saving the supply record')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this supply record?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/supply?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (response.ok) {
        setSuccess('Supply record deleted successfully!')
        loadSupplyRecords()
        loadInvoiceNumbers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          setError(errorData.message || 'Failed to delete supply record')
        } else {
          const text = await response.text()
          setError(`Failed to delete supply record: ${response.status} ${response.statusText}`)
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    }
  }

  const handleDownloadExcel = async () => {
    setDownloading(true)
    try {
      const response = await fetch('/api/admin/supply?download=true', {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (!response.ok) {
        // Check if response is JSON before parsing
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
              Track invoice supplies with supplier and customer information
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

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAdd}
              className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white rounded-lg font-medium hover:shadow-lg transition-all min-h-[44px] touch-manipulation"
            >
              + Add Supply Record
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={downloading || supplyRecords.length === 0}
              className="px-4 sm:px-6 py-2.5 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
            >
              {downloading ? 'Downloading...' : 'Download Excel'}
            </button>
          </div>

          {/* Supply Records Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Supply Records</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-royal mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading supply records...</p>
              </div>
            ) : supplyRecords.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 text-center py-8">No supply records found</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice Number
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplied By
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Delivery Date
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Location
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {supplyRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-900">
                          {record.invoice_number}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                          {record.supplied_by}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-600">
                          {record.customer_name}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                          {record.delivery_date
                            ? new Date(record.delivery_date).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                          {record.latitude && record.longitude ? (
                            <a
                              href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                              title={record.location_address || `${record.latitude}, ${record.longitude}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="hidden xl:inline">View Map</span>
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-ocean-royal hover:text-ocean-cyan font-medium min-h-[36px] touch-manipulation"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="text-red-600 hover:text-red-700 font-medium min-h-[36px] touch-manipulation"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div 
            className="fixed inset-0 bg-white/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <div 
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {showEditModal ? 'Edit Supply Record' : 'Add Supply Record'}
                </h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Invoice Number <span className="text-red-500">*</span>
                    </label>
                    {showEditModal ? (
                      <input
                        type="text"
                        id="invoiceNumber"
                        value={formData.invoiceNumber}
                        disabled
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                    ) : (
                      <select
                        id="invoiceNumber"
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                        required
                        disabled={submitting}
                      >
                        <option value="">Select Invoice Number</option>
                        {invoiceNumbers.map((inv) => (
                          <option key={inv} value={inv}>
                            {inv}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label htmlFor="suppliedBy" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Supplied By <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="suppliedBy"
                      value={formData.suppliedBy}
                      onChange={(e) => setFormData({ ...formData, suppliedBy: e.target.value })}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                      placeholder="Enter supplier name"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                      placeholder="Enter customer name"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Location {!showEditModal && <span className="text-red-500">*</span>}
                    </label>
                    {showEditModal ? (
                      // Read-only display when editing
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="text-xs text-gray-700 space-y-1">
                          {formData.latitude && formData.longitude ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Coordinates:</span>
                                <span>{formData.latitude}, {formData.longitude}</span>
                              </div>
                              {formData.locationAddress && (
                                <div className="flex items-start gap-2">
                                  <span className="font-medium">Address:</span>
                                  <span className="flex-1">{formData.locationAddress}</span>
                                </div>
                              )}
                              <a
                                href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View on Google Maps
                              </a>
                            </>
                          ) : (
                            <span className="text-gray-500">No location recorded</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 italic">Location cannot be changed after record creation</p>
                      </div>
                    ) : (
                      // Editable location capture when creating new record
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          disabled={gettingLocation || submitting}
                          className="w-full px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {gettingLocation ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                              <span>Getting accurate GPS location...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Get Current Location</span>
                            </>
                          )}
                        </button>
                        <p className="text-xs text-gray-500 text-center">
                          ⚠️ Make sure GPS/location services are enabled and you're in an open area for best accuracy
                        </p>
                        
                        {(formData.latitude || formData.longitude) && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-xs text-green-700 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Coordinates:</span>
                                <span>{formData.latitude}, {formData.longitude}</span>
                              </div>
                              {formData.locationAddress && (
                                <div className="flex items-start gap-2">
                                  <span className="font-medium">Address:</span>
                                  <span className="flex-1">{formData.locationAddress}</span>
                                </div>
                              )}
                              <a
                                href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View on Google Maps
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation"
                    >
                      {submitting ? 'Saving...' : showEditModal ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors min-h-[48px] touch-manipulation"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

