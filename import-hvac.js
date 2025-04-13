// Import HVAC contractors from CSV to database
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import slugify from 'slugify';
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

// Generate a unique slug for a business name
async function createUniqueSlug(db, name) {
  const baseSlug = slugify(name, { 
    lower: true,
    strict: true,
    trim: true,
    replacement: '-'
  });
  
  // Check if the slug exists
  const result = await db.query(
    'SELECT slug FROM contractors WHERE slug LIKE $1 || \'%\'',
    [baseSlug]
  );
  
  if (result.rows.length === 0) {
    return baseSlug;
  }
  
  // Find the next available number
  const existingSlugs = result.rows.map(row => row.slug);
  let counter = 1;
  let newSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(newSlug)) {
    counter++;
    newSlug = `${baseSlug}-${counter}`;
  }
  
  return newSlug;
}

// Main import function
async function importProspects() {
  const csvFilePath = path.resolve('./Outscraper-20250408050616m08_hvac_contractor_+1 (1).csv');
  const client = await pool.connect();
  
  try {
    console.log('Starting import process...');
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
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const row of records) {
      try {
        // Skip rows without name
        if (!row.name || !row.name.trim()) {
          skipped++;
          continue;
        }
        
        // Generate slug
        const slug = await createUniqueSlug(client, row.name);
        
        // Prepare data
        const data = {
          name: row.name,
          slug: slug,
          email: row.email_1 || row.email_2 || row.email_3 || 'info@example.com', // Default email required
          phone: row.phone || row.phone_1 || '',
          phone_type: clean(row['phone.phones_enricher.carrier_type'] || row['phone_1.phones_enricher.carrier_type']),
          photos_count: clean(row.photos_count),
          site_url: `/${slug}`,
          place_id: clean(row.place_id),
          year_founded: clean(row.site?.company_insights?.founded_year),
          address: clean(row.full_address),
          street: clean(row.street),
          city: clean(row.city),
          state: clean(row.state),
          zip: clean(row.postal_code || row.zip),
          latitude: clean(row.latitude),
          longitude: clean(row.longitude),
          rating: clean(row.rating),
          review_count: clean(row.reviews),
          reviews_link: clean(row.reviews_link),
          working_hours: clean(row.working_hours),
          accepts_credit_cards: false,
          logo: clean(row.logo),
          verified_location: row.verified === 'True',
          location_link: clean(row.location_link),
          facebook: clean(row.facebook),
          instagram: clean(row.instagram),
          linkedin: clean(row.linkedin),
          twitter: clean(row.twitter),
          website: clean(row.site),
          website_title: clean(row.website_title),
          website_generator: clean(row.website_generator),
          website_keywords: clean(row.website_keywords),
          description: clean(row.description || row.site?.company_insights?.description),
          status: 'prospect',
          lead_source: 'outscraper_csv',
          active: true
        };
        
        // Convert to arrays for SQL query
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map((_, i) => `$${i+1}`).join(', ');
        
        // Insert the data
        const query = `
          INSERT INTO contractors (${columns.join(', ')})
          VALUES (${placeholders})
        `;
        
        await client.query(query, values);
        imported++;
        
        if (imported % 50 === 0) {
          console.log(`Imported ${imported} contractors`);
        }
      } catch (err) {
        console.error(`Error importing ${row.name}:`, err.message);
        errors++;
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Import summary:');
    console.log(`- Successfully imported: ${imported}`);
    console.log(`- Skipped: ${skipped}`);
    console.log(`- Errors: ${errors}`);
    
    return { imported, skipped, errors };
  } catch (err) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Import failed:', err);
    throw err;
  } finally {
    // Release the client
    client.release();
    // Close the pool
    await pool.end();
  }
}

// Run the import
importProspects()
  .then(result => {
    console.log('Import completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Import failed with error:', err);
    process.exit(1);
  });