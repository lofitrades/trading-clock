/**
 * src/contexts/themeContextUtils.js
 *
 * Purpose: Shared utilities for theme context - export context and hook separately to avoid Fast Refresh issues.
 * This file exports only context and hook, no components.
 *
 * Changelog:
 * v1.0.0 - 2026-01-28 - Initial implementation separating context/hook from provider for React Fast Refresh compatibility.
 */

import { createContext, useContext } from 'react';

export const ThemeContext = createContext();

/**
 * Hook to access theme mode state and controls.
 * @returns {Object} { themeMode, resolvedTheme, setThemeMode, toggleTheme, isDarkMode }
 */
export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeContextProvider');
  }
  return context;
}
