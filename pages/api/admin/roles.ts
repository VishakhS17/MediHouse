import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get all roles with their permissions
    try {
      const rolesResult = await query(
        `SELECT id, name, description, created_at
         FROM admin_roles
         ORDER BY name`
      )

      // Get permissions for each role
      const roles = await Promise.all(
        rolesResult.rows.map(async (role) => {
          const permissionsResult = await query(
            `SELECT p.id, p.name, p.description
             FROM admin_permissions p
             INNER JOIN role_permissions rp ON p.id = rp.permission_id
             WHERE rp.role_id = $1
             ORDER BY p.name`,
            [role.id]
          )

          return {
            ...role,
            permissions: permissionsResult.rows,
          }
        })
      )

      res.status(200).json({
        success: true,
        roles,
      })
    } catch (error: any) {
      console.error('Get roles error:', error)
      res.status(500).json({
        message: 'Error fetching roles',
        error: error.message,
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}


