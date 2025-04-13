// Simple DB test script
import pg from 'pg';
const { Pool } = pg;

// Use the database URL directly hardcoded for this test
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_wvPnH3r6TsVf@ep-royal-dawn-a5aax48l.us-east-2.aws.neon.tech/neondb?sslmode=require"
});

async function testDb() {
  const client = await pool.connect();
  try {
    // Create a test table
    await client.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Insert a test row
    await client.query(`
      INSERT INTO test_table (name) VALUES ($1)
    `, [`Test entry ${Date.now()}`]);
    
    // Query the test data
    const result = await client.query('SELECT * FROM test_table ORDER BY created_at DESC LIMIT 5');
    
    console.log('Database connection successful!');
    console.log('Test rows:', result.rows);
    
    return true;
  } catch (err) {
    console.error('Database connection failed:', err);
    return false;
  } finally {
    client.release();
    await pool.end();
  }
}

testDb()
  .then(success => {
    console.log('Test completed with ' + (success ? 'success' : 'failure'));
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });