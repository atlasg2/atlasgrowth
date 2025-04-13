// Add photos_count column to contractors table
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

async function addPhotosCountColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Adding photos_count column to contractors table...');
    
    // Add the column if it doesn't exist
    await client.query(`
      ALTER TABLE contractors 
      ADD COLUMN IF NOT EXISTS photos_count TEXT;
    `);
    
    console.log('Column added successfully');
    
    // Verify the column was added
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'contractors' AND column_name = 'photos_count';
    `);
    
    if (result.rows.length > 0) {
      console.log('Verified: photos_count column exists');
      return true;
    } else {
      console.error('Error: photos_count column was not added');
      return false;
    }
  } catch (err) {
    console.error('Error:', err);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

addPhotosCountColumn()
  .then(success => {
    if (success) {
      console.log('Column addition completed successfully');
    } else {
      console.error('Column addition failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });