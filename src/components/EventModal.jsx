/**
 * src/components/EventModal.jsx
 * 
 * Purpose: Enterprise-grade modal for displaying comprehensive economic event details
 * Combines data from economicEventsCalendar and economicEventDescriptions collections
 * 
 * Key Features:
 * - Full-screen modal on mobile, dialog on desktop
 * - Comprehensive event data display (actual/forecast/previous values)
 * - Event description with trading implications
 * - Key thresholds and frequency information
 * - Impact indicators with visual badges
 * - Currency flags and category chips
 * - Smooth animations and transitions
 * - Keyboard navigation (ESC to close)
 * - Loading states with skeletons
 * - Mobile-first responsive design
 * 
 * Changelog:
 * v2.8.0 - 2026-02-04 - BEP MOBILE RESPONSIVENESS FIX: Fixed EventModal to be fully viewport height aware on mobile devices. DialogContent now has flex:1, minHeight:0, overflowY:auto with minimal scrollbar styling (6px, rgba(60,77,99,0.32)). DialogActions now has flexShrink:0 to stick to bottom. Paper has display:flex, flexDirection:column, height:100vh for full viewport coverage. Footer now correctly positions above mobile navbar instead of below it. Applied minimal scrollbar styling matching LandingPage pattern. Matches BEP patterns from AuthModal2 and SettingsSidebar2.
 * v2.7.2 - 2026-02-03 - BEP EVENT PAGE LANGUAGE FIX: Added i18n language parameter to event page URL. Now opens /events/{id}?lang=es for Spanish, ?lang=fr for French, no param for English.
 * v2.7.0 - 2026-02-03 - BEP EVENT PAGE LINK FIX: Fixed "Open event page" button to only appear for canonical economic events. Added hasEventPage() and getEventPageId() validators. Imports economicEventDescriptions.json to verify event ID is valid. Prevents broken links on custom events or calendar variants with invalid IDs (e.g., Firestore document IDs). Button now correctly opens /events/{validEventId} only for events with corresponding SEO pages.
 * v2.6.0 - 2026-02-02 - BEP i18n: Event descriptions now fetched with current language for multi-language support. Re-fetches when language changes.
 * v2.5.0 - 2026-01-30 - BEP NOW WINDOW CONSISTENCY: "Past Event" chip now only appears after NOW window ends (isPastNowWindow = isPast && !isNow). During entire 10-minute NOW state, modal displays full NOW badge without "Past Event" indicator. Ensures consistent UX: active NOW events remain prominent throughout their window, matching ClockEventsOverlay behavior.
 * v2.4.0 - 2026-01-29 - REVERTED: Removed outcome-based coloring from actual values. Actual values now display with consistent default coloring for reliable user experience, matching forecast and previous values.
 * v2.4.0 - 2026-01-29 - BEP i18n & timezone: Time display now timezone-aware and in AM/PM format (12-hour). Uses toLocaleTimeString with language-aware locale and hour12: true. Respects user's selected timezone.
 * v2.3.0 - 2026-01-29 - BEP i18n: Language-aware date formatting below event title. Date now respects user's language preference (EN/ES/FR) using toLocaleString with i18n language code.
 * v2.1.0 - 2026-01-23 - BEP: Enable series reminders for recurring custom events. seriesKey now returns custom-series:${seriesId} for recurring custom events, allowing "Apply to all occurrences" functionality.
 * v2.0.0 - 2026-01-24 - BEP MAJOR REFACTOR: Migrated to RemindersEditor2 with Google-like UI. Individual save/cancel buttons per reminder, inline scope selector, view/edit modes, immediate deletion. Removed global save/reset buttons. Max 3 reminders per event.
 * v1.13.17 - 2026-01-24 - BEP FIX: RemindersEditor v1.6.1 - Restored missing if (isSaved) conditional that prevented new reminders from showing edit options. Formatter had removed the conditional check, causing all reminders to render as read-only.
 * v1.13.16 - 2026-01-24 - BEP: Hide scope selector when only saved reminders exist. Show scope selector only when reminderDraft.length > reminderBaseline.length (user adding new reminders). Ensures "Apply to" option is contextually shown only during reminder creation.
 * v1.13.15 - 2026-01-24 - BEP: Display scope for saved reminders ("This event only" vs "All matching events"). Pass reminderScopes and seriesLabel to RemindersEditor.
 * v1.13.14 - 2026-01-24 - BEP: Pass savedCount to RemindersEditor to make saved reminders read-only. Users can only add/remove reminders, not edit existing ones.
 * v1.13.13 - 2026-01-24 - BEP FIX: Delete reminders by actual document ID from found reminder, not just computed keys. Fixes reminder deletion when doc was saved under different key format.
 * v1.13.12 - 2026-01-24 - BEP: Migrate to useReminderActions hook for save/delete operations. Keeps local form state (draft, baseline, dirty) for UX while using centralized hook for Firestore operations.
 * v1.13.11 - 2026-01-23 - BEP FIX: Reminders UX improvements - Extended success alert to 5s, added save cycle tracking to prevent premature alert reset, added lastSavedReminders ref to prevent dirty state during Firestore sync window, fixed UI not updating after reminder removal.
 * v1.13.10 - 2026-01-23 - BEP FIX: Favorites toggle not firing. Added e.preventDefault() to click handler, onTouchEnd handler for mobile support, and ungated diagnostic console.logs to trace click flow. Addresses issue where favorites heart click did nothing in modal header.
 * v1.13.9 - 2026-01-23 - BEP: Add gated favorites click diagnostics.
 * v1.13.8 - 2026-01-23 - Add on-screen debug panel for reminder save diagnostics.
 * v1.13.7 - 2026-01-23 - Match reminders by eventId alias to resolve non-custom reminder loading.
 * v1.13.6 - 2026-01-23 - Save reminders to series key when scope is series.
 * v1.13.5 - 2026-01-23 - Add reminder save confirmation UI and reset success on edits.
 * v1.13.4 - 2026-01-23 - Disable reminder saving until reminder base loads and surface error when unavailable.
 * v1.13.3 - 2026-01-23 - Improve push enablement diagnostics and service worker readiness.
 * v1.13.2 - 2026-01-23 - Allow push toggle when permission granted but token pending.
 * v1.13.1 - 2026-01-23 - Add FCM token registration hook for push reminders.
 * v1.13.0 - 2026-01-23 - Add series reminder scope selector for non-custom events.
 * v1.12.1 - 2026-01-23 - Enforce 1h+ repeat requirement and refine reminder load error copy.
 * v1.12.0 - 2026-01-23 - Add unified reminders controls for all event sources with save support.
 * v1.11.4 - 2026-01-22 - BUGFIX: Remove unused imports and variables; add PropTypes validation to all components.
 * v1.11.3 - 2026-01-22 - BEP: Normalize custom impact values (numeric/string) so /clock modal renders correct impact chip instead of Unknown.
 * v1.11.3 - 2026-01-28 - BEP THEME: Replaced 8+ hardcoded white colors with theme.palette.common.white for proper theme adaptation. Changed alpha('#fff') to alpha(theme.palette.common.white) throughout button hover and disabled states. All modal action buttons now adapt to light/dark theme modes.
 * v1.11.2 - 2026-01-22 - BEP: Fix custom event impact badge on /clock by resolving impact from custom event fields and display cache fallback.
 * v1.11.1 - 2026-01-22 - BEP: Enhanced custom event display with metadata section showing impact badge, 'Custom event' chip, and appearance (custom icon + color). Provides visual consistency with economic events and better context for custom reminders.
 * v1.11.0 - 2026-01-22 - BEP: Add support for custom events with Edit button. Displays custom event fields (title, description, timezone, reminders, appearance). Edit button opens CustomEventDialog at z-index 12003 (above EventModal at 12001). Dynamic rendering based on event.isCustom flag.
 * v1.10.3 - 2026-01-17 - BUGFIX: Set Dialog z-index to 12001 to appear on top of fullscreen mode (matches AuthModal2 hierarchy)
 * v1.10.2 - 2026-01-16 - Display all-day/tentative time labels when provided.
 * v1.10.1 - 2025-12-18 - Centralize impact color sourcing: low = yellow (#F2C94C), unknown = taupe (#C7B8A4) to avoid session color conflicts across modal chips.
 * v1.10.0 - 2025-12-18 - Centralize impact color sourcing and set low impact to taupe (#C7B8A4) to avoid session color conflicts across modal chips.
 * v1.9.1 - 2025-12-15 - REFACTOR: Replaced hardcoded NOW/NEXT calculations with global timezone-aware eventTimeEngine utilities (NOW_WINDOW_MS, getEventEpochMs, getNowEpochMs, computeNowNextState)
 * v1.9.0 - 2025-12-15 - Feature: Added countdown timer to NEXT badge with live updates; Added favorite and notes action buttons in header with full functionality, loading states, and mobile-first design
 * v1.8.0 - 2025-12-11 - Feature: Added NOW/NEXT event status chips (NOW = within 9min window with pulse animation, NEXT = upcoming within 24h); added all canonical fields display (status, winnerSource, sourceKey, sources, qualityScore, outcome, quality)
 * v1.6.2 - 2025-12-01 - Developer UX: Moved event ID to modal footer (left side), added click-to-copy functionality with visual feedback (green checkmark, "Copied!" message for 2s)
 * v1.6.1 - 2025-12-01 - Developer UX: Added event UID display in modal header (truncated with tooltip showing full ID) for debugging and tracking
 * v1.6.1 - 2025-12-01 - Refactored: Removed duplicate formatTime/formatDate functions, now using centralized src/utils/dateUtils for DRY principle and consistency across components
 * v1.6.0 - 2025-12-01 - CRITICAL BUGFIX: Fixed timezone conversion - Added timezone prop, updated formatTime/formatDate to accept timezone parameter, all times now properly convert to user-selected timezone (NOT local device time)
 * v1.5.1 - 2025-11-30 - Enterprise enhancement: Ensured all tooltips work on mobile touch with proper event listeners (disableTouchListener=false, disableInteractive=false)
 * v1.5.0 - 2025-11-30 - UX enhancement: Enhanced tooltips with mobile tap support, rich descriptions for Impact/Currency chips, improved tooltip UI with light theme
 * v1.4.0 - 2025-11-30 - UX enhancement: Added help icons with tooltips to all section headers for better user guidance (enterprise copywriting standards)
 * v1.3.0 - 2025-11-30 - UX improvement: Event Data layout now 3 columns on all screen sizes; refresh icon positioned absolute top-right (MUI best practice); responsive icon sizing
 * v1.2.0 - 2025-11-30 - UX enhancement: Added visual confirmation (✓ Updated) and skeleton loading state for data refresh; values clear while loading
 * v1.1.0 - 2025-11-30 - Feature: Added refresh button to Data Values Section to fetch fresh event data from Firestore (refreshes specific event only)
 * v1.0.3 - 2025-11-30 - UX enhancement: Added impact level text to ImpactBadge (e.g., "!!! High Impact")
 * v1.0.2 - 2025-11-30 - UX fix: Added top margin to Stack container for proper spacing between header and first section (mt: 1-1.5)
 * v1.0.1 - 2025-11-30 - UX improvement: Added proper padding-top to dialog content for better visual separation from header (pt: 3-4)
 * v1.0.0 - 2025-11-30 - Initial implementation with enterprise best practices
 */

