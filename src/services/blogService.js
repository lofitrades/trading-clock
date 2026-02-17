/**
 * src/services/blogService.js
 * 
 * Purpose: Firestore CRUD operations for blog posts with slug uniqueness enforcement.
 * Handles create, read, update, delete, and publish/unpublish workflows.
 * 
 * Changelog:
 * v2.5.0 - 2026-02-11 - BEP CRITICAL FIX: Restructured updateBlogPost transaction to perform
 *                       ALL reads (post doc + all slug docs) before ANY writes (release/claim/update).
 *                       Previous code interleaved reads and writes inside the slug-change loop:
 *                       for each language it did transaction.get → releaseSlug → claimSlug, so the
 *                       second language's get() came after the first language's writes, violating
 *                       Firestore's "all reads before all writes" transaction rule. Now: Phase 1
 *                       collects all reads into arrays, Phase 2 performs all writes from those arrays.
 * v2.4.0 - 2026-02-10 - CRITICAL PROD FIX: Firestore transaction error "all reads before all writes".
 *                       Removed incorrect async/await from claimSlug() and releaseSlug() functions.
 *                       These are transaction-safe helpers that don't perform async operations -
 *                       they synchronously manipulate transaction objects. The await keywords were
 *                       causing Firestore to think async work was happening between reads and writes.
 * v2.3.0 - 2026-02-09 - Phase 2 Insights: Compute insightKeys on create/update/publish/duplicate
 * v2.2.0 - 2026-02-07 - BEP ENGAGEMENT RELATED POSTS: getRelatedPosts() now accepts options.readPostIds to deprioritize already-read posts. Added engagement bonus scoring (viewCount + likeCount). Unread candidates are prioritized; read posts fill remaining slots only when needed.
 * v2.1.0 - 2026-02-07 - BEP FIX: Compute searchTokens in createBlogPost() for direct-published posts
 * v2.0.0 - 2026-02-06 - Phase 6: Added computeSearchTokens() for full-text search indexing
 * v1.1.0 - 2026-02-06 - BEP: Added cursor-based pagination to listPublishedPosts for infinite scroll support
 * v1.0.1 - 2026-02-04 - Fixed variable initialization issue in listBlogPosts (let q reassignment)
 * v1.0.0 - 2026-02-04 - Initial implementation (Phase 1 Blog)
 */

import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import {
  BLOG_POST_STATUS,
  DEFAULT_BLOG_POST,
  DEFAULT_LANGUAGE_CONTENT,
  estimateReadingTime,
} from '../types/blogTypes';
import { computeBlogInsightKeys } from '../utils/insightKeysUtils';

// Collection references
const BLOG_POSTS_COLLECTION = 'blogPosts';
const BLOG_SLUG_INDEX_COLLECTION = 'blogSlugIndex';

/**
 * Compute search tokens for full-text search indexing (Phase 6)
 * Tokenizes title, excerpt, tags, category, keywords, currencies, and events into lowercase words
 * Used for Firestore array-contains queries
 * 
 * @param {Object} post - Blog post data
 * @param {string} lang - Language code (en, es, fr)
 * @returns {string[]} Array of unique lowercase tokens, sorted and deduplicated
 * @example
 * computeSearchTokens(post, 'en') => ['trading', 'tips', 'cpi', 'economic', 'report', 'usd', 'eur', ...]
 * // Includes: title words, excerpt words, tags, category, keywords, currency codes, event names
 */
export const computeSearchTokens = (post, lang) => {
  const content = post.languages?.[lang];
  if (!content) return [];
  
  // Collect all text sources
  const textSources = [
    content.title || '',
    content.excerpt || '',
    (post.tags || []).join(' '),
    (post.category || '').replace(/-/g, ' '), // Convert kebab-case to words
    (post.keywords || []).join(' '),
    (post.currencyTags || []).join(' '), // BEP: Include currency tags (USD, EUR, etc.)
    (post.eventTags || []).join(' '), // BEP: Include event tags (NFP, CPI, etc.)
  ];
  
  // Combine and tokenize
  const allText = textSources.join(' ').toLowerCase();
  
  // Split by whitespace, remove punctuation, filter empty strings
  const tokens = allText
    .split(/\s+/)
    .map(token => token.replace(/[^\w]/g, '')) // Remove punctuation
    .filter(token => token.length > 0); // Remove empty strings
  
  // Deduplicate and sort for consistency
  return [...new Set(tokens)].sort();
};

