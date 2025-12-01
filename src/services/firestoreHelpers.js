/**
 * src/services/firestoreHelpers.js
 * 
 * Purpose: Helper functions for accessing Firestore collections with proper structure
 * Handles per-source subcollections for economic events
 * 
 * Changelog:
 * v1.0.0 - 2025-11-30 - Initial implementation with multi-source support
 */

import { collection, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Root collection name for economic events
 * Structure: /economicEvents/{source}/events/{eventDocId}
 */
const EVENTS_COLLECTION_ROOT = 'economicEvents';

/**
 * Get Firestore subcollection reference for a specific news source (web SDK)
 * 
 * Firestore structure: /economicEvents/{source}/events/{eventDocId}
 * Where {source} is one of: 'mql5' | 'forex-factory' | 'fxstreet'
 * 
 * @param {import('../types/economicEvents').NewsSource} source - News source identifier
 * @returns {import('firebase/firestore').CollectionReference} Collection reference for the source's events
 * 
 * @example
 * const eventsRef = getEconomicEventsCollectionRef('mql5');
 * const q = query(eventsRef, where('date', '>=', startDate), where('date', '<=', endDate));
 * const snapshot = await getDocs(q);
 */
export function getEconomicEventsCollectionRef(source) {
  // Get the source document reference
  const sourceDocRef = doc(collection(db, EVENTS_COLLECTION_ROOT), source);
  
  // Return the events subcollection
  return collection(sourceDocRef, 'events');
}

/**
 * Get all available sources (for admin/debugging)
 * @returns {Array<{value: string, label: string}>} Available sources
 */
export function getAvailableSources() {
  return [
    { value: 'mql5', label: 'MetaQuotes (MQL5)' },
    { value: 'forex-factory', label: 'Forex Factory' },
    { value: 'fxstreet', label: 'FXStreet' }
  ];
}
