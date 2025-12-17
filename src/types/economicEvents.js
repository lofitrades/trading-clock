/**
 * src/types/economicEvents.js
 * 
 * Purpose: Type definitions and constants for economic events calendar
 * Client-side types matching backend functions/src/types/economicEvents.ts
 * 
 * Changelog:
 * v1.1.1 - 2025-12-17 - Set Forex Factory as default news source for new users.
 * v1.1.0 - 2025-12-11 - Added user-preferred source options for canonical events.
 * v1.0.0 - 2025-11-30 - Initial implementation with multi-source support
 */

/**
 * Supported news source providers
 * Each source corresponds to a JBlanked API endpoint and Firestore subcollection
 * 
 * Firestore structure: /economicEvents/{source}/events/{eventDocId}
 * 
 * @typedef {'mql5' | 'forex-factory' | 'fxstreet'} NewsSource
 */

/**
 * Default news source for new users
 * @type {NewsSource}
 */
export const DEFAULT_NEWS_SOURCE = 'forex-factory';

/**
 * News source options with user-friendly labels and descriptions
 * Used in Settings modal and Sync modal
 */
export const NEWS_SOURCE_OPTIONS = [
  {
    value: 'mql5',
    label: 'MetaQuotes (MQL5)',
    description: 'Official MetaTrader / MQL5 economic calendar data. Most comprehensive source with 12,000+ events.'
  },
  {
    value: 'forex-factory',
    label: 'Forex Factory',
    description: 'Popular forex calendar matching Forex Factory as closely as possible. Good historical coverage.'
  },
  {
    value: 'fxstreet',
    label: 'FXStreet',
    description: '⚠️ Limited data - Only 10-20 future events available. Not recommended for primary use.'
  },
];

export const USER_PREFERRED_SOURCE_OPTIONS = [
  {
    value: 'auto',
    label: 'Auto (best available)',
    description: 'Prioritize JBlanked actuals, fall back to NFS forecasts.'
  },
  {
    value: 'jblanked-ff',
    label: 'Forex Factory (JBlanked)',
    description: 'Use JBlanked Forex Factory actuals when available.'
  },
  {
    value: 'jblanked-mt',
    label: 'MT / MQL5 (JBlanked)',
    description: 'Prefer MetaTrader/MQL5 actuals from JBlanked.'
  },
  {
    value: 'jblanked-fxstreet',
    label: 'FXStreet (JBlanked)',
    description: 'Prefer FXStreet actuals from JBlanked when enabled.'
  },
];

/**
 * Economic event interface (client-side)
 * Matches Firestore EconomicEventDocument structure
 * 
 * @typedef {Object} EconomicEvent
 * @property {string} id - Document ID
 * @property {string} name - Event name
 * @property {string} currency - Currency code (e.g., 'USD', 'EUR')
 * @property {string} category - Event category
 * @property {Date|import('firebase/firestore').Timestamp} date - Event date/time
 * @property {number|string|null} actual - Actual value
 * @property {number|string|null} forecast - Forecast value
 * @property {number|string|null} previous - Previous value
 * @property {string|null} outcome - Outcome indicator
 * @property {number|string|null} projection - Projection value
 * @property {string|null} strength - Impact level (low, medium, high)
 * @property {string|null} quality - Quality indicator
 * @property {NewsSource} source - Origin source
 * @property {import('firebase/firestore').Timestamp} [createdAt] - Creation timestamp
 * @property {import('firebase/firestore').Timestamp} [updatedAt] - Update timestamp
 */
