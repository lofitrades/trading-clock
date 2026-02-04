/**
 * src/stores/eventsStore.js
 *
 * Purpose: Centralized Zustand store for economic events data management
 * Single source of truth for events, normalized state structure, query caching
 * Eliminates redundant fetches and multi-component re-renders
 *
 * Architecture:
 * - Normalized data structure (eventsById, eventsByDate, eventsByCurrency)
 * - Query result caching with TTL
 * - Smart cache invalidation on data updates
 * - Selective subscriptions (components only re-render on relevant changes)
 * - Real-time updates via Firestore onSnapshot listeners
 *
 * Changelog:
 * v1.2.0 - 2026-02-02 - BEP: updateEvent now adds new events if not found in store. Handles race condition where real-time listener fires before initial fetch.
 * v1.1.0 - 2026-02-02 - BEP: Added updateEvent action for real-time admin edits, eventIds selector
 * v1.0.0 - 2026-01-29 - BEP PHASE 2.1: Initial Zustand store with normalized state, query caching, and smart invalidation.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

// Constants
const QUERY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Normalize events from Firestore into indexed structure
 * @param {Array} events - Raw events from Firestore
 * @returns {Object} Normalized { eventsById, dateIndex, currencyIndex }
 */
const normalizeEvents = (events = []) => {
  const eventsById = {};
  const dateIndex = {}; // { 'YYYY-MM-DD': [eventIds] }
  const currencyIndex = {}; // { 'USD': [eventIds] }
  const impactIndex = {}; // { 'High': [eventIds] }

  events.forEach((event) => {
    const eventId = event.id || event.eventId || `${event.name}-${event.date}`;
    eventsById[eventId] = {
      ...event,
      id: eventId,
    };

    // Index by date (YYYY-MM-DD format)
    if (event.date) {
      const date = event.date instanceof Date ? event.date : new Date(event.date);
      const dateKey = date.toISOString().split('T')[0];
      if (!dateIndex[dateKey]) dateIndex[dateKey] = [];
      dateIndex[dateKey].push(eventId);
    }

    // Index by currency
    const currency = event.currency || event.Currency || 'N/A';
    if (!currencyIndex[currency]) currencyIndex[currency] = [];
    currencyIndex[currency].push(eventId);

    // Index by impact
    const impact = event.impact || event.Strength || 'Medium';
    if (!impactIndex[impact]) impactIndex[impact] = [];
    impactIndex[impact].push(eventId);
  });

  return {
    eventsById,
    dateIndex,
    currencyIndex,
    impactIndex,
    count: events.length,
  };
};

/**
 * Create Zustand store with devtools middleware
 */
const useEventsStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // ========================================================================
      // NORMALIZED STATE
      // ========================================================================
      eventsById: {},
      eventIds: [], // Array of all event IDs for iteration
      dateIndex: {},
      currencyIndex: {},
      impactIndex: {},
      totalCount: 0,
      lastNormalizedAt: null,

      // ========================================================================
      // QUERY CACHE
      // ========================================================================
      queryCache: new Map(), // { queryKey: { ids, timestamp, params } }
      lastTimezone: null, // Track timezone for cache invalidation

      // ========================================================================
      // SOURCE TRACKING
      // ========================================================================
      sources: new Set(), // Track which sources are loaded ('forex-factory', 'jblanked-ff', etc.)
      lastSyncAt: {}, // { source: timestamp }

      // ========================================================================
      // ACTIONS
      // ========================================================================

      /**
       * Add or update events (normalized)
       * @param {Array|Object} events - Single event or array of events
       * @param {Object} options - { source, overwrite }
       */
      addEvents: (events, options = {}) => {
        const { source = 'canonical', overwrite = false } = options;
        const isArray = Array.isArray(events);
        const eventsList = isArray ? events : [events];

        set((state) => {
          const currentEvents = overwrite
            ? eventsList
            : [...Object.values(state.eventsById), ...eventsList];

          const normalized = normalizeEvents(currentEvents);

          return {
            eventsById: normalized.eventsById,
            dateIndex: normalized.dateIndex,
            currencyIndex: normalized.currencyIndex,
            impactIndex: normalized.impactIndex,
            totalCount: normalized.count,
            eventIds: Object.keys(normalized.eventsById),
            lastNormalizedAt: Date.now(),
            sources: new Set([...state.sources, source]),
            lastSyncAt: { ...state.lastSyncAt, [source]: Date.now() },
          };
        });
      },

      /**
       * Update a single event in-place (for real-time admin edits)
       * BEP: Optimistic update pattern - update store immediately, invalidate cache
       * If event doesn't exist in store, add it (handles fresh page load scenario)
       * @param {string} eventId - Event document ID
       * @param {Object} updates - Fields to update (or full event if new)
       */
      updateEvent: (eventId, updates) => {
        set((state) => {
          const existingEvent = state.eventsById[eventId];
          
          // If event doesn't exist, add it as a new event
          // This handles the case where real-time update fires before initial fetch completes
          if (!existingEvent) {
            const newEvent = { ...updates, id: eventId };
            const allEvents = [...Object.values(state.eventsById), newEvent];
            const normalized = normalizeEvents(allEvents);
            
            return {
              eventsById: normalized.eventsById,
              dateIndex: normalized.dateIndex,
              currencyIndex: normalized.currencyIndex,
              impactIndex: normalized.impactIndex,
              totalCount: normalized.count,
              eventIds: Object.keys(normalized.eventsById),
              lastNormalizedAt: Date.now(),
              queryCache: new Map(),
            };
          }

          // Merge updates into existing event
          const updatedEvent = { ...existingEvent, ...updates, id: eventId };

          // Re-normalize with updated event
          const allEvents = Object.values(state.eventsById).map((evt) =>
            evt.id === eventId ? updatedEvent : evt
          );
          const normalized = normalizeEvents(allEvents);

          return {
            eventsById: normalized.eventsById,
            dateIndex: normalized.dateIndex,
            currencyIndex: normalized.currencyIndex,
            impactIndex: normalized.impactIndex,
            totalCount: normalized.count,
            eventIds: Object.keys(normalized.eventsById),
            lastNormalizedAt: Date.now(),
            // Clear query cache to force re-fetch with updated data
            queryCache: new Map(),
          };
        });
      },

      /**
       * Query events by date range (uses index)
       * @param {Date} startDate
       * @param {Date} endDate
       * @param {Object} filters - { impacts, currencies, impacts }
       * @returns {Array} Event IDs matching query
       */
      queryByDateRange: (startDate, endDate, filters = {}) => {
        const state = get();

        // Build query key for caching
        const queryKey = JSON.stringify({
          type: 'dateRange',
          startDate: startDate?.getTime(),
          endDate: endDate?.getTime(),
          ...filters,
        });

        // Check cache first
        const cached = state.queryCache.get(queryKey);
        if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
          return cached.ids;
        }

        // Execute query against indexes
        const results = new Set();
        const startMs = startDate?.getTime() || 0;
        const endMs = endDate?.getTime() || Infinity;

        // Iterate date index and collect matching events
        Object.entries(state.dateIndex).forEach(([dateKey, eventIds]) => {
          const date = new Date(dateKey).getTime();
          if (date >= startMs && date <= endMs) {
            eventIds.forEach((eventId) => results.add(eventId));
          }
        });

        // Apply impact filters
        if (filters.impacts?.length > 0) {
          const impactSet = new Set();
          filters.impacts.forEach((impact) => {
            state.impactIndex[impact]?.forEach((eventId) => {
              impactSet.add(eventId);
            });
          });
          // Intersection: only keep events that match both date AND impact
          const filtered = new Set([...results].filter((id) => impactSet.has(id)));
          results.clear();
          filtered.forEach((id) => results.add(id));
        }

        // Apply currency filters
        if (filters.currencies?.length > 0) {
          const currencySet = new Set();
          filters.currencies.forEach((currency) => {
            state.currencyIndex[currency]?.forEach((eventId) => {
              currencySet.add(eventId);
            });
          });
          // Intersection: only keep events that match both date AND currency
          const filtered = new Set([...results].filter((id) => currencySet.has(id)));
          results.clear();
          filtered.forEach((id) => results.add(id));
        }

        const ids = Array.from(results);

        // Cache result
        state.queryCache.set(queryKey, {
          ids,
          timestamp: Date.now(),
          params: { startDate, endDate, filters },
        });

        return ids;
      },

      /**
       * Get event data by ID
       * @param {string} eventId
       * @returns {Object|null} Event data
       */
      getEventById: (eventId) => {
        return get().eventsById[eventId] || null;
      },

      /**
       * Get multiple events by IDs
       * @param {Array<string>} eventIds
       * @returns {Array} Events
       */
      getEventsByIds: (eventIds) => {
        const state = get();
        return eventIds
          .map((id) => state.eventsById[id])
          .filter(Boolean);
      },

      /**
       * Get all currencies in store
       * @returns {Array<string>}
       */
      getCurrencies: () => {
        return Object.keys(get().currencyIndex).sort();
      },

      /**
       * Get all impacts in store
       * @returns {Array<string>}
       */
      getImpacts: () => {
        return Object.keys(get().impactIndex).sort();
      },

      /**
       * Invalidate query cache (when data updates)
       * @param {string|null} pattern - If null, clears all cache; if string, clears matching patterns
       */
      invalidateQueryCache: (pattern = null) => {
        set((state) => {
          if (!pattern) {
            return { queryCache: new Map() };
          }

          // Clear queries matching pattern
          const nextCache = new Map(state.queryCache);
          Array.from(nextCache.keys()).forEach((key) => {
            if (key.includes(pattern)) {
              nextCache.delete(key);
            }
          });

          return { queryCache: nextCache };
        });
      },

      /**
       * Handle timezone change - invalidates query cache since "today" shifts
       * Call this when user changes timezone to ensure fresh data for the new "today"
       * @param {string} newTimezone - New timezone identifier
       */
      onTimezoneChange: (newTimezone) => {
        const state = get();
        if (state.lastTimezone === newTimezone) return;
        
        // Invalidate all query cache - "today" means different dates in different timezones
        set({
          queryCache: new Map(),
          lastTimezone: newTimezone,
        });
      },

      /**
       * Handle day rollover - invalidates cache when midnight passes in user's timezone
       * Call this when dayKey changes to refresh "today" queries
       */
      onDayRollover: () => {
        // Clear all query cache on day change
        set({
          queryCache: new Map(),
        });
      },

      /**
       * Clear all data
       */
      clear: () => {
        set({
          eventsById: {},
          eventIds: [],
          dateIndex: {},
          currencyIndex: {},
          impactIndex: {},
          totalCount: 0,
          lastNormalizedAt: null,
          queryCache: new Map(),
          lastTimezone: null,
          sources: new Set(),
          lastSyncAt: {},
        });
      },

      /**
       * Get store stats for debugging
       * @returns {Object} Store metrics
       */
      getStats: () => {
        const state = get();
        return {
          totalEvents: state.totalCount,
          cachedQueries: state.queryCache.size,
          sources: Array.from(state.sources),
          lastNormalizedAt: state.lastNormalizedAt,
          lastSyncAt: state.lastSyncAt,
          memoryEstimate: JSON.stringify(state.eventsById).length,
        };
      },
    })),
    {
      name: 'eventsStore',
      enabled: import.meta.env.DEV, // Only enable devtools in development
    }
  )
);

export default useEventsStore;
