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
import enNotification from './locales/en/notification.json';
import enActions from './locales/en/actions.json';
import enValidation from './locales/en/validation.json';
import enStates from './locales/en/states.json';
import enDialogs from './locales/en/dialogs.json';
import enA11y from './locales/en/a11y.json';
import enForm from './locales/en/form.json';
import enAdmin from './locales/en/admin.json';
import enMisc from './locales/en/misc.json';

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
import esNotification from './locales/es/notification.json';
import esActions from './locales/es/actions.json';
import esValidation from './locales/es/validation.json';
import esStates from './locales/es/states.json';
import esDialogs from './locales/es/dialogs.json';
import esA11y from './locales/es/a11y.json';
import esForm from './locales/es/form.json';
import esAdmin from './locales/es/admin.json';
import esMisc from './locales/es/misc.json';

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
import frNotification from './locales/fr/notification.json';
import frActions from './locales/fr/actions.json';
import frValidation from './locales/fr/validation.json';
import frStates from './locales/fr/states.json';
import frDialogs from './locales/fr/dialogs.json';
import frA11y from './locales/fr/a11y.json';
import frForm from './locales/fr/form.json';
import frAdmin from './locales/fr/admin.json';
import frMisc from './locales/fr/misc.json';

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
    notification: enNotification,
    actions: enActions,
    validation: enValidation,
    states: enStates,
    dialogs: enDialogs,
    a11y: enA11y,
    form: enForm,
    admin: enAdmin,
    misc: enMisc,
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
    notification: esNotification,
    actions: esActions,
    validation: esValidation,
    states: esStates,
    dialogs: esDialogs,
    a11y: esA11y,
    form: esForm,
    admin: esAdmin,
    misc: esMisc,
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
    notification: frNotification,
    actions: frActions,
    validation: frValidation,
    states: frStates,
    dialogs: frDialogs,
    a11y: frA11y,
    form: frForm,
    admin: frAdmin,
    misc: frMisc,
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
