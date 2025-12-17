/**
 * src/services/canonicalEconomicEventsService.js
 *
 * Purpose: Client-side helpers for fetching canonical economic events from the
 * unified collection (/economicEvents/events) and selecting provider-specific
 * values based on user preference.
 *
 * Changelog:
 * v1.1.0 - 2025-12-16 - Filter to NFS-backed events only; preserve enrichment while blocking JBlanked-only documents.
 * v1.0.0 - 2025-12-11 - Initial canonical fetcher with user-preferred source handling.
 */

import { collection, doc, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * User-preferred source selection
 * @typedef {'auto' | 'jblanked-ff' | 'jblanked-mt' | 'jblanked-fxstreet'} UserPreferredSource
 */

/**
 * Canonical event DTO for the frontend
 * @typedef {Object} CanonicalEconomicEventDTO
 * @property {string} id
 * @property {string} name
 * @property {string|null} currency
 * @property {string|null} impact
 * @property {Date|null} datetimeUtc
 * @property {'scheduled' | 'released' | 'revised' | 'cancelled'} status
 * @property {string|null} actual
 * @property {string|null} forecast
 * @property {string|null} previous
 * @property {string|null} sourceKey
 */

const CANONICAL_EVENTS_ROOT = 'economicEvents';
const CANONICAL_EVENTS_CONTAINER = 'events';

function getCanonicalEventsCollectionRef() {
  const rootDoc = doc(collection(db, CANONICAL_EVENTS_ROOT), CANONICAL_EVENTS_CONTAINER);
  return collection(rootDoc, CANONICAL_EVENTS_CONTAINER);
}

function pickValuesForUser(event, preferred = 'auto') {
  const order = preferred === 'auto'
    ? ['jblanked-ff', 'jblanked-mt', 'jblanked-fxstreet', 'nfs']
    : [preferred, 'jblanked-ff', 'jblanked-mt', 'jblanked-fxstreet', 'nfs'];

  if (!event?.sources) {
    return {
      sourceKey: event?.winnerSource || null,
      actual: event?.actual ?? null,
      forecast: event?.forecast ?? null,
      previous: event?.previous ?? null,
    };
  }

  for (const key of order) {
    const src = event.sources[key];
    const parsed = src?.parsed;
    if (parsed && (parsed.actual != null || parsed.forecast != null || parsed.previous != null)) {
      return {
        sourceKey: key,
        actual: parsed.actual ?? null,
        forecast: parsed.forecast ?? null,
        previous: parsed.previous ?? null,
      };
    }
  }

  return {
    sourceKey: event?.winnerSource || null,
    actual: event?.actual ?? null,
    forecast: event?.forecast ?? null,
    previous: event?.previous ?? null,
  };
}

export async function fetchCanonicalEconomicEvents({ from, to, currencies = [], preferredSource = 'auto' }) {
  try {
    const eventsRef = getCanonicalEventsCollectionRef();
    const whereClauses = [
      where('datetimeUtc', '>=', Timestamp.fromDate(from)),
      where('datetimeUtc', '<=', Timestamp.fromDate(to)),
    ];

    // Firestore supports 'in' with max 10 entries; otherwise filter client-side
    const useInClause = Array.isArray(currencies) && currencies.length > 0 && currencies.length <= 10;
    if (useInClause) {
      whereClauses.push(where('currency', 'in', currencies.map((c) => c.toUpperCase())));
    }

    const q = query(eventsRef, ...whereClauses, orderBy('datetimeUtc', 'asc'));
    const snapshot = await getDocs(q);

    const docs = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        const hasNfsSource = Boolean(data?.sources?.nfs);
        if (!hasNfsSource) return null;

        const dt = data.datetimeUtc?.toDate ? data.datetimeUtc.toDate() : null;
        const picked = pickValuesForUser(data, preferredSource);
        return {
          id: docSnap.id,
          name: data.name,
          currency: data.currency ?? null,
          impact: data.impact ?? null,
          datetimeUtc: dt,
          status: data.status || 'scheduled',
          actual: picked.actual,
          forecast: picked.forecast,
          previous: picked.previous,
          sourceKey: picked.sourceKey,
        };
      })
      .filter(Boolean);

    // If we could not use an "in" filter, filter currencies client-side
    const filteredDocs = !useInClause && currencies?.length > 0
      ? docs.filter((d) => d.currency && currencies.includes(d.currency))
      : docs;

    return { success: true, data: filteredDocs };
  } catch (error) {
    console.error('❌ Failed to fetch canonical economic events', error);
    return { success: false, error: error.message || 'Unknown error', data: [] };
  }
}

export { pickValuesForUser };
