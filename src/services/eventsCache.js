/**
 * src/services/eventsCache.js
 * 
 * Purpose: Enterprise-grade caching service for economic events
 * Optimizes performance by minimizing Firestore reads while ensuring data freshness
 * 
 * Strategy:
 * - Cache recent events (14d back + 8d forward) in localStorage per source
 * - Track last sync timestamp from systemJobs
 * - Invalidate cache when API sync occurs
 * - Smart cache expiration (24 hours fallback)
 * - Support for filtered queries without full refetch
 * - Multi-source support (forex-factory, mql5, fxstreet)
 * 
 * Changelog:
 * v2.2.0 - 2026-01-22 - BEP: Add N/A/CUS currency filter support. Currency filtering now handles ALL (global), N/A (unknown/null), and CUS (custom events) special currency types.
 * v2.1.2 - 2025-12-08 - Best practice confirmed: cache persists across filter changes for performance, only refreshes when stale/outdated
 * v2.1.1 - 2025-12-08 - Fixed date calculations: always use fresh Date() on every call, added detailed logging for cache date range debugging
 * v2.1.0 - 2025-12-01 - Optimized to fetch only 14d back + 8d forward (not all events)
 * v2.0.0 - 2025-12-01 - Updated to support multi-source structure (/economicEvents/{source}/events)
 * v1.0.0 - 2025-11-30 - Initial implementation with smart caching
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  doc,
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_KEY = 't2t_economic_events_cache';
const CACHE_METADATA_KEY = 't2t_events_cache_metadata';
const CACHE_VERSION = '1.0.0';
const CACHE_EXPIRY_HOURS = 24; // Fallback expiry if sync tracking fails
const cacheWarningsShown = new Set(); // Prevent repeated warnings per session

const logCacheWarning = (message, source) => {
  // Only surface cache warnings when explicitly enabled
  if (import.meta.env?.VITE_DEBUG_CACHE !== 'true') return;
  const key = `${source || 'unknown'}:${message}`;
  if (cacheWarningsShown.has(key)) return;
  cacheWarningsShown.add(key);
  console.warn(message);
};

// ============================================================================
// CACHE STRUCTURE
// ============================================================================

/**
 * Cache Metadata
 * @typedef {Object} CacheMetadata
 * @property {string} version - Cache version for migration
 * @property {number} cachedAt - Timestamp when cache was created
 * @property {number} lastSyncAt - Last API sync timestamp from systemJobs
 * @property {number} eventCount - Number of cached events
 * @property {string[]} currencies - Available currencies
 * @property {string[]} categories - Available categories
 */

/**
 * Cached Event (lightweight structure)
 * @typedef {Object} CachedEvent
 * @property {string} id - Document ID
 * @property {string} name - Event name
 * @property {string} currency - Currency code
 * @property {string} category - Event category
 * @property {number} date - Unix timestamp (milliseconds)
 * @property {number} actual - Actual value
 * @property {number} forecast - Forecast value
 * @property {number} previous - Previous value
 * @property {string} outcome - Outcome description
 * @property {string} strength - Impact strength
 * @property {string} quality - Data quality
 * @property {number} projection - Projection value
 * @property {string} source - Data source
 */

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Get cache metadata
 * @param {string} source - Data source
 * @returns {CacheMetadata|null}
 */
