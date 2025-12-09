/**
 * src/components/EconomicEvents2.jsx
 * 
 * Purpose: Refactored economic events drawer embedding EventsPage component
 * Full-featured drawer with sync controls, filters, tabs, and event displays
 * 
 * Architecture:
 * - Header: Title + close/refresh buttons
 * - Sync Controls: Initial Sync + Sync Calendar buttons (authenticated users only)
 * - EventsPage: Complete page with filters, tabs (Table/Timeline), and events
 * - Footer: Event count, last updated timestamp, news source selector
 * 
 * Key Features:
 * - Embeds full EventsPage component (not separate Filters/Timeline)
 * - Source-aware caching with proper invalidation
 * - Multi-source sync support (mql5, forex-factory, fxstreet)
 * - Guest preview with mock data
 * - Mobile-responsive drawer layout
 * 
 * Changelog:
 * v1.0.0 - 2025-12-08 - Initial implementation - refactored from EconomicEvents.jsx to embed EventsPage
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Button,
  Tooltip,
  Alert,
  AlertTitle,
  alpha,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SyncIcon from '@mui/icons-material/Sync';
import {
  triggerManualSync,
  refreshEventsCache,
} from '../services/economicEventsService';
import ConfirmModal from './ConfirmModal';
import SyncCalendarModal from './SyncCalendarModal';
import NewsSourceSelector from './NewsSourceSelector';
import EventsPage from './EventsPage';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

// Mock data for guest users preview
const MOCK_EVENTS = [
  {
    id: 'mock-1',
    Name: 'Non-Farm Employment Change',
    currency: 'USD',
    category: 'Employment',
    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
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
    date: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
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
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    actual: '0.3%',
    forecast: '0.2%',
    previous: '0.4%',
    strength: 'Moderate Data',
  },
];

/**
 * EconomicEvents2 Component
 * Refactored drawer embedding full EventsPage component
 */
