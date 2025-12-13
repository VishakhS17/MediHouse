import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

export default function AdminDashboard() {
  const { hasPermission } = useAdminAuth()

  const quickLinks = [
    { name: 'Manage Products', href: '/admin/products', icon: '💊', permission: 'manage_products', color: 'from-ocean-royal to-ocean-cyan' },
    { name: 'Upload Stock', href: '/admin/upload-stock', icon: '📤', permission: 'manage_stock', color: 'from-ocean-teal to-ocean-cyan' },
    { name: 'Sales Report', href: '/admin/sales-report', icon: '📊', permission: 'view_sales', color: 'from-ocean-aqua to-ocean-sky' },
    { name: 'Orders', href: '/admin/orders', icon: '📦', permission: 'manage_orders', color: 'from-ocean-royal to-ocean-teal' },
    { name: 'Invoice Collection', href: '/admin/invoice-collection', icon: '🧾', permission: 'collect_invoices', color: 'from-ocean-royal to-ocean-teal' },
    { name: 'Invoice Checking', href: '/admin/invoice-checking', icon: '✓', permission: 'check_invoices', color: 'from-ocean-teal to-ocean-cyan' },
    { name: 'Supply', href: '/admin/supply', icon: '📦', permission: 'manage_supply', color: 'from-ocean-aqua to-ocean-sky' },
    { name: 'Attendance', href: '/admin/attendance', icon: '📅', permission: 'manage_attendance', color: 'from-ocean-aqua to-ocean-sky' },
    { name: 'Admin Users', href: '/admin/users', icon: '👤', permission: 'manage_admins', color: 'from-ocean-teal to-ocean-cyan' },
  ].filter(link => hasPermission(link.permission))

  return (
    <AdminProtectedRoute>
      <Head>
        <title>Admin Dashboard - MediHouse</title>
        <meta name="description" content="MediHouse Admin Dashboard" />
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Use the navigation menu to access different sections.</p>
          </div>

          {/* Quick Links */}
          {quickLinks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-3 p-4 bg-gradient-to-br ${link.color} text-white rounded-lg hover:shadow-lg transition-all`}
                  >
                    <span className="text-2xl">{link.icon}</span>
                    <span className="font-medium">{link.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

