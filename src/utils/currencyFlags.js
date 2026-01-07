/**
 * src/utils/currencyFlags.js
 * 
 * Purpose: Shared currency-to-country flag helpers for economic events UI components.
 * Provides a single source for currency flag lookups used by filters, overlays, and tables.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-06 - Extracted currency flag mapping from timeline component for shared, timeline-free reuse.
 */

export const CURRENCY_TO_COUNTRY = {
  USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', CHF: 'ch',
  AUD: 'au', CAD: 'ca', NZD: 'nz', CNY: 'cn', HKD: 'hk',
  SGD: 'sg', SEK: 'se', NOK: 'no', DKK: 'dk', PLN: 'pl',
  CZK: 'cz', HUF: 'hu', RON: 'ro', TRY: 'tr', ZAR: 'za',
  BRL: 'br', MXN: 'mx', INR: 'in', KRW: 'kr', RUB: 'ru',
  THB: 'th', IDR: 'id', MYR: 'my', PHP: 'ph', ILS: 'il',
  CLP: 'cl', ARS: 'ar', COP: 'co', PEN: 'pe', VND: 'vn',
};

export const getCurrencyFlag = (currency) => {
  if (!currency) return null;
  return CURRENCY_TO_COUNTRY[String(currency).toUpperCase()] || null;
};
