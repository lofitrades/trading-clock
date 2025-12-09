/**
 * src/components/EventsTimeline2.jsx
 * 
 * Purpose: Enterprise-grade timeline component for economic events
 * Optimized performance with memoization, virtualization-ready design,
 * infinite bidirectional pagination, scroll preservation, and accessible UI
 * 
 * Key Features:
 * - Intelligent bidirectional pagination (Show Previous/Load More)
 * - Scroll position preservation (enterprise UX best practice)
 * - Conditional today divider (only shown when in filtered range)
 * - Smart day grouping with visual hierarchy
 * - Lazy-loaded event descriptions (Firestore integration)
 * - Next event indicator with badge
 * - Impact-based visual indicators (!!!, !!, !, ?, ~)
 * - Flag icons for currency identification
 * - Prominent display of actual/forecast/previous values (always visible)
 * - Comprehensive event details (description, trading implications, key thresholds, frequency, source)
 * - Responsive mobile-first design
 * - Smooth animations and transitions
 * - Optimistic UI updates
 * 
 * Performance:
 * - Memoized subcomponents to prevent unnecessary re-renders
 * - Debounced description loading
 * - PAGE_SIZE-based chunking for smooth scrolling
 * - requestAnimationFrame for scroll operations
 * 
 * Changelog:
 * v3.2.4 - 2025-12-01 - CRITICAL FIX: Added custom memo comparison to TimeChip to force re-render when timezone changes (fixes timezone selector not updating times immediately)
 * v3.2.3 - 2025-12-01 - Refactored: Removed duplicate formatTime function, now using centralized src/utils/dateUtils.formatTime() for DRY principle (kept local formatDate wrapper for "Today" label logic)
 * v3.2.2 - 2025-12-01 - BUGFIX: Fixed EventModal timezone - Now passes timezone prop to EventModal so event details display in user-selected timezone
 * v3.2.1 - 2025-12-01 - BUGFIX: Fixed timezone conversion - formatTime now handles Unix timestamps (numbers) from eventsCache, properly converts to user-selected timezone
 * v3.2.0 - 2025-12-01 - Added "NOW" state: Blue badge/border for events within 5 minutes after release time. Supports multiple simultaneous events. Priority: NOW > NEXT > FUTURE > PAST
 * v3.1.0 - 2025-12-01 - Enterprise "Next" event tracking: Updates every 60 seconds using interval (Microsoft Teams/Outlook pattern) - minimal re-renders, efficient state management, automatic cleanup
 * v3.0.0 - 2025-11-30 - BREAKING: Replaced inline expand/collapse with EventModal - Info icon opens full modal dialog with comprehensive event details (economicEventsCalendar + economicEventDescriptions data)
 * v2.7.0 - 2025-11-30 - Enterprise UX: Moved "Next" badge to top-left corner using MUI anchorOrigin (vertical: 'top', horizontal: 'left') following enterprise best practices for timeline badges
 * v2.6.0 - 2025-11-30 - Mobile-first UX: Updated "Next" badge positioning following MUI best practices (transform: translate(50%, -50%), responsive top/right values, enhanced shadow)
 * v2.5.0 - 2025-11-30 - UX refinement: "Next" badge now wraps EventCard (like original TimeChip design) with top alignment matching TimeChip position for visual consistency
 * v2.4.0 - 2025-11-30 - UX improvement: Moved "Next" badge from TimeChip to top-right corner of EventCard for better visibility and cleaner design
 * v2.3.0 - 2025-11-30 - UX enhancement: Next event card now has primary border color (2px solid) matching TimeChip border style for visual consistency
 * v2.2.0 - 2025-11-30 - MAJOR: Replaced LoadingAnimation with MUI Skeleton components following best practices (timeline skeleton with realistic placeholders)
 * v2.1.5 - 2025-11-30 - Loading animation now vertically centered in timeline viewport (minHeight: calc(100vh - 250px))
 * v2.1.4 - 2025-11-30 - Refactored loading animation: Extracted to LoadingAnimation.jsx for reusability with LoadingScreen.jsx
 * v2.1.3 - 2025-11-30 - Fixed loading animation: Inline canvas animation (not fullscreen), responsive mobile-first, centered in drawer, text reads "Loading Events"
 * v2.1.2 - 2025-11-30 - UX improvements: Removed blinking animation from "Next" badge, replaced CircularProgress with LoadingScreen animation for visual consistency
 * v2.1.1 - 2025-11-30 - UX improvement: Show '—' for Actual value on future events (instead of '0', '-', or any other value) since event hasn't occurred yet; Fixed to properly handle all future events regardless of stored value
 * v2.1.0 - 2025-11-30 - BREAKING: Simplified pagination - removed hasAppliedFilters logic, always show buttons when more events available; Added onVisibleCountChange callback for parent component
 * v2.0.5 - 2025-11-30 - Hide pagination buttons when filters applied (only show in default/reset state)
 * v2.0.4 - 2025-11-30 - Improved data values display: single row layout, show '—' for missing values instead of '-'
 * v2.0.3 - 2025-11-30 - Added prominent display of actual/forecast/previous data values (always visible, not in collapsed section)
 * v2.0.2 - 2025-11-30 - Enhanced description display: added keyThresholds, frequency, source fields
 * v2.0.1 - 2025-11-30 - Fixed description loading: handles service response structure (result.success, result.data)
 * v2.0.0 - 2025-11-30 - Enterprise refactor with performance optimizations and improved UX
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Stack,
  Divider,
  Collapse,
  IconButton,
  Alert,
  Tooltip as MuiTooltip,
  Badge,
  Button,
  Skeleton,
  Fade,
  Zoom,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { getEventDescription } from '../services/economicEventsService';
import EventModal from './EventModal';
import { formatTime } from '../utils/dateUtils';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Pagination configuration
 */
