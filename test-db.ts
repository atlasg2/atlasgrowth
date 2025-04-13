// Simple script to test database connection
import { pool, db } from './server/db';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await db.select({ now: sql`NOW()` }).limit(1);
    console.log('Connection successful!', result);
    return { success: true };
  } catch (error) {
    console.error('Connection failed:', error);
    return { success: false, error };
  } finally {
    await pool.end();
  }
}

testConnection()
  .then(result => {
    console.log('Test result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test error:', error);
    process.exit(1);
  });