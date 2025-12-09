/**
 * src/components/EconomicEvents.jsx
 * 
 * Purpose: Economic events drawer with filtering and timeline display
 * Integrates EventsFilters2 (optimized) and EventsTimeline2 (enterprise-grade) components
 * 
 * Changelog:
 * v2.14.0 - 2025-12-08 - BUGFIX: Fixed news source propagation - refreshEventsCache now accepts source param, added comprehensive source-tracking logging throughout data flow
 * v2.13.0 - 2025-12-01 - BUGFIX: Added key={timezone} to EventsTimeline2 to force re-render when timezone changes (fixes memoization preventing time updates)
 * v2.12.0 - 2025-12-01 - Performance optimization: Component stays mounted (display:none when closed), uses cache for smooth navigation, only fetches on initial mount
 * v2.11.0 - 2025-12-01 - Moved news source selector from SettingsSidebar to EconomicEvents header (dropdown in "Last updated" row, mobile-first responsive, enterprise UX with expandable source details)
 * v2.10.1 - 2025-12-01 - Updated Initial Sync to historical only (2y back to today), Recent Sync extended to 30 days forward for better future coverage
 * v2.10.0 - 2025-12-01 - Added "Initial Sync" button for historical bulk sync with password confirmation (9876543210)
 * v2.9.1 - 2025-11-30 - Fixed mock data: Use proper field names (Name, date) and ISO dates, added Today/Yesterday/Tomorrow events for proper date dividers
 * v2.9.0 - 2025-11-30 - Guest preview: Show mock events timeline with clear "Preview Mode" indicator for non-authenticated users
 * v2.8.1 - 2025-11-30 - Guest UI cleanup: Hide refresh button, last updated, sync success, and event count for non-authenticated users
 * v2.8.0 - 2025-11-30 - Authentication required: Only show events to authenticated users, display sign-up message for guests
 * v2.7.0 - 2025-11-30 - Enterprise refresh: Clear cache and fetch fresh Firestore data with proper loading states and user feedback
 * v2.6.0 - 2025-11-30 - Filter persistence: Initialize filters from SettingsContext (eventFilters) for cross-session consistency
 * v2.5.0 - 2025-11-30 - MAJOR REFACTORING: Removed complex hasAppliedFilters detection logic (50+ lines), simplified pagination to always show when more events available, updated event count to "Showing X of Y events"
 * v2.4.0 - 2025-11-30 - Smart pagination: hide Show Previous/Load More buttons when filters applied, show only in default state
 * v2.3.0 - 2025-11-30 - Upgraded to EventsTimeline2 (enterprise refactor with performance optimizations)
 * v2.2.0 - 2025-11-30 - Implemented infinite vertical pagination (loads 4 weeks on mount)
 * v2.1.0 - 2025-11-29 - Upgraded to EventsFilters2 with enterprise optimizations
 * v2.0.0 - 2025-11-29 - Refactored with filters and timeline components
 * v1.0.0 - 2025-11-29 - Initial implementation
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
  AlertTitle,
  alpha,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SyncIcon from '@mui/icons-material/Sync';
import {
  formatEventData,
  sortEventsByTime,
} from '../utils/newsApi';
import {
  getEventsByDateRange,
  triggerManualSync,
  refreshEventsCache,
} from '../services/economicEventsService';
import ConfirmModal from './ConfirmModal';
import SyncCalendarModal from './SyncCalendarModal';
import EventsTimeline2 from './EventsTimeline2';
import EventsFilters2 from './EventsFilters2';
import NewsSourceSelector from './NewsSourceSelector';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

// Mock data for guest users preview
// Using proper Firestore field names and dates for "Today" highlight
const MOCK_EVENTS = [
  {
    id: 'mock-1',
    Name: 'Non-Farm Employment Change',
    currency: 'USD',
    category: 'Employment',
    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now (TODAY)
    actual: '227K',
    forecast: '200K',
    previous: '233K',
    strength: 'Strong Data',
  },
  {
    id: 'mock-2',
    Name: 'Unemployment Rate',
    currency: 'USD',
    category: 'Employment',
    date: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(), // 2.5 hours from now (TODAY)
    actual: '-',
    forecast: '4.2%',
    previous: '4.2%',
    strength: 'Strong Data',
  },
  {
    id: 'mock-3',
    Name: 'CPI m/m',
    currency: 'EUR',
    category: 'Inflation',
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago (TODAY - past)
    actual: '0.3%',
    forecast: '0.2%',
    previous: '0.4%',
    strength: 'Moderate Data',
  },
  {
    id: 'mock-4',
    Name: 'Interest Rate Decision',
    currency: 'GBP',
    category: 'Central Bank',
    date: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now (TODAY)
    actual: '-',
    forecast: '4.50%',
    previous: '4.50%',
    strength: 'Strong Data',
  },
  {
    id: 'mock-5',
    Name: 'Retail Sales m/m',
    currency: 'USD',
    category: 'Consumer Spending',
    date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago (TODAY - past)
    actual: '0.7%',
    forecast: '0.5%',
    previous: '0.3%',
    strength: 'Moderate Data',
  },
  {
    id: 'mock-6',
    Name: 'Manufacturing PMI',
    currency: 'JPY',
    category: 'Manufacturing',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    actual: '-',
    forecast: '49.5',
    previous: '48.7',
    strength: 'Moderate Data',
  },
  {
    id: 'mock-7',
    Name: 'GDP Growth Rate q/q',
    currency: 'AUD',
    category: 'GDP',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    actual: '0.6%',
    forecast: '0.5%',
    previous: '0.4%',
    strength: 'Strong Data',
  },
];

/**
 * EconomicEvents Component
 * Drawer displaying economic events with filtering and timeline
 * Kept mounted for smooth navigation - uses 'open' prop to show/hide
 */
