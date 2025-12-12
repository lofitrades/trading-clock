/**
 * src/hooks/useEventNotes.js
 * 
 * Purpose: React hook for real-time economic event notes with Firestore sync, per-event streaming, and auth-aware actions.
 * Exposes helpers to check note presence, subscribe to specific events, and add/remove notes with pending/loading state.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-12 - Initial implementation with summary + per-event listeners, auth-aware add/remove, and loading guards.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
	addEventNote,
	buildEventNoteKey,
	removeEventNote,
	subscribeToEventNoteSummaries,
	subscribeToEventNotes,
} from '../services/eventNotesService';
import { buildPendingKey } from '../services/favoritesService';

export const useEventNotes = () => {
	const { user } = useAuth();
	const [noteSummaries, setNoteSummaries] = useState(new Map());
	const [notesByEvent, setNotesByEvent] = useState(new Map());
	const [notesLoadingMap, setNotesLoadingMap] = useState(new Map());
	const [notesError, setNotesError] = useState(null);
	const summaryUnsubscribeRef = useRef(null);
	const eventUnsubscribesRef = useRef(new Map());

	const clearEventSubscriptions = useCallback(() => {
		eventUnsubscribesRef.current.forEach((unsub) => unsub && unsub());
		eventUnsubscribesRef.current = new Map();
	}, []);

	useEffect(() => {
		clearEventSubscriptions();
		if (summaryUnsubscribeRef.current) {
			summaryUnsubscribeRef.current();
			summaryUnsubscribeRef.current = null;
		}

		if (!user) {
			setNoteSummaries(new Map());
			setNotesByEvent(new Map());
			setNotesLoadingMap(new Map());
			setNotesError(null);
			return undefined;
		}

		summaryUnsubscribeRef.current = subscribeToEventNoteSummaries(
			user.uid,
			(nextSummaries) => {
				setNoteSummaries(nextSummaries);
			},
			(error) => {
				setNotesError(error?.message || 'Failed to load notes');
			}
		);

		return () => {
			clearEventSubscriptions();
			if (summaryUnsubscribeRef.current) {
				summaryUnsubscribeRef.current();
				summaryUnsubscribeRef.current = null;
			}
		};
	}, [user, clearEventSubscriptions]);

	const hasNotes = useCallback(
		(event) => {
			const key = buildEventNoteKey(event);
			if (!key) return false;
			const summary = noteSummaries.get(String(key));
			return Boolean(summary && summary.noteCount > 0);
		},
		[noteSummaries]
	);

	const getNotesForEvent = useCallback(
		(event) => {
			const key = buildPendingKey(event);
			if (!key) return [];
			return notesByEvent.get(String(key)) || [];
		},
		[notesByEvent]
	);

	const isEventNotesLoading = useCallback(
		(event) => {
			const key = buildPendingKey(event);
			if (!key) return false;
			return Boolean(notesLoadingMap.get(String(key)));
		},
		[notesLoadingMap]
	);

	const stopNotesStream = useCallback((event) => {
		const key = buildPendingKey(event);
		if (!key) return;
		const unsubscribe = eventUnsubscribesRef.current.get(String(key));
		if (unsubscribe) unsubscribe();
		eventUnsubscribesRef.current.delete(String(key));
		setNotesByEvent((prev) => {
			const next = new Map(prev);
			next.delete(String(key));
			return next;
		});
		setNotesLoadingMap((prev) => {
			const next = new Map(prev);
			next.delete(String(key));
			return next;
		});
	}, []);

	const ensureNotesStream = useCallback(
		(event) => {
			if (!user) {
				setNotesError('Sign in to add notes.');
				return { key: null, requiresAuth: true };
			}

			const key = buildPendingKey(event);
			if (!key) {
				setNotesError('Unable to identify this event for notes.');
				return { key: null, requiresAuth: false };
			}

			if (eventUnsubscribesRef.current.has(String(key))) {
				return { key: String(key), requiresAuth: false };
			}

			setNotesLoadingMap((prev) => {
				const next = new Map(prev);
				next.set(String(key), true);
				return next;
			});

			const unsubscribe = subscribeToEventNotes(
				user.uid,
				String(key),
				(notes) => {
					setNotesByEvent((prev) => {
						const next = new Map(prev);
						next.set(String(key), notes);
						return next;
					});
					setNotesLoadingMap((prev) => {
						const next = new Map(prev);
						next.set(String(key), false);
						return next;
					});
				},
				(error) => {
					setNotesError(error?.message || 'Failed to load notes');
					setNotesLoadingMap((prev) => {
						const next = new Map(prev);
						next.set(String(key), false);
						return next;
					});
				}
			);

			eventUnsubscribesRef.current.set(String(key), unsubscribe);
			return { key: String(key), requiresAuth: false };
		},
		[user]
	);

	const addNote = useCallback(
		async (event, content) => {
			if (!user) {
				setNotesError('Sign in to add notes.');
				return { success: false, requiresAuth: true };
			}

			try {
				const result = await addEventNote(user.uid, event, content);
				// Ensure listener is active so UI updates in real time
				ensureNotesStream(event);
				return { success: true, requiresAuth: false, result };
			} catch (error) {
				setNotesError(error?.message || 'Failed to add note');
				return { success: false, requiresAuth: false };
			}
		},
		[user, ensureNotesStream]
	);

	const removeNote = useCallback(
		async (event, noteId) => {
			if (!user) {
				setNotesError('Sign in to remove notes.');
				return { success: false, requiresAuth: true };
			}
			try {
				await removeEventNote(user.uid, event, noteId);
				return { success: true, requiresAuth: false };
			} catch (error) {
				setNotesError(error?.message || 'Failed to remove note');
				return { success: false, requiresAuth: false };
			}
		},
		[user]
	);

	return {
		notesError,
		hasNotes,
		getNotesForEvent,
		isEventNotesLoading,
		ensureNotesStream,
		stopNotesStream,
		addNote,
		removeNote,
	};
};