import React, { useMemo, useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Card,
  CardContent,
  Stack,
  Skeleton,
  Fade,
  Slide,
  useTheme,
  useMediaQuery,
  alpha,
  Tooltip as MuiTooltip,
  CircularProgress,
} from '@mui/material';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';
import UnsavedChangesModal from './UnsavedChangesModal';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FavoriteBorderOutlined from '@mui/icons-material/FavoriteBorderOutlined';
import Favorite from '@mui/icons-material/Favorite';
import NoteAltOutlined from '@mui/icons-material/NoteAltOutlined';
import NoteAlt from '@mui/icons-material/NoteAlt';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getEventDescription } from '../services/economicEventsService';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { resolveImpactMeta } from '../utils/newsApi';
import { getCustomEventIconComponent } from '../utils/customEventStyle';
import RemindersEditor2 from './RemindersEditor2';
import { useAuth } from '../contexts/AuthContext';
import { buildSeriesKey, normalizeEventForReminder } from '../utils/remindersRegistry';
import { subscribeToReminder } from '../services/remindersService';
import { useReminderActions } from '../hooks/useReminderActions';
import { updateCustomEvent } from '../services/customEventsService';
import { requestFcmTokenForUser } from '../services/pushNotificationsService';
import {
  formatCountdownHMS,
  NOW_WINDOW_MS,
  getEventEpochMs,
  getNowEpochMs,
  computeNowNextState
} from '../utils/eventTimeEngine';
import eventDescriptionsData from '../../data/economicEventDescriptions.json';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Currency to country code mapping for flag icons
 */
const CURRENCY_TO_COUNTRY = {
  'USD': 'us', 'EUR': 'eu', 'GBP': 'gb', 'JPY': 'jp', 'CHF': 'ch',
  'AUD': 'au', 'CAD': 'ca', 'NZD': 'nz', 'CNY': 'cn', 'HKD': 'hk',
  'SGD': 'sg', 'SEK': 'se', 'NOK': 'no', 'DKK': 'dk', 'PLN': 'pl',
  'CZK': 'cz', 'HUF': 'hu', 'RON': 'ro', 'TRY': 'tr', 'ZAR': 'za',
  'BRL': 'br', 'MXN': 'mx', 'INR': 'in', 'KRW': 'kr', 'RUB': 'ru',
  'THB': 'th', 'IDR': 'id', 'MYR': 'my', 'PHP': 'ph', 'ILS': 'il',
  'CLP': 'cl', 'ARS': 'ar', 'COP': 'co', 'PEN': 'pe', 'VND': 'vn',
};

/**
 * Currency names for tooltips
 */
const CURRENCY_NAMES = {
  'USD': 'United States Dollar', 'EUR': 'Euro', 'GBP': 'British Pound Sterling',
  'JPY': 'Japanese Yen', 'CHF': 'Swiss Franc', 'AUD': 'Australian Dollar',
  'CAD': 'Canadian Dollar', 'NZD': 'New Zealand Dollar', 'CNY': 'Chinese Yuan',
  'HKD': 'Hong Kong Dollar', 'SGD': 'Singapore Dollar', 'SEK': 'Swedish Krona',
  'NOK': 'Norwegian Krone', 'DKK': 'Danish Krone', 'PLN': 'Polish Zloty',
  'CZK': 'Czech Koruna', 'HUF': 'Hungarian Forint', 'RON': 'Romanian Leu',
  'TRY': 'Turkish Lira', 'ZAR': 'South African Rand', 'BRL': 'Brazilian Real',
  'MXN': 'Mexican Peso', 'INR': 'Indian Rupee', 'KRW': 'South Korean Won',
  'RUB': 'Russian Ruble', 'THB': 'Thai Baht', 'IDR': 'Indonesian Rupiah',
  'MYR': 'Malaysian Ringgit', 'PHP': 'Philippine Peso', 'ILS': 'Israeli Shekel',
  'CLP': 'Chilean Peso', 'ARS': 'Argentine Peso', 'COP': 'Colombian Peso',
  'PEN': 'Peruvian Sol', 'VND': 'Vietnamese Dong',
};

/**
 * Impact level configuration
 */
const IMPACT_CONFIG = {
  strong: {
    icon: '!!!',
    labelKey: 'events:impacts.highImpact',
    descriptionKey: 'events:impacts.highImpactDesc'
  },
  moderate: {
    icon: '!!',
    labelKey: 'events:impacts.mediumImpact',
    descriptionKey: 'events:impacts.mediumImpactDesc'
  },
  weak: {
    icon: '!',
    labelKey: 'events:impacts.lowImpact',
    descriptionKey: 'events:impacts.lowImpactDesc'
  },
  'not-loaded': {
    icon: '?',
    labelKey: 'events:impacts.dataNotLoaded',
    descriptionKey: 'events:impacts.dataNotLoadedDesc'
  },
  'non-economic': {
    icon: '~',
    labelKey: 'events:impacts.nonEconomic',
    descriptionKey: 'events:impacts.nonEconomicDesc'
  },
  unknown: {
    icon: '?',
    labelKey: 'events:impacts.unknown',
    descriptionKey: 'events:impacts.unknownDesc'
  },
};

/**
 * Animation durations for consistent UX
 */
const ANIMATION_DURATION = {
  slide: 300,
  fade: 200,
};

const shouldDebugFavorites = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage?.getItem('t2t_debug_favorites') === '1';
};

const logFavoriteDebug = (...args) => {
  if (!shouldDebugFavorites()) return;
  console.info('[favorites][EventModal]', ...args);
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get impact configuration based on impact level
 */
const getImpactConfig = (impact) => {
  const meta = resolveImpactMeta(impact);
  const base = IMPACT_CONFIG[meta.key] || IMPACT_CONFIG.unknown;
  return {
    ...base,
    color: meta.color,
    icon: base.icon || meta.icon,
  };
};

const normalizeCustomImpact = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    if (value >= 3) return 'strong';
    if (value === 2) return 'moderate';
    if (value === 1) return 'weak';
    return null;
  }
  const normalized = value.toString().toLowerCase();
  if (['high', 'strong', '3'].includes(normalized)) return 'strong';
  if (['medium', 'moderate', '2'].includes(normalized)) return 'moderate';
  if (['low', 'weak', '1'].includes(normalized)) return 'weak';
  if (['non-economic', 'none', '0'].includes(normalized)) return 'non-economic';
  return normalized;
};

const resolveEventSource = (event) => {
  if (!event) return 'unknown';
  if (event.isCustom) return 'custom';
  return event.eventSource || event.source || event.Source || event.sourceKey || 'canonical';
};

const isRepeatIntervalAllowed = (recurrence) => {
  if (!recurrence?.enabled) return true;
  const interval = recurrence.interval;
  return !['5m', '15m', '30m'].includes(interval);
};

/**
 * Get country code for currency flag
 */
const getCurrencyFlag = (currency) => {
  if (!currency) return null;
  return CURRENCY_TO_COUNTRY[currency.toUpperCase()] || null;
};

/**
 * Get outcome icon based on event outcome
 */
const getOutcomeIcon = (outcome) => {
  if (!outcome) return null;
  const lower = outcome.toLowerCase();

  if (lower.includes('bullish') || lower.includes('positive')) {
    return <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />;
  }
  if (lower.includes('bearish') || lower.includes('negative')) {
    return <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />;
  }
  return null;
};

/**
 * Check if event has a valid SEO event page
 * Only canonical economic events with loaded descriptions have event pages
 * @param {Object} event - The event object
 * @param {Object} description - The loaded description object (contains the event page id)
 */
