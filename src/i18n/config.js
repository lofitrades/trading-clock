/**
 * src/i18n/config.js
 *
 * Purpose: i18next configuration and initialization for multilanguage support
 * Initializes i18next with language detection, namespace loading, and fallback
 *
 * Changelog:
 * v1.0.0 - 2026-01-24 - Initial i18n configuration with 3 MVP languages (EN, ES, FR)
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enSettings from './locales/en/settings.json';
import enEvents from './locales/en/events.json';
import enCalendar from './locales/en/calendar.json';
import enPages from './locales/en/pages.json';
import enLegal from './locales/en/legal.json';
import enErrors from './locales/en/errors.json';
import enTimezone from './locales/en/timezone.json';
import enWelcome from './locales/en/welcome.json';
import enMessages from './locales/en/messages.json';
import enIcons from './locales/en/icons.json';

import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esSettings from './locales/es/settings.json';
import esEvents from './locales/es/events.json';
import esCalendar from './locales/es/calendar.json';
import esPages from './locales/es/pages.json';
import esLegal from './locales/es/legal.json';
import esErrors from './locales/es/errors.json';
import esTimezone from './locales/es/timezone.json';
import esWelcome from './locales/es/welcome.json';
import esMessages from './locales/es/messages.json';
import esIcons from './locales/es/icons.json';

import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frSettings from './locales/fr/settings.json';
import frEvents from './locales/fr/events.json';
import frCalendar from './locales/fr/calendar.json';
import frPages from './locales/fr/pages.json';
import frLegal from './locales/fr/legal.json';
import frErrors from './locales/fr/errors.json';
import frTimezone from './locales/fr/timezone.json';
import frWelcome from './locales/fr/welcome.json';
import frMessages from './locales/fr/messages.json';
import frIcons from './locales/fr/icons.json';

/**
 * Translation resources organized by language and namespace
 * Namespaces allow splitting translations into logical groups
 */
const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    settings: enSettings,
    events: enEvents,
    calendar: enCalendar,
    pages: enPages,
    legal: enLegal,
    errors: enErrors,
    timezone: enTimezone,
    welcome: enWelcome,
    messages: enMessages,
    icons: enIcons,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    settings: esSettings,
    events: esEvents,
    calendar: esCalendar,
    pages: esPages,
    legal: esLegal,
    errors: esErrors,
    timezone: esTimezone,
    welcome: esWelcome,
    messages: esMessages,
    icons: esIcons,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    settings: frSettings,
    events: frEvents,
    calendar: frCalendar,
    pages: frPages,
    legal: frLegal,
    errors: frErrors,
    timezone: frTimezone,
    welcome: frWelcome,
    messages: frMessages,
    icons: frIcons,
  },
};

/**
 * Initialize i18next with language detection and React integration
 * BEP: Auto-detect user language preference from browser/localStorage
 */
i18n
  .use(LanguageDetector)      // Auto-detect user language
  .use(initReactI18next)      // Initialize React integration
  .init({
    resources,
    fallbackLng: 'en',        // Fall back to English if language not found
    ns: ['common', 'auth', 'settings'],  // Default namespaces
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,     // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],  // Cache language preference to localStorage
    },
    react: {
      useSuspense: false,     // Prevent Suspense boundary issues
    },
  });

export default i18n;
