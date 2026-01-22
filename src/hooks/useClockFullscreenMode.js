/**
 * src/hooks/useClockFullscreenMode.js
 * 
 * Purpose: Deprecated no-op hook after fullscreen toggle removal.
 * 
 * Changelog:
 * v2.0.0 - 2026-01-21 - Deprecated hook; returns inert handlers.
 */

export default function useClockFullscreenMode() {
  return {
    isFullscreenMode: false,
    toggleFullscreenMode: async () => false,
    exitFullscreenMode: async () => false,
  };
}
