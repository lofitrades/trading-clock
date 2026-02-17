/**
 * src/services/eventsDB.js
 *
 * Purpose: IndexedDB service for economic events storage
 * Provides fast indexed queries (O(log N)) instead of full scans
 * Supports 50+ MB of structured data with no serialization cost
 *
 * Schema:
 * - ObjectStore: 'events' with keyPath 'id'
 *   - Index 'date' → Fast date range queries
 *   - Index 'currency' → Fast currency lookups
 *   - Index 'impact' → Fast impact lookups
 *   - Index 'source' → Track which source each event came from
 *
 * Changelog:
 * v1.1.0 - 2026-02-12 - BEP STALE CONNECTION FIX: Added retry logic for InvalidStateError when
 *                        the cached IDB connection closes (page nav, browser cleanup). ensureDB()
 *                        now detects stale connections and reopens. addEvents and getEventsByDateRange
 *                        retry once on InvalidStateError before re-throwing. Prevents console errors
 *                        from eventsStorageAdapter falling back to Firestore on stale connections.
 * v1.0.0 - 2026-01-29 - BEP PHASE 2.3: Initial IndexedDB implementation with indexes and batch operations.
 */

import { openDB } from 'idb';

const DB_NAME = 't2t-events-db';
const DB_VERSION = 1;
const STORE_NAME = 'events';

/**
 * Initialize IndexedDB
 * @returns {Promise<IDBPDatabase>} Database instance
 */
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });

        // Create indexes for fast queries
        store.createIndex('date', 'date');
        store.createIndex('currency', 'currency');
        store.createIndex('impact', 'impact');
        store.createIndex('source', 'source');
        store.createIndex('name', 'name');

        // Composite indexes for common query patterns
        store.createIndex('date_currency', ['date', 'currency']);
        store.createIndex('date_impact', ['date', 'impact']);
      }
    },
  });
}

