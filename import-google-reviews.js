import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function importGoogleReviews() {
  try {
    console.log('Starting Google Reviews import process...');
    
    // Read the JSON file
    const jsonData = fs.readFileSync('./dataset_Google-Maps-Reviews-Scraper_2025-04-12_09-29-48-935.json', 'utf8');
    const reviews = JSON.parse(jsonData);
    
    console.log(`Found ${reviews.length} reviews in the JSON file`);
    
    // Get all contractors to map placeId to contractorId
    const contractorsResult = await pool.query('SELECT id, place_id FROM contractors WHERE place_id IS NOT NULL');
    const allContractors = contractorsResult.rows;
    
    // Create a map for quick lookups
    const contractorMap = {};
    allContractors.forEach(contractor => {
      if (contractor.place_id) {
        contractorMap[contractor.place_id] = contractor.id;
      }
    });
    
    console.log(`Found ${Object.keys(contractorMap).length} contractors with placeIds`);
    
    // Track import stats
    let imported = 0;
    let skipped = 0;
    let noMatch = 0;
    
    // Process each review
    for (const review of reviews) {
      // Skip reviews without placeId
      if (!review.placeId) {
        skipped++;
        continue;
      }
      
      // Find matching contractor
      const contractorId = contractorMap[review.placeId];
      
      // Skip if no matching contractor found
      if (!contractorId) {
        noMatch++;
        continue;
      }
      
      try {
        // Check if review already exists to avoid duplicates
        // Using a combination of placeId, authorName, and publishedAtDate as a unique key
        const existingQuery = {
          text: 'SELECT id FROM google_reviews WHERE place_id = $1 AND author_name = $2 AND published_at_date = $3',
          values: [review.placeId, review.name, review.publishedAtDate]
        };
        
        const existingResult = await pool.query(existingQuery);
        
        if (existingResult.rows.length > 0) {
          skipped++;
          continue;
        }
        
        // Extract location data if available
        const latitude = review.location?.lat ? String(review.location.lat) : null;
        const longitude = review.location?.lng ? String(review.location.lng) : null;
        
        // Insert the review
        const insertQuery = {
          text: `INSERT INTO google_reviews 
                (contractor_id, place_id, author_name, stars, total_score, review_text, 
                 published_at_date, response_from_owner_text, response_from_owner_date, 
                 latitude, longitude, raw_data) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          values: [
            contractorId,
            review.placeId,
            review.name,
            review.stars,
            review.totalScore,
            review.text,
            review.publishedAtDate,
            review.responseFromOwnerText,
            review.responseFromOwnerDate,
            latitude,
            longitude,
            JSON.stringify(review)
          ]
        };
        
        await pool.query(insertQuery);
        
        imported++;
        
        // Log progress every 100 reviews
        if (imported % 100 === 0) {
          console.log(`Imported ${imported} reviews so far...`);
        }
      } catch (error) {
        console.error(`Error importing review from ${review.name}:`, error);
        skipped++;
      }
    }
    
    console.log('Import completed!');
    console.log('Summary:');
    console.log(`- Total reviews processed: ${reviews.length}`);
    console.log(`- Successfully imported: ${imported}`);
    console.log(`- Skipped (already exists): ${skipped}`);
    console.log(`- No matching contractor: ${noMatch}`);
    
  } catch (error) {
    console.error('Error during import process:', error);
  } finally {
    pool.end();
  }
}

// Run the import function
importGoogleReviews();