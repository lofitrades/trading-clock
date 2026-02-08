/**
 * src/services/blogAuthorService.js
 * 
 * Purpose: Firestore CRUD operations for blog authors.
 * Handles author profiles for blog taxonomy pages and attribution.
 * 
 * Changelog:
 * v1.0.0 - 2026-02-04 - Initial implementation (Phase 5.B Blog)
 */

import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { DEFAULT_BLOG_AUTHOR } from '../types/blogTypes';

// Collection references
const BLOG_AUTHORS_COLLECTION = 'blogAuthors';
const AUTHOR_SLUG_INDEX_COLLECTION = 'blogAuthorSlugIndex';

/**
 * Check if an author slug is available
 * @param {string} slug - Author URL slug
 * @param {string|null} excludeAuthorId - Author ID to exclude (for updates)
 * @returns {Promise<boolean>} True if slug is available
 */
export const isAuthorSlugAvailable = async (slug, excludeAuthorId = null) => {
  const slugDoc = await getDoc(doc(db, AUTHOR_SLUG_INDEX_COLLECTION, slug));
  
  if (!slugDoc.exists()) return true;
  if (excludeAuthorId && slugDoc.data().authorId === excludeAuthorId) return true;
  
  return false;
};

/**
 * Create a new blog author
 * @param {Object} authorData - Author profile data
 * @returns {Promise<string>} Created author ID
 */
export const createBlogAuthor = async (authorData) => {
  const authorRef = doc(collection(db, BLOG_AUTHORS_COLLECTION));
  const authorId = authorRef.id;
  
  const now = serverTimestamp();
  const newAuthor = {
    ...DEFAULT_BLOG_AUTHOR,
    ...authorData,
    id: authorId,
    createdAt: now,
    updatedAt: now,
  };

  // Validate slug uniqueness in transaction
  await runTransaction(db, async (transaction) => {
    if (newAuthor.slug) {
      const slugRef = doc(db, AUTHOR_SLUG_INDEX_COLLECTION, newAuthor.slug);
      const slugDoc = await transaction.get(slugRef);
      
      if (slugDoc.exists()) {
        throw new Error(`Author slug "${newAuthor.slug}" is already taken`);
      }
      
      // Claim slug
      transaction.set(slugRef, { authorId, slug: newAuthor.slug, claimedAt: now });
    }
    
    // Create author
    transaction.set(authorRef, newAuthor);
  });

  return authorId;
};

/**
 * Get a blog author by ID
 * @param {string} authorId - Author ID
 * @returns {Promise<Object|null>} Author data or null
 */
export const getBlogAuthor = async (authorId) => {
  const authorDoc = await getDoc(doc(db, BLOG_AUTHORS_COLLECTION, authorId));
  if (!authorDoc.exists()) return null;
  return { id: authorDoc.id, ...authorDoc.data() };
};

/**
 * Get a blog author by slug
 * @param {string} slug - Author URL slug
 * @returns {Promise<Object|null>} Author data or null
 */
export const getBlogAuthorBySlug = async (slug) => {
  const slugDoc = await getDoc(doc(db, AUTHOR_SLUG_INDEX_COLLECTION, slug));
  if (!slugDoc.exists()) return null;
  
  const { authorId } = slugDoc.data();
  return getBlogAuthor(authorId);
};

/**
 * Get multiple authors by IDs
 * @param {string[]} authorIds - Array of author IDs
 * @returns {Promise<Object[]>} Array of author data
 */
export const getBlogAuthorsByIds = async (authorIds) => {
  if (!authorIds || authorIds.length === 0) return [];
  
  const authors = await Promise.all(
    authorIds.map(id => getBlogAuthor(id))
  );
  
  return authors.filter(Boolean);
};

/**
 * List all blog authors
 * @param {Object} options - Query options
 * @param {string} [options.orderByField='displayName'] - Field to order by
 * @returns {Promise<Object[]>} Array of authors
 */
export const listBlogAuthors = async ({ orderByField = 'displayName' } = {}) => {
  const q = query(
    collection(db, BLOG_AUTHORS_COLLECTION),
    orderBy(orderByField)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Update a blog author
 * @param {string} authorId - Author ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateBlogAuthor = async (authorId, updates) => {
  const authorRef = doc(db, BLOG_AUTHORS_COLLECTION, authorId);
  
  await runTransaction(db, async (transaction) => {
    const authorDoc = await transaction.get(authorRef);
    if (!authorDoc.exists()) {
      throw new Error('Author not found');
    }
    
    const currentData = authorDoc.data();
    const currentSlug = currentData.slug;
    const newSlug = updates.slug;
    
    // Handle slug change
    if (newSlug && newSlug !== currentSlug) {
      const newSlugRef = doc(db, AUTHOR_SLUG_INDEX_COLLECTION, newSlug);
      const newSlugDoc = await transaction.get(newSlugRef);
      
      if (newSlugDoc.exists() && newSlugDoc.data().authorId !== authorId) {
        throw new Error(`Author slug "${newSlug}" is already taken`);
      }
      
      // Release old slug
      if (currentSlug) {
        transaction.delete(doc(db, AUTHOR_SLUG_INDEX_COLLECTION, currentSlug));
      }
      
      // Claim new slug
      transaction.set(newSlugRef, { 
        authorId, 
        slug: newSlug, 
        claimedAt: serverTimestamp() 
      });
    }
    
    // Update author
    transaction.update(authorRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  });
};

/**
 * Delete a blog author
 * @param {string} authorId - Author ID
 * @returns {Promise<void>}
 */
export const deleteBlogAuthor = async (authorId) => {
  const authorRef = doc(db, BLOG_AUTHORS_COLLECTION, authorId);
  
  await runTransaction(db, async (transaction) => {
    const authorDoc = await transaction.get(authorRef);
    if (!authorDoc.exists()) {
      throw new Error('Author not found');
    }
    
    const { slug } = authorDoc.data();
    
    // Release slug
    if (slug) {
      transaction.delete(doc(db, AUTHOR_SLUG_INDEX_COLLECTION, slug));
    }
    
    // Delete author
    transaction.delete(authorRef);
  });
};

/**
 * Generate a URL-safe slug from display name
 * @param {string} displayName - Author display name
 * @returns {string} URL-safe slug
 */
export const generateAuthorSlug = (displayName) => {
  if (!displayName) return '';
  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
};
