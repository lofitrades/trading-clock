/**
 * src/services/economicEventsService.js
 * 
 * Purpose: Service layer for economic events data fetching and management
 * Supports multi-source economic calendar data (mql5, forex-factory, fxstreet)
 * 
 * Changelog:
 * v2.1.0 - 2025-12-08 - BUGFIX: Fixed refreshEventsCache to accept source parameter and properly invalidate source-specific cache
 * v2.0.0 - 2025-12-01 - Multi-source support with cache integration
 * v1.0.0 - 2025-11-30 - Initial implementation
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { getEconomicEventsCollectionRef } from './firestoreHelpers';
import { DEFAULT_NEWS_SOURCE } from '../types/economicEvents';

// Firestore collection names (legacy - kept for descriptions)
const DESCRIPTIONS_COLLECTION = 'economicEventDescriptions';
const STATUS_COLLECTION = 'systemJobs';

/**
 * Trigger manual sync of economic events calendar (Recent events: 7d back + 30d forward)
 * Supports multi-source sync via sources array
 * Automatically invalidates cache after successful sync
 * 
 * This calls syncRecentEventsNow which syncs recent events (7 days back + 30 days forward)
 * For historical bulk sync, use triggerHistoricalSync() instead
 * 
 * @param {Object} options - Sync options
 * @param {string[]} options.sources - Array of sources to sync (e.g., ['mql5', 'forex-factory'])
 * @param {boolean} options.dryRun - If true, validates without writing to Firestore
 * @param {string} options.from - Optional start date (YYYY-MM-DD) - overrides recent range
 * @param {string} options.to - Optional end date (YYYY-MM-DD) - overrides recent range
 * @returns {Promise<Object>} Sync result
 */
