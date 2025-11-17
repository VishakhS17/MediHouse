import Head from 'next/head'
import AdminLayout from '@/components/AdminLayout'
import AdminProtectedRoute from '@/components/AdminProtectedRoute'

export default function AdminDashboard() {

  const stats = [
    {
      name: 'Total Products',
      value: '1,234',
      change: '+12.5%',
      changeType: 'positive',
      icon: '💊',
      color: 'from-ocean-royal to-ocean-cyan',
    },
    {
      name: 'Total Orders',
      value: '856',
      change: '+8.2%',
      changeType: 'positive',
      icon: '📦',
      color: 'from-ocean-teal to-ocean-cyan',
    },
    {
      name: 'Total Customers',
      value: '720',
      change: '+5.1%',
      changeType: 'positive',
      icon: '👥',
      color: 'from-ocean-aqua to-ocean-sky',
    },
    {
      name: 'Revenue',
      value: '₹2.4M',
      change: '+15.3%',
      changeType: 'positive',
      icon: '💰',
      color: 'from-ocean-royal to-ocean-teal',
    },
  ]

  const recentActivities = [
    { id: 1, type: 'order', message: 'New order #1234 received', time: '2 minutes ago' },
    { id: 2, type: 'product', message: 'Product "Paracetamol 500mg" updated', time: '15 minutes ago' },
    { id: 3, type: 'customer', message: 'New customer registered', time: '1 hour ago' },
    { id: 4, type: 'order', message: 'Order #1233 shipped', time: '2 hours ago' },
  ]

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
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                      <span className="text-sm text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-3xl shadow-lg`}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sales Overview</h2>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">📊</p>
                  <p className="text-gray-500 text-sm">Chart will be displayed here</p>
                </div>
              </div>
            </div>

            {/* Orders Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">📈</p>
                  <p className="text-gray-500 text-sm">Chart will be displayed here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-ocean-royal to-ocean-cyan rounded-lg flex items-center justify-center text-white font-semibold">
                    {activity.type === 'order' && '📦'}
                    {activity.type === 'product' && '💊'}
                    {activity.type === 'customer' && '👥'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-ocean-royal to-ocean-cyan text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105">
                <span className="text-3xl mb-2">➕</span>
                <span className="text-sm font-medium">Add Product</span>
              </button>
              <a
                href="/api/admin/sales-report"
                download
                className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-ocean-teal to-ocean-cyan text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
              >
                <span className="text-3xl mb-2">📊</span>
                <span className="text-sm font-medium">Download Sales Report</span>
              </a>
              <button className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-ocean-aqua to-ocean-sky text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105">
                <span className="text-3xl mb-2">👥</span>
                <span className="text-sm font-medium">Manage Users</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-ocean-royal to-ocean-teal text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105">
                <span className="text-3xl mb-2">⚙️</span>
                <span className="text-sm font-medium">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  )
}

