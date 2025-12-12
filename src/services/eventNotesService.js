/**
 * src/services/eventNotesService.js
 * 
 * Purpose: Firestore helpers for per-user economic event notes with real-time syncing and event-aware metadata.
 * Provides summary subscriptions, per-event note listeners, and transactional add/remove operations.
 * 
 * Changelog:
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

const toTimestamp = (value) => {
	if (!value) return null;
	const parsed = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;
	return Timestamp.fromDate(parsed);
};

const resolveEventDoc = (userId, event = {}) => {
	if (!userId) throw new Error('User must be authenticated to manage event notes.');
	const { eventId, primaryNameKey, nameKeys } = buildEventIdentity(event);
	const docId = buildPendingKey(event);
	if (!docId) throw new Error('Unable to determine a stable identifier for this event.');

	const eventRef = doc(db, 'users', userId, 'eventNotes', String(docId));

	return {
		eventRef,
		docId: String(docId),
		identity: { eventId: eventId || null, primaryNameKey: primaryNameKey || null, nameKeys: nameKeys || [] },
		eventMeta: {
			name: event.name || event.Name || null,
			currency: event.currency || event.Currency || null,
			source: event.source || event.Source || null,
			date: toTimestamp(event.time || event.date),
		},
	};
};

export const buildEventNoteKey = (event) => buildPendingKey(event);

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
	const notesRef = collection(db, 'users', userId, 'eventNotes', String(eventKey), 'notes');
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