export const triggerManualSync = async (options = {}) => {
  try {
    // Use syncRecentEventsNow for Sync Calendar button (7d back + 30d forward)
    const baseUrl = 'https://us-central1-time-2-trade-app.cloudfunctions.net/syncRecentEventsNow';
    
    // Uncomment this to use local emulator:
    // const baseUrl = import.meta.env.DEV
    //   ? 'http://127.0.0.1:5001/time-2-trade-app/us-central1/syncRecentEventsNow'
    //   : 'https://us-central1-time-2-trade-app.cloudfunctions.net/syncRecentEventsNow';

    const params = new URLSearchParams();
    if (options.dryRun) params.append('dryRun', 'true');
    if (options.from) params.append('from', options.from);
    if (options.to) params.append('to', options.to);

    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    // Prepare request body for multi-source sync
    const requestBody = options.sources ? { sources: options.sources } : {};

    const response = await fetch(url, {
      method: options.sources ? 'POST' : 'GET', // Use POST for multi-source
      headers: {
        'Content-Type': 'application/json',
      },
      ...(options.sources && { body: JSON.stringify(requestBody) }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Import cache invalidation dynamically to avoid circular dependency
    if (!options.dryRun) {
      const { invalidateCache } = await import('./eventsCache');
      invalidateCache();
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('❌ Manual sync failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to trigger sync',
    };
  }
};

/**
 * Get today's economic events from Firestore
 * 
 * @param {string} timezone - IANA timezone (e.g., 'America/New_York')
 * @param {string} source - News source (defaults to user's preferred source)
 * @returns {Promise<Object>} Events data
 */
export const getTodayEventsFromFirestore = async (timezone = 'UTC', source = DEFAULT_NEWS_SOURCE) => {
  try {
    // Get start and end of today in the specified timezone
    const now = new Date();
    const startOfDay = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    // Query the correct source subcollection: /economicEvents/{source}/events/{eventDocId}
    const eventsRef = getEconomicEventsCollectionRef(source);
    const q = query(
      eventsRef,
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamp to JavaScript Date
      date: doc.data().date?.toDate(),
    }));

    return {
      success: true,
      data: events,
    };
  } catch (error) {
    console.error('❌ Failed to fetch events from Firestore:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch events',
      data: [],
    };
  }
};

/**
 * Get sync status from Firestore
 * 
 * @returns {Promise<Object>} Sync status
 */
export const getSyncStatus = async () => {
  try {
    const statusRef = collection(db, STATUS_COLLECTION);
    const q = query(statusRef, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        success: true,
        data: null,
      };
    }

    const statusDoc = snapshot.docs[0];
    const data = statusDoc.data();

    return {
      success: true,
      data: {
        ...data,
        lastRunAt: data.lastRunAt?.toDate(),
      },
    };
  } catch (error) {
    console.error('❌ Failed to fetch sync status:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch sync status',
      data: null,
    };
  }
};

/**
 * Get events for a specific date range with optional filters
 * Uses caching service for optimal performance
 * 
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} filters - Optional filters
 * @param {string[]} filters.impacts - Array of impact levels ('High', 'Medium', 'Low', 'None')
 * @param {string[]} filters.eventTypes - Array of event categories
 * @param {string[]} filters.currencies - Array of currency codes
 * @param {boolean} filters.forceRefresh - Force fetch from Firestore (bypass cache)
 * @returns {Promise<Object>} Events data
 */
export const getEventsByDateRange = async (startDate, endDate, filters = {}) => {
  try {
    // Get the source from filters or use default
    const source = filters.source || DEFAULT_NEWS_SOURCE;
    
    // Import cache service dynamically to avoid circular dependency
    const { getFilteredEvents } = await import('./eventsCache');
    
    // Use cache to get events (will fetch from Firestore if cache invalid)
    const cachedEvents = await getFilteredEvents({
      startDate,
      endDate,
      source,
      // Note: Impact/category/currency filters applied client-side after enrichment
    });
    
    // Map cached events to expected format
    let events = cachedEvents.map(event => {
      // Cached events already have timestamps as milliseconds
      const eventDate = new Date(event.date);
      
      // Normalize field names: Provide both lowercase and PascalCase for compatibility
      return {
        id: event.id,
        ...event, // lowercase fields from cache
        // Add PascalCase aliases for backward compatibility with EventsTimeline2
        Name: event.name || event.Name,
        Currency: event.currency || event.Currency,
        Category: event.category || event.Category,
        Strength: event.strength || event.Strength,
        date: eventDate,
        // Add ISO string for easier debugging
        dateISO: eventDate?.toISOString(),
        dateLocal: eventDate?.toLocaleString(),
      };
    });

    // IMPORTANT: Enrich events with impact data BEFORE filtering
    // This allows filtering by enriched impact values from descriptions collection
    events = await enrichEventsWithDescriptions(events);

    // Apply impact filter (support both lowercase and PascalCase)
    if (filters.impacts && filters.impacts.length > 0) {
      const beforeCount = events.length;
      events = events.filter(event => {
        const strength = event.strength || event.Strength || 'Data Not Loaded';
        const matchesFilter = filters.impacts.includes(strength);
        return matchesFilter;
      });
    }

    // Apply event type/category filter (support both lowercase and PascalCase)
    // IMPORTANT: Skip null categories for non-MQL5 sources
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      const beforeCount = events.length;
      events = events.filter(event => {
        const category = event.category || event.Category;
        // Skip events without categories (Forex Factory, FXStreet)
        if (!category || category === null || category === 'null') return false;
        return filters.eventTypes.includes(category);
      });
    }

    // Apply currency filter (support both lowercase and PascalCase)
    if (filters.currencies && filters.currencies.length > 0) {
      const beforeCount = events.length;
      
      events = events.filter(event => {
        const currency = event.currency || event.Currency;
        const matches = filters.currencies.includes(currency);
        return matches;
      });
    }

    return {
      success: true,
      data: events,
    };
  } catch (error) {
    console.error('❌ Failed to fetch events by date range:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || 'Failed to fetch events',
      data: [],
    };
  }
};

/**
 * Get event description by name or category
 * 
 * @param {string} eventName - Event name to search for
 * @param {string} category - Event category to search for
 * @returns {Promise<Object>} Event description data
 */
