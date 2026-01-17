/**
 * src/components/EventsTimeline2.jsx
 *
 * Purpose: Enterprise-grade timeline that renders economic events with timezone-aware NOW/NEXT/PAST states,
 * pagination, and rich event details (descriptions, impact, flags, values) for the trading clock experience.
 * Key responsibility: display, group, and style events consistently with the clock overlay, including gray-out
 * for past events in the selected timezone.
 *
 * Changelog:
 * v3.8.5 - 2026-01-16 - Display all-day/tentative time labels for GPT placeholder events.
 * v3.8.4 - 2025-12-18 - Centralize impact colors (low impact yellow #F2C94C, unknown taupe #C7B8A4) to avoid collisions with session and NOW colors across timeline badges.
 * v3.8.3 - 2025-12-17 - Added sticky day chip that pins while scrolling a day (chip only; dividers remain inline) for chat-style day headers.
 * v3.8.2 - 2025-12-16 - Floating scroll action now targets NOW when present (blue/info), otherwise NEXT; avoids misleading "Scroll to Next" during active NOW window.
 * v3.8.1 - 2025-12-15 - CRITICAL FIX: NEXT badge now respects all filters (date range, impacts, currencies) but ignores pagination.
 * v3.8.0 - 2025-12-15 - CRITICAL FIX: Refactored to use shared eventTimeEngine for absolute-epoch-based NOW/NEXT detection and countdown. Eliminates timezone-shifted Date object bugs.
 * v3.7.8 - 2025-12-15 - Fixed NEXT/NOW detection + NEXT badge countdown to use absolute event instants (DST-safe) while preserving timezone-aware display.
 * v3.7.7 - 2025-12-15 - Fixed NEXT countdown to use selected timezone (TimezoneSelector-aware) instead of system-local Date.now().
 * v3.7.6 - 2025-12-15 - Canvas-triggered auto-scroll applies a subtle 6s highlight animation on the targeted timeline event.
 * v3.7.5 - 2025-12-12 - NOW badge gains smooth scale animation for parity with NEXT/clock overlay.
 * v3.7.4 - 2025-12-12 - NEXT badge gets smooth scale animation matching clock overlay NEXT markers.
 * v3.7.3 - 2025-12-12 - Raised NEXT badge positioning slightly for better alignment.
 * v3.7.2 - 2025-12-11 - NEXT badge shows countdown only (no text label) while retaining primary styling.
 * v3.7.1 - 2025-12-11 - NEXT badge uses primary color and displays countdown; removed countdown chip inside cards.
 * v3.7.0 - 2025-12-12 - Added event notes control with loading state and shared badge handling.
 * v3.6.0 - 2025-12-12 - Added favorites heart control with pending/loading states and alias-aware matching.
 * v3.5.2 - 2025-12-12 - UX: Hide event info icon when no description entry exists (economicEventDescriptions) to reduce empty modal opens.
 * v3.5.1 - 2025-12-11 - ENHANCEMENT: Added floating 'Scroll to Next' button with dynamic up/down arrow based on next event position relative to viewport. Auto-hides when near next event.
 * v3.5.0 - 2025-12-11 - ENHANCEMENT: Replaced single-day pagination with expanding/accumulative pagination. Previous/next buttons now expand the timeline instead of replacing content, with enterprise-grade scroll position preservation when loading previous days.
 * v3.4.4 - 2025-12-11 - ENHANCEMENT: Added contextEvents prop for NEXT/NOW detection from unfiltered today+future events; NEXT is now always accurate regardless of date filter selection.
 * v3.4.3 - 2025-12-11 - Fixed NEXT countdown rendering by moving countdown into the card badge and keeping the time chip clean.
 * v3.4.2 - 2025-12-11 - Added countdown label to NEXT chip for parity with table and improved user glanceability.
 * v3.4.1 - 2025-12-09 - Auto-scrolls to bottom when today is finished and no tomorrow data is available; ensures timeline container is scroll-targetable.
 * v3.4.0 - 2025-12-09 - Removed pagination for today's events (always fully visible) and limited pagination to past/future days with token-gated auto-scroll.
 * v3.3.5 - 2025-12-09 - When clicking clock/timeline links, auto-adjust pagination so the targeted event is rendered before scrolling.
 * v3.3.4 - 2025-12-09 - Ensured today's NEXT event stays in view by auto-adjusting pagination window after filters/updates.
 * v3.3.3 - 2025-12-09 - Matched clock overlay gray-out logic (timezone/day-serial) and styling for past events.
 * v3.3.2 - 2025-12-09 - NOW window reduced to 9 minutes to match clock overlay.
 * v3.3.0 - 2025-12-09 - Added blink highlight when auto-scrolling to clicked clock events, including simultaneous releases.
 * v3.2.5 - 2025-12-09 - Exported currency flag helper for shared use (fixes ClockEventsOverlay import error)
 * v3.2.4 - 2025-12-01 - CRITICAL FIX: Added custom memo comparison to TimeChip to force re-render when timezone changes.
 * v3.2.3 - 2025-12-01 - Refactored to use centralized dateUtils.formatTime.
 * v3.2.2 - 2025-12-01 - BUGFIX: EventModal timezone propagation.
 * v3.2.1 - 2025-12-01 - BUGFIX: formatTime handles numeric timestamps from cache.
 * v3.2.0 - 2025-12-01 - Added NOW state (multi-event support) with 5-minute window (later adjusted to 9 minutes).
 * v3.1.0 - 2025-12-01 - Next event tracking via 60s interval (Teams/Outlook pattern).
 * v3.0.0 - 2025-11-30 - Enterprise refactor with performance optimizations.
 */

import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Fade,
  Zoom,
  alpha,
  useTheme,
  useMediaQuery,
  Box,
  Stack,
  Typography,
  Chip,
  Divider,
  Badge,
  Button,
  Card,
  CardContent,
  Skeleton,
  Alert,
  IconButton,
  CircularProgress,
  Fab,
  Menu,
  MenuItem,
} from '@mui/material';
import MuiTooltip from '@mui/material/Tooltip';
import { resolveImpactMeta } from '../utils/newsApi';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import NoteAltOutlinedIcon from '@mui/icons-material/NoteAltOutlined';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import { hasEventDescriptionEntry } from '../services/economicEventsService';
import EventModal from './EventModal';
import { formatTime } from '../utils/dateUtils';
import {
  NOW_WINDOW_MS,
  getEventEpochMs,
  computeNowNextState,
  formatCountdownHMS,
  formatRelativeLabel,
  isPastToday as isPastTodayEngine,
} from '../utils/eventTimeEngine';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

// NOW_WINDOW_MS imported from eventTimeEngine

/**
 * Animation durations for consistent UX
 */
const ANIMATION_DURATION = {
  collapse: 300,
  fade: 200,
  zoom: 150,
  scroll: 300,
};

/**
 * Scroll offset for optimal positioning (px from center)
 */
const SCROLL_OFFSET = 150;

/**
 * Sticky offset for day chips (chat-style pinning)
 */
const STICKY_DAY_CHIP_OFFSET = {
  xs: 8,
  sm: 12,
};

/**
 * Currency to country code mapping for flag icons
 * Comprehensive list of major trading currencies
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
 * Impact level configuration
 * Maps impact strings to visual indicators
 */
const IMPACT_CONFIG = {
  strong: { icon: '!!!', label: 'High Impact' },
  moderate: { icon: '!!', label: 'Medium Impact' },
  weak: { icon: '!', label: 'Low Impact' },
  'not-loaded': { icon: '?', label: 'Data Not Loaded' },
  'non-economic': { icon: '~', label: 'Non-Economic' },
  unknown: { icon: '?', label: 'Unknown' },
};

const SPEECH_TITLE_REGEX = /(speaks|remarks|address|testifies|statement|press conference|hearing|meeting|vote)/i;

const hasMetricValue = (value) => {
  if (value === 0 || value === '0') return true;
  if (value === null || value === undefined) return false;
  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (trimmed === '' || trimmed === '-') return false;
  return true;
};

const isSpeechLikeEvent = (event) => {
  const category = `${event.category || event.Category || event.type || event.Type || event.eventType || event.EventType || ''}`.toLowerCase();
  const name = `${event.name || event.Name || ''}`;
  const categorySpeech = /speech|statement|address|testimony|press conference|hearing|meeting|vote/.test(category);
  const titleSpeech = SPEECH_TITLE_REGEX.test(name);
  const noMetrics = !hasMetricValue(event.actual) && !hasMetricValue(event.forecast) && !hasMetricValue(event.previous);
  return (categorySpeech || titleSpeech) && noMetrics;
};

