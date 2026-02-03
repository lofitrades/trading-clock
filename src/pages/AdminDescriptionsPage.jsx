/**
 * src/pages/AdminDescriptionsPage.jsx
 *
 * Purpose: Admin page for managing economic event descriptions
 * RBAC: Superadmin only (expandable to admin role)
 * BEP: Full CRUD operations with validation and changelog tracking
 *
 * Changelog:
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
    Button,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import AdminDescriptionsTable from '../components/admin/AdminDescriptionsTable';
import AdminDescriptionDialog from '../components/admin/AdminDescriptionDialog';
import {
    fetchDescriptions,
    createDescription,
    updateDescription,
    deleteDescription,
    getCategories,
} from '../services/adminDescriptionsService';
import { useAuth } from '../contexts/AuthContext';
import { logAppEvent } from '../utils/analytics';

const AdminDescriptionsPage = () => {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();
    const { user, userProfile } = useAuth();

    const [descriptions, setDescriptions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [impactFilter, setImpactFilter] = useState('');

    // Dialog state for create/edit
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDescription, setEditingDescription] = useState(null);

    // Check RBAC on mount
    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        if (userProfile?.role !== 'superadmin') {
            navigate('/', { replace: true });
            setError(t('superadminOnly'));
            return;
        }
    }, [user, userProfile?.role, navigate, t]);

    // Fetch descriptions and categories on mount
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [fetchedDescriptions, fetchedCategories] = await Promise.all([
                    fetchDescriptions(),
                    getCategories(),
                ]);
                setDescriptions(fetchedDescriptions);
                setCategories(fetchedCategories);
            } catch (err) {
                console.error('Error loading data:', err);
                setError(t('descriptions.notifications.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        if (user && userProfile?.role === 'superadmin') {
            loadData();
        }
    }, [user, userProfile?.role, t]);

    // Handle download descriptions as JSON
    const handleDownload = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch all descriptions without filters
            const allDescriptions = await fetchDescriptions({});

            // Create export data with metadata
            const exportData = {
                metadata: {
                    version: '2.0.0',
                    exportDate: new Date().toISOString(),
                    exportedBy: user?.email || 'unknown',
                    totalEvents: allDescriptions.length,
                    languages: ['en', 'es', 'fr'],
                },
                events: allDescriptions,
            };

            // Create JSON string and blob
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `economicEventDescriptions_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSnackbar({
                open: true,
                message: t('descriptions.notifications.downloadSuccess'),
                severity: 'success',
            });

            logAppEvent('admin_descriptions_download', {
                eventCount: allDescriptions.length,
            }).catch(err => console.warn('Analytics error:', err));
        } catch (err) {
            console.error('Error downloading descriptions:', err);
            setSnackbar({
                open: true,
                message: t('descriptions.notifications.downloadError'),
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [user, t]);

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const filters = {
                category: categoryFilter || null,
                impact: impactFilter || null,
                searchQuery: searchQuery || null,
            };
            const fetchedDescriptions = await fetchDescriptions(filters);
            setDescriptions(fetchedDescriptions);
            setSnackbar({
                open: true,
                message: t('descriptions.notifications.refreshSuccess'),
                severity: 'success',
            });
        } catch (err) {
            console.error('Error refreshing:', err);
            setError(t('descriptions.notifications.fetchError'));
        } finally {
            setLoading(false);
        }
    }, [categoryFilter, impactFilter, searchQuery, t]);

    // Handle filter changes with debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (user && userProfile?.role === 'superadmin') {
                handleRefresh();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, categoryFilter, impactFilter]);

    // Handle inline edit
    const handleDescriptionUpdate = useCallback(async (id, updates, reason, originalData) => {
        try {
            await updateDescription(id, updates, reason, user, originalData);

            // Update local state
            setDescriptions(prev =>
                prev.map(d => (d.id === id ? { ...d, ...updates } : d))
            );

            setSnackbar({
                open: true,
                message: t('descriptions.notifications.updateSuccess'),
                severity: 'success',
            });

            logAppEvent('admin_description_update', {
                descriptionId: id,
                fields: Object.keys(updates),
            }).catch(err => console.warn('Analytics error:', err));
        } catch (err) {
            console.error('Error updating description:', err);
            setSnackbar({
                open: true,
                message: t('descriptions.notifications.updateError'),
                severity: 'error',
            });
            throw err;
        }
    }, [user, t]);

    // Handle create new
    const handleCreate = useCallback(async (descriptionData) => {
        try {
            const newDescription = await createDescription(descriptionData, user);

            setDescriptions(prev => [...prev, newDescription]);
            setDialogOpen(false);
            setEditingDescription(null);

            setSnackbar({
                open: true,
                message: t('descriptions.notifications.createSuccess'),
                severity: 'success',
            });

            logAppEvent('admin_description_create', {
                descriptionName: descriptionData.name,
            }).catch(err => console.warn('Analytics error:', err));
        } catch (err) {
            console.error('Error creating description:', err);
            setSnackbar({
                open: true,
                message: err.message || t('descriptions.notifications.createError'),
                severity: 'error',
            });
            throw err;
        }
    }, [user, t]);

    // Handle delete
    const handleDelete = useCallback(async (id) => {
        try {
            await deleteDescription(id);

            setDescriptions(prev => prev.filter(d => d.id !== id));

            setSnackbar({
                open: true,
                message: t('descriptions.notifications.deleteSuccess'),
                severity: 'success',
            });

            logAppEvent('admin_description_delete', {
                descriptionId: id,
            }).catch(err => console.warn('Analytics error:', err));
        } catch (err) {
            console.error('Error deleting description:', err);
            setSnackbar({
                open: true,
                message: t('descriptions.notifications.deleteError'),
                severity: 'error',
            });
        }
    }, [t]);

    // Handle open create dialog
    const handleOpenCreateDialog = useCallback(() => {
        setEditingDescription(null);
        setDialogOpen(true);
    }, []);

    // Handle open edit dialog
    const handleOpenEditDialog = useCallback((description) => {
        setEditingDescription(description);
        setDialogOpen(true);
    }, []);

    // Handle close snackbar
    const handleCloseSnackbar = useCallback(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    // RBAC check
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
                    {t('descriptions.pageTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {t('descriptions.pageSubtitle')}
                </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', md: 'center' }}
                >
                    {/* Search */}
                    <TextField
                        size="small"
                        placeholder={t('descriptions.filters.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ minWidth: 250 }}
                    />

                    {/* Category Filter */}
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>{t('descriptions.filters.category')}</InputLabel>
                        <Select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            label={t('descriptions.filters.category')}
                        >
                            <MenuItem value="">{t('descriptions.filters.allCategories')}</MenuItem>
                            {categories.map((cat) => (
                                <MenuItem key={cat} value={cat}>
                                    {cat}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Impact Filter */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>{t('descriptions.filters.impact')}</InputLabel>
                        <Select
                            value={impactFilter}
                            onChange={(e) => setImpactFilter(e.target.value)}
                            label={t('descriptions.filters.impact')}
                        >
                            <MenuItem value="">{t('descriptions.filters.allImpacts')}</MenuItem>
                            <MenuItem value="high">{t('events.impacts.highImpact')}</MenuItem>
                            <MenuItem value="medium">{t('events.impacts.mediumImpact')}</MenuItem>
                            <MenuItem value="low">{t('events.impacts.lowImpact')}</MenuItem>
                            <MenuItem value="none">{t('events.impacts.nonEconomic')}</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Spacer */}
                    <Box sx={{ flexGrow: 1 }} />

                    {/* Actions */}
                    <Stack direction="row" spacing={1}>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownload}
                            disabled={loading || descriptions.length === 0}
                            title={t('descriptions.actions.downloadTooltip') || 'Download as JSON'}
                        >
                            {t('descriptions.actions.download') || 'Download'}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            {t('descriptions.actions.refresh')}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenCreateDialog}
                        >
                            {t('descriptions.actions.addNew')}
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {/* Loading State */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Table */}
            {!loading && (
                <AdminDescriptionsTable
                    descriptions={descriptions}
                    loading={loading}
                    onUpdate={handleDescriptionUpdate}
                    onEdit={handleOpenEditDialog}
                    onDelete={handleDelete}
                />
            )}

            {/* Create/Edit Dialog */}
            <AdminDescriptionDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setEditingDescription(null);
                }}
                onSave={editingDescription ? handleDescriptionUpdate : handleCreate}
                description={editingDescription}
                categories={categories}
            />

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminDescriptionsPage;