export const getEventDescription = async (eventName, category) => {
  try {
    const descriptionsRef = collection(db, DESCRIPTIONS_COLLECTION);
    const q = query(descriptionsRef);
    
    const snapshot = await getDocs(q);
    
    // Search for matching description
    const descriptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Try to find by name or aliases first
    let match = descriptions.find(desc => 
      desc.name?.toLowerCase() === eventName?.toLowerCase() ||
      desc.aliases?.some(alias => alias.toLowerCase() === eventName?.toLowerCase())
    );

    // Fallback to category match
    if (!match && category) {
      match = descriptions.find(desc => 
        desc.category?.toLowerCase() === category?.toLowerCase()
      );
    }

    return {
      success: true,
      data: match || null,
    };
  } catch (error) {
    console.error('❌ Failed to fetch event description:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch event description',
      data: null,
    };
  }
};

/**
 * Enrich events with impact data from economicEventDescriptions collection
 * Used as fallback when event.strength is "Data Not Loaded" or missing
 * 
 * @param {Array} events - Array of event objects
 * @returns {Promise<Array>} Events enriched with impact data
 */
export const enrichEventsWithDescriptions = async (events) => {
  try {
    // Fetch all descriptions once
    const descriptionsRef = collection(db, DESCRIPTIONS_COLLECTION);
    const snapshot = await getDocs(descriptionsRef);
    
    const descriptions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Map impact values from descriptions (lowercase) to MQL5 format
    const impactMap = {
      'high': 'Strong Data',
      'medium': 'Moderate Data',
      'low': 'Weak Data',
      'none': 'Non-Economic'
    };

    let enrichedCount = 0;

    // Enrich each event
    const enrichedEvents = events.map(event => {
      const needsEnrichment = 
        !event.strength || 
        event.strength === 'Data Not Loaded' || 
        event.strength === 'None' ||
        event.Strength === 'Data Not Loaded' ||
        event.Strength === 'None';

      if (!needsEnrichment) {
        return event;
      }

      // Try to find matching description
      const eventName = event.name || event.Name;
      const eventCategory = event.category || event.Category;

      let match = descriptions.find(desc => 
        desc.name?.toLowerCase() === eventName?.toLowerCase() ||
        desc.aliases?.some(alias => alias.toLowerCase() === eventName?.toLowerCase())
      );

      // Fallback to category match
      if (!match && eventCategory) {
        match = descriptions.find(desc => 
          desc.category?.toLowerCase() === eventCategory?.toLowerCase()
        );
      }

      if (match && match.impact) {
        const mappedImpact = impactMap[match.impact.toLowerCase()] || match.impact;
        enrichedCount++;
        
        return {
          ...event,
          strength: mappedImpact,
          Strength: mappedImpact,
          impact: mappedImpact,
          enrichedFromDescription: true, // Flag for debugging
        };
      }

      return event;
    });

    return enrichedEvents;
  } catch (error) {
    // Return original events on error
    return events;
  }
};

/**
 * Get all unique categories from events
 * Uses cache for performance, falls back to Firestore
 * 
 * IMPORTANT: Categories are source-specific
 * - MQL5: Full category data (Job Report, Consumer Inflation Report, etc.)
 * - Forex Factory: No category field (null)
 * - FXStreet: No category field (null)
 * 
 * @param {string} source - News source (defaults to user's preferred source)
 * @returns {Promise<Object>} Unique categories array
 */
export const getEventCategories = async (source = DEFAULT_NEWS_SOURCE) => {
  try {
    // Try cache first
    const { getCachedCategories } = await import('./eventsCache');
    const cachedCategories = await getCachedCategories();
    
    if (cachedCategories && cachedCategories.length > 0) {
      return {
        success: true,
        data: cachedCategories,
        cached: true,
      };
    }
    
    // Fallback to Firestore - query the correct source subcollection
    // Structure: /economicEvents/{source}/events/{eventDocId}
    const eventsRef = getEconomicEventsCollectionRef(source);
    const q = query(eventsRef, limit(5000)); // Reasonable limit for category extraction
    const snapshot = await getDocs(q);
    
    const categories = new Set();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      // Support both lowercase (Firestore) and PascalCase (legacy)
      const category = data.category || data.Category;
      // Only add non-null categories (Forex Factory and FXStreet don't have categories)
      if (category && category !== null && category !== 'null') {
        categories.add(category);
      }
    });

    const sortedCategories = Array.from(categories).sort();

    return {
      success: true,
      data: sortedCategories,
      cached: false,
      source, // Return source for debugging
    };
  } catch (error) {
    console.error('❌ Failed to fetch categories:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch categories',
      data: [],
    };
  }
};

