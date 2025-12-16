// Database Backup Script (SQL Export)
// This script exports all data to SQL INSERT statements
// Useful when pg_dump is not available
//
// Usage:
//   node scripts/backup-database-sql.js
//
// Or with custom DATABASE_URL:
//   DATABASE_URL="your-connection-string" node scripts/backup-database-sql.js

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables')
  console.error('Please set DATABASE_URL or run:')
  console.error('  DATABASE_URL="your-connection-string" node scripts/backup-database-sql.js')
  process.exit(1)
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  // Neon requires SSL connections
  ssl: DATABASE_URL.includes('neon.tech') || DATABASE_URL.includes('neon.tech') 
    ? { rejectUnauthorized: false } 
    : DATABASE_URL.includes('sslmode=require') 
      ? { rejectUnauthorized: false } 
      : undefined
})

// Create backups directory
const backupDir = path.join(__dirname, '..', 'backups')
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
}

// Generate timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
const backupFile = path.join(backupDir, `medihouse_backup_${timestamp}.sql`)

// Tables to backup (excluding system tables)
const tablesToBackup = [
  'admin_users',
  'admin_roles',
  'admin_permissions',
  'role_permissions',
  'products',
  'orders',
  'order_items',
  'invoice_collections',
  'outstanding_bills',
  'supply',
  'attendance'
]

async function backupTable(tableName) {
  try {
    // Get all columns for the table
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tableName])
    
    if (columnsResult.rows.length === 0) {
      return `-- Table ${tableName} does not exist\n`
    }
    
    const columns = columnsResult.rows.map(row => row.column_name)
    
    // Get all data
    const dataResult = await pool.query(`SELECT * FROM ${tableName}`)
    
    if (dataResult.rows.length === 0) {
      return `-- Table ${tableName} is empty\n`
    }
    
    // Generate SQL
    let sql = `\n-- Backup of table: ${tableName}\n`
    sql += `-- ${dataResult.rows.length} rows\n\n`
    
    for (const row of dataResult.rows) {
      const values = columns.map(col => {
        const value = row[col]
        if (value === null) return 'NULL'
        if (typeof value === 'string') {
          // Escape single quotes
          return `'${value.replace(/'/g, "''")}'`
        }
        if (value instanceof Date) {
          return `'${value.toISOString()}'`
        }
        return value
      })
      
      sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`
    }
    
    sql += '\n'
    return sql
  } catch (error) {
    return `-- Error backing up ${tableName}: ${error.message}\n`
  }
}

async function createBackup() {
  console.log('Creating database backup...')
  console.log(`Backup file: ${backupFile}\n`)
  
  let sql = `-- MediHouse Database Backup\n`
  sql += `-- Created: ${new Date().toISOString()}\n`
  sql += `-- This backup contains INSERT statements for all data\n\n`
  sql += `BEGIN;\n\n`
  
  try {
    // Backup each table
    for (const table of tablesToBackup) {
      console.log(`Backing up ${table}...`)
      const tableSQL = await backupTable(table)
      sql += tableSQL
    }
    
    sql += `COMMIT;\n`
    
    // Write to file
    fs.writeFileSync(backupFile, sql, 'utf8')
    
    // Get file size
    const stats = fs.statSync(backupFile)
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)
    
    console.log('\n✅ Backup created successfully!')
    console.log(`   File: ${backupFile}`)
    console.log(`   Size: ${fileSizeMB} MB`)
    console.log('\nTo restore this backup, run:')
    console.log(`   psql $DATABASE_URL < ${backupFile}`)
    
    await pool.end()
  } catch (error) {
    console.error('❌ Backup failed:', error.message)
    await pool.end()
    process.exit(1)
  }
}

createBackup()