/**
 * Generate a slug key for the index (lang_slug format)
 * @param {string} lang - Language code
 * @param {string} slug - URL slug
 * @returns {string} Slug key for index lookup
 */
const getSlugKey = (lang, slug) => `${lang}_${slug}`;

/**
 * Check if a slug is available for a given language
 * @param {string} lang - Language code
 * @param {string} slug - URL slug to check
 * @param {string|null} excludePostId - Post ID to exclude (for updates)
 * @returns {Promise<boolean>} True if slug is available
 */
export const isSlugAvailable = async (lang, slug, excludePostId = null) => {
  const slugKey = getSlugKey(lang, slug);
  const slugDoc = await getDoc(doc(db, BLOG_SLUG_INDEX_COLLECTION, slugKey));
  
  if (!slugDoc.exists()) return true;
  
  // If checking for update, allow if same post owns the slug
  if (excludePostId && slugDoc.data().postId === excludePostId) return true;
  
  return false;
};

/**
 * Claim a slug for a post (transaction-safe)
 * @param {string} postId - Post ID
 * @param {string} lang - Language code
 * @param {string} slug - URL slug
 */
const claimSlug = (transaction, postId, lang, slug) => {
  const slugKey = getSlugKey(lang, slug);
  const slugRef = doc(db, BLOG_SLUG_INDEX_COLLECTION, slugKey);
  transaction.set(slugRef, { postId, lang, slug, claimedAt: serverTimestamp() });
};

/**
 * Release a slug (transaction-safe)
 * @param {string} lang - Language code
 * @param {string} slug - URL slug
 */
const releaseSlug = (transaction, lang, slug) => {
  const slugKey = getSlugKey(lang, slug);
  const slugRef = doc(db, BLOG_SLUG_INDEX_COLLECTION, slugKey);
  transaction.delete(slugRef);
};

/**
 * Create a new blog post
 * @param {Object} postData - Post data
 * @param {Object} author - Author info { uid, displayName }
 * @returns {Promise<string>} Created post ID
 */
export const createBlogPost = async (postData, author) => {
  const postRef = doc(collection(db, BLOG_POSTS_COLLECTION));
  const postId = postRef.id;
  
  const now = serverTimestamp();
  const newPost = {
    ...DEFAULT_BLOG_POST,
    ...postData,
    id: postId,
    author: {
      uid: author.uid,
      displayName: author.displayName || author.email || 'Unknown',
    },
    createdAt: now,
    updatedAt: now,
  };

  // BEP v2.1.0: Compute searchTokens at creation time so posts created as published
  // (e.g., via GPT BlogUploadDrawer) are immediately searchable. Previously only
  // publishBlogPost() computed tokens, leaving direct-created posts with empty arrays.
  const langs = Object.keys(newPost.languages || {});
  if (langs.length > 0) {
    for (const lang of langs) {
      if (newPost.languages[lang]) {
        newPost.languages[lang].searchTokens = computeSearchTokens(newPost, lang);
      }
    }
  }

  // Phase 2 Insights: Compute insightKeys from eventTags + currencyTags
  newPost.insightKeys = computeBlogInsightKeys({
    id: postId,
    eventTags: newPost.eventTags,
    currencyTags: newPost.currencyTags,
  });

  // Validate and claim slugs for each language in a transaction
  // IMPORTANT: Firestore transactions require ALL reads before ANY writes
  await runTransaction(db, async (transaction) => {
    // PHASE 1: All reads first - check slug availability
    const slugChecks = [];
    for (const [lang, content] of Object.entries(newPost.languages || {})) {
      if (content.slug) {
        const slugKey = getSlugKey(lang, content.slug);
        const slugRef = doc(db, BLOG_SLUG_INDEX_COLLECTION, slugKey);
        const slugDoc = await transaction.get(slugRef);
        
        if (slugDoc.exists()) {
          throw new Error(`Slug "${content.slug}" is already taken for language "${lang}"`);
        }
        
        slugChecks.push({ lang, slug: content.slug, slugRef });
      }
    }
    
    // PHASE 2: All writes after reads complete
    // Claim all slugs
    for (const { lang, slug, slugRef } of slugChecks) {
      transaction.set(slugRef, { postId, lang, slug, claimedAt: serverTimestamp() });
    }
    
    // Create the post
    transaction.set(postRef, newPost);
  });

  return postId;
};

