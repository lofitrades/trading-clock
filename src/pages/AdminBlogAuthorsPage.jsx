/**
 * src/pages/AdminBlogAuthorsPage.jsx
 * 
 * Purpose: Admin page for managing blog authors (profiles, bios, social links).
 * RBAC: admin and superadmin roles only (authors are independent of user accounts)
 * BEP: Full i18n support, theme-aware, responsive design, CRUD operations
 * 
 * Design Decision: Authors do NOT need user accounts with roles.
 * - Authors are public-facing profiles for attribution/byline purposes
 * - Allows guest authors, external contributors, or brand personas
 * - CMS access to manage authors is restricted to admin/superadmin roles
 * 
 * Changelog:
 * v1.1.0 - 2026-02-05 - ACTIVITY LOGGING: Log blog_author_created/updated/deleted to systemActivityLog for all author CRUD operations. Tracks field changes and admin userId for audit trail (Phase 8.0).
 * v1.0.0 - 2026-02-04 - Initial implementation (Phase 5.B Blog)
 */

import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    Alert,
    Snackbar,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    TextField,
    Stack,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import {
    listBlogAuthors,
    createBlogAuthor,
    updateBlogAuthor,
    deleteBlogAuthor,
    generateAuthorSlug,
    isAuthorSlugAvailable,
} from '../services/blogAuthorService';
import ConfirmDialog from '../components/ConfirmDialog';
import { logBlogAuthorCreated, logBlogAuthorUpdated, logBlogAuthorDeleted } from '../services/activityLogger';

/**
 * Author Editor Dialog - Create/Edit author profile
 */
