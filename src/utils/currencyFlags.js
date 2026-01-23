/**
 * src/utils/currencyFlags.js
 * 
 * Purpose: Shared currency-to-country flag helpers for economic events UI components.
 * Provides a single source for currency flag lookups used by filters, overlays, and tables.
 * Also provides special currency type constants and detection helpers for ALL, N/A, and CUS currencies.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-22 - BEP: Add special currency constants (ALL, N/A, CUS) and detection/normalization helpers for dynamic currency filtering.
 * v1.0.0 - 2026-01-06 - Extracted currency flag mapping from timeline component for shared, timeline-free reuse.
 */

// ============================================================================
// SPECIAL CURRENCY CONSTANTS
// ============================================================================

/**
 * ALL - Global/worldwide events that apply to all currencies
 * Displayed with PublicIcon (world globe)
 */
export const CURRENCY_ALL = 'ALL';

/**
 * N/A - Unknown currency (null, undefined, empty, or unrecognized)
 * Displayed with CancelRoundedIcon
 */
export const CURRENCY_UNK = 'N/A';

/**
 * CUS - Custom user-created reminder events
 * Displayed with user-selected custom icon
 */
export const CURRENCY_CUS = 'CUS';

/**
 * Array of special currencies that are not standard ISO currency codes
 * These are dynamically added to filter options based on event availability
 */
export const SPECIAL_CURRENCIES = [CURRENCY_ALL, CURRENCY_UNK, CURRENCY_CUS];

// ============================================================================
// CURRENCY TO COUNTRY FLAG MAPPING
// ============================================================================

export const CURRENCY_TO_COUNTRY = {
  USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', CHF: 'ch',
  AUD: 'au', CAD: 'ca', NZD: 'nz', CNY: 'cn', HKD: 'hk',
  SGD: 'sg', SEK: 'se', NOK: 'no', DKK: 'dk', PLN: 'pl',
  CZK: 'cz', HUF: 'hu', RON: 'ro', TRY: 'tr', ZAR: 'za',
  BRL: 'br', MXN: 'mx', INR: 'in', KRW: 'kr', RUB: 'ru',
  THB: 'th', IDR: 'id', MYR: 'my', PHP: 'ph', ILS: 'il',
  CLP: 'cl', ARS: 'ar', COP: 'co', PEN: 'pe', VND: 'vn',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the country flag code for a currency
 * @param {string} currency - Currency code
 * @returns {string|null} Two-letter country code for flag-icons or null
 */
export const getCurrencyFlag = (currency) => {
  if (!currency) return null;
  return CURRENCY_TO_COUNTRY[String(currency).toUpperCase()] || null;
};

/**
 * Check if a currency is the ALL (global) type
 * @param {string} currency - Currency code
 * @returns {boolean}
 */
export const isGlobalCurrency = (currency) => {
  if (!currency) return false;
  const upper = String(currency).toUpperCase().trim();
  return upper === CURRENCY_ALL || upper === 'GLOBAL';
};

/**
 * Check if a currency represents unknown/missing currency
 * @param {string|null|undefined} currency - Currency code
 * @returns {boolean}
 */
export const isUnknownCurrency = (currency) => {
  if (currency === null || currency === undefined) return true;
  const upper = String(currency).toUpperCase().trim();
  return upper === CURRENCY_UNK || upper === '' || upper === '—' || upper === '-';
};

/**
 * Check if a currency represents a custom event
 * @param {string} currency - Currency code
 * @returns {boolean}
 */
export const isCustomCurrency = (currency) => {
  if (!currency) return false;
  return String(currency).toUpperCase().trim() === CURRENCY_CUS;
};

/**
 * Check if a currency is a special (non-standard) currency type
 * @param {string} currency - Currency code
 * @returns {boolean}
 */
export const isSpecialCurrency = (currency) => {
  if (!currency) return true; // null/undefined treated as N/A (special)
  const upper = String(currency).toUpperCase().trim();
  return SPECIAL_CURRENCIES.includes(upper) || upper === '' || upper === '—' || upper === '-';
};

/**
 * Normalize currency value to standard format
 * - null/undefined/empty → 'N/A'
 * - 'All' → 'ALL'
 * - Custom events → 'CUS' (caller must pass isCustom flag)
 * - Standard currencies → uppercase trimmed
 * 
 * @param {string|null|undefined} currency - Raw currency value
 * @param {boolean} isCustomEvent - Whether this is a custom user event
 * @returns {string} Normalized currency code
 */
export const normalizeCurrency = (currency, isCustomEvent = false) => {
  if (isCustomEvent) return CURRENCY_CUS;
  if (currency === null || currency === undefined) return CURRENCY_UNK;
  
  const upper = String(currency).toUpperCase().trim();
  
  if (upper === '' || upper === '—' || upper === '-') return CURRENCY_UNK;
  if (upper === 'ALL' || upper === 'GLOBAL') return CURRENCY_ALL;
  
  return upper;
};

/**
 * Check if an event matches a currency filter
 * Handles special currencies: ALL matches everything, N/A matches null/empty, CUS matches custom events
 * 
 * @param {Object} event - Event object with currency property
 * @param {string[]} selectedCurrencies - Array of selected currency filters
 * @returns {boolean} Whether event matches any selected currency
 */
export const eventMatchesCurrencyFilter = (event, selectedCurrencies) => {
  if (!selectedCurrencies || selectedCurrencies.length === 0) return true;
  
  const eventCurrency = event.currency || event.Currency;
  const isCustom = Boolean(event.isCustom);
  const normalizedEventCurrency = normalizeCurrency(eventCurrency, isCustom);
  
  // Check each selected currency filter
  return selectedCurrencies.some((filterCurrency) => {
    const normalizedFilter = String(filterCurrency).toUpperCase().trim();
    
    // ALL filter: always include global events (ALL currency)
    if (normalizedFilter === CURRENCY_ALL) {
      return normalizedEventCurrency === CURRENCY_ALL;
    }
    
    // N/A filter: match unknown/null/empty currencies (but not custom)
    if (normalizedFilter === CURRENCY_UNK) {
      return normalizedEventCurrency === CURRENCY_UNK;
    }
    
    // CUS filter: match custom user events
    if (normalizedFilter === CURRENCY_CUS) {
      return isCustom || normalizedEventCurrency === CURRENCY_CUS;
    }
    
    // Standard currency: exact match
    return normalizedEventCurrency === normalizedFilter;
  });
};
