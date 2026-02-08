/**
 * src/services/eventNotesService.js
 * 
 * Purpose: Firestore helpers for per-user economic event notes with unified same-event matching.
 * Provides summary subscriptions, per-event note listeners, and transactional add/remove operations.
 * 
 * BEP: Unified Same-Event Matching Engine (name + currency + time)
 * ========================================================================
 * resolveEventDoc() now uses composite matching via buildEventIdentity():
 * name + currency + time (matching reminders and favorites engines)
 * 
 * This ensures notes added to "NFP USD" don't appear on "NFP EUR"
 * and same-time duplicate events are treated as distinct.
 * 
 * buildEventNoteKey() uses buildPendingKey() which leverages the composite key logic.
 * 
 * All three services now use identical matching:
 * ✅ Reminders: buildEventKey + buildSeriesKey
 * ✅ Favorites: buildEventIdentity (composite key)
 * ✅ Notes: buildEventIdentity (composite key)
 * 
 * Changelog:
 * v1.1.4 - 2026-02-06 - BEP CRITICAL FIX: Rescheduled events now preserve user notes. Uses updated buildEventIdentity() from favoritesService which uses originalDatetimeUtc for stable composite keys. Notes stay attached to events after reschedules with full audit trail.
 * v1.1.3 - 2026-01-23 - Fix: Encode eventId when looking up in noteSummaries for proper matching.
 * v1.1.2 - 2026-01-23 - Fix: Encode eventKeys with slashes for safe Firestore document IDs.
 * v1.1.1 - 2026-01-23 - BEP FIX: Added isEventHasNotes with strict composite matching (name+currency+time). Prevents NFP USD notes from showing on NFP GBP.
 * v1.1.0 - 2026-01-23 - BEP: Implement unified same-event matching (name+currency+time)
 * v1.0.0 - 2025-12-12 - Initial implementation with event-level summaries, note subcollection streaming, and transactional add/remove support.
 */
import {
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	runTransaction,
	serverTimestamp,
	setDoc,
	Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { buildEventIdentity, buildPendingKey } from './favoritesService';

/**
 * Encode eventKey to make it safe for use as a Firestore document ID.
 * Firestore document IDs cannot contain forward slashes.
 * Uses base64url encoding (RFC 4648 §5) for safe, reversible encoding.
 */
const encodeFirestoreDocId = (id) => {
	if (!id) return id;
	try {
		// Base64url encoding with Unicode support (RFC 4648 §5)
		const bytes = new TextEncoder().encode(String(id));
		const binaryString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
		return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	} catch (error) {
		console.error('Error encoding doc ID:', error);
		// Fallback to URL encoding if btoa fails
		return encodeURIComponent(String(id));
	}
};

/**
 * Decode Firestore document ID back to original eventKey.
 */
// eslint-disable-next-line no-unused-vars
const decodeFirestoreDocId = (encodedId) => {
	if (!encodedId) return encodedId;
	try {
		// Reverse base64url encoding with Unicode support
		let base64 = String(encodedId)
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		// Add padding if needed
		while (base64.length % 4) {
			base64 += '=';
		}
		const binaryString = atob(base64);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return new TextDecoder().decode(bytes);
	} catch (error) {
		// Fallback 1: Try URL decode
		try {
			return decodeURIComponent(encodedId);
		} catch {
			// Fallback 2: Return original (might be an old unencoded ID)
			return encodedId;
		}
	}
};

const toTimestamp = (value) => {
	if (!value) return null;
	const parsed = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;
	return Timestamp.fromDate(parsed);
};

const resolveEventDoc = (userId, event = {}) => {
	if (!userId) throw new Error('User must be authenticated to manage event notes.');
	const { eventId, primaryNameKey, nameKeys, currencyKey, dateKey } = buildEventIdentity(event);
	const docId = buildPendingKey(event);
	if (!docId) throw new Error('Unable to determine a stable identifier for this event.');

	const encodedDocId = encodeFirestoreDocId(docId);
	const eventRef = doc(db, 'users', userId, 'eventNotes', String(encodedDocId));

	return {
		eventRef,
		docId: String(docId),
		identity: { 
			eventId: eventId || null, 
			primaryNameKey: primaryNameKey || null, 
			nameKeys: nameKeys || [],
			currencyKey: currencyKey || null,
			dateKey: dateKey || null,
		},
		eventMeta: {
			name: event.name || event.Name || null,
			currency: event.currency || event.Currency || null,
			source: event.source || event.Source || null,
			date: toTimestamp(event.time || event.date),
		},
	};
};

export const buildEventNoteKey = (event) => buildPendingKey(event);

const normalizeKey = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim().toLowerCase();
  return trimmed.length ? trimmed : null;
};

/**
 * BEP: Strict composite matching for event notes (name + currency + time)
 * Ensures NFP USD notes don't appear on NFP GBP
 * @param {Object} event - Event to check
 * @param {Map} noteSummaries - Map of note summaries from Firestore
 * @returns {boolean} - True if event has notes
 */
