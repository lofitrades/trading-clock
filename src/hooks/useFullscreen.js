/**
 * src/hooks/useFullscreen.js
 * 
 * Purpose: Hook to manage Fullscreen API state and toggling for the app.
 * Handles cross-browser support and tracks fullscreen changes.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-09 - Initial implementation for app-level fullscreen toggle
 */

import { useCallback, useEffect, useState } from 'react';

const getFullscreenElement = () =>
  document.fullscreenElement ||
  document.webkitFullscreenElement ||
  document.msFullscreenElement;

const isFullscreenEnabled = () =>
  document.fullscreenEnabled ||
  document.webkitFullscreenEnabled ||
  document.msFullscreenEnabled;

export default function useFullscreen(targetRef) {
  const [isFullscreen, setIsFullscreen] = useState(Boolean(getFullscreenElement()));
  const [canFullscreen, setCanFullscreen] = useState(isFullscreenEnabled());

  useEffect(() => {
    const handleChange = () => setIsFullscreen(Boolean(getFullscreenElement()));
    const handleError = () => setCanFullscreen(isFullscreenEnabled());

    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    document.addEventListener('msfullscreenchange', handleChange);
    document.addEventListener('fullscreenerror', handleError);
    document.addEventListener('webkitfullscreenerror', handleError);
    document.addEventListener('msfullscreenerror', handleError);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
      document.removeEventListener('msfullscreenchange', handleChange);
      document.removeEventListener('fullscreenerror', handleError);
      document.removeEventListener('webkitfullscreenerror', handleError);
      document.removeEventListener('msfullscreenerror', handleError);
    };
  }, []);

  const requestFullscreen = useCallback(async () => {
    try {
      const element = (targetRef && targetRef.current) || document.documentElement;
      if (!element) return false;

      if (getFullscreenElement()) return true;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
        return true;
      }
      if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
        return true;
      }
      if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
        return true;
      }
      setCanFullscreen(false);
      return false;
    } catch (error) {
      setCanFullscreen(false);
      return false;
    }
  }, [targetRef]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (!getFullscreenElement()) return true;
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return true;
      }
      if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
        return true;
      }
      if (document.msExitFullscreen) {
        await document.msExitFullscreen();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (getFullscreenElement()) {
      return exitFullscreen();
    }
    return requestFullscreen();
  }, [exitFullscreen, requestFullscreen]);

  return {
    isFullscreen,
    canFullscreen,
    requestFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
