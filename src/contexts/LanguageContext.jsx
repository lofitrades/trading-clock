/**
 * src/contexts/LanguageContext.jsx
 * 
 * Purpose: Manages language selection state and persistence with lazy loading
 * Loads language from URL param, localStorage, or Firestore, syncs to Firestore for authenticated users
 * Preloads critical namespaces to prevent translation flicker
 * Provides useLanguage hook for components to access current language preference
 * 
 * Changelog:
 * v1.3.0 - 2026-02-04 - BEP SEO CRITICAL: Migrated from query params (?lang=xx) to subpath URLs (/es/, /fr/) for language detection. Extracts language from pathname instead of search params. Aligns with Firebase hosting rewrites, prerender output, and sitemap structure. Eliminates duplicate URL issues and improves SEO crawlability.
 * v1.2.0 - 2026-01-27 - BEP SEO: Added URL query param (?lang=xx) detection for crawler-friendly language switching. Priority: URL param > localStorage > Firestore > browser. Supports hreflang SEO strategy.
 * v1.1.0 - 2026-01-27 - BEP PERFORMANCE: Updated for lazy-loaded i18n backend. Preload critical namespaces (common, pages) when loading language preference to prevent translation flicker. Ensures smooth UX on initial load.
 * v1.0.1 - 2026-01-27 - BUGFIX: Remove i18n from useEffect dependencies to prevent infinite update loops
 * v1.0.0 - 2026-01-27 - Initial implementation (Phase 4)
 */

import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../utils/seoMeta';

const LanguageContext = createContext();

/**
 * Get language from URL pathname for SEO-friendly language switching
 * BEP SEO: Enables crawlers to discover language variants via /es/, /fr/ subpaths
 * Matches Firebase hosting rewrite structure and prerender output
 * @returns {string|null} Language code if valid, null otherwise
 */
const getLanguageFromUrl = () => {
    if (typeof window === 'undefined') return null;

    // Extract language from pathname (e.g., /es/clock → es, /fr/about → fr)
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const firstPart = pathParts[0];

    // Validate against supported languages
    if (firstPart && SUPPORTED_LANGUAGES.includes(firstPart)) {
        return firstPart;
    }
    return null;
};

/**
 * Provides language selection and persistence with lazy loading support
 * Priority order: URL pathname (/es/, /fr/) > localStorage > Firestore > browser detection
 * - URL pathname: Enables SEO hreflang URLs (/es/clock, /fr/about)
 * - localStorage: Works for guests and authenticated users
 * - Firestore: Syncs preference for authenticated users
 * - Preloads critical namespaces (common, pages) to prevent flicker
 * - Gracefully handles missing context (returns default language 'en')
 */
export function LanguageProvider({ children }) {
    const { i18n } = useTranslation();
    const { user } = useAuth();
    const [isLoadingLanguage, setIsLoadingLanguage] = useState(true);

    // Load language on mount (from URL pathname, localStorage, then Firestore if authenticated)
    // BEP SEO: URL pathname takes priority to support hreflang crawler discovery
    // BEP: Preload critical namespaces to prevent translation flicker
    // Only runs once on component mount - dependencies stable to prevent infinite loops
    useEffect(() => {
        const loadLanguagePreference = async () => {
            try {
                // BEP SEO: Check URL param first (for crawler/hreflang support)
                const urlLang = getLanguageFromUrl();
                let savedLanguage = urlLang || localStorage.getItem('preferredLanguage') || DEFAULT_LANGUAGE;

                // If user is authenticated and no URL override, try to load from Firestore
                if (!urlLang && user?.uid) {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        if (userDoc.exists() && userDoc.data().preferredLanguage) {
                            savedLanguage = userDoc.data().preferredLanguage;
                            // Update localStorage to match Firestore
                            localStorage.setItem('preferredLanguage', savedLanguage);
                        }
                    } catch (error) {
                        console.error('Failed to load language from Firestore:', error);
                        // Fall back to localStorage
                    }
                }

                // If URL had valid lang param, persist to localStorage for session continuity
                if (urlLang) {
                    localStorage.setItem('preferredLanguage', urlLang);
                }

                // BEP PERFORMANCE: Preload critical namespaces before changing language
                // Prevents translation flicker on initial load
                await Promise.all([
                    i18n.loadNamespaces(['common', 'pages']),
                ]);

                // Apply language if different from current
                if (i18n.language !== savedLanguage) {
                    await i18n.changeLanguage(savedLanguage);
                }
            } finally {
                setIsLoadingLanguage(false);
            }
        };

        loadLanguagePreference();
        // Only depend on user.uid to prevent infinite loops
        // i18n object is stable after initialization, no need to include it
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.uid]);

    // Provide context value
    const value = {
        language: i18n.language,
        isLoading: isLoadingLanguage,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

LanguageProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

/**
 * Hook to access language context
 * Returns: { language: string, isLoading: boolean }
 * Safe: Returns default if context not available (SSR/prerender compatibility)
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
    const context = useContext(LanguageContext);

    if (!context) {
        return {
            language: 'en',
            isLoading: false,
        };
    }

    return context;
}