/**
 * Get a blog post by ID
 * @param {string} postId - Post ID
 * @returns {Promise<Object|null>} Post data or null
 */
export const getBlogPost = async (postId) => {
  const postDoc = await getDoc(doc(db, BLOG_POSTS_COLLECTION, postId));
  if (!postDoc.exists()) return null;
  return { id: postDoc.id, ...postDoc.data() };
};

/**
 * Get a blog post by slug and language
 * @param {string} lang - Language code
 * @param {string} slug - URL slug
 * @returns {Promise<Object|null>} Post data or null
 */
export const getBlogPostBySlug = async (lang, slug) => {
  const slugKey = getSlugKey(lang, slug);
  const slugDoc = await getDoc(doc(db, BLOG_SLUG_INDEX_COLLECTION, slugKey));
  
  if (!slugDoc.exists()) return null;
  
  const { postId } = slugDoc.data();
  return getBlogPost(postId);
};

/**
 * Update a blog post
 * @param {string} postId - Post ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateBlogPost = async (postId, updates) => {
  const postRef = doc(db, BLOG_POSTS_COLLECTION, postId);
  
  await runTransaction(db, async (transaction) => {
    // ================================================================
    // PHASE 1: ALL READS — Firestore requires every transaction.get()
    // to complete before the first write operation.
    // ================================================================

    // 1a. Read the current post
    const postDoc = await transaction.get(postRef);
    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }
    
    const currentData = postDoc.data();
    const currentLanguages = currentData.languages || {};
    const newLanguages = updates.languages || {};
    
    // Compute searchTokens for new/updated language content
    const mergedLanguages = { ...currentLanguages, ...newLanguages };
    const postWithMergedData = { ...currentData, ...updates, languages: mergedLanguages };
    
    for (const lang of Object.keys(mergedLanguages)) {
      if (lang in newLanguages) {
        // Compute searchTokens for updated language
        const tokens = computeSearchTokens(postWithMergedData, lang);
        if (newLanguages[lang]) {
          newLanguages[lang].searchTokens = tokens;
        }
      }
    }
    
    // 1b. Read ALL slug docs that need checking (new/changed slugs)
    // Collect read results for Phase 2 decision-making
    const slugChanges = []; // { lang, currentSlug, newSlug, slugDoc }
    
    for (const [lang, newContent] of Object.entries(newLanguages)) {
      const currentContent = currentLanguages[lang] || {};
      const currentSlug = currentContent.slug;
      const newSlug = newContent.slug;
      
      if (newSlug && newSlug !== currentSlug) {
        const slugKey = getSlugKey(lang, newSlug);
        const slugRef = doc(db, BLOG_SLUG_INDEX_COLLECTION, slugKey);
        const slugDoc = await transaction.get(slugRef);
        
        slugChanges.push({ lang, currentSlug, newSlug, slugDoc });
      }
    }
    
    // ================================================================
    // PHASE 2: ALL WRITES — Now that every read is done, perform writes.
    // ================================================================
    
    // 2a. Validate slug availability and apply slug changes
    for (const { lang, currentSlug, newSlug, slugDoc } of slugChanges) {
      if (slugDoc.exists() && slugDoc.data().postId !== postId) {
        throw new Error(`Slug "${newSlug}" is already taken for language "${lang}"`);
      }
      
      // Release old slug if it existed
      if (currentSlug) {
        releaseSlug(transaction, lang, currentSlug);
      }
      
      // Claim new slug
      claimSlug(transaction, postId, lang, newSlug);
    }
    
    // 2b. Handle removed languages (release their slugs)
    for (const [lang, currentContent] of Object.entries(currentLanguages)) {
      if (!(lang in newLanguages) && currentContent.slug) {
        releaseSlug(transaction, lang, currentContent.slug);
      }
    }
    
    // 2c. Update the post
    // Phase 2 Insights: Recompute insightKeys from merged data
    const mergedPost = { ...currentData, ...updates, languages: newLanguages };
    const insightKeys = computeBlogInsightKeys({
      id: postId,
      eventTags: mergedPost.eventTags,
      currencyTags: mergedPost.currencyTags,
    });

    transaction.update(postRef, {
      ...updates,
      languages: newLanguages,
      insightKeys,
      updatedAt: serverTimestamp(),
    });
  });
};

/**
 * Delete a blog post
 * @param {string} postId - Post ID
 * @returns {Promise<void>}
 */
