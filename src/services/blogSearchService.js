/**
 * src/services/blogSearchService.js
 *
 * Purpose: Full-text search service for blog posts using Firestore searchTokens.
 * Implements deterministic, low-cost search with client-side ranking.
 *
 * Architecture:
 * - Query: Use searchTokens array-contains to find posts with matching tokens
 * - Ranking: Score by token matches in title > excerpt > tags > category
 * - Filtering: Support category, tags, author, language, event, currency filters
 * - Pagination: Cursor-based (Firestore) when no filters, offset-based when filters active
 *
 * BEP FIX (v1.2.0): When client-side array filters (events, currencies, tags, authors)
 * are active, fetch all matching posts from Firestore to avoid missing results that
 * fall outside the initial page limit. Safe for blog-scale data (<500 posts).
 *
 * Changelog:
 * v1.4.0 - 2026-02-08 - BEP: Unified numeric offset pagination for both fast path and filtered path.
 *                       Fast path now detects numeric cursor (from MUI Pagination) and uses
 *                       fetch-all + slice instead of Firestore startAfter. Supports page-based
 *                       navigation replacing IntersectionObserver infinite scroll.
 * v1.3.0 - 2026-02-07 - BEP CRITICAL FIX: Search was returning zero results because filter relied
 *                       exclusively on pre-computed searchTokens (empty for GPT-uploaded posts).
 *                       Replaced searchTokens-based filter with scorePost()-based filter that uses
 *                       actual content matching (title, excerpt, tags, category, events, currencies).
 *                       Scores are computed once and reused for both filtering (score > 0) and ranking.
 * v1.2.0 - 2026-02-06 - BEP FIX: Overfetch when client-side filters active
 * v1.1.0 - 2026-02-06 - Added deduplication logic
 * v1.0.0 - 2026-02-06 - Phase 6: Initial implementation
 */

import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
} from 'firebase/firestore';
import { BLOG_POST_STATUS } from '../types/blogTypes';

const BLOG_POSTS_COLLECTION = 'blogPosts';

/**
 * Parse search query into lowercase tokens
 * Removes punctuation, splits by whitespace, filters empty strings
 *
 * @param {string} searchQuery - Raw search query
 * @returns {string[]} Array of lowercase tokens
 */
const parseSearchQuery = (searchQuery) => {
  if (!searchQuery) return [];
  return searchQuery
    .toLowerCase()
    .split(/\s+/)
    .map(token => token.replace(/[^\w]/g, ''))
    .filter(token => token.length > 0);
};

/**
 * Score a post based on token matches
 * Prioritizes matches in title, then excerpt, then tags/category, then events/currencies (BEP)
 *
 * @param {Object} post - Blog post data
 * @param {string} lang - Language code
 * @param {string[]} queryTokens - Search tokens
 * @returns {number} Relevance score
 */
const scorePost = (post, lang, queryTokens) => {
  const content = post.languages?.[lang];
  if (!content) return 0;

  let score = 0;

  // Title matches (weight: 3pts per token)
  const titleLower = (content.title || '').toLowerCase();
  queryTokens.forEach(token => {
    if (titleLower.includes(token)) score += 3;
  });

  // Excerpt matches (weight: 1pt per token)
  const excerptLower = (content.excerpt || '').toLowerCase();
  queryTokens.forEach(token => {
    if (excerptLower.includes(token)) score += 1;
  });

  // Tags and category matches (weight: 0.5pts per token)
  const tagsAndCategoryText = [
    ...(post.tags || []),
    post.category || '',
  ]
    .join(' ')
    .toLowerCase();
  queryTokens.forEach(token => {
    if (tagsAndCategoryText.includes(token)) score += 0.5;
  });

  // BEP: Event and currency matches (weight: 2pts per token - high priority for traders)
  const eventsAndCurrenciesText = [
    ...(post.eventTags || []),
    ...(post.currencyTags || []),
  ]
    .join(' ')
    .toLowerCase();
  queryTokens.forEach(token => {
    if (eventsAndCurrenciesText.includes(token)) score += 2;
  });

  return score;
};

/**
 * Search blog posts by query and filters
 * BEP: Now includes currency (USD, EUR) and event (NFP, CPI) search
 *
 * @param {Object} options - Search options
 * @param {string} [options.query] - Search query (e.g., "trading tips" or "NFP" or "USD")
 * @param {string} [options.lang='en'] - Language code
 * @param {string} [options.category] - Filter by category
 * @param {string[]} [options.tags] - Filter by tags (match any)
 * @param {string[]} [options.authorIds] - Filter by author IDs (match any)
 * @param {string[]} [options.currencies] - Filter by currencies (match any, e.g., ['USD', 'EUR'])
 * @param {string[]} [options.events] - Filter by economic events (match any, e.g., ['NFP', 'CPI'])
 * @param {number} [options.limit=20] - Max results per page
 * @param {Object} [options.cursor] - Cursor for pagination (last post from previous page)
 *
 * @returns {Promise<Object>} { posts: [], hasMore: boolean, lastCursor: null|Object }
 */
