import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'
import bcrypt from 'bcrypt'

// This is a one-time setup endpoint
// After creating the admin user, you should disable or remove this endpoint for security
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Check if admin_users table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_users'
      );
    `)

    if (!tableCheck.rows[0].exists) {
      return res.status(500).json({ 
        message: 'admin_users table does not exist. Please run migrations first.',
        instructions: 'Run: npm run migrate-admin'
      })
    }

    // Get user details from request body or use defaults
    const { email, password, name } = req.body
    
    const ADMIN_EMAIL = (email || 'admin@medihouse.com').toLowerCase().trim()
    const ADMIN_PASSWORD = password || 'MediHouse@170303'
    const ADMIN_NAME = name || 'Admin User'

    // Check if admin user already exists
    const existingUser = await query(
      'SELECT id, email FROM admin_users WHERE email = $1',
      [ADMIN_EMAIL]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Admin user already exists',
        userId: existingUser.rows[0].id,
        email: existingUser.rows[0].email,
        note: 'Use a different email or update the existing user'
      })
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds)

    // Insert admin user
    const insertResult = await query(
      `INSERT INTO admin_users (email, password_hash, name, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, created_at`,
      [ADMIN_EMAIL, passwordHash, ADMIN_NAME, true]
    )

    const newUser = insertResult.rows[0]

    res.status(200).json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        created_at: newUser.created_at,
      },
      credentials: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
      note: 'Please delete or disable this endpoint after setup for security',
      usage: 'POST to /api/admin/setup with optional body: { "email": "user@example.com", "password": "password123", "name": "User Name" }',
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    res.status(500).json({
      message: 'Error creating admin user',
      error: error.message,
    })
  }
}