export const deleteBlogPost = async (postId) => {
  await runTransaction(db, async (transaction) => {
    const postRef = doc(db, BLOG_POSTS_COLLECTION, postId);
    const postDoc = await transaction.get(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }
    
    const postData = postDoc.data();
    
    // Release all slugs
    for (const [lang, content] of Object.entries(postData.languages || {})) {
      if (content.slug) {
        releaseSlug(transaction, lang, content.slug);
      }
    }
    
    // Delete the post
    transaction.delete(postRef);
  });
};

/**
 * Publish a blog post
 * @param {string} postId - Post ID
 * @returns {Promise<void>}
 */
export const publishBlogPost = async (postId) => {
  const postRef = doc(db, BLOG_POSTS_COLLECTION, postId);
  const postDoc = await getDoc(postRef);
  
  if (!postDoc.exists()) {
    throw new Error('Post not found');
  }
  
  const postData = postDoc.data();
  
  // Validate that at least one language has required fields
  const languages = postData.languages || {};
  const hasValidLanguage = Object.values(languages).some(
    (content) => content.title && content.slug && content.contentHtml
  );
  
  if (!hasValidLanguage) {
    throw new Error('Post must have at least one language with title, slug, and content');
  }
  
  // Compute searchTokens for all languages (Phase 6)
  const updatedLanguages = { ...languages };
  for (const lang of Object.keys(updatedLanguages)) {
    const tokens = computeSearchTokens(postData, lang);
    updatedLanguages[lang] = {
      ...updatedLanguages[lang],
      searchTokens: tokens,
    };
  }
  
  const updates = {
    status: BLOG_POST_STATUS.PUBLISHED,
    languages: updatedLanguages,
    // Phase 2 Insights: Compute insightKeys at publish time
    insightKeys: computeBlogInsightKeys({
      id: postId,
      eventTags: postData.eventTags,
      currencyTags: postData.currencyTags,
    }),
    updatedAt: serverTimestamp(),
  };
  
  // Set publishedAt only if never published before
  if (!postData.publishedAt) {
    updates.publishedAt = serverTimestamp();
  }
  
  await updateDoc(postRef, updates);
};

/**
 * Unpublish a blog post
 * @param {string} postId - Post ID
 * @returns {Promise<void>}
 */
export const unpublishBlogPost = async (postId) => {
  const postRef = doc(db, BLOG_POSTS_COLLECTION, postId);
  
  await updateDoc(postRef, {
    status: BLOG_POST_STATUS.UNPUBLISHED,
    updatedAt: serverTimestamp(),
  });
};

/**
 * List blog posts with filters and pagination
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status (optional, CMS only)
 * @param {string} options.category - Filter by category
 * @param {string} options.tag - Filter by tag
 * @param {number} options.pageSize - Number of posts per page
 * @param {Object} options.startAfterDoc - Last document for pagination
 * @param {boolean} options.includeAllStatuses - Include drafts/unpublished (CMS only)
 * @returns {Promise<{ posts: Object[], lastDoc: Object|null }>}
 */
