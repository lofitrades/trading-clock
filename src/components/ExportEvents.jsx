/**
 * src/components/ExportEvents.jsx
 * 
 * Purpose: Superadmin-only page for exporting canonical economic events from Firestore.
 * Exports unified multi-source events with all fields (NFS, JBlanked, GPT) in enterprise JSON format.
 * Requires superadmin RBAC role.
 * 
 * v2.1.0 - 2026-01-24 - BEP: Phase 3c i18n migration - Added useTranslation hook with admin namespace.
 *                       Replaced 19 hardcoded strings with t() calls across access control, export UI, results display.
 * Changelog:
 * v2.0.0 - 2026-01-21 - Complete redesign for canonical multi-source collection.
 *                       Export from /economicEvents/events/events/{eventId}.
 *                       Added superadmin RBAC gating, comprehensive field export, enterprise JSON format.
 * v1.0.0 - 2025-11-30 - Initial implementation for legacy per-source structure.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Container,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
} from '@mui/material';
import {
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const CANONICAL_EVENTS_ROOT = 'economicEvents';
const CANONICAL_EVENTS_CONTAINER = 'events';

/**
 * ExportEvents Component
 * 
 * Superadmin-only interface for exporting canonical economic events data.
 * Exports unified multi-source collection with all fields (NFS, JBlanked, GPT).
 */
