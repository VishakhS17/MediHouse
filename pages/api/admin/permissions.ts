import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

// Helper to get admin user ID from token (simplified for now)
async function getAdminUserId(req: NextApiRequest): Promise<number | null> {
  // In production, verify JWT token properly
  // For now, we'll get it from the request
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  // Get admin from session/token - simplified for now
  // In production, decode JWT and get user ID
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' })
    }

    // Get user permissions
    const result = await query(
      `SELECT p.name, p.description
       FROM admin_permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN admin_users au ON rp.role_id = au.role_id
       WHERE au.id = $1
       ORDER BY p.name`,
      [userId]
    )

    const permissions = result.rows.map(row => row.name)

    // Also get user role info
    const roleResult = await query(
      `SELECT r.id, r.name, r.description
       FROM admin_roles r
       INNER JOIN admin_users au ON r.id = au.role_id
       WHERE au.id = $1`,
      [userId]
    )

    res.status(200).json({
      permissions,
      role: roleResult.rows[0] || null,
    })
  } catch (error: any) {
    console.error('Permissions error:', error)
    res.status(500).json({
      message: 'Error fetching permissions',
      error: error.message,
    })
  }
}