export const listBlogPosts = async (options = {}) => {
  const {
    status,
    category,
    tag,
    pageSize = 10,
    startAfterDoc = null,
    includeAllStatuses = false,
  } = options;
  
  const collectionRef = collection(db, BLOG_POSTS_COLLECTION);
  const constraints = [];
  
  // Status filter (default to published for public)
  if (!includeAllStatuses) {
    constraints.push(where('status', '==', BLOG_POST_STATUS.PUBLISHED));
  } else if (status) {
    constraints.push(where('status', '==', status));
  }
  
  // Category filter
  if (category) {
    constraints.push(where('category', '==', category));
  }
  
  // Tag filter
  if (tag) {
    constraints.push(where('tags', 'array-contains', tag));
  }
  
  // Order by publishedAt for published posts, updatedAt otherwise
  constraints.push(orderBy('updatedAt', 'desc'));
  
  // Pagination cursor must come before limit (per Firebase docs)
  if (startAfterDoc) {
    constraints.push(startAfter(startAfterDoc));
  }
  
  constraints.push(limit(pageSize));
  
  const q = query(collectionRef, ...constraints);
  const snapshot = await getDocs(q);
  
  const posts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  
  const lastDoc = snapshot.docs.length > 0 
    ? snapshot.docs[snapshot.docs.length - 1] 
    : null;
  
  return { posts, lastDoc };
};

/**
 * Get related posts for a given post
 * Phase 5.B Enhanced: Uses scoring based on category, events, currencies, tags, keywords, and recency
 * v2.2.0 BEP: Engagement-weighted + read-post filtering
 *   - readPostIds: posts already read by the user are deprioritized (shown last, only if needed)
 *   - viewCount & likeCount boost: higher-engaged posts are weighted more
 *
 * @param {string} postId - Current post ID
 * @param {string} lang - Language to get related content in
 * @param {number} maxRelated - Maximum number of related posts
 * @param {Object} [options] - Optional configuration
 * @param {string[]} [options.readPostIds] - IDs of posts the user has already read
 * @returns {Promise<Object[]>} Related posts sorted by relevance score
 */
