/**
 * src/pages/AdminBlogPage.jsx
 * 
 * Purpose: Admin blog management page with list, filters, and CRUD actions.
 * RBAC: superadmin, admin, editor roles only
 * BEP: Full i18n support, theme-aware, responsive design
 * 
 * Changelog:
 * v1.7.0 - 2026-02-05 - Added activity logging for publish/unpublish/delete actions
 * v1.6.0 - 2026-02-06 - BEP: Added BlogUploadDrawer for GPT-generated JSON blog post uploads
 * v1.5.0 - 2026-02-05 - BEP: Added Authors button in header for admin/superadmin to access author management
 * v1.4.0 - 2026-02-04 - BEP: Published posts view URL now always uses /blog/:slug (no language prefix). Language routing handled by Firebase rewrites. Matches EventPage pattern.
 * v1.3.0 - 2026-02-04 - BEP: Preview URL always uses /blog/:slug (no language prefix)
 * v1.2.0 - 2026-02-04 - BEP: View icon now uses current UI language instead of defaulting to EN
 * v1.1.0 - 2026-02-04 - Added View and Duplicate action icons per row
 * v1.0.0 - 2026-02-04 - Initial implementation (Phase 2 Blog)
 */

import { useState, useCallback, useEffect } from 'react';
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
    Chip,
    IconButton,
    Tooltip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublishIcon from '@mui/icons-material/Publish';
import UnpublishedIcon from '@mui/icons-material/Unpublished';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PeopleIcon from '@mui/icons-material/People';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useAuth } from '../contexts/AuthContext';
import { listBlogPosts, deleteBlogPost, publishBlogPost, unpublishBlogPost, duplicateBlogPost } from '../services/blogService';
import { BLOG_POST_STATUS, BLOG_CATEGORIES, BLOG_CMS_ROLES, DEFAULT_BLOG_LANGUAGE } from '../types/blogTypes';
import {
    logBlogPublished,
    logBlogDeleted,
} from '../services/activityLogger';
import ConfirmDialog from '../components/ConfirmDialog';
import BlogUploadDrawer from '../components/BlogUploadDrawer';

/**
 * Status chip color mapping
 */