const hasEventPage = (event, description) => {
  if (!event) return false;
  if (event.isCustom) return false; // Custom events don't have pages

  // If description is loaded, use description.id as the canonical event page ID
  if (description?.id) {
    const validEventIds = eventDescriptionsData?.events?.map(e => e.id) || [];
    return validEventIds.includes(description.id);
  }

  return false;
};

/**
 * Get the correct event page ID for SEO event pages
 * @param {Object} description - The loaded description object
 */
const getEventPageId = (description) => {
  return description?.id || null;
};

// Date formatting utilities imported from centralized dateUtils

// ============================================================================
// TRANSITION COMPONENT
// ============================================================================

const SlideTransition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// ============================================================================
// MEMOIZED SUBCOMPONENTS
// ============================================================================

/**
 * Impact Badge Component
 */
const ImpactBadge = memo(({ impact, label, description }) => {
  const config = getImpactConfig(impact);
  const displayLabel = label || config.label;
  const displayDescription = description || config.description;

  return (
    <MuiTooltip
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {displayLabel}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>
            {displayDescription}
          </Typography>
        </Box>
      }
      arrow
      placement="top"
      enterTouchDelay={100}
      leaveTouchDelay={3000}
      disableFocusListener={false}
      disableTouchListener={false}
      disableHoverListener={false}
      disableInteractive={false}
      PopperProps={{
        sx: {
          '& .MuiTooltip-tooltip': {
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 3,
            border: '1px solid',
            borderColor: 'divider',
            maxWidth: 280,
            p: 1.5,
            lineHeight: 1.5,
          },
          '& .MuiTooltip-arrow': {
            color: 'background.paper',
            '&::before': {
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        },
      }}
    >
      <Chip
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
              {config.icon}
            </Box>
            <Box sx={{ fontWeight: 600 }}>
              {displayLabel}
            </Box>
          </Box>
        }
        size="medium"
        sx={{
          minWidth: 48,
          height: 28,
          bgcolor: config.color,
          color: 'common.white',
          fontSize: '0.875rem',
          cursor: 'help',
          '& .MuiChip-label': {
            px: 1.5,
          },
        }}
      />
    </MuiTooltip>
  );
});

ImpactBadge.displayName = 'ImpactBadge';
ImpactBadge.propTypes = {
  impact: PropTypes.string.isRequired,
  label: PropTypes.string,
  description: PropTypes.string,
};

/**
 * Currency Flag Component
 */
const CurrencyFlag = memo(({ currency, affectsMessage, impactMessage }) => {
  const countryCode = getCurrencyFlag(currency);
  const currencyName = CURRENCY_NAMES[currency] || currency;
  const affectsText = affectsMessage || 'Economic data affects this currency';
  const impactText = impactMessage || `This event impacts ${currency} valuation`;

  if (!countryCode) {
    return (
      <MuiTooltip
        title={`${currencyName} - ${affectsText}`}
        arrow
        placement="top"
        enterTouchDelay={100}
        leaveTouchDelay={3000}
        disableFocusListener={false}
        disableTouchListener={false}
        disableHoverListener={false}
        disableInteractive={false}
        PopperProps={{
          sx: {
            '& .MuiTooltip-tooltip': {
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 3,
              border: '1px solid',
              borderColor: 'divider',
              fontSize: '0.8125rem',
              lineHeight: 1.5,
            },
            '& .MuiTooltip-arrow': {
              color: 'background.paper',
              '&::before': {
                border: '1px solid',
                borderColor: 'divider',
              },
            },
          },
        }}
      >
        <Chip
          label={currency}
          size="small"
          variant="outlined"
          sx={{
            height: 24,
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'help',
          }}
        />
      </MuiTooltip>
    );
  }

  return (
    <MuiTooltip
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
            {currency}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>
            {currencyName}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.75rem', opacity: 0.8, display: 'block', mt: 0.5 }}>
            {impactText}
          </Typography>
        </Box>
      }
      arrow
      placement="top"
      enterTouchDelay={100}
      leaveTouchDelay={3000}
      disableFocusListener={false}
      disableTouchListener={false}
      disableHoverListener={false}
      disableInteractive={false}
      PopperProps={{
        sx: {
          '& .MuiTooltip-tooltip': {
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: 3,
            border: '1px solid',
            borderColor: 'divider',
            maxWidth: 260,
            p: 1.5,
            lineHeight: 1.5,
          },
          '& .MuiTooltip-arrow': {
            color: 'background.paper',
            '&::before': {
              border: '1px solid',
              borderColor: 'divider',
            },
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.5,
          borderRadius: 1,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          cursor: 'help',
        }}
      >
        <Box
          component="span"
          className={`fi fi-${countryCode}`}
          sx={{
            fontSize: 18,
            lineHeight: 1,
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {currency}
        </Typography>
      </Box>
    </MuiTooltip>
  );
});

CurrencyFlag.displayName = 'CurrencyFlag';
CurrencyFlag.propTypes = {
  currency: PropTypes.string.isRequired,
  affectsMessage: PropTypes.string,
  impactMessage: PropTypes.string,
};

/**
 * Enhanced Tooltip Component with mobile touch support
 * Enterprise best practices for mobile-first design
 */
const EnhancedTooltip = memo(({ title, children, placement = 'top' }) => (
  <MuiTooltip
    title={title}
    arrow
    placement={placement}
    enterTouchDelay={100}
    leaveTouchDelay={3000}
    disableFocusListener={false}
    disableTouchListener={false}
    disableHoverListener={false}
    disableInteractive={false}
    PopperProps={{
      sx: {
        '& .MuiTooltip-tooltip': {
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 3,
          border: '1px solid',
          borderColor: 'divider',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
        },
        '& .MuiTooltip-arrow': {
          color: 'background.paper',
          '&::before': {
            border: '1px solid',
            borderColor: 'divider',
          },
        },
      },
    }}
  >
    {children}
  </MuiTooltip>
));

EnhancedTooltip.displayName = 'EnhancedTooltip';
EnhancedTooltip.propTypes = {
  title: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  placement: PropTypes.string,
};

/**
 * Data Value Display Component
 */
const DataValueBox = memo(({ label, value, isPrimary = false, loading = false }) => {
  const hasValue = value && value !== '—' && value !== '-';

  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: 'block',
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          fontWeight: 600,
          mb: 0.75,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Typography>
      {loading ? (
        <Skeleton
          variant="text"
          width="80%"
          height={36}
          sx={{
            mx: 'auto',
            fontSize: { xs: '1rem', sm: '1.125rem' },
          }}
        />
      ) : (
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1rem', sm: '1.125rem' },
            color: hasValue ? (isPrimary ? 'primary.main' : 'text.primary') : 'text.disabled',
          }}
        >
          {hasValue ? value : '—'}
        </Typography>
      )}
    </Box>
  );
});

DataValueBox.displayName = 'DataValueBox';
DataValueBox.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  isPrimary: PropTypes.bool,
  loading: PropTypes.bool,
};

/**
 * Loading Skeleton for Modal Content
 */
const ModalSkeleton = memo(() => (
  <Stack spacing={3}>
    <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
    <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
  </Stack>
));

ModalSkeleton.displayName = 'ModalSkeleton';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * EventModal - Enterprise-grade modal for event details
 * @param {boolean} open - Modal open state
 * @param {Function} onClose - Close handler
 * @param {Object} event - Event data object
 * @param {string} timezone - IANA timezone (e.g., 'America/New_York')
 * @param {Function} isFavoriteEvent - Check if event is favorited
 * @param {Function} onToggleFavorite - Toggle favorite handler
 * @param {Function} isFavoritePending - Check if favorite is pending
 * @param {boolean} favoritesLoading - Favorites loading state
 * @param {Function} hasEventNotes - Check if event has notes
 * @param {Function} onOpenNotes - Open notes dialog handler
 * @param {Function} isEventNotesLoading - Check if notes are loading
 */
