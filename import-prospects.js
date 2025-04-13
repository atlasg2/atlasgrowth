// Import HVAC contractor prospects from CSV file to database
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import slugify from 'slugify';
import { db, pool } from './server/db';
import * as schema from './shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Mapping function to convert CSV columns to database fields
function mapCsvRowToContractor(row) {
  // Generate a unique slug from the business name
  const baseSlug = slugify(row.name, { 
    lower: true,
    strict: true,
    trim: true
  });
  
  // Map the data from CSV to our database schema using DB column names
  return {
    name: row.name || '',
    slug: baseSlug, // We'll check for uniqueness later
    place_id: row.place_id || '',
    site_url: '', // Will be generated
    year_founded: row.site?.company_insights?.founded_year || '',
    email: row.email_1 || row.email_2 || row.email_3 || '', // Use first available email
    phone: row.phone || row.phone_1 || '',
    phone_type: row.phone_1?.phones_enricher?.carrier_type || '',
    address: row.full_address || row.address || '',
    street: row.street || '',
    city: row.city || '',
    state: row.state || '',
    zip: row.postal_code || row.zip || '',
    latitude: row.latitude ? String(row.latitude) : '',
    longitude: row.longitude ? String(row.longitude) : '',
    rating: row.rating ? String(row.rating) : '',
    review_count: row.reviews ? String(row.reviews) : '',
    reviews_link: row.reviews_link || '',
    working_hours: row.working_hours || '',
    accepts_credit_cards: false, // Default value
    logo: row.logo || '',
    verified_location: row.verified === 'True',
    location_link: row.location_link || '',
    facebook: row.facebook || '',
    instagram: row.instagram || '',
    linkedin: row.linkedin || '',
    twitter: row.twitter || '',
    website: row.site || '',
    website_title: row.website_title || '',
    website_generator: row.website_generator || '',
    website_keywords: row.website_keywords || '',
    description: row.description || row.site?.company_insights?.description || '',
    status: 'prospect',
    lead_source: 'outscraper_csv',
    notes: '',
    active: true
  };
}

// Function to check if a slug exists and create a unique version if needed
async function createUniqueSlug(baseSlug) {
  // Check if the slug already exists
  const existingContractors = await db
    .select({ slug: schema.contractors.slug })
    .from(schema.contractors)
    .where(schema.contractors.slug.like(`${baseSlug}%`));
  
  if (existingContractors.length === 0) {
    return baseSlug; // Base slug is unique
  }
  
  // Find the next available numeric suffix
  const existingSlugs = existingContractors.map(c => c.slug);
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
  
  console.log('Starting import process...');
  console.log(`Reading CSV file: ${csvFilePath}`);
  
  try {
    // Read the CSV file
    const parser = fs
      .createReadStream(csvFilePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }));
      
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    console.log('Processing CSV rows...');
    
    for await (const row of parser) {
      try {
        // Skip rows without a name
        if (!row.name || row.name.trim() === '') {
          skippedCount++;
          continue;
        }
        
        // Map CSV data to contractor schema
        const contractorData = mapCsvRowToContractor(row);
        
        // Create a unique slug
        contractorData.slug = await createUniqueSlug(contractorData.slug);
        
        // Generate site URL for the prospect
        contractorData.site_url = `/${contractorData.slug}`;
        
        // Insert into database using raw SQL (more direct control)
        // First, create the query with all the fields we're inserting
        const fields = Object.keys(contractorData).join(', ');
        const placeholders = Object.keys(contractorData).map((_, idx) => `$${idx + 1}`).join(', ');
        
        // Create the SQL query
        const query = `
          INSERT INTO contractors (${fields})
          VALUES (${placeholders})
        `;
        
        // Execute the query with all values
        await pool.query(query, Object.values(contractorData));
        
        importedCount++;
        if (importedCount % 100 === 0) {
          console.log(`Imported ${importedCount} contractors...`);
        }
      } catch (err) {
        console.error(`Error importing row: ${row.name}`, err);
        errorCount++;
      }
    }
    
    console.log('\nImport completed:');
    console.log(`- Successfully imported: ${importedCount} contractors`);
    console.log(`- Skipped: ${skippedCount} rows`);
    console.log(`- Errors: ${errorCount} rows`);
    
    return { importedCount, skippedCount, errorCount };
  } catch (err) {
    console.error('Import failed:', err);
    throw err;
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the import
importProspects()
  .then(result => {
    console.log('Import process finished successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Import failed with error:', err);
    process.exit(1);
  });