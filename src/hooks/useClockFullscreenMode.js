/**
 * src/hooks/useClockFullscreenMode.js
 * 
 * Purpose: Manage fullscreen mode state for the /clock page. 
 * Hides AppBar, EventsFilters3, headings (h1, h2), and timezone button when active.
 * Also triggers browser fullscreen/viewport state matching the API used by useFullscreen.
 * Auto-detects when user exits fullscreen via Escape key, browser X button, mobile back tap, or other native controls.
 * Provides toggle and state management for the immersive clock experience.
 * 
 * Changelog:
 * v1.2.0 - 2026-01-17 - AUTO-DETECT FULLSCREEN EXIT: Added fullscreenchange event listener to auto-detect when user exits fullscreen via Escape key, browser X button, mobile back tap, or other native browser fullscreen controls. When fullscreenchange fires and document.fullscreenElement is null, isFullscreenMode automatically syncs to false. Ensures UI state always matches browser's actual fullscreen state regardless of how the exit was triggered. Enterprise BEP: Proper cleanup, effect dependencies, tested on desktop and mobile.
 * v1.1.0 - 2026-01-17 - Added browser fullscreen API integration. Now entering fullscreen mode also requests browser fullscreen via Fullscreen API. Exiting fullscreen exits both UI state and browser fullscreen.
 * v1.0.0 - 2026-01-17 - Initial implementation with fullscreen mode toggle
 */

import { useState, useCallback, useEffect } from 'react';

export default function useClockFullscreenMode(containerRef) {
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  // Auto-detect when user exits fullscreen via Escape, browser X button, mobile back tap, etc.
  useEffect(() => {
    const handleFullscreenChange = () => {
      // When fullscreenchange fires, check if we've exited fullscreen
      if (!document.fullscreenElement) {
        // User has exited fullscreen (via any method: Escape, X button, back tap, etc.)
        setIsFullscreenMode(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreenMode = useCallback(async () => {
    try {
      if (!isFullscreenMode) {
        // Entering fullscreen mode
        setIsFullscreenMode(true);

        // Request browser fullscreen if API is available and ref is provided
        if (containerRef?.current && document.fullscreenEnabled) {
          try {
            await containerRef.current.requestFullscreen();
          } catch (err) {
            // Fullscreen request failed, but UI state is still toggled
            console.warn('Fullscreen request failed:', err);
          }
        }
      } else {
        // Exiting fullscreen mode
        setIsFullscreenMode(false);

        // Exit browser fullscreen if currently in fullscreen
        if (document.fullscreenElement) {
          try {
            await document.exitFullscreen();
          } catch (err) {
            console.warn('Exit fullscreen failed:', err);
          }
        }
      }
    } catch (error) {
      console.error('Fullscreen toggle error:', error);
    }
  }, [isFullscreenMode, containerRef]);

  const exitFullscreenMode = useCallback(async () => {
    try {
      setIsFullscreenMode(false);

      // Exit browser fullscreen if currently in fullscreen
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (err) {
          console.warn('Exit fullscreen failed:', err);
        }
      }
    } catch (error) {
      console.error('Exit fullscreen error:', error);
    }
  }, []);

  return {
    isFullscreenMode,
    toggleFullscreenMode,
    exitFullscreenMode,
  };
}
