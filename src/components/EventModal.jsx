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
 * v1.11.4 - 2026-01-22 - BUGFIX: Remove unused imports and variables; add PropTypes validation to all components.
 * v1.11.3 - 2026-01-22 - BEP: Normalize custom impact values (numeric/string) so /clock modal renders correct impact chip instead of Unknown.
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

import React, { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { getEventDescription } from '../services/economicEventsService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatTime, formatDate } from '../utils/dateUtils';
import { resolveImpactMeta } from '../utils/newsApi';
import { getCustomEventIconComponent } from '../utils/customEventStyle';
import {
  formatCountdownHMS,
  NOW_WINDOW_MS,
  getEventEpochMs,
  getNowEpochMs,
  computeNowNextState
} from '../utils/eventTimeEngine';

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
    label: 'High Impact',
    description: 'Major market-moving event that typically causes significant volatility and price action'
  },
  moderate: {
    icon: '!!',
    label: 'Medium Impact',
    description: 'Notable event that can influence market direction with moderate price movements'
  },
  weak: {
    icon: '!',
    label: 'Low Impact',
    description: 'Minor event with limited market impact and minimal expected volatility'
  },
  'not-loaded': {
    icon: '?',
    label: 'Data Not Loaded',
    description: 'Impact data not yet available; will update when feed loads'
  },
  'non-economic': {
    icon: '~',
    label: 'Non-Economic',
    description: 'Non-economic event or announcement with indirect market influence'
  },
  unknown: {
    icon: '?',
    label: 'Unknown',
    description: 'Impact level not yet classified or unavailable'
  },
};

/**
 * Animation durations for consistent UX
 */
