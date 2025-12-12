/**
 * functions/src/setAdminClaim.ts
 * 
 * Purpose: One-time script to set superadmin custom claim for a user
 * Run manually to grant upload permissions for economicEventDescriptions
 * 
 * Changelog:
 * v1.0.0 - 2025-12-11 - Initial implementation
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Set superadmin custom claim for a user
 * @param email - User's email address
 */
async function setAdminClaim(email: string): Promise<void> {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set custom claim
    await admin.auth().setCustomUserClaims(user.uid, {
      superadmin: true,
      role: 'superadmin'
    });
    
    console.log(`✅ Successfully set superadmin claim for user: ${email}`);
    console.log(`User UID: ${user.uid}`);
    console.log('The user will need to sign out and sign back in for changes to take effect.');
    
  } catch (error) {
    console.error('❌ Error setting admin claim:', error);
    throw error;
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node lib/setAdminClaim.js <email@example.com>');
  process.exit(1);
}

// Run the function
setAdminClaim(email)
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
