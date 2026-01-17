/**
 * functions/src/setAdminClaim.ts
 * 
 * Purpose: One-time script to set superadmin custom claim for a user
 * Syncs role to both Firebase Auth custom claims and Firestore for consistency
 * 
 * Changelog:
 * v1.1.0 - 2026-01-16 - Added Firestore sync for role consistency
 * v1.0.0 - 2025-12-11 - Initial implementation
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Set superadmin custom claim for a user
 * Syncs to both Firebase Auth custom claims AND Firestore for consistency
 * @param email - User's email address
 */
async function setAdminClaim(email: string): Promise<void> {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Set custom claims for Cloud Functions to read from ID token
    await admin.auth().setCustomUserClaims(user.uid, {
      superadmin: true,
      role: 'superadmin'
    });
    
    // Sync role to Firestore for UI consistency
    await admin.firestore().collection('users').doc(user.uid).set({
      role: 'superadmin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`✅ Successfully set superadmin for user: ${email}`);
    console.log(`User UID: ${user.uid}`);
    console.log('✅ Updated: Firebase Auth custom claims + Firestore');
    console.log('⚠️  User must SIGN OUT and SIGN IN for ID token to refresh.');
    
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
