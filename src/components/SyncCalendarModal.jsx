/**
 * src/components/SyncCalendarModal.jsx
 * 
 * Purpose: Modal for syncing economic calendar with multi-source selection
 * Allows users to select one or more news sources and shows progress per source
 * 
 * Changelog:
 * v1.1.0 - 2026-01-24 - i18n migration: added useTranslation hook for admin + states + actions namespaces
 * v1.0.0 - 2025-11-30 - Initial implementation with multi-source support
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  LinearProgress,
  Alert,
  AlertTitle,
  Chip,
  Stack,
  alpha,
} from '@mui/material';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SyncIcon from '@mui/icons-material/Sync';
import { NEWS_SOURCE_OPTIONS } from '../types/economicEvents';

/**
 * Sync state per source
 * @typedef {'pending' | 'running' | 'success' | 'error'} SyncState
 */

/**
 * SyncCalendarModal Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {() => void} props.onClose - Close handler
 * @param {string[]} props.defaultSources - Pre-selected sources
 * @param {(sources: string[]) => Promise<Object>} props.onSync - Sync handler
 */
export default function SyncCalendarModal({
  isOpen,
  onClose,
  defaultSources = [],
  onSync
}) {
  const { t } = useTranslation(['admin', 'states', 'actions']);
  // Selected sources for sync
  const [selectedSources, setSelectedSources] = useState(
    defaultSources.length > 0 ? defaultSources : ['mql5']
  );

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState({});
  const [error, setError] = useState(null);

  /**
   * Handle source checkbox toggle
   */
  const handleToggleSource = (sourceValue) => {
    setSelectedSources(prev => {
      if (prev.includes(sourceValue)) {
        // Don't allow deselecting all sources
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== sourceValue);
      } else {
        return [...prev, sourceValue];
      }
    });
  };

  /**
   * Handle sync start
   */
  const handleStartSync = async () => {
    if (selectedSources.length === 0) return;

    setSyncing(true);
    setError(null);

    // Initialize sync results with 'running' state
    const initialResults = {};
    selectedSources.forEach(source => {
      initialResults[source] = { state: 'running', progress: 0 };
    });
    setSyncResults(initialResults);

    try {
      // Call the sync function passed from parent
      const response = await onSync(selectedSources);

      // Unwrap the response (service wraps it in {success, data})
      const result = response.success && response.data ? response.data : response;

      // Process results
      if (result.ok && result.multiSource && result.results) {
        // Multi-source response
        const finalResults = {};
        result.results.forEach(r => {
          finalResults[r.source] = {
            state: r.success ? 'success' : 'error',
            recordsUpserted: r.recordsUpserted,
            error: r.error,
            progress: 100,
          };
        });
        setSyncResults(finalResults);
      } else if (result.ok || result.success) {
        // Single source result
        const source = selectedSources[0];
        setSyncResults({
          [source]: {
            state: 'success',
            recordsUpserted: result.recordsUpserted || result.totalRecordsUpserted,
            progress: 100,
          }
        });
      } else {
        setError(result.error || response.error || 'Sync failed');

        // Mark all as error
        const errorResults = {};
        selectedSources.forEach(source => {
          errorResults[source] = { state: 'error', error: result.error || response.error, progress: 0 };
        });
        setSyncResults(errorResults);
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError(err.message || 'An unexpected error occurred');

      // Mark all as error
      const errorResults = {};
      selectedSources.forEach(source => {
        errorResults[source] = {
          state: 'error',
          error: err.message || 'Unknown error',
          progress: 0,
        };
      });
      setSyncResults(errorResults);
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Handle close
   */
  const handleClose = () => {
    if (syncing) {
      // Show confirmation if sync is running
      if (!window.confirm('Sync is in progress. Are you sure you want to close?')) {
        return;
      }
    }

    // Reset state
    setSyncResults({});
    setError(null);
    setSelectedSources(defaultSources.length > 0 ? defaultSources : ['mql5']);
    onClose();
  };

  /**
   * Calculate overall progress
   */
  const overallProgress = Object.keys(syncResults).length > 0
    ? Object.values(syncResults).reduce((sum, r) => sum + (r.progress || 0), 0) /
    Object.keys(syncResults).length
    : 0;

  const allCompleted = Object.keys(syncResults).length > 0 && Object.values(syncResults).every(
    r => r.state === 'success' || r.state === 'error'
  );

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="sync-calendar-dialog-title"
      aria-describedby="sync-calendar-dialog-description"
      slotProps={{
        backdrop: { sx: BACKDROP_OVERLAY_SX },
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle
        id="sync-calendar-dialog-title"
        sx={{
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <SyncIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {t('admin:syncCalendar')}
        </Typography>
      </DialogTitle>

      <DialogContent id="sync-calendar-dialog-description">
        {/* Instruction */}
        {!syncing && Object.keys(syncResults).length === 0 && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('admin:selectSources')}
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Note:</strong> To view events from a specific source, change your "Preferred News Source" in Settings → General.
              </Typography>
            </Alert>

            {/* Source Selection */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                {t('admin:selectOne')}
              </Typography>
              <FormGroup>
                {NEWS_SOURCE_OPTIONS.map((option) => (
                  <Box key={option.value} sx={{ mb: 1.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSources.includes(option.value)}
                          onChange={() => handleToggleSource(option.value)}
                          disabled={syncing}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {option.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </Box>
                ))}
              </FormGroup>
            </Box>

            {/* FXStreet Limited Data Warning */}
            {selectedSources.includes('fxstreet') && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                <AlertTitle sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {t('admin:fxstreetWarning')}
                </AlertTitle>
                <Typography variant="body2">
                  {t('admin:fxstreetWarningDesc')}
                </Typography>
              </Alert>
            )}

            {/* API Credit Usage Warning */}
            <Alert severity="warning" sx={{ mt: 2 }}>
              <AlertTitle sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {t('admin:apiCreditUsage')}
              </AlertTitle>
              <Typography variant="body2">
                {t('admin:apiCreditInfo')}
              </Typography>
            </Alert>
          </>
        )}

        {/* Progress Visualization */}
        {(syncing || Object.keys(syncResults).length > 0) && (
          <Box>
            {/* Overall Progress */}
            {syncing && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {t('admin:overallProgress')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(overallProgress)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={overallProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}

            {/* Per-Source Status */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                {t('admin:sourceStatus')}
              </Typography>
              <Stack spacing={2}>
                {selectedSources.map((sourceValue) => {
                  const option = NEWS_SOURCE_OPTIONS.find(opt => opt.value === sourceValue);
                  const result = syncResults[sourceValue];
                  const state = result?.state || 'pending';

                  return (
                    <Box
                      key={sourceValue}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: (theme) =>
                          state === 'success' ? alpha(theme.palette.success.main, 0.08) :
                            state === 'error' ? alpha(theme.palette.error.main, 0.08) :
                              'background.paper',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {option?.label || sourceValue}
                        </Typography>

                        {/* Status Icon */}
                        {state === 'running' && (
                          <Chip
                            label={t('admin:syncing')}
                            size="small"
                            color="primary"
                            sx={{ height: 24 }}
                          />
                        )}
                        {state === 'success' && (
                          <CheckCircleIcon color="success" sx={{ fontSize: 24 }} />
                        )}
                        {state === 'error' && (
                          <ErrorIcon color="error" sx={{ fontSize: 24 }} />
                        )}
                        {state === 'pending' && (
                          <Chip
                            label={t('states:pending')}
                            size="small"
                            sx={{ height: 24, bgcolor: 'action.hover' }}
                          />
                        )}
                      </Box>

                      {/* Progress Bar (for running state) */}
                      {state === 'running' && (
                        <LinearProgress sx={{ mt: 1, height: 4, borderRadius: 2 }} />
                      )}

                      {/* Success Message */}
                      {state === 'success' && result.recordsUpserted !== undefined && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                          ✓ Synced {result.recordsUpserted.toLocaleString()} events
                        </Typography>
                      )}

                      {/* Error Message */}
                      {state === 'error' && result.error && (
                        <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }}>
                          ✗ {result.error}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* Success Summary */}
            {allCompleted && !error && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <AlertTitle sx={{ fontWeight: 600 }}>{t('admin:syncCompleted')}</AlertTitle>
                <Typography variant="body2">
                  {t('admin:syncCompletedDesc', { count: selectedSources.length })}
                </Typography>
              </Alert>
            )}

            {/* Error Summary */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <AlertTitle sx={{ fontWeight: 600 }}>{t('admin:syncFailed')}</AlertTitle>
                <Typography variant="body2">{error}</Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
          disabled={syncing}
          sx={{ textTransform: 'none' }}
        >
          {allCompleted ? t('actions:close') : t('actions:cancel')}
        </Button>
        {!allCompleted && (
          <Button
            onClick={handleStartSync}
            variant="contained"
            disabled={syncing || selectedSources.length === 0}
            startIcon={syncing ? <SyncIcon className="spin" /> : <SyncIcon />}
            sx={{
              textTransform: 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
              '& .spin': {
                animation: 'spin 1s linear infinite',
              }
            }}
          >
            {syncing ? t('admin:syncing') : t('admin:startSync')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
