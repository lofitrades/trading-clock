/**
 * src/components/EventsPage.jsx
 * 
 * Purpose: Main events page for the economic events table with advanced filtering, sorting, pagination, search, and export.
 * 
 * Key Features:
 * - EventsFilters3 for advanced filtering with search
 * - Client-side search filtering across event name, currency, description, and category
 * - Smart data loading (2 weeks on mount, expand based on filters)
 * - 1-year max date range validation
 * - Export functionality (CSV + JSON)
 * - Mobile responsive with card view toggle
 * - URL parameter sync for shareable links
 * - Keyboard navigation and accessibility
 * 
 * Changelog:
 * v1.6.0 - 2026-01-06 - Removed timeline view; simplified to table-only layout and cleaned shareable view param handling.
 * v1.5.0 - 2025-12-22 - Added Helmet-based metadata with noindex robots and updated events workspace copy.
 * v1.4.3 - 2025-12-22 - Locked events page behind authentication (RBAC guard + tab value hardening).
 * v1.4.2 - 2025-12-18 - Removed unused schema/breadcrumb metadata and moved title/description update into component to resolve lint errors post-Helmet removal.
 * v1.4.1 - 2025-12-17 - Fixed JSX fragment closing to resolve parsing errors and TypeScript diagnostics.
 * v1.4.0 - 2025-12-15 - Added client-side search filtering (searches name, currency, description, category) with UX messages for no results.
 * v1.3.1 - 2025-12-11 - Make filters full-width in drawer/embedded mode to remove unused background space.
 * v1.3.2 - 2025-12-11 - Flatten gaps in embedded drawer by using flex column spacing instead of stacked margins.
 * v1.3.0 - 2025-12-11 - Swapped to chip-based dropdown filter bar (EventsFilters3) for faster edits with mandatory date preset.
 * v1.2.8 - 2025-12-11 - Today/refresh ranges now use timezone-correct day boundaries to avoid early cutoffs.
 * v1.2.7 - 2025-12-09 - Filters in compact mode now occupy full viewport height when expanded for maximum usability
 * v1.2.6 - 2025-12-09 - Remove unnecessary filter scrolling on large screens; keep sticky clamp only on smaller viewports
 * v1.2.5 - 2025-12-09 - Header and tabs now scroll with the page; only filters stay fixed in compact mode
 * v1.2.4 - 2025-12-09 - Sticky filters now span full viewport width and pin to the top in compact mode
 * v1.2.3 - 2025-12-09 - Added autoScrollToNextKey prop to allow drawer to auto-scroll timeline to next event
 * v1.2.2 - 2025-12-09 - Header event count now reflects visible timeline items (pagination aware via onVisibleCountChange)
 * v1.2.1 - 2025-12-09 - Added hideBackButton option for embedded/full-width drawer usage
 * v1.2.0 - 2025-12-09 - Moved sync controls to /events header (initial sync + multi-source calendar) and kept drawer timeline-only
 * v1.1.1 - 2025-12-09 - Embedded drawer shows timeline only (no tabs/table) to maximize vertical space
 * v1.1.0 - 2025-12-08 - Added embedded mode: forwardRef for refresh control, skip URL updates, hide header, adjust container styling for drawer integration
 * v1.0.2 - 2025-12-08 - Added comprehensive source-tracking logging to fetchEvents, handleRefresh, and newsSource useEffect for better debugging
 * v1.0.1 - 2025-12-08 - Fixed initial date range: always use fresh Date() dynamically, added current date logging for debugging
 * v1.0.0 - 2025-12-08 - Initial implementation
 */

