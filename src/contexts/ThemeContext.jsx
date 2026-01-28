/**
 * src/contexts/ThemeContext.jsx
 *
 * Purpose: ThemeContextProvider component for global theme state management.
 * Detects system preference, persists to localStorage, and provides dynamic theme mode control.
 * Integrates with MUI ThemeProvider for dynamic theme switching.
 *
 * Note: Context and hook are exported from themeContextUtils.js to avoid React Fast Refresh issues.
 *
 * Changelog:
 * v1.0.1 - 2026-01-28 - Refactored to separate provider from context/hook for React Fast Refresh compatibility
 * v1.0.0 - 2026-01-28 - Initial implementation with three-way toggle (light/dark/system), 
 *                       system preference detection, localStorage persistence, and useThemeMode hook.
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ThemeContext } from './themeContextUtils';

/**
 * Provider component for theme management.
 * Wraps the app to provide theme state and system preference detection.
 */
export function ThemeContextProvider({ children }) {
    // Theme mode: 'light' | 'dark' | 'system'
    const [themeMode, setThemeModeState] = useState('system');

    // Resolved theme: 'light' | 'dark' (computed from mode + system pref)
    const [resolvedTheme, setResolvedTheme] = useState('light');

    // System preference: 'light' | 'dark'
    const [systemPreference, setSystemPreference] = useState(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
            setSystemPreference(e.matches ? 'dark' : 'light');
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }

        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
    }, []);

    // Compute resolved theme when mode or system preference changes
    useEffect(() => {
        const computed = themeMode === 'system' ? systemPreference : themeMode;
        setResolvedTheme(computed);

        // Update DOM for CSS variables and attribute selectors
        document.documentElement.setAttribute('data-theme', computed);
        document.documentElement.style.colorScheme = computed;
    }, [themeMode, systemPreference]);

    // Set theme mode and persist to localStorage
    const setThemeMode = useCallback((mode) => {
        if (!['light', 'dark', 'system'].includes(mode)) {
            console.warn(`Invalid theme mode: ${mode}. Using 'system' instead.`);
            return;
        }
        setThemeModeState(mode);
        localStorage.setItem('t2t-theme-mode', mode);
    }, []);

    // Toggle theme mode: light → dark → system → light
    const toggleTheme = useCallback(() => {
        setThemeMode((prev) => {
            const modes = ['light', 'dark', 'system'];
            const nextIndex = (modes.indexOf(prev) + 1) % modes.length;
            return modes[nextIndex];
        });
    }, [setThemeMode]);

    // Load theme mode from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('t2t-theme-mode');
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            setThemeModeState(stored);
        }
    }, []);

    const value = {
        themeMode,
        resolvedTheme,
        setThemeMode,
        toggleTheme,
        isDarkMode: resolvedTheme === 'dark',
        systemPreference,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

ThemeContextProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
