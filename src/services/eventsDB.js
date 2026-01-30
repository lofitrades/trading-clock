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
   * Ensure database is initialized
   * @returns {Promise<IDBPDatabase>}
   */
  async ensureDB() {
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
   * @param {Array<Object>} events - Array of events
   * @returns {Promise<void>}
   */
  async addEvents(events) {
    const db = await this.ensureDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');

    await Promise.all(
      events.map((event) => {
        // Use put (upsert) instead of add to update existing events
        return tx.store.put(event);
      })
    );

    await tx.done;
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
   * @param {Date|number} startDate - Milliseconds or Date object
   * @param {Date|number} endDate
   * @returns {Promise<Array>} Events matching date range
   */
  async getEventsByDateRange(startDate, endDate) {
    const db = await this.ensureDB();
    const startMs = startDate instanceof Date ? startDate.getTime() : startDate;
    const endMs = endDate instanceof Date ? endDate.getTime() : endDate;

    // Use index for O(log N) range query instead of O(N) scan
    const index = db.transaction(STORE_NAME, 'readonly').store.index('date');
    return index.getAll(IDBKeyRange.bound(startMs, endMs));
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
