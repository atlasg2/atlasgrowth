// Add new columns to contractors table
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

async function addColumns() {
  try {
    // Create a simple ALTER TABLE statement to add our new columns
    console.log('Adding new columns to contractors table...');
    await pool.query(`
      ALTER TABLE contractors 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'prospect',
      ADD COLUMN IF NOT EXISTS last_contacted_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS lead_source TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
    console.log('Columns added successfully');
    
    // Check that the columns were added
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contractors' AND 
      (column_name = 'status' OR 
       column_name = 'last_contacted_date' OR 
       column_name = 'lead_source' OR 
       column_name = 'notes');
    `);
    
    console.log('Added columns:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name}`);
    });
    
    return true;
  } catch (err) {
    console.error('Error:', err);
    return false;
  } finally {
    await pool.end();
  }
}

addColumns()
  .then(success => {
    if (success) {
      console.log('Column addition process completed successfully');
    } else {
      console.error('Column addition failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });