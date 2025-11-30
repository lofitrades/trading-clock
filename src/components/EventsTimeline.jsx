/**
 * src/components/EventsTimeline.jsx
 * 
 * Purpose: Displays economic events in a timeline format with collapsible details
 * Shows event descriptions from economicEventDescriptions collection when expanded
 * 
 * Changelog:
 * v1.6.2 - 2025-11-30 - Today divider only shows if today is within filtered date range
 * v1.6.1 - 2025-11-30 - Added scroll position preservation for Show Previous (enterprise UX best practice)
 * v1.6.0 - 2025-11-30 - Removed auto-scroll, Show Previous button always at top of timeline
 * v1.5.0 - 2025-11-30 - Show Previous button moved above Today divider, starts from today (hides past initially)
 * v1.4.1 - 2025-11-30 - Auto-scroll now anchors to Today divider for better visibility
 * v1.4.0 - 2025-11-30 - Removed Quick Select sections, added auto-scroll to today's first event
 * v1.3.0 - 2025-11-30 - Infinite vertical pagination: centers today with equal buffer both sides
 * v1.2.0 - 2025-11-30 - Added smart pagination that starts from today's position with context
 * v1.1.0 - 2025-11-30 - Added bidirectional pagination (Load Previous/More) with scroll preservation
 * v1.0.0 - 2025-11-29 - Initial implementation with description integration
 */

import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  Tooltip,
  Badge,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { getImpactColor, getImpactBadge } from '../utils/newsApi';
import { getEventDescription } from '../services/economicEventsService';

/**
 * Get time status (past/upcoming)
 */
const getTimeStatus = (dateTime) => {
  if (!dateTime) return 'unknown';
  const now = new Date();
  return dateTime < now ? 'past' : 'upcoming';
};

/**
 * Get outcome icon based on event outcome
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
 * Get impact icon based on impact level
 * !!! = High, !! = Medium, ! = Low, ? = Unknown, ~ = Non-Economic/None
 */
const getImpactIcon = (impact) => {
  const impactStr = impact || '';
  const lower = impactStr.toLowerCase();
  
  if (lower.includes('strong') || lower.includes('high')) {
    return '!!!';
  }
  if (lower.includes('moderate') || lower.includes('medium')) {
    return '!!';
  }
  if (lower.includes('weak') || lower.includes('low')) {
    return '!';
  }
  if (lower.includes('non-economic') || lower.includes('none')) {
    return '~';
  }
  return '?'; // Unknown or Data Not Loaded
};

/**
 * Map currency codes to country ISO codes for flag-icons
 * Loaded once, reused for all events
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
 * Get country code for currency (memoized)
 */
const getCurrencyFlag = (currency) => {
  if (!currency) return null;
  const countryCode = CURRENCY_TO_COUNTRY[currency.toUpperCase()];
  return countryCode || null;
};

/**
 * EventsTimeline Component
 * Displays economic events in a timeline with expandable details
 */