import React, { useState, useEffect, useMemo, useCallback, useImperativeHandle, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Container,
  Typography,
  Paper,
  IconButton,
  Tooltip as MuiTooltip,
  Alert,
  AlertTitle,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventsTable from './EventsTable';
import EventsFilters3 from './EventsFilters3.jsx';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { getEventsByDateRange } from '../services/economicEventsService';
import { sortEventsByTime } from '../utils/newsApi';
import { getDatePartsInTimezone, getUtcDateForTimezone } from '../utils/dateUtils';
import SEO from './SEO';
import { buildSeoMeta } from '../utils/seoMeta';

const MAX_DATE_RANGE_DAYS = 365; // 1 year maximum

const EVENTS_DESCRIPTION = 'Explore high-impact economic events with timezone-aware table view, synced to your trading sessions in Time 2 Trade.';
const EVENTS_KEYWORDS = 'economic events calendar, forex news, futures news, market events, trading calendar, forex factory alternative, mql5 news';

const eventsMeta = buildSeoMeta({
  title: 'Economic Events Table | Filter by Impact & Currency — Time 2 Trade',
  description: EVENTS_DESCRIPTION,
  path: '/events',
  keywords: EVENTS_KEYWORDS,
  robots: 'noindex,follow',
});

const EventsPage = React.forwardRef(({ embedded = false, onEventsUpdate, hideBackButton = false, autoScrollToNextKey = null, compactMode = false }, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { eventFilters, newsSource, selectedTimezone } = useSettings();
  const { user, loading: authLoading } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [filters, setFilters] = useState(() => {
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    return {
      startDate: startDateParam ? new Date(startDateParam) : (eventFilters.startDate || null),
      endDate: endDateParam ? new Date(endDateParam) : (eventFilters.endDate || null),
      impacts: eventFilters.impacts || [],
      eventTypes: eventFilters.eventTypes || [],
      currencies: eventFilters.currencies || [],
      searchQuery: eventFilters.searchQuery || '',
    };
  });

  const hasInitializedRef = useRef(false);
  const previousNewsSourceRef = useRef(newsSource);

  const applySearchFilter = useCallback((eventsToFilter, searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') {
      return eventsToFilter;
    }

    const query = searchQuery.toLowerCase().trim();

    return eventsToFilter.filter((event) => {
      const name = (event.name || event.Name || event.title || event.Title || '').toLowerCase();
      if (name.includes(query)) return true;

      const currency = (event.currency || event.Currency || '').toLowerCase();
      if (currency.includes(query)) return true;

      const description = (event.description || event.Description || event.summary || event.Summary || '').toLowerCase();
      if (description.includes(query)) return true;

      return false;
    });
  }, []);

  const buildTodayRange = useCallback(() => {
    const { year, month, day } = getDatePartsInTimezone(selectedTimezone);
    const startDate = getUtcDateForTimezone(selectedTimezone, year, month, day);
    const endDate = getUtcDateForTimezone(selectedTimezone, year, month, day, { endOfDay: true });
    return { startDate, endDate };
  }, [selectedTimezone]);

  const filteredEvents = useMemo(() => applySearchFilter(events, filters.searchQuery), [events, filters.searchQuery, applySearchFilter]);

  const fetchEvents = useCallback(async (filtersToUse = null) => {
    const activeFilters = filtersToUse || filters;

    if (!activeFilters.startDate || !activeFilters.endDate) {
      setLoading(false);
      setError('Please select a date range to view events.');
      return;
    }

    const daysDiff = Math.ceil(
      (activeFilters.endDate - activeFilters.startDate) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff > MAX_DATE_RANGE_DAYS) {
      setError(`Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days (1 year). Current range: ${daysDiff} days.`);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getEventsByDateRange(
        activeFilters.startDate,
        activeFilters.endDate,
        {
          source: newsSource,
          impacts: activeFilters.impacts,
          eventTypes: activeFilters.eventTypes,
          currencies: activeFilters.currencies,
        }
      );

      if (result.success) {
        const sortedEvents = sortEventsByTime(result.data);
        const updatedTime = new Date();

        setEvents(sortedEvents);
        setLastUpdated(updatedTime);

        if (onEventsUpdate) {
          onEventsUpdate(sortedEvents.length, updatedTime);
        }
      } else {
        console.error('❌ [EventsPage] Failed to load events:', result.error);
        setError(result.error || 'Failed to load events');
        setEvents([]);
      }
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      setError(err.message || 'An unexpected error occurred');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filters, newsSource, onEventsUpdate]);

  const shouldRenderSeo = !embedded;

  useEffect(() => {
    if (hasInitializedRef.current) return;

    if (!filters.startDate || !filters.endDate) {
      const { startDate, endDate } = buildTodayRange();
      const newFilters = { ...filters, startDate, endDate };
      setFilters(newFilters);
      fetchEvents(newFilters);
    } else {
      fetchEvents();
    }
    hasInitializedRef.current = true;
  }, [buildTodayRange, fetchEvents, filters]);

  useEffect(() => {
    if (!filters.startDate || !filters.endDate) return;
    if (previousNewsSourceRef.current !== newsSource) {
      previousNewsSourceRef.current = newsSource;
      fetchEvents();
    }
  }, [fetchEvents, filters.endDate, filters.startDate, newsSource]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);

    if (!embedded) {
      const params = new URLSearchParams(searchParams);
      if (newFilters.startDate) params.set('startDate', newFilters.startDate.toISOString());
      if (newFilters.endDate) params.set('endDate', newFilters.endDate.toISOString());
      setSearchParams(params, { replace: true });
    }
  }, [embedded, searchParams, setSearchParams]);

  const handleFiltersApply = useCallback((appliedFilters) => {
    fetchEvents(appliedFilters);
  }, [fetchEvents]);

  const handleRefresh = useCallback(async () => {
    const { invalidateCache } = await import('../services/eventsCache');
    invalidateCache(newsSource);

    const { startDate, endDate } = buildTodayRange();
    const refreshedFilters = { ...filters, startDate, endDate };
    setFilters(refreshedFilters);
    fetchEvents(refreshedFilters);
  }, [buildTodayRange, fetchEvents, filters, newsSource]);

  useImperativeHandle(ref, () => ({ handleRefresh }), [handleRefresh]);

  const handleBackClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const displayEventCount = filteredEvents.length;
  const headerPaddingY = compactMode ? { xs: 1.25, sm: 1.75 } : { xs: 2, sm: 3 };
  const filtersStickyTop = compactMode ? 0 : 'auto';
  const filtersMaxHeight = compactMode ? 'var(--t2t-vv-height, 100dvh)' : 'none';
  const filtersOverflow = compactMode ? 'auto' : 'visible';

  return (
    <React.Fragment>
      {shouldRenderSeo && <SEO {...eventsMeta} />}
      {!embedded && !authLoading && !user && (
        <Navigate to="/login" replace />
      )}
      <Box
        sx={{
          minHeight: embedded ? 'auto' : 'var(--t2t-vv-height, 100dvh)',
          bgcolor: 'background.default',
          pt: embedded ? { xs: 1.5, sm: 2 } : 0,
          pb: embedded ? 0 : 4,
          display: embedded ? 'flex' : 'block',
          flexDirection: embedded ? 'column' : 'initial',
          overflow: embedded ? 'hidden' : 'visible',
        }}
      >
        {!embedded && (
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 0,
              borderBottom: `4px solid ${theme.palette.primary.dark}`,
            }}
          >
            <Container maxWidth="xl">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.1, py: headerPaddingY }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  {!hideBackButton && (
                    <MuiTooltip title="Back to clock">
                      <IconButton
                        onClick={handleBackClick}
                        sx={{
                          bgcolor: alpha(theme.palette.common.white, 0.15),
                          color: 'primary.contrastText',
                          '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.25) },
                        }}
                        size="small"
                      >
                        <ArrowBackIcon />
                      </IconButton>
                    </MuiTooltip>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    <Typography
                      variant={isMobile ? 'h6' : 'h5'}
                      sx={{ fontWeight: 800, letterSpacing: -0.2 }}
                    >
                      Economic Events
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: alpha(theme.palette.common.white, 0.85), maxWidth: 720 }}
                    >
                      View high-impact economic releases with filters for impact, currency, and date range. Export events or refresh when needed.
                    </Typography>
                  </Box>

                  <Box sx={{ marginLeft: 'auto', textAlign: { xs: 'left', sm: 'right' } }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ display: 'block', fontWeight: 700 }}
                    >
                      {displayEventCount.toLocaleString()} Events
                    </Typography>
                    {lastUpdated && (
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.9,
                          display: 'block',
                        }}
                      >
                        Updated: {lastUpdated.toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.85) }}>
                    Data source: {newsSource?.toUpperCase() || 'AUTO'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.85) }}>
                    Timezone: {selectedTimezone}
                  </Typography>
                </Box>
              </Box>
            </Container>
          </Paper>
        )}

        <Box
          component={embedded ? 'div' : Container}
          {...(!embedded && { maxWidth: 'xl' })}
          sx={{
            mt: embedded ? 0 : (compactMode ? 1.5 : 3),
            px: embedded ? { xs: 1.5, sm: 2 } : (compactMode ? { xs: 1, sm: 1.5 } : 0),
            pb: embedded ? 2 : 0,
            flex: embedded ? 1 : 'initial',
            overflow: embedded ? 'auto' : 'visible',
            display: 'flex',
            flexDirection: 'column',
            gap: embedded ? 1.5 : (compactMode ? 1.5 : 3),
          }}
        >
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: compactMode ? 0 : 2,
              flexShrink: 0,
              position: compactMode ? 'sticky' : 'static',
              top: filtersStickyTop,
              zIndex: compactMode ? 1180 : 'auto',
              bgcolor: 'background.paper',
              maxHeight: filtersMaxHeight,
              overflow: filtersOverflow,
              boxShadow: compactMode ? theme.shadows[3] : 'none',
              width: embedded ? '100%' : compactMode ? '100vw' : 'auto',
              maxWidth: embedded ? '100%' : compactMode ? '100vw' : 'none',
            }}
          >
            <EventsFilters3
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApply={handleFiltersApply}
              loading={loading}
              timezone={selectedTimezone}
              newsSource={newsSource}
              actionOffset={0}
            />
          </Paper>

          <Box
            sx={{
              flex: embedded ? 1 : 'initial',
              overflow: embedded ? 'hidden' : 'visible',
              display: 'flex',
              flexDirection: 'column',
              minHeight: embedded ? 0 : 'auto',
            }}
          >
            {!loading && filters.searchQuery && filteredEvents.length === 0 && events.length > 0 && (
              <Alert
                severity="info"
                sx={{
                  mb: 2,
                  borderRadius: 2,
                }}
              >
                <AlertTitle>No matches found</AlertTitle>
                No events match your search &quot;{filters.searchQuery}&quot;. Try adjusting your search terms or clearing the search to see all filtered events.
              </Alert>
            )}

            <Box
              sx={{
                flex: embedded ? 1 : 'initial',
                overflow: embedded ? 'hidden' : 'visible',
                display: embedded ? 'flex' : 'block',
                flexDirection: 'column',
              }}
            >
              <EventsTable
                events={filteredEvents}
                contextEvents={events}
                loading={loading}
                error={error}
                timezone={selectedTimezone}
                onRefresh={handleRefresh}
                autoScrollToNextKey={autoScrollToNextKey}
                searchQuery={filters.searchQuery}
              />
            </Box>
          </Box>
        </Box>

        {/* Sync functionality handled by automatic scheduled functions (NFS + JBlanked) */}
      </Box>
    </React.Fragment>
  );
});

EventsPage.displayName = 'EventsPage';

EventsPage.propTypes = {
  embedded: PropTypes.bool,
  onEventsUpdate: PropTypes.func,
  hideBackButton: PropTypes.bool,
  autoScrollToNextKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  compactMode: PropTypes.bool,
};

export default EventsPage;
