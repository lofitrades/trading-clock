/**
 * src/services/eventsCache.js
 * 
 * Purpose: Enterprise-grade caching service for economic events
 * Optimizes performance by minimizing Firestore reads while ensuring data freshness
 * 
 * Strategy:
 * - Cache full event list in localStorage
 * - Track last sync timestamp from systemJobs
 * - Invalidate cache when API sync occurs
 * - Smart cache expiration (24 hours fallback)
 * - Support for filtered queries without full refetch
 * 
 * Changelog:
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
 * @returns {CacheMetadata|null}
 */
function getCacheMetadata() {
  try {
    const metadata = localStorage.getItem(CACHE_METADATA_KEY);
    if (!metadata) return null;
    
    const parsed = JSON.parse(metadata);
    
    // Version check
    if (parsed.version !== CACHE_VERSION) {
      console.log('📦 Cache version mismatch, invalidating...');
      invalidateCache();
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
 */
function setCacheMetadata(metadata) {
  try {
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('❌ Error writing cache metadata:', error);
  }
}

/**
 * Get cached events
 * @returns {CachedEvent[]|null}
 */
function getCachedEvents() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
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
 */
function setCachedEvents(events) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(events));
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
 */
export function invalidateCache() {
  console.log('🗑️ Invalidating events cache');
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_METADATA_KEY);
}

/**
 * Check if cache is valid
 * @returns {Promise<boolean>}
 */
async function isCacheValid() {
  const metadata = getCacheMetadata();
  if (!metadata) return false;
  
  // Check if cache is too old (fallback expiry)
  const now = Date.now();
  const cacheAge = now - metadata.cachedAt;
  const maxAge = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
  
  if (cacheAge > maxAge) {
    console.log('⏰ Cache expired (age-based)');
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
      console.log('🔄 API sync occurred after cache, invalidating');
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
      console.log('⚠️ Cannot read sync status (not authenticated), using cache age fallback');
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
        console.log('🔔 New API sync detected, invalidating cache');
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
 * Fetch all events from Firestore and cache them
 * @returns {Promise<CachedEvent[]>}
 */
async function fetchAndCacheAllEvents() {
  console.log('📡 Fetching all events from Firestore...');
  
  const eventsRef = collection(db, 'economicEventsCalendar');
  const q = query(eventsRef, orderBy('date', 'asc'));
  
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
      source: data.source || 'mql5',
    });
  });
  
  // Cache events
  setCachedEvents(events);
  
  // Cache metadata
  const lastSyncAt = await getLastSyncTimestamp() || Date.now();
  setCacheMetadata({
    version: CACHE_VERSION,
    cachedAt: Date.now(),
    lastSyncAt,
    eventCount: events.length,
    currencies: Array.from(currencies).sort(),
    categories: Array.from(categories).sort(),
  });
  
  console.log(`✅ Cached ${events.length} events`);
  
  return events;
}

/**
 * Get all events (from cache or Firestore)
 * @param {boolean} forceRefresh - Force fetch from Firestore
 * @returns {Promise<CachedEvent[]>}
 */
export async function getAllEvents(forceRefresh = false) {
  // Check cache validity
  if (!forceRefresh && await isCacheValid()) {
    const cached = getCachedEvents();
    if (cached) {
      console.log(`📦 Using cached events (${cached.length} events)`);
      return cached;
    }
  }
  
  // Fetch and cache
  return await fetchAndCacheAllEvents();
}

/**
 * Filter cached events by criteria
 * @param {Object} filters
 * @param {Date} filters.startDate
 * @param {Date} filters.endDate
 * @param {string[]} filters.currencies
 * @param {string[]} filters.categories
 * @param {string[]} filters.impacts
 * @returns {Promise<CachedEvent[]>}
 */
export async function getFilteredEvents(filters = {}) {
  const allEvents = await getAllEvents();
  
  const {
    startDate,
    endDate,
    currencies = [],
    categories = [],
    impacts = [],
  } = filters;
  
  return allEvents.filter((event) => {
    // Date range filter
    if (startDate && event.date < startDate.getTime()) return false;
    if (endDate && event.date > endDate.getTime()) return false;
    
    // Currency filter
    if (currencies.length > 0 && !currencies.includes(event.currency)) return false;
    
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
}

/**
 * Get available currencies from cache
 * @returns {Promise<string[]>}
 */
export async function getCachedCurrencies() {
  const metadata = getCacheMetadata();
  
  if (metadata && metadata.currencies) {
    return metadata.currencies;
  }
  
  // If no metadata, fetch all events to build cache
  await getAllEvents();
  
  const updatedMetadata = getCacheMetadata();
  return updatedMetadata?.currencies || [];
}

/**
 * Get available categories from cache
 * @returns {Promise<string[]>}
 */
export async function getCachedCategories() {
  const metadata = getCacheMetadata();
  
  if (metadata && metadata.categories) {
    return metadata.categories;
  }
  
  // If no metadata, fetch all events to build cache
  await getAllEvents();
  
  const updatedMetadata = getCacheMetadata();
  return updatedMetadata?.categories || [];
}

/**
 * Get cache statistics
 * @returns {Object|null}
 */
export function getCacheStats() {
  const metadata = getCacheMetadata();
  
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
  };
}
