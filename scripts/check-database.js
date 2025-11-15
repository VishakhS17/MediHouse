const { Pool } = require('pg');
const fs = require('fs');

// Load environment variables
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
} else {
  console.error('❌ .env.local file not found');
  process.exit(1);
}

// Get and clean connection string
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

connectionString = connectionString.trim();
if (connectionString.startsWith("'") && connectionString.endsWith("'")) {
  connectionString = connectionString.slice(1, -1);
}
if (connectionString.startsWith('"') && connectionString.endsWith('"')) {
  connectionString = connectionString.slice(1, -1);
}
if (connectionString.startsWith("psql '")) {
  connectionString = connectionString.replace(/^psql ['"]/, '').replace(/['"]$/, '');
}

const isNeon = connectionString.includes('neon.tech');
const requiresSSL = isNeon || connectionString.includes('sslmode=require');

const pool = new Pool({
  connectionString: connectionString,
  ssl: requiresSSL ? {
    rejectUnauthorized: false
  } : false,
  connectionTimeoutMillis: 10000,
});

async function checkDatabase() {
  let client;
  
  try {
    client = await pool.connect();
    
    // Get total count
    const countResult = await client.query('SELECT COUNT(*) as count FROM products');
    const totalCount = parseInt(countResult.rows[0].count);
    
    console.log('📊 Database Status:');
    console.log(`   Total products: ${totalCount}\n`);
    
    // Get count by brand
    const brandsResult = await client.query(`
      SELECT manufacturer, COUNT(*) as count 
      FROM products 
      GROUP BY manufacturer 
      ORDER BY count DESC
    `);
    
    console.log('📦 Products by brand:');
    brandsResult.rows.forEach(b => {
      console.log(`   ${b.manufacturer.padEnd(50)}: ${String(b.count).padStart(4)} products`);
    });
    
    // Get some sample products
    const samples = await client.query('SELECT id, name, manufacturer FROM products LIMIT 5');
    console.log('\n📋 Sample products:');
    samples.rows.forEach(p => {
      console.log(`   [${p.id}] ${p.name} (${p.manufacturer})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkDatabase();

