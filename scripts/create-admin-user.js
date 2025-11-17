const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');

// Load environment variables
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
} else {
  console.error('❌ .env.local file not found. Please create it with DATABASE_URL');
  process.exit(1);
}

// Admin credentials - read from environment variables or command line arguments
// Usage: node create-admin-user.js [email] [password] [name]
// Or set: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@medihouse.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.argv[3] || 'MediHouse@170303';
const ADMIN_NAME = process.env.ADMIN_NAME || process.argv[4] || 'Admin User';

// Get and clean connection string
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Clean the connection string
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

// Check if it's a Neon database
const isNeon = connectionString.includes('neon.tech');
const requiresSSL = isNeon || connectionString.includes('sslmode=require');

console.log('📡 Database connection info:');
console.log('   Type:', isNeon ? 'Neon PostgreSQL' : 'PostgreSQL');
console.log('   SSL required:', requiresSSL ? 'Yes' : 'No', '\n');

const pool = new Pool({
  connectionString: connectionString,
  ssl: requiresSSL ? {
    rejectUnauthorized: false
  } : false,
  connectionTimeoutMillis: 10000,
});

async function createAdminUser() {
  let client;
  
  try {
    // Test connection
    console.log('🔌 Connecting to database...');
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connected to database:', result.rows[0].now, '\n');
    
    // Check if admin_users table exists
    console.log('🔍 Checking if admin_users table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ admin_users table does not exist. Please run the migration first:');
      console.error('   npm run migrate-admin');
      process.exit(1);
    }
    
    // Check if admin user already exists
    console.log('🔍 Checking if admin user already exists...');
    const existingUser = await client.query(
      'SELECT id, email FROM admin_users WHERE email = $1',
      [ADMIN_EMAIL]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Email: ${existingUser.rows[0].email}`);
      console.log(`   ID: ${existingUser.rows[0].id}`);
      console.log('\n   To create a different user, use a different email address.');
      console.log('   Usage: node create-admin-user.js newuser@example.com NewPassword123 "New User Name"');
      process.exit(0);
    }
    
    // Hash the password
    console.log('🔐 Hashing password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);
    console.log('✅ Password hashed successfully\n');
    
    // Insert admin user
    console.log('👤 Creating admin user...');
    const insertResult = await client.query(
      `INSERT INTO admin_users (email, password_hash, name, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, created_at`,
      [ADMIN_EMAIL, passwordHash, ADMIN_NAME, true]
    );
    
    const newUser = insertResult.rows[0];
    console.log('✅ Admin user created successfully!');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Name: ${newUser.name}`);
    console.log(`   Created: ${newUser.created_at}`);
    console.log('\n✅ Setup complete! Admin user created successfully.');
    console.log(`   Email: ${newUser.email}`);
    console.log('   Password: [stored securely in database]');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
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

// Run script
createAdminUser();

