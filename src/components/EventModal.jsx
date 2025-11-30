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
  Divider,
  Skeleton,
  Fade,
  Slide,
  useTheme,
  useMediaQuery,
  alpha,
  Tooltip as MuiTooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { getEventDescription } from '../services/economicEventsService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
    color: 'error.main', 
    label: 'High Impact',
    description: 'Major market-moving event that typically causes significant volatility and price action'
  },
  moderate: { 
    icon: '!!', 
    color: 'warning.main', 
    label: 'Medium Impact',
    description: 'Notable event that can influence market direction with moderate price movements'
  },
  weak: { 
    icon: '!', 
    color: 'info.main', 
    label: 'Low Impact',
    description: 'Minor event with limited market impact and minimal expected volatility'
  },
  'non-economic': { 
    icon: '~', 
    color: 'grey.500', 
    label: 'Non-Economic',
    description: 'Non-economic event or announcement with indirect market influence'
  },
  unknown: { 
    icon: '?', 
    color: 'grey.500', 
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
 * Format time in 24-hour format
 */
const formatTime = (date) => {
  if (!date) return 'N/A';
  
  // If already a time string (HH:MM format), return it
  if (typeof date === 'string' && /^\d{2}:\d{2}/.test(date)) {
    return date;
  }
  
  // Otherwise format the date
  const dateObj = new Date(date);
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

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
 */
export default function EventModal({ open, onClose, event }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const fullScreen = isMobile;

  // State
  const [description, setDescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshingEvent, setRefreshingEvent] = useState(false);
  const [refreshedEvent, setRefreshedEvent] = useState(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

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
        console.log('✅ Event refreshed from Firestore:', updatedEvent);
        
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

  // Check if event is in the future
  const eventDate = new Date(currentEvent.date);
  const now = new Date();
  const isFutureEvent = eventDate.getTime() > now.getTime();
  const isPast = !isFutureEvent;

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

  const impactConfig = getImpactConfig(currentEvent.strength);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      TransitionComponent={SlideTransition}
      TransitionProps={{ timeout: ANIMATION_DURATION.slide }}
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
                {formatDate(currentEvent.date)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                {formatTime(currentEvent.time || currentEvent.date)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            color: 'primary.contrastText',
            flexShrink: 0,
            '&:hover': {
              bgcolor: alpha('#fff', 0.1),
            },
          }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
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
        ) : (
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
                    <ImpactBadge impact={currentEvent.strength} />
                    
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
                    
                    {isPast && (
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
            {description?.outcome && (
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    {getOutcomeIcon(description.outcome)}
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
                        {description.outcome}
                      </Typography>
                    </Box>
                  </Box>
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
        }}
      >
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth={isMobile}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