export const getRelatedPosts = async (postId, lang, maxRelated = 6, options = {}) => {
  const { readPostIds = [] } = options;
  const readSet = new Set(readPostIds);

  const post = await getBlogPost(postId);
  if (!post) return [];
  
  const relatedPosts = [];
  
  // 1. First, get manually specified related posts (highest priority)
  if (post.relatedPostIds && post.relatedPostIds.length > 0) {
    for (const relatedId of post.relatedPostIds.slice(0, maxRelated)) {
      if (relatedId === post.id) continue;
      
      const relatedPost = await getBlogPost(relatedId);
      if (relatedPost && 
          relatedPost.status === BLOG_POST_STATUS.PUBLISHED &&
          relatedPost.languages?.[lang]) {
        relatedPosts.push({ ...relatedPost, _manuallyRelated: true });
      }
      
      if (relatedPosts.length >= maxRelated) {
        return relatedPosts;
      }
    }
  }
  
  // 2. If we need more, use scoring algorithm to find best matches
  if (relatedPosts.length < maxRelated) {
    // Get candidate posts (published, same language available)
    const { posts: candidates } = await listBlogPosts({
      pageSize: 50, // Get a pool of candidates
      includeAllStatuses: false,
    });
    
    // Filter and score candidates
    const scoredCandidates = candidates
      .filter(candidate => {
        // Exclude current post and already-added posts
        if (candidate.id === post.id) return false;
        if (relatedPosts.some(p => p.id === candidate.id)) return false;
        if (!candidate.languages?.[lang]) return false;
        return true;
      })
      .map(candidate => {
        let score = 0;
        
        // Category match (weight: 3)
        if (candidate.category && candidate.category === post.category) {
          score += 3;
        }
        
        // Event overlap (weight: 2 per match)
        const postEvents = post.eventTags || [];
        const candidateEvents = candidate.eventTags || [];
        const eventOverlap = postEvents.filter(e => candidateEvents.includes(e)).length;
        score += eventOverlap * 2;
        
        // Currency overlap (weight: 2 per match)
        const postCurrencies = post.currencyTags || [];
        const candidateCurrencies = candidate.currencyTags || [];
        const currencyOverlap = postCurrencies.filter(c => candidateCurrencies.includes(c)).length;
        score += currencyOverlap * 2;
        
        // Tag overlap (weight: 1 per match)
        const postTags = post.tags || [];
        const candidateTags = candidate.tags || [];
        const tagOverlap = postTags.filter(t => candidateTags.includes(t)).length;
        score += tagOverlap * 1;
        
        // Keyword overlap (weight: 0.5 per match)
        const postKeywords = post.keywords || [];
        const candidateKeywords = candidate.keywords || [];
        const keywordOverlap = postKeywords.filter(k => candidateKeywords.includes(k)).length;
        score += keywordOverlap * 0.5;
        
        // Recency bonus (max 3 points for posts within 30 days)
        if (candidate.publishedAt) {
          const candidateDate = candidate.publishedAt.toDate ? candidate.publishedAt.toDate() : new Date(candidate.publishedAt);
          const daysSincePublish = Math.floor((Date.now() - candidateDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSincePublish <= 30) {
            score += Math.max(0, (30 - daysSincePublish) * 0.1);
          }
        }

        // Engagement bonus: views (weight: 0.01 per view, capped at 2 pts)
        const viewCount = candidate.viewCount || 0;
        score += Math.min(viewCount * 0.01, 2);

        // Engagement bonus: likes (weight: 0.1 per like, capped at 2 pts)
        const likeCount = candidate.likeCount || 0;
        score += Math.min(likeCount * 0.1, 2);
        
        return { ...candidate, _score: score };
      })
      .filter(c => c._score > 0) // Only include candidates with some relevance
      .sort((a, b) => b._score - a._score);

    // BEP: Separate unread and read candidates — prefer unread first
    const unreadCandidates = scoredCandidates.filter(c => !readSet.has(c.id));
    const readCandidates = scoredCandidates.filter(c => readSet.has(c.id));

    const remainingSlots = maxRelated - relatedPosts.length;

    // Fill with unread first, then fall back to read posts if not enough unread
    const prioritized = [...unreadCandidates, ...readCandidates];
    relatedPosts.push(...prioritized.slice(0, remainingSlots));
  }
  
  return relatedPosts.slice(0, maxRelated);
};

/**
 * Get related posts preview with detailed scoring breakdown (Admin CMS only)
 * Returns all candidate posts with individual score components for UI display
 * @param {Object} postData - Current post data (can be unsaved draft)
 * @param {string} postData.id - Post ID (optional for new posts)
 * @param {string} postData.category - Post category
 * @param {string[]} postData.eventTags - Event tags
 * @param {string[]} postData.currencyTags - Currency tags
 * @param {string[]} postData.tags - Editorial tags
 * @param {string[]} postData.keywords - SEO keywords
 * @param {string[]} postData.relatedPostIds - Manually selected related post IDs
 * @param {string} lang - Language to preview in
 * @param {number} maxCandidates - Maximum candidates to return
 * @returns {Promise<Object[]>} Candidates with detailed scoring
 */
export const getRelatedPostsPreview = async (postData, lang = 'en', maxCandidates = 20) => {
  const {
    id: currentPostId,
    category,
    eventTags = [],
    currencyTags = [],
    tags = [],
    keywords = [],
    relatedPostIds = [],
  } = postData;

  // Get candidate posts (published, any language)
  const { posts: candidates } = await listBlogPosts({
    pageSize: 50,
    includeAllStatuses: false, // Only published
  });

  // Process all candidates with detailed scoring
  const scoredCandidates = candidates
    .filter(candidate => {
      // Exclude current post
      if (currentPostId && candidate.id === currentPostId) return false;
      return true;
    })
    .map(candidate => {
      const scoreBreakdown = {
        category: 0,
        events: 0,
        currencies: 0,
        tags: 0,
        keywords: 0,
        recency: 0,
      };

      // Category match (weight: 3)
      if (candidate.category && candidate.category === category) {
        scoreBreakdown.category = 3;
      }

      // Event overlap (weight: 2 per match)
      const candidateEvents = candidate.eventTags || [];
      const eventMatches = eventTags.filter(e => candidateEvents.includes(e));
      scoreBreakdown.events = eventMatches.length * 2;
      scoreBreakdown.eventMatches = eventMatches;

      // Currency overlap (weight: 2 per match)
      const candidateCurrencies = candidate.currencyTags || [];
      const currencyMatches = currencyTags.filter(c => candidateCurrencies.includes(c));
      scoreBreakdown.currencies = currencyMatches.length * 2;
      scoreBreakdown.currencyMatches = currencyMatches;

      // Tag overlap (weight: 1 per match)
      const candidateTags = candidate.tags || [];
      const tagMatches = tags.filter(t => candidateTags.includes(t));
      scoreBreakdown.tags = tagMatches.length * 1;
      scoreBreakdown.tagMatches = tagMatches;

      // Keyword overlap (weight: 0.5 per match)
      const candidateKeywords = candidate.keywords || [];
      const keywordMatches = keywords.filter(k => candidateKeywords.includes(k));
      scoreBreakdown.keywords = keywordMatches.length * 0.5;
      scoreBreakdown.keywordMatches = keywordMatches;

      // Recency bonus (max 3 points for posts within 30 days)
      if (candidate.publishedAt) {
        const candidateDate = candidate.publishedAt.toDate ? candidate.publishedAt.toDate() : new Date(candidate.publishedAt);
        const daysSincePublish = Math.floor((Date.now() - candidateDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSincePublish <= 30) {
          scoreBreakdown.recency = Math.round(Math.max(0, (30 - daysSincePublish) * 0.1) * 100) / 100;
        }
        scoreBreakdown.daysSincePublish = daysSincePublish;
      }

      // Total score
      const totalScore = Object.entries(scoreBreakdown)
        .filter(([key]) => ['category', 'events', 'currencies', 'tags', 'keywords', 'recency'].includes(key))
        .reduce((sum, [, val]) => sum + val, 0);

      // Check if manually selected
      const isManuallySelected = relatedPostIds.includes(candidate.id);

      // Get display content
      const content = candidate.languages?.[lang] || candidate.languages?.en || {};

      return {
        id: candidate.id,
        title: content.title || 'Untitled',
        slug: content.slug,
        category: candidate.category,
        eventTags: candidate.eventTags || [],
        currencyTags: candidate.currencyTags || [],
        publishedAt: candidate.publishedAt,
        coverImage: content.coverImage,
        totalScore: Math.round(totalScore * 100) / 100,
        scoreBreakdown,
        isManuallySelected,
        hasLanguage: Boolean(candidate.languages?.[lang]),
      };
    })
    .sort((a, b) => {
      // Manually selected always first
      if (a.isManuallySelected && !b.isManuallySelected) return -1;
      if (!a.isManuallySelected && b.isManuallySelected) return 1;
      // Then by score
      return b.totalScore - a.totalScore;
    });

  return scoredCandidates.slice(0, maxCandidates);
};

/**
 * Add or update a language translation for a post
 * @param {string} postId - Post ID
 * @param {string} lang - Language code
 * @param {Object} content - Language content
 * @returns {Promise<void>}
 */
export const addPostLanguage = async (postId, lang, content) => {
  const post = await getBlogPost(postId);
  if (!post) throw new Error('Post not found');
  
  const languages = { ...(post.languages || {}) };
  languages[lang] = {
    ...DEFAULT_LANGUAGE_CONTENT,
    ...content,
    readingTimeMin: estimateReadingTime(content.contentHtml || ''),
  };
  
  await updateBlogPost(postId, { languages });
};

/**
 * Remove a language translation from a post
 * @param {string} postId - Post ID
 * @param {string} lang - Language code to remove
 * @returns {Promise<void>}
 */
export const removePostLanguage = async (postId, lang) => {
  const post = await getBlogPost(postId);
  if (!post) throw new Error('Post not found');
  
  // Ensure at least one language remains
  const languageCount = Object.keys(post.languages || {}).length;
  if (languageCount <= 1) {
    throw new Error('Cannot remove the last language from a post');
  }
  
  const languages = { ...(post.languages || {}) };
  delete languages[lang];
  
  await updateBlogPost(postId, { languages });
};

/**
 * List published posts for public consumption
 * Simplified API for BlogListPage - filters by language availability
 * @param {Object} options - Filter options
 * @param {string} options.lang - Language code (filters to posts with that language)
 * @param {string} options.category - Category filter
 * @param {string} options.tag - Tag filter
 * @param {number} options.limit - Max posts per page (default 12)
 * @param {Object|null} options.startAfterDoc - Firestore document snapshot for cursor pagination
 * @returns {Promise<{ posts: Object[], lastDoc: Object|null, hasMore: boolean }>} Paginated published posts
 */
export const listPublishedPosts = async (options = {}) => {
  const { lang = 'en', category, tag, limit: maxPosts = 12, startAfterDoc = null } = options;
  
  const result = await listBlogPosts({
    category,
    tag,
    pageSize: maxPosts,
    startAfterDoc,
    includeAllStatuses: false, // Only published
  });
  
  // Filter to posts that have the requested language
  const filtered = result.posts.filter((post) => {
    const hasLanguage = post.languages?.[lang];
    return hasLanguage;
  });
  
  return {
    posts: filtered,
    lastDoc: result.lastDoc,
    hasMore: result.posts.length === maxPosts,
  };
};

/**
 * Duplicate a blog post as a new draft
 * Creates a copy of the post with draft status and new slugs (appends "-copy")
 * @param {string} postId - Source post ID to duplicate
 * @param {Object} author - Current user (author of the duplicate)
 * @returns {Promise<string>} New post ID
 */
export const duplicateBlogPost = async (postId, author) => {
  // Get the source post
  const sourcePost = await getBlogPost(postId);
  if (!sourcePost) {
    throw new Error('Source post not found');
  }

  // Create new post data
  const newPostRef = doc(collection(db, BLOG_POSTS_COLLECTION));
  const newPostId = newPostRef.id;
  const now = serverTimestamp();

  // Clone languages with new slugs
  const newLanguages = {};
  for (const [lang, content] of Object.entries(sourcePost.languages || {})) {
    // Generate unique slug by appending "-copy" and checking availability
    let newSlug = content.slug ? `${content.slug}-copy` : null;
    if (newSlug) {
      let counter = 1;
      while (!(await isSlugAvailable(lang, newSlug))) {
        newSlug = `${content.slug}-copy-${counter}`;
        counter++;
        if (counter > 100) {
          throw new Error(`Unable to generate unique slug for language ${lang}`);
        }
      }
    }

    newLanguages[lang] = {
      ...content,
      slug: newSlug,
      title: content.title ? `${content.title} (Copy)` : content.title,
    };
  }

  const newPost = {
    ...sourcePost,
    id: newPostId,
    status: BLOG_POST_STATUS.DRAFT,
    languages: newLanguages,
    author: {
      uid: author.uid,
      displayName: author.displayName || author.email || 'Unknown',
    },
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    relatedPostIds: [], // Clear related posts for the copy
  };

  // Remove fields that shouldn't be copied
  delete newPost.viewCount;

  // Phase 2 Insights: Compute insightKeys for the duplicated post
  newPost.insightKeys = computeBlogInsightKeys({
    id: newPostId,
    eventTags: newPost.eventTags,
    currencyTags: newPost.currencyTags,
  });

  // Save the new post and claim slugs in a transaction
  await runTransaction(db, async (transaction) => {
    // Claim slugs for each language
    for (const [lang, content] of Object.entries(newLanguages)) {
      if (content.slug) {
        claimSlug(transaction, newPostId, lang, content.slug);
      }
    }
    
    // Create the post
    transaction.set(newPostRef, newPost);
  });

  return newPostId;
};
