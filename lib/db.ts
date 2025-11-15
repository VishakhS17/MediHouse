import { Pool } from 'pg'

// Clean connection string helper
function cleanConnectionString(connString: string | undefined): string {
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

// Check if it's a Neon database
function isNeonDatabase(connString: string): boolean {
  return connString.includes('neon.tech')
}

// Create a connection pool
let pool: Pool | null = null

function getPool(): Pool {
  if (pool) {
    return pool
  }

  const connectionString = cleanConnectionString(process.env.DATABASE_URL)
  const isNeon = isNeonDatabase(connectionString)
  const requiresSSL = isNeon || connectionString.includes('sslmode=require')

  pool = new Pool({
    connectionString: connectionString,
    ssl: requiresSSL
      ? {
          rejectUnauthorized: false,
        }
      : false,
    connectionTimeoutMillis: 10000,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
  })

  return pool
}

// Query helper function
export async function query(text: string, params?: any[]) {
  const pool = getPool()
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error', { text, error })
    throw error
  }
}

// Close the pool (useful for cleanup)
export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

