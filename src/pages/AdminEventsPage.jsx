/**
 * src/pages/AdminEventsPage.jsx
 * 
 * Purpose: Admin event management page with filtering and inline editing
 * RBAC: Superadmin only (expandable to admin role)
 * BEP: Full timezone support - admin sees/edits events in their selected timezone
 * 
 * Changelog:
 * v1.2.0 - 2026-02-02 - BEP TIMEZONE: Display/edit in admin's timezone. System converts to UTC on save.
 * v1.1.0 - 2026-02-02 - BEP: Added validation, datetimeUtc recalculation, timezone info
 * v1.0.0 - 2026-02-02 - Initial implementation with BEP standards
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Alert,
    Snackbar,
    CircularProgress,
} from '@mui/material';
import AdminEventsFilters from '../components/admin/AdminEventsFilters';
import AdminEventsTable from '../components/admin/AdminEventsTable';
import {
    fetchEventsInTimezone,
    updateEventWithTimezone,
    validateFieldUpdate
} from '../services/adminEventsService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { logAppEvent } from '../utils/analytics';

const AdminEventsPage = () => {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();
    const { settings } = useSettings();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [hasSearched, setHasSearched] = useState(false);

    // Check RBAC on mount
    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        // Currently superadmin only (TODO: expand to admin role)
        if (userProfile?.role !== 'superadmin') {
            navigate('/', { replace: true });
            setError(t('superadminOnly'));
            return;
        }

        // Force token refresh to ensure custom claims are up to date
        const refreshToken = async () => {
            try {
                await user.getIdToken(true); // Force refresh
                const tokenResult = await user.getIdTokenResult();
                // Debug: Token refreshed with custom claims
            } catch (err) {
                console.error('Failed to refresh token:', err);
            }
        };

        refreshToken();
    }, [user, userProfile?.role, navigate, t]);

    // Get timezone from settings (admin's preferred timezone)
    const timezone = settings?.timezone || 'America/New_York';

    // Handle filter submission - fetch events in admin's timezone
    const handleFilter = useCallback(async (filters) => {
        setLoading(true);
        setError('');
        setHasSearched(true);

        try {
            // Fetch events and convert to admin's timezone for display
            const fetchedEvents = await fetchEventsInTimezone(filters, timezone);
            setEvents(fetchedEvents);

            // Log analytics event
            logAppEvent('admin_events_search', {
                filters: JSON.stringify(filters),
                resultCount: fetchedEvents.length,
                timezone,
            }).catch(err => console.warn('Analytics error:', err));
        } catch (err) {
            console.error('Error fetching events:', err);
            setError(t('events.notifications.fetchError'));
            setSnackbar({
                open: true,
                message: t('events.notifications.fetchError'),
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [t, timezone]);

    // Handle event update - admin edits in their timezone, system converts to UTC
    const handleEventUpdate = useCallback(async (eventId, updates, reason, originalEvent) => {
        try {
            // Validate each field before update
            for (const [field, value] of Object.entries(updates)) {
                const validation = validateFieldUpdate(field, value);
                if (!validation.valid) {
                    throw new Error(validation.error);
                }
            }

            // Update with timezone conversion (admin TZ -> UTC)
            const result = await updateEventWithTimezone(
                eventId,
                updates,
                { uid: user.uid, email: user.email },
                reason,
                originalEvent,
                timezone // Admin's timezone for conversion
            );

            // Update local state with the values admin sees (their timezone)
            // Keep the local display values, but update any changed fields
            setEvents(prevEvents =>
                prevEvents.map(event =>
                    event.id === eventId
                        ? {
                            ...event,
                            ...updates,
                            // Store UTC values for backend reference
                            dateUtc: result.utcDate || event.dateUtc,
                            timeUtc: result.utcTime || event.timeUtc,
                        }
                        : event
                )
            );

            // Log analytics event
            logAppEvent('admin_event_update', {
                eventId,
                fields: Object.keys(updates),
                hasReason: !!reason,
                timezone,
            }).catch(err => console.warn('Analytics error:', err));

            setSnackbar({
                open: true,
                message: t('events.notifications.updateSuccess'),
                severity: 'success',
            });
        } catch (err) {
            console.error('Error updating event:', err);
            setSnackbar({
                open: true,
                message: t('events.notifications.updateError'),
                severity: 'error',
            });
            throw err;
        }
    }, [user, t, timezone]);

    // Handle snackbar close
    const handleSnackbarClose = useCallback(() => {
        setSnackbar({ ...snackbar, open: false });
    }, [snackbar]);

    // Show access denied if not superadmin
    if (!user || userProfile?.role !== 'superadmin') {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error">
                    <Typography variant="h6">{t('accessDenied')}</Typography>
                    <Typography>{t('superadminOnly')}</Typography>
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 } }}>
            {/* Page Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {t('events.pageTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {t('events.pageSubtitle', { timezone })}
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <AdminEventsFilters onFilter={handleFilter} timezone={timezone} />

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Table */}
            {!loading && hasSearched && (
                <AdminEventsTable
                    events={events}
                    loading={loading}
                    onEventUpdate={handleEventUpdate}
                    timezone={timezone}
                />
            )}

            {/* Initial State */}
            {!loading && !hasSearched && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8,
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {t('events.table.noData')}
                    </Typography>
                </Box>
            )}

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminEventsPage;