function getCacheMetadata(source = 'forex-factory') {
  try {
    const metadataKey = `${CACHE_METADATA_KEY}_${source}`;
    const metadata = localStorage.getItem(metadataKey);
    if (!metadata) return null;
    
    const parsed = JSON.parse(metadata);
    
    // Version check
    if (parsed.version !== CACHE_VERSION) {
      console.warn('📦 Cache version mismatch, invalidating...');
      invalidateCache(source);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('❌ Error reading cache metadata:', error);
    return null;
  }
}

/**
 * Set cache metadata
 * @param {CacheMetadata} metadata
 * @param {string} source - Data source
 */
function setCacheMetadata(metadata, source = 'forex-factory') {
  try {
    const metadataKey = `${CACHE_METADATA_KEY}_${source}`;
    localStorage.setItem(metadataKey, JSON.stringify(metadata));
  } catch (error) {
    console.error('❌ Error writing cache metadata:', error);
  }
}

/**
 * Get cached events
 * @param {string} source - Data source
 * @returns {CachedEvent[]|null}
 */
function getCachedEvents(source = 'forex-factory') {
  try {
    const cacheKey = `${CACHE_KEY}_${source}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('❌ Error reading cached events:', error);
    return null;
  }
}

/**
 * Set cached events
 * @param {CachedEvent[]} events
 * @param {string} source - Data source
 */
function setCachedEvents(events, source = 'forex-factory') {
  try {
    const cacheKey = `${CACHE_KEY}_${source}`;
    localStorage.setItem(cacheKey, JSON.stringify(events));
  } catch (error) {
    console.error('❌ Error writing cached events:', error);
    // If quota exceeded, clear old cache and retry
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ LocalStorage quota exceeded, clearing cache...');
      invalidateCache();
    }
  }
}

/**
 * Invalidate cache
 * @param {string} source - Optional specific source to invalidate, or all if not provided
 */
export function invalidateCache(source = null) {
  if (source) {
    localStorage.removeItem(`${CACHE_KEY}_${source}`);
    localStorage.removeItem(`${CACHE_METADATA_KEY}_${source}`);
  } else {
    // Clear all source-specific caches
    const sources = ['forex-factory', 'mql5', 'fxstreet'];
    sources.forEach(src => {
      localStorage.removeItem(`${CACHE_KEY}_${src}`);
      localStorage.removeItem(`${CACHE_METADATA_KEY}_${src}`);
    });
    // Also clear legacy cache keys if they exist
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_METADATA_KEY);
  }
}

/**
 * Check if cache is valid
 * @param {string} source - Data source
 * @returns {Promise<boolean>}
 */
async function isCacheValid(source = 'forex-factory') {
  const metadata = getCacheMetadata(source);
  if (!metadata) return false;
  
  // Check if cache is too old (fallback expiry)
  const now = Date.now();
  const cacheAge = now - metadata.cachedAt;
  const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
  
  if (cacheAge > maxAge) {
    console.warn('⏰ Cache expired (age-based)');
    return false;
  }
  
  // CRITICAL: Check if cached date range is still current
  // Cache should cover: 14 days back + 8 days forward from NOW
  // If cache was created days ago, it won't have today's events
  const currentDate = new Date();
  const expectedStartDate = new Date(currentDate);
  expectedStartDate.setDate(expectedStartDate.getDate() - 14);
  expectedStartDate.setHours(0, 0, 0, 0);
  
  const expectedEndDate = new Date(currentDate);
  expectedEndDate.setDate(expectedEndDate.getDate() + 8);
  expectedEndDate.setHours(23, 59, 59, 999);
  
  // Get cached events to check their date range
  const cachedEvents = getCachedEvents(source);
  if (!cachedEvents || cachedEvents.length === 0) {
    logCacheWarning('⚠️ Cache invalid: no cached events found', source);
    return false;
  }
  
  // Check if cache covers expected range
  const cachedDates = cachedEvents.map(e => e.date).sort((a, b) => a - b);
  const cachedStartDate = cachedDates[0];
  const cachedEndDate = cachedDates[cachedDates.length - 1];
  
  // Cache is invalid if it doesn't cover at least 80% of expected range
  const expectedStart = expectedStartDate.getTime();
  const expectedEnd = expectedEndDate.getTime();
  
  // Cache must start within 3 days of expected start and end within 3 days of expected end
  const startDiff = Math.abs(cachedStartDate - expectedStart) / (1000 * 60 * 60 * 24);
  const endDiff = Math.abs(cachedEndDate - expectedEnd) / (1000 * 60 * 60 * 24);
  
  if (startDiff > 3 || endDiff > 3) {
    logCacheWarning(`⚠️ Cache date range outdated: startDiff=${startDiff.toFixed(1)}d, endDiff=${endDiff.toFixed(1)}d`, source);
    return false;
  }
  
  // Check if API sync occurred after cache was created
  try {
    const syncStatus = await getLastSyncTimestamp();
    
    if (!syncStatus) {
      // No sync status available, trust cache if not expired
      return true;
    }
    
    if (syncStatus > metadata.lastSyncAt) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking sync status:', error);
    // On error, trust cache if not expired by age
    return cacheAge <= maxAge;
  }
}

/**
 * Get last sync timestamp from systemJobs
 * @returns {Promise<number|null>}
 */
async function getLastSyncTimestamp() {
  try {
    const docRef = doc(db, 'systemJobs', 'economicEventsCalendarSync');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    const lastRun = data.lastRun;
    
    if (!lastRun) return null;
    
    // Convert Firestore Timestamp to milliseconds
    return lastRun.toMillis ? lastRun.toMillis() : lastRun.seconds * 1000;
  } catch (error) {
    // Gracefully handle permission errors (unauthenticated users)
    if (error.code === 'permission-denied') {
      console.warn('⚠️ Cannot read sync status (not authenticated), using cache age fallback');
      return null;
    }
    console.error('❌ Error fetching sync status:', error);
    return null;
  }
}

/**
 * Subscribe to sync status changes
 * @param {Function} onSyncUpdate - Callback when sync occurs
 * @returns {Function} Unsubscribe function
 */
export function subscribeSyncStatus(onSyncUpdate) {
  const docRef = doc(db, 'systemJobs', 'economicEventsCalendarSync');
  
  let lastKnownSync = null;
  
  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) return;
      
      const data = docSnap.data();
      const lastRun = data.lastRun;
      
      if (!lastRun) return;
      
      const syncTimestamp = lastRun.toMillis ? lastRun.toMillis() : lastRun.seconds * 1000;
      
      // Check if this is a new sync (not initial load)
      if (lastKnownSync !== null && syncTimestamp > lastKnownSync) {
        invalidateCache();
        onSyncUpdate();
      }
      
      lastKnownSync = syncTimestamp;
    },
    (error) => {
      console.error('❌ Error subscribing to sync status:', error);
    }
  );
  
  return unsubscribe;
}

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetch recent events from Firestore and cache them
 * Supports multi-source structure (/economicEvents/{source}/events)
 * Fetches 14 days back + 8 days forward for optimal performance
 * 
 * @param {string} source - Data source to fetch from ('forex-factory', 'mql5', 'fxstreet')
 * @returns {Promise<CachedEvent[]>}
 */
async function fetchAndCacheAllEvents(source = 'forex-factory') {
  try {
    // Calculate date range: 14 days back, 8 days forward
    // IMPORTANT: Use fresh Date() to ensure we get current date, not cached reference
    const now = new Date(); // Fresh date on every call
    
    const startDate = new Date(now.getTime()); // Clone to avoid mutation
    startDate.setDate(startDate.getDate() - 14);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(now.getTime()); // Clone to avoid mutation
    endDate.setDate(endDate.getDate() + 8);
    endDate.setHours(23, 59, 59, 999);
    
    
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    // Fetch from multi-source structure with date range filter
    const eventsRef = collection(db, 'economicEvents', source, 'events');
    const q = query(
      eventsRef, 
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    const events = [];
    const currencies = new Set();
    const categories = new Set();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      // Extract unique currencies and categories
      if (data.currency) currencies.add(data.currency);
      if (data.category) categories.add(data.category);
      
      // Create lightweight cached event
      events.push({
        id: doc.id,
        name: data.name || data.Name,
        currency: data.currency || data.Currency,
        category: data.category || data.Category,
        date: data.date?.toMillis ? data.date.toMillis() : data.date?.seconds * 1000 || 0,
        actual: data.actual ?? data.Actual ?? null,
        forecast: data.forecast ?? data.Forecast ?? null,
        previous: data.previous ?? data.Previous ?? null,
        outcome: data.outcome || data.Outcome || '',
        strength: data.strength || data.Strength || '',
        quality: data.quality || data.Quality || '',
        projection: data.projection ?? data.Projection ?? null,
        source: source,
      });
    });
    
    // Cache events with source identifier
    const cacheKey = `${CACHE_KEY}_${source}`;
    localStorage.setItem(cacheKey, JSON.stringify(events));
    
    // Cache metadata
    const lastSyncAt = await getLastSyncTimestamp() || Date.now();
    const metadata = {
      version: CACHE_VERSION,
      cachedAt: Date.now(),
      lastSyncAt,
      eventCount: events.length,
      currencies: Array.from(currencies).sort(),
      categories: Array.from(categories).sort(),
      source: source,
    };
    
    const metadataKey = `${CACHE_METADATA_KEY}_${source}`;
    localStorage.setItem(metadataKey, JSON.stringify(metadata));
    
    return events;
  } catch (error) {
    console.error(`❌ Error fetching events from ${source}:`, error);
    return [];
  }
}

/**
 * Get all events (from cache or Firestore)
 * @param {boolean} forceRefresh - Force fetch from Firestore
 * @param {string} source - Data source to fetch from
 * @returns {Promise<CachedEvent[]>}
 */
export async function getAllEvents(forceRefresh = false, source = 'forex-factory') {
  // Check cache validity
  if (!forceRefresh && await isCacheValid(source)) {
    const cached = getCachedEvents(source);
    if (cached) {
      return cached;
    }
  }
  
  // Fetch and cache
  return await fetchAndCacheAllEvents(source);
}

/**
 * Filter cached events by criteria
 * 
 * BEST PRACTICE: This function applies filters to cached data in memory (client-side).
 * - Cache is NOT invalidated on filter changes (performance optimization)
 * - Cache only refreshes when: stale (24h+), outdated date range, or API sync occurs
 * - Filters are instant because they operate on in-memory data
 * - Prevents unnecessary Firestore reads (saves costs + improves UX)
 * 
 * @param {Object} filters
 * @param {Date} filters.startDate
 * @param {Date} filters.endDate
 * @param {string[]} filters.currencies
 * @param {string[]} filters.categories
 * @param {string[]} filters.impacts
 * @param {string} filters.source - Data source
 * @returns {Promise<CachedEvent[]>}
 */
export async function getFilteredEvents(filters = {}) {
  const source = filters.source || 'forex-factory';
  
  // getAllEvents returns cached data if valid, only fetches from Firestore if needed
  // This is CORRECT behavior - do not invalidate cache on filter changes
  const allEvents = await getAllEvents(false, source);
  
  const {
    startDate,
    endDate,
    currencies = [],
    categories = [],
    impacts = [],
  } = filters;
  
  const filtered = allEvents.filter((event) => {
    // Date range filter
    if (startDate && event.date < startDate.getTime()) return false;
    if (endDate && event.date > endDate.getTime()) return false;
    
    // BEP: Currency filter with special currency support (ALL, N/A, CUS)
    if (currencies.length > 0) {
      const normalizedFilters = currencies.map((c) => String(c).toUpperCase().trim());
      const hasAllFilter = normalizedFilters.includes('ALL');
      const hasUnkFilter = normalizedFilters.includes('N/A');
      const hasCusFilter = normalizedFilters.includes('CUS');
      
      const eventCurrency = event.currency;
      const isCustom = Boolean(event.isCustom);
      const normalizedCurrency = eventCurrency ? String(eventCurrency).toUpperCase().trim() : null;
      
      // CUS filter: match custom user events
      if (hasCusFilter && isCustom) {
        // Match - continue to next filter
      }
      // ALL filter: match global events
      else if (hasAllFilter && (normalizedCurrency === 'ALL' || normalizedCurrency === 'GLOBAL')) {
        // Match - continue to next filter
      }
      // N/A filter: match events with null/empty/missing currency (but not custom)
      else if (hasUnkFilter && !isCustom && (normalizedCurrency === null || normalizedCurrency === '' || normalizedCurrency === '—' || normalizedCurrency === '-' || normalizedCurrency === 'N/A')) {
        // Match - continue to next filter
      }
      // Standard currency: exact match
      else if (normalizedCurrency && normalizedFilters.includes(normalizedCurrency)) {
        // Match - continue to next filter
      }
      else {
        return false; // No match
      }
    }
    
    // Category filter
    if (categories.length > 0 && !categories.includes(event.category)) return false;
    
    // Impact filter (map strength to impact)
    if (impacts.length > 0) {
      const eventImpact = event.strength?.toLowerCase() || '';
      const matchesImpact = impacts.some((impact) => {
        const impactLower = impact.toLowerCase();
        return eventImpact.includes(impactLower);
      });
      if (!matchesImpact) return false;
    }
    
    return true;
  });
  return filtered;
}

/**
 * Get available currencies from cache
 * @param {string} source - Data source
 * @returns {Promise<string[]>}
 */
export async function getCachedCurrencies(source = 'forex-factory') {
  const metadata = getCacheMetadata(source);
  
  if (metadata && metadata.currencies) {
    return metadata.currencies;
  }
  
  // If no metadata, fetch all events to build cache
  await getAllEvents(false, source);
  
  const updatedMetadata = getCacheMetadata(source);
  return updatedMetadata?.currencies || [];
}

/**
 * Get available categories from cache
 * @param {string} source - Data source
 * @returns {Promise<string[]>}
 */
export async function getCachedCategories(source = 'forex-factory') {
  const metadata = getCacheMetadata(source);
  
  if (metadata && metadata.categories) {
    return metadata.categories;
  }
  
  // If no metadata, fetch all events to build cache
  await getAllEvents(false, source);
  
  const updatedMetadata = getCacheMetadata(source);
  return updatedMetadata?.categories || [];
}

/**
 * Get cache statistics
 * @param {string} source - Data source
 * @returns {Object|null}
 */
export function getCacheStats(source = 'forex-factory') {
  const metadata = getCacheMetadata(source);
  
  if (!metadata) {
    return null;
  }
  
  const now = Date.now();
  const cacheAge = now - metadata.cachedAt;
  const hours = Math.floor(cacheAge / (1000 * 60 * 60));
  const minutes = Math.floor((cacheAge % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    eventCount: metadata.eventCount,
    cachedAt: new Date(metadata.cachedAt),
    lastSyncAt: new Date(metadata.lastSyncAt),
    cacheAge: `${hours}h ${minutes}m`,
    cacheAgeMs: cacheAge,
    version: metadata.version,
    source: metadata.source || source,
  };
}