export default function EventsTimeline({ events, loading, hasAppliedFilters, onQuickDateSelect, showQuickSelect = false }) {
  const [expandedRow, setExpandedRow] = useState(null);
  const [eventDescriptions, setEventDescriptions] = useState({});
  const [loadingDescriptions, setLoadingDescriptions] = useState({});
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(10);
  const [loadMoreAnchor, setLoadMoreAnchor] = useState(null);
  const PAGE_SIZE = 20;

  // Sort events by date (oldest first - ascending order)
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB; // Ascending order (oldest first)
  });

  // Get visible events (slice from startIndex to endIndex)
  const visibleEvents = sortedEvents.slice(startIndex, endIndex);
  const hasMore = endIndex < sortedEvents.length;
  const hasPrevious = startIndex > 0;

  // Reset pagination when filters change, but start from today's position
  useEffect(() => {
    console.log('🔄 [EventsTimeline] Pagination effect triggered', {
      eventsLength: sortedEvents.length,
      startIndex,
      endIndex,
      hasPrevious
    });

    if (sortedEvents.length === 0) {
      setStartIndex(0);
      setEndIndex(10);
      return;
    }

    // Find today's position in the timeline
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find the first event that is today or in the future
    const todayIndex = sortedEvents.findIndex(event => {
      const eventDate = new Date(event.date);
      return eventDate >= todayStart;
    });

    console.log('📍 [EventsTimeline] Today index found:', todayIndex, 'Total events:', sortedEvents.length);

    // If today's events found, start FROM today (hide previous events initially)
    if (todayIndex >= 0) {
      // Start from today, show PAGE_SIZE events forward
      const contextStart = todayIndex;
      const contextEnd = Math.min(sortedEvents.length, contextStart + PAGE_SIZE);
      
      console.log('✅ [EventsTimeline] Starting from today (previous events hidden initially):', { 
        todayIndex,
        contextStart,
        contextEnd,
        eventsBeforeToday: todayIndex,
        willShowPreviousButton: todayIndex > 0,
        willShowMoreButton: contextEnd < sortedEvents.length
      });
      
      setStartIndex(contextStart);
      setEndIndex(contextEnd);
    } else {
      // All events are in the past, show the last page
      const lastPageStart = Math.max(0, sortedEvents.length - PAGE_SIZE);
      console.log('⏮️ [EventsTimeline] All past events, setting to last page:', { lastPageStart, endIndex: sortedEvents.length });
      setStartIndex(lastPageStart);
      setEndIndex(sortedEvents.length);
    }
  }, [sortedEvents.length, PAGE_SIZE]);

  /**
   * Toggle row expansion and fetch description if needed
   */
  const handleRowToggle = async (eventId, eventName, category) => {
    const newExpandedRow = expandedRow === eventId ? null : eventId;
    setExpandedRow(newExpandedRow);

    // Fetch description if expanding and not already loaded
    if (newExpandedRow && !eventDescriptions[eventId]) {
      setLoadingDescriptions(prev => ({ ...prev, [eventId]: true }));
      
      const result = await getEventDescription(eventName, category);
      
      if (result.success && result.data) {
        setEventDescriptions(prev => ({
          ...prev,
          [eventId]: result.data,
        }));
      }
      
      setLoadingDescriptions(prev => ({ ...prev, [eventId]: false }));
    }
  };

  /**
   * Load previous events (scroll up)
   * Preserves scroll position so today's events don't move
   * Enterprise UX: User stays focused on current view while previous events load above
   */
  const handleLoadPrevious = () => {
    // Capture the first currently visible event as anchor
    const firstVisibleEvent = document.querySelector('[data-event-id]');
    const firstEventId = firstVisibleEvent?.getAttribute('data-event-id');
    
    // Also capture the scroll container and current scroll position
    const scrollContainer = firstVisibleEvent?.closest('[style*="overflow"]') || 
                           document.querySelector('[role="dialog"]') ||
                           window;
    const isWindow = scrollContainer === window;
    const currentScrollTop = isWindow ? window.scrollY : scrollContainer.scrollTop;
    
    // Expand upward
    setStartIndex(prev => Math.max(0, prev - PAGE_SIZE));
    setEndIndex(prev => prev); // Keep endIndex, expand upward
    
    // After DOM update, restore scroll position to keep today's events in place
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (firstEventId) {
          // Find the same event after render
          const anchorElement = document.querySelector(`[data-event-id="${firstEventId}"]`);
          if (anchorElement) {
            // Scroll to maintain the anchor element, but offset it slightly down in viewport
            // This keeps today's events visible while showing some previous events above
            anchorElement.scrollIntoView({ block: 'center', behavior: 'instant' });
            
            // Fine-tune: scroll up a bit to show more previous events
            // Offset by ~150px to keep today visible but not at the very top
            const offset = 150;
            if (isWindow) {
              window.scrollBy({ top: -offset, behavior: 'instant' });
            } else {
              scrollContainer.scrollTop -= offset;
            }
          }
        } else {
          // Fallback: restore exact scroll position
          if (isWindow) {
            window.scrollTo({ top: currentScrollTop, behavior: 'instant' });
          } else {
            scrollContainer.scrollTop = currentScrollTop;
          }
        }
      });
    });
  };

  /**
   * Load more events (scroll down)
   * Maintains natural scroll flow
   */
  const handleLoadMore = () => {
    setEndIndex(prev => Math.min(sortedEvents.length, prev + PAGE_SIZE));
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: 2,
          py: 4,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading events...
        </Typography>
      </Box>
    );
  }

  // Empty state - Only show when there are no events AND not showing today's default view
  if (events.length === 0 && !showQuickSelect) {
    return (
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
        
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'info.light',
            borderRadius: 1,
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
      </Box>
    );
  }

  // Show Quick Select section when viewing today with no events
  if (events.length === 0 && showQuickSelect && onQuickDateSelect) {
    return (
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
        {/* Today Divider */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            mb: 2,
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
              label={`Today - ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}`}
              size="small"
              sx={{
                mx: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 700,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                border: '1px solid',
                borderColor: 'primary.dark',
                boxShadow: 2,
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
              mb: 3,
            }}
          >
            No events scheduled for today
          </Typography>
        </Box>

      </Box>
    );
  }

  // Check if today divider should be shown
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const hasTodayEvents = visibleEvents.some(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === today.getTime();
  });

  // Find where today divider should be inserted (chronologically)
  const todayDividerIndex = visibleEvents.findIndex(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() >= today.getTime();
  });

  // Check if today is within the filtered date range
  const isTodayInRange = visibleEvents.length > 0 && (() => {
    const firstEventDate = new Date(visibleEvents[0].date);
    firstEventDate.setHours(0, 0, 0, 0);
    const lastEventDate = new Date(visibleEvents[visibleEvents.length - 1].date);
    lastEventDate.setHours(0, 0, 0, 0);
    
    return today.getTime() >= firstEventDate.getTime() && 
           today.getTime() <= lastEventDate.getTime();
  })();

  // Only show today divider if today is in the filtered range but has no events
  const shouldShowTodayDivider = !hasTodayEvents && isTodayInRange && todayDividerIndex >= 0;

  // Find the next upcoming event (first future event)
  const now = new Date();
  const nextEventIndex = visibleEvents.findIndex(event => new Date(event.date) > now);

  console.log('🎯 [EventsTimeline] Render state:', {
    startIndex,
    endIndex,
    hasPrevious,
    hasMore,
    visibleEventsCount: visibleEvents.length,
    totalEvents: sortedEvents.length
  });

  return (
    <>
    {/* Show Previous Events Button - At top of timeline */}
    {hasPrevious && (
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
          variant="outlined"
          onClick={handleLoadPrevious}
          startIcon={<ExpandLessIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            },
          }}
        >
          Show Previous Events
        </Button>
      </Box>
    )}

    <Timeline
      position="right"
      sx={{
        p: 0,
        pt: 2,
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
        const uniqueKey = event.id || `${event.Name}-${event.time}-${index}`;
        const isExpanded = expandedRow === uniqueKey;
        const timeStatus = getTimeStatus(event.date);
        const isPast = timeStatus === 'past';
        const isLast = index === visibleEvents.length - 1;
        const isNextEvent = index === nextEventIndex;
        const description = eventDescriptions[uniqueKey];
        const loadingDesc = loadingDescriptions[uniqueKey];

        // Check if this is the start of a new day
        const currentDate = new Date(event.date);
        const prevEvent = index > 0 ? visibleEvents[index - 1] : null;
        const prevDate = prevEvent ? new Date(prevEvent.date) : null;
        const isNewDay = index === 0 || (prevDate && currentDate.toDateString() !== prevDate.toDateString());
        
        // Check if this is today
        const todayDate = new Date();
        const isToday = currentDate.toDateString() === todayDate.toDateString();

        // Check if we should show "Today" divider before this event (when there are no events today)
        const showTodayDividerHere = shouldShowTodayDivider && index === todayDividerIndex;

        return (
          <React.Fragment key={uniqueKey}>
            {/* Today Divider (when no events today) */}
            {showTodayDividerHere && (
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
                    label={`Today - ${todayDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}`}
                    size="small"
                    sx={{
                      mx: 2,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      fontWeight: 700,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      border: '1px solid',
                      borderColor: 'primary.dark',
                      boxShadow: 2,
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
                  }}
                >
                  No events scheduled for today
                </Typography>
              </Box>
            )}

            {/* Day Divider */}
            {isNewDay && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: index === 0 ? 1 : 3,  // Less margin-top for first divider (after Show Previous button)
                  mb: 3,
                  px: 2,
                }}
              >
                <Divider 
                  sx={{ 
                    flex: 1,
                    borderColor: isToday ? 'primary.main' : 'divider',
                    borderWidth: isToday ? 2 : 1,
                  }} 
                />
                <Chip
                  label={isToday 
                    ? `Today - ${currentDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}`
                    : currentDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })
                  }
                  size="small"
                  sx={{
                    mx: 2,
                    bgcolor: isToday ? 'primary.main' : 'background.paper',
                    color: isToday ? 'primary.contrastText' : 'text.secondary',
                    fontWeight: isToday ? 700 : 600,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    border: '1px solid',
                    borderColor: isToday ? 'primary.dark' : 'divider',
                    boxShadow: isToday ? 2 : 'none',
                  }}
                />
                <Divider 
                  sx={{ 
                    flex: 1,
                    borderColor: isToday ? 'primary.main' : 'divider',
                    borderWidth: isToday ? 2 : 1,
                  }} 
                />
              </Box>
            )}

            <TimelineItem 
              data-event-id={uniqueKey}
            >
            {/* Empty space on the left */}
            <TimelineOppositeContent
              sx={{
                flex: 0,
                display: 'none',
              }}
            />

            {/* Time chip */}
            <TimelineSeparator>
              <Box sx={{ pl: { xs: 1.5, sm: 2 } }}>
                {isNextEvent ? (
                  <Badge
                    badgeContent="Next"
                    color="primary"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: { xs: '0.6rem', sm: '0.65rem' },
                        fontWeight: 700,
                        height: { xs: 16, sm: 18 },
                        minWidth: { xs: 32, sm: 36 },
                        borderRadius: '10px',
                        right: -6,
                        top: 2,
                      },
                    }}
                  >
                    <Chip
                      label={event.time || new Date(event.date).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })}
                      size="small"
                      sx={{
                        height: { xs: 24, sm: 28 },
                        fontSize: { xs: '0.7rem', sm: '0.8rem' },
                        fontWeight: 600,
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        border: '2px solid',
                        borderColor: 'primary.main',
                        boxShadow: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: 3,
                          transform: 'translateY(-1px)',
                        },
                        '& .MuiChip-label': {
                          px: { xs: 1, sm: 1.5 },
                          fontFamily: 'monospace',
                        },
                      }}
                    />
                  </Badge>
                ) : (
                  <Chip
                    label={event.time || new Date(event.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                    size="small"
                    sx={{
                      height: { xs: 24, sm: 28 },
                      fontSize: { xs: '0.7rem', sm: '0.8rem' },
                      fontWeight: 600,
                      bgcolor: isPast ? 'action.hover' : 'background.paper',
                      color: isPast ? 'text.secondary' : 'text.primary',
                      border: '2px solid',
                      borderColor: 'divider',
                      boxShadow: isPast ? 'none' : 1,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: isPast ? 1 : 2,
                        transform: 'translateY(-1px)',
                      },
                      '& .MuiChip-label': {
                        px: { xs: 1, sm: 1.5 },
                        fontFamily: 'monospace',
                      },
                    }}
                  />
                )}
              </Box>
              {!isLast && (
                <TimelineConnector
                  sx={{
                    bgcolor: 'divider',
                    opacity: 0.3,
                  }}
                />
              )}
            </TimelineSeparator>

            {/* Event Card */}
            <TimelineContent sx={{ py: 0, px: { xs: 1, sm: 1.5 }, pb: 2 }}>
              <Card
                elevation={isPast ? 0 : 1}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: isPast ? 0.6 : 1,
                  bgcolor: isPast ? 'action.hover' : 'background.paper',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                }}
                onClick={() => handleRowToggle(uniqueKey, event.Name, event.Category)}
              >
                <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                  {/* Header: Currency + Impact + Outcome */}
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Chip
                      icon={
                        getCurrencyFlag(event.Currency || event.currency) ? (
                          <span 
                            className={`fi fi-${getCurrencyFlag(event.Currency || event.currency)}`}
                            style={{ 
                              width: 16, 
                              height: 16,
                              display: 'inline-block',
                              borderRadius: '50%',
                              overflow: 'hidden'
                            }}
                          />
                        ) : undefined
                      }
                      label={event.Currency || event.currency}
                      size="small"
                      sx={{
                        height: { xs: 20, sm: 22 },
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        fontWeight: 700,
                        bgcolor: 'action.hover',
                        color: 'text.primary',
                        border: '1px solid',
                        borderColor: 'divider',
                        '& .MuiChip-icon': {
                          marginLeft: '4px',
                          marginRight: '-2px',
                        },
                      }}
                    />
                    <Tooltip 
                      title={event.enrichedFromDescription 
                        ? `Impact level from event description (estimated)` 
                        : 'Impact level'
                      }
                      arrow
                      placement="top"
                    >
                      <Chip
                        label={getImpactIcon(event.strength || event.Strength || event.impact)}
                        size="small"
                        sx={{
                          height: { xs: 20, sm: 22 },
                          minWidth: { xs: 26, sm: 30 },
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                          fontWeight: 700,
                          bgcolor: getImpactColor(event.strength || event.Strength || event.impact),
                          color: 'white',
                          opacity: event.enrichedFromDescription ? 0.85 : 1,
                          border: event.enrichedFromDescription ? '1px dashed rgba(255,255,255,0.5)' : 'none',
                          '& .MuiChip-label': {
                            px: { xs: 0.5, sm: 0.75 },
                          },
                        }}
                      />
                    </Tooltip>
                    {event.Outcome && (
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
                        {getOutcomeIcon(event.Outcome)}
                      </Box>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <IconButton size="small" sx={{ p: 0 }}>
                      {isExpanded ? (
                        <ExpandLessIcon fontSize="small" />
                      ) : (
                        <ExpandMoreIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Stack>

                  {/* Event Name */}
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                      mb: isExpanded ? 1.5 : 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {event.Name || event.name}
                  </Typography>

                  {/* Expanded Details */}
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Divider sx={{ my: 1.5 }} />
                    
                    {/* Data Grid - Actual, Forecast, Previous */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: { xs: 1, sm: 1.5 },
                        mb: 1.5,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        >
                          Actual
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                        >
                          {isPast 
                            ? (event.Actual ?? event.actual ?? '—')
                            : '—'
                          }
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        >
                          Forecast
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                        >
                          {event.Forecast ?? event.forecast ?? '—'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        >
                          Previous
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                        >
                          {event.Previous ?? event.previous ?? '—'}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Category */}
                    {event.Category && (
                      <Box
                        sx={{
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          p: 1,
                          mb: 1.5,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        >
                          Category
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                        >
                          {event.Category}
                        </Typography>
                      </Box>
                    )}

                    {/* Event Description (from economicEventDescriptions) */}
                    {loadingDesc && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    )}
                    
                    {!loadingDesc && description && (
                      <Box
                        sx={{
                          borderTop: '1px solid',
                          borderColor: 'divider',
                          pt: 1.5,
                          mt: 1.5,
                        }}
                      >
                        <Stack spacing={1.5}>
                          {/* Description */}
                          {description.description && (
                            <Box>
                              <Typography
                                variant="caption"
                                fontWeight={700}
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                }}
                              >
                                About
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ 
                                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                                  mt: 0.5,
                                  lineHeight: 1.5,
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
                                variant="caption"
                                fontWeight={700}
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                }}
                              >
                                Trading Implication
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ 
                                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                                  mt: 0.5,
                                  lineHeight: 1.5,
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
                                variant="caption"
                                fontWeight={700}
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.5,
                                  mb: 0.5,
                                  display: 'block',
                                }}
                              >
                                Key Thresholds
                              </Typography>
                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                  gap: 0.5,
                                }}
                              >
                                {Object.entries(description.keyThresholds).map(([key, value]) => (
                                  <Box key={key}>
                                    <Typography
                                      variant="caption"
                                      sx={{ 
                                        fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                        textTransform: 'capitalize',
                                      }}
                                    >
                                      {key}:
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                    >
                                      {value}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}

                          {/* Release Info */}
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                              gap: 1,
                              pt: 1,
                              borderTop: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            {description.frequency && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
                                >
                                  Frequency
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                >
                                  {description.frequency}
                                </Typography>
                              </Box>
                            )}
                            {description.source && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
                                >
                                  Source
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                >
                                  {description.source}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Stack>
                      </Box>
                    )}
                  </Collapse>
                </CardContent>
              </Card>
            </TimelineContent>
          </TimelineItem>
          </React.Fragment>
        );
      })}
    </Timeline>

    {/* Today Divider (when all events are in the past) */}
    {shouldShowTodayDivider && todayDividerIndex === -1 && (
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
            label={`Today - ${today.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}`}
            size="small"
            sx={{
              mx: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 700,
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              border: '1px solid',
              borderColor: 'primary.dark',
              boxShadow: 2,
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
          }}
        >
          No events scheduled for today
        </Typography>
      </Box>
    )}

    {/* Load More Button */}
    {hasMore && (
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
          variant="outlined"
          onClick={handleLoadMore}
          startIcon={<ExpandMoreIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            },
          }}
        >
          Load More Events
        </Button>
      </Box>
    )}
  </>
  );
}