const getSpeechSummary = (event) => {
  const name = event.name || event.Name || 'Scheduled remarks';
  const desc = event.description || event.Description || event.summary || event.Summary;
  if (desc) return desc;
  return `Scheduled remarks: ${name}`;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get time status (past/upcoming) - timezone-aware
 * Uses absolute epoch comparisons from eventTimeEngine
 * @param {Date|string|number} dateTime - Event date/time
 * @param {string} timezone - IANA timezone
 * @param {number} nowEpochMs - Current time in epoch ms
 * @returns {'past'|'upcoming'|'unknown'} Time status
 */
const getTimeStatus = (dateTime, timezone, nowEpochMs) => {
  if (!dateTime) return 'unknown';

  // Convert event to absolute epoch
  const eventEpochMs = getEventEpochMs({ date: dateTime });
  if (eventEpochMs === null) return 'unknown';

  // Use engine to check if past today
  const isPast = isPastTodayEngine({ eventEpochMs, nowEpochMs, timezone, nowWindowMs: NOW_WINDOW_MS });

  return isPast ? 'past' : 'upcoming';
};

/**
 * Get outcome icon based on event outcome
 * @param {string} outcome - Event outcome text
 * @returns {JSX.Element|null} Icon component
 */
const getOutcomeIcon = (outcome) => {
  if (!outcome) return null;
  const lower = outcome.toLowerCase();

  if (lower.includes('bullish') || lower.includes('positive')) {
    return <TrendingUpIcon sx={{ color: 'success.main', fontSize: 18 }} />;
  }
  if (lower.includes('bearish') || lower.includes('negative')) {
    return <TrendingDownIcon sx={{ color: 'error.main', fontSize: 18 }} />;
  }
  return null;
};

/**
 * Get impact configuration based on impact level
 * @param {string} impact - Impact level string
 * @returns {Object} Impact config with icon, color, label
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

/**
 * Get country code for currency flag
 * @param {string} currency - Currency code
 * @returns {string|null} Country code or null
 */
export const getCurrencyFlag = (currency) => {
  if (!currency) return null;
  return CURRENCY_TO_COUNTRY[currency.toUpperCase()] || null;
};

/**
 * Convert a date/time value into the specified timezone.
 * WARNING: This creates a timezone-shifted Date object whose .getTime() returns WRONG epoch.
 * ONLY use for display/day-serial calculations. NEVER use for countdown math.
 * @deprecated Use eventTimeEngine functions for countdown/comparison logic
 * @param {Date|string|number} value - Date, timestamp, or ISO string
 * @param {string} timezone - IANA timezone
 * @returns {Date|null} Localized Date in the target timezone (SHIFTED - not true instant)
 */
const toTimezoneDate = (value, timezone) => {
  if (!value) return null;
  const dateObj = value instanceof Date ? value : new Date(value);
  return new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
};

/**
 * Normalize a Date to a YYYYMMDD serial for comparisons
 * @param {Date|null} date
 * @returns {number|null}
 */
const getDaySerial = (date) => {
  if (!date) return null;
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
};

/**
 * Normalize date for comparison (removes time component)
 * @param {Date|number} date - Date to normalize (Date object or Unix timestamp)
 * @param {string} timezone - IANA timezone for date normalization
 * @returns {Date} Normalized date
 */
const normalizeDate = (date, timezone) => {
  if (!date) return null;

  // Convert to Date object if it's a Unix timestamp
  const dateObj = typeof date === 'number' ? new Date(date) : new Date(date);

  // Convert to timezone-specific date string, then parse back to Date at midnight
  const dateStr = dateObj.toLocaleDateString('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }); // Returns YYYY-MM-DD format

  return new Date(dateStr + 'T00:00:00');
};

/**
 * Check if two dates are the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day
 */
const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Format time in 24-hour format (timezone-aware)
 * @param {Date|string|number} date - Date object, ISO string, Unix timestamp, or time string
 * @param {string} timezone - IANA timezone (e.g., 'America/New_York')
 * @returns {string} Formatted time (HH:MM)
 */
// formatTime imported from centralized dateUtils

/**
 * Format date for display (EventsTimeline2-specific wrapper)
 * @param {Date|number} date - Date to format (Date object or Unix timestamp)
 * @param {boolean} isToday - Whether this is today
 * @param {string} timezone - IANA timezone (e.g., 'America/New_York')
 * @returns {string} Formatted date
 */
const formatDate = (date, isToday = false, timezone) => {
  if (!date) return '';

  const dateObj = typeof date === 'number' ? new Date(date) : date;

  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  });

  return isToday ? `Today - ${formattedDate}` : formattedDate;
};

/**
 * Day Divider - Separates events by day
 * Memoized to prevent unnecessary re-renders
 */
const DayDivider = memo(({ date, isToday, isFirst, timezone, daySerial, registerDayMarker, floatingSerial }) => {
  const markerRef = useRef(null);
  const isFloatingActive = floatingSerial === daySerial;

  useEffect(() => {
    if (!registerDayMarker || !daySerial || !markerRef.current) return undefined;
    registerDayMarker(daySerial, markerRef.current);
    return () => registerDayMarker(daySerial, null);
  }, [daySerial, registerDayMarker]);

  return (
    <Fade in timeout={ANIMATION_DURATION.fade}>
      <Box
        ref={markerRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: isFloatingActive ? 1 : 3,
          mb: isFloatingActive ? 2 : 3,
          px: 2,
        }}
      >
        <Chip
          icon={<EventIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
          label={formatDate(date, isToday, timezone)}
          size="small"
          sx={{
            bgcolor: isToday ? 'primary.main' : 'background.paper',
            color: isToday ? 'primary.contrastText' : 'text.secondary',
            fontWeight: isToday ? 700 : 600,
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            height: { xs: 26, sm: 28 },
            border: '1px solid',
            borderColor: isToday ? 'primary.dark' : 'divider',
            boxShadow: isToday ? 2 : 1,
            transition: 'all 0.2s ease',
            visibility: floatingSerial === daySerial ? 'hidden' : 'visible',
            '& .MuiChip-icon': {
              color: isToday ? 'primary.contrastText' : 'text.secondary',
            },
          }}
        />
      </Box>
    </Fade>
  );
});

DayDivider.displayName = 'DayDivider';

/**
 * Today Empty State - Shown when today has no events
 * Memoized for performance
 */
const TodayEmptyState = memo(({ date, timezone }) => {
  return (
    <Fade in timeout={ANIMATION_DURATION.fade}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          my: 3,
          px: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            mb: 2,
          }}
        >
          <Divider
            sx={{
              flex: 1,
              borderColor: 'primary.main',
              borderWidth: 2,
            }}
          />
          <Chip
            icon={<EventIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
            label={formatDate(date, true, timezone)}
            size="small"
            sx={{
              mx: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 700,
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              height: { xs: 26, sm: 28 },
              border: '1px solid',
              borderColor: 'primary.dark',
              boxShadow: 2,
              '& .MuiChip-icon': {
                color: 'inherit',
              },
            }}
          />
          <Divider
            sx={{
              flex: 1,
              borderColor: 'primary.main',
              borderWidth: 2,
            }}
          />
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 16, opacity: 0.7 }} />
          No events scheduled for today
        </Typography>
      </Box>
    </Fade>
  );
});

TodayEmptyState.displayName = 'TodayEmptyState';

/**
 * Time Chip - Displays event time with state-based styling
 * Supports NOW, NEXT, and PAST states
 * Memoized for performance
 */
const TimeChip = memo(({ time, timeLabel = null, isPast, isNext, isNow, timezone, countdownLabel = null }) => {
  const theme = useTheme();

  const stateStyles = (() => {
    if (isNow) {
      return {
        bgcolor: alpha(theme.palette.info.main, 0.1),
        color: 'info.main',
        borderColor: 'info.main',
        boxShadow: `0 0 0 2px ${alpha(theme.palette.info.main, 0.2)}`,
      };
    }
    if (isNext) {
      return {
        bgcolor: alpha(theme.palette.primary.main, 0.08),
        color: 'primary.main',
        borderColor: 'primary.main',
        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
      };
    }
    if (isPast) {
      return {
        bgcolor: '#f5f5f5',
        color: '#757575',
        borderColor: '#9e9e9e',
      };
    }
    return {
      bgcolor: 'background.paper',
      color: 'text.primary',
      borderColor: 'divider',
    };
  })();

  return (
    <Chip
      icon={<AccessTimeIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />}
      label={
        <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
          {timeLabel || formatTime(time, timezone)}
        </Typography>
      }
      size="small"
      sx={{
        height: { xs: 30, sm: 32 },
        fontSize: { xs: '0.7rem', sm: '0.8rem' },
        fontWeight: 600,
        border: '2px solid',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        ...stateStyles,
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-1px)',
        },
        '& .MuiChip-label': {
          px: { xs: 1, sm: 1.25 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 0.2,
        },
        '& .MuiChip-icon': {
          color: 'inherit',
        },
      }}
    />
  );
}, (prevProps, nextProps) => (
  prevProps.time === nextProps.time &&
  prevProps.isPast === nextProps.isPast &&
  prevProps.isNext === nextProps.isNext &&
  prevProps.isNow === nextProps.isNow &&
  prevProps.timezone === nextProps.timezone &&
  prevProps.countdownLabel === nextProps.countdownLabel &&
  prevProps.timeLabel === nextProps.timeLabel
));

TimeChip.displayName = 'TimeChip';

/**
 * Impact Badge - Visual indicator for event impact level
 * Memoized for performance
 */
const ImpactBadge = memo(({ impact, isPast }) => {
  const config = getImpactConfig(impact);

  return (
    <MuiTooltip title={config.label} arrow placement="top">
      <Chip
        label={config.icon}
        size="small"
        sx={{
          minWidth: 40,
          height: 22,
          bgcolor: isPast ? '#9e9e9e' : config.color,
          color: 'white',
          fontWeight: 700,
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          cursor: 'help',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: 2,
          },
          '& .MuiChip-label': {
            px: 0.75,
            py: 0,
          },
        }}
      />
    </MuiTooltip>
  );
});

