/**
 * One-off runner for migrate-add-customer-name-to-invoice-collections.sql
 * Usage: node scripts/run-customer-name-migration.js
 */
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

function cleanConnectionString(connString) {
  if (!connString) {
    throw new Error('DATABASE_URL is not defined')
  }

  let cleaned = connString.trim()
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.slice(1, -1)
  }
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1)
  }
  if (cleaned.startsWith("psql '")) {
    cleaned = cleaned.replace(/^psql ['"]/, '').replace(/['"]$/, '')
  }
  return cleaned
}

async function main() {
  const connectionString = cleanConnectionString(process.env.DATABASE_URL)
  const requiresSSL = connectionString.includes('neon.tech') || connectionString.includes('sslmode=require')
  const pool = new Pool({
    connectionString,
    ssl: requiresSSL ? { rejectUnauthorized: false } : false,
  })

  const sqlPath = path.join(__dirname, 'migrate-add-customer-name-to-invoice-collections.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  try {
    await pool.query(sql)
    const col = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'invoice_collections' AND column_name = 'customer_name'`
    )
    const counts = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE customer_name IS NOT NULL AND TRIM(customer_name) <> '')::int AS filled
       FROM invoice_collections`
    )
    console.log('MIGRATION_OK', col.rows[0])
    console.log(`BACKFILL ${counts.rows[0].filled} of ${counts.rows[0].total} collections have a customer name`)
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error('MIGRATION_FAILED', error.message)
  process.exit(1)
})
