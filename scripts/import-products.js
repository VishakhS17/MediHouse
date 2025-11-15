const XLSX = require('xlsx');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
} else {
  console.error('❌ .env.local file not found. Please create it with DATABASE_URL');
  process.exit(1);
}

// Create PostgreSQL connection pool
// Neon PostgreSQL requires SSL, so we enable it by default
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Clean the connection string - remove quotes and extra whitespace
connectionString = connectionString.trim();
if (connectionString.startsWith("'") && connectionString.endsWith("'")) {
  connectionString = connectionString.slice(1, -1);
}
if (connectionString.startsWith('"') && connectionString.endsWith('"')) {
  connectionString = connectionString.slice(1, -1);
}
// Remove psql prefix if present
if (connectionString.startsWith("psql '")) {
  connectionString = connectionString.replace(/^psql ['"]/, '').replace(/['"]$/, '');
}

// Check if it's a Neon database
const isNeon = connectionString.includes('neon.tech');
const requiresSSL = isNeon || connectionString.includes('sslmode=require') || connectionString.includes('sslmode=require');

console.log('📡 Database connection info:');
console.log('   Type:', isNeon ? 'Neon PostgreSQL' : 'PostgreSQL');
console.log('   SSL required:', requiresSSL ? 'Yes' : 'No');
console.log('   Connection string format:', connectionString.substring(0, 20) + '...' + connectionString.substring(connectionString.length - 20), '\n');

const pool = new Pool({
  connectionString: connectionString,
  ssl: requiresSSL ? {
    rejectUnauthorized: false
  } : false,
  // Add connection timeout for Neon
  connectionTimeoutMillis: 10000,
});

async function importProducts() {
  let client;
  
  try {
    // Test connection first
    console.log('🔌 Connecting to database...');
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connected to database:', result.rows[0].now, '\n');
    
    console.log('📖 Reading ProdList.xlsx...\n');
    
    // Read Excel file
    const workbook = XLSX.readFile('ProdList.xlsx');
    const worksheet = workbook.Sheets['Sheet1'];
    
    if (!worksheet) {
      throw new Error('Sheet1 not found in Excel file');
    }
    
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:ZZ2000');
    
    console.log(`📊 Excel dimensions: ${range.e.r + 1} rows × ${range.e.c + 1} columns\n`);
    
    // Step 1: Extract brand names from first row (index 0)
    console.log('🔍 Extracting brand names from first row...');
    
    const brands = [];
    for (let C = 0; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      const cell = worksheet[cellAddress];
      if (cell && cell.v !== undefined && cell.v !== null) {
        const value = cell.v.toString().trim();
        if (value && value.length > 0 && !value.startsWith('__')) {
          // Clean up brand name (remove "(BRAND)" if present)
          const cleanName = value.replace(/\(BRAND\)/gi, '').trim();
          brands.push({
            col: C,
            originalName: value,
            cleanName: cleanName
          });
        }
      }
    }
    
    console.log(`✅ Found ${brands.length} brands\n`);
    
    // Step 2: Create database table
    console.log('🔨 Creating products table...');
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/001_create_products_table.sql'),
      'utf8'
    );
    
    // Execute each statement separately
    const statements = schemaSQL.split(';').filter(s => s.trim().length > 0);
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement.trim() + ';');
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate') &&
              !error.message.includes('does not exist')) {
            console.warn('⚠️  Warning:', error.message);
          }
        }
      }
    }
    console.log('✅ Products table ready\n');
    
    // Step 3: Extract and import products
    console.log('📦 Extracting products from each brand column...\n');
    
    const allProducts = [];
    
    for (const brand of brands) {
      const products = [];
      
      // Start from row 2 (index 1) since row 1 has brand names
      for (let R = 1; R <= range.e.r; R++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: brand.col });
        const cell = worksheet[cellAddress];
        
        if (cell && cell.v !== undefined && cell.v !== null) {
          const productName = cell.v.toString().trim();
          if (productName && productName.length > 0) {
            products.push({
              name: productName,
              manufacturer: brand.cleanName
            });
          }
        }
      }
      
      console.log(`   ${brand.cleanName.substring(0, 50).padEnd(50, ' ')}: ${String(products.length).padStart(4, ' ')} products`);
      allProducts.push(...products);
    }
    
    console.log(`\n✅ Total products extracted: ${allProducts.length}\n`);
    
    // Step 4: Import products into database
    console.log('📥 Importing products into database...\n');
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const product of allProducts) {
      try {
        // Check if product already exists (by name and manufacturer)
        const checkQuery = `
          SELECT id FROM products 
          WHERE LOWER(name) = LOWER($1) 
          AND LOWER(manufacturer) = LOWER($2)
        `;
        const exists = await client.query(checkQuery, [product.name, product.manufacturer]);
        
        if (exists.rows.length > 0) {
          // Update existing product
          const updateQuery = `
            UPDATE products 
            SET updated_at = NOW(), is_active = true
            WHERE id = $1
          `;
          await client.query(updateQuery, [exists.rows[0].id]);
          updated++;
        } else {
          // Insert new product
          const insertQuery = `
            INSERT INTO products (name, manufacturer, is_active)
            VALUES ($1, $2, true)
          `;
          await client.query(insertQuery, [product.name, product.manufacturer]);
          imported++;
        }
      } catch (error) {
        console.error(`❌ Error importing "${product.name}" from "${product.manufacturer}":`, error.message);
        skipped++;
      }
    }
    
    console.log(`\n✅ Import complete!`);
    console.log(`   New products: ${imported}`);
    console.log(`   Updated products: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    
    // Get final count
    const countResult = await client.query('SELECT COUNT(*) FROM products WHERE is_active = true');
    console.log(`   Total active products in database: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run import
importProducts();