ImpactBadge.displayName = 'ImpactBadge';

/**
 * Currency Flag - Displays country flag for currency
 * Memoized for performance
 */
const CurrencyFlag = memo(({ currency }) => {
  const countryCode = getCurrencyFlag(currency);

  if (!countryCode) {
    return (
      <Chip
        label={currency}
        size="small"
        sx={{
          height: 22,
          fontSize: '0.7rem',
          fontWeight: 600,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
    );
  }

  return (
    <MuiTooltip title={currency} arrow placement="top">
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s ease',
          cursor: 'help',
          '&:hover': {
            boxShadow: 1,
            transform: 'scale(1.05)',
          },
        }}
      >
        <Box
          component="span"
          className={`fi fi-${countryCode}`}
          sx={{
            fontSize: { xs: 14, sm: 16 },
            lineHeight: 1,
          }}
        />
        <Typography
          variant="caption"
          sx={{
            fontSize: { xs: '0.65rem', sm: '0.7rem' },
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

/**
 * Event Description Card - Expandable card with event details
 * Memoized for performance
 */
const EventDescription = memo(({ description, loading }) => {
  if (loading) {
    return (
      <Card
        elevation={0}
        sx={{
          bgcolor: alpha('#000', 0.02),
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={1.5}>
            <Skeleton variant="text" width="30%" height={24} />
            <Skeleton variant="rectangular" height={60} />
            <Skeleton variant="text" width="25%" height={20} />
            <Skeleton variant="rectangular" height={80} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (!description) {
    return (
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{
          borderRadius: 2,
          fontSize: { xs: '0.8rem', sm: '0.875rem' },
        }}
      >
        No detailed description available for this event.
      </Alert>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: alpha('#000', 0.02),
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          {/* Description */}
          {description.description && (
            <Box>
              <Typography
                variant="subtitle2"
                color="primary"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                About
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  lineHeight: 1.6,
                }}
              >
                {description.description}
              </Typography>
            </Box>
          )}

          {/* Trading Implication */}
          {description.tradingImplication && (
            <Box>
              <Typography
                variant="subtitle2"
                color="success.main"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  mb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                💡 Trading Implication
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  lineHeight: 1.6,
                }}
              >
                {description.tradingImplication}
              </Typography>
            </Box>
          )}

          {/* Key Thresholds */}
          {description.keyThresholds && Object.keys(description.keyThresholds).length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                color="warning.main"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                📊 Key Thresholds
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: 1,
                  p: 1.5,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {Object.entries(description.keyThresholds).map(([key, value]) => (
                  <Box key={key}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '0.65rem', sm: '0.7rem' },
                        textTransform: 'capitalize',
                        fontWeight: 600,
                      }}
                    >
                      {key}:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        fontWeight: 700,
                        color: 'text.primary',
                      }}
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Release Info (Frequency & Source) */}
          {(description.frequency || description.source) && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: description.frequency && description.source ? '1fr 1fr' : '1fr' },
                gap: 1,
                p: 1.5,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {description.frequency && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      fontWeight: 600,
                    }}
                  >
                    Frequency
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      fontWeight: 700,
                      color: 'text.primary',
                    }}
                  >
                    {description.frequency}
                  </Typography>
                </Box>
              )}
              {description.source && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      fontWeight: 600,
                    }}
                  >
                    Source
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.8rem' },
                      fontWeight: 700,
                      color: 'text.primary',
                    }}
                  >
                    {description.source}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Outcome */}
          {description.outcome && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {getOutcomeIcon(description.outcome)}
              <Typography
                variant="body2"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  fontWeight: 600,
                }}
              >
                Outcome: {description.outcome}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
});

EventDescription.displayName = 'EventDescription';

/**
 * Event Card - Main event display card with state-based styling
 * Supports NOW, NEXT, and PAST states
 * Memoized for performance in large lists
 */
