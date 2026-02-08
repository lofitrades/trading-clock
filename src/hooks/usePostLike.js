/**
 * src/hooks/usePostLike.js
 *
 * Purpose: React hook for managing blog post like state.
 * Auth-gated — only authenticated users can like; guests see count but cannot interact.
 * Provides optimistic UI: the heart toggles instantly while Firestore syncs in background.
 *
 * Changelog:
 * v1.0.0 - 2026-02-07 - Initial implementation (BEP engagement system)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  togglePostLike,
  hasUserLikedPost,
  getPostLikeCount,
} from '../services/postEngagementService';

/**
 * Hook: usePostLike
 * @param {string|null} postId - Blog post ID (null while loading)
 * @returns {{ liked: boolean, likeCount: number, toggleLike: () => void, loading: boolean }}
 */
const usePostLike = (postId) => {
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const toggleInFlightRef = useRef(false);

  // Fetch initial like state + count
  useEffect(() => {
    if (!postId) return;
    let cancelled = false;

    const fetchInitial = async () => {
      try {
        const [isLiked, count] = await Promise.all([
          uid ? hasUserLikedPost(uid, postId) : Promise.resolve(false),
          getPostLikeCount(postId),
        ]);
        if (!cancelled) {
          setLiked(isLiked);
          setLikeCount(count);
        }
      } catch {
        // Fail silently — non-critical UI feature
      }
    };

    fetchInitial();
    return () => { cancelled = true; };
  }, [postId, uid]);

  // Toggle like (optimistic)
  const toggleLike = useCallback(async () => {
    if (!uid || !postId || toggleInFlightRef.current) return;

    toggleInFlightRef.current = true;
    setLoading(true);

    // Optimistic update
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const newLikedState = await togglePostLike(uid, postId);
      // Reconcile in case server state differs from optimistic
      setLiked(newLikedState);
    } catch {
      // Rollback on error
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLoading(false);
      toggleInFlightRef.current = false;
    }
  }, [uid, postId, liked, likeCount]);

  return { liked, likeCount, toggleLike, loading, isAuthenticated: !!uid };
};

export default usePostLike;
