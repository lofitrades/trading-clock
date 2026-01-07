/**
 * src/utils/consent.js
 * 
 * Purpose: Centralize privacy/consent storage for advertising and analytics.
 * Provides helpers to read/write consent state and notify listeners when users
 * update their choices (e.g., AdSense opt-in).
 * 
 * Changelog:
 * v1.0.0 - 2026-01-07 - Initial consent utilities for cookie/ad storage.
 */

const CONSENT_KEY = 't2t-cookie-consent';
const CONSENT_ACCEPTED = 'accepted';
const CONSENT_ESSENTIAL = 'essential';
const CONSENT_UNKNOWN = 'unknown';

const readConsentStatus = () => {
    if (typeof window === 'undefined' || !window.localStorage) return CONSENT_UNKNOWN;
    const value = window.localStorage.getItem(CONSENT_KEY);
    if (value === CONSENT_ACCEPTED || value === CONSENT_ESSENTIAL) return value;
    return CONSENT_UNKNOWN;
};

const setConsentStatus = (value) => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new CustomEvent('t2t-consent-update', { detail: value }));
};

const hasAdConsent = () => readConsentStatus() === CONSENT_ACCEPTED;

const subscribeConsent = (handler) => {
    if (typeof window === 'undefined') return () => {};
    const listener = (event) => handler(event.detail);
    window.addEventListener('t2t-consent-update', listener);
    return () => window.removeEventListener('t2t-consent-update', listener);
};

export { CONSENT_KEY, CONSENT_ACCEPTED, CONSENT_ESSENTIAL, CONSENT_UNKNOWN, readConsentStatus, setConsentStatus, hasAdConsent, subscribeConsent };