const EventCard = memo(({
  event,
  uniqueKey,
  isPast,
  isNext,
  isNow,
  isHighlighted = false,
  highlightDurationMs = 4000,
  highlightAnimated = false,
  hasDescription = true,
  onInfoClick,
  onCardClick,
  isFavoriteEvent,
  onToggleFavorite,
  isFavoritePending,
  favoritesLoading,
  hasEventNotes,
  onOpenNotes,
  isEventNotesLoading,
  timezone,
  nowMs,
  countdownLabel = null,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const impactConfig = getImpactConfig(event.strength || event.Strength);
  const hasAnyMetrics = hasMetricValue(event.actual) || hasMetricValue(event.forecast) || hasMetricValue(event.previous);
  const isSpeechNoMetrics = isSpeechLikeEvent(event);
  const speechSummary = isSpeechNoMetrics ? getSpeechSummary(event) : null;
  const showInfoButton = hasDescription !== false;
  const isFavorite = isFavoriteEvent ? isFavoriteEvent(event) : false;
  const favoritePending = isFavoritePending ? isFavoritePending(event) : false;
  const favoriteDisabled = Boolean(favoritesLoading) || favoritePending;
  const favoriteTooltip = favoritesLoading
    ? 'Loading favorites...'
    : isFavorite
      ? 'Remove from favorites'
      : 'Save to favorites';

  const hasNotes = hasEventNotes ? hasEventNotes(event) : false;
  const notesLoading = isEventNotesLoading ? isEventNotesLoading(event) : false;
  const notesTooltip = notesLoading ? 'Loading notes...' : hasNotes ? 'View notes' : 'Add note';

  const [favoriteMenuAnchor, setFavoriteMenuAnchor] = useState(null);
  const touchStartRef = useRef(null);
  const TAP_DISTANCE_THRESHOLD = 15;
  const TAP_TIME_THRESHOLD = 800;

  const handleFavoriteRemove = () => {
    if (onToggleFavorite) {
      onToggleFavorite(event);
    }
    setFavoriteMenuAnchor(null);
  };

  const handleFavoriteMenuClose = () => setFavoriteMenuAnchor(null);

  // Touch handling to prevent opening during scroll
  const handleTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;

    const target = e.target;
    const isInteractiveElement = target.closest('button') || target.closest('a') || target.closest('[role="button"]');
    if (isInteractiveElement) {
      touchStartRef.current = null;
      return;
    }

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now(),
    };

    const deltaX = Math.abs(touchEnd.x - touchStartRef.current.x);
    const deltaY = Math.abs(touchEnd.y - touchStartRef.current.y);
    const deltaTime = touchEnd.time - touchStartRef.current.time;

    // Only trigger click if touch didn't move much (not a scroll) and was quick
    if (deltaX < TAP_DISTANCE_THRESHOLD && deltaY < TAP_DISTANCE_THRESHOLD && deltaTime < TAP_TIME_THRESHOLD) {
      if (onCardClick && !e.defaultPrevented) {
        onCardClick(event);
      }
    }

    touchStartRef.current = null;
  };

  const handleTouchCancel = () => {
    touchStartRef.current = null;
  };

  // Desktop click handler
  const handleClick = (e) => {
    // Prevent opening if clicking on buttons or interactive elements
    const target = e.target;
    const isInteractiveElement = target.closest('button') || target.closest('a') || target.closest('[role="button"]');

    if (!isInteractiveElement && onCardClick) {
      onCardClick(event);
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (favoriteDisabled) return;
    if (isFavorite) {
      setFavoriteMenuAnchor(e.currentTarget);
      return;
    }
    if (onToggleFavorite) {
      onToggleFavorite(event);
    }
  };

  // Ensure favorite menu opens on touch (mobile) without triggering card click
  const handleFavoriteTouch = (e) => {
    e.preventDefault();
    handleFavoriteClick(e);
  };

  const handleNotesClick = (e) => {
    e.stopPropagation();
    if (onOpenNotes) {
      onOpenNotes(event);
    }
  };

  // Determine border and shadow based on state priority: NOW > NEXT > PAST
  const getStateStyles = () => {
    if (isNow) {
      return {
        borderColor: 'info.main',
        boxShadow: `0 0 0 4px ${alpha(theme.palette.info.main, 0.1)}`,
        bgcolor: alpha(theme.palette.info.main, 0.02),
      };
    }
    if (isNext) {
      return {
        borderColor: 'primary.main',
        boxShadow: 2,
        bgcolor: 'background.paper',
      };
    }
    return {
      borderColor: isPast ? '#9e9e9e' : 'divider',
      boxShadow: 'none',
      bgcolor: isPast ? '#e0e0e0' : 'background.paper',
      color: isPast ? '#424242' : undefined,
    };
  };

  const stateStyles = getStateStyles();
  const { boxShadow: stateBoxShadow = 'none', ...restStateStyles } = stateStyles;
  const normalizedStateShadow = typeof stateBoxShadow === 'number' ? theme.shadows[stateBoxShadow] : (stateBoxShadow || 'none');
  const highlightedShadow = isHighlighted
    ? `${normalizedStateShadow !== 'none' ? `${normalizedStateShadow}, ` : ''}${theme.shadows[4]}`
    : normalizedStateShadow;
  const hoverShadow = theme.shadows[4];
  const highlightedBorderColor = isHighlighted ? (isNow ? 'info.dark' : 'primary.main') : restStateStyles.borderColor;
  const highlightedTransform = isHighlighted ? 'translateY(-2px)' : 'none';

  const card = (
    <Card
      elevation={0}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        border: '2px solid',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...restStateStyles,
        boxShadow: highlightedShadow,
        borderColor: highlightedBorderColor,
        transform: highlightedTransform,
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          opacity: 0,
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0)}, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0)})`,
          boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.primary.main, 0.22)}`,
        },
        ...(isHighlighted && highlightAnimated ? {
          '&::after': {
            opacity: 1,
            animation: `t2tCanvasAutoscrollHighlight ${highlightDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) 1`,
          },
          '@keyframes t2tCanvasAutoscrollHighlight': {
            '0%': { opacity: 0, transform: 'translateX(-12%)' },
            '10%': { opacity: 1, transform: 'translateX(0%)' },
            '55%': { opacity: 0.85, transform: 'translateX(0%)' },
            '100%': { opacity: 0, transform: 'translateX(12%)' },
          },
        } : null),
        '&:hover': {
          boxShadow: hoverShadow,
          transform: 'translateY(-2px)',
          borderColor: isNow ? 'info.dark' : 'primary.main',
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack spacing={1.5}>
          {/* Header Row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            {/* Event Name - Support both lowercase and PascalCase */}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                lineHeight: 1.4,
                color: isPast ? '#424242' : 'text.primary',
                flex: 1,
                minWidth: 0,
              }}
            >
              {event.name || event.Name || 'Unnamed Event'}
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
              <MuiTooltip title={notesTooltip} arrow placement="top">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleNotesClick}
                    disabled={notesLoading}
                    sx={{
                      flexShrink: 0,
                      color: hasNotes ? 'primary.main' : 'text.secondary',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: hasNotes ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.info.main, 0.1),
                        color: 'primary.main',
                        transform: 'scale(1.05)',
                      },
                      '&.Mui-disabled': {
                        color: 'text.disabled',
                      },
                    }}
                  >
                    {notesLoading ? (
                      <CircularProgress size={16} thickness={5} />
                    ) : hasNotes ? (
                      <NoteAltIcon fontSize="small" />
                    ) : (
                      <NoteAltOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </MuiTooltip>

              <MuiTooltip title={favoriteTooltip} arrow placement="top">
                <span>
                  <IconButton
                    size="small"
                    onClick={handleFavoriteClick}
                    onTouchEnd={handleFavoriteTouch}
                    disabled={favoriteDisabled}
                    sx={{
                      flexShrink: 0,
                      color: isFavorite ? 'error.main' : 'text.secondary',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: isFavorite ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.primary.main, 0.1),
                        color: isFavorite ? 'error.main' : 'primary.main',
                        transform: 'scale(1.05)',
                      },
                      '&.Mui-disabled': {
                        color: 'text.disabled',
                      },
                    }}
                  >
                    {favoritePending ? (
                      <CircularProgress size={16} thickness={5} />
                    ) : isFavorite ? (
                      <FavoriteIcon fontSize="small" />
                    ) : (
                      <FavoriteBorderOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
                <Menu
                  anchorEl={favoriteMenuAnchor}
                  open={Boolean(favoriteMenuAnchor)}
                  onClose={handleFavoriteMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  slotProps={{ paper: { sx: { minWidth: 180 } } }}
                >
                  <MenuItem onClick={handleFavoriteRemove} sx={{ fontWeight: 700, color: 'error.main' }}>
                    Remove favorite
                  </MenuItem>
                  <MenuItem onClick={handleFavoriteMenuClose}>Cancel</MenuItem>
                </Menu>
              </MuiTooltip>

              {showInfoButton && (
                <MuiTooltip title="View Details" arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInfoClick(event);
                    }}
                    sx={{
                      flexShrink: 0,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </MuiTooltip>
              )}
            </Stack>
          </Box>

          {/* Metadata Row */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ImpactBadge impact={event.strength || event.Strength} isPast={isPast} />

            {(event.currency || event.Currency) && (
              <CurrencyFlag currency={event.currency || event.Currency} />
            )}

            {((event.category || event.Category) && (event.category || event.Category) !== null && (event.category || event.Category) !== 'null') && (
              <Chip
                label={event.category || event.Category}
                size="small"
                variant="outlined"
                sx={{
                  height: 22,
                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                  fontWeight: 500,
                  borderColor: 'divider',
                  color: 'text.secondary',
                }}
              />
            )}
          </Box>

          {/* Event Data Values or Speech Summary */}
          {hasAnyMetrics && (() => {
            // Check if event is in the future (has not occurred yet)
            const eventLocal = toTimezoneDate(event.date, timezone);
            const baselineNow = typeof nowMs === 'number' ? nowMs : Date.now();
            const isFutureEvent = eventLocal ? eventLocal.getTime() > baselineNow : false;

            // For future events, ALWAYS show '—' regardless of stored value
            // This is best UX practice - no actual data exists for events that haven't occurred
            let actualValue;
            if (isFutureEvent) {
              actualValue = '—';
            } else {
              // For past events, show actual value or '—' if missing/invalid (including '0')
              const hasValidActual = hasMetricValue(event.actual);
              actualValue = hasValidActual ? event.actual : '—';
            }
            const forecastValue = hasMetricValue(event.forecast) ? event.forecast : '—';
            const previousValue = hasMetricValue(event.previous) ? event.previous : '—';

            return (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  gap: { xs: 1, sm: 2 },
                  p: { xs: 1, sm: 1.5 },
                  bgcolor: isPast ? '#d6d6d6' : alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: isPast ? '#b0b0b0' : alpha(theme.palette.primary.main, 0.2),
                }}
              >
                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      fontWeight: 600,
                      mb: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Actual
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      color: isPast
                        ? '#424242'
                        : (actualValue !== '—' ? 'primary.main' : 'text.disabled'),
                    }}
                  >
                    {actualValue}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      fontWeight: 600,
                      mb: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Forecast
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      color: isPast ? '#616161' : (forecastValue !== '—' ? 'text.secondary' : 'text.disabled'),
                    }}
                  >
                    {forecastValue}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', flex: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      fontWeight: 600,
                      mb: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Previous
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      color: isPast ? '#616161' : (previousValue !== '—' ? 'text.secondary' : 'text.disabled'),
                    }}
                  >
                    {previousValue}
                  </Typography>
                </Box>
              </Box>
            );
          })()}

          {!hasAnyMetrics && isSpeechNoMetrics && speechSummary && (
            <Box sx={{ p: { xs: 1, sm: 1.25 }, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                {speechSummary}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  // Wrap card with Badge based on state (NOW takes priority over NEXT)
  if (isNow) {
    return (
      <Badge
        badgeContent="NOW"
        color="info"
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          width: '100%',
          display: 'block',
          '& .MuiBadge-root': {
            width: '100%',
          },
          '& .MuiBadge-badge': {
            fontSize: { xs: '0.6rem', sm: '0.65rem' },
            fontWeight: 700,
            height: { xs: 18, sm: 20 },
            minWidth: { xs: 36, sm: 40 },
            padding: { xs: '0 4px', sm: '0 6px' },
            borderRadius: '12px',
            left: { xs: 4, sm: 6 },
            top: { xs: 4, sm: 6 },
            transform: 'scale(1) translate(-50%, -50%)',
            transformOrigin: '0% 0%',
            boxShadow: 2,
            animation: 'nowBadgeScale 1.25s ease-in-out infinite',
            '@keyframes nowBadgeScale': {
              '0%, 100%': { transform: 'scale(1) translate(-50%, -50%)', opacity: 1 },
              '50%': { transform: 'scale(1.08) translate(-50%, -50%)', opacity: 0.86 },
            },
          },
        }}
        componentsProps={{
          root: {
            style: { width: '100%', display: 'block' }
          }
        }}
      >
        {card}
      </Badge>
    );
  }

  if (isNext) {
    return (
      <Badge
        badgeContent={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.35, color: 'primary.contrastText' }}>
            <AccessTimeIcon sx={{ fontSize: { xs: 14, sm: 15 } }} />
            {countdownLabel ? (
              <Typography component="span" sx={{ fontWeight: 800, fontSize: { xs: '0.65rem', sm: '0.7rem' }, lineHeight: 1 }}>
                {countdownLabel}
              </Typography>
            ) : null}
          </Box>
        }
        color="primary"
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          width: '100%',
          display: 'block',
          '& .MuiBadge-root': {
            width: '100%',
          },
          '& .MuiBadge-badge': {
            fontSize: { xs: '0.6rem', sm: '0.65rem' },
            fontWeight: 700,
            height: { xs: 20, sm: 22 },
            minWidth: { xs: 48, sm: 52 },
            padding: { xs: '0 6px', sm: '0 8px' },
            borderRadius: '14px',
            left: { xs: 6, sm: 8 },
            top: { xs: 0, sm: 0 },
            transform: 'scale(1) translate(-50%, -50%)',
            transformOrigin: '0% 0%',
            boxShadow: 2,
            bgcolor: 'primary.main',
            animation: 'nextBadgeScale 1.25s ease-in-out infinite',
            '@keyframes nextBadgeScale': {
              '0%, 100%': { transform: 'scale(1) translate(-50%, -50%)' },
              '50%': { transform: 'scale(1.08) translate(-50%, -50%)' },
            },
          },
        }}
        componentsProps={{
          root: {
            style: { width: '100%', display: 'block' }
          }
        }}
      >
        {card}
      </Badge>
    );
  }

  return card;
});