export default function EconomicEvents2({ open, onClose, timezone }) {
  const { newsSource, updateNewsSource } = useSettings();
  const { user } = useAuth();
  
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(null);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showInitialSyncConfirm, setShowInitialSyncConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [eventsCount, setEventsCount] = useState(0);
  const [eventsLastUpdated, setEventsLastUpdated] = useState(null);
  
  // Ref to EventsPage for triggering refresh
  const eventsPageRef = useRef(null);

  /**
   * Handle news source change
   * Updates SettingsContext (persisted) and triggers EventsPage refresh
   */
  const handleNewsSourceChange = (newSource) => {
    console.log(`📡 [EconomicEvents2] News source changed from ${newsSource} to ${newSource}`);
    console.log('📦 [EconomicEvents2] Cache will switch to source-specific data');
    updateNewsSource(newSource);
    // EventsPage will auto-refresh via useEffect watching newsSource
  };

  /**
   * Trigger manual sync from Cloud Function (legacy)
   */
  const handleManualSync = async () => {
    setShowSyncConfirm(false);
    setSyncing(true);
    setSyncSuccess(null);

    console.log('🔄 [EconomicEvents2] Triggering manual sync...');

    const result = await triggerManualSync({ dryRun: false });

    if (result.success) {
      console.log('✅ [EconomicEvents2] Sync successful:', result.data);
      
      if (result.data && result.data.recordsUpserted > 0) {
        setSyncSuccess(`Synced ${result.data.recordsUpserted.toLocaleString()} events successfully!`);
      } else {
        setSyncSuccess('Calendar synced successfully!');
      }
      
      // Trigger EventsPage refresh after sync
      if (eventsPageRef.current?.handleRefresh) {
        setTimeout(() => {
          eventsPageRef.current.handleRefresh();
        }, 2000);
      }

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSyncSuccess(null);
      }, 5000);
    } else {
      console.error('❌ [EconomicEvents2] Sync failed:', result.error);
      setSyncSuccess(`Error: ${result.error || 'Sync failed'}`);
      setTimeout(() => {
        setSyncSuccess(null);
      }, 5000);
    }

    setSyncing(false);
  };

  /**
   * Handle multi-source sync from SyncCalendarModal
   */
  const handleMultiSourceSync = async (selectedSources) => {
    console.log('🔄 [EconomicEvents2] Triggering multi-source sync:', selectedSources);
    
    const result = await triggerManualSync({ 
      sources: selectedSources,
      dryRun: false 
    });

    if (result.success) {
      console.log('✅ [EconomicEvents2] Multi-source sync successful:', result.data);
      
      const totalRecords = result.data.totalRecordsUpserted || 0;
      const needsSourceSwitch = selectedSources.length === 1 && selectedSources[0] !== newsSource;
      
      setSyncSuccess(
        needsSourceSwitch
          ? `Synced ${totalRecords.toLocaleString()} events from ${selectedSources[0]}! Go to Settings to switch your preferred news source.`
          : `Synced ${totalRecords.toLocaleString()} events from ${selectedSources.length} source${selectedSources.length > 1 ? 's' : ''}!`
      );
      
      // Trigger EventsPage refresh after sync
      if (eventsPageRef.current?.handleRefresh) {
        setTimeout(() => {
          eventsPageRef.current.handleRefresh();
        }, 2000);
      }

      setTimeout(() => {
        setSyncSuccess(null);
      }, 5000);
    }

    return result;
  };

  /**
   * Handle initial historical sync (2 years back to today)
   */
  const handleInitialSync = async () => {
    setShowInitialSyncConfirm(false);
    setSyncing(true);
    setSyncSuccess(null);

    console.log('🏛️ [EconomicEvents2] Triggering initial historical sync for ALL sources...');

    try {
      const response = await fetch(
        'https://us-central1-time-2-trade-app.cloudfunctions.net/syncHistoricalEvents',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sources: ['mql5', 'forex-factory', 'fxstreet'],
          }),
        }
      );

      const result = await response.json();

      if (result.ok) {
        console.log('✅ [EconomicEvents2] Initial sync successful:', result);
        
        const totalRecords = result.totalRecordsUpserted || 0;
        const sourcesCount = result.totalSources || 0;
        
        setSyncSuccess(
          `Initial sync complete! Loaded ${totalRecords.toLocaleString()} historical events from ${sourcesCount} sources (2 years back to today).`
        );
        
        // Trigger EventsPage refresh after sync
        if (eventsPageRef.current?.handleRefresh) {
          setTimeout(() => {
            eventsPageRef.current.handleRefresh();
          }, 2000);
        }

        setTimeout(() => {
          setSyncSuccess(null);
        }, 10000);
      } else {
        console.error('❌ [EconomicEvents2] Initial sync error:', result.error);
        setSyncSuccess(`Error: ${result.error || 'Initial sync failed'}`);
        setTimeout(() => {
          setSyncSuccess(null);
        }, 5000);
      }
    } catch (error) {
      console.error('❌ [EconomicEvents2] Initial sync error:', error);
      setSyncSuccess('Failed to connect to sync service. Please try again.');
      setTimeout(() => {
        setSyncSuccess(null);
      }, 5000);
    }

    setSyncing(false);
  };

  /**
   * Handle refresh button click
   */
  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      console.log(`🔄 [EconomicEvents2] Clearing cache and refreshing for source: ${newsSource}`);
      
      // Invalidate cache for current source
      await refreshEventsCache(newsSource);
      
      // Trigger EventsPage refresh
      if (eventsPageRef.current?.handleRefresh) {
        eventsPageRef.current.handleRefresh();
      }
      
      console.log(`✅ [EconomicEvents2] Cache cleared and events refreshed for source: ${newsSource}`);
      
      setSyncSuccess(`Events refreshed from ${newsSource}.`);
      setTimeout(() => {
        setSyncSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('❌ [EconomicEvents2] Error refreshing events:', error);
      setSyncSuccess('Failed to refresh events. Please try again.');
      setTimeout(() => {
        setSyncSuccess(null);
      }, 3000);
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
        width: { xs: '100%', sm: 400, md: 480, lg: 520 },
        display: open ? 'flex' : 'none',
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
                  disabled={syncing || refreshing}
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
          <Tooltip title="Initial bulk sync: 2 years back to today (high API cost)">
            <span style={{ flex: 1 }}>
              <Button
                onClick={() => setShowInitialSyncConfirm(true)}
                disabled={syncing || refreshing}
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
                disabled={syncing || refreshing}
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

      {/* Sync Success Message - Only for authenticated users */}
      {user && syncSuccess && (
        <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1, bgcolor: 'background.default' }}>
          <Alert severity={syncSuccess.includes('Error') ? 'error' : 'success'} sx={{ py: 0.5 }}>
            {syncSuccess}
          </Alert>
        </Box>
      )}

      {/* Main Content - EventsPage or Guest Message */}
      <Box 
        sx={{ 
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Guest User Message */}
        {!user && (
          <Box sx={{ p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
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
          </Box>
        )}

        {/* Authenticated User - Full EventsPage */}
        {user && (
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <EventsPage 
              ref={eventsPageRef}
              embedded={true}
              onEventsUpdate={(count, timestamp) => {
                setEventsCount(count);
                setEventsLastUpdated(timestamp);
              }}
            />
          </Box>
        )}
      </Box>

      {/* Footer - Event Stats & News Source Selector - Only for authenticated users */}
      {user && (
        <Box
          sx={{
            px: { xs: 1.5, sm: 2 },
            py: 1.5,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          {/* Single Row: Event Stats + News Source Selector */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            {/* Left: Event Stats */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                }}
              >
                {eventsCount.toLocaleString()} Events
              </Typography>
              {eventsLastUpdated && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Updated: {eventsLastUpdated.toLocaleTimeString()}
                </Typography>
              )}
            </Box>
            
            {/* Right: News Source Selector */}
            <Box sx={{ flexShrink: 0 }}>
              <NewsSourceSelector
                value={newsSource}
                onChange={handleNewsSourceChange}
              />
            </Box>
          </Box>
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
                📊 What Gets Synced:
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
                After initial sync, use <strong>"Sync Calendar"</strong> button to get upcoming scheduled events (next 30 days).
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              <strong>Note:</strong> For regular updates and future events, use the "Sync Calendar" button.
            </Typography>
          </>
        }
        confirmText="Sync All Sources"
        cancelText="Cancel"
        requirePassword={true}
        password="9876543210"
      />

      {/* Legacy Sync Confirmation Dialog */}
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
