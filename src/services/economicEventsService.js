/**
 * src/services/economicEventsService.js
 * 
 * Purpose: Service layer for economic events data fetching and management
 * Supports multi-source economic calendar data (mql5, forex-factory, fxstreet)
 * 
 * Changelog:
 * v2.5.0 - 2025-12-12 - Added cached description index and helper for description availability checks (reduces per-event Firestore reads).
 * v2.4.1 - 2025-12-11 - Normalized impact values for consistent filtering across canonical and legacy data paths.
 * v2.4.0 - 2025-12-11 - Canonical-aware filters (currencies/categories), title-casing event names, cache alignment for canonical path.
 * v2.3.0 - 2025-12-11 - Added manual NFS week sync helper for drawer action.
 * v2.2.0 - 2025-12-11 - Added canonical economic events fetch with user-preferred source fallback.
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
import { fetchCanonicalEconomicEvents } from './canonicalEconomicEventsService';

// Title-case helper for event names (keeps short all-caps acronyms intact)
function formatEventName(name = '') {
  if (!name) return '';
  return name
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 3 && word === word.toUpperCase()) return word; // Keep acronyms
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

// Normalize impact values to a consistent set used by filters and UI
function normalizeImpactValue(impact) {
  if (!impact) return 'Data Not Loaded';

  const value = String(impact).toLowerCase();

  if (value.includes('strong') || value.includes('high') || value.includes('!!!')) {
    return 'Strong Data';
  }
  if (value.includes('moderate') || value.includes('medium') || value.includes('!!')) {
    return 'Moderate Data';
  }
  if (value.includes('weak') || value.includes('low') || value.includes('!')) {
    return 'Weak Data';
  }
  if (value.includes('non-eco') || value.includes('non-economic') || value.includes('none')) {
    return 'Non-Economic';
  }

  return 'Data Not Loaded';
}

// Firestore collection names (legacy - kept for descriptions)
const DESCRIPTIONS_COLLECTION = 'economicEventDescriptions';
const DESCRIPTIONS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

let descriptionsIndexCache = null;
let descriptionsCacheTimestamp = 0;

const buildDescriptionsIndex = (descriptions = []) => {
  const byName = new Map();
  const byAlias = new Map();
  const byCategory = new Map();

  descriptions.forEach((desc) => {
    const nameKey = desc.name?.toLowerCase();
    if (nameKey) {
      byName.set(nameKey, desc);
    }

    if (Array.isArray(desc.aliases)) {
      desc.aliases.forEach((alias) => {
        const aliasKey = alias?.toLowerCase();
        if (aliasKey) {
          byAlias.set(aliasKey, desc);
        }
      });
    }

    const categoryKey = desc.category?.toLowerCase();
    if (categoryKey && !byCategory.has(categoryKey)) {
      byCategory.set(categoryKey, desc);
    }
  });

  return { byName, byAlias, byCategory };
};

const loadDescriptionsIndex = async () => {
  const now = Date.now();
  if (!descriptionsIndexCache || now - descriptionsCacheTimestamp > DESCRIPTIONS_CACHE_TTL_MS) {
    const descriptionsRef = collection(db, DESCRIPTIONS_COLLECTION);
    const snapshot = await getDocs(descriptionsRef);

    const descriptions = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    descriptionsIndexCache = buildDescriptionsIndex(descriptions);
    descriptionsCacheTimestamp = now;
  }

  return descriptionsIndexCache;
};

const findDescriptionMatch = (index, eventName, category) => {
  if (!index) return null;

  const nameKey = eventName?.toLowerCase();
  if (nameKey) {
    const nameMatch = index.byName.get(nameKey) || index.byAlias.get(nameKey);
    if (nameMatch) return nameMatch;
  }

  const categoryKey = category?.toLowerCase();
  if (categoryKey) {
    return index.byCategory.get(categoryKey) || null;
  }

  return null;
};

/**
 * Trigger NFS weekly sync (on-demand)
 * Called by drawer "Sync Week" button to refresh the canonical schedule.
 */
export const triggerNfsWeekSync = async () => {
  try {
    const baseUrl = 'https://us-central1-time-2-trade-app.cloudfunctions.net/syncWeekFromNfsNow';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    const { invalidateCache } = await import('./eventsCache');
    invalidateCache();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('❌ NFS week sync failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to trigger NFS week sync',
    };
  }
};

/**
 * Trigger JBlanked actuals sync (on-demand)
 * Called by drawer "Sync Actuals" button to refresh today's actual values
 * from all configured JBlanked sources (ForexFactory, MQL5/MT, FXStreet).
 */