const eventsDB = {
  db: null,

  /**
   * Ensure database is initialized.
   * BEP v1.1.0: Detects stale connections (db closed by browser) and reopens.
   * @param {boolean} forceReopen - Force a fresh connection (retry path)
   * @returns {Promise<IDBPDatabase>}
   */
  async ensureDB(forceReopen = false) {
    if (forceReopen && this.db) {
      try { this.db.close(); } catch { /* already closing */ }
      this.db = null;
    }
    if (!this.db) {
      this.db = await initDB();
    }
    return this.db;
  },

  /**
   * Add or update single event
   * @param {Object} event - Event document
   * @returns {Promise<string>} Event ID
   */
  async addEvent(event) {
    const db = await this.ensureDB();
    return db.add(STORE_NAME, event);
  },

  /**
   * Add or update multiple events (batch)
   * BEP v1.1.0: Retries once on InvalidStateError (stale connection)
   * @param {Array<Object>} events - Array of events
   * @returns {Promise<void>}
   */
  async addEvents(events, _retry = false) {
    try {
      const db = await this.ensureDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');

      await Promise.all(
        events.map((event) => {
          // Use put (upsert) instead of add to update existing events
          return tx.store.put(event);
        })
      );

      await tx.done;
    } catch (error) {
      // BEP v1.1.0: Retry once with fresh connection on InvalidStateError
      if (!_retry && error?.name === 'InvalidStateError') {
        this.db = null;
        return this.addEvents(events, true);
      }
      throw error;
    }
  },

  /**
   * Get event by ID
   * @param {string} eventId
   * @returns {Promise<Object|null>}
   */
  async getEvent(eventId) {
    const db = await this.ensureDB();
    return db.get(STORE_NAME, eventId);
  },

  /**
   * Query events by date range (fast index lookup)
   * BEP v1.1.0: Normalize inputs to Date objects for correct IDB key type matching.
   * IDB stores event.date as Date objects (via structured clone). Date and Number
   * are different IDB key types, so we must query with Date objects, not epoch ms.
   * BEP v1.1.0: Retries once on InvalidStateError (stale connection).
   *
   * @param {Date|number|string} startDate - Date object, epoch ms, or ISO string
   * @param {Date|number|string} endDate
   * @returns {Promise<Array>} Events matching date range
   */
  async getEventsByDateRange(startDate, endDate, _retry = false) {
    try {
      const db = await this.ensureDB();

      // Normalize to Date objects for correct IDB key type matching
      const toDate = (v) => {
        if (v instanceof Date) return v;
        if (typeof v === 'number') return new Date(v);
        return new Date(v);
      };
      const start = toDate(startDate);
      const end = toDate(endDate);

      // Use index for O(log N) range query instead of O(N) scan
      const index = db.transaction(STORE_NAME, 'readonly').store.index('date');
      return await index.getAll(IDBKeyRange.bound(start, end));
    } catch (error) {
      // BEP v1.1.0: Retry once with fresh connection on InvalidStateError
      if (!_retry && error?.name === 'InvalidStateError') {
        this.db = null;
        return this.getEventsByDateRange(startDate, endDate, true);
      }
      throw error;
    }
  },

  /**
   * Query events by currency (fast index lookup)
   * @param {string} currency - Currency code (e.g., 'USD')
   * @returns {Promise<Array>}
   */
  async getEventsByCurrency(currency) {
    const db = await this.ensureDB();
    const index = db.transaction(STORE_NAME, 'readonly').store.index('currency');
    return index.getAll(currency);
  },

  /**
   * Query events by impact level
   * @param {string} impact - Impact level (e.g., 'High', 'Medium', 'Low')
   * @returns {Promise<Array>}
   */
  async getEventsByImpact(impact) {
    const db = await this.ensureDB();
    const index = db.transaction(STORE_NAME, 'readonly').store.index('impact');
    return index.getAll(impact);
  },

  /**
   * Query events by source (data provider)
   * @param {string} source - Source name (e.g., 'forex-factory', 'jblanked-ff')
   * @returns {Promise<Array>}
   */
  async getEventsBySource(source) {
    const db = await this.ensureDB();
    const index = db.transaction(STORE_NAME, 'readonly').store.index('source');
    return index.getAll(source);
  },

  /**
   * Complex query: events by date range AND currency
   * @param {Date} startDate
   * @param {Date} endDate
   * @param {Array<string>} currencies - Currencies to filter by
   * @returns {Promise<Array>}
   */
  async getEventsByDateAndCurrency(startDate, endDate, currencies = []) {
    const startMs = startDate instanceof Date ? startDate.getTime() : startDate;
    const endMs = endDate instanceof Date ? endDate.getTime() : endDate;

    const db = await this.ensureDB();
    const index = db.transaction(STORE_NAME, 'readonly').store.index('date');

    // Get all events in date range, then filter by currency
    const allInRange = await index.getAll(IDBKeyRange.bound(startMs, endMs));

    if (currencies.length === 0) {
      return allInRange;
    }

    const currencySet = new Set(currencies);
    return allInRange.filter((event) =>
      currencySet.has(event.currency || 'N/A')
    );
  },

  /**
   * Count events matching criteria
   * @param {Object} options - { startDate, endDate, currency, impact }
   * @returns {Promise<number>}
   */
  async countEvents(options = {}) {
    const db = await this.ensureDB();
    let events = [];

    if (options.startDate && options.endDate) {
      events = await this.getEventsByDateRange(
        options.startDate,
        options.endDate
      );
    } else {
      const tx = db.transaction(STORE_NAME, 'readonly');
      events = await tx.store.getAll();
    }

    // Filter by currency
    if (options.currency) {
      events = events.filter((e) => e.currency === options.currency);
    }

    // Filter by impact
    if (options.impact) {
      events = events.filter((e) => e.impact === options.impact);
    }

    return events.length;
  },

  /**
   * Get all unique currencies in DB
   * @returns {Promise<Array<string>>}
   */
  async getAllCurrencies() {
    const db = await this.ensureDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const allEvents = await tx.store.getAll();
    const currencies = new Set(allEvents.map((e) => e.currency || 'N/A'));
    return Array.from(currencies).sort();
  },

  /**
   * Get all unique impacts in DB
   * @returns {Promise<Array<string>>}
   */
  async getAllImpacts() {
    const db = await this.ensureDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const allEvents = await tx.store.getAll();
    const impacts = new Set(allEvents.map((e) => e.impact || 'Medium'));
    return Array.from(impacts).sort();
  },

  /**
   * Delete event by ID
   * @param {string} eventId
   * @returns {Promise<void>}
   */
  async deleteEvent(eventId) {
    const db = await this.ensureDB();
    await db.delete(STORE_NAME, eventId);
  },

  /**
   * Clear all events (use with caution)
   * @returns {Promise<void>}
   */
  async clear() {
    const db = await this.ensureDB();
    await db.clear(STORE_NAME);
  },

  /**
   * Get database stats
   * @returns {Promise<Object>} { eventCount, estimatedSize }
   */
  async getStats() {
    const db = await this.ensureDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const allEvents = await tx.store.getAll();

    // Estimate size (rough approximation)
    const estimatedSize = JSON.stringify(allEvents).length;

    return {
      eventCount: allEvents.length,
      estimatedSize,
      estimatedSizeMB: (estimatedSize / 1024 / 1024).toFixed(2),
    };
  },

  /**
   * Backup database to JSON (for export/debugging)
   * @returns {Promise<Array>}
   */
  async backup() {
    const db = await this.ensureDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    return tx.store.getAll();
  },

  /**
   * Restore database from JSON backup
   * @param {Array} backup - Events array
   * @returns {Promise<void>}
   */
  async restore(backup) {
    if (!Array.isArray(backup)) {
      throw new Error('Backup must be an array of events');
    }

    await this.clear();
    await this.addEvents(backup);
  },

  /**
   * Check if IndexedDB is supported and working
   * @returns {Promise<boolean>}
   */
  async isSupported() {
    try {
      const db = await this.ensureDB();
      return db !== null;
    } catch {
      return false;
    }
  },
};

export default eventsDB;
