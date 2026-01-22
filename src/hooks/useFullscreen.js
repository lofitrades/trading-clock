/**
 * src/hooks/useFullscreen.js
 * 
 * Purpose: Deprecated no-op hook after fullscreen toggle removal.
 * 
 * Changelog:
 * v2.0.0 - 2026-01-21 - Deprecated hook; returns inert handlers.
 */

export default function useFullscreen() {
  return {
    isFullscreen: false,
    canFullscreen: false,
    requestFullscreen: async () => false,
    exitFullscreen: async () => false,
    toggleFullscreen: async () => false,
  };
}