EventCard.displayName = 'EventCard';

/**
 * Pagination Button - Load Previous/More button
 * Memoized for performance
 */
const PaginationButton = memo(({ direction, onClick, disabled }) => {
  const theme = useTheme();
  const isShowPrevious = direction === 'previous';

  return (
    <Fade in timeout={ANIMATION_DURATION.fade}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          py: 2,
          px: 2,
        }}
      >
        <Button
          variant="text"
          onClick={onClick}
          disabled={disabled}
          startIcon={isShowPrevious ? <ExpandLessIcon /> : null}
          endIcon={!isShowPrevious ? <ExpandMoreIcon /> : null}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: 'text.secondary',
            px: 2,
            py: 0.75,
            borderRadius: 1,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
              '& .MuiSvgIcon-root': {
                color: 'primary.main',
              },
            },
            '&:active': {
              bgcolor: alpha(theme.palette.primary.main, 0.12),
            },
            '& .MuiButton-startIcon, & .MuiButton-endIcon': {
              color: 'text.disabled',
              transition: 'color 0.2s ease',
            },
          }}
        >
          {isShowPrevious ? 'Show Previous' : 'Load More'}
        </Button>
      </Box>
    </Fade>
  );
});

PaginationButton.displayName = 'PaginationButton';

/**
 * Empty State - Shown when no events match filters
 * Memoized for performance
 */
const EmptyState = memo(({ showFirstTimeSetup = false, searchQuery = '' }) => {
  const hasSearch = Boolean(searchQuery && searchQuery.trim());

  if (hasSearch) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 3,
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 700 }}>
          No events found
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            textAlign: 'center',
            maxWidth: 400,
            mb: 1,
          }}
        >
          No events match your search &quot;{searchQuery}&quot;
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            textAlign: 'center',
            maxWidth: 400,
            fontStyle: 'italic',
          }}
        >
          Try different search terms or adjust your filters to see more events.
        </Typography>
      </Box>
    );
  }
  return (
    <Fade in timeout={ANIMATION_DURATION.fade}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: 2,
          py: 4,
          px: 3,
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.7 }} />
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
          No Events Found
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
          No events match your current filters. Try adjusting your date range or removing some filters.
        </Typography>

        {showFirstTimeSetup && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: alpha('#2196f3', 0.1),
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'info.light',
              maxWidth: 400,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
              💡 First Time Setup:
            </Typography>
            <Typography variant="caption" component="div" sx={{ lineHeight: 1.6 }}>
              If you're seeing this for the first time, click the <strong>"Sync Calendar"</strong> button above to populate the database with economic events data.
            </Typography>
          </Box>
        )}
      </Box>
    </Fade>
  );
});

EmptyState.displayName = 'EmptyState';

/**
 * Loading State - Timeline skeleton following MUI best practices
 * Displays realistic timeline skeleton placeholders
 * Memoized for performance
 */
