import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import { checkPermission, getAdminUserIdFromRequest } from '@/lib/adminPermissions'
import bcrypt from 'bcrypt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check permission for all methods
  const userId = getAdminUserIdFromRequest(req)
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized - Admin user not found' })
  }

  const hasPermission = await checkPermission(userId, 'manage_admins')
  if (!hasPermission) {
    return res.status(403).json({ message: 'Forbidden - You do not have permission to manage admin users' })
  }
  if (req.method === 'GET') {
    // Get all admin users with their roles
    try {
      const result = await query(
        `SELECT 
          au.id,
          au.name,
          au.email,
          au.is_active,
          au.last_login,
          au.created_at,
          r.id as role_id,
          r.name as role_name,
          r.description as role_description
         FROM admin_users au
         LEFT JOIN admin_roles r ON au.role_id = r.id
         ORDER BY au.created_at DESC`
      )

      res.status(200).json({
        success: true,
        users: result.rows,
      })
    } catch (error: any) {
      console.error('Get users error:', error)
      res.status(500).json({
        message: 'Error fetching users',
        error: error.message,
      })
    }
  } else if (req.method === 'POST') {
    // Create new admin user
    try {
      const { name, email, password, roleId } = req.body

      if (!name || !email || !password) {
        return res.status(400).json({
          message: 'Name, email, and password are required',
        })
      }

      // Check if user already exists
      const existing = await query(
        'SELECT id FROM admin_users WHERE email = $1',
        [email.toLowerCase().trim()]
      )

      if (existing.rows.length > 0) {
        return res.status(400).json({
          message: 'User with this email already exists',
        })
      }

      // Hash password
      const saltRounds = 10
      const passwordHash = await bcrypt.hash(password, saltRounds)

      // Create user
      const result = await query(
        `INSERT INTO admin_users (name, email, password_hash, role_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role_id`,
        [name.trim(), email.toLowerCase().trim(), passwordHash, roleId || null]
      )

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: result.rows[0],
      })
    } catch (error: any) {
      console.error('Create user error:', error)
      res.status(500).json({
        message: 'Error creating user',
        error: error.message,
      })
    }
  } else if (req.method === 'PUT') {
    // Update admin user
    try {
      const { id, name, email, roleId, isActive, password } = req.body

      if (!id) {
        return res.status(400).json({
          message: 'User ID is required',
        })
      }

      const updates: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (name) {
        updates.push(`name = $${paramIndex}`)
        params.push(name.trim())
        paramIndex++
      }

      if (email) {
        updates.push(`email = $${paramIndex}`)
        params.push(email.toLowerCase().trim())
        paramIndex++
      }

      if (roleId !== undefined) {
        updates.push(`role_id = $${paramIndex}`)
        params.push(roleId)
        paramIndex++
      }

      if (isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`)
        params.push(isActive)
        paramIndex++
      }

      if (password) {
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)
        updates.push(`password_hash = $${paramIndex}`)
        params.push(passwordHash)
        paramIndex++
      }

      if (updates.length === 0) {
        return res.status(400).json({
          message: 'No fields to update',
        })
      }

      updates.push(`updated_at = NOW()`)
      params.push(id)

      const result = await query(
        `UPDATE admin_users 
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id, name, email, role_id, is_active`,
        params
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'User not found',
        })
      }

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        user: result.rows[0],
      })
    } catch (error: any) {
      console.error('Update user error:', error)
      res.status(500).json({
        message: 'Error updating user',
        error: error.message,
      })
    }
  } else if (req.method === 'DELETE') {
    // Delete admin user
    try {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({
          message: 'User ID is required',
        })
      }

      const result = await query(
        'DELETE FROM admin_users WHERE id = $1 RETURNING id',
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: 'User not found',
        })
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      })
    } catch (error: any) {
      console.error('Delete user error:', error)
      res.status(500).json({
        message: 'Error deleting user',
        error: error.message,
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}

