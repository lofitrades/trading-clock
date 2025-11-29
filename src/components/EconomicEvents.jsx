// src/components/EconomicEvents.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  Tooltip,
  CircularProgress,
  Alert,
  AlertTitle,
  Stack,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  getTodayEvents,
  formatEventData,
  sortEventsByTime,
  getImpactColor,
  getImpactBadge,
} from '../utils/newsApi';

/**
 * EconomicEvents Component
 * Displays today's economic events in a table fixed to the right edge
 * Follows enterprise best practices with:
 * - Loading states
 * - Error handling
 * - Collapsible rows for details
 * - Auto-refresh capability
 * - Responsive design
 */
export default function EconomicEvents({ onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Fetch events from API
   */
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    const result = await getTodayEvents();

    if (result.success) {
      // Format and sort events
      const formattedEvents = result.data.map(formatEventData);
      const sortedEvents = sortEventsByTime(formattedEvents);
      setEvents(sortedEvents);
      setLastUpdated(new Date());
    } else {
      // Show detailed error message
      console.error('Failed to fetch events:', result.error);
      setError(result.error);
    }

    setLoading(false);
  };

  /**
   * Initial fetch on component mount
   */
  useEffect(() => {
    fetchEvents();
  }, []);

  /**
   * Toggle row expansion
   */
  const handleRowToggle = (eventId) => {
    setExpandedRow(expandedRow === eventId ? null : eventId);
  };

  /**
   * Memoized event list to avoid unnecessary re-renders
   */
  const eventList = useMemo(() => events, [events]);

  /**
   * Get time status (past/upcoming)
   */
  const getTimeStatus = (dateTime) => {
    if (!dateTime) return 'unknown';
    const now = new Date();
    return dateTime < now ? 'past' : 'upcoming';
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: { xs: '100%', sm: 380, md: 420 },
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1200,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            Today's Events
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Refresh">
            <span>
              <IconButton
                onClick={fetchEvents}
                disabled={loading}
                sx={{ color: 'white' }}
                size="small"
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton
              onClick={onClose}
              sx={{ color: 'white', ml: 0.5 }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Last Updated Info */}
      {lastUpdated && !loading && (
        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1, bgcolor: 'background.default' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', pb: 2 }}>
        {/* Loading State */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading events...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Alert severity="error">
              <AlertTitle>Error Loading Events</AlertTitle>
              {error}
              <Box sx={{ mt: 2, fontSize: '0.875rem' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Possible solutions:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2, m: 0 }}>
                  <li>Verify your API key is correct in the .env file</li>
                  <li>Check your internet connection</li>
                  <li>The API service may be temporarily unavailable</li>
                  <li>Check browser console for detailed error messages</li>
                </Typography>
              </Box>
            </Alert>
          </Box>
        )}

        {/* Empty State */}
        {!loading && !error && eventList.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 1,
              p: 3,
            }}
          >
            <AccessTimeIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary">
              No Events Today
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              There are no economic events scheduled for today.
            </Typography>
          </Box>
        )}

        {/* Events Timeline */}
        {!loading && !error && eventList.length > 0 && (
          <Timeline
            position="right"
            sx={{
              p: 0,
              m: 0,
              '& .MuiTimelineItem-root': {
                minHeight: 'auto',
              },
              '& .MuiTimelineItem-root:before': {
                display: 'none',
              },
            }}
          >
            {eventList.map((event, index) => {
              const uniqueKey = event.id || `${event.name}-${event.time}-${index}`;
              const isExpanded = expandedRow === uniqueKey;
              const timeStatus = getTimeStatus(event.dateTime);
              const isPast = timeStatus === 'past';
              const isLast = index === eventList.length - 1;

              return (
                <TimelineItem key={uniqueKey}>
                  {/* Time on the left */}
                  <TimelineOppositeContent
                    sx={{
                      flex: 0,
                      minWidth: { xs: 50, sm: 60 },
                      maxWidth: { xs: 50, sm: 60 },
                      py: 0,
                      px: { xs: 0.5, sm: 1 },
                      pt: 1.5,
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={isPast ? 'text.secondary' : 'primary.main'}
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {event.time}
                    </Typography>
                  </TimelineOppositeContent>

                  {/* Dot and connector */}
                  <TimelineSeparator>
                    <TimelineDot
                      sx={{
                        bgcolor: getImpactColor(event.impact),
                        width: { xs: 12, sm: 14 },
                        height: { xs: 12, sm: 14 },
                        m: 0,
                        mt: 2,
                        boxShadow: isPast ? 'none' : 2,
                        opacity: isPast ? 0.5 : 1,
                      }}
                    />
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
                      onClick={() => handleRowToggle(uniqueKey)}
                    >
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                        {/* Header: Currency + Impact */}
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 1 }}
                        >
                          <Chip
                            label={event.currency}
                            size="small"
                            sx={{
                              height: { xs: 20, sm: 22 },
                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                              fontWeight: 700,
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText',
                            }}
                          />
                          <Chip
                            label={getImpactBadge(event.impact)}
                            size="small"
                            sx={{
                              height: { xs: 20, sm: 22 },
                              minWidth: { xs: 24, sm: 28 },
                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                              fontWeight: 700,
                              bgcolor: getImpactColor(event.impact),
                              color: 'white',
                            }}
                          />
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
                          {event.name}
                        </Typography>

                        {/* Expanded Details */}
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Divider sx={{ my: 1.5 }} />
                          
                          {/* Data Grid */}
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: { xs: 1, sm: 1.5 },
                              mb: event.category ? 1.5 : 0,
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
                                {event.actual}
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
                                {event.forecast}
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
                                {event.previous}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Category */}
                          {event.category && (
                            <Box
                              sx={{
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                p: 1,
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
                                {event.category}
                              </Typography>
                            </Box>
                          )}
                        </Collapse>
                      </CardContent>
                    </Card>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </Box>

      {/* Footer - Event Count */}
      {!loading && !error && eventList.length > 0 && (
        <Box
          sx={{
            p: 1.5,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {eventList.length} {eventList.length === 1 ? 'event' : 'events'} today
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
