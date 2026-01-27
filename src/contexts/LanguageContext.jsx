/**
 * src/contexts/LanguageContext.jsx
 * 
 * Purpose: Manages language selection state and persistence
 * Loads language from localStorage on mount, syncs to Firestore for authenticated users
 * Provides useLanguage hook for components to access current language preference
 * 
 * Changelog:
 * v1.0.0 - 2026-01-27 - Initial implementation (Phase 4)
 */

import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const LanguageContext = createContext();

/**
 * Provides language selection and persistence
 * - localStorage: Works for guests and authenticated users
 * - Firestore: Syncs preference for authenticated users
 * - Gracefully handles missing context (returns default language 'en')
 */
export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(true);

  // Load language on mount (from localStorage, then Firestore if authenticated)
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        let savedLanguage = localStorage.getItem('preferredLanguage') || 'en';

        // If user is authenticated, try to load from Firestore
        if (user?.uid) {
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

        // Apply language if different from current
        if (i18n.language !== savedLanguage) {
          await i18n.changeLanguage(savedLanguage);
        }
      } finally {
        setIsLoadingLanguage(false);
      }
    };

    loadLanguagePreference();
  }, [user?.uid, i18n]);

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