export const searchBlogPosts = async (options = {}) => {
  const {
    query: searchQuery = '',
    lang = 'en',
    category = null,
    tags = [],
    authorIds = [],
    currencies = [], // BEP: Currency filter
    events = [], // BEP: Event filter
    limit: pageLimit = 20,
    cursor = null,
  } = options;

  try {
    const queryTokens = parseSearchQuery(searchQuery);

    // BEP FIX: Detect if client-side array filters are active.
    // When active, Firestore's LIMIT would cut off matching posts that aren't
    // in the most recent N results. Fetch all matching posts instead and
    // paginate client-side with a numeric offset cursor.
    const hasClientFilters = events.length > 0 || currencies.length > 0 ||
      tags.length > 0 || authorIds.length > 0 || queryTokens.length > 0;

    // Build base Firestore query constraints
    const constraints = [
      where('status', '==', BLOG_POST_STATUS.PUBLISHED),
      orderBy('publishedAt', 'desc'),
    ];

    // Category filter (always server-side — efficient)
    if (category) {
      constraints.push(where('category', '==', category));
    }

    if (!hasClientFilters) {
      // ── FAST PATH: No client-side filters → limited Firestore query ──

      // BEP v1.4.0: Detect numeric offset cursor (from MUI Pagination).
      // Firestore startAfter requires a doc snapshot, not a number.
      // When offset is numeric, fetch all and slice client-side.
      if (typeof cursor === 'number') {
        const q = query(collection(db, BLOG_POSTS_COLLECTION), ...constraints);
        const snapshot = await getDocs(q);
        let posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        let filtered = posts.filter(post => !!post.languages?.[lang]);
        const seenIds = new Set();
        filtered = filtered.filter(post => {
          if (seenIds.has(post.id)) return false;
          seenIds.add(post.id);
          return true;
        });
        const page = filtered.slice(cursor, cursor + pageLimit);
        const hasMore = cursor + pageLimit < filtered.length;
        return { posts: page, hasMore, lastCursor: hasMore ? cursor + pageLimit : null };
      }

      constraints.push(limit(pageLimit + 1));
      if (cursor) {
        constraints.push(startAfter(cursor));
      }

      const q = query(collection(db, BLOG_POSTS_COLLECTION), ...constraints);
      const snapshot = await getDocs(q);

      let posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const hasMore = posts.length > pageLimit;
      if (hasMore) posts = posts.slice(0, pageLimit);

      // Filter by language only (no array filters)
      let filtered = posts.filter(post => !!post.languages?.[lang]);

      // Cursor: last post data for Firestore startAfter
      const lastCursor = posts.length > 0 ? posts[posts.length - 1] : null;

      // Deduplicate
      const seenIds = new Set();
      const uniqueFiltered = filtered.filter(post => {
        if (seenIds.has(post.id)) return false;
        seenIds.add(post.id);
        return true;
      });

      return {
        posts: uniqueFiltered,
        hasMore,
        lastCursor,
      };
    }

    // ── FILTERED PATH: Client-side filters active → fetch all, filter, paginate ──
    const q = query(collection(db, BLOG_POSTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply all client-side filters
    // BEP v1.3.0: Apply structural filters first (language, tags, authors, currencies, events)
    // Search query matching is handled separately via scorePost() below — NOT searchTokens.
    let filtered = posts.filter(post => {
      if (!post.languages?.[lang]) return false;

      if (tags.length > 0) {
        const postTags = post.tags || [];
        if (!tags.some(tag => postTags.includes(tag))) return false;
      }

      if (authorIds.length > 0) {
        const postAuthorIds = post.authorIds || [];
        if (!authorIds.some(id => postAuthorIds.includes(id))) return false;
      }

      if (currencies.length > 0) {
        const postCurrencies = post.currencyTags || [];
        if (!currencies.some(currency => postCurrencies.includes(currency))) return false;
      }

      if (events.length > 0) {
        const postEvents = post.eventTags || [];
        if (!events.some(event => postEvents.includes(event))) return false;
      }

      return true;
    });

    // BEP v1.3.0: Score-based search filtering + ranking.
    // Previous approach used searchTokens (pre-computed at publish time) with exact Array.includes().
    // This broke for all posts where searchTokens was empty (e.g., GPT-uploaded posts that bypass
    // publishBlogPost()). Now uses scorePost() which does substring matching on actual content
    // (title, excerpt, tags, category, events, currencies) — works regardless of searchTokens.
    // Scores are computed once per post and reused for both filtering and sorting.
    if (queryTokens.length > 0) {
      const scores = new Map();
      filtered.forEach(post => {
        scores.set(post.id, scorePost(post, lang, queryTokens));
      });
      // Only keep posts with at least one content match (score > 0)
      filtered = filtered.filter(post => scores.get(post.id) > 0);
      // Sort: highest relevance first, then newest first
      filtered.sort((a, b) => {
        const diff = scores.get(b.id) - scores.get(a.id);
        if (diff !== 0) return diff;
        return (b.publishedAt?.toMillis?.() || 0) - (a.publishedAt?.toMillis?.() || 0);
      });
    }

    // Client-side pagination using numeric offset cursor
    const offset = typeof cursor === 'number' ? cursor : 0;
    const page = filtered.slice(offset, offset + pageLimit + 1);
    const hasMore = page.length > pageLimit;
    const result = hasMore ? page.slice(0, pageLimit) : page;

    // Deduplicate
    const seenIds = new Set();
    const uniqueFiltered = result.filter(post => {
      if (seenIds.has(post.id)) return false;
      seenIds.add(post.id);
      return true;
    });

    return {
      posts: uniqueFiltered,
      hasMore,
      // Numeric offset cursor: next page starts after these results
      lastCursor: hasMore ? offset + pageLimit : null,
    };
  } catch (error) {
    console.error('[BlogSearch] Error searching posts:', error);
    throw error;
  }
};

/**
 * Get all available filters for UI dropdowns
 * Now includes currencies and events for trader-focused filtering (BEP)
 *
 * @param {string} [lang='en'] - Language code
 * @returns {Promise<Object>} { categories: [], tags: [], authors: [], currencies: [], events: [] }
 */
export const getBlogSearchFilters = async (lang = 'en') => {
  try {
    const q = query(
      collection(db, BLOG_POSTS_COLLECTION),
      where('status', '==', BLOG_POST_STATUS.PUBLISHED)
    );
    const snapshot = await getDocs(q);

    const posts = snapshot.docs.map(doc => doc.data());

    // Collect unique categories, tags, authors, currencies, events
    const categories = new Set();
    const tags = new Set();
    const authors = new Set();
    const currencies = new Set(); // BEP: Currency filter
    const events = new Set(); // BEP: Event filter

    posts.forEach(post => {
      if (post.languages?.[lang]) {
        if (post.category) categories.add(post.category);
        (post.tags || []).forEach(tag => tags.add(tag));
        (post.authorIds || []).forEach(id => authors.add(id));
        // BEP: Add currency and event tags
        (post.currencyTags || []).forEach(currency => currencies.add(currency));
        (post.eventTags || []).forEach(event => events.add(event));
      }
    });

    return {
      categories: Array.from(categories).sort(),
      tags: Array.from(tags).sort(),
      authors: Array.from(authors),
      currencies: Array.from(currencies).sort(), // BEP: Currency filter options
      events: Array.from(events).sort(), // BEP: Event filter options
    };
  } catch (error) {
    console.error('[BlogSearch] Error fetching filters:', error);
    throw error;
  }
};

/**
 * Get suggested search keywords based on popular post metadata
 * Useful for autocomplete or search suggestions
 *
 * @param {string} [lang='en'] - Language code
 * @returns {Promise<string[]>} Array of popular keywords
 */
export const getBlogSearchSuggestions = async (lang = 'en') => {
  try {
    const q = query(
      collection(db, BLOG_POSTS_COLLECTION),
      where('status', '==', BLOG_POST_STATUS.PUBLISHED)
    );
    const snapshot = await getDocs(q);

    const posts = snapshot.docs.map(doc => doc.data());
    const suggestions = new Set();

    posts.forEach(post => {
      if (post.languages?.[lang]) {
        // Add title words (first 3 words)
        const titleWords = (post.languages[lang].title || '')
          .split(/\s+/)
          .slice(0, 3)
          .map(word => word.replace(/[^\w]/g, '').toLowerCase())
          .filter(word => word.length > 2);
        titleWords.forEach(word => suggestions.add(word));

        // Add tags
        (post.tags || []).forEach(tag => suggestions.add(tag));

        // Add keywords
        (post.keywords || []).forEach(keyword => suggestions.add(keyword));
      }
    });

    return Array.from(suggestions)
      .sort()
      .slice(0, 20); // Limit to 20 suggestions
  } catch (error) {
    console.error('[BlogSearch] Error fetching suggestions:', error);
    throw error;
  }
};
