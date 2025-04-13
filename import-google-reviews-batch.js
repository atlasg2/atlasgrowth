import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Configuration
const BATCH_SIZE = 1000; // Number of reviews to process in each batch
const START_FROM = 3400;   // Where to start in the array (change this for resuming)

async function importGoogleReviews() {
  try {
    console.log('Starting Google Reviews import process...');
    
    // Read the JSON file
    const jsonData = fs.readFileSync('./dataset_Google-Maps-Reviews-Scraper_2025-04-12_09-29-48-935.json', 'utf8');
    const allReviews = JSON.parse(jsonData);
    
    // Get the batch to process
    const endIndex = Math.min(START_FROM + BATCH_SIZE, allReviews.length);
    const reviews = allReviews.slice(START_FROM, endIndex);
    
    console.log(`Processing batch from index ${START_FROM} to ${endIndex-1} (total reviews: ${allReviews.length})`);
    
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
    
    // Process each review in the batch
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
        console.log(`Imported review #${START_FROM + imported} by ${review.name}`);
      } catch (error) {
        console.error(`Error importing review from ${review.name}:`, error);
        skipped++;
      }
    }
    
    // Calculate next batch starting point
    const nextBatchStart = endIndex;
    const isComplete = endIndex >= allReviews.length;
    
    console.log('Batch import completed!');
    console.log('Summary:');
    console.log(`- Batch size: ${reviews.length}`);
    console.log(`- Successfully imported: ${imported}`);
    console.log(`- Skipped (already exists): ${skipped}`);
    console.log(`- No matching contractor: ${noMatch}`);
    
    if (isComplete) {
      console.log('ALL REVIEWS HAVE BEEN PROCESSED!');
    } else {
      console.log(`\nTo continue with the next batch, update START_FROM = ${nextBatchStart} in the script.`);
    }
    
  } catch (error) {
    console.error('Error during import process:', error);
  } finally {
    pool.end();
  }
}

// Run the import function
importGoogleReviews();