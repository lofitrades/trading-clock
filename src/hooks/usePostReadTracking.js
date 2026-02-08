/**
 * src/hooks/usePostReadTracking.js
 *
 * Purpose: React hook for tracking which blog posts the user has read.
 * Marks the current post as read on mount, provides the set of read IDs
 * for filtering related-post suggestions, and syncs localStorage → Firestore
 * when the user authenticates.
 *
 * Changelog:
 * v1.0.0 - 2026-02-07 - Initial implementation (BEP dynamic related posts)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getReadPostIds,
  markPostRead,
  syncLocalReadsToFirestore,
} from '../services/postReadTrackingService';

/**
 * Hook: usePostReadTracking
 * @param {string|null} postId - Current blog post ID (null while loading)
 * @returns {{ readPostIds: string[], markAsRead: (id: string) => void }}
 */
const usePostReadTracking = (postId) => {
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [readPostIds, setReadPostIds] = useState([]);
  const syncedRef = useRef(false);

  // 1. On mount / auth change, fetch read history
  useEffect(() => {
    let cancelled = false;

    const fetchReads = async () => {
      try {
        const ids = await getReadPostIds(uid);
        if (!cancelled) setReadPostIds(ids);
      } catch {
        // Non-critical — fail silently
      }
    };

    fetchReads();
    return () => { cancelled = true; };
  }, [uid]);

  // 2. Sync localStorage → Firestore on first auth
  useEffect(() => {
    if (!uid || syncedRef.current) return;
    syncedRef.current = true;
    syncLocalReadsToFirestore(uid).then(async () => {
      // Re-fetch merged read history
      try {
        const ids = await getReadPostIds(uid);
        setReadPostIds(ids);
      } catch {
        // ignore
      }
    });
  }, [uid]);

  // 3. Mark current post as read on mount (once per postId)
  useEffect(() => {
    if (!postId) return;

    // Defer so it doesn't block render
    const timer = setTimeout(async () => {
      await markPostRead(uid, postId);
      setReadPostIds((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
    }, 500);

    return () => clearTimeout(timer);
  }, [postId, uid]);

  // 4. Imperative mark-as-read (for programmatic use if needed)
  const markAsRead = useCallback(
    async (id) => {
      await markPostRead(uid, id);
      setReadPostIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    },
    [uid]
  );

  return { readPostIds, markAsRead };
};

export default usePostReadTracking;
