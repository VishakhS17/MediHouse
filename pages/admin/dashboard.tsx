import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'
import { useAdminAuth } from '@/lib/adminAuth'

export default function AdminDashboard() {
  const { hasPermission } = useAdminAuth()

  const quickLinks = [
    { name: 'Outstanding Bills', href: '/admin/outstanding-bills', icon: '📋', permission: 'manage_outstanding_bills', color: 'from-ocean-royal to-ocean-cyan' },
    { name: 'Upload DRS', href: '/admin/upload-drs', icon: '📄', permission: 'manage_outstanding_bills', color: 'from-ocean-royal to-ocean-teal' },
    { name: 'Products', href: '/admin/products', icon: '💊', permission: 'manage_products', color: 'from-ocean-royal to-ocean-cyan' },
    { name: 'Upload Stock', href: '/admin/upload-stock', icon: '📤', permission: 'manage_stock', color: 'from-ocean-teal to-ocean-cyan' },
    { name: 'Sales Report', href: '/admin/sales-report', icon: '📈', permission: 'view_sales', color: 'from-ocean-aqua to-ocean-sky' },
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
        <title>Admin Dashboard - medi-house</title>
        <meta name="description" content="medi-house Admin Dashboard" />
      </Head>
      <AdminLayout>
        <div className="space-y-4 sm:space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Welcome back! Use the navigation menu to access different sections.</p>
          </div>

          {/* Quick Links */}
          {quickLinks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Links</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {quickLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-3 p-3 sm:p-4 bg-gradient-to-br ${link.color} text-white rounded-lg hover:shadow-lg transition-all min-h-[60px] sm:min-h-[80px] touch-manipulation`}
                  >
                    <span className="text-xl sm:text-2xl flex-shrink-0">{link.icon}</span>
                    <span className="font-medium text-sm sm:text-base">{link.name}</span>
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

