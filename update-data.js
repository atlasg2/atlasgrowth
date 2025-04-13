// Update contractor data with phone type and photos count
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Clean and validate data
function clean(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

// Main update function
async function updateContractors() {
  const csvFilePath = path.resolve('./Outscraper-20250408050616m08_hvac_contractor_+1 (1).csv');
  const client = await pool.connect();
  
  try {
    console.log('Starting update process...');
    console.log(`Reading CSV file: ${csvFilePath}`);
    
    // Read CSV file
    const parser = fs.createReadStream(csvFilePath).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      })
    );
    
    const records = [];
    for await (const record of parser) {
      records.push(record);
    }
    
    console.log(`Found ${records.length} records in CSV file`);
    
    // Begin transaction
    await client.query('BEGIN');
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const row of records) {
      try {
        // Skip rows without name
        if (!row.name || !row.name.trim()) {
          skippedCount++;
          continue;
        }
        
        // Get phone type and photos count
        const phoneType = clean(row['phone.phones_enricher.carrier_type'] || row['phone_1.phones_enricher.carrier_type']);
        const photosCount = clean(row.photos_count);
        
        // Update the contractor
        const query = `
          UPDATE contractors
          SET phone_type = $1, photos_count = $2
          WHERE name = $3
        `;
        
        const result = await client.query(query, [phoneType, photosCount, row.name]);
        
        if (result.rowCount > 0) {
          updatedCount++;
          if (updatedCount % 100 === 0) {
            console.log(`Updated ${updatedCount} contractors`);
          }
        } else {
          skippedCount++;
        }
      } catch (err) {
        console.error(`Error updating ${row.name}:`, err.message);
        errorCount++;
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Update summary:');
    console.log(`- Successfully updated: ${updatedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
    return { updatedCount, skippedCount, errorCount };
  } catch (err) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Update failed:', err);
    throw err;
  } finally {
    // Release the client
    client.release();
    // Close the pool
    await pool.end();
  }
}

// Run the update
updateContractors()
  .then(result => {
    console.log('Update completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Update failed with error:', err);
    process.exit(1);
  });