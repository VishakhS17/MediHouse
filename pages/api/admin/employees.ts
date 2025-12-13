import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Check permission
    const userId = getAdminUserIdFromRequest(req)
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - Admin user not found' })
    }

    const hasPermission = await checkPermission(userId, 'manage_attendance')
    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' })
    }

    // Get all employees (users with employee role)
    const result = await query(
      `SELECT 
        au.id,
        au.name,
        au.email,
        au.is_active,
        r.name as role_name
       FROM admin_users au
       INNER JOIN admin_roles r ON au.role_id = r.id
       WHERE r.name = 'employee' AND (au.is_active IS NULL OR au.is_active = true)
       ORDER BY au.name ASC`
    )

    res.status(200).json({
      success: true,
      employees: result.rows,
    })
  } catch (error: any) {
    console.error('Get employees error:', error)
    res.status(500).json({
      message: 'Error fetching employees',
      error: error.message,
    })
  }
}


