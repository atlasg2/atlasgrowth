// Script to create user accounts for all contractors with "prospect" status
// Usage: node scripts/create-prospect-users.js

import { db } from '../server/db.js';
import { contractors, users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function createUsersForProspects() {
  try {
    console.log('Starting to create user accounts for prospects...');
    
    // Get all contractors with "prospect" status
    const prospectContractors = await db.select().from(contractors).where(eq(contractors.status, 'prospect'));
    console.log(`Found ${prospectContractors.length} contractors with prospect status`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const contractor of prospectContractors) {
      // Check if a user already exists with this username
      const existingUser = await db.select().from(users).where(eq(users.username, contractor.slug));
      
      if (existingUser.length > 0) {
        console.log(`User already exists for ${contractor.name} (${contractor.slug}), skipping...`);
        skippedCount++;
        continue;
      }
      
      // Create a password hash for the slug
      const hashedPassword = await hashPassword(contractor.slug);
      
      // Create a new user
      await db.insert(users).values({
        username: contractor.slug,
        password: hashedPassword,
        email: contractor.email || `${contractor.slug}@example.com`,
        firstName: contractor.name.split(' ')[0] || '',
        lastName: contractor.name.split(' ').slice(1).join(' ') || '',
        role: 'contractor',
        active: true,
        contractorId: contractor.id
      });
      
      console.log(`Created user account for ${contractor.name} (${contractor.slug})`);
      createdCount++;
    }
    
    console.log(`Finished creating user accounts.`);
    console.log(`Summary: ${createdCount} accounts created, ${skippedCount} accounts skipped (already exist)`);
    
  } catch (error) {
    console.error('Error creating user accounts:', error);
  } finally {
    process.exit(0);
  }
}

createUsersForProspects();