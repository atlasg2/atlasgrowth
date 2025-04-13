import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTable() {
  try {
    // Drop the table if it exists
    await pool.query('DROP TABLE IF EXISTS google_reviews');
    
    // Create the table
    const createTableSQL = `
      CREATE TABLE google_reviews (
        id SERIAL PRIMARY KEY,
        contractor_id INTEGER REFERENCES contractors(id),
        place_id TEXT NOT NULL,
        author_name TEXT,
        stars INTEGER,
        total_score NUMERIC,
        review_text TEXT,
        published_at_date TIMESTAMP,
        response_from_owner_text TEXT,
        response_from_owner_date TIMESTAMP,
        latitude TEXT,
        longitude TEXT,
        raw_data JSONB,
        imported_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    await pool.query(createTableSQL);
    console.log('Table google_reviews created successfully');
    
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    pool.end();
  }
}

createTable();