export const isEventHasNotes = (event, noteSummaries = new Map()) => {
  const { eventId, primaryNameKey, currencyKey, dateKey } = buildEventIdentity(event);
  
  // BEP: Check by encoded composite key (name + currency + time) - STRICT MATCHING
  // NoteSummaries map keys are encoded, so we need to encode eventId for comparison
  if (eventId) {
    const encodedEventId = encodeFirestoreDocId(String(eventId));
    if (noteSummaries.has(encodedEventId)) {
      const summary = noteSummaries.get(encodedEventId);
      return Boolean(summary && summary.noteCount > 0);
    }
  }
  
  // BEP: Secondary check - iterate through summaries and match by all three components
  for (const [docId, summary] of noteSummaries.entries()) {
    const storedCurrency = normalizeKey(summary?.currencyKey || summary?.currency);
    const storedDateKey = summary?.dateKey;
    const storedNameKey = summary?.nameKey;
    
    // All three must match: name + currency + time
    if (
      storedNameKey === primaryNameKey &&
      storedCurrency === currencyKey &&
      storedDateKey === dateKey
    ) {
      return Boolean(summary && summary.noteCount > 0);
    }
  }
  
  // BEP: NO NAME-ONLY FALLBACK - prevents cross-currency matching
  return false;
};

export const subscribeToEventNoteSummaries = (userId, onChange, onError) => {
	if (!userId) return () => {};
	const notesRef = collection(db, 'users', userId, 'eventNotes');
	const notesQuery = query(notesRef, orderBy('updatedAt', 'desc'));

	return onSnapshot(
		notesQuery,
		(snapshot) => {
			const summaries = new Map();
			snapshot.forEach((docSnap) => {
				const data = docSnap.data() || {};
				summaries.set(docSnap.id, {
					id: docSnap.id,
					noteCount: data.noteCount || 0,
					name: data.name || null,
					currency: data.currency || null,
					source: data.source || null,
					date: data.date || null,
					updatedAt: data.updatedAt || null,
					createdAt: data.createdAt || null,
				});
			});
			onChange(summaries);
		},
		(error) => {
			if (onError) onError(error);
		}
	);
};

export const subscribeToEventNotes = (userId, eventKey, onChange, onError) => {
	if (!userId || !eventKey) return () => {};
	const encodedEventKey = encodeFirestoreDocId(eventKey);
	const notesRef = collection(db, 'users', userId, 'eventNotes', String(encodedEventKey), 'notes');
	const notesQuery = query(notesRef, orderBy('createdAt', 'desc'));

	return onSnapshot(
		notesQuery,
		(snapshot) => {
			const notes = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }));
			onChange(notes);
		},
		(error) => {
			if (onError) onError(error);
		}
	);
};

export const addEventNote = async (userId, event, content) => {
	const trimmed = (content || '').trim();
	if (!trimmed) throw new Error('Note cannot be empty.');
	const { eventRef, docId, identity, eventMeta } = resolveEventDoc(userId, event);
	const notesRef = collection(eventRef, 'notes');
	const newNoteRef = doc(notesRef);

	await runTransaction(db, async (transaction) => {
		const metaSnap = await transaction.get(eventRef);
		const meta = metaSnap.exists() ? metaSnap.data() : {};
		const nextCount = (meta.noteCount || 0) + 1;

		transaction.set(
			eventRef,
			{
				eventId: identity.eventId || null,
				name: eventMeta.name,
				nameKey: identity.primaryNameKey || null,
				aliasKeys: identity.nameKeys || [],
				currencyKey: identity.currencyKey || null,
				dateKey: identity.dateKey || null,
				currency: eventMeta.currency,
				source: eventMeta.source,
				date: eventMeta.date,
				noteCount: nextCount,
				updatedAt: serverTimestamp(),
				createdAt: meta.createdAt || serverTimestamp(),
			},
			{ merge: true }
		);

		transaction.set(newNoteRef, {
			content: trimmed,
			createdAt: serverTimestamp(),
			eventDate: eventMeta.date,
			source: eventMeta.source,
			currency: eventMeta.currency,
		});
	});

	return { noteId: newNoteRef.id, eventKey: docId };
};

export const removeEventNote = async (userId, event, noteId) => {
	if (!noteId) throw new Error('Note id is required.');
	const { eventRef } = resolveEventDoc(userId, event);
	const noteRef = doc(eventRef, 'notes', String(noteId));

	await runTransaction(db, async (transaction) => {
		const metaSnap = await transaction.get(eventRef);
		const meta = metaSnap.exists() ? metaSnap.data() : {};
		const nextCount = Math.max(0, (meta.noteCount || 0) - 1);

		transaction.delete(noteRef);

		if (nextCount === 0) {
			transaction.delete(eventRef);
			return;
		}

		transaction.set(
			eventRef,
			{
				noteCount: nextCount,
				updatedAt: serverTimestamp(),
			},
			{ merge: true }
		);
	});

	return { noteId };
};