const AuthorEditorDialog = ({
    open,
    onClose,
    onSave,
    author = null,
    saving = false,
    t,
}) => {
    const isEditMode = Boolean(author?.id);
    const [formData, setFormData] = useState({
        displayName: '',
        slug: '',
        bio: '',
        avatar: { url: '', alt: '' },
        social: { twitter: '', linkedin: '' },
    });
    const [slugError, setSlugError] = useState('');
    const [slugChecking, setSlugChecking] = useState(false);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            if (author) {
                setFormData({
                    displayName: author.displayName || '',
                    slug: author.slug || '',
                    bio: author.bio || '',
                    avatar: {
                        url: author.avatar?.url || '',
                        alt: author.avatar?.alt || '',
                    },
                    social: {
                        twitter: author.social?.twitter || '',
                        linkedin: author.social?.linkedin || '',
                    },
                });
            } else {
                setFormData({
                    displayName: '',
                    slug: '',
                    bio: '',
                    avatar: { url: '', alt: '' },
                    social: { twitter: '', linkedin: '' },
                });
            }
            setSlugError('');
        }
    }, [open, author]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (field === 'slug') {
            setSlugError('');
        }
    };

    const handleNestedChange = (parent, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value },
        }));
    };

    // Generate slug from display name
    const handleGenerateSlug = () => {
        const newSlug = generateAuthorSlug(formData.displayName);
        handleChange('slug', newSlug);
        validateSlug(newSlug);
    };

    // Validate slug uniqueness
    const validateSlug = async (slug) => {
        if (!slug) {
            setSlugError('');
            return true;
        }

        setSlugChecking(true);
        try {
            const available = await isAuthorSlugAvailable(slug, author?.id);
            if (!available) {
                setSlugError(t('admin:blog.authors.slugTaken', 'This slug is already taken'));
                return false;
            }
            setSlugError('');
            return true;
        } finally {
            setSlugChecking(false);
        }
    };

    const handleSlugBlur = () => {
        if (formData.slug) {
            validateSlug(formData.slug);
        }
    };

    const handleSubmit = async () => {
        // Validate required fields
        if (!formData.displayName.trim()) {
            return;
        }

        // Validate slug
        if (!formData.slug.trim()) {
            setSlugError(t('admin:blog.authors.slugRequired', 'Slug is required'));
            return;
        }

        const isValid = await validateSlug(formData.slug);
        if (!isValid) return;

        onSave(formData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {isEditMode
                    ? t('admin:blog.authors.editAuthor', 'Edit Author')
                    : t('admin:blog.authors.newAuthor', 'New Author')}
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {/* Display Name */}
                    <TextField
                        label={t('admin:blog.authors.displayName', 'Display Name')}
                        value={formData.displayName}
                        onChange={(e) => handleChange('displayName', e.target.value)}
                        required
                        fullWidth
                        helperText={t('admin:blog.authors.displayNameHelp', 'Public name shown on posts')}
                    />

                    {/* Slug */}
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                            <TextField
                                label={t('admin:blog.authors.slug', 'URL Slug')}
                                value={formData.slug}
                                onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                onBlur={handleSlugBlur}
                                required
                                fullWidth
                                error={Boolean(slugError)}
                                helperText={slugError || t('admin:blog.authors.slugHelp', 'URL-friendly identifier (e.g., john-smith)')}
                                slotProps={{
                                    input: {
                                        endAdornment: slugChecking ? <CircularProgress size={20} /> : null,
                                    },
                                }}
                            />
                            <Button
                                variant="outlined"
                                onClick={handleGenerateSlug}
                                disabled={!formData.displayName}
                                sx={{ mt: 1, whiteSpace: 'nowrap' }}
                            >
                                {t('admin:blog.authors.generateSlug', 'Generate')}
                            </Button>
                        </Stack>
                    </Box>

                    {/* Bio */}
                    <TextField
                        label={t('admin:blog.authors.bio', 'Bio')}
                        value={formData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                        helperText={t('admin:blog.authors.bioHelp', 'Short biography (max 500 characters)')}
                        slotProps={{
                            htmlInput: { maxLength: 500 },
                        }}
                    />

                    {/* Avatar */}
                    <Typography variant="subtitle2" sx={{ mb: -1.5 }}>
                        {t('admin:blog.authors.avatar', 'Avatar Image')}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label={t('admin:blog.authors.avatarUrl', 'Image URL')}
                            value={formData.avatar.url}
                            onChange={(e) => handleNestedChange('avatar', 'url', e.target.value)}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label={t('admin:blog.authors.avatarAlt', 'Alt Text')}
                            value={formData.avatar.alt}
                            onChange={(e) => handleNestedChange('avatar', 'alt', e.target.value)}
                            fullWidth
                            size="small"
                        />
                    </Stack>
                    {formData.avatar.url && (
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Avatar
                                src={formData.avatar.url}
                                alt={formData.avatar.alt || formData.displayName}
                                sx={{ width: 80, height: 80 }}
                            />
                        </Box>
                    )}

                    {/* Social Links */}
                    <Typography variant="subtitle2" sx={{ mb: -1.5 }}>
                        {t('admin:blog.authors.socialLinks', 'Social Links')}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            label={t('admin:blog.authors.twitter', 'Twitter/X Handle')}
                            value={formData.social.twitter}
                            onChange={(e) => handleNestedChange('social', 'twitter', e.target.value.replace('@', ''))}
                            fullWidth
                            size="small"
                            placeholder="username"
                            slotProps={{
                                input: {
                                    startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>@</Typography>,
                                },
                            }}
                        />
                        <TextField
                            label={t('admin:blog.authors.linkedin', 'LinkedIn URL')}
                            value={formData.social.linkedin}
                            onChange={(e) => handleNestedChange('social', 'linkedin', e.target.value)}
                            fullWidth
                            size="small"
                            placeholder="https://linkedin.com/in/..."
                        />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>
                    {t('common:cancel', 'Cancel')}
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={saving || !formData.displayName.trim() || !formData.slug.trim() || Boolean(slugError)}
                    startIcon={saving ? <CircularProgress size={20} /> : null}
                >
                    {saving
                        ? t('common:saving', 'Saving...')
                        : isEditMode
                            ? t('common:save', 'Save')
                            : t('common:create', 'Create')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

AuthorEditorDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    author: PropTypes.object,
    saving: PropTypes.bool,
    t: PropTypes.func.isRequired,
};

/**
 * Format timestamp for display
 */
const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Only admin and superadmin can manage authors (defined outside component for stable reference)
const AUTHOR_MANAGEMENT_ROLES = ['superadmin', 'admin'];

const AdminBlogAuthorsPage = () => {
    const { t } = useTranslation(['admin', 'common']);
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();

    // State
    const [authors, setAuthors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    // Dialogs
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingAuthor, setEditingAuthor] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, authorId: null, authorName: '' });

    // RBAC check
    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        if (!hasRole(AUTHOR_MANAGEMENT_ROLES)) {
            navigate('/', { replace: true });
            return;
        }
    }, [user, hasRole, navigate]);

    // Load authors
    const loadAuthors = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const loadedAuthors = await listBlogAuthors();
            setAuthors(loadedAuthors);
        } catch (err) {
            console.error('Failed to load authors:', err);
            setError(err.message || t('admin:blog.authors.loadError', 'Failed to load authors'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        if (hasRole(AUTHOR_MANAGEMENT_ROLES)) {
            loadAuthors();
        }
    }, [loadAuthors, hasRole]);

    // Filter authors by search query
    const filteredAuthors = authors.filter((author) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            author.displayName?.toLowerCase().includes(query) ||
            author.slug?.toLowerCase().includes(query) ||
            author.bio?.toLowerCase().includes(query)
        );
    });

    // Open editor for new author
    const handleNew = () => {
        setEditingAuthor(null);
        setEditorOpen(true);
    };

    // Open editor for existing author
    const handleEdit = (author) => {
        setEditingAuthor(author);
        setEditorOpen(true);
    };

    // Save author (create or update)
    const handleSave = async (formData) => {
        setSaving(true);
        try {
            if (editingAuthor?.id) {
                // Update existing
                await updateBlogAuthor(editingAuthor.id, formData);
                setSnackbar({
                    open: true,
                    message: t('admin:blog.authors.updateSuccess', 'Author updated successfully'),
                    severity: 'success',
                });

                // ADMIN AUDIT: Log author update
                const fieldsChanged = Object.keys(formData).filter(key => formData[key] !== editingAuthor[key]);
                await logBlogAuthorUpdated(editingAuthor.id, formData.displayName, fieldsChanged, user.uid);
            } else {
                // Create new
                const newAuthor = await createBlogAuthor(formData);
                setSnackbar({
                    open: true,
                    message: t('admin:blog.authors.createSuccess', 'Author created successfully'),
                    severity: 'success',
                });

                // ADMIN AUDIT: Log author creation
                await logBlogAuthorCreated(newAuthor.id, formData.displayName, user.uid);
            }
            setEditorOpen(false);
            setEditingAuthor(null);
            loadAuthors();
        } catch (err) {
            setSnackbar({ open: true, message: err.message, severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // Delete confirmation
    const handleDeleteConfirm = (author) => {
        setDeleteDialog({ open: true, authorId: author.id, authorName: author.displayName });
    };

    // Delete author
    const handleDelete = async () => {
        const { authorId, authorName } = deleteDialog;
        setDeleteDialog({ open: false, authorId: null, authorName: '' });

        try {
            await deleteBlogAuthor(authorId);
            setSnackbar({
                open: true,
                message: t('admin:blog.authors.deleteSuccess', 'Author deleted successfully'),
                severity: 'success',
            });

            // ADMIN AUDIT: Log author deletion
            await logBlogAuthorDeleted(authorId, authorName, user.uid);

            loadAuthors();
        } catch (err) {
            setSnackbar({ open: true, message: err.message, severity: 'error' });
        }
    };

    // View author public page
    const handleView = (author) => {
        if (author.slug) {
            window.open(`/blog/author/${author.slug}`, '_blank');
        }
    };

    if (!hasRole(AUTHOR_MANAGEMENT_ROLES)) {
        return null;
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/blog')}
                    >
                        {t('common:back', 'Back')}
                    </Button>
                    <Typography variant="h4" component="h1">
                        {t('admin:blog.authors.title', 'Blog Authors')}
                    </Typography>
                </Stack>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleNew}>
                    {t('admin:blog.authors.newAuthor', 'New Author')}
                </Button>
            </Box>

            {/* Info alert */}
            <Alert severity="info" sx={{ mb: 3 }}>
                {t('admin:blog.authors.infoAlert', 'Authors are public profiles for attribution on blog posts. They do not need to have user accounts.')}
            </Alert>

            {/* Search & Refresh */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        size="small"
                        label={t('admin:blog.authors.search', 'Search authors...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 250, flexGrow: 1 }}
                    />
                    <Button startIcon={<RefreshIcon />} onClick={loadAuthors} disabled={loading}>
                        {t('common:refresh', 'Refresh')}
                    </Button>
                </Stack>
            </Paper>

            {/* Error display */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Loading state */}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Authors table */}
            {!loading && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('admin:blog.authors.columns.avatar', 'Avatar')}</TableCell>
                                <TableCell>{t('admin:blog.authors.columns.name', 'Name')}</TableCell>
                                <TableCell>{t('admin:blog.authors.columns.slug', 'Slug')}</TableCell>
                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                    {t('admin:blog.authors.columns.social', 'Social')}
                                </TableCell>
                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                    {t('admin:blog.authors.columns.updated', 'Updated')}
                                </TableCell>
                                <TableCell align="right">{t('admin:blog.authors.columns.actions', 'Actions')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAuthors.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <Typography color="text.secondary">
                                            {searchQuery
                                                ? t('admin:blog.authors.noResults', 'No authors found')
                                                : t('admin:blog.authors.noAuthors', 'No authors yet. Create your first author!')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAuthors.map((author) => (
                                    <TableRow key={author.id} hover>
                                        <TableCell>
                                            <Avatar
                                                src={author.avatar?.url}
                                                alt={author.displayName}
                                                sx={{ width: 40, height: 40 }}
                                            >
                                                <PersonIcon />
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {author.displayName}
                                            </Typography>
                                            {author.bio && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 1,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        maxWidth: 300,
                                                    }}
                                                >
                                                    {author.bio}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                {author.slug}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                            <Stack direction="row" spacing={0.5}>
                                                {author.social?.twitter && (
                                                    <Chip
                                                        icon={<TwitterIcon />}
                                                        label={`@${author.social.twitter}`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                                {author.social?.linkedin && (
                                                    <Tooltip title="LinkedIn">
                                                        <LinkedInIcon fontSize="small" color="action" />
                                                    </Tooltip>
                                                )}
                                                {!author.social?.twitter && !author.social?.linkedin && (
                                                    <Typography variant="caption" color="text.secondary">—</Typography>
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                            {formatDate(author.updatedAt)}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                <Tooltip title={t('admin:blog.authors.view', 'View public page')}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleView(author)}
                                                        disabled={!author.slug}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('common:edit', 'Edit')}>
                                                    <IconButton size="small" onClick={() => handleEdit(author)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('common:delete', 'Delete')}>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteConfirm(author)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Author Editor Dialog */}
            <AuthorEditorDialog
                open={editorOpen}
                onClose={() => {
                    setEditorOpen(false);
                    setEditingAuthor(null);
                }}
                onSave={handleSave}
                author={editingAuthor}
                saving={saving}
                t={t}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={deleteDialog.open}
                title={t('admin:blog.authors.deleteConfirm.title', 'Delete Author?')}
                message={t('admin:blog.authors.deleteConfirm.message', {
                    name: deleteDialog.authorName,
                    defaultValue: `Are you sure you want to delete "${deleteDialog.authorName}"? Posts referencing this author will no longer show author info.`,
                })}
                confirmText={t('common:delete', 'Delete')}
                confirmColor="error"
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false, authorId: null, authorName: '' })}
            />

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={5000}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminBlogAuthorsPage;
