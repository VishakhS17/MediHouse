import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/router'

interface AdminUser {
  id: string
  email: string
  name: string
  permissions?: string[]
  role?: {
    id: number
    name: string
    description: string
  }
}

interface AdminAuthContextType {
  admin: AdminUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  hasPermission: (permission: string) => boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        if (token) {
          // In a real app, verify token with backend
          // For now, just check if token exists
          const adminData = localStorage.getItem('admin_data')
          if (adminData) {
            setAdmin(JSON.parse(adminData))
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Fetch user permissions
        let permissions: string[] = []
        let role = null
        try {
          const permResponse = await fetch(`/api/admin/permissions?userId=${data.admin.id}`)
          if (permResponse.ok) {
            const permData = await permResponse.json()
            permissions = permData.permissions || []
            role = permData.role
          }
        } catch (permError) {
          console.error('Failed to fetch permissions:', permError)
        }
        
        const adminWithPerms = {
          ...data.admin,
          permissions,
          role,
        }
        
        // Store token and admin data
        localStorage.setItem('admin_token', data.token)
        localStorage.setItem('admin_data', JSON.stringify(adminWithPerms))
        setAdmin(adminWithPerms)
        return true
      } else {
        // Handle error response
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }))
        console.error('Login failed:', errorData.message)
        return false
      }
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_data')
    setAdmin(null)
    router.push('/admin/login')
  }

  const hasPermission = (permission: string): boolean => {
    if (!admin || !admin.permissions) return false
    // Super admin has all permissions
    if (admin.role?.name === 'super_admin') return true
    return admin.permissions.includes(permission)
  }

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
        isAuthenticated: !!admin,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

