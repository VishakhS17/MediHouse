import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

export default function InvoiceChecking() {
  const { admin, hasPermission, loading: authLoading } = useAdminAuth()
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [checkerNames, setCheckerNames] = useState<Record<number, string>>({})

  useEffect(() => {
    if (admin) {
      loadCollections()
    }
  }, [admin])

  useEffect(() => {
    // Initialize checker names with admin name for all unchecked invoices
    if (admin?.name && collections.length > 0) {
      const initialNames: Record<number, string> = {}
      collections.forEach((collection) => {
        if (!collection.checked_date) {
          initialNames[collection.id] = admin.name
        }
      })
      setCheckerNames((prev) => ({ ...prev, ...initialNames }))
    }
  }, [collections, admin])

  const loadCollections = async () => {
    if (!admin) {
      setError('Admin user not loaded')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/invoice-checking', {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })
      if (response.ok) {
        const data = await response.json()
        setCollections(data.data || [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to load invoice collections')
      }
    } catch (err: any) {
      console.error('Error loading collections:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckInvoice = async (collectionId: number) => {
    const checkerName = checkerNames[collectionId]?.trim() || ''
    
    if (!checkerName) {
      setError('Checker name is required')
      return
    }

    setSubmitting(true)
    setSubmittingId(collectionId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/invoice-checking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-data': JSON.stringify(admin),
        },
        body: JSON.stringify({
          invoiceCollectionId: collectionId,
          checkerName: checkerName,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Invoice marked as checked successfully!')
        loadCollections()
        setTimeout(() => setSuccess(''), 3000)
        // Clear the checker name for this invoice
        setCheckerNames((prev) => {
          const newNames = { ...prev }
          delete newNames[collectionId]
          return newNames
        })
      } else {
        setError(data.message || 'Failed to mark invoice as checked')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
      setSubmittingId(null)
    }
  }

  const handleCheckerNameChange = (collectionId: number, name: string) => {
    setCheckerNames((prev) => ({
      ...prev,
      [collectionId]: name,
    }))
  }

  const handleDownloadExcel = async () => {
    setDownloading(true)
    try {
      const response = await fetch('/api/admin/invoice-checking?download=true', {
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

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'Invoice_Checking.xlsx'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
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

  if (authLoading) {
    return (
      <AdminProtectedRoute>
        <Head>
          <title>Invoice Checking - Admin | MediHouse</title>
        </Head>
        <AdminLayout>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-royal"></div>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  if (!hasPermission('check_invoices')) {
    return (
      <AdminProtectedRoute>
        <Head>
          <title>Access Denied - Admin | MediHouse</title>
        </Head>
        <AdminLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">
              You don't have permission to access invoice checking. Please contact your administrator.
            </p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
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

  return (
    <AdminProtectedRoute>
      <Head>
        <title>Invoice Checking - Admin | MediHouse</title>
        <meta name="description" content="Check and verify invoice collections" />
      </Head>
      <AdminLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoice Checking</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Verify and mark invoices as checked. All invoice collection data is shown as read-only.
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

          {/* Invoice Collections List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Invoice Collections</h2>
              <button
                onClick={handleDownloadExcel}
                disabled={downloading || collections.length === 0}
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

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocean-royal mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading invoice collections...</p>
              </div>
            ) : collections.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 text-center py-8">No invoice collections found</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice #
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Collected By
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Collection Date
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Checked By
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Checked Date
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Checker Name
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {collections.map((collection) => (
                      <tr key={collection.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{collection.invoice_number}</div>
                          <div className="text-xs text-gray-500 sm:hidden mt-1">
                            Collected by: {collection.collector_name}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                          {collection.collector_name}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                          {formatDate(collection.collection_date)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                          {collection.checker_name || (
                            <span className="text-gray-400 italic">Not checked</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                          {collection.checked_date ? (
                            formatDate(collection.checked_date)
                          ) : (
                            <span className="text-gray-400 italic">-</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          {collection.checked_date ? (
                            <span className="text-xs sm:text-sm text-gray-900 font-medium">
                              {collection.checker_name}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={checkerNames[collection.id] || ''}
                              onChange={(e) => handleCheckerNameChange(collection.id, e.target.value)}
                              placeholder="Enter checker name"
                              className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation min-w-[120px]"
                            />
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm">
                          {collection.checked_date ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Checked
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCheckInvoice(collection.id)}
                              disabled={submitting || submittingId === collection.id || !checkerNames[collection.id]?.trim()}
                              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-ocean-royal to-ocean-cyan rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] touch-manipulation"
                            >
                              {submittingId === collection.id ? 'Checking...' : 'Mark as Checked'}
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

