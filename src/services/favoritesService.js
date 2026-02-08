/**
 * src/services/favoritesService.js
 *
 * Purpose: Centralized helpers for user event favorites with unified same-event matching.
 * Provides Firestore persistence, name/alias normalization, and helper utilities
 * to keep favorites consistent across sources and aliases.
 * 
 * BEP: Unified Same-Event Matching Engine (name + currency + time)
 * ========================================================================
 * buildEventIdentity() now uses composite matching: name + currency + time
 * This matches the pattern used by reminders engine to ensure consistency:
 * 
 * 1. Check eventId (exact document ID if available)
 * 2. Build fallback composite key: name-currency-time
 *    - Prevents NFP USD from matching NFP EUR
 *    - Prevents same-time duplicates from merging
 *    - Matches buildSeriesKey() logic from remindersRegistry.js
 * 
 * Returns: { eventId, nameKeys, primaryNameKey, currencyKey, dateKey }
 * 
 * isEventFavorite() checks by composite key first, then falls back to name aliases.
 * toggleFavoriteEvent() stores currency and time components for future lookups.
 * 
 * All three services now use identical matching:
 * ✅ Reminders: buildEventKey + buildSeriesKey
 * ✅ Favorites: buildEventIdentity (composite key)
 * ✅ Notes: buildEventIdentity (composite key)
 *
 * Changelog:
 * v1.2.8 - 2026-02-06 - BEP CRITICAL FIX: Rescheduled events now preserve favorites/notes/reminders. When an event is rescheduled, datetimeUtc changes but composite key now uses originalDatetimeUtc (immutable original time) to ensure key stability. Favorites/notes/reminders stay attached across reschedules with activity audit trails.
 * v1.2.7 - 2026-02-03 - BEP FIX: Prioritize raw event ID (id/eventId) over composite key for custom events. 
 *                       Prevents duplicate reminder documents when custom events are saved with/without date fields.
 *                       Custom events (isCustom=true) and events with explicit IDs (seriesId, docId) now consistently
 *                       use the raw ID instead of name-currency-time composite.
 * v1.2.6 - 2026-01-23 - Fix: Encode eventId when looking up in favoritesMap for proper matching.
 * v1.2.5 - 2026-01-23 - Fix: Encode eventKeys with slashes for safe Firestore document IDs.
 * v1.2.4 - 2026-01-23 - BEP FIX: Strict composite matching in isEventFavorite and toggleFavoriteEvent - all three components (name+currency+time) must match. Prevents NFP USD from matching NFP GBP.
 * v1.2.3 - 2026-01-23 - BEP FIX: Fixed missing currencyKey/dateKey destructuring in toggleFavoriteEvent
 * v1.2.2 - 2026-01-23 - BEP: Prefer composite key when available; add gated debug logs.
 * v1.2.1 - 2026-01-23 - BEP: Expand eventId and date field normalization for stable favorite keys.
 * v1.2.0 - 2026-01-23 - BEP: Implement unified same-event matching (name+currency+time)
 * v1.1.0 - 2025-12-15 - Fixed favorite removal to properly find Firestore document ID via favoritesMap lookup.
 * v1.0.0 - 2025-12-12 - Initial implementation with Firestore subcollection support and alias-aware matching.
 */
import { collection, deleteDoc, doc, onSnapshot, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Encode eventKey to make it safe for use as a Firestore document ID.
 * Firestore document IDs cannot contain forward slashes.
 * Uses base64url encoding (RFC 4648 §5) for safe, reversible encoding.
 * Handles Unicode characters properly using TextEncoder.
 */
const encodeFirestoreDocId = (id) => {
	if (!id) return id;
	try {
		// Convert string to UTF-8 bytes, then to base64
		const bytes = new TextEncoder().encode(String(id));
		const binaryString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
		// Use base64url encoding: replace / with _ and + with -
		return btoa(binaryString)
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, ''); // Remove padding
	} catch (error) {
		console.error('[favorites] Failed to encode Firestore doc ID:', error);
		// Fallback: use URL-safe encoding
		return encodeURIComponent(String(id)).replace(/[.]/g, '%2E');
	}
};

/**
 * Decode Firestore document ID back to original eventKey.
 */
// eslint-disable-next-line no-unused-vars
const decodeFirestoreDocId = (encodedId) => {
	if (!encodedId) return encodedId;
	try {
		// Restore base64 format
		let base64 = String(encodedId)
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		// Add padding if needed
		while (base64.length % 4) {
			base64 += '=';
		}
		// Decode base64 to binary string, then to UTF-8
		const binaryString = atob(base64);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return new TextDecoder().decode(bytes);
	} catch (error) {
		console.error('[favorites] Failed to decode Firestore doc ID:', error);
		// Fallback: try URL decoding
		try {
			return decodeURIComponent(encodedId);
		} catch {
			// If all fails, return original
			return encodedId;
		}
	}
};