export const triggerJblankedActualsSync = async () => {
  try {
    const baseUrl = 'https://us-central1-time-2-trade-app.cloudfunctions.net/syncTodayActualsFromJblankedNow';

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    const { invalidateCache } = await import('./eventsCache');
    invalidateCache();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('❌ JBlanked actuals sync failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to trigger JBlanked actuals sync',
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
 * @param {('auto'|'jblanked-ff'|'jblanked-mt'|'jblanked-fxstreet')} [filters.preferredSource] - Preferred provider for actuals
 * @param {boolean} [filters.useCanonical] - If false, skip canonical collection and use legacy per-source data
 * @returns {Promise<Object>} Events data
 */
export const getEventsByDateRange = async (startDate, endDate, filters = {}) => {
  try {
    const source = filters.source || DEFAULT_NEWS_SOURCE;
    const preferredSource = filters.preferredSource || 'auto';
    const useCanonical = filters.useCanonical !== false;

    let events = [];
    let usedCanonical = false;

    if (useCanonical) {
      const canonicalResult = await fetchCanonicalEconomicEvents({
        from: startDate,
        to: endDate,
        currencies: filters.currencies,
        preferredSource,
      });

      if (canonicalResult.success && canonicalResult.data.length > 0) {
        events = canonicalResult.data.map(event => {
          const eventDate = event.datetimeUtc ? new Date(event.datetimeUtc) : null;
          const impact = normalizeImpactValue(event.impact);
          const formattedName = formatEventName(event.name);
          return {
            id: event.id,
            name: formattedName,
            currency: event.currency,
            category: null,
            date: eventDate,
            actual: event.actual,
            forecast: event.forecast,
            previous: event.previous,
            strength: impact,
            quality: null,
            source: event.sourceKey || 'canonical',
            // PascalCase aliases for backward compatibility
            Name: formattedName,
            Currency: event.currency,
            Category: null,
            Strength: impact,
            Quality: null,
            Forecast: event.forecast,
            Previous: event.previous,
            Actual: event.actual,
            dateISO: eventDate?.toISOString(),
            dateLocal: eventDate?.toLocaleString(),
          };
        });
        usedCanonical = true;
      }
    }

    if (!usedCanonical) {
      const { getFilteredEvents } = await import('./eventsCache');
      const cachedEvents = await getFilteredEvents({
        startDate,
        endDate,
        source,
        // Note: Impact/category/currency filters applied client-side after enrichment
      });

      events = cachedEvents.map(event => {
        // Cached events already have timestamps as milliseconds
        const eventDate = new Date(event.date);
        const formattedName = formatEventName(event.name || event.Name);
        const impact = normalizeImpactValue(event.strength || event.Strength || event.impact);
        
        // Normalize field names: Provide both lowercase and PascalCase for compatibility
        return {
          id: event.id,
          ...event, // lowercase fields from cache
          name: formattedName,
          Name: formattedName,
          // Add PascalCase aliases for backward compatibility with EventsTimeline2
          Currency: event.currency || event.Currency,
          Category: event.category || event.Category,
          Strength: impact,
          strength: impact,
          impact,
          date: eventDate,
          // Add ISO string for easier debugging
          dateISO: eventDate?.toISOString(),
          dateLocal: eventDate?.toLocaleString(),
        };
      });
    }

    // IMPORTANT: Enrich events with impact data BEFORE filtering
    // This allows filtering by enriched impact values from descriptions collection
    events = await enrichEventsWithDescriptions(events);

    // Normalize impacts post-enrichment to ensure consistent filter values
    events = events.map(event => {
      const impact = normalizeImpactValue(event.strength || event.Strength || event.impact);
      return {
        ...event,
        strength: impact,
        Strength: impact,
        impact,
      };
    });

    const normalizedImpactFilters = (filters.impacts || []).map(normalizeImpactValue);

    // Apply impact filter (support both lowercase and PascalCase)
    if (normalizedImpactFilters.length > 0) {
      const beforeCount = events.length;
      events = events.filter(event => {
        const strength = normalizeImpactValue(event.strength || event.Strength || event.impact);
        const matchesFilter = normalizedImpactFilters.includes(strength);
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
      canonical: usedCanonical,
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
    const index = await loadDescriptionsIndex();
    const match = findDescriptionMatch(index, eventName, category);

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
 * Check if a description entry exists for the given event
 * Reuses the cached description index for O(1) lookups
 *
 * @param {string} eventName - Event name to search for
 * @param {string} category - Event category to search for
 * @returns {Promise<boolean>} True if a description exists
 */
export const hasEventDescriptionEntry = async (eventName, category) => {
  try {
    const index = await loadDescriptionsIndex();
    const match = findDescriptionMatch(index, eventName, category);
    return Boolean(match);
  } catch (error) {
    console.error('❌ Failed to check event description availability:', error);
    return false;
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
export const getEventCategories = async (options = DEFAULT_NEWS_SOURCE) => {
  const source = typeof options === 'string' ? options : (options?.source || DEFAULT_NEWS_SOURCE);
  const useCanonical = typeof options === 'object' ? options?.useCanonical !== false : true;
  try {
    // Canonical path: query unified collection
    if (useCanonical) {
      const rootDoc = doc(collection(db, 'economicEvents'), 'events');
      const canonicalRef = collection(rootDoc, 'events');
      const snapshot = await getDocs(query(canonicalRef, limit(5000)));

      const categories = new Set();
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const category = data.category || data.Category;
        if (category && category !== 'null') categories.add(category);
      });

      return {
        success: true,
        data: Array.from(categories).sort(),
        cached: false,
        source: 'canonical',
      };
    }

    // Try cache first for legacy per-source collections
    const { getCachedCategories } = await import('./eventsCache');
    const cachedCategories = await getCachedCategories(source);
    
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
export const getEventCurrencies = async (options = DEFAULT_NEWS_SOURCE) => {
  const source = typeof options === 'string' ? options : (options?.source || DEFAULT_NEWS_SOURCE);
  const useCanonical = typeof options === 'object' ? options?.useCanonical !== false : true;
  try {
    // Canonical path: query unified collection
    if (useCanonical) {
      const rootDoc = doc(collection(db, 'economicEvents'), 'events');
      const canonicalRef = collection(rootDoc, 'events');
      const snapshot = await getDocs(query(canonicalRef, limit(5000)));

      const currencies = new Set();
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const currency = data.currency || data.Currency;
        if (currency) currencies.add(currency.toUpperCase());
      });

      return {
        success: true,
        data: Array.from(currencies).sort(),
        cached: false,
        source: 'canonical',
      };
    }

    // Try cache first
    const { getCachedCurrencies } = await import('./eventsCache');
    const cachedCurrencies = await getCachedCurrencies(source);
    
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
      if (currency) currencies.add(currency.toUpperCase());
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
