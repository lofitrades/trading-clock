/**
 * src/services/postEngagementService.js
 *
 * Purpose: Manages blog post engagement metrics — view counts and likes.
 * View counts are incremented atomically on every page visit (non-unique, all views).
 * Likes are auth-gated; each user may like a post once (toggle on/off).
 * Engagement data lives on blogPosts/{postId} (viewCount, likeCount) and
 * per-user likes in users/{uid}/blogActivity/likes.
 *
 * Changelog:
 * v1.0.0 - 2026-02-07 - Initial implementation (BEP engagement-weighted related posts)
 */

import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';

// ─── Constants ───────────────────────────────────────────────────────────────
const BLOG_POSTS_COLLECTION = 'blogPosts';
const USERS_COLLECTION = 'users';

// ─── View Count ──────────────────────────────────────────────────────────────

/**
 * Increment the total view count for a blog post (all views, not unique).
 * Creates the viewCount field if it doesn't exist yet.
 * @param {string} postId - Blog post document ID
 */
export const incrementPostViewCount = async (postId) => {
  if (!postId) return;
  try {
    const ref = doc(db, BLOG_POSTS_COLLECTION, postId);
    await updateDoc(ref, {
      viewCount: increment(1),
    });
  } catch (err) {
    // updateDoc fails if doc doesn't exist — silently ignore for safety
    console.error('Failed to increment view count:', err);
  }
};

/**
 * Get the current view count for a blog post
 * @param {string} postId
 * @returns {Promise<number>}
 */
export const getPostViewCount = async (postId) => {
  if (!postId) return 0;
  try {
    const ref = doc(db, BLOG_POSTS_COLLECTION, postId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data()?.viewCount || 0) : 0;
  } catch {
    return 0;
  }
};

// ─── Like System ─────────────────────────────────────────────────────────────

/**
 * Check if a user has liked a post
 * @param {string} uid - User UID
 * @param {string} postId - Blog post ID
 * @returns {Promise<boolean>}
 */
export const hasUserLikedPost = async (uid, postId) => {
  if (!uid || !postId) return false;
  try {
    const ref = doc(db, USERS_COLLECTION, uid, 'blogActivity', 'likes');
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const likedPostIds = snap.data()?.postIds || [];
    return likedPostIds.includes(postId);
  } catch {
    return false;
  }
};

/**
 * Get all liked post IDs for a user
 * @param {string} uid - User UID
 * @returns {Promise<string[]>}
 */
export const getUserLikedPostIds = async (uid) => {
  if (!uid) return [];
  try {
    const ref = doc(db, USERS_COLLECTION, uid, 'blogActivity', 'likes');
    const snap = await getDoc(ref);
    if (!snap.exists()) return [];
    return snap.data()?.postIds || [];
  } catch {
    return [];
  }
};

/**
 * Toggle like on a blog post (auth-only).
 * - If not yet liked → add like (likeCount +1, add to user likes)
 * - If already liked → remove like (likeCount -1, remove from user likes)
 *
 * @param {string} uid - User UID
 * @param {string} postId - Blog post ID
 * @returns {Promise<boolean>} New liked state (true = liked, false = unliked)
 */
export const togglePostLike = async (uid, postId) => {
  if (!uid || !postId) return false;

  const userRef = doc(db, USERS_COLLECTION, uid, 'blogActivity', 'likes');
  const postRef = doc(db, BLOG_POSTS_COLLECTION, postId);

  const isLiked = await hasUserLikedPost(uid, postId);

  if (isLiked) {
    // Unlike
    await setDoc(
      userRef,
      { postIds: arrayRemove(postId), updatedAt: serverTimestamp() },
      { merge: true }
    );
    await updateDoc(postRef, { likeCount: increment(-1) }).catch(() => {});
    return false;
  } else {
    // Like
    await setDoc(
      userRef,
      { postIds: arrayUnion(postId), updatedAt: serverTimestamp() },
      { merge: true }
    );
    await updateDoc(postRef, { likeCount: increment(1) }).catch(() => {});
    return true;
  }
};

/**
 * Get the like count for a blog post
 * @param {string} postId
 * @returns {Promise<number>}
 */
export const getPostLikeCount = async (postId) => {
  if (!postId) return 0;
  try {
    const ref = doc(db, BLOG_POSTS_COLLECTION, postId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data()?.likeCount || 0) : 0;
  } catch {
    return 0;
  }
};
