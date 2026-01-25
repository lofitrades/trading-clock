/**
 * src/components/ExportEvents.jsx
 * 
 * Purpose: Superadmin-only page for exporting canonical economic events from Firestore.
 * Exports unified multi-source events with all fields (NFS, JBlanked, GPT) in enterprise JSON format.
 * Requires superadmin RBAC role.
 * 
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
              Access Denied
            </Typography>
            <Alert severity="error">
              This page requires <strong>superadmin</strong> role. You do not have permission to export events.
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
        setError('No events found in canonical collection.');
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
            Back
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Export Canonical Events
          </Typography>
        </Stack>

        {/* Description */}
        <Typography variant="body1" color="text.secondary" paragraph>
          Export all unified economic events from the canonical multi-source collection. Each event
          includes data from all available sources (NFS, JBlanked-FF, GPT, JBlanked-MT, JBlanked-FXStreet)
          with values picked from the highest-priority source.
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>📊 Canonical Collection:</strong> economicEvents/events/events<br />
            <strong>📋 Format:</strong> Enterprise JSON with metadata and multi-source tracking
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
            {exporting ? 'Exporting Events...' : 'Download Canonical Events'}
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
                    Export Successful
                  </Typography>
                </Box>

                <Typography variant="body2">
                  <strong>📥 Downloaded:</strong> {result.filename}
                </Typography>

                <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Total Events"
                      secondary={`${result.eventCount.toLocaleString()} events exported`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Collection Path"
                      secondary={result.collectionPath}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Export Time"
                      secondary={new Date(result.timestamp).toLocaleString()}
                    />
                  </ListItem>
                </List>

                <Alert severity="info" icon={<DownloadIcon />}>
                  <Typography variant="caption">
                    File downloaded to Downloads folder. Move to <code>data/</code> folder if needed.
                  </Typography>
                </Alert>

                <Button
                  variant="outlined"
                  onClick={() => setResult(null)}
                  fullWidth
                >
                  Export Another
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
              ❌ Export Failed
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {error}
            </Typography>
          </Alert>
        )}

        {/* Info Box */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 800 }}>
            📋 Export Specification
          </Typography>
          <List dense sx={{ ml: 1 }}>
            <ListItem disableGutters>
              <Typography variant="caption" component="span">
                <strong>Path:</strong> economicEvents/events/events/{`{eventId}`}
              </Typography>
            </ListItem>
            <ListItem disableGutters>
              <Typography variant="caption" component="span">
                <strong>Fields:</strong> All canonical fields including sources multi-source tracking
              </Typography>
            </ListItem>
            <ListItem disableGutters>
              <Typography variant="caption" component="span">
                <strong>Format:</strong> Enterprise JSON with metadata and version
              </Typography>
            </ListItem>
            <ListItem disableGutters>
              <Typography variant="caption" component="span">
                <strong>Timestamps:</strong> ISO 8601 format (UTC)
              </Typography>
            </ListItem>
            <ListItem disableGutters>
              <Typography variant="caption" component="span">
                <strong>Priority Order:</strong> NFS → JBlanked-FF → GPT → JBlanked-MT → JBlanked-FXStreet
              </Typography>
            </ListItem>
          </List>
        </Box>
      </Paper>
    </Container>
  );
}
