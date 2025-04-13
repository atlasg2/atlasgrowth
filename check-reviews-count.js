import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkImportStatus() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM google_reviews');
    console.log(`Total Google reviews in database: ${result.rows[0].count}`);
    console.log(`Total reviews in original file: 4362`);
    console.log(`Percentage imported: ${(result.rows[0].count / 4362 * 100).toFixed(2)}%`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

checkImportStatus();