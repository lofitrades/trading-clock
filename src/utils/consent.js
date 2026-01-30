/**
 * src/utils/consent.js
 * 
 * Purpose: Centralize privacy/consent storage for advertising and analytics.
 * Provides helpers to read/write consent state with Firestore sync for authenticated users
 * and localStorage fallback for guests. Notifies listeners when users update their choices.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-30 - BEP FIRESTORE SYNC: Added async Firestore persistence for authenticated users.
 *                       New functions: saveConsentToFirestore(), readConsentFromFirestore().
 *                       Consent now syncs to users/{uid}/settings/consent for cross-device persistence.
 *                       localStorage remains primary for immediate UI updates and guest fallback.
 *                       Maintains backward compatibility with existing localStorage flow.
 * v1.0.0 - 2026-01-07 - Initial consent utilities for cookie/ad storage.
 */

import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

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

/**
 * Save consent to Firestore for authenticated users
 * BEP: Runs async, doesn't block UI. Errors are logged but don't break functionality.
 * @param {string} uid - Firebase user UID
 * @param {string} value - CONSENT_ACCEPTED or CONSENT_ESSENTIAL
 * @returns {Promise<void>}
 */
const saveConsentToFirestore = async (uid, value) => {
    if (!uid || !db) return;
    try {
        const userRef = doc(db, 'users', uid);
        // First try to update existing document
        await updateDoc(userRef, {
            'settings.consent': value,
            'settings.consentUpdatedAt': new Date(),
        });
    } catch (error) {
        // If document doesn't exist, create it with the consent field
        if (error.code === 'not-found') {
            try {
                const userRef = doc(db, 'users', uid);
                await setDoc(userRef, {
                    settings: {
                        consent: value,
                        consentUpdatedAt: new Date(),
                    },
                }, { merge: true });
            } catch (createError) {
                console.error('Failed to create user consent in Firestore:', createError);
            }
        } else {
            console.error('Failed to save consent to Firestore:', error);
        }
    }
};

/**
 * Read consent from Firestore for authenticated users
 * BEP: Reads cross-device persistent consent. Falls back to localStorage if unavailable.
 * @param {string} uid - Firebase user UID
 * @returns {Promise<string|null>} - Returns consent value or null if not found
 */
const readConsentFromFirestore = async (uid) => {
    if (!uid || !db) return null;
    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const consent = userDoc.data()?.settings?.consent;
            if (consent === CONSENT_ACCEPTED || consent === CONSENT_ESSENTIAL) {
                return consent;
            }
        }
    } catch (error) {
        console.error('Failed to read consent from Firestore:', error);
    }
    return null;
};

export { CONSENT_KEY, CONSENT_ACCEPTED, CONSENT_ESSENTIAL, CONSENT_UNKNOWN, readConsentStatus, setConsentStatus, hasAdConsent, subscribeConsent, saveConsentToFirestore, readConsentFromFirestore };
