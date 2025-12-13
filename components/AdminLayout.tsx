import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAdminAuth } from '@/lib/adminAuth'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  // Sidebar should be closed on mobile by default, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { admin, logout, hasPermission } = useAdminAuth()
  const router = useRouter()

  // Open sidebar on desktop by default, close on mobile
  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        const isDesktop = window.innerWidth >= 1024 // lg breakpoint
        setSidebarOpen(isDesktop)
      }
    }
    
    // Check on mount
    checkScreenSize()
    
    // Listen for resize events
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊', permission: 'view_dashboard' },
    { name: 'Products', href: '/admin/products', icon: '💊', permission: 'manage_products' },
    { name: 'Upload Stock', href: '/admin/upload-stock', icon: '📤', permission: 'manage_stock' },
    { name: 'Sales Report', href: '/admin/sales-report', icon: '📈', permission: 'view_sales' },
    { name: 'Orders', href: '/admin/orders', icon: '📦', permission: 'manage_orders' },
    { name: 'Invoice Collection', href: '/admin/invoice-collection', icon: '🧾', permission: 'collect_invoices' },
    { name: 'Invoice Checking', href: '/admin/invoice-checking', icon: '✓', permission: 'check_invoices' },
    { name: 'Outstanding Bills', href: '/admin/outstanding-bills', icon: '📋', permission: 'manage_outstanding_bills' },
    { name: 'Upload DRS', href: '/admin/upload-drs', icon: '📄', permission: 'manage_outstanding_bills' },
    { name: 'Supply', href: '/admin/supply', icon: '📦', permission: 'manage_supply' },
    { name: 'Attendance', href: '/admin/attendance', icon: '📅', permission: 'manage_attendance' },
    { name: 'Admin Users', href: '/admin/users', icon: '👤', permission: 'manage_admins' },
  ].filter(item => hasPermission(item.permission))

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64 bg-white border-r border-gray-200 overflow-y-auto shadow-lg lg:shadow-none`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 border-b border-gray-200">
          <a href="https://medi-house.in" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-ocean-royal to-ocean-cyan rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">m</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">medi-house</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </a>
          <button
            onClick={() => {
              // Only toggle on mobile
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                setSidebarOpen(false)
              }
            }}
            className="lg:hidden text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 sm:px-4 py-4 sm:py-6 space-y-1 sm:space-y-2">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setSidebarOpen(false)
                  }
                }}
                className={`flex items-center justify-start space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all min-h-[44px] touch-manipulation text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-ocean-royal to-ocean-cyan text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg sm:text-xl flex-shrink-0">{item.icon}</span>
                <span className="font-medium text-sm sm:text-base text-left">{item.name}</span>
              </a>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-ocean-royal to-ocean-cyan rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm sm:text-base">
                {admin?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{admin?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{admin?.email || 'admin@example.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 sm:py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay - only show on mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity duration-300"
          onClick={() => {
            // Only close on mobile
            if (typeof window !== 'undefined' && window.innerWidth < 1024) {
              setSidebarOpen(false)
            }
          }}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6">
            <button
              onClick={() => {
                // Only toggle on mobile
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setSidebarOpen(true)
                }
              }}
              className="lg:hidden text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
              {/* Empty space for future features */}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

