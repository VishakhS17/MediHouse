import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import bcrypt from 'bcrypt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  try {
    // Query database for admin user (handle both old and new schema)
    const result = await query(
      `SELECT id, email, password_hash, name, 
       COALESCE(is_active, true) as is_active 
       FROM admin_users 
       WHERE email = $1`,
      [email.toLowerCase().trim()]
    )

    // Check if user exists
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const adminUser = result.rows[0]

    // Check if user is active (if column exists)
    if (adminUser.is_active === false) {
      return res.status(403).json({ message: 'Account is disabled' })
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, adminUser.password_hash)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Update last login timestamp
    await query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = $1',
      [adminUser.id]
    )

    // Successful authentication
    const admin = {
      id: adminUser.id.toString(),
      email: adminUser.email,
      name: adminUser.name,
    }

    // Generate a simple token (in production, use proper JWT with secret)
    const token = 'admin_token_' + Date.now() + '_' + Math.random().toString(36).substring(7)

    res.status(200).json({
      success: true,
      token,
      admin,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

