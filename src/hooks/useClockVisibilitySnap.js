/**
 * src/hooks/useClockVisibilitySnap.js
 * 
 * Purpose: Snap shared clock hand angles when returning from background to avoid long catch-up animations.
 * Key responsibility and main functionality: Listen for visibility changes or resume tokens and immediately set hand angles to the latest time.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-07 - Initial implementation for visibility-aware snapping of clock hand angles.
 */

import { useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';

const normalizeAngle = (deg) => {
  const normalized = deg % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

export const useClockVisibilitySnap = ({ handAnglesRef, currentTime, resumeToken = 0 }) => {
  const latestTimeRef = useRef(currentTime);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    latestTimeRef.current = currentTime;
  }, [currentTime]);

  const snapHands = useCallback(() => {
    const targetRef = handAnglesRef?.current;
    const time = latestTimeRef.current;
    if (!targetRef || !time) return;

    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();

    const hourAngle = normalizeAngle(((hours % 12) + minutes / 60) * 30);
    const minuteAngle = normalizeAngle((minutes + seconds / 60) * 6);
    const secondAngle = normalizeAngle(seconds * 6);

    gsap.killTweensOf(targetRef);
    gsap.set(targetRef, {
      hour: hourAngle,
      minute: minuteAngle,
      second: secondAngle,
    });
  }, [handAnglesRef]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    snapHands();
  }, [resumeToken, snapHands]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        snapHands();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [snapHands]);
};
