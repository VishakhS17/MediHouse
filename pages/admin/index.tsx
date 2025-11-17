import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAdminAuth } from '@/lib/adminAuth'

export default function AdminIndex() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAdminAuth()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/admin/dashboard')
      } else {
        router.push('/admin/login')
      }
    }
  }, [isAuthenticated, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocean-royal"></div>
    </div>
  )
}