/**
 * Get all unique currencies from events
 * Uses cache for performance, falls back to Firestore
 * 
 * NOTE: All sources (MQL5, Forex Factory, FXStreet) provide currency data
 * 
 * @param {string} source - News source (defaults to user's preferred source)
 * @returns {Promise<Object>} Unique currencies array
 */
export const getEventCurrencies = async (source = DEFAULT_NEWS_SOURCE) => {
  try {
    // Try cache first
    const { getCachedCurrencies } = await import('./eventsCache');
    const cachedCurrencies = await getCachedCurrencies();
    
    if (cachedCurrencies && cachedCurrencies.length > 0) {
      return {
        success: true,
        data: cachedCurrencies,
        cached: true,
      };
    }
    
    // Fallback to Firestore - query the correct source subcollection
    // Structure: /economicEvents/{source}/events/{eventDocId}
    const eventsRef = getEconomicEventsCollectionRef(source);
    const q = query(eventsRef, limit(5000)); // Reasonable limit for currency extraction
    const snapshot = await getDocs(q);
    
    const currencies = new Set();
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      // Support both lowercase (Firestore) and PascalCase (legacy)
      const currency = data.currency || data.Currency;
      if (currency) currencies.add(currency);
    });

    const sortedCurrencies = Array.from(currencies).sort();

    return {
      success: true,
      data: sortedCurrencies,
      cached: false,
      source, // Return source for debugging
    };
  } catch (error) {
    console.error('❌ Failed to fetch currencies:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch currencies',
      data: [],
    };
  }
};

// ============================================================================
// CACHE-AWARE EXPORTS
// ============================================================================

/**
 * Get filtered events with intelligent caching
 * Filters are applied in-memory on cached data for maximum performance
 * 
 * @param {Object} filters - Filter criteria
 * @param {Date} filters.startDate - Start date
 * @param {Date} filters.endDate - End date
 * @param {string[]} filters.currencies - Currency codes
 * @param {string[]} filters.categories - Categories
 * @param {string[]} filters.impacts - Impact levels
 * @param {boolean} forceRefresh - Force Firestore fetch
 * @returns {Promise<Object>} Filtered events
 */
export const getFilteredEventsFromCache = async (filters = {}, forceRefresh = false) => {
  try {
    const { getFilteredEvents } = await import('./eventsCache');
    const events = await getFilteredEvents(filters);
    
    return {
      success: true,
      data: events,
      cached: !forceRefresh,
    };
  } catch (error) {
    console.error('❌ Error getting filtered events:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch events',
      data: [],
    };
  }
};

/**
 * Subscribe to sync status changes
 * Auto-invalidates cache and triggers callback when API sync occurs
 * 
 * @param {Function} onSyncUpdate - Callback when new sync occurs
 * @returns {Function} Unsubscribe function
 */
export const subscribeToSyncUpdates = async (onSyncUpdate) => {
  const { subscribeSyncStatus } = await import('./eventsCache');
  return subscribeSyncStatus(onSyncUpdate);
};

/**
 * Get cache statistics for debugging/monitoring
 * 
 * @returns {Object|null} Cache stats or null if no cache
 */
export const getEventsCacheStats = async () => {
  const { getCacheStats } = await import('./eventsCache');
  return getCacheStats();
};

/**
 * Force cache refresh
 * Useful after manual sync or when data seems stale
 * 
 * @param {string} source - Data source to refresh (defaults to 'forex-factory')
 * @returns {Promise<void>}
 */
export const refreshEventsCache = async (source = 'forex-factory') => {
  const { invalidateCache, getAllEvents } = await import('./eventsCache');
  invalidateCache(source);
  await getAllEvents(true, source);
};
