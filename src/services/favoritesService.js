/**
 * src/services/favoritesService.js
 *
 * Purpose: Centralized helpers for user event favorites.
 * Provides Firestore persistence, name/alias normalization, and helper utilities
 * to keep favorites consistent across sources and aliases.
 *
 * Changelog:
 * v1.1.0 - 2025-12-15 - Fixed favorite removal to properly find Firestore document ID via favoritesMap lookup.
 * v1.0.0 - 2025-12-12 - Initial implementation with Firestore subcollection support and alias-aware matching.
 */
import { collection, deleteDoc, doc, onSnapshot, setDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

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

export const buildEventIdentity = (event = {}) => {
  const idCandidates = [
    event.id,
    event.eventId,
    event.event_id,
    event.eventID,
    event.uid,
    event.uuid,
    event._id,
    event.docId,
  ];

  const eventId = idCandidates.find(Boolean) || null;
  const nameKeys = extractNameKeys(event);
  const primaryNameKey = nameKeys.length ? nameKeys[0] : null;

  if (eventId) {
    return { eventId: String(eventId), nameKeys, primaryNameKey };
  }

  const currencyKey = normalizeKey(event.currency || event.Currency);
  const dateSource = event.time || event.date;
  const parsedDate = dateSource ? new Date(dateSource) : null;
  const dateKey = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.getTime() : null;
  const fallbackId = dedupeKeys([primaryNameKey, currencyKey, dateKey]).join('-') || null;

  return {
    eventId: fallbackId,
    nameKeys,
    primaryNameKey,
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

      onChange({ favoritesMap, nameKeySet });
    },
    (error) => {
      if (onError) onError(error);
    }
  );
};

export const toggleFavoriteEvent = async (userId, event, currentlyFavorite, favoritesMap = new Map()) => {
  if (!userId) throw new Error('User must be authenticated to manage favorites.');

  const { eventId, nameKeys, primaryNameKey } = buildEventIdentity(event);
  const docId = eventId || primaryNameKey;
  if (!docId) throw new Error('Unable to determine a stable identifier for this event.');

  // When removing a favorite, find the actual Firestore document ID
  // The favoritesMap keys are the actual document IDs from Firestore
  let actualDocId = String(docId);
  if (currentlyFavorite && favoritesMap) {
    // Check if the calculated docId exists
    if (favoritesMap.has(String(eventId))) {
      actualDocId = String(eventId);
    } else if (favoritesMap.has(primaryNameKey)) {
      actualDocId = primaryNameKey;
    } else {
      // Search through all favorite docs to find a match by nameKeys
      for (const [firestoreDocId, favoriteData] of favoritesMap.entries()) {
        const storedNameKey = favoriteData?.nameKey;
        const storedAliasKeys = favoriteData?.aliasKeys || [];
        const storedKeys = [storedNameKey, ...storedAliasKeys].filter(Boolean);
        
        // Check if any of the current event's nameKeys match the stored keys
        const hasMatch = nameKeys.some(key => storedKeys.some(storedKey => 
          normalizeKey(key) === normalizeKey(storedKey)
        ));
        
        if (hasMatch) {
          actualDocId = firestoreDocId;
          break;
        }
      }
    }
  }

  const favoriteRef = doc(db, 'users', userId, 'favorites', actualDocId);

  if (currentlyFavorite) {
    await deleteDoc(favoriteRef);
    return { favorited: false, docId: actualDocId };
  }

  const aliasKeys = nameKeys.filter((key) => key && key !== primaryNameKey);
  const dateSource = event.time || event.date;

  await setDoc(
    favoriteRef,
    {
      eventId: eventId || null,
      name: event.name || event.Name || null,
      nameKey: primaryNameKey || null,
      aliasKeys,
      currency: event.currency || event.Currency || null,
      source: event.source || event.Source || null,
      date: toTimestamp(dateSource),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { favorited: true, docId: String(docId) };
};

export const isEventFavorite = (event, favoritesMap = new Map(), nameKeySet = new Set()) => {
  const { eventId, nameKeys, primaryNameKey } = buildEventIdentity(event);
  if (eventId && favoritesMap.has(String(eventId))) return true;
  if (primaryNameKey && favoritesMap.has(primaryNameKey)) return true;
  return (nameKeys || []).some((key) => key && nameKeySet.has(key));
};

export const buildPendingKey = (event) => {
  const { eventId, primaryNameKey } = buildEventIdentity(event);
  return eventId || primaryNameKey || null;
};