export default function EconomicEvents({ open, onClose, timezone }) {
  const { eventFilters, newsSource, updateNewsSource } = useSettings();
  const { user } = useAuth();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(null);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showInitialSyncConfirm, setShowInitialSyncConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter state - Initialize from SettingsContext (persisted across sessions)
  const [filters, setFilters] = useState({
    startDate: eventFilters.startDate || null,
    endDate: eventFilters.endDate || null,
    impacts: eventFilters.impacts || [],
    eventTypes: eventFilters.eventTypes || [],
    currencies: eventFilters.currencies || [],
  });
  
  // Track visible event count for pagination
  const [visibleEventCount, setVisibleEventCount] = useState(0);
  
  /**
   * Handle news source change
   * Updates SettingsContext (persisted) and refetches events
   */
  const handleNewsSourceChange = (newSource) => {
    updateNewsSource(newSource);
    // Events will auto-refetch via useEffect watching newsSource
  };

  /**
   * Fetch events with current filters
   * @param {Object} filtersToUse - Optional filters to use (overrides state)
   */
  const fetchEvents = async (filtersToUse = null) => {
    // Use provided filters or fall back to state
    const activeFilters = filtersToUse || filters;
    
    // Require date range - don't fetch without it
    if (!activeFilters.startDate || !activeFilters.endDate) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch events from Firestore with filters (including news source)
    const result = await getEventsByDateRange(
      activeFilters.startDate, 
      activeFilters.endDate, 
      {
        source: newsSource, // Use user's preferred news source
        impacts: activeFilters.impacts,
        eventTypes: activeFilters.eventTypes,
        currencies: activeFilters.currencies,
      }
    );

    if (result.success) {
      // Format and sort events
      const formattedEvents = result.data.map(formatEventData);
      const sortedEvents = sortEventsByTime(formattedEvents);
      
      setEvents(sortedEvents);
      setLastUpdated(new Date());
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  /**
   * Trigger manual sync from Cloud Function (legacy - kept for ConfirmModal)
   */
  const handleManualSync = async () => {
    setShowSyncConfirm(false); // Close confirmation dialog
    setSyncing(true);
    setSyncSuccess(null);
    setError(null);

    const result = await triggerManualSync({ dryRun: false });

    if (result.success) {
      // Check if data was actually synced
      if (result.data && result.data.recordsUpserted > 0) {
        setSyncSuccess(`Synced ${result.data.recordsUpserted.toLocaleString()} events successfully!`);
      } else {
        setSyncSuccess('Calendar synced successfully!');
      }
      
      // Refresh events after sync (wait longer for Firestore to update)
      setTimeout(() => {
        fetchEvents();
      }, 2000);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSyncSuccess(null);
      }, 5000);
    } else {
      setError(result.error || 'Failed to sync calendar');
    }

    setSyncing(false);
  };

  /**
   * Handle multi-source sync from SyncCalendarModal
   * @param {string[]} selectedSources - Array of source identifiers
   */
  const handleMultiSourceSync = async (selectedSources) => {
    const result = await triggerManualSync({ 
      sources: selectedSources,
      dryRun: false 
    });

    if (result.success) {
      // Show success message
      const totalRecords = result.data.totalRecordsUpserted || 0;
      
      // If only one source was synced and it's different from current newsSource,
      // inform user they may want to switch sources in Settings
      const needsSourceSwitch = selectedSources.length === 1 && 
                                selectedSources[0] !== newsSource;
      
      setSyncSuccess(
        needsSourceSwitch
          ? `Synced ${totalRecords.toLocaleString()} events from ${selectedSources[0]}! Go to Settings to switch your preferred news source to view these events.`
          : `Synced ${totalRecords.toLocaleString()} events from ${selectedSources.length} source${selectedSources.length > 1 ? 's' : ''}!`
      );
      
      // Refresh events after sync (will fetch from current newsSource setting)
      setTimeout(() => {
        fetchEvents();
      }, 2000);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSyncSuccess(null);
      }, 5000);
    }

    return result;
  };

  /**
   * Handle initial historical sync (2 years back, 1 year forward)
   * Syncs ALL sources (mql5, forex-factory, fxstreet) for complete data
   * Requires password confirmation
   */
  const handleInitialSync = async () => {
    setShowInitialSyncConfirm(false);
    setSyncing(true);
    setSyncSuccess(null);
    setError(null);

    // Call the new syncHistoricalEvents Cloud Function
    try {
      const response = await fetch(
        'https://us-central1-time-2-trade-app.cloudfunctions.net/syncHistoricalEvents',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sources: ['mql5', 'forex-factory', 'fxstreet'], // Sync ALL sources for initial bulk load
            // TODO: Add Firebase ID token for authentication
            // adminToken: await user.getIdToken(),
          }),
        }
      );

      const result = await response.json();

      if (result.ok) {
        const totalRecords = result.totalRecordsUpserted || 0;
        const sourcesCount = result.totalSources || 0;
        
        setSyncSuccess(
          `Initial sync complete! Loaded ${totalRecords.toLocaleString()} historical events from ${sourcesCount} sources (2 years back to today). Use "Sync Calendar" for future events.`
        );
        
        // Refresh events after sync
        setTimeout(() => {
          fetchEvents();
        }, 2000);

        // Clear success message after 10 seconds
        setTimeout(() => {
          setSyncSuccess(null);
        }, 10000);
      } else {
        setError(result.error || 'Initial sync failed');
      }
    } catch (error) {
      console.error('❌ Initial sync error:', error);
      setError('Failed to connect to sync service. Please try again.');
    }

    setSyncing(false);
  };

  /**
   * Component mount - Auto-load wide date range once on initial mount
   * Component stays mounted, so this only runs once
   */
  useEffect(() => {
    // Only load on initial mount if not already loaded
    if (events.length === 0) {
      // Load a wide date range (2 weeks before to 2 weeks after) for infinite pagination
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 14); // 2 weeks before
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + 14); // 2 weeks after
      endDate.setHours(23, 59, 59, 999);
      
      const newFilters = {
        ...filters,
        startDate,
        endDate,
      };
      
      setFilters(newFilters);
      fetchEvents(newFilters);
    }
  }, []);

  /**
   * Watch for news source changes - Refetch from new source's cache
   * When user changes preferred source, load from that source's cache
   * Cache is source-isolated, so switching sources is instant (from cache)
   */
  useEffect(() => {
    if (events.length > 0) {
      fetchEvents();
    }
  }, [newsSource]);

  /**
   * Handle filter changes (without auto-fetching)
   */
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  /**
   * Apply filters and fetch events
   * Receives filters directly from EventsFilters to avoid stale state
   */
  const handleApplyFilters = (appliedFilters) => {
    fetchEvents(appliedFilters);
  };

  /**
   * Handle visible event count update from timeline
   */
  const handleVisibleCountChange = useCallback((count) => {
    setVisibleEventCount(count);
  }, []);

  /**
   * Handle refresh button click - Refresh events
   * Best practice: Invalidate cache first, then fetch to ensure latest data
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    setLoading(true); // Show skeletons immediately
    setError(null);
    setSyncSuccess(null);

    try {
      // Step 1: Invalidate cache to force fresh Firestore read (for current source)
      await refreshEventsCache(newsSource);
      
      // Step 2: Fetch events with current filters (bypasses cache)
      await fetchEvents();
      // Show success feedback briefly
      setSyncSuccess(`Events refreshed from ${newsSource}.`);
      setTimeout(() => {
        setSyncSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('❌ [handleRefresh] Error refreshing events:', error);
      setError('Failed to refresh events. Please try again.');
      setLoading(false); // Stop loading on error
    } finally {
      setRefreshing(false);
    }
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
        display: open ? 'flex' : 'none', // Hide when closed, don't unmount
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
            Economic Events
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Refresh Button - Only for authenticated users */}
          {user && (
            <Tooltip title="Refresh events">
              <span>
                <IconButton
                  onClick={handleRefresh}
                  disabled={loading || syncing || refreshing}
                  sx={{ color: 'white' }}
                  size="small"
                >
                  <RefreshIcon 
                    sx={{
                      animation: refreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <Tooltip title="Close">
            <IconButton
              onClick={onClose}
              sx={{ color: 'white' }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Sync Button Bar - Only for authenticated users */}
      {user && (
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
            display: 'flex',
            gap: 1,
          }}
        >
          <Tooltip title="Initial bulk sync: 2 years back + 1 year forward (high API cost)">
            <span style={{ flex: 1 }}>
              <Button
                onClick={() => setShowInitialSyncConfirm(true)}
                disabled={syncing || loading}
                variant="contained"
                color="warning"
                startIcon={
                  <SyncIcon
                    sx={{
                      animation: syncing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                }
                sx={{
                  width: '100%',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  py: 1,
                }}
              >
                Initial Sync
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Sync calendar data from multiple news sources">
            <span style={{ flex: 1 }}>
              <Button
                onClick={() => setShowSyncModal(true)}
                disabled={syncing || loading}
                variant="outlined"
                startIcon={
                  <SyncIcon
                    sx={{
                      animation: syncing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                }
                sx={{
                  width: '100%',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  py: 1,
                }}
              >
                {syncing ? 'Syncing...' : 'Sync Calendar'}
              </Button>
            </span>
          </Tooltip>
        </Box>
      )}

      {/* Filters - Using optimized EventsFilters2 - Only for authenticated users */}
      {user && (
        <EventsFilters2
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApply={handleApplyFilters}
          loading={loading}
          timezone={timezone}
          newsSource={newsSource}
        />
      )}

      {/* Sync Success Message - Only for authenticated users */}
      {user && syncSuccess && !loading && (
        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1, bgcolor: 'background.default' }}>
          <Alert severity="success" sx={{ py: 0.5 }}>
            {syncSuccess}
          </Alert>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', pb: 2 }}>
        {/* Guest User Message and Mock Preview */}
        {!user && (
          <>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Alert 
                severity="info" 
                sx={{ 
                  '& .MuiAlert-message': {
                    width: '100%',
                  }
                }}
              >
                <AlertTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  🔒 Authentication Required
                </AlertTitle>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Economic events are available to registered users only.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a free account or log in to access:
                </Typography>
                <Box component="ul" sx={{ textAlign: 'left', mt: 1.5, mb: 2 }}>
                  <li>Real-time economic events calendar</li>
                  <li>Advanced filtering by impact, currency, and type</li>
                  <li>Event details with historical data</li>
                  <li>Cloud sync across all your devices</li>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={onClose}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                    }}
                  >
                    Sign Up / Log In
                  </Button>
                </Box>
              </Alert>

              {/* Preview Data Notice */}
              <Alert 
                severity="warning" 
                sx={{ 
                  mt: 2,
                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.15),
                }}
              >
                <AlertTitle sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  📊 Preview Mode
                </AlertTitle>
                <Typography variant="body2">
                  Below is sample data to demonstrate the timeline. Sign up to see live events.
                </Typography>
              </Alert>
            </Box>

            {/* Mock Events Timeline Preview */}
            <EventsTimeline2 
              events={MOCK_EVENTS} 
              loading={false}
              onVisibleCountChange={() => {}}
              timezone={timezone}
            />
          </>
        )}

        {/* Authenticated User Content */}
        {user && (
          <>
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
                      <li>Check your internet connection</li>
                      <li>Verify Firestore security rules allow read access</li>
                      <li>Check browser console for detailed error messages</li>
                    </Typography>
                  </Box>
                </Alert>
              </Box>
            )}

            {/* Events Timeline - Enterprise-grade component */}
            {!error && (
              <EventsTimeline2 
                key={timezone}  // Force re-render when timezone changes
                events={events} 
                loading={loading}
                onVisibleCountChange={handleVisibleCountChange}
                timezone={timezone}
              />
            )}
          </>
        )}
      </Box>

      {/* Footer - Event Count, Timestamp & Source Selector - Only for authenticated users */}
      {user && !loading && !error && events.length > 0 && (
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1.5,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
          }}
        >
          {/* Left: Event Count & Timestamp */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              Showing {visibleEventCount} of {events.length} {events.length === 1 ? 'event' : 'events'}
            </Typography>
            {lastUpdated && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: '0.7rem' }}
              >
                Updated {lastUpdated.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                })}
              </Typography>
            )}
          </Box>

          {/* Right: News Source Selector */}
          {!syncSuccess && (
            <NewsSourceSelector
              value={newsSource}
              onChange={handleNewsSourceChange}
            />
          )}
        </Box>
      )}

      {/* Multi-Source Sync Calendar Modal */}
      <SyncCalendarModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        defaultSources={[newsSource]}
        onSync={handleMultiSourceSync}
      />

      {/* Initial Sync Confirmation Dialog */}
      <ConfirmModal
        open={showInitialSyncConfirm}
        onClose={() => setShowInitialSyncConfirm(false)}
        onConfirm={handleInitialSync}
        title="Initial Historical Sync - ALL Sources"
        message={
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This will fetch <strong>2 years of historical data</strong> (up to today) from <strong>all 3 news sources</strong>: MQL5, Forex Factory, and FXStreet.
            </Typography>
            <Typography variant="body2" color="warning.main" sx={{ fontWeight: 700, mb: 2 }}>
              ⚠️ HIGH API COST: This will use approximately <strong>9 API credits</strong> (3 credits × 3 sources)
            </Typography>
            <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                � What Gets Synced:
              </Typography>
              <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                • <strong>MQL5:</strong> ~8,500 historical events with categories
              </Typography>
              <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                • <strong>Forex Factory:</strong> ~13,500 historical events (best coverage)
              </Typography>
              <Typography variant="caption" component="div" sx={{ mb: 1 }}>
                • <strong>FXStreet:</strong> Recent events only
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                🔮 For Future Events:
              </Typography>
              <Typography variant="caption" component="div" sx={{ mb: 1, fontStyle: 'italic' }}>
                After initial sync, use <strong>"Sync Calendar"</strong> button to get upcoming scheduled events (next 30 days). The API provides better future coverage through regular syncs.
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                �📋 Use Cases:
              </Typography>
              <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                • First-time application setup
              </Typography>
              <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                • Data recovery after corruption
              </Typography>
              <Typography variant="caption" component="div">
                • Historical backtesting analysis
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              <strong>Note:</strong> For regular updates and future events, use the "Sync Calendar" button. The calendar also syncs automatically at 5:00 AM EST daily.
            </Typography>
          </>
        }
        confirmText="Sync All Sources"
        cancelText="Cancel"
        requirePassword={true}
        password="9876543210"
      />

      {/* Legacy Sync Confirmation Dialog (kept for backward compatibility) */}
      <ConfirmModal
        open={showSyncConfirm}
        onClose={() => setShowSyncConfirm(false)}
        onConfirm={handleManualSync}
        title="Sync Calendar Data?"
        message={
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This will fetch 3 years of economic calendar data (previous year, current year, next year) from the JBlanked News API.
            </Typography>
            <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
              ⚠️ This action will use 1 API credit
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Tip: The calendar syncs automatically at 5:00 AM EST daily. Manual sync is only needed if you want the latest data immediately.
            </Typography>
          </>
        }
        confirmText="Sync Now"
        cancelText="Cancel"
        requirePassword={true}
        password="9876543210"
      />
    </Paper>
  );
}
