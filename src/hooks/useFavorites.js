/**
 * src/hooks/useFavorites.js
 *
 * Purpose: React hook for managing favorite economic events with Firestore persistence.
 * Provides alias-aware checks, optimistic toggles, and pending state for UI controls.
 *
 * Changelog:
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
      await toggleFavoriteEvent(user.uid, event, currentlyFavorite);
      return { success: true, requiresAuth: false };
    } catch (error) {
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
