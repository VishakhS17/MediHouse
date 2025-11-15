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

async function runMigration() {
  let client;
  
  try {
    // Test connection
    console.log('🔌 Connecting to database...');
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connected to database:', result.rows[0].now, '\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/001_create_products_table.sql');
    console.log('📖 Reading migration file:', migrationPath);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Parse SQL statements properly, handling dollar-quoted strings
    function parseSQLStatements(sql) {
      const statements = [];
      let currentStatement = '';
      let inDollarQuote = false;
      let dollarTag = '';
      let i = 0;
      
      while (i < sql.length) {
        const char = sql[i];
        const nextChar = sql[i + 1];
        
        // Check for dollar-quoted strings ($$ ... $$)
        if (char === '$' && nextChar === '$') {
          // Find the end of the dollar tag
          let tagEnd = i + 2;
          while (tagEnd < sql.length && sql[tagEnd] !== '$') {
            tagEnd++;
          }
          
          if (tagEnd < sql.length && sql[tagEnd] === '$') {
            dollarTag = sql.substring(i, tagEnd + 1);
            
            if (!inDollarQuote) {
              // Starting dollar quote
              inDollarQuote = true;
              currentStatement += dollarTag;
              i = tagEnd + 1;
              continue;
            } else if (sql.substring(i, tagEnd + 1) === dollarTag) {
              // Ending dollar quote
              inDollarQuote = false;
              currentStatement += dollarTag;
              i = tagEnd + 1;
              continue;
            }
          }
        }
        
        // If we're not in a dollar quote, check for semicolons
        if (!inDollarQuote && char === ';') {
          const trimmed = currentStatement.trim();
          if (trimmed.length > 0) {
            statements.push(trimmed);
          }
          currentStatement = '';
          i++;
          continue;
        }
        
        currentStatement += char;
        i++;
      }
      
      // Add final statement if any
      const trimmed = currentStatement.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      
      return statements;
    }
    
    // Parse statements
    const statements = parseSQLStatements(migrationSQL)
      .map(s => s.trim())
      .filter(s => {
        // Filter out empty statements and pure comments
        const cleaned = s.replace(/--.*$/gm, '').trim();
        return cleaned.length > 0;
      });
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      let statement = statements[i];
      // Remove comments from statement (but preserve dollar-quoted content)
      statement = statement.replace(/--.*$/gm, '').trim();
      
      if (statement.length > 0) {
        try {
          const statementPreview = statement.length > 80 
            ? statement.substring(0, 80) + '...' 
            : statement;
          console.log(`   [${i + 1}/${statements.length}] Executing: ${statementPreview}`);
          
          // Add semicolon if not present
          const finalStatement = statement.endsWith(';') ? statement : statement + ';';
          await client.query(finalStatement);
          console.log(`   ✅ Statement ${i + 1} executed successfully\n`);
        } catch (error) {
          // Ignore "already exists" errors for CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate')) {
            console.log(`   ⚠️  Statement ${i + 1} skipped (already exists): ${error.message.split('\n')[0]}\n`);
          } 
          // Ignore "does not exist" errors for DROP statements (they're safe to ignore)
          else if (error.message.includes('does not exist') && 
                   (statement.toUpperCase().includes('DROP') || 
                    statement.toUpperCase().includes('DROP TRIGGER'))) {
            console.log(`   ⚠️  Statement ${i + 1} skipped (does not exist, safe to ignore): ${error.message.split('\n')[0]}\n`);
          } else {
            console.error(`   ❌ Error in statement ${i + 1}:`);
            console.error(`   Error: ${error.message}`);
            console.error(`   Statement preview: ${statement.substring(0, 200)}...`);
            throw error;
          }
        }
      }
    }
    
    // Verify table was created
    console.log('🔍 Verifying table creation...');
    const tableCheck = await client.query(`
      SELECT 
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Products table created successfully!');
      console.log(`   Columns: ${tableCheck.rows.length}`);
      tableCheck.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('⚠️  Table verification: No columns found');
    }
    
    // Check indexes
    const indexCheck = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'products';
    `);
    
    if (indexCheck.rows.length > 0) {
      console.log(`\n✅ Indexes created: ${indexCheck.rows.length}`);
      indexCheck.rows.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
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

// Run migration
runMigration();