const LoadingState = memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Generate 5 skeleton items to simulate loading events
  const skeletonItems = Array.from({ length: 5 }, (_, i) => i);

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto', py: 2, px: { xs: 1, sm: 2 } }}>
      {/* Day Divider Skeleton */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          my: 3,
          px: 2,
          gap: 2,
        }}
      >
        <Skeleton variant="rectangular" width="30%" height={1} />
        <Skeleton variant="rounded" width={isMobile ? 100 : 120} height={28} />
        <Skeleton variant="rectangular" width="30%" height={1} />
      </Box>

      {/* Timeline Skeletons */}
      <Timeline
        position="right"
        sx={{
          p: 0,
          m: 0,
          '& .MuiTimelineItem-root:before': { display: 'none' },
        }}
      >
        {skeletonItems.map((item) => (
          <TimelineItem key={item}>
            <TimelineOppositeContent sx={{ flex: 0, display: 'none' }} />

            <TimelineSeparator>
              <Box sx={{ pl: { xs: 1.5, sm: 2 } }}>
                {/* Time Chip Skeleton */}
                <Skeleton
                  variant="rounded"
                  width={isMobile ? 60 : 70}
                  height={isMobile ? 24 : 28}
                  sx={{ borderRadius: 2 }}
                />
              </Box>

              {/* Connector */}
              {item < skeletonItems.length - 1 && (
                <TimelineConnector
                  sx={{
                    bgcolor: 'divider',
                    minHeight: { xs: 30, sm: 40 },
                    ml: { xs: 2.75, sm: 3.25 },
                  }}
                />
              )}
            </TimelineSeparator>

            <TimelineContent sx={{ pr: { xs: 1, sm: 2 }, pb: 3 }}>
              {/* Event Card Skeleton */}
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Stack spacing={1.5}>
                    {/* Title Skeleton */}
                    <Skeleton variant="text" width="80%" height={24} />

                    {/* Badges Row Skeleton */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Skeleton variant="rounded" width={40} height={22} />
                      <Skeleton variant="rounded" width={isMobile ? 60 : 80} height={22} />
                      <Skeleton variant="rounded" width={isMobile ? 80 : 100} height={22} />
                    </Box>

                    {/* Data Values Row Skeleton */}
                    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
                      <Skeleton variant="rounded" width={60} height={32} />
                      <Skeleton variant="rounded" width={60} height={32} />
                      <Skeleton variant="rounded" width={60} height={32} />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Box>
  );
});

LoadingState.displayName = 'LoadingState';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const buildEventKey = (event, index) => {
  return event.id || `${event.name || event.Name}-${event.time || event.date}-${index}`;
};

/**
 * EventsTimeline2 - Enterprise-grade timeline component
 * Simplified pagination: always show buttons when more events available
 * Enterprise "Next" event tracking: Updates every 60 seconds (Microsoft Teams/Outlook pattern)
 * NEXT detection now respects all filters (date range, impacts, currencies) but ignores pagination
 */
export default function EventsTimeline2({
  events = [],
  contextEvents = null, // DEPRECATED: NEXT now calculated from filtered events prop
  loading = false,
  onVisibleCountChange = null,
  autoScrollToNextKey = null,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone, // Default to user's local timezone
  searchQuery = '',
  isFavoriteEvent = () => false,
  onToggleFavorite = null,
  isFavoritePending = () => false,
  favoritesLoading = false,
  hasEventNotes = () => false,
  onOpenNotes = null,
  isEventNotesLoading = () => false,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // ========== STATE ==========
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalEvent, setModalEvent] = useState(null); // For card click modal
  const [visibleDayRange, setVisibleDayRange] = useState({ start: 0, end: 0 }); // Accumulative range
  const [highlightIds, setHighlightIds] = useState([]);
  const [highlightDurationMs, setHighlightDurationMs] = useState(4000);
  const highlightTimeoutRef = useRef(null);
  const lastHighlightTokenRef = useRef(null);
  const lastPaginationTokenRef = useRef(null);
  const lastScrollTokenRef = useRef(null);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const timelineContainerRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showScrollToNext, setShowScrollToNext] = useState(false);
  const [floatingDay, setFloatingDay] = useState(null);
  const dayMarkersRef = useRef(new Map());
  const [descriptionAvailability, setDescriptionAvailability] = useState({});

  // Track current time for "next" event calculation (updates every second for instant NOW/NEXT)
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // CRITICAL: Use absolute epoch milliseconds - timezone only affects display, not countdown math
  const nowEpochMs = currentTime;

  const clearHighlightTimeout = useCallback(() => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
  }, []);

  const registerDayMarker = useCallback((serial, element) => {
    if (!serial) return;
    if (element) {
      dayMarkersRef.current.set(serial, element);
    } else {
      dayMarkersRef.current.delete(serial);
    }
  }, []);

  const triggerHighlight = useCallback((ids, durationMs = 4000) => {
    clearHighlightTimeout();
    if (!ids || ids.length === 0) {
      setHighlightIds([]);
      return;
    }
    setHighlightDurationMs(durationMs);
    setHighlightIds(ids);
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightIds([]);
      highlightTimeoutRef.current = null;
    }, durationMs);
  }, [clearHighlightTimeout]);

  const isCanvasAutoScroll = useMemo(() => {
    if (typeof autoScrollToNextKey !== 'object' || !autoScrollToNextKey) return false;
    const source = String(autoScrollToNextKey?.source || '');
    return source.startsWith('canvas');
  }, [autoScrollToNextKey]);

  const shouldHighlightSimultaneous = useMemo(() => {
    return typeof autoScrollToNextKey === 'object' && autoScrollToNextKey?.source === 'canvas';
  }, [autoScrollToNextKey]);

  // ========== MEMOIZED VALUES ==========

  /**
   * Sorted events (ascending - oldest first)
   */
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB; // Ascending order
    });
  }, [events]);

  /**
   * Context events for NEXT detection (respects filters but not pagination)
   * UPDATED v3.8.1: Use filtered events to respect date range and other filters
   * Pagination is NOT a filter - it's just view windowing
   */
  const contextSortedEvents = useMemo(() => {
    // Use the filtered events prop for NEXT detection to respect filters
    // This ensures NEXT is calculated from the current filter set (date range, impacts, currencies)
    return sortedEvents;
  }, [sortedEvents]);

  const dayGroups = useMemo(() => {
    const groupsMap = new Map();
    sortedEvents.forEach((evt) => {
      const day = normalizeDate(new Date(evt.date), timezone);
      if (!day) return;
      const serial = getDaySerial(day);
      if (serial === null) return;
      if (!groupsMap.has(serial)) {
        groupsMap.set(serial, { serial, date: day, events: [] });
      }
      groupsMap.get(serial).events.push(evt);
    });

    return Array.from(groupsMap.values()).sort((a, b) => a.serial - b.serial);
  }, [sortedEvents, timezone]);

  const targetToken = useMemo(() => {
    if (!autoScrollToNextKey) return null;
    if (typeof autoScrollToNextKey === 'object') {
      const { eventId, ts } = autoScrollToNextKey;
      if (eventId) return `${eventId}-${ts ?? 'na'}`;
    }
    return null;
  }, [autoScrollToNextKey]);

  const targetIdFromToken = useMemo(() => {
    if (!autoScrollToNextKey) return null;
    if (typeof autoScrollToNextKey === 'object' && autoScrollToNextKey.eventId) return autoScrollToNextKey.eventId;
    return null;
  }, [autoScrollToNextKey]);

  const targetIndex = useMemo(() => {
    if (!targetIdFromToken) return -1;
    return sortedEvents.findIndex((evt) => evt.id === targetIdFromToken);
  }, [sortedEvents, targetIdFromToken]);

  /**
   * Partition events into past, today, future (timezone-aware)
   */
  const todaySerial = useMemo(() => {
    const today = normalizeDate(new Date(), timezone);
    return today ? getDaySerial(today) : null;
  }, [timezone]);

  /**
   * Index of the next event happening today (timezone-aware)
   */
  const nextTodayIndex = useMemo(() => {
    const todayGroup = dayGroups.find((g) => g.serial === todaySerial);
    if (!todayGroup) return -1;

    for (let i = 0; i < todayGroup.events.length; i += 1) {
      const eventEpochMs = getEventEpochMs(todayGroup.events[i]);
      if (eventEpochMs === null) continue;

      // Verify event is actually in today's day serial
      const eventLocal = toTimezoneDate(todayGroup.events[i].date, timezone);
      if (!eventLocal || getDaySerial(eventLocal) !== todaySerial) continue;

      if (eventEpochMs >= nowEpochMs) return i;
    }

    return -1;
  }, [dayGroups, timezone, nowEpochMs, todaySerial]);

  /**
   * Visible events: accumulative pagination (all days from start to end index)
   * Enterprise pattern: Infinite scroll / load more without replacing content
   */
  const visibleEvents = useMemo(() => {
    if (!dayGroups.length) return [];
    const start = Math.max(0, Math.min(visibleDayRange.start, dayGroups.length - 1));
    const end = Math.max(0, Math.min(visibleDayRange.end, dayGroups.length - 1));

    const accumulated = [];
    for (let i = start; i <= end; i++) {
      if (dayGroups[i]?.events) {
        accumulated.push(...dayGroups[i].events);
      }
    }
    return accumulated;
  }, [visibleDayRange, dayGroups]);

  const hasPreviousDay = visibleDayRange.start > 0;
  const hasNextDay = visibleDayRange.end < dayGroups.length - 1;

  /**
   * Today's date normalized (timezone-aware)
   */
  const today = useMemo(() => {
    return normalizeDate(new Date(), timezone);
  }, [timezone]);

  /**
   * Check if today has events
   */
  const hasTodayEvents = useMemo(() => {
    return visibleEvents.some(event => {
      const eventDate = normalizeDate(new Date(event.date), timezone);
      return eventDate && isSameDay(eventDate, today);
    });
  }, [visibleEvents, today, timezone]);

  const isTodayComplete = useMemo(() => {
    const todayGroup = dayGroups.find((g) => g.serial === todaySerial);
    if (!todayGroup) return false;
    return nextTodayIndex === -1;
  }, [dayGroups, todaySerial, nextTodayIndex]);

  /**
   * Find today divider index (chronologically)
   */
  const todayDividerIndex = useMemo(() => {
    return visibleEvents.findIndex(event => {
      const eventDate = normalizeDate(new Date(event.date), timezone);
      return eventDate && eventDate.getTime() >= today.getTime();
    });
  }, [visibleEvents, today, timezone]);

  /**
   * Check if today is within visible range
   */
  const isTodayInRange = useMemo(() => {
    if (visibleEvents.length === 0) return false;
    const daySerial = getDaySerial(today);
    if (daySerial === null) return false;

    // Check if today's serial is in any visible day group
    for (let i = visibleDayRange.start; i <= visibleDayRange.end; i++) {
      if (dayGroups[i]?.serial === daySerial) return true;
    }
    return false;
  }, [visibleEvents, today, dayGroups, visibleDayRange]);

  /**
   * Should show today empty divider
   */
  const shouldShowTodayDivider = !hasTodayEvents && isTodayInRange && todayDividerIndex >= 0;

  const updateFloatingDay = useCallback(() => {
    const container = timelineContainerRef.current;
    if (!container || dayMarkersRef.current.size === 0 || dayGroups.length === 0) {
      setFloatingDay(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop;
    const stickyOffsetPx = isMobile ? STICKY_DAY_CHIP_OFFSET.xs : STICKY_DAY_CHIP_OFFSET.sm;
    const anchor = scrollTop + stickyOffsetPx; // change immediately when marker crosses sticky line

    // Traverse visible day groups in chronological order to find the last marker above anchor.
    const orderedVisible = dayGroups.slice(visibleDayRange.start, visibleDayRange.end + 1);
    let activeSerial = null;
    for (let i = 0; i < orderedVisible.length; i += 1) {
      const group = orderedVisible[i];
      if (!group) continue;
      const el = dayMarkersRef.current.get(group.serial);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const markerTop = rect.top - containerRect.top + scrollTop;
      if (markerTop <= anchor) {
        activeSerial = group.serial; // keep advancing to the latest passed marker
      } else {
        break; // remaining markers are below anchor
      }
    }

    // If no marker passed the anchor, stick to the first visible day.
    const resolvedSerial = activeSerial ?? (orderedVisible[0]?.serial ?? null);
    if (!resolvedSerial) return;

    const group = dayGroups.find((g) => g.serial === resolvedSerial);
    if (!group) return;
    const label = formatDate(group.date, group.serial === todaySerial, timezone);

    setFloatingDay((prev) => {
      if (prev && prev.serial === resolvedSerial && prev.label === label && prev.isToday === (group.serial === todaySerial)) {
        return prev;
      }
      return { serial: resolvedSerial, label, isToday: group.serial === todaySerial };
    });
  }, [dayGroups, isMobile, todaySerial, timezone, visibleDayRange]);

  /**
   * Calculate event states: NOW, NEXT, PAST, FUTURE
   * Recalculates when currentTime updates (every 60 seconds)
   * Enterprise pattern: Efficient multi-state tracking with simultaneous event support
   * 
   * State Priority: NOW > NEXT > FUTURE > PAST
   * 
   * NOW: Within 9 minutes AFTER event time (matches clock overlay window)
   * NEXT: First upcoming event(s) - supports multiple simultaneous events
   * FUTURE: Events beyond NEXT
   * PAST: Before now in selected timezone (excludes future-day events)
   * 
   * REFACTORED v3.8.0: Uses shared eventTimeEngine for absolute-epoch-based state detection
   */
  const eventStates = useMemo(() => {
    // Use shared engine for consistent NOW/NEXT detection
    const { nowEventIds, nextEventIds, nextEventEpochMs } = computeNowNextState({
      events: contextSortedEvents,
      nowEpochMs,
      nowWindowMs: NOW_WINDOW_MS,
      buildKey: buildEventKey,
    });

    return {
      nowIds: nowEventIds,
      nextIds: nextEventIds,
      nextEventTime: nextEventEpochMs
    };
  }, [contextSortedEvents, nowEpochMs]);
  const nextEventIndex = useMemo(() => {
    if (eventStates.nextIds.size === 0) return -1;
    const firstNextId = Array.from(eventStates.nextIds)[0];
    return visibleEvents.findIndex((e, idx) => buildEventKey(e, idx) === firstNextId);
  }, [eventStates, visibleEvents]);

  const nextCountdownLabel = useMemo(() => {
    if (!eventStates.nextEventTime) return null;
    const diff = Math.max(0, eventStates.nextEventTime - countdownNow);
    return formatCountdownHMS(diff);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${hours}:${mm}:${ss}`;
  }, [countdownNow, eventStates.nextEventTime]);

  // ========== EFFECTS ==========

  /**
   * Enterprise pattern: Update "next" event every 60 seconds
   * Same approach as Microsoft Teams/Outlook for calendar event tracking
   * - Minimal overhead (60s interval vs real-time)
   * - Efficient re-rendering (only when time state changes)
   * - Automatic cleanup on unmount
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // 1 second for immediate NOW/NEXT updates

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000); // Update countdown every second

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      clearHighlightTimeout();
    };
  }, [clearHighlightTimeout]);

  /**
   * Track scroll position for floating 'Scroll to Next' button
   * Enterprise pattern: Show/hide based on scroll proximity to next event
   * CRITICAL: Only show if next event is actually in the current visible filtered/paginated view
   */
  useEffect(() => {
    const container = timelineContainerRef.current;
    if (!container) return undefined;

    const handleScroll = () => {
      updateFloatingDay();
      setScrollPosition(container.scrollTop);

      const targetIds = eventStates.nowIds.size > 0 ? eventStates.nowIds : eventStates.nextIds;
      if (targetIds.size === 0) {
        setShowScrollToNext(false);
        return;
      }

      const firstTargetId = Array.from(targetIds)[0];

      // CRITICAL: Only show if target event exists in the current visible range.
      // Timeline uses buildEventKey as the stable row key and data-event-id.
      const isTargetInVisibleEvents = visibleEvents.some((evt, idx) => buildEventKey(evt, idx) === firstTargetId);
      if (!isTargetInVisibleEvents) {
        setShowScrollToNext(false);
        return;
      }

      const targetElement = document.querySelector(`[data-event-id="${firstTargetId}"]`);
      if (!targetElement) {
        setShowScrollToNext(false);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const elementRect = targetElement.getBoundingClientRect();
      const elementTop = elementRect.top - containerRect.top + container.scrollTop;
      const viewportCenter = container.scrollTop + containerRect.height / 2;
      const distanceFromCenter = Math.abs(elementTop - viewportCenter);

      // Show button if target event is more than 300px away from viewport center
      setShowScrollToNext(distanceFromCenter > 300);
    };

    handleScroll(); // Initial check
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [eventStates.nextIds, eventStates.nowIds, visibleEvents, updateFloatingDay]);

  // Reset scroll-to-next button when events change
  useEffect(() => {
    lastScrollTokenRef.current = null;
    lastPaginationTokenRef.current = null;
  }, [autoScrollToNextKey]);

  /**
   * Ensure a specifically requested event (via autoScrollToNextKey) is in the visible range.
   * Expands range if needed to include the target day.
   */
  useEffect(() => {
    if (!targetToken || targetIndex === -1) return;
    if (lastPaginationTokenRef.current === targetToken) return;

    const targetEvent = sortedEvents[targetIndex];
    if (!targetEvent) return;
    const targetDay = getDaySerial(normalizeDate(new Date(targetEvent.date), timezone));
    const targetDayIndex = dayGroups.findIndex((g) => g.serial === targetDay);

    if (targetDayIndex !== -1) {
      // Expand range to include target if not already visible
      setVisibleDayRange((prev) => ({
        start: Math.min(prev.start, targetDayIndex),
        end: Math.max(prev.end, targetDayIndex),
      }));
    }
    lastPaginationTokenRef.current = targetToken;
  }, [targetToken, targetIndex, sortedEvents, timezone, dayGroups]);

  /**
   * Reset pagination when events change, centering on today
   * Enterprise pattern: Start with reasonable default view
   * ENHANCED: Always start with today if it exists in range (e.g., "This Week" filter)
   */
  useEffect(() => {
    const todayIndex = dayGroups.findIndex((g) => g.serial === todaySerial);
    if (todayIndex !== -1) {
      // Today exists in the current range - always start here
      setVisibleDayRange({ start: todayIndex, end: todayIndex });
    } else if (dayGroups.length > 0) {
      // Today not in range - start with first available day
      setVisibleDayRange({ start: 0, end: 0 });
    }
    lastPaginationTokenRef.current = null;
    lastScrollTokenRef.current = null;
  }, [dayGroups, todaySerial]);

  /**
   * Report visible event count to parent component
   */
  useEffect(() => {
    if (onVisibleCountChange) {
      onVisibleCountChange(visibleEvents.length);
    }
  }, [visibleEvents.length, onVisibleCountChange]);

  useEffect(() => {
    updateFloatingDay();
  }, [updateFloatingDay, visibleEvents]);

  // Prefetch description availability to hide info icons when no description exists
  useEffect(() => {
    let isCancelled = false;

    const hydrateDescriptionAvailability = async () => {
      if (visibleEvents.length === 0) {
        if (!isCancelled) {
          setDescriptionAvailability({});
        }
        return;
      }

      try {
        const availability = {};

        await Promise.all(visibleEvents.map(async (event, index) => {
          const eventName = event.Name || event.name;
          const category = event.category || event.Category;
          const uniqueKey = buildEventKey(event, index);

          if (!eventName && !category) {
            availability[uniqueKey] = false;
            return;
          }

          const hasDescription = await hasEventDescriptionEntry(eventName, category);
          availability[uniqueKey] = hasDescription;
        }));

        if (!isCancelled) {
          setDescriptionAvailability(availability);
        }
      } catch (error) {
        if (!isCancelled) {
          setDescriptionAvailability({});
        }
      }
    };

    hydrateDescriptionAvailability();

    return () => {
      isCancelled = true;
    };
  }, [visibleEvents]);

  /**
   * Auto-scroll to next event when requested (used by drawer open)
   */
  useEffect(() => {
    if (!targetToken || !targetIdFromToken) return;

    const targetEvent = sortedEvents[targetIndex];
    if (!targetEvent) return;
    const targetDay = getDaySerial(normalizeDate(new Date(targetEvent.date), timezone));
    const targetDayIndex = dayGroups.findIndex((g) => g.serial === targetDay);
    // Wait until target day is in visible range
    if (targetDayIndex !== -1 && (targetDayIndex < visibleDayRange.start || targetDayIndex > visibleDayRange.end)) return;

    if (lastScrollTokenRef.current === targetToken) return;

    const targetEventData = sortedEvents.find((evt) => evt.id === targetIdFromToken);
    const targetTime = targetEventData ? new Date(targetEventData.date).getTime() : null;
    const simultaneousIds = (shouldHighlightSimultaneous && targetTime)
      ? sortedEvents
        .filter((evt) => evt.id && new Date(evt.date).getTime() === targetTime)
        .map((evt) => evt.id)
      : [targetIdFromToken];

    const scrollToTarget = () => {
      const el = document.querySelector(`[data-event-id="${targetIdFromToken}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (simultaneousIds.length > 0) {
        triggerHighlight(simultaneousIds, isCanvasAutoScroll ? 6000 : 4000);
      }
      lastScrollTokenRef.current = targetToken;
    };

    requestAnimationFrame(scrollToTarget);
  }, [targetToken, targetIdFromToken, targetIndex, sortedEvents, triggerHighlight, visibleDayRange, dayGroups, timezone, isCanvasAutoScroll, shouldHighlightSimultaneous]);

  /**
   * Fallback: auto-scroll to next event when no explicit target is provided (once per mount/open).
   */
  useEffect(() => {
    if (loading) return;
    if (targetToken) return; // explicit target handled above
    if (lastScrollTokenRef.current === 'next-default') return;

    const shouldScrollBottom = eventStates.nextIds.size === 0 || isTodayComplete;

    if (!shouldScrollBottom && eventStates.nextIds.size > 0) {
      const firstNextId = Array.from(eventStates.nextIds)[0];
      const el = document.querySelector(`[data-event-id="${firstNextId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        lastScrollTokenRef.current = 'next-default';
      }
      return;
    }

    // No NEXT event: scroll to bottom
    const container = document.querySelector('[data-timeline-container="true"]');
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      lastScrollTokenRef.current = 'next-default';
    }
  }, [eventStates.nextIds, targetToken, loading, autoScrollToNextKey, isTodayComplete]);

  // ========== CALLBACKS ==========

  /**
   * Open modal with event details
   */
  const handleInfoClick = useCallback((event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  }, []);

  /**
   * Close modal
   */
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    // Delay clearing selected event to allow exit animation
    setTimeout(() => {
      setSelectedEvent(null);
    }, 300);
  }, []);

  /**
   * Handle card click to open modal
   */
  const handleCardClick = useCallback((event) => {
    setModalEvent(event);
  }, []);

  /**
   * Handle closing card modal
   */
  const handleCardModalClose = useCallback(() => {
    setModalEvent(null);
  }, []);

  /**
   * Load previous day (expand above)
   * Enterprise UX: Preserves scroll position by measuring and adjusting after DOM update
   */
  const handleLoadPrevious = useCallback(() => {
    if (visibleDayRange.start <= 0) return;

    const container = timelineContainerRef.current;
    if (!container) {
      setVisibleDayRange((prev) => ({ ...prev, start: Math.max(prev.start - 1, 0) }));
      return;
    }

    // Measure current scroll position and height before adding content
    const scrollBefore = container.scrollTop;
    const heightBefore = container.scrollHeight;

    setVisibleDayRange((prev) => ({ ...prev, start: Math.max(prev.start - 1, 0) }));

    // After React renders new content, adjust scroll to maintain visual position
    requestAnimationFrame(() => {
      const heightAfter = container.scrollHeight;
      const heightDiff = heightAfter - heightBefore;
      container.scrollTop = scrollBefore + heightDiff;
    });
  }, [visibleDayRange.start]);

  /**
   * Load next day (expand below)
   * Enterprise UX: Natural scroll flow - new content appears below, no position adjustment needed
   */
  const handleLoadMore = useCallback(() => {
    setVisibleDayRange((prev) => ({ ...prev, end: Math.min(prev.end + 1, dayGroups.length - 1) }));
  }, [dayGroups.length]);

  /**
   * Scroll to next event
   * Enterprise UX: Smooth scroll with center alignment for optimal viewing
   */
  const handleScrollToNext = useCallback(() => {
    const targetIds = eventStates.nowIds.size > 0 ? eventStates.nowIds : eventStates.nextIds;
    if (targetIds.size === 0) return;

    const firstTargetId = Array.from(targetIds)[0];
    const targetElement = document.querySelector(`[data-event-id="${firstTargetId}"]`);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [eventStates.nextIds, eventStates.nowIds]);

  useEffect(() => {
    updateFloatingDay();
  }, [updateFloatingDay]);

  // ========== RENDER ==========

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Empty state
  if (events.length === 0) {
    return <EmptyState showFirstTimeSetup={false} searchQuery={searchQuery} />;
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box ref={timelineContainerRef} data-timeline-container="true" sx={{ flex: 1, overflow: 'auto', px: { xs: 1, sm: 2 }, py: 2 }}>
        {/* Show Previous Day */}
        {hasPreviousDay && (
          <PaginationButton
            direction="previous"
            onClick={handleLoadPrevious}
          />
        )}

        {floatingDay && (
          <Box
            sx={{
              position: 'sticky',
              top: { xs: `${STICKY_DAY_CHIP_OFFSET.xs}px`, sm: `${STICKY_DAY_CHIP_OFFSET.sm}px` },
              zIndex: 12,
              display: 'flex',
              justifyContent: 'center',
              pb: 1,
              mt: -1,
            }}
          >
            <Chip
              icon={<EventIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
              label={floatingDay.label}
              size="small"
              sx={{
                bgcolor: floatingDay.isToday ? 'primary.main' : 'background.paper',
                color: floatingDay.isToday ? 'primary.contrastText' : 'text.secondary',
                fontWeight: floatingDay.isToday ? 700 : 600,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 26, sm: 28 },
                border: '1px solid',
                borderColor: floatingDay.isToday ? 'primary.dark' : 'divider',
                boxShadow: floatingDay.isToday ? 3 : 2,
                backdropFilter: 'blur(6px)',
                pointerEvents: 'none',
                userSelect: 'none',
                '& .MuiChip-icon': {
                  color: floatingDay.isToday ? 'primary.contrastText' : 'text.secondary',
                },
              }}
            />
          </Box>
        )}

        {/* Timeline */}
        <Timeline
          position="right"
          sx={{
            p: 0,
            pt: 0,
            m: 0,
            '& .MuiTimelineItem-root': {
              minHeight: 'auto',
            },
            '& .MuiTimelineItem-root:before': {
              display: 'none',
            },
          }}
        >
          {visibleEvents.map((event, index) => {
            const uniqueKey = buildEventKey(event, index);
            const eventKey = uniqueKey;
            const isPast = getTimeStatus(event.date, timezone, nowEpochMs) === 'past';
            const isNow = eventStates.nowIds.has(uniqueKey);
            const isNext = eventStates.nextIds.has(uniqueKey);
            const countdownLabel = isNext ? nextCountdownLabel : null;
            const isHighlighted = event.id ? highlightIds.includes(event.id) : false;
            const hasDescription = descriptionAvailability[uniqueKey];

            // Check if this is a new day
            const currentDate = new Date(event.date);
            const prevEvent = index > 0 ? visibleEvents[index - 1] : null;
            const prevDate = prevEvent ? new Date(prevEvent.date) : null;
            const isNewDay = index === 0 || (prevDate && !isSameDay(currentDate, prevDate));
            const isToday = isSameDay(currentDate, today);

            // Check if we should show "Today" empty divider before this event
            const showTodayDividerHere = shouldShowTodayDivider && index === todayDividerIndex;

            return (
              <React.Fragment key={uniqueKey}>
                {/* Today Empty Divider */}
                {showTodayDividerHere && <TodayEmptyState date={today} timezone={timezone} />}

                {/* Day Divider */}
                {isNewDay && (
                  <DayDivider
                    date={currentDate}
                    isToday={isToday}
                    isFirst={index === 0}
                    timezone={timezone}
                    daySerial={getDaySerial(normalizeDate(currentDate, timezone))}
                    registerDayMarker={registerDayMarker}
                    floatingSerial={floatingDay?.serial || null}
                  />
                )}

                {/* Timeline Item */}
                <TimelineItem data-event-id={uniqueKey}>
                  {/* Empty opposite content */}
                  <TimelineOppositeContent
                    sx={{
                      flex: 0,
                      display: 'none',
                    }}
                  />

                  {/* Time separator */}
                  <TimelineSeparator>
                    <Box sx={{ pl: { xs: 1.5, sm: 2 } }}>
                      <TimeChip
                        time={event.time || event.date}
                        timeLabel={event.timeLabel || null}
                        isPast={isPast}
                        isNow={isNow}
                        isNext={isNext}
                        timezone={timezone}
                        countdownLabel={countdownLabel}
                      />
                    </Box>

                    {/* Connector line */}
                    {index < visibleEvents.length - 1 && (
                      <TimelineConnector
                        sx={{
                          bgcolor: 'divider',
                          minHeight: { xs: 30, sm: 40 },
                          ml: { xs: 2.75, sm: 3.25 },
                          transition: 'all 0.3s ease',
                        }}
                      />
                    )}
                  </TimelineSeparator>

                  {/* Event content */}
                  <TimelineContent sx={{ pr: { xs: 1, sm: 2 }, pb: 3, mt: 0, pt: 0 }}>
                    <EventCard
                      event={event}
                      uniqueKey={uniqueKey}
                      isPast={isPast}
                      isNow={isNow}
                      isNext={isNext}
                      isHighlighted={isHighlighted}
                      highlightDurationMs={highlightDurationMs}
                      highlightAnimated={isCanvasAutoScroll}
                      hasDescription={hasDescription !== false}
                      onInfoClick={handleInfoClick}
                      onCardClick={handleCardClick}
                      isFavoriteEvent={isFavoriteEvent}
                      onToggleFavorite={onToggleFavorite}
                      isFavoritePending={isFavoritePending}
                      favoritesLoading={favoritesLoading}
                      hasEventNotes={hasEventNotes}
                      onOpenNotes={onOpenNotes}
                      isEventNotesLoading={isEventNotesLoading}
                      timezone={timezone}
                      nowMs={nowEpochMs}
                      countdownLabel={countdownLabel}
                    />
                  </TimelineContent>
                </TimelineItem>
              </React.Fragment>
            );
          })}
        </Timeline>

        {/* Today Empty Divider at End */}
        {shouldShowTodayDivider && todayDividerIndex === -1 && (
          <TodayEmptyState date={today} timezone={timezone} />
        )}

        {/* Load More Button - Only for future days */}
        {hasNextDay && (
          <PaginationButton
            direction="more"
            onClick={handleLoadMore}
          />
        )}
      </Box>

      {/* Floating Scroll to Next/Now Button */}
      {showScrollToNext && (eventStates.nowIds.size > 0 || eventStates.nextIds.size > 0) && (() => {
        const hasNow = eventStates.nowIds.size > 0;
        const targetIds = hasNow ? eventStates.nowIds : eventStates.nextIds;
        const container = timelineContainerRef.current;
        const firstTargetId = Array.from(targetIds)[0];
        const targetElement = container && document.querySelector(`[data-event-id="${firstTargetId}"]`);

        let isNextAbove = false;
        if (container && targetElement) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = targetElement.getBoundingClientRect();
          const elementTop = elementRect.top - containerRect.top + container.scrollTop;
          const viewportCenter = container.scrollTop + containerRect.height / 2;
          isNextAbove = elementTop < viewportCenter;
        }

        return (
          <Zoom in timeout={300}>
            <Fab
              color={hasNow ? 'info' : 'primary'}
              size="medium"
              onClick={handleScrollToNext}
              sx={{
                position: 'absolute',
                bottom: {
                  xs: 'calc(16px + var(--t2t-safe-bottom, 0px))',
                  sm: 'calc(24px + var(--t2t-safe-bottom, 0px))',
                },
                right: { xs: 16, sm: 24 },
                zIndex: 1000,
                boxShadow: 4,
                '&:hover': {
                  boxShadow: 8,
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <MuiTooltip
                title={`${hasNow ? 'Scroll to Now Event' : 'Scroll to Next Event'} ${isNextAbove ? '(Above)' : '(Below)'}`}
                arrow
                placement="left"
              >
                {isNextAbove ? (
                  <KeyboardArrowUpIcon sx={{ fontSize: 28 }} />
                ) : (
                  <KeyboardArrowDownIcon sx={{ fontSize: 28 }} />
                )}
              </MuiTooltip>
            </Fab>
          </Zoom>
        );
      })()}

      {/* Event Details Modal (for info button) */}
      <EventModal
        open={modalOpen}
        onClose={handleModalClose}
        event={selectedEvent}
        timezone={timezone}
        isFavoriteEvent={isFavoriteEvent}
        onToggleFavorite={onToggleFavorite}
        isFavoritePending={isFavoritePending}
        favoritesLoading={favoritesLoading}
        hasEventNotes={hasEventNotes}
        onOpenNotes={onOpenNotes}
        isEventNotesLoading={isEventNotesLoading}
      />

      {/* Event Details Modal (for card click) */}
      <EventModal
        open={Boolean(modalEvent)}
        onClose={handleCardModalClose}
        event={modalEvent}
        timezone={timezone}
        isFavoriteEvent={isFavoriteEvent}
        onToggleFavorite={onToggleFavorite}
        isFavoritePending={isFavoritePending}
        favoritesLoading={favoritesLoading}
        hasEventNotes={hasEventNotes}
        onOpenNotes={onOpenNotes}
        isEventNotesLoading={isEventNotesLoading}
      />
    </Box>
  );
}
