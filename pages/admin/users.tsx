import { useState, useEffect } from 'react'
import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

export default function AdminUsers() {
  const { hasPermission, admin } = useAdminAuth()
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  })

  useEffect(() => {
    if (admin) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin])

  const loadData = async () => {
    if (!admin) return
    
    setLoading(true)
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/admin/users', {
          headers: {
            'x-admin-data': JSON.stringify(admin),
          },
        }),
        fetch('/api/admin/roles'),
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        setRoles(rolesData.roles || [])
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      roleId: '',
      isActive: true,
    })
    setShowAddModal(true)
  }

  const handleEdit = (user: any) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      roleId: user.role_id?.toString() || '',
      isActive: user.is_active !== false,
    })
    setShowEditModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!admin) {
      alert('Admin session not found. Please log in again.')
      return
    }
    
    const isEdit = !!selectedUser

    try {
      const url = '/api/admin/users'
      const method = isEdit ? 'PUT' : 'POST'
      const body: any = {
        ...formData,
        roleId: formData.roleId ? parseInt(formData.roleId) : null,
      }

      if (isEdit) {
        body.id = selectedUser.id
        if (!body.password) {
          delete body.password
        }
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
        setShowAddModal(false)
        setShowEditModal(false)
        setSelectedUser(null)
        loadData()
        alert(isEdit ? 'User updated successfully!' : 'User created successfully!')
      } else {
        alert(data.message || 'Operation failed')
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-data': JSON.stringify(admin),
        },
      })

      const data = await response.json()

      if (response.ok) {
        loadData()
        alert('User deleted successfully!')
      } else {
        alert(data.message || 'Failed to delete user')
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred')
    }
  }

  if (!hasPermission('manage_admins')) {
    return (
      <AdminProtectedRoute>
        <Head>
          <title>Access Denied - Admin | medi-house</title>
        </Head>
        <AdminLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-600">
              You don't have permission to manage admin users. Please contact your administrator.
            </p>
          </div>
        </AdminLayout>
      </AdminProtectedRoute>
    )
  }

  return (
    <AdminProtectedRoute>
      <Head>
        <title>Admin Users - Admin | medi-house</title>
        <meta name="description" content="Manage admin users and roles" />
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Users</h1>
              <p className="text-gray-600 mt-1">Manage admin users and their roles</p>
            </div>
            <button
              onClick={handleAdd}
              className="bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              + Add User
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-royal mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-3 sm:mx-0 table-wrapper">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Email
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Status
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Last Login
                      </th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500 sm:hidden mt-1">{user.email}</div>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                          {user.email}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {user.role_name || 'No Role'}
                          </span>
                          <div className="md:hidden mt-1">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.is_active !== false
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 hidden md:table-cell">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.is_active !== false
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                          {user.last_login
                            ? new Date(user.last_login).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                              })
                            : 'Never'}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="text-ocean-royal hover:text-ocean-cyan min-h-[32px] sm:min-h-[44px] px-2 sm:px-3 touch-manipulation"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="text-red-600 hover:text-red-800 min-h-[32px] sm:min-h-[44px] px-2 sm:px-3 touch-manipulation"
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

          {/* Add/Edit Modal */}
          {(showAddModal || showEditModal) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                    {showEditModal ? 'Edit User' : 'Add New User'}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                        Password {showEditModal ? '(leave blank to keep current)' : <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="password"
                        required={!showEditModal}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                      />
                    </div>

                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1.5">
                        Role
                      </label>
                      <select
                        value={formData.roleId}
                        onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                        className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-royal focus:border-transparent touch-manipulation"
                      >
                        <option value="">No Role</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name} - {role.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    {showEditModal && (
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="rounded border-gray-300 text-ocean-royal focus:ring-ocean-royal"
                          />
                          <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all min-h-[44px] touch-manipulation"
                      >
                        {showEditModal ? 'Update' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddModal(false)
                          setShowEditModal(false)
                          setSelectedUser(null)
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors min-h-[44px] touch-manipulation"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