const normalizeKey = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim().toLowerCase();
  return trimmed.length ? trimmed : null;
};

const dedupeKeys = (keys = []) => {
  const unique = new Set();
  keys.forEach((key) => {
    const normalized = normalizeKey(key);
    if (normalized) {
      unique.add(normalized);
    }
  });
  return Array.from(unique);
};

const extractNameKeys = (event = {}) => {
  const candidates = [
    event.name,
    event.Name,
    event.title,
    event.Title,
    event.eventName,
    event.eventTitle,
    event.headline,
    event.displayName,
    event.canonicalName,
  ];

  if (Array.isArray(event.aliases)) candidates.push(...event.aliases);
  if (Array.isArray(event.alias)) candidates.push(...event.alias);
  if (Array.isArray(event.alternativeNames)) candidates.push(...event.alternativeNames);

  return dedupeKeys(candidates);
};

const shouldDebugFavorites = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage?.getItem('t2t_debug_favorites') === '1';
};

const logFavoriteDebug = (...args) => {
  if (!shouldDebugFavorites()) return;
  console.info('[favorites]', ...args);
};

export const buildEventIdentity = (event = {}) => {
  const idCandidates = [
    event.id,
    event.eventId,
    event.event_id,
    event.eventID,
    event.EventID,
    event.EventId,
    event.Event_ID,
    event.uid,
    event.uuid,
    event._id,
    event.docId,
  ];

  const rawEventId = idCandidates.find(Boolean) || null;
  const nameKeys = extractNameKeys(event);
  const primaryNameKey = nameKeys.length ? nameKeys[0] : null;

  // BEP: Use unified matching key with name + currency + time (matching reminders engine)
  // This ensures same-event detection across reminders, favorites, and notes
  const currencyKey = normalizeKey(event.currency || event.Currency);
  
  // BEP v1.2.8 CRITICAL FIX: For rescheduled events, use originalDatetimeUtc to preserve composite key
  // When an event is rescheduled, datetimeUtc changes but favorites/notes/reminders should stay attached.
  // Use originalDatetimeUtc (the time when event was first created) to ensure composite key remains stable.
  const dateForKey = event.originalDatetimeUtc || event.time || event.date || event.Date || event.dateTime || event.datetime || event.date_time;
  const parsedDate = dateForKey ? new Date(dateForKey) : null;
  const dateKey = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.getTime() : null;
  
  // BEP FIX: For custom events (isCustom=true) or events with explicit IDs (seriesId, docId),
  // always prefer the raw ID to ensure consistent reminder/notification key generation.
  // This prevents duplicate documents when the same custom event is saved with/without date fields.
  const isCustomEvent = Boolean(event.isCustom);
  const hasExplicitId = Boolean(event.seriesId || event.docId || event._id);
  
  // Build composite key: name-currency-time (for economic events without explicit IDs)
  let compositeKey = null;
  if (!isCustomEvent && !hasExplicitId) {
    if (primaryNameKey && currencyKey && dateKey) {
      // Explicit composite key: name-currency-time (type-safe)
      compositeKey = `${primaryNameKey}-${currencyKey}-${dateKey}`;
    } else if (primaryNameKey && currencyKey) {
      // Fallback: name-currency (if time is missing)
      compositeKey = `${primaryNameKey}-${currencyKey}`;
    }
  }
  
  // BEP: Prefer raw ID for custom events, composite key for economic events
  const resolvedEventId = rawEventId 
    ? String(rawEventId) 
    : compositeKey 
      ? String(compositeKey) 
      : primaryNameKey 
        ? String(primaryNameKey) 
        : null;

  if (shouldDebugFavorites()) {
    logFavoriteDebug('identity', {
      rawEventId: rawEventId ? String(rawEventId) : null,
      resolvedEventId,
      primaryNameKey,
      currencyKey,
      dateKey,
      isCustomEvent,
    });
  }

  return {
    eventId: resolvedEventId,
    nameKeys,
    primaryNameKey,
    currencyKey,
    dateKey,
  };
};

const toTimestamp = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Timestamp.fromDate(parsed);
};

