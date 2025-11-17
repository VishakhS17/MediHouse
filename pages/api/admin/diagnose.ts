import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '@/lib/db'

// Diagnostic endpoint to check database connection and table status
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
    errors: [],
  }

  // Check 1: DATABASE_URL exists
  try {
    const hasDatabaseUrl = !!process.env.DATABASE_URL
    diagnostics.checks.databaseUrlExists = hasDatabaseUrl
    if (!hasDatabaseUrl) {
      diagnostics.errors.push('DATABASE_URL environment variable is not set')
    } else {
      // Mask the password in the URL for security
      const maskedUrl = process.env.DATABASE_URL?.replace(
        /:([^:@]+)@/,
        ':***@'
      )
      diagnostics.checks.databaseUrl = maskedUrl
    }
  } catch (error: any) {
    diagnostics.errors.push(`Error checking DATABASE_URL: ${error.message}`)
  }

  // Check 2: Database connection
  try {
    const connectionTest = await query('SELECT NOW() as current_time, version() as pg_version')
    diagnostics.checks.databaseConnection = true
    diagnostics.checks.databaseTime = connectionTest.rows[0]?.current_time
    diagnostics.checks.postgresVersion = connectionTest.rows[0]?.pg_version?.split(' ')[0]
  } catch (error: any) {
    diagnostics.checks.databaseConnection = false
    diagnostics.errors.push(`Database connection failed: ${error.message}`)
    return res.status(200).json(diagnostics) // Return early if can't connect
  }

  // Check 3: Products table exists
  try {
    const productsTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
      )
    `)
    diagnostics.checks.productsTableExists = productsTableCheck.rows[0]?.exists || false

    if (diagnostics.checks.productsTableExists) {
      const productsCount = await query('SELECT COUNT(*) as count FROM products')
      diagnostics.checks.productsCount = parseInt(productsCount.rows[0]?.count || '0')
      
      const productsWithStock = await query(
        'SELECT COUNT(*) as count FROM products WHERE stock_quantity > 0'
      )
      diagnostics.checks.productsWithStock = parseInt(productsWithStock.rows[0]?.count || '0')
    }
  } catch (error: any) {
    diagnostics.checks.productsTableExists = false
    diagnostics.errors.push(`Error checking products table: ${error.message}`)
  }

  // Check 4: Admin users table exists
  try {
    const adminTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_users'
      )
    `)
    diagnostics.checks.adminUsersTableExists = adminTableCheck.rows[0]?.exists || false

    if (diagnostics.checks.adminUsersTableExists) {
      const adminCount = await query('SELECT COUNT(*) as count FROM admin_users')
      diagnostics.checks.adminUsersCount = parseInt(adminCount.rows[0]?.count || '0')
      
      const activeAdminCount = await query(
        'SELECT COUNT(*) as count FROM admin_users WHERE COALESCE(is_active, true) = true'
      )
      diagnostics.checks.activeAdminUsersCount = parseInt(activeAdminCount.rows[0]?.count || '0')
    }
  } catch (error: any) {
    diagnostics.checks.adminUsersTableExists = false
    diagnostics.errors.push(`Error checking admin_users table: ${error.message}`)
  }

  // Check 5: Orders table exists
  try {
    const ordersTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      )
    `)
    diagnostics.checks.ordersTableExists = ordersTableCheck.rows[0]?.exists || false

    if (diagnostics.checks.ordersTableExists) {
      const ordersCount = await query('SELECT COUNT(*) as count FROM orders')
      diagnostics.checks.ordersCount = parseInt(ordersCount.rows[0]?.count || '0')
    }
  } catch (error: any) {
    diagnostics.checks.ordersTableExists = false
    diagnostics.errors.push(`Error checking orders table: ${error.message}`)
  }

  // Check 6: Test a simple products query
  try {
    if (diagnostics.checks.productsTableExists) {
      const testQuery = await query(
        'SELECT id, name, stock_quantity FROM products LIMIT 5'
      )
      diagnostics.checks.testProductsQuery = true
      diagnostics.checks.sampleProducts = testQuery.rows
    }
  } catch (error: any) {
    diagnostics.checks.testProductsQuery = false
    diagnostics.errors.push(`Error testing products query: ${error.message}`)
  }

  // Summary
  diagnostics.summary = {
    allChecksPassed: diagnostics.errors.length === 0,
    totalErrors: diagnostics.errors.length,
    databaseConnected: diagnostics.checks.databaseConnection === true,
    tablesExist: 
      diagnostics.checks.productsTableExists === true &&
      diagnostics.checks.adminUsersTableExists === true &&
      diagnostics.checks.ordersTableExists === true,
  }

  const statusCode = diagnostics.summary.allChecksPassed ? 200 : 500
  res.status(statusCode).json(diagnostics)
}