const PAGE_SIZE = 20;

/**
 * "NOW" state window duration (milliseconds)
 * Events within this window after release time are marked as "NOW"
 * 5 minutes gives traders time to see data and observe initial market reaction
 */
const NOW_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

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
  strong: { icon: '!!!', color: 'error.main', label: 'High Impact' },
  moderate: { icon: '!!', color: 'warning.main', label: 'Medium Impact' },
  weak: { icon: '!', color: 'info.main', label: 'Low Impact' },
  'non-economic': { icon: '~', color: 'grey.500', label: 'Non-Economic' },
  unknown: { icon: '?', color: 'grey.500', label: 'Unknown' },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get time status (past/upcoming) - timezone-aware
 * @param {Date|number} dateTime - Event date/time (Date object or Unix timestamp)
 * @param {string} timezone - IANA timezone
 * @returns {'past'|'upcoming'|'unknown'} Time status
 */
const getTimeStatus = (dateTime, timezone) => {
  if (!dateTime) return 'unknown';
  
  // Convert to Date object if it's a Unix timestamp
  const eventDate = typeof dateTime === 'number' ? new Date(dateTime) : new Date(dateTime);
  
  // Get current time in the specified timezone
  const nowInTimezone = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
  
  return eventDate < nowInTimezone ? 'past' : 'upcoming';
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
  if (!impact) return IMPACT_CONFIG.unknown;
  
  const lower = impact.toLowerCase();
  
  if (lower.includes('strong') || lower.includes('high')) {
    return IMPACT_CONFIG.strong;
  }
  if (lower.includes('moderate') || lower.includes('medium')) {
    return IMPACT_CONFIG.moderate;
  }
  if (lower.includes('weak') || lower.includes('low')) {
    return IMPACT_CONFIG.weak;
  }
  if (lower.includes('non-economic') || lower.includes('none')) {
    return IMPACT_CONFIG['non-economic'];
  }
  
  return IMPACT_CONFIG.unknown;
};

/**
 * Get country code for currency flag
 * @param {string} currency - Currency code
 * @returns {string|null} Country code or null
 */
const getCurrencyFlag = (currency) => {
  if (!currency) return null;
  return CURRENCY_TO_COUNTRY[currency.toUpperCase()] || null;
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
  
  // Convert to Date object if it's a Unix timestamp
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  
  if (isToday) {
    return `Today - ${dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone,
    })}`;
  }
  
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  });
};

// ============================================================================
// MEMOIZED SUBCOMPONENTS
// ============================================================================

/**
 * Day Divider - Separates events by day
 * Memoized to prevent unnecessary re-renders
 */