export const subscribeToFavorites = (userId, onChange, onError) => {
  if (!userId) return () => {};
  const favoritesRef = collection(db, 'users', userId, 'favorites');

  return onSnapshot(
    favoritesRef,
    (snapshot) => {
      const favoritesMap = new Map();
      const nameKeySet = new Set();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() || {};
        favoritesMap.set(docSnap.id, data);

        if (data.nameKey) nameKeySet.add(normalizeKey(data.nameKey));
        if (Array.isArray(data.aliasKeys)) {
          data.aliasKeys.forEach((alias) => {
            const key = normalizeKey(alias);
            if (key) nameKeySet.add(key);
          });
        }
      });

      logFavoriteDebug('subscribe', { count: favoritesMap.size });
      onChange({ favoritesMap, nameKeySet });
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

export const toggleFavoriteEvent = async (userId, event, currentlyFavorite, favoritesMap = new Map()) => {
  if (!userId) throw new Error('User must be authenticated to manage favorites.');

  // BEP FIX: Destructure ALL identity fields including currencyKey and dateKey
  const { eventId, nameKeys, primaryNameKey, currencyKey, dateKey } = buildEventIdentity(event);
  const docId = eventId || primaryNameKey;
  if (!docId) throw new Error('Unable to determine a stable identifier for this event.');

  // When removing a favorite, find the actual Firestore document ID
  // The favoritesMap keys are the actual encoded document IDs from Firestore
  let actualDocId = String(docId);
  if (currentlyFavorite && favoritesMap) {
    // BEP: Check by encoded composite key first (name + currency + time)
    const encodedEventId = encodeFirestoreDocId(String(eventId));
    if (favoritesMap.has(encodedEventId)) {
      actualDocId = encodedEventId;
    } else {
      // BEP: Search through all favorite docs to find a match by ALL THREE components
      // This prevents cross-currency deletion (NFP USD should not delete NFP GBP)
      for (const [firestoreDocId, favoriteData] of favoritesMap.entries()) {
        const storedCurrency = normalizeKey(favoriteData?.currencyKey || favoriteData?.currency);
        const storedDateKey = favoriteData?.dateKey;
        const storedNameKey = favoriteData?.nameKey;
        
        // All three must match: name + currency + time
        if (
          storedNameKey === primaryNameKey &&
          storedCurrency === currencyKey &&
          storedDateKey === dateKey
        ) {
          actualDocId = firestoreDocId;
          break;
        }
      }
    }
  }

  logFavoriteDebug('toggle:resolvedDoc', { eventId, primaryNameKey, actualDocId, currencyKey, dateKey, currentlyFavorite });
  
  // For removal, actualDocId is already encoded from favoritesMap lookup
  // For addition, we need to encode the docId
  const encodedDocId = currentlyFavorite ? actualDocId : encodeFirestoreDocId(actualDocId);
  const favoriteRef = doc(db, 'users', userId, 'favorites', encodedDocId);

  if (currentlyFavorite) {
    logFavoriteDebug('toggle:delete', { actualDocId });
    await deleteDoc(favoriteRef);
    return { favorited: false, docId: actualDocId };
  }

  const aliasKeys = nameKeys.filter((key) => key && key !== primaryNameKey);
  const dateSource = event.time || event.date;

  const docData = {
    eventId: eventId || null,
    name: event.name || event.Name || null,
    nameKey: primaryNameKey || null,
    aliasKeys,
    currency: event.currency || event.Currency || null,
    currencyKey: currencyKey || null,
    dateKey: dateKey || null,
    source: event.source || event.Source || null,
    date: toTimestamp(dateSource),
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  logFavoriteDebug('toggle:save', { actualDocId, docData });
  await setDoc(favoriteRef, docData, { merge: true });
  logFavoriteDebug('toggle:saved', { actualDocId });
  return { favorited: true, docId: String(docId) };
};

export const isEventFavorite = (event, favoritesMap = new Map()) => {
  const { eventId, primaryNameKey, currencyKey, dateKey } = buildEventIdentity(event);
  
  // BEP: Check by encoded composite key (name + currency + time) - STRICT MATCHING
  // This is the primary check - ensures NFP USD !== NFP GBP
  // FavoritesMap keys are encoded, so we need to encode eventId for comparison
  if (eventId) {
    const encodedEventId = encodeFirestoreDocId(String(eventId));
    if (favoritesMap.has(encodedEventId)) return true;
  }
  
  // BEP: Secondary check - iterate through favorites and match by all three components
  // This handles cases where the stored doc ID format differs but content matches
  for (const [, favoriteData] of favoritesMap.entries()) {
    const storedCurrency = favoriteData?.currencyKey || favoriteData?.currency?.toLowerCase();
    const storedDateKey = favoriteData?.dateKey;
    const storedNameKey = favoriteData?.nameKey;
    
    // All three must match: name + currency + time
    if (
      storedNameKey === primaryNameKey &&
      storedCurrency === currencyKey &&
      storedDateKey === dateKey
    ) {
      return true;
    }
  }
  
  // BEP: NO NAME-ONLY FALLBACK - removed to prevent cross-currency matching
  // Old name-only favorites will need to be re-added with the new composite key format
  
  return false;
};

export const buildPendingKey = (event) => {
  // BEP: Use composite key (name + currency + time) for all operations
  // Ensures favorites, notes, and reminders all use same matching engine
  const { eventId, primaryNameKey, currencyKey, dateKey } = buildEventIdentity(event);
  
  // Return composite key if all parts available, fallback to eventId, then primaryNameKey
  if (eventId && currencyKey && dateKey) {
    return String(eventId); // Already composite in buildEventIdentity
  }
  if (eventId) return String(eventId);
  return primaryNameKey || null;
};
