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
    deliveryDate: '',
    deliveryTime: '',
  })

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
        const errorData = await response.json()
        setError(errorData.message || 'Failed to load supply records')
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
      deliveryDate: '',
      deliveryTime: '',
    })
    setShowAddModal(true)
    setError('')
    setSuccess('')
  }

  const handleEdit = (record: any) => {
    setSelectedRecord(record)
    const deliveryDateTime = record.delivery_date ? new Date(record.delivery_date) : null
    setFormData({
      invoiceNumber: record.invoice_number,
      suppliedBy: record.supplied_by,
      customerName: record.customer_name,
      deliveryDate: deliveryDateTime ? deliveryDateTime.toISOString().split('T')[0] : '',
      deliveryTime: deliveryDateTime ? deliveryDateTime.toTimeString().slice(0, 5) : '',
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
      setError('All fields are required')
      return
    }

    setSubmitting(true)

    try {
      const url = '/api/admin/supply'
      const method = showEditModal ? 'PUT' : 'POST'
      
      // Combine date and time for delivery_date
      let deliveryDate = null
      if (formData.deliveryDate) {
        if (formData.deliveryTime) {
          deliveryDate = `${formData.deliveryDate}T${formData.deliveryTime}:00`
        } else {
          deliveryDate = `${formData.deliveryDate}T00:00:00`
        }
      }
      
      const body: any = showEditModal
        ? {
            id: selectedRecord.id,
            suppliedBy: formData.suppliedBy.trim(),
            customerName: formData.customerName.trim(),
            deliveryDate: deliveryDate,
          }
        : {
            invoiceNumber: formData.invoiceNumber.trim(),
            suppliedBy: formData.suppliedBy.trim(),
            customerName: formData.customerName.trim(),
            deliveryDate: deliveryDate,
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-data': JSON.stringify(admin),
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(showEditModal ? 'Supply record updated successfully!' : 'Supply record created successfully!')
        setShowAddModal(false)
        setShowEditModal(false)
        setFormData({
          invoiceNumber: '',
          suppliedBy: '',
          customerName: '',
          deliveryDate: '',
          deliveryTime: '',
        })
        loadSupplyRecords()
        loadInvoiceNumbers()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message || 'Failed to save supply record')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
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
        const errorData = await response.json()
        setError(errorData.message || 'Failed to delete supply record')
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
        const error = await response.json()
        alert(`Error: ${error.message || 'Failed to download report'}`)
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
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {showEditModal ? 'Edit Supply Record' : 'Add Supply Record'}
                </h2>
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
                    <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Delivery Date
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        id="deliveryDate"
                        value={formData.deliveryDate}
                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                        className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                        disabled={submitting}
                      />
                      <input
                        type="time"
                        id="deliveryTime"
                        value={formData.deliveryTime}
                        onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                        className="flex-1 px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                        disabled={submitting}
                      />
                    </div>
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
                      onClick={() => {
                        setShowAddModal(false)
                        setShowEditModal(false)
                        setFormData({
                          invoiceNumber: '',
                          suppliedBy: '',
                          customerName: '',
                          deliveryDate: '',
                          deliveryTime: '',
                        })
                      }}
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

