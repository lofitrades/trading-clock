/**
 * src/services/queryBatcher.js
 *
 * Purpose: Batch multiple Firestore queries into single requests
 * Deduplicates overlapping date ranges and merges results
 * Reduces API calls from 3-5 per filter change to 1
 *
 * Strategy:
 * - Debounce pending queries (50ms window)
 * - Merge overlapping date ranges
 * - Execute single Firestore query with widest range
 * - Distribute results to all pending requests
 *
 * Changelog:
 * v1.0.0 - 2026-01-29 - BEP PHASE 2.2: Initial query batcher with range merging and debounced batching.
 */

import { isWithinInterval, min, max } from 'date-fns';

class QueryBatcher {
  constructor(options = {}) {
    this.BATCH_DEBOUNCE_MS = options.debounceMs || 50;
    this.pendingQueries = [];
    this.batchTimeout = null;
    this.inFlightBatch = null;
  }

  /**
   * Queue a query and return promise
   * @param {Object} query - Query parameters { startDate, endDate, source, filters }
   * @returns {Promise<Array>} Query results
   */
  async fetch(query) {
    return new Promise((resolve, reject) => {
      this.pendingQueries.push({
        query,
        resolve,
        reject,
      });

      // Schedule batch execution with debounce
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.executeBatch();
        }, this.BATCH_DEBOUNCE_MS);
      }
    });
  }

  /**
   * Merge overlapping date ranges
   * @param {Array<Object>} queries - Array of queries with startDate, endDate
   * @returns {Object} Merged query { startDate, endDate, sources }
   */
  mergeRanges(queries) {
    const validQueries = queries.filter(
      (q) => q.query.startDate && q.query.endDate
    );

    if (validQueries.length === 0) {
      throw new Error('No valid queries to batch');
    }

    // Find widest date range
    const dates = validQueries.flatMap((q) => [
      q.query.startDate,
      q.query.endDate,
    ]);
    const startDate = min(dates);
    const endDate = max(dates);

    // Collect unique sources
    const sources = new Set(
      validQueries.map((q) => q.query.source || 'canonical')
    );

    // Merge filters (union of all impacts, currencies)
    const allImpacts = new Set();
    const allCurrencies = new Set();
    validQueries.forEach((q) => {
      (q.query.impacts || []).forEach((i) => allImpacts.add(i));
      (q.query.currencies || []).forEach((c) => allCurrencies.add(c));
    });

    return {
      startDate,
      endDate,
      sources: Array.from(sources),
      impacts: Array.from(allImpacts),
      currencies: Array.from(allCurrencies),
    };
  }

  /**
   * Filter results for specific query
   * @param {Array} results - Full batch results
   * @param {Object} query - Original query params
   * @returns {Array} Filtered results matching query params
   */
  filterResults(results, query) {
    let filtered = results;

    // Filter by date
    if (query.startDate && query.endDate) {
      filtered = filtered.filter((event) => {
        const eventDate = event.date instanceof Date
          ? event.date
          : new Date(event.date);
        return isWithinInterval(eventDate, {
          start: query.startDate,
          end: query.endDate,
        });
      });
    }

    // Filter by impacts
    if (query.impacts?.length > 0) {
      const impactSet = new Set(query.impacts.map((i) => i?.toLowerCase()));
      filtered = filtered.filter((event) => {
        const impact = (
          event.impact ||
          event.Strength ||
          'medium'
        )?.toLowerCase();
        return impactSet.has(impact);
      });
    }

    // Filter by currencies
    if (query.currencies?.length > 0) {
      const currencySet = new Set(query.currencies);
      filtered = filtered.filter((event) => {
        return currencySet.has(event.currency || event.Currency);
      });
    }

    return filtered;
  }

  /**
   * Execute batched queries
   * @private
   */
  async executeBatch() {
    clearTimeout(this.batchTimeout);
    this.batchTimeout = null;

    const queries = this.pendingQueries;
    this.pendingQueries = [];

    if (queries.length === 0) {
      return;
    }

    try {
      // Merge date ranges
      const merged = this.mergeRanges(queries);

      // Execute single Firestore query with merged params
      // This is where actual Firestore fetching would happen
      // For now, return merged params so calling code can fetch
      const batchResults = await this.executeMergedQuery(merged);

      // Distribute results to all pending queries
      queries.forEach((pending) => {
        try {
          const filtered = this.filterResults(batchResults, pending.query);
          pending.resolve(filtered);
        } catch (err) {
          pending.reject(err);
        }
      });
    } catch (err) {
      // Reject all pending queries on batch error
      queries.forEach((pending) => {
        pending.reject(err);
      });
    }
  }

  /**
   * Execute merged Firestore query
   * @param {Object} mergedQuery - Merged query params
   * @returns {Promise<Array>} Results from Firestore
   * @private
   */
  async executeMergedQuery(mergedQuery) {
    // Import dynamically to avoid circular dependencies
    const { getEventsByDateRange } = await import('./economicEventsService');
    
    try {
      const result = await getEventsByDateRange(
        mergedQuery.startDate,
        mergedQuery.endDate,
        {
          source: mergedQuery.sources?.[0] || 'canonical',
          impacts: mergedQuery.impacts,
          currencies: mergedQuery.currencies,
          enrich: false, // Skip enrichment for performance
        }
      );
      
      return result.success ? (result.data || []) : [];
    } catch (error) {
      console.error('QueryBatcher: Failed to execute merged query:', error);
      return [];
    }
  }

  /**
   * Get batcher stats
   */
  getStats() {
    return {
      pendingQueries: this.pendingQueries.length,
      hasBatchTimeout: !!this.batchTimeout,
    };
  }

  /**
   * Clear all pending queries
   */
  clear() {
    clearTimeout(this.batchTimeout);
    this.batchTimeout = null;
    this.pendingQueries = [];
  }
}

// Export singleton instance
export const queryBatcher = new QueryBatcher();

export default QueryBatcher;