function EventModal({
  open,
  onClose,
  event,
  timezone = 'America/New_York',
  isFavoriteEvent = () => false,
  onToggleFavorite = null,
  isFavoritePending = () => false,
  favoritesLoading = false,
  hasEventNotes = () => false,
  onOpenNotes = null,
  isEventNotesLoading = () => false,
  onEditCustomEvent = null,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fullScreen = isMobile;
  const { user } = useAuth();
  const { t, i18n } = useTranslation(['events', 'common']);

  // Centralized reminder actions hook
  const {
    reminders: allReminders,
    saveReminder: hookSaveReminder,
    deleteReminder: hookDeleteReminder,
  } = useReminderActions();

  // State
  const [description, setDescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshingEvent, setRefreshingEvent] = useState(false);
  const [refreshedEvent, setRefreshedEvent] = useState(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const [reminderDoc, setReminderDoc] = useState(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderError, setReminderError] = useState('');
  const [reminderListMatch, setReminderListMatch] = useState(null);
  const [reminderDebugInfo, setReminderDebugInfo] = useState(null);
  const [reminderSuccessMessage, setReminderSuccessMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  // Update countdown every second for NEXT badge
  useEffect(() => {
    if (!open || !event) return undefined;
    const id = setInterval(() => setCountdownNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open, event]);

  // Fetch description when modal opens
  useEffect(() => {
    if (open && event) {
      setLoading(true);
      setDescription(null);

      // Fetch description with current language for i18n support
      const currentLanguage = i18n.language?.split('-')[0] || 'en';
      getEventDescription(event.Name, event.category, currentLanguage)
        .then((result) => {
          if (result.success) {
            setDescription(result.data);
          }
        })
        .catch((error) => {
          console.error('Error loading event description:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Reset state when modal closes
      setDescription(null);
      setLoading(false);
      setRefreshedEvent(null);
      setRefreshSuccess(false);
    }
  }, [open, event, i18n.language]);

  // Function to refresh event data from Firestore
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirmation(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowCloseConfirmation(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
  };

  const handleRefreshEvent = async () => {
    if (!event?.id) return;

    setRefreshingEvent(true);
    setRefreshSuccess(false);

    try {
      const eventDocRef = doc(db, 'economicEventsCalendar', event.id);
      const eventDoc = await getDoc(eventDocRef);

      if (eventDoc.exists()) {
        const data = eventDoc.data();
        const eventDate = data.date?.toDate ? data.date.toDate() : null;

        const updatedEvent = {
          id: eventDoc.id,
          ...data,
          date: eventDate,
          dateISO: eventDate?.toISOString(),
          dateLocal: eventDate?.toLocaleString(),
        };

        setRefreshedEvent(updatedEvent);
        setRefreshSuccess(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
          setRefreshSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Failed to refresh event:', error);
    } finally {
      setRefreshingEvent(false);
    }
  };

  const reminderEvent = refreshedEvent || event;
  const reminderSource = useMemo(() => resolveEventSource(reminderEvent), [reminderEvent]);
  const reminderBase = useMemo(() => {
    if (!reminderEvent) return null;
    return normalizeEventForReminder({
      event: reminderEvent,
      source: reminderSource,
      userId: user?.uid,
      reminders: reminderEvent.reminders || [],
      metadata: {
        recurrence: reminderEvent.recurrence || null,
        localDate: reminderEvent.localDate || null,
        localTime: reminderEvent.localTime || null,
        description: reminderEvent.description || null,
        customColor: reminderEvent.customColor || null,
        customIcon: reminderEvent.customIcon || null,
        showOnClock: reminderEvent.showOnClock ?? null,
        isCustom: Boolean(reminderEvent.isCustom),
        seriesId: reminderEvent.seriesId || reminderEvent.id || null,
      },
    });
  }, [reminderEvent, reminderSource, user?.uid]);

  const reminderBaseline = useMemo(
    () => (reminderDoc?.reminders ?? reminderListMatch?.reminders ?? reminderBase?.reminders ?? []),
    [reminderDoc, reminderListMatch, reminderBase]
  );

  // Compute scope for each saved reminder
  const reminderScopes = useMemo(() => {
    const baselineLen = reminderBaseline.length;
    const scopes = [];
    for (let i = 0; i < baselineLen; i++) {
      scopes.push(reminderDoc?.scope ?? reminderListMatch?.scope ?? 'event');
    }
    return scopes;
  }, [reminderBaseline.length, reminderDoc?.scope, reminderListMatch?.scope]);

  useEffect(() => {
    if (!open) {
      setReminderDoc(null);
      setReminderError('');
      setReminderLoading(false);
      setReminderListMatch(null);
      setReminderDebugInfo(null);
      setReminderSuccessMessage('');
      setHasUnsavedChanges(false);
      setShowCloseConfirmation(false);
      return undefined;
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open || !reminderBase?.eventKey) return undefined;
    setReminderError('');

    if (!user?.uid) {
      setReminderDoc(null);
      setReminderLoading(false);
      return undefined;
    }

    setReminderLoading(true);
    const seriesDocRef = { current: null };
    const eventDocRef = { current: null };
    let eventResolved = false;
    let seriesResolved = !reminderBase.seriesKey || reminderBase.seriesKey === reminderBase.eventKey;

    const finalizeLoad = () => {
      if (eventResolved && seriesResolved) {
        setReminderDoc(seriesDocRef.current || eventDocRef.current || null);
        setReminderLoading(false);
      }
    };

    const handleSeries = (docData) => {
      seriesDocRef.current = docData;
      seriesResolved = true;
      setReminderDoc(seriesDocRef.current || eventDocRef.current || null);
      finalizeLoad();
    };

    const handleEvent = (docData) => {
      eventDocRef.current = docData;
      eventResolved = true;
      setReminderDoc(seriesDocRef.current || eventDocRef.current || null);
      finalizeLoad();
    };

    const handleError = () => {
      setReminderError('We could not load your reminders. Please try again in a moment.');
      setReminderLoading(false);
    };

    const unsubscribeEvent = subscribeToReminder(
      user.uid,
      reminderBase.eventKey,
      handleEvent,
      handleError
    );

    let unsubscribeSeries = () => { };
    if (reminderBase.seriesKey && reminderBase.seriesKey !== reminderBase.eventKey) {
      unsubscribeSeries = subscribeToReminder(
        user.uid,
        reminderBase.seriesKey,
        handleSeries,
        handleError
      );
    }

    return () => {
      unsubscribeEvent();
      unsubscribeSeries();
    };
  }, [open, reminderBase?.eventKey, reminderBase?.seriesKey, user?.uid]);

  // Use hook's reminders to find matching reminder for this event (replaces subscribeToReminders)
  useEffect(() => {
    if (!open || !user?.uid) {
      setReminderListMatch(null);
      return;
    }

    const eventIdCandidate = reminderEvent?.id || reminderEvent?.eventId || reminderEvent?.EventId || null;

    // BEP FIX: Filter out reminders with empty arrays (deleted reminders that haven't synced yet)
    const match = (allReminders || []).find((item) => {
      if (!item) return false;
      // Skip reminders with no reminders array or empty reminders array (deleted)
      if (!item.reminders || item.reminders.length === 0) return false;
      if (reminderBase?.eventKey && item.eventKey === reminderBase.eventKey) return true;
      if (reminderBase?.seriesKey && item.eventKey === reminderBase.seriesKey) return true;
      if (reminderBase?.seriesKey && item.seriesKey === reminderBase.seriesKey) return true;
      if (eventIdCandidate && (item.eventKey === `event:${eventIdCandidate}` || String(item.eventKey || '').endsWith(`:${eventIdCandidate}`))) {
        return true;
      }
      return false;
    });

    // BEP DEBUG: Log the found reminder's actual document ID vs computed keys
    if (match) {
      // Debug: Found existing reminder for event
    }

    setReminderListMatch(match || null);
  }, [open, user?.uid, allReminders, reminderEvent?.id, reminderEvent?.eventId, reminderEvent?.EventId, reminderBase?.eventKey, reminderBase?.seriesKey]);

  const requestBrowserPermission = async () => {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    return Notification.requestPermission();
  };

  const requestPushPermission = async () => {
    if (!user?.uid) return 'auth-required';
    try {
      const result = await requestFcmTokenForUser(user.uid);
      return result?.status || 'denied';
    } catch {
      return 'denied';
    }
  };

  const handleSaveReminder = async (index, reminder, scope) => {
    if (!user?.uid) {
      setReminderError('Sign in to save reminders.');
      throw new Error('Sign in to save reminders.');
    }
    if (!reminderBase) {
      setReminderError('Reminder details are still loading.');
      throw new Error('Reminder details are still loading.');
    }

    setReminderError('');
    setReminderSuccessMessage('');

    try {
      const activeRecurrence = reminderEvent?.recurrence || reminderBase?.metadata?.recurrence;
      if (!isRepeatIntervalAllowed(activeRecurrence)) {
        const error = 'Reminders can only repeat hourly or slower. Set the repeat interval to 1h or longer.';
        setReminderError(error);
        throw new Error(error);
      }

      // Get current reminders from baseline
      const currentReminders = reminderBaseline || [];

      // Update or add the reminder
      const updatedReminders = [...currentReminders];
      if (index < currentReminders.length) {
        // Editing existing reminder
        updatedReminders[index] = reminder;
      } else {
        // Adding new reminder
        updatedReminders.push(reminder);
      }

      // Save via centralized hook
      const result = await hookSaveReminder({
        event: reminderEvent,
        remindersList: updatedReminders,
        scope,
        metadata: {
          ...(reminderBase.metadata || {}),
          scope,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save reminder');
      }

      // For custom events, update the event document
      if (reminderEvent?.isCustom) {
        const customEventDocId = reminderEvent.seriesId || reminderEvent.id;
        if (customEventDocId && !customEventDocId.includes('__')) {
          await updateCustomEvent(user.uid, customEventDocId, {
            ...reminderEvent,
            reminders: updatedReminders,
          });
        }
      }

      setReminderSuccessMessage('Reminder saved successfully');
      setHasUnsavedChanges(false);
      setTimeout(() => setReminderSuccessMessage(''), 3000);
    } catch (error) {
      setReminderError(error?.message || 'Failed to save reminder');
      throw error;
    }
  };

  const handleDeleteReminder = async (index) => {
    if (!user?.uid) {
      setReminderError('Sign in to delete reminders.');
      throw new Error('Sign in to delete reminders.');
    }
    if (!reminderBase) {
      setReminderError('Reminder details are still loading.');
      throw new Error('Reminder details are still loading.');
    }

    setReminderError('');
    setReminderSuccessMessage('');

    try {
      const currentReminders = reminderBaseline || [];
      const updatedReminders = currentReminders.filter((_, idx) => idx !== index);

      if (updatedReminders.length === 0) {
        // BEP FIX: Delete ALL documents with matching eventKey/seriesKey (handles legacy duplicates)
        const existingDocId = reminderDoc?.id || reminderListMatch?.id;
        const existingEventKey = reminderDoc?.eventKey || reminderListMatch?.eventKey;
        const existingSeriesKey = reminderDoc?.seriesKey || reminderListMatch?.seriesKey;

        // Query Firestore for ALL documents with matching eventKey or seriesKey
        const remindersCollectionRef = collection(db, 'users', user.uid, 'reminders');
        const keysToMatch = new Set([
          existingEventKey,
          existingSeriesKey,
          reminderBase.eventKey,
          reminderBase.seriesKey,
        ].filter(Boolean));

        // Delete all matching documents
        const deletePromises = [];
        for (const keyToMatch of keysToMatch) {
          // Query by eventKey
          const eventKeyQuery = query(remindersCollectionRef, where('eventKey', '==', keyToMatch));
          const eventKeySnapshot = await getDocs(eventKeyQuery);
          eventKeySnapshot.forEach((docSnap) => {
            deletePromises.push(deleteDoc(doc(db, 'users', user.uid, 'reminders', docSnap.id)));
          });

          // Query by seriesKey
          const seriesKeyQuery = query(remindersCollectionRef, where('seriesKey', '==', keyToMatch));
          const seriesKeySnapshot = await getDocs(seriesKeyQuery);
          seriesKeySnapshot.forEach((docSnap) => {
            deletePromises.push(deleteDoc(doc(db, 'users', user.uid, 'reminders', docSnap.id)));
          });
        }

        // Execute all deletes
        await Promise.all(deletePromises);

        // Also call the hook's delete method for cleanup
        const result = await hookDeleteReminder(reminderEvent, {
          alsoDeleteSeries: true,
          existingDocId,
          existingEventKey,
          existingSeriesKey,
        });

        if (!result.success) {
          // Hook delete may return error for expected cases - proceed anyway
        }
      } else {
        // Update with remaining reminders
        const scope = reminderDoc?.scope || reminderListMatch?.scope || 'event';
        const result = await hookSaveReminder({
          event: reminderEvent,
          remindersList: updatedReminders,
          scope,
          metadata: {
            ...(reminderBase.metadata || {}),
            scope,
          },
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete reminder');
        }
      }

      // For custom events, update the event document
      if (reminderEvent?.isCustom) {
        const customEventDocId = reminderEvent.seriesId || reminderEvent.id;
        if (customEventDocId && !customEventDocId.includes('__')) {
          await updateCustomEvent(user.uid, customEventDocId, {
            ...reminderEvent,
            reminders: updatedReminders,
          });
        }
      }

      setReminderSuccessMessage('Reminder deleted successfully');
      setHasUnsavedChanges(false);
      setTimeout(() => setReminderSuccessMessage(''), 3000);
    } catch (error) {
      setReminderError(error?.message || 'Failed to delete reminder');
      throw error;
    }
  };

  // Use refreshed event data if available, otherwise use original event
  const currentEvent = reminderEvent;
  const safeEvent = useMemo(
    () => currentEvent || {},
    [currentEvent]
  );

  // Use global timezone-aware NOW/NEXT engine instead of hardcoded calculations
  const nowEpochMs = getNowEpochMs(timezone);
  const eventEpochMs = getEventEpochMs(currentEvent);

  // Compute NOW/NEXT state using global engine
  const nowNextState = computeNowNextState({
    events: currentEvent ? [currentEvent] : [],
    nowEpochMs,
    nowWindowMs: NOW_WINDOW_MS,
    buildKey: (evt) => evt.id || 'current-event'
  });

  const eventKey = currentEvent?.id || 'current-event';
  const isNow = nowNextState.nowEventIds.has(eventKey);
  const isNext = nowNextState.nextEventIds.has(eventKey);

  const isFutureEvent = eventEpochMs !== null && eventEpochMs > nowEpochMs;
  const isPast = eventEpochMs !== null && !isFutureEvent && !isNow;

  // BEP: NOW WINDOW CONSISTENCY - Keep NOW badge and styling throughout entire 10-min NOW window
  // Only show "Past Event" chip after NOW window ends (isPast && !isNow)
  const isPastNowWindow = isPast && !isNow;

  // Calculate countdown for NEXT badge using absolute epoch comparison
  const nextCountdown = isNext && eventEpochMs !== null
    ? formatCountdownHMS(Math.max(0, eventEpochMs - countdownNow))
    : null;

  // Determine actual value display
  let actualValue;
  if (isFutureEvent) {
    actualValue = '—';
  } else {
    const hasValidActual = safeEvent.actual &&
      safeEvent.actual !== '-' &&
      safeEvent.actual !== '' &&
      safeEvent.actual !== '0' &&
      safeEvent.actual !== 0;
    actualValue = hasValidActual ? safeEvent.actual : '—';
  }

  const customImpactValue = normalizeCustomImpact(
    safeEvent?.impact
    || safeEvent?._displayCache?.strengthValue
    || safeEvent?.strength
  );

  const remindersDisabled = !user?.uid;
  const reminderTimezone = reminderBase?.timezone || timezone;
  const seriesKey = useMemo(() => {
    if (!safeEvent) return null;

    // Non-custom events: use standard series key
    if (!safeEvent.isCustom) {
      return buildSeriesKey({ event: safeEvent, eventSource: resolveEventSource(safeEvent) });
    }

    // Custom recurring events: use seriesId
    if (safeEvent.recurrence?.enabled && safeEvent.seriesId) {
      return `custom-series:${safeEvent.seriesId}`;
    }

    return null;
  }, [safeEvent]);
  const seriesLabel = useMemo(() => {
    if (!safeEvent) return '';

    // Non-custom events
    if (!safeEvent.isCustom) {
      const name = safeEvent.name || safeEvent.Name || 'Series';
      const currency = safeEvent.currency || safeEvent.Currency || '—';
      const impactLabel = resolveImpactMeta(safeEvent.strength || safeEvent.impact || 'unknown')?.label || 'Unknown';
      return `${name} • ${currency} • ${impactLabel}`;
    }

    // Custom recurring events
    if (safeEvent.recurrence?.enabled) {
      const interval = safeEvent.recurrence.interval || '1D';
      const intervalLabels = {
        '1h': 'hourly',
        '4h': 'every 4 hours',
        '1D': 'daily',
        '1W': 'weekly',
        '1M': 'monthly',
        '1Q': 'quarterly',
        '1Y': 'yearly'
      };
      const intervalLabel = intervalLabels[interval] || interval;
      return `${safeEvent.name || safeEvent.title || 'Custom event'} (${intervalLabel})`;
    }

    return '';
  }, [safeEvent]);

  const showReminderDebug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('debugReminders') === '1') return true;
    return window.localStorage.getItem('t2t_debug_reminders') === '1';
  }, []);

  if (!currentEvent) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      TransitionComponent={SlideTransition}
      TransitionProps={{ timeout: ANIMATION_DURATION.slide }}
      sx={{ zIndex: 12001 }}
      slotProps={{
        backdrop: { sx: BACKDROP_OVERLAY_SX },
      }}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 2,
          height: fullScreen ? '100vh' : 'auto',
          maxHeight: fullScreen ? '100vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Dialog Title */}
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: { xs: 2, sm: 3 },
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.125rem', sm: '1.25rem' },
              lineHeight: 1.3,
              mb: 1,
            }}
          >
            {currentEvent.Name || t('events:event')}
          </Typography>

          {/* Date and Time */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1.5,
              opacity: 0.95,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <EventIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {new Date(currentEvent.date).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {new Date(currentEvent.time || currentEvent.date).toLocaleTimeString(
                  i18n.language === 'es' ? 'es-ES' : i18n.language === 'fr' ? 'fr-FR' : 'en-US',
                  { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: timezone }
                )}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          {/* Notes Button */}
          {onOpenNotes && (
            <MuiTooltip
              title={isEventNotesLoading(currentEvent) ? t('events:actions.notesLoading') : (hasEventNotes(currentEvent) ? t('events:actions.viewNotes') : t('events:actions.addNote'))}
              arrow
              placement="bottom"
            >
              <span>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNotes(currentEvent);
                  }}
                  disabled={isEventNotesLoading(currentEvent)}
                  sx={{
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.white, 0.1),
                    },
                    '&.Mui-disabled': {
                      color: alpha(theme.palette.common.white, 0.5),
                    },
                  }}
                  size="small"
                >
                  {isEventNotesLoading(currentEvent) ? (
                    <CircularProgress size={18} thickness={5} sx={{ color: 'primary.contrastText' }} />
                  ) : hasEventNotes(currentEvent) ? (
                    <NoteAlt />
                  ) : (
                    <NoteAltOutlined />
                  )}
                </IconButton>
              </span>
            </MuiTooltip>
          )}

          {/* Favorite Button */}
          {onToggleFavorite && (
            <MuiTooltip
              title={favoritesLoading ? t('events:actions.favoritesLoading') : (isFavoriteEvent(currentEvent) ? t('events:actions.removeFromFavorites') : t('events:actions.saveToFavorites'))}
              arrow
              placement="bottom"
            >
              <span>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    logFavoriteDebug('modal:click', {
                      id: currentEvent?.id,
                      name: currentEvent?.name || currentEvent?.Name,
                      currency: currentEvent?.currency || currentEvent?.Currency,
                    });
                    onToggleFavorite(currentEvent);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    logFavoriteDebug('modal:touch', { name: currentEvent?.name || currentEvent?.Name });
                    if (onToggleFavorite) onToggleFavorite(currentEvent);
                  }}
                  disabled={favoritesLoading || isFavoritePending(currentEvent)}
                  sx={{
                    color: isFavoriteEvent(currentEvent) ? theme.palette.common.white : 'primary.contrastText',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.white, 0.1),
                    },
                    '&.Mui-disabled': {
                      color: alpha(theme.palette.common.white, 0.5),
                    },
                  }}
                  size="small"
                >
                  {isFavoritePending(currentEvent) ? (
                    <CircularProgress size={18} thickness={5} sx={{ color: 'primary.contrastText' }} />
                  ) : isFavoriteEvent(currentEvent) ? (
                    <Favorite />
                  ) : (
                    <FavoriteBorderOutlined />
                  )}
                </IconButton>
              </span>
            </MuiTooltip>
          )}

          {/* Edit Button (Custom Events Only) */}
          {currentEvent.isCustom && onEditCustomEvent && (
            <MuiTooltip title={t('events:modal.actions.editReminder')} arrow placement="bottom">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCustomEvent(currentEvent);
                }}
                sx={{
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.1),
                  },
                }}
                size="small"
              >
                <EditRoundedIcon />
              </IconButton>
            </MuiTooltip>
          )}

          {/* Close Button */}
          <IconButton
            onClick={handleClose}
            sx={{
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: alpha(theme.palette.common.white, 0.1),
              },
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Dialog Content - BEP: Viewport height aware scrolling on mobile */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          pt: { xs: 3, sm: 4 },
          bgcolor: 'background.default',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(60,77,99,0.32) transparent',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(60,77,99,0.32)',
            borderRadius: 999,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(60,77,99,0.45)',
          },
        }}
      >
        {loading ? (
          <ModalSkeleton />
        ) : currentEvent.isCustom ? (
          /* Custom Event Content */
          <Stack spacing={3} sx={{ mt: { xs: 2, sm: 3 } }}>
            {/* Metadata Section - Impact, Type, Appearance */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack spacing={2.5}>
                  {/* Impact & Type Row */}
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Impact Badge - Hidden for custom events with Unknown impact */}
                    {customImpactValue && customImpactValue !== 'unknown' && (
                      <ImpactBadge
                        impact={customImpactValue}
                        label={t(`events:impacts.${customImpactValue === 'strong' ? 'highImpact' : customImpactValue === 'moderate' ? 'mediumImpact' : customImpactValue === 'weak' ? 'lowImpact' : 'unknown'}`)}
                        description={t(`events:impacts.${customImpactValue === 'strong' ? 'highImpactDesc' : customImpactValue === 'moderate' ? 'mediumImpactDesc' : customImpactValue === 'weak' ? 'lowImpactDesc' : 'unknownDesc'}`)}
                      />
                    )}
                    {/* Custom Event Type Chip */}
                    <Chip
                      label={t('events:actions.customEventChip')}
                      size="medium"
                      sx={{
                        bgcolor: 'primary.dark',
                        color: theme.palette.common.white,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        height: 28,
                        '& .MuiChip-label': {
                          px: 1.5,
                        },
                      }}
                    />
                  </Box>

                  {/* Appearance - Icon & Color */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                      {t('events:modal.custom.appearance')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      {/* Custom Icon */}
                      {currentEvent.customIcon && (() => {
                        const IconComponent = getCustomEventIconComponent(currentEvent.customIcon);
                        return (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              px: 1.5,
                              py: 0.75,
                              borderRadius: 1.5,
                              bgcolor: 'background.default',
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <IconComponent sx={{ fontSize: 24, color: 'text.primary' }} />
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              Icon
                            </Typography>
                          </Box>
                        );
                      })()}
                      {/* Custom Color */}
                      {currentEvent.customColor && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1.5,
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: 1,
                              bgcolor: currentEvent.customColor,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            Color
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Custom Event Details */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack spacing={2.5}>
                  {/* Description */}
                  {currentEvent.description && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                        {t('events:modal.custom.notes')}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {currentEvent.description}
                      </Typography>
                    </Box>
                  )}

                  {/* Timezone */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                      {t('events:modal.custom.timezone')}
                    </Typography>
                    <Chip
                      label={currentEvent.timezone?.replace(/_/g, ' ') || 'UTC'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  {/* Show on Clock */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                      {t('common:visibility')}
                    </Typography>
                    <Chip
                      label={currentEvent.showOnClock !== false ? t('events:modal.custom.visibleOnClock') : t('events:modal.custom.hiddenFromClock')}
                      size="small"
                      color={currentEvent.showOnClock !== false ? 'success' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  {/* Reminders */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                      {t('events:actions.reminders')}
                    </Typography>
                    <RemindersEditor2
                      reminders={reminderBaseline}
                      savedCount={reminderBaseline.length}
                      reminderScopes={reminderScopes}
                      seriesKey={null}
                      seriesLabel={null}
                      recurrence={currentEvent.recurrence}
                      timezone={reminderTimezone}
                      disabled={remindersDisabled || reminderLoading}
                      showPolicyInfo={true}
                      onSaveReminder={handleSaveReminder}
                      onDeleteReminder={handleDeleteReminder}
                      onRequestBrowserPermission={requestBrowserPermission}
                      onRequestPushPermission={requestPushPermission}
                      onUnsavedChanges={setHasUnsavedChanges}
                    />
                    {remindersDisabled && (
                      <Alert severity="info" sx={{ borderRadius: 2, mt: 1.5 }}>
                        {t('events:modal.reminders.signInRequired')}
                      </Alert>
                    )}
                    {!remindersDisabled && !reminderBase && (
                      <Alert severity="info" sx={{ borderRadius: 2, mt: 1.5 }}>
                        {t('events:modal.reminders.detailsLoading')}
                      </Alert>
                    )}
                    {reminderError && (
                      <Alert severity="error" sx={{ borderRadius: 2, mt: 1.5 }}>
                        {reminderError}
                      </Alert>
                    )}
                    {reminderSuccessMessage && (
                      <Alert severity="success" sx={{ borderRadius: 2, mt: 1.5 }}>
                        {reminderSuccessMessage}
                      </Alert>
                    )}
                    {showReminderDebug && (
                      <Alert severity="info" sx={{ borderRadius: 2, mt: 1.5 }}>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
                          {t('events:modal.debug.reminderDebug')}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Event key: {reminderBase?.eventKey || '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Series key: {reminderBase?.seriesKey || '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Doc id: {reminderDoc?.id || reminderListMatch?.id || '—'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Baseline count: {reminderBaseline.length}
                        </Typography>
                        {reminderDebugInfo && (
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            Last: {reminderDebugInfo.step} @ {reminderDebugInfo.at}
                          </Typography>
                        )}
                      </Alert>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        ) : (
          /* Economic Event Content */
          <Stack spacing={3} sx={{ mt: { xs: 2, sm: 3 } }}>
            {/* Metadata Section */}
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack spacing={2}>
                  {/* Impact and Currency Row */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    {(() => {
                      const config = getImpactConfig(currentEvent.strength || currentEvent.impact);
                      return (
                        <ImpactBadge
                          impact={currentEvent.strength || currentEvent.impact}
                          label={config.labelKey ? t(config.labelKey) : undefined}
                          description={config.descriptionKey ? t(config.descriptionKey) : undefined}
                        />
                      );
                    })()}

                    {currentEvent.currency && (
                      <CurrencyFlag
                        currency={currentEvent.currency}
                        affectsMessage={t('events:tooltips.currencyAffects')}
                        impactMessage={t('events:tooltips.eventImpactsCurrency', { currency: currentEvent.currency })}
                      />
                    )}

                    {currentEvent.category && (
                      <MuiTooltip
                        title={t('events:messages.categoryTooltip', { category: currentEvent.category })}
                        arrow
                        placement="top"
                        enterTouchDelay={100}
                        leaveTouchDelay={3000}
                        disableFocusListener={false}
                        disableTouchListener={false}
                        disableHoverListener={false}
                        disableInteractive={false}
                        PopperProps={{
                          sx: {
                            '& .MuiTooltip-tooltip': {
                              bgcolor: 'background.paper',
                              color: 'text.primary',
                              boxShadow: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              fontSize: '0.8125rem',
                              lineHeight: 1.5,
                            },
                            '& .MuiTooltip-arrow': {
                              color: 'background.paper',
                              '&::before': {
                                border: '1px solid',
                                borderColor: 'divider',
                              },
                            },
                          },
                        }}
                      >
                        <Chip
                          label={currentEvent.category}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            borderColor: 'divider',
                            color: 'text.secondary',
                            cursor: 'help',
                          }}
                        />
                      </MuiTooltip>
                    )}

                    {/* Status Badge */}
                    {currentEvent.status && (
                      <MuiTooltip
                        title={t('events:messages.statusTooltip', { status: currentEvent.status })}
                        arrow
                        placement="top"
                        enterTouchDelay={100}
                        leaveTouchDelay={3000}
                        disableFocusListener={false}
                        disableTouchListener={false}
                        disableHoverListener={false}
                        disableInteractive={false}
                        PopperProps={{
                          sx: {
                            '& .MuiTooltip-tooltip': {
                              bgcolor: 'background.paper',
                              color: 'text.primary',
                              boxShadow: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              fontSize: '0.8125rem',
                              lineHeight: 1.5,
                            },
                            '& .MuiTooltip-arrow': {
                              color: 'background.paper',
                              '&::before': {
                                border: '1px solid',
                                borderColor: 'divider',
                              },
                            },
                          },
                        }}
                      >
                        <Chip
                          label={currentEvent.status.charAt(0).toUpperCase() + currentEvent.status.slice(1)}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor:
                              currentEvent.status === 'released' ? alpha(theme.palette.success.main, 0.12) :
                                currentEvent.status === 'revised' ? alpha(theme.palette.warning.main, 0.12) :
                                  currentEvent.status === 'cancelled' ? alpha(theme.palette.error.main, 0.12) :
                                    'action.hover',
                            color:
                              currentEvent.status === 'released' ? 'success.dark' :
                                currentEvent.status === 'revised' ? 'warning.dark' :
                                  currentEvent.status === 'cancelled' ? 'error.dark' :
                                    'text.secondary',
                            cursor: 'help',
                          }}
                        />
                      </MuiTooltip>
                    )}

                    {isNow && !currentEvent.status && (
                      <MuiTooltip
                        title={t('events:messages.nowTooltip')}
                        arrow
                        placement="top"
                        enterTouchDelay={100}
                        leaveTouchDelay={3000}
                        disableFocusListener={false}
                        disableTouchListener={false}
                        disableHoverListener={false}
                        disableInteractive={false}
                        PopperProps={{
                          sx: {
                            '& .MuiTooltip-tooltip': {
                              bgcolor: 'background.paper',
                              color: 'text.primary',
                              boxShadow: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              fontSize: '0.8125rem',
                              lineHeight: 1.5,
                            },
                            '& .MuiTooltip-arrow': {
                              color: 'background.paper',
                              '&::before': {
                                border: '1px solid',
                                borderColor: 'divider',
                              },
                            },
                          },
                        }}
                      >
                        <Chip
                          label="NOW"
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            bgcolor: alpha(theme.palette.info.main, 0.15),
                            color: 'info.dark',
                            border: '1px solid',
                            borderColor: 'info.dark',
                            cursor: 'help',
                            animation: 'pulse 2s ease-in-out infinite',
                            '@keyframes pulse': {
                              '0%, 100%': {
                                opacity: 1,
                              },
                              '50%': {
                                opacity: 0.7,
                              },
                            },
                          }}
                        />
                      </MuiTooltip>
                    )}

                    {isNext && !currentEvent.status && !isNow && (
                      <MuiTooltip
                        title={t('events:messages.nextTooltip', { countdown: nextCountdown || 'calculating...' })}
                        arrow
                        placement="top"
                        enterTouchDelay={100}
                        leaveTouchDelay={3000}
                        disableFocusListener={false}
                        disableTouchListener={false}
                        disableHoverListener={false}
                        disableInteractive={false}
                        PopperProps={{
                          sx: {
                            '& .MuiTooltip-tooltip': {
                              bgcolor: 'background.paper',
                              color: 'text.primary',
                              boxShadow: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              fontSize: '0.8125rem',
                              lineHeight: 1.5,
                            },
                            '& .MuiTooltip-arrow': {
                              color: 'background.paper',
                              '&::before': {
                                border: '1px solid',
                                borderColor: 'divider',
                              },
                            },
                          },
                        }}
                      >
                        <Chip
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTimeIcon sx={{ fontSize: 14 }} />
                              <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                                {nextCountdown || 'Next'}
                              </Typography>
                            </Box>
                          }
                          size="small"
                          sx={{
                            height: 24,
                            fontWeight: 600,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: 'primary.main',
                            border: '1px solid',
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                            cursor: 'help',
                            '& .MuiChip-label': { px: 1 },
                          }}
                        />
                      </MuiTooltip>
                    )}

                    {isPastNowWindow && !currentEvent.status && (
                      <MuiTooltip
                        title="This event has already occurred - data reflects actual results"
                        arrow
                        placement="top"
                        enterTouchDelay={100}
                        leaveTouchDelay={3000}
                        disableFocusListener={false}
                        disableTouchListener={false}
                        disableHoverListener={false}
                        disableInteractive={false}
                        PopperProps={{
                          sx: {
                            '& .MuiTooltip-tooltip': {
                              bgcolor: 'background.paper',
                              color: 'text.primary',
                              boxShadow: 3,
                              border: '1px solid',
                              borderColor: 'divider',
                              fontSize: '0.8125rem',
                              lineHeight: 1.5,
                            },
                            '& .MuiTooltip-arrow': {
                              color: 'background.paper',
                              '&::before': {
                                border: '1px solid',
                                borderColor: 'divider',
                              },
                            },
                          },
                        }}
                      >
                        <Chip
                          label={t('events:modal.economic.pastEvent')}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: 'action.hover',
                            color: 'text.secondary',
                            cursor: 'help',
                          }}
                        />
                      </MuiTooltip>
                    )}
                  </Box>

                  {/* Data Source Information */}
                  {(currentEvent.winnerSource || currentEvent.sourceKey || currentEvent.sources) && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      {(currentEvent.winnerSource || currentEvent.sourceKey) && (
                        <MuiTooltip
                          title={t('events:messages.primarySource')}
                          arrow
                          placement="top"
                          enterTouchDelay={100}
                          leaveTouchDelay={3000}
                          PopperProps={{
                            sx: {
                              '& .MuiTooltip-tooltip': {
                                bgcolor: 'background.paper',
                                color: 'text.primary',
                                boxShadow: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                fontSize: '0.8125rem',
                                lineHeight: 1.5,
                              },
                              '& .MuiTooltip-arrow': {
                                color: 'background.paper',
                                '&::before': {
                                  border: '1px solid',
                                  borderColor: 'divider',
                                },
                              },
                            },
                          }}
                        >
                          <Chip
                            label={`Source: ${(currentEvent.winnerSource || currentEvent.sourceKey).toUpperCase()}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 24,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              borderColor: 'primary.main',
                              color: 'primary.main',
                              cursor: 'help',
                            }}
                          />
                        </MuiTooltip>
                      )}

                      {currentEvent.sources && Object.keys(currentEvent.sources).length > 1 && (
                        <MuiTooltip
                          title={t('events:messages.availableSources', { count: Object.keys(currentEvent.sources).length, sources: Object.keys(currentEvent.sources).join(', ') })}
                          arrow
                          placement="top"
                          enterTouchDelay={100}
                          leaveTouchDelay={3000}
                          PopperProps={{
                            sx: {
                              '& .MuiTooltip-tooltip': {
                                bgcolor: 'background.paper',
                                color: 'text.primary',
                                boxShadow: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                fontSize: '0.8125rem',
                                lineHeight: 1.5,
                              },
                              '& .MuiTooltip-arrow': {
                                color: 'background.paper',
                                '&::before': {
                                  border: '1px solid',
                                  borderColor: 'divider',
                                },
                              },
                            },
                          }}
                        >
                          <Chip
                            label={`${Object.keys(currentEvent.sources).length} Sources`}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: alpha(theme.palette.info.main, 0.12),
                              color: 'info.dark',
                              cursor: 'help',
                            }}
                          />
                        </MuiTooltip>
                      )}

                      {currentEvent.qualityScore && (
                        <MuiTooltip
                          title={t('events:messages.qualityScore', { score: currentEvent.qualityScore })}
                          arrow
                          placement="top"
                          enterTouchDelay={100}
                          leaveTouchDelay={3000}
                          PopperProps={{
                            sx: {
                              '& .MuiTooltip-tooltip': {
                                bgcolor: 'background.paper',
                                color: 'text.primary',
                                boxShadow: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                fontSize: '0.8125rem',
                                lineHeight: 1.5,
                              },
                              '& .MuiTooltip-arrow': {
                                color: 'background.paper',
                                '&::before': {
                                  border: '1px solid',
                                  borderColor: 'divider',
                                },
                              },
                            },
                          }}
                        >
                          <Chip
                            label={`Quality: ${currentEvent.qualityScore}`}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: alpha(theme.palette.success.main, 0.12),
                              color: 'success.dark',
                              cursor: 'help',
                            }}
                          />
                        </MuiTooltip>
                      )}
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Data Values Section */}
            {(currentEvent.actual !== '-' || currentEvent.forecast !== '-' || currentEvent.previous !== '-') && (
              <Card
                elevation={0}
                sx={{
                  border: '2px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  position: 'relative',
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  {/* Header with Title and Success Indicator */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="primary"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      📊 {t('events:actions.dataValues')}
                      <EnhancedTooltip title="Real-time economic data: Actual results vs market forecasts and previous values">
                        <HelpOutlineIcon
                          sx={{
                            fontSize: { xs: 14, sm: 16 },
                            color: 'primary.main',
                            opacity: 0.7,
                            cursor: 'help',
                          }}
                        />
                      </EnhancedTooltip>
                    </Typography>

                    <Fade in={refreshSuccess} timeout={300}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircleIcon
                          sx={{
                            fontSize: { xs: 16, sm: 18 },
                            color: 'success.main',
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'success.main',
                            fontWeight: 600,
                            fontSize: { xs: '0.65rem', sm: '0.7rem' },
                          }}
                        >
                          {t('events:actions.updated')}
                        </Typography>
                      </Box>
                    </Fade>
                  </Box>

                  {/* Refresh Icon - Top Right Corner (MUI Best Practice) */}
                  <MuiTooltip title={t('events:actions.refreshData')} arrow placement="left">
                    <IconButton
                      size="small"
                      onClick={handleRefreshEvent}
                      disabled={refreshingEvent}
                      sx={{
                        position: 'absolute',
                        top: { xs: 8, sm: 12 },
                        right: { xs: 8, sm: 12 },
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                        '&.Mui-disabled': {
                          color: 'action.disabled',
                        },
                      }}
                    >
                      <RefreshIcon
                        sx={{
                          fontSize: { xs: 20, sm: 22 },
                          animation: refreshingEvent ? 'spin 1s linear infinite' : 'none',
                          '@keyframes spin': {
                            '0%': {
                              transform: 'rotate(0deg)',
                            },
                            '100%': {
                              transform: 'rotate(360deg)',
                            },
                          },
                        }}
                      />
                    </IconButton>
                  </MuiTooltip>

                  {/* Data Values Grid - 3 columns on all screen sizes */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: { xs: 1.5, sm: 3 },
                    }}
                  >
                    <DataValueBox
                      label={t('events:modal.economic.actual')}
                      value={actualValue}
                      isPrimary={true}
                      loading={refreshingEvent}
                    />
                    <DataValueBox
                      label={t('events:modal.economic.forecast')}
                      value={currentEvent.forecast === '-' ? '—' : currentEvent.forecast}
                      loading={refreshingEvent}
                    />
                    <DataValueBox
                      label={t('events:modal.economic.previous')}
                      value={currentEvent.previous === '-' ? '—' : currentEvent.previous}
                      loading={refreshingEvent}
                    />
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Description Section */}
            {description?.description && (
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="subtitle2"
                    color="primary"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      mb: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    <InfoOutlinedIcon sx={{ fontSize: 18 }} />
                    {t('events:modal.economic.aboutTitle')}
                    <EnhancedTooltip title={t('events:tooltips.aboutDescription')}>
                      <HelpOutlineIcon
                        sx={{
                          fontSize: { xs: 14, sm: 16 },
                          color: 'primary.main',
                          opacity: 0.7,
                          cursor: 'help',
                        }}
                      />
                    </EnhancedTooltip>
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      lineHeight: 1.7,
                    }}
                  >
                    {description.description}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Trading Implication Section */}
            {description?.tradingImplication && (
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: alpha(theme.palette.success.main, 0.3),
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.05),
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="subtitle2"
                    color="success.main"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      mb: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    💡 {t('events:modal.economic.tradingImplicationTitle')}
                    <EnhancedTooltip title={t('events:tooltips.tradingImplication')}>
                      <HelpOutlineIcon
                        sx={{
                          fontSize: { xs: 14, sm: 16 },
                          color: 'success.main',
                          opacity: 0.7,
                          cursor: 'help',
                        }}
                      />
                    </EnhancedTooltip>
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      lineHeight: 1.7,
                    }}
                  >
                    {description.tradingImplication}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Key Thresholds Section */}
            {description?.keyThresholds && Object.keys(description.keyThresholds).length > 0 && (
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography
                    variant="subtitle2"
                    color="warning.main"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      mb: 2,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                    }}
                  >
                    📊 {t('events:modal.economic.keyThresholdsTitle')}
                    <EnhancedTooltip title={t('events:tooltips.keyThresholds')}>
                      <HelpOutlineIcon
                        sx={{
                          fontSize: { xs: 14, sm: 16 },
                          color: 'warning.main',
                          opacity: 0.7,
                          cursor: 'help',
                        }}
                      />
                    </EnhancedTooltip>
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                      gap: 2,
                    }}
                  >
                    {Object.entries(description.keyThresholds).map(([key, value]) => (
                      <Box
                        key={key}
                        sx={{
                          p: 1.5,
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.7rem',
                            textTransform: 'capitalize',
                            fontWeight: 600,
                            display: 'block',
                            mb: 0.5,
                          }}
                        >
                          {key}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                            fontWeight: 700,
                            color: 'text.primary',
                          }}
                        >
                          {value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Frequency and Source Section */}
            {(description?.frequency || description?.source) && (
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: description?.frequency && description?.source ? '1fr 1fr' : '1fr' },
                      gap: 2,
                    }}
                  >
                    {description?.frequency && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.5,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          {t('events:modal.economic.frequency')}
                          <EnhancedTooltip title={t('events:tooltips.frequency')}>
                            <HelpOutlineIcon
                              sx={{
                                fontSize: 12,
                                color: 'text.secondary',
                                opacity: 0.6,
                                cursor: 'help',
                              }}
                            />
                          </EnhancedTooltip>
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                            fontWeight: 600,
                            color: 'text.primary',
                          }}
                        >
                          {description.frequency}
                        </Typography>
                      </Box>
                    )}
                    {description?.source && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.5,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          {t('events:modal.economic.source')}
                          <EnhancedTooltip title={t('events:tooltips.source')}>
                            <HelpOutlineIcon
                              sx={{
                                fontSize: 12,
                                color: 'text.secondary',
                                opacity: 0.6,
                                cursor: 'help',
                              }}
                            />
                          </EnhancedTooltip>
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                            fontWeight: 600,
                            color: 'text.primary',
                          }}
                        >
                          {description.source}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Outcome Section */}
            {(description?.outcome || currentEvent.outcome || currentEvent.quality) && (
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Stack spacing={2}>
                    {(description?.outcome || currentEvent.outcome) && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                        }}
                      >
                        {getOutcomeIcon(description?.outcome || currentEvent.outcome)}
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5,
                            }}
                          >
                            {t('events:modal.economic.outcome')}
                            <EnhancedTooltip title={t('events:tooltips.outcome')}>
                              <HelpOutlineIcon
                                sx={{
                                  fontSize: 12,
                                  color: 'text.secondary',
                                  opacity: 0.6,
                                  cursor: 'help',
                                }}
                              />
                            </EnhancedTooltip>
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                              fontWeight: 600,
                            }}
                          >
                            {description?.outcome || currentEvent.outcome}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {currentEvent.quality && (
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.5,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          Data Quality
                          <EnhancedTooltip title="Assessment of data reliability and accuracy">
                            <HelpOutlineIcon
                              sx={{
                                fontSize: 12,
                                color: 'text.secondary',
                                opacity: 0.6,
                                cursor: 'help',
                              }}
                            />
                          </EnhancedTooltip>
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                            fontWeight: 600,
                            color: 'text.primary',
                          }}
                        >
                          {currentEvent.quality}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Reminders */}
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {t('events:actions.reminders')}
                  </Typography>
                  <RemindersEditor2
                    reminders={reminderBaseline}
                    savedCount={reminderBaseline.length}
                    reminderScopes={reminderScopes}
                    seriesKey={seriesKey}
                    seriesLabel={seriesLabel}
                    recurrence={currentEvent.recurrence}
                    timezone={reminderTimezone}
                    disabled={remindersDisabled || reminderLoading}
                    showPolicyInfo={true}
                    onSaveReminder={handleSaveReminder}
                    onDeleteReminder={handleDeleteReminder}
                    onRequestBrowserPermission={requestBrowserPermission}
                    onRequestPushPermission={requestPushPermission}
                    onUnsavedChanges={setHasUnsavedChanges}
                  />
                  {remindersDisabled && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      {t('events:modal.reminders.signInRequired')}
                    </Alert>
                  )}
                  {!remindersDisabled && !reminderBase && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      {t('events:modal.reminders.detailsLoading')}
                    </Alert>
                  )}
                  {reminderError && (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      {reminderError}
                    </Alert>
                  )}
                  {reminderSuccessMessage && (
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                      {reminderSuccessMessage}
                    </Alert>
                  )}
                  {showReminderDebug && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
                        {t('events:modal.debug.reminderDebug')}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {t('events:modal.debug.eventKey')} {reminderBase?.eventKey || '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {t('events:modal.debug.seriesKey')} {reminderBase?.seriesKey || '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {t('events:modal.debug.docId')} {reminderDoc?.id || reminderListMatch?.id || '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {t('events:modal.debug.baselineCount')} {reminderBaseline.length}
                      </Typography>
                      {reminderDebugInfo && (
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          {t('events:modal.debug.last')} {reminderDebugInfo.step} @ {reminderDebugInfo.at}
                        </Typography>
                      )}
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        )}
      </DialogContent>

      {/* Dialog Actions - BEP: Fixed footer positioned above mobile navbar */}
      <DialogActions
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          flexShrink: 0,
          position: fullScreen ? 'relative' : 'static',
        }}
      >
        {/* Event Page - Left Side with Link to SEO Event Page */}
        {/* Only show button for canonical economic events with loaded descriptions */}
        {hasEventPage(currentEvent, description) && (
          <Button
            component="a"
            href={`/events/${getEventPageId(description)}${i18n.language !== 'en' ? `?lang=${i18n.language}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="small"
            startIcon={<OpenInNewIcon sx={{ fontSize: '1rem' }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 2,
            }}
          >
            {t('eventPage.openPage', 'Open Event Page')}
          </Button>
        )}

        {/* Close Button - Right Side */}
        <Button
          onClick={handleClose}
          variant="contained"
          fullWidth={isMobile && !currentEvent.id}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            ml: 'auto',
          }}
        >
          {t('events:actions.closeModal')}
        </Button>
      </DialogActions>

      {/* Unsaved Changes Confirmation */}
      <UnsavedChangesModal
        open={showCloseConfirmation}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        message="You have unsaved changes to reminders. If you close now, your changes will be lost."
        zIndex={12002}
      />
    </Dialog>
  );
}

EventModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  event: PropTypes.object,
  timezone: PropTypes.string,
  isFavoriteEvent: PropTypes.func,
  onToggleFavorite: PropTypes.func,
  isFavoritePending: PropTypes.func,
  favoritesLoading: PropTypes.bool,
  hasEventNotes: PropTypes.func,
  onOpenNotes: PropTypes.func,
  isEventNotesLoading: PropTypes.func,
  onEditCustomEvent: PropTypes.func,
};

export default EventModal;