const ANIMATION_DURATION = {
  slide: 300,
  fade: 200,
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
    label: base.label || meta.label,
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
const ImpactBadge = memo(({ impact }) => {
  const config = getImpactConfig(impact);

  return (
    <MuiTooltip
      title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            {config.label}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8125rem', lineHeight: 1.4 }}>
            {config.description}
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
              {config.label}
            </Box>
          </Box>
        }
        size="medium"
        sx={{
          minWidth: 48,
          height: 28,
          bgcolor: config.color,
          color: 'white',
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
};

/**
 * Currency Flag Component
 */
const CurrencyFlag = memo(({ currency }) => {
  const countryCode = getCurrencyFlag(currency);
  const currencyName = CURRENCY_NAMES[currency] || currency;

  if (!countryCode) {
    return (
      <MuiTooltip
        title={`${currencyName} - Economic data affects this currency`}
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
            This event impacts {currency} valuation
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

  // State
  const [description, setDescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshingEvent, setRefreshingEvent] = useState(false);
  const [refreshedEvent, setRefreshedEvent] = useState(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());

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

      // Fetch description
      getEventDescription(event.Name, event.category)
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
  }, [open, event]);

  // Function to refresh event data from Firestore
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

  if (!event) return null;

  // Use refreshed event data if available, otherwise use original event
  const currentEvent = refreshedEvent || event;

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

  // Calculate countdown for NEXT badge using absolute epoch comparison
  const nextCountdown = isNext && eventEpochMs !== null
    ? formatCountdownHMS(Math.max(0, eventEpochMs - countdownNow))
    : null;

  // Determine actual value display
  let actualValue;
  if (isFutureEvent) {
    actualValue = '—';
  } else {
    const hasValidActual = currentEvent.actual &&
      currentEvent.actual !== '-' &&
      currentEvent.actual !== '' &&
      currentEvent.actual !== '0' &&
      currentEvent.actual !== 0;
    actualValue = hasValidActual ? currentEvent.actual : '—';
  }

  const customImpactValue = normalizeCustomImpact(
    currentEvent?.impact
    || currentEvent?._displayCache?.strengthValue
    || currentEvent?.strength
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          maxHeight: fullScreen ? '100vh' : '90vh',
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
            {currentEvent.Name || 'Economic Event'}
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
                {formatDate(currentEvent.date, timezone)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                {currentEvent.timeLabel || formatTime(currentEvent.time || currentEvent.date, timezone)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
          {/* Notes Button */}
          {onOpenNotes && (
            <MuiTooltip
              title={isEventNotesLoading(currentEvent) ? 'Loading notes...' : (hasEventNotes(currentEvent) ? 'View notes' : 'Add note')}
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
                      bgcolor: alpha('#fff', 0.1),
                    },
                    '&.Mui-disabled': {
                      color: alpha('#fff', 0.5),
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
              title={favoritesLoading ? 'Loading favorites...' : (isFavoriteEvent(currentEvent) ? 'Remove from favorites' : 'Save to favorites')}
              arrow
              placement="bottom"
            >
              <span>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(currentEvent);
                  }}
                  disabled={favoritesLoading || isFavoritePending(currentEvent)}
                  sx={{
                    color: isFavoriteEvent(currentEvent) ? '#fff' : 'primary.contrastText',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.1),
                    },
                    '&.Mui-disabled': {
                      color: alpha('#fff', 0.5),
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
            <MuiTooltip title="Edit reminder" arrow placement="bottom">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onEditCustomEvent(currentEvent);
                }}
                sx={{
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.1),
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
            onClick={onClose}
            sx={{
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: alpha('#fff', 0.1),
              },
            }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          pt: { xs: 3, sm: 4 },
          bgcolor: 'background.default',
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
                      <ImpactBadge impact={customImpactValue} />
                    )}
                    {/* Custom Event Type Chip */}
                    <Chip
                      label="Custom event"
                      size="medium"
                      sx={{
                        bgcolor: 'primary.dark',
                        color: '#ffffff',
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
                      Appearance
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
                        Notes
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {currentEvent.description}
                      </Typography>
                    </Box>
                  )}

                  {/* Timezone */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                      Timezone
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
                      Visibility
                    </Typography>
                    <Chip
                      label={currentEvent.showOnClock !== false ? 'Visible on clock' : 'Hidden from clock'}
                      size="small"
                      color={currentEvent.showOnClock !== false ? 'success' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  {/* Reminders */}
                  {currentEvent.reminders && currentEvent.reminders.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                        Reminders ({currentEvent.reminders.length})
                      </Typography>
                      <Stack spacing={1}>
                        {currentEvent.reminders.map((reminder, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              p: 1.5,
                              bgcolor: 'background.default',
                              borderRadius: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {reminder.minutesBefore} minutes before
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto', flexWrap: 'wrap' }}>
                              {reminder.channels?.inApp && (
                                <Chip label="In-app" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                              )}
                              {reminder.channels?.browser && (
                                <Chip label="Browser" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                              )}
                              {reminder.channels?.push && (
                                <Chip label="Push" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
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
                    <ImpactBadge impact={currentEvent.strength || currentEvent.impact} />

                    {currentEvent.currency && <CurrencyFlag currency={currentEvent.currency} />}

                    {currentEvent.category && (
                      <MuiTooltip
                        title={`Category: ${currentEvent.category} - Event classification for filtering and analysis`}
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
                        title={`Status: ${currentEvent.status} - Current state of the economic event`}
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
                        title="This event is happening NOW - within the 9-minute active window"
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
                        title={`Next event in ${nextCountdown || 'calculating...'}`}
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

                    {isPast && !currentEvent.status && (
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
                          label="Past Event"
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
                          title="Primary data source for this event's values"
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
                          title={`Available from ${Object.keys(currentEvent.sources).length} sources: ${Object.keys(currentEvent.sources).join(', ')}`}
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
                          title={`Data quality score: ${currentEvent.qualityScore}/100 - Higher scores indicate more reliable data`}
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
                      📊 Event Data
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
                          Updated
                        </Typography>
                      </Box>
                    </Fade>
                  </Box>

                  {/* Refresh Icon - Top Right Corner (MUI Best Practice) */}
                  <MuiTooltip title="Refresh event data from Firestore" arrow placement="left">
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
                      label="Actual"
                      value={actualValue}
                      isPrimary={true}
                      loading={refreshingEvent}
                    />
                    <DataValueBox
                      label="Forecast"
                      value={currentEvent.forecast === '-' ? '—' : currentEvent.forecast}
                      loading={refreshingEvent}
                    />
                    <DataValueBox
                      label="Previous"
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
                    About This Event
                    <EnhancedTooltip title="Comprehensive overview of what this economic indicator measures and why it matters">
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
                    💡 Trading Implication
                    <EnhancedTooltip title="How this event typically impacts markets and trading strategies to consider">
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
                    📊 Key Thresholds
                    <EnhancedTooltip title="Critical levels that trigger significant market reactions and volatility">
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
                          Frequency
                          <EnhancedTooltip title="How often this economic indicator is released">
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
                          Source
                          <EnhancedTooltip title="Official organization that publishes this data">
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
                            Outcome
                            <EnhancedTooltip title="Market sentiment and directional bias based on the event result">
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
          </Stack>
        )}
      </DialogContent>

      {/* Dialog Actions */}
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
        }}
      >
        {/* Event ID - Left Side with Copy to Clipboard */}
        {currentEvent.id && (
          <MuiTooltip
            title={copySuccess ? "Copied!" : "Click to copy Event ID"}
            arrow
            placement="top"
          >
            <Box
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(currentEvent.id);
                  setCopySuccess(true);

                  // Reset success state after 2 seconds
                  setTimeout(() => {
                    setCopySuccess(false);
                  }, 2000);
                } catch (error) {
                  console.error('❌ Failed to copy to clipboard:', error);
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                bgcolor: copySuccess
                  ? alpha(theme.palette.success.main, 0.12)
                  : alpha(theme.palette.primary.main, 0.08),
                border: '1px solid',
                borderColor: copySuccess ? 'success.main' : 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: copySuccess
                    ? alpha(theme.palette.success.main, 0.18)
                    : alpha(theme.palette.primary.main, 0.15),
                  borderColor: copySuccess ? 'success.main' : 'primary.main',
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  color: copySuccess ? 'success.main' : 'text.secondary',
                  fontWeight: 600,
                  transition: 'color 0.2s ease',
                }}
              >
                {copySuccess ? '✓ Copied!' : `ID: ${currentEvent.id}`}
              </Typography>
              {!copySuccess && (
                <Box
                  component="svg"
                  sx={{
                    width: 14,
                    height: 14,
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: 2,
                    color: 'text.secondary',
                  }}
                  viewBox="0 0 24 24"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </Box>
              )}
            </Box>
          </MuiTooltip>
        )}

        {/* Close Button - Right Side */}
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth={isMobile && !currentEvent.id}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            ml: 'auto',
          }}
        >
          Close
        </Button>
      </DialogActions>
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
