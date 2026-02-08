/**
 * src/services/postReadTrackingService.js
 *
 * Purpose: Tracks which blog posts a user has read.
 * Guests use localStorage; authenticated users sync to Firestore for cross-device accuracy.
 * On sign-in, localStorage reads merge into Firestore (union, not overwrite).
 *
 * Changelog:
 * v1.0.0 - 2026-02-07 - Initial implementation (BEP dynamic related posts)
 */

import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';

// ─── Constants ───────────────────────────────────────────────────────────────
const LOCAL_STORAGE_KEY = 't2t_blog_read_posts';
const FIRESTORE_COLLECTION = 'users';
const FIRESTORE_SUB_COLLECTION = 'blogActivity';
const FIRESTORE_SUB_DOC = 'readHistory';
const MAX_LOCAL_STORAGE_ENTRIES = 500; // prevent unbounded growth

// ─── LocalStorage helpers ────────────────────────────────────────────────────

/**
 * Get read post IDs from localStorage (guest fallback)
 * @returns {string[]} Array of post IDs the user has read
 */
export const getLocalReadPostIds = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => (typeof entry === 'string' ? entry : entry?.id)).filter(Boolean);
  } catch {
    return [];
  }
};

/**
 * Mark a post as read in localStorage
 * @param {string} postId
 */
export const markLocalPostRead = (postId) => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    let entries = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(entries)) entries = [];

    // Already tracked?
    if (entries.some((e) => (typeof e === 'string' ? e : e?.id) === postId)) return;

    entries.push({ id: postId, ts: Date.now() });

    // Trim oldest entries if over limit
    if (entries.length > MAX_LOCAL_STORAGE_ENTRIES) {
      entries = entries.slice(entries.length - MAX_LOCAL_STORAGE_ENTRIES);
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage might be full or blocked — fail silently
  }
};

// ─── Firestore helpers (authenticated users) ─────────────────────────────────

/**
 * Get read post IDs from Firestore for an authenticated user
 * @param {string} uid - User UID
 * @returns {Promise<string[]>} Array of read post IDs
 */
export const getFirestoreReadPostIds = async (uid) => {
  if (!uid) return [];
  try {
    const ref = doc(db, FIRESTORE_COLLECTION, uid, FIRESTORE_SUB_COLLECTION, FIRESTORE_SUB_DOC);
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    return snap.data()?.postIds || [];
  } catch (err) {
    console.error('Failed to fetch Firestore read posts:', err);
    return [];
  }
};

/**
 * Mark a post as read in Firestore (atomic arrayUnion — no duplicates)
 * @param {string} uid - User UID
 * @param {string} postId - Blog post ID
 */
export const markFirestorePostRead = async (uid, postId) => {
  if (!uid || !postId) return;
  try {
    const ref = doc(db, FIRESTORE_COLLECTION, uid, FIRESTORE_SUB_COLLECTION, FIRESTORE_SUB_DOC);
    await setDoc(
      ref,
      {
        postIds: arrayUnion(postId),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to mark Firestore post read:', err);
  }
};

/**
 * Sync localStorage reads into Firestore on sign-in (union merge)
 * Clears localStorage after successful sync to prevent drift.
 * @param {string} uid - User UID
 */
export const syncLocalReadsToFirestore = async (uid) => {
  if (!uid) return;
  const localIds = getLocalReadPostIds();
  if (localIds.length === 0) return;

  try {
    const ref = doc(db, FIRESTORE_COLLECTION, uid, FIRESTORE_SUB_COLLECTION, FIRESTORE_SUB_DOC);
    await setDoc(
      ref,
      {
        postIds: arrayUnion(...localIds),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    // Clear localStorage after successful merge
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to sync local reads to Firestore:', err);
    // Keep localStorage intact so it can retry next time
  }
};

// ─── Unified API ─────────────────────────────────────────────────────────────

/**
 * Get all read post IDs for the current user context
 * @param {string|null} uid - User UID (null = guest)
 * @returns {Promise<string[]>} Read post IDs
 */
export const getReadPostIds = async (uid) => {
  if (uid) {
    // Authenticated: Firestore is source of truth
    return getFirestoreReadPostIds(uid);
  }
  // Guest: localStorage
  return getLocalReadPostIds();
};

/**
 * Mark a post as read for the current user context
 * @param {string|null} uid - User UID (null = guest)
 * @param {string} postId - Blog post ID
 */
export const markPostRead = async (uid, postId) => {
  // Always mark in localStorage (fast, offline-capable)
  markLocalPostRead(postId);

  // Also persist to Firestore for authenticated users
  if (uid) {
    await markFirestorePostRead(uid, postId);
  }
};