export default function ExportEvents() {
  const { t } = useTranslation(['admin', 'actions']);
  const { userProfile, loading } = useAuth();
  const isSuperadmin = useMemo(() => userProfile?.role === 'superadmin', [userProfile?.role]);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Access control: Only superadmin can export
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!isSuperadmin) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Stack spacing={2} alignItems="center">
            <LockIcon sx={{ fontSize: 48, color: 'error.main' }} />
            <Typography variant="h5" fontWeight={800}>
              {t('admin:accessDenied')}
            </Typography>
            <Alert severity="error">
              {t('admin:requiresSuperadmin')}
            </Alert>
          </Stack>
        </Paper>
      </Container>
    );
  }

  /**
   * Convert Firestore Timestamp to ISO 8601 string
   */
  const timestampToIso = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.toDate) {
      return timestamp.toDate().toISOString();
    }
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    return null;
  };

  /**
   * Transform canonical event document to exportable format
   */
  const transformEvent = (docId, data) => {
    return {
      // Core identifiers
      eventId: data.eventId || docId,
      docId: docId,

      // Event metadata
      name: data.name || null,
      normalizedName: data.normalizedName || data.name || null,
      currency: data.currency || null,
      category: data.category || null,
      impact: data.impact || null,

      // Time
      datetimeUtc: timestampToIso(data.datetimeUtc),
      timezoneSource: data.timezoneSource || null,

      // Values (picked from priority source)
      forecast: data.forecast || null,
      previous: data.previous || null,
      actual: data.actual || null,
      status: data.status || 'scheduled',

      // Multi-source tracking
      sources: Object.entries(data.sources || {}).reduce((acc, [provider, source]) => {
        acc[provider] = {
          originalName: source.originalName || null,
          lastSeenAt: timestampToIso(source.lastSeenAt),
          parsed: source.parsed || {},
          raw: source.raw || {},
        };
        return acc;
      }, {}),

      // Metadata
      createdBy: data.createdBy || null,
      winnerSource: data.winnerSource || null,
      qualityScore: data.qualityScore || 0,
      createdAt: timestampToIso(data.createdAt),
      updatedAt: timestampToIso(data.updatedAt),
    };
  };

  /**
   * Export canonical events collection to JSON file
   */
  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setResult(null);

    try {
      // Query canonical events collection
      const eventsContainer = collection(
        db,
        CANONICAL_EVENTS_ROOT,
        CANONICAL_EVENTS_CONTAINER,
        CANONICAL_EVENTS_CONTAINER
      );

      const snapshot = await getDocs(eventsContainer);

      if (snapshot.empty) {
        setError(t('admin:noEventsFound'));
        return;
      }

      const eventCount = snapshot.size;

      // Transform documents
      const events = snapshot.docs.map((doc) => transformEvent(doc.id, doc.data()));

      // Generate export with metadata
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          exportedBy: userProfile?.email || 'superadmin',
          totalEvents: eventCount,
          version: '2.0.0',
          collectionPath: `${CANONICAL_EVENTS_ROOT}/${CANONICAL_EVENTS_CONTAINER}/${CANONICAL_EVENTS_CONTAINER}`,
          description: 'Canonical economic events with multi-source data (NFS, JBlanked-FF, GPT, JBlanked-MT, JBlanked-FXStreet)',
        },
        sources: {
          priority_order: ['nfs', 'jblanked-ff', 'gpt', 'jblanked-mt', 'jblanked-fxstreet'],
          description: 'Values are picked from highest-priority source that has data',
        },
        events: events,
      };

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `canonical-events-${timestamp}.json`;

      // Create and download file
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json; charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(url);

      setResult({
        success: true,
        filename: filename,
        eventCount: eventCount,
        timestamp: new Date().toISOString(),
        collectionPath: `${CANONICAL_EVENTS_ROOT}/${CANONICAL_EVENTS_CONTAINER}/${CANONICAL_EVENTS_CONTAINER}`,
      });
    } catch (err) {
      console.error('❌ Export failed:', err);
      setError(err.message || 'Failed to export events');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Navigate back to main app
   */
  const handleBack = () => {
    window.location.hash = '/';
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ minWidth: 'auto' }}
          >
            {t('actions:back')}
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {t('admin:exportCanonicalEvents')}
          </Typography>
        </Stack>

        {/* Description */}
        <Typography variant="body1" color="text.secondary" paragraph>
          {t('admin:exportDescription')}
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>📊 {t('admin:canonicalCollection')}:</strong> economicEvents/events/events<br />
            <strong>📋 {t('admin:formatLabel')}:</strong> {t('admin:enterpriseJSON')}
          </Typography>
        </Alert>

        {/* Export Button */}
        <Box sx={{ my: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={handleExport}
            disabled={exporting}
            fullWidth
            sx={{ py: 1.5 }}
          >
            {exporting ? t('admin:exportingEvents') : t('admin:downloadEventsJSON')}
          </Button>
        </Box>

        {/* Success Result */}
        {result && (
          <Card sx={{ mb: 3, bgcolor: 'success.light', border: '1px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ color: 'success.dark' }}>
                    {t('admin:exportSuccessful')}
                  </Typography>
                </Box>

                <Typography variant="body2">
                  <strong>📥 {t('admin:downloaded')}:</strong> {result.filename}
                </Typography>

                <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('admin:totalEvents')}
                      secondary={t('admin:eventsExported', { count: result.eventCount.toLocaleString() })}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('admin:collectionPath')}
                      secondary={result.collectionPath}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={t('admin:exportTime')}
                      secondary={new Date(result.timestamp).toLocaleString()}
                    />
                  </ListItem>
                </List>

                <Alert severity="info" icon={<DownloadIcon />}>
                  <Typography variant="caption">
                    {t('admin:fileDownloadedInfo')}
                  </Typography>
                </Alert>

                <Button
                  variant="outlined"
                  onClick={() => setResult(null)}
                  fullWidth
                >
                  {t('admin:exportAnother')}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert
            severity="error"
            icon={<ErrorIcon />}
            onClose={() => setError(null)}
            sx={{ mb: 3 }}
          >
            <Typography variant="subtitle2" gutterBottom>
              ❌ {t('admin:exportFailed')}
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {error}
            </Typography>
          </Alert>
        )}

        {/* Info Box */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 800 }}>
            📋 {t('admin:exportSpecification')}
          </Typography>
          <List dense sx={{ ml: 1 }}>
            <ListItem disableGutters>
              <Typography variant="caption" component="span">
                <strong>{t('admin:pathLabel')}:</strong> economicEvents/events/events/{`{eventId}`}
              </Typography>
            </ListItem>
            <ListItem disableGutters>
              <Typography variant="caption" component="span">
                <strong>{t('admin:fieldsLabel')}:</strong> {t('admin:fieldsDescription')}
              </Typography>
            </ListItem>
            <ListItem disableGutters>
              <Typography variant="caption" component="span">
                <strong>{t('admin:formatLabel')}:</strong> {t('admin:enterpriseJSONDescription')}
              </Typography>
            </ListItem>
            <ListItem disableGutters>
              <Typography variant="caption" component="span">
                <strong>{t('admin:timestampsLabel')}:</strong> {t('admin:iso8601Format')}
              </Typography>
            </ListItem>
            <ListItem disableGutters>
              <Typography variant="caption" component="span">
                <strong>{t('admin:priorityOrder')}:</strong> NFS → JBlanked-FF → GPT → JBlanked-MT → JBlanked-FXStreet
              </Typography>
            </ListItem>
          </List>
        </Box>
      </Paper>
    </Container>
  );
}
