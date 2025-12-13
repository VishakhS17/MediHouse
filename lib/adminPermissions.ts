import { query } from '@/lib/db'

/**
 * Check if an admin user has a specific permission
 */
export async function checkPermission(userId: number, permission: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT has_permission($1, $2) as has_permission`,
      [userId, permission]
    )
    return result.rows[0]?.has_permission === true
  } catch (error) {
    console.error('Permission check error:', error)
    return false
  }
}

/**
 * Get all permissions for an admin user
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  try {
    const result = await query(
      `SELECT permission_name FROM get_admin_permissions($1)`,
      [userId]
    )
    return result.rows.map(row => row.permission_name)
  } catch (error) {
    console.error('Get permissions error:', error)
    return []
  }
}

/**
 * Get admin user ID from request (simplified - should use proper JWT in production)
 */
export function getAdminUserIdFromRequest(req: any): number | null {
  // Try to get from headers
  const adminDataHeader = req.headers?.['x-admin-data']
  if (adminDataHeader) {
    try {
      const admin = typeof adminDataHeader === 'string' ? JSON.parse(adminDataHeader) : adminDataHeader
      if (admin && admin.id) {
        return parseInt(admin.id)
      }
    } catch {
      // Ignore parse errors
    }
  }
  
  // Try to get from body
  if (req.body?.admin?.id) {
    return parseInt(req.body.admin.id)
  }
  
  return null
}

