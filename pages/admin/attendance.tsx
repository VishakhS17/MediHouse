import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

export default function Attendance() {
  const { admin, hasPermission } = useAdminAuth()
  const [employees, setEmployees] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [formData, setFormData] = useState({
    employeeId: '',
    attendanceDate: new Date().toISOString().split('T')[0],
    status: 'present',
    notes: '',
  })
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    employeeId: '',
  })

  useEffect(() => {
    if (admin) {
      loadEmployees()
      loadAttendance()
    }
  }, [admin])

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/admin/employees', {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      }
    } catch (err) {
      console.error('Error loading employees:', err)
    }
  }

  const loadAttendance = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.employeeId) params.append('employeeId', filters.employeeId)

      const response = await fetch(`/api/admin/attendance?${params.toString()}`, {
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAttendance(data.data || [])
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to load attendance')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.employeeId) {
      setError('Please select an employee')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-data': JSON.stringify(admin),
        },
        body: JSON.stringify({
          employeeId: parseInt(formData.employeeId),
          attendanceDate: formData.attendanceDate,
          status: formData.status,
          notes: formData.notes.trim() || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Attendance marked successfully!')
        setFormData({
          employeeId: '',
          attendanceDate: new Date().toISOString().split('T')[0],
          status: 'present',
          notes: '',
        })
        loadAttendance()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message || 'Failed to mark attendance')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadExcel = async () => {
    setDownloading(true)
    try {
      const params = new URLSearchParams({
        download: 'true',
      })
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.employeeId) params.append('employeeId', filters.employeeId)

      const response = await fetch(`/api/admin/attendance?${params.toString()}`, {
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
      let filename = 'Attendance.xlsx'
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

  const handleApplyFilters = () => {
    loadAttendance()
  }

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      employeeId: '',
    })
  }

  if (!hasPermission('manage_attendance')) {
    return (
      <AdminProtectedRoute>
        <Head>
          <title>Access Denied - Admin | MediHouse</title>
        </Head>
        <AdminLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">
              You don't have permission to manage attendance. Please contact your administrator.
            </p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'half_day':
        return 'bg-yellow-100 text-yellow-800'
      case 'leave':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AdminProtectedRoute>
      <Head>
        <title>Attendance - Admin | MediHouse</title>
        <meta name="description" content="Mark and manage employee attendance" />
      </Head>
      <AdminLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employee Attendance</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Mark attendance for employees and view attendance records
            </p>
          </div>

          {/* Mark Attendance Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Mark Attendance</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="employeeId" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                    Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                    required
                    disabled={submitting}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="attendanceDate" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="attendanceDate"
                    value={formData.attendanceDate}
                    onChange={(e) => setFormData({ ...formData, attendanceDate: e.target.value })}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                    required
                    disabled={submitting}
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half_day">Half Day</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                    placeholder="Add any notes..."
                    disabled={submitting}
                  />
                </div>
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
                {submitting ? 'Marking...' : 'Mark Attendance'}
              </button>
            </form>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="filterEmployee" className="block text-sm font-medium text-gray-700 mb-2">
                  Employee
                </label>
                <select
                  id="filterEmployee"
                  value={filters.employeeId}
                  onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-ocean-royal focus:border-ocean-royal outline-none"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="filterStartDate"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-ocean-royal focus:border-ocean-royal outline-none"
                />
              </div>
              <div>
                <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="filterEndDate"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
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

          {/* Attendance Records */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Attendance Records</h2>
              <button
                onClick={handleDownloadExcel}
                disabled={downloading || attendance.length === 0}
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
                <p className="text-gray-600 mt-4">Loading attendance...</p>
              </div>
            ) : attendance.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-500 text-center py-8">No attendance records found</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Marked By
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendance.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600">
                          {new Date(record.attendance_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900">
                          {record.employee_name}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              record.status
                            )}`}
                          >
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                          {record.marked_by_name || '-'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                          {record.notes || '-'}
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