const getStatusColor = (status) => {
    switch (status) {
        case BLOG_POST_STATUS.PUBLISHED:
            return 'success';
        case BLOG_POST_STATUS.DRAFT:
            return 'warning';
        case BLOG_POST_STATUS.UNPUBLISHED:
            return 'default';
        default:
            return 'default';
    }
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

const AdminBlogPage = () => {
    const { t, i18n } = useTranslation(['admin', 'common']);
    const navigate = useNavigate();
    const { user, hasRole } = useAuth();

    // State
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Delete confirmation
    const [deleteDialog, setDeleteDialog] = useState({ open: false, postId: null, postTitle: '' });

    // Upload drawer
    const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);

    // RBAC check
    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        if (!hasRole(BLOG_CMS_ROLES)) {
            navigate('/', { replace: true });
            return;
        }
    }, [user, hasRole, navigate]);

    // Load posts
    const loadPosts = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const options = {
                includeAllStatuses: true, // CMS can see all statuses
                pageSize: 50,
            };

            if (statusFilter) {
                options.status = statusFilter;
            }

            if (categoryFilter) {
                options.category = categoryFilter;
            }

            const { posts: loadedPosts } = await listBlogPosts(options);
            setPosts(loadedPosts);
        } catch (err) {
            console.error('Failed to load posts:', err);
            setError(err.message || 'Failed to load posts');
        } finally {
            setLoading(false);
        }
    }, [statusFilter, categoryFilter]);

    useEffect(() => {
        if (hasRole(BLOG_CMS_ROLES)) {
            loadPosts();
        }
    }, [loadPosts, hasRole]);

    // Filter posts by search query (client-side)
    const filteredPosts = posts.filter((post) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();

        // Search in all language titles
        for (const content of Object.values(post.languages || {})) {
            if (content.title?.toLowerCase().includes(query)) return true;
            if (content.slug?.toLowerCase().includes(query)) return true;
        }

        // Search in tags
        if (post.tags?.some((tag) => tag.toLowerCase().includes(query))) return true;

        return false;
    });

    // Actions
    const handlePublish = async (post) => {
        try {
            await publishBlogPost(post.id);
            setSnackbar({ open: true, message: t('admin:blog.publishSuccess'), severity: 'success' });

            // Log activity: blog published
            const primaryTitle = post.languages?.[DEFAULT_BLOG_LANGUAGE]?.title
                || Object.values(post.languages || {}).find(l => l.title)?.title
                || 'Untitled';
            const languageKeys = Object.keys(post.languages || {});
            await logBlogPublished(primaryTitle, post.id, user.uid, languageKeys);

            loadPosts();
        } catch (err) {
            setSnackbar({ open: true, message: err.message, severity: 'error' });
        }
    };

    const handleUnpublish = async (post) => {
        try {
            await unpublishBlogPost(post.id);
            setSnackbar({ open: true, message: t('admin:blog.unpublishSuccess'), severity: 'success' });
            loadPosts();
        } catch (err) {
            setSnackbar({ open: true, message: err.message, severity: 'error' });
        }
    };

    const handleDeleteConfirm = (postId, postTitle) => {
        setDeleteDialog({ open: true, postId, postTitle });
    };

    const handleDelete = async () => {
        const { postId, postTitle } = deleteDialog;
        setDeleteDialog({ open: false, postId: null, postTitle: '' });

        try {
            await deleteBlogPost(postId);
            setSnackbar({ open: true, message: t('admin:blog.deleteSuccess'), severity: 'success' });

            // Log activity: blog deleted
            await logBlogDeleted(postTitle || 'Untitled', postId, user.uid);

            loadPosts();
        } catch (err) {
            setSnackbar({ open: true, message: err.message, severity: 'error' });
        }
    };

    // View post - opens published URL or preview for drafts
    // BEP: Prefer current UI language, fallback to default, then first available
    const handleView = (post) => {
        const currentLang = i18n.language?.split('-')[0] || DEFAULT_BLOG_LANGUAGE;

        // Priority: 1) Current UI language, 2) Default language, 3) First available
        let lang;
        if (post.languages?.[currentLang]?.slug) {
            lang = currentLang;
        } else if (post.languages?.[DEFAULT_BLOG_LANGUAGE]?.slug) {
            lang = DEFAULT_BLOG_LANGUAGE;
        } else {
            lang = Object.keys(post.languages || {}).find(l => post.languages[l]?.slug);
        }

        const slug = post.languages?.[lang]?.slug;

        if (!slug) {
            setSnackbar({ open: true, message: t('admin:blog.noSlugError'), severity: 'warning' });
            return;
        }

        // Build URL based on status
        let url;
        if (post.status === BLOG_POST_STATUS.PUBLISHED) {
            // Published: always use /blog/:slug (no language prefix)
            // Firebase rewrites handle language routing transparently
            url = `/blog/${slug}`;
        } else {
            // Draft/Unpublished: preview always uses /blog/:slug (no lang prefix)
            // Slug lookup will find the correct language version
            url = `/blog/${slug}?preview=true`;
        }

        window.open(url, '_blank');
    };

    // Duplicate post - creates a copy as draft
    const handleDuplicate = async (post) => {
        try {
            const newPostId = await duplicateBlogPost(post.id, user);
            setSnackbar({ open: true, message: t('admin:blog.duplicateSuccess'), severity: 'success' });
            // Navigate to edit the new post
            navigate(`/admin/blog/edit/${newPostId}`);
        } catch (err) {
            setSnackbar({ open: true, message: err.message, severity: 'error' });
        }
    };

    // Get title from post (prefer default language)
    const getPostTitle = (post) => {
        const lang = post.languages?.[DEFAULT_BLOG_LANGUAGE]
            ? DEFAULT_BLOG_LANGUAGE
            : Object.keys(post.languages || {})[0];
        return post.languages?.[lang]?.title || t('admin:blog.untitled');
    };

    // Get available languages for a post
    const getPostLanguages = (post) => {
        return Object.keys(post.languages || {}).filter(
            (lang) => post.languages[lang]?.title
        );
    };

    if (!hasRole(BLOG_CMS_ROLES)) {
        return null;
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    {t('admin:blog.title')}
                </Typography>
                <Stack direction="row" spacing={2}>
                    {/* Authors button - admin/superadmin only */}
                    {hasRole(['superadmin', 'admin']) && (
                        <Button
                            variant="outlined"
                            startIcon={<PeopleIcon />}
                            onClick={() => navigate('/admin/blog/authors')}
                        >
                            {t('admin:blog.taxonomy.authors', 'Authors')}
                        </Button>
                    )}
                    {/* Upload JSON button */}
                    <Button
                        variant="outlined"
                        startIcon={<UploadFileIcon />}
                        onClick={() => setUploadDrawerOpen(true)}
                    >
                        {t('admin:blog.upload.title', 'Upload JSON')}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/admin/blog/new')}
                    >
                        {t('admin:blog.newPost')}
                    </Button>
                </Stack>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <TextField
                        size="small"
                        label={t('admin:blog.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: 200 }}
                    />

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>{t('admin:blog.filterStatus', 'Status')}</InputLabel>
                        <Select
                            value={statusFilter}
                            label={t('admin:blog.filterStatus', 'Status')}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="">{t('admin:blog.filterAll')}</MenuItem>
                            {Object.values(BLOG_POST_STATUS).map((status) => (
                                <MenuItem key={status} value={status}>
                                    {t(`admin:blog.status.${status}`)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>{t('admin:blog.filterCategory', 'Category')}</InputLabel>
                        <Select
                            value={categoryFilter}
                            label={t('admin:blog.filterCategory', 'Category')}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <MenuItem value="">{t('admin:blog.filterAll')}</MenuItem>
                            {Object.values(BLOG_CATEGORIES).map((category) => (
                                <MenuItem key={category} value={category}>
                                    {t(`admin:blog.categories.${category}`)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <IconButton onClick={loadPosts} disabled={loading}>
                        <RefreshIcon />
                    </IconButton>
                </Stack>
            </Paper>

            {/* Error */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Posts Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('admin:blog.columns.title')}</TableCell>
                            <TableCell>{t('admin:blog.columns.status')}</TableCell>
                            <TableCell>{t('admin:blog.columns.category')}</TableCell>
                            <TableCell>{t('admin:blog.columns.languages')}</TableCell>
                            <TableCell>{t('admin:blog.columns.updated')}</TableCell>
                            <TableCell>{t('admin:blog.columns.published')}</TableCell>
                            <TableCell align="right">{t('admin:blog.columns.actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredPosts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        {t('admin:blog.noPosts')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPosts.map((post) => (
                                <TableRow key={post.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {getPostTitle(post)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={t(`admin:blog.status.${post.status}`)}
                                            color={getStatusColor(post.status)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {post.category && (
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                label={t(`admin:blog.categories.${post.category}`)}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5}>
                                            {getPostLanguages(post).map((lang) => (
                                                <Chip
                                                    key={lang}
                                                    size="small"
                                                    label={lang.toUpperCase()}
                                                    sx={{ minWidth: 32 }}
                                                />
                                            ))}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{formatDate(post.updatedAt)}</TableCell>
                                    <TableCell>{formatDate(post.publishedAt)}</TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            {/* View */}
                                            <Tooltip title={post.status === BLOG_POST_STATUS.PUBLISHED ? t('admin:blog.viewPublished') : t('admin:blog.previewDraft')}>
                                                <IconButton
                                                    size="small"
                                                    color="info"
                                                    onClick={() => handleView(post)}
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            {/* Edit */}
                                            <Tooltip title={t('common:edit')}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            {/* Duplicate */}
                                            <Tooltip title={t('admin:blog.duplicate')}>
                                                <IconButton
                                                    size="small"
                                                    color="secondary"
                                                    onClick={() => handleDuplicate(post)}
                                                >
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            {post.status === BLOG_POST_STATUS.DRAFT && (
                                                <Tooltip title={t('admin:blog.publish')}>
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => handlePublish(post)}
                                                    >
                                                        <PublishIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            {post.status === BLOG_POST_STATUS.PUBLISHED && (
                                                <Tooltip title={t('admin:blog.unpublish')}>
                                                    <IconButton
                                                        size="small"
                                                        color="warning"
                                                        onClick={() => handleUnpublish(post)}
                                                    >
                                                        <UnpublishedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            <Tooltip title={t('common:delete')}>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteConfirm(post.id, getPostTitle(post))}
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

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={deleteDialog.open}
                title={t('admin:blog.deleteConfirm.title')}
                message={t('admin:blog.deleteConfirm.message', { title: deleteDialog.postTitle })}
                confirmText={t('common:delete')}
                cancelText={t('common:cancel')}
                onConfirm={handleDelete}
                onCancel={() => setDeleteDialog({ open: false, postId: null, postTitle: '' })}
                confirmColor="error"
            />

            {/* Upload Drawer */}
            <BlogUploadDrawer
                open={uploadDrawerOpen}
                onClose={() => {
                    setUploadDrawerOpen(false);
                    loadPosts(); // Refresh list after upload
                }}
            />

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminBlogPage;
