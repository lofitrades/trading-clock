/**
 * src/hooks/useFavorites.js
 *
 * Purpose: React hook for managing favorite economic events with Firestore persistence.
 * Provides alias-aware checks, optimistic toggles, and pending state for UI controls.
 *
 * Changelog:
 * v1.2.2 - 2026-01-23 - BEP: Added comprehensive error logging with stack trace in catch block.
 * v1.2.1 - 2026-01-23 - BEP FIX: Added ungated diagnostic console.log in toggleFavorite to trace call flow when debugging favorites toggle issue.
 * v1.2.0 - 2026-01-23 - BEP: Add gated debug logging for favorites toggle diagnostics.
 * v1.1.0 - 2025-12-15 - Pass favoritesMap to toggleFavoriteEvent for accurate document deletion.
 * v1.0.0 - 2025-12-12 - Initial implementation with Firestore subscription and optimistic toggle support.
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  buildEventIdentity,
  buildPendingKey,
  isEventFavorite,
  subscribeToFavorites,
  toggleFavoriteEvent,
} from '../services/favoritesService';

const shouldDebugFavorites = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage?.getItem('t2t_debug_favorites') === '1';
};

const logFavoriteDebug = (...args) => {
  if (!shouldDebugFavorites()) return;
  console.info('[favorites]', ...args);
};

export const useFavorites = () => {
  const { user } = useAuth();
  const [favoritesMap, setFavoritesMap] = useState(new Map());
  const [nameKeySet, setNameKeySet] = useState(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState(null);
  const [pendingKeys, setPendingKeys] = useState(new Set());

  useEffect(() => {
    if (!user) {
      setFavoritesMap(new Map());
      setNameKeySet(new Set());
      setFavoritesError(null);
      setFavoritesLoading(false);
      return undefined;
    }

    setFavoritesLoading(true);
    const unsubscribe = subscribeToFavorites(
      user.uid,
      ({ favoritesMap: nextMap, nameKeySet: nextNameKeys }) => {
        setFavoritesMap(nextMap);
        setNameKeySet(nextNameKeys);
        setFavoritesLoading(false);
      },
      (error) => {
        setFavoritesError(error?.message || 'Failed to load favorites');
        setFavoritesLoading(false);
      }
    );

    return () => unsubscribe && unsubscribe();
  }, [user]);

  const isFavorite = useCallback((event) => isEventFavorite(event, favoritesMap, nameKeySet), [favoritesMap, nameKeySet]);

  const isFavoritePending = useCallback((event) => {
    const key = buildPendingKey(event);
    if (!key) return false;
    return pendingKeys.has(String(key));
  }, [pendingKeys]);

  const toggleFavorite = useCallback(async (event) => {
    logFavoriteDebug('hook:toggleFavorite', { hasUser: Boolean(user), eventName: event?.name || event?.Name });

    if (!user) {
      setFavoritesError('Sign in to save favorites.');
      return { success: false, requiresAuth: true };
    }

    const key = buildPendingKey(event);
    if (!key) {
      setFavoritesError('Unable to identify this event for favorites.');
      return { success: false, requiresAuth: false };
    }

    const currentlyFavorite = isFavorite(event);
    setPendingKeys((prev) => {
      const next = new Set(prev);
      next.add(String(key));
      return next;
    });

    const previousMap = favoritesMap;
    const previousNameKeys = nameKeySet;
    const identity = buildEventIdentity(event);
    const toggleKeys = identity.nameKeys || [];

    logFavoriteDebug('toggle:start', {
      key: String(key),
      currentlyFavorite,
      identity,
      nameKeys: toggleKeys,
    });

    setFavoritesMap((prev) => {
      const next = new Map(prev);
      if (currentlyFavorite) {
        next.delete(String(key));
      } else {
        next.set(String(key), {
          nameKey: identity.primaryNameKey || null,
          aliasKeys: toggleKeys.filter((alias) => alias && alias !== identity.primaryNameKey),
        });
      }
      return next;
    });

    setNameKeySet((prev) => {
      const next = new Set(prev);
      toggleKeys.forEach((alias) => {
        if (!alias) return;
        if (currentlyFavorite) {
          next.delete(alias);
        } else {
          next.add(alias);
        }
      });
      return next;
    });

    try {
      const result = await toggleFavoriteEvent(user.uid, event, currentlyFavorite, favoritesMap);
      logFavoriteDebug('toggle:success', { key: String(key), result });
      return { success: true, requiresAuth: false };
    } catch (error) {
      logFavoriteDebug('toggle:error', { key: String(key), error: error?.message || error, stack: error?.stack });
      setFavoritesError(error?.message || 'Failed to update favorite');
      setFavoritesMap(previousMap);
      setNameKeySet(previousNameKeys);
      return { success: false, requiresAuth: false };
    } finally {
      setPendingKeys((prev) => {
        const next = new Set(prev);
        next.delete(String(key));
        return next;
      });
    }
  }, [user, isFavorite, favoritesMap, nameKeySet]);

  return {
    favoritesLoading,
    favoritesError,
    isFavorite,
    toggleFavorite,
    isFavoritePending,
  };
};