const DayDivider = memo(({ date, isToday, isFirst, timezone }) => {
  const theme = useTheme();
  
  return (
    <Fade in timeout={ANIMATION_DURATION.fade}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: 3,
          mb: 3,
          px: 2,
        }}
      >
        <Divider 
          sx={{ 
            flex: 1,
            borderColor: isToday ? 'primary.main' : 'divider',
            borderWidth: isToday ? 2 : 1,
            transition: 'all 0.3s ease',
          }} 
        />
        <Chip
          icon={<EventIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
          label={formatDate(date, isToday, timezone)}
          size="small"
          sx={{
            mx: 2,
            bgcolor: isToday ? 'primary.main' : 'background.paper',
            color: isToday ? 'primary.contrastText' : 'text.secondary',
            fontWeight: isToday ? 700 : 600,
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            height: { xs: 26, sm: 28 },
            border: '1px solid',
            borderColor: isToday ? 'primary.dark' : 'divider',
            boxShadow: isToday ? 2 : 'none',
            transition: 'all 0.3s ease',
            '& .MuiChip-icon': {
              color: 'inherit',
            },
          }}
        />
        <Divider 
          sx={{ 
            flex: 1,
            borderColor: isToday ? 'primary.main' : 'divider',
            borderWidth: isToday ? 2 : 1,
            transition: 'all 0.3s ease',
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
const TimeChip = memo(({ time, isPast, isNext, isNow, timezone }) => {
  const theme = useTheme();
  
  // Determine colors and shadows based on state priority: NOW > NEXT > PAST
  const getStateStyles = () => {
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
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderColor: 'primary.main',
        boxShadow: 2,
      };
    }
    if (isPast) {
      return {
        bgcolor: 'action.hover',
        color: 'text.secondary',
        borderColor: 'divider',
        boxShadow: 'none',
      };
    }
    // Future (not NEXT)
    return {
      bgcolor: 'background.paper',
      color: 'text.primary',
      borderColor: 'divider',
      boxShadow: 'none',
    };
  };
  
  const stateStyles = getStateStyles();
  
  return (
    <Chip
      icon={<AccessTimeIcon sx={{ fontSize: { xs: 12, sm: 14 } }} />}
      label={formatTime(time, timezone)}
      size="small"
      sx={{
        height: { xs: 24, sm: 28 },
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
          px: { xs: 1, sm: 1.5 },
          fontFamily: 'monospace',
        },
        '& .MuiChip-icon': {
          color: 'inherit',
        },
      }}
    />
  );
}, (prevProps, nextProps) => {
  // CRITICAL: Re-render when timezone changes (fixes timezone selector not updating times)
  // Custom comparison prevents unnecessary re-renders but ensures timezone changes update immediately
  return (
    prevProps.time === nextProps.time &&
    prevProps.isPast === nextProps.isPast &&
    prevProps.isNext === nextProps.isNext &&
    prevProps.isNow === nextProps.isNow &&
    prevProps.timezone === nextProps.timezone  // Force re-render when timezone changes
  );
});

TimeChip.displayName = 'TimeChip';

/**
 * Impact Badge - Visual indicator for event impact level
 * Memoized for performance
 */
const ImpactBadge = memo(({ impact }) => {
  const config = getImpactConfig(impact);
  
  return (
    <MuiTooltip title={config.label} arrow placement="top">
      <Chip
        label={config.icon}
        size="small"
        sx={{
          minWidth: 40,
          height: 22,
          bgcolor: config.color,
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
  onInfoClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const impactConfig = getImpactConfig(event.strength || event.Strength);
  
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
      borderColor: 'divider',
      boxShadow: 'none',
      bgcolor: isPast ? alpha(theme.palette.background.paper, 0.7) : 'background.paper',
    };
  };
  
  const stateStyles = getStateStyles();
  
  const card = (
    <Card
      elevation={0}
      sx={{
        border: '2px solid',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        ...stateStyles,
        '&:hover': {
          boxShadow: 4,
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
                color: isPast ? 'text.secondary' : 'text.primary',
                flex: 1,
                minWidth: 0,
              }}
            >
              {event.name || event.Name || 'Unnamed Event'}
            </Typography>
            
            {/* Info Button */}
            <MuiTooltip title="View Details" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => onInfoClick(event)}
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
            <ImpactBadge impact={event.strength || event.Strength} />
            
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
          
          {/* Event Data Values - Always Visible */}
          {(event.actual !== '-' || event.forecast !== '-' || event.previous !== '-') && (() => {
            // Check if event is in the future (has not occurred yet)
            const eventDate = new Date(event.date);
            const now = new Date();
            const isFutureEvent = eventDate.getTime() > now.getTime();
            
            // For future events, ALWAYS show '—' regardless of stored value
            // This is best UX practice - no actual data exists for events that haven't occurred
            let actualValue;
            if (isFutureEvent) {
              actualValue = '—';
            } else {
              // For past events, show actual value or '—' if missing/invalid (including '0')
              const hasValidActual = event.actual && 
                                    event.actual !== '-' && 
                                    event.actual !== '' && 
                                    event.actual !== '0' && 
                                    event.actual !== 0;
              actualValue = hasValidActual ? event.actual : '—';
            }
            
            return (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  gap: { xs: 1, sm: 2 },
                  p: { xs: 1, sm: 1.5 },
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.2),
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
                      color: actualValue !== '—' ? 'primary.main' : 'text.disabled',
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
                    color: event.forecast !== '-' ? 'text.secondary' : 'text.disabled',
                  }}
                >
                  {event.forecast === '-' ? '—' : event.forecast}
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
                    color: event.previous !== '-' ? 'text.secondary' : 'text.disabled',
                  }}
                >
                  {event.previous === '-' ? '—' : event.previous}
                </Typography>
              </Box>
            </Box>
            );
          })()}
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
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.7,
              },
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
        badgeContent="NEXT"
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
            height: { xs: 18, sm: 20 },
            minWidth: { xs: 36, sm: 40 },
            padding: { xs: '0 4px', sm: '0 6px' },
            borderRadius: '12px',
            left: { xs: 4, sm: 6 },
            top: { xs: 4, sm: 6 },
            transform: 'scale(1) translate(-50%, -50%)',
            transformOrigin: '0% 0%',
            boxShadow: 2,
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
const EmptyState = memo(({ showFirstTimeSetup = false }) => {
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

/**
 * EventsTimeline2 - Enterprise-grade timeline component
 * Simplified pagination: always show buttons when more events available
 * Enterprise "Next" event tracking: Updates every 60 seconds (Microsoft Teams/Outlook pattern)
 */
export default function EventsTimeline2({ 
  events = [], 
  loading = false,
  onVisibleCountChange = null,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone, // Default to user's local timezone
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // ========== STATE ==========
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(PAGE_SIZE);
  
  // Track current time for "next" event calculation (updates every 60 seconds)
  // Enterprise pattern: Microsoft Teams/Outlook approach for calendar event tracking
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  
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
   * Visible events (pagination slice)
   */
  const visibleEvents = useMemo(() => {
    return sortedEvents.slice(startIndex, endIndex);
  }, [sortedEvents, startIndex, endIndex]);
  
  /**
   * Pagination flags
   */
  const hasPrevious = startIndex > 0;
  const hasMore = endIndex < sortedEvents.length;
  
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
   * Check if today is within filtered date range
   */
  const isTodayInRange = useMemo(() => {
    if (visibleEvents.length === 0) return false;
    
    const firstEventDate = normalizeDate(new Date(visibleEvents[0].date), timezone);
    const lastEventDate = normalizeDate(new Date(visibleEvents[visibleEvents.length - 1].date), timezone);
    
    return firstEventDate && lastEventDate &&
           today.getTime() >= firstEventDate.getTime() && 
           today.getTime() <= lastEventDate.getTime();
  }, [visibleEvents, today, timezone]);
  
  /**
   * Should show today empty divider
   */
  const shouldShowTodayDivider = !hasTodayEvents && isTodayInRange && todayDividerIndex >= 0;
  
  /**
   * Calculate event states: NOW, NEXT, PAST, FUTURE
   * Recalculates when currentTime updates (every 60 seconds)
   * Enterprise pattern: Efficient multi-state tracking with simultaneous event support
   * 
   * State Priority: NOW > NEXT > FUTURE > PAST
   * 
   * NOW: Within 5 minutes AFTER event time (gives traders time to react)
   * NEXT: First upcoming event(s) - supports multiple simultaneous events
   * FUTURE: Events beyond NEXT
   * PAST: More than 5 minutes after event time
   */
  const eventStates = useMemo(() => {
    const nowIds = new Set();
    const nextIds = new Set();
    let nextEventTime = null;
    
    for (const event of visibleEvents) {
      const eventTime = new Date(event.date).getTime();
      const timeDiff = currentTime - eventTime;
      
      if (timeDiff >= 0 && timeDiff < NOW_WINDOW_MS) {
        // Event happened within last 5 minutes = NOW
        nowIds.add(event.id);
      } else if (eventTime > currentTime) {
        // Future event
        if (nextEventTime === null) {
          // First future event time
          nextEventTime = eventTime;
          nextIds.add(event.id);
        } else if (eventTime === nextEventTime) {
          // Simultaneous event at same time as first future event = also NEXT
          nextIds.add(event.id);
        }
        // else: Later future events (not NEXT)
      }
      // else: Past event (more than 5 minutes ago)
    }
    
    return { nowIds, nextIds };
  }, [visibleEvents, currentTime]);
  
  /**
   * Legacy nextEventIndex for backwards compatibility
   * Returns index of first NEXT event (or -1 if none)
   */
  const nextEventIndex = useMemo(() => {
    if (eventStates.nextIds.size === 0) return -1;
    const firstNextId = Array.from(eventStates.nextIds)[0];
    return visibleEvents.findIndex(e => e.id === firstNextId);
  }, [eventStates, visibleEvents]);
  
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
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  /**
   * Reset pagination when events change, starting from today's position
   */
  useEffect(() => {
    if (sortedEvents.length === 0) {
      setStartIndex(0);
      setEndIndex(PAGE_SIZE);
      return;
    }
    
    // Find today's position in the timeline (timezone-aware)
    const todayStart = normalizeDate(new Date(), timezone);
    
    // Find the first event that is today or in the future
    const todayIndex = sortedEvents.findIndex(event => {
      const eventDate = new Date(event.date);
      return eventDate >= todayStart;
    });
    
    // If today's events found, start FROM today (hide previous initially)
    if (todayIndex >= 0) {
      setStartIndex(todayIndex);
      setEndIndex(Math.min(sortedEvents.length, todayIndex + PAGE_SIZE));
    } else {
      // All events are in the past, show from end
      const startFromEnd = Math.max(0, sortedEvents.length - PAGE_SIZE);
      setStartIndex(startFromEnd);
      setEndIndex(sortedEvents.length);
    }
  }, [sortedEvents, timezone]);

  /**
   * Report visible event count to parent component
   */
  useEffect(() => {
    if (onVisibleCountChange) {
      onVisibleCountChange(visibleEvents.length);
    }
  }, [visibleEvents.length, onVisibleCountChange]);
  
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
   * Load previous events (scroll up)
   * Preserves scroll position - enterprise UX best practice
   */
  const handleLoadPrevious = useCallback(() => {
    // Capture the first currently visible event as anchor
    const firstVisibleEvent = document.querySelector('[data-event-id]');
    const firstEventId = firstVisibleEvent?.getAttribute('data-event-id');
    
    // Capture scroll container and current position
    const scrollContainer = firstVisibleEvent?.closest('[style*="overflow"]') || 
                           document.querySelector('[role="dialog"]') ||
                           window;
    const isWindow = scrollContainer === window;
    
    // Expand upward
    setStartIndex(prev => Math.max(0, prev - PAGE_SIZE));
    
    // After DOM update, restore scroll position
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const anchorElement = document.querySelector(`[data-event-id="${firstEventId}"]`);
        
        if (anchorElement) {
          // Scroll to anchor with center alignment, then offset upward
          anchorElement.scrollIntoView({ 
            behavior: 'instant', 
            block: 'center' 
          });
          
          // Apply offset for optimal viewing position
          if (isWindow) {
            window.scrollBy({ top: -SCROLL_OFFSET, behavior: 'instant' });
          } else {
            scrollContainer.scrollBy({ top: -SCROLL_OFFSET, behavior: 'instant' });
          }
        }
      });
    });
  }, []);
  
  /**
   * Load more events (scroll down)
   * Natural scroll flow
   */
  const handleLoadMore = useCallback(() => {
    setEndIndex(prev => Math.min(sortedEvents.length, prev + PAGE_SIZE));
  }, [sortedEvents.length]);
  
  // ========== RENDER ==========
  
  // Loading state
  if (loading) {
    return <LoadingState />;
  }
  
  // Empty state
  if (events.length === 0) {
    return <EmptyState showFirstTimeSetup={false} />;
  }
  
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 1, sm: 2 }, py: 2 }}>
        {/* Show Previous Button - Always show when more events available */}
        {hasPrevious && (
          <PaginationButton 
            direction="previous" 
            onClick={handleLoadPrevious}
          />
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
          const uniqueKey = event.id || `${event.name || event.Name}-${event.time}-${index}`;
          const isPast = getTimeStatus(event.date, timezone) === 'past';
          const isNow = eventStates.nowIds.has(event.id);
          const isNext = eventStates.nextIds.has(event.id);
          
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
                      isPast={isPast}
                      isNow={isNow}
                      isNext={isNext}
                      timezone={timezone}
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
                    onInfoClick={handleInfoClick}
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
      
      {/* Load More Button - Always show when more events available */}
      {hasMore && (
        <PaginationButton 
          direction="more" 
          onClick={handleLoadMore}
        />
      )}
      </Box>

      {/* Event Details Modal */}
      <EventModal
        open={modalOpen}
        onClose={handleModalClose}
        event={selectedEvent}
        timezone={timezone}
      />
    </Box>
  );
}
