/**
 * src/pages/AdminDashboardPage.jsx
 *
 * Purpose: Central admin dashboard with quick actions, stats overview, and activity feed.
 * Provides admins with at-a-glance insights into blog posts, events, users, and system activity.
 * Role-based visibility: Superadmin sees all, Admin sees most, Author sees blog-only.
 *
 * Features:
 * - Quick action cards linking to admin routes (role-filtered)
 * - Stats overview: Blog (all), Events/Users (admin+superadmin)
 * - Real-time activity feed with type/source/date filtering (role-filtered)
 * - NFS & JBlanked sync status cards (superadmin only)
 * - Period toggle (7d / 30d / All time)
 * - Blog GPT quick action opens BlogUploadDrawer
 *
 * Role-Based Visibility:
 * - Superadmin: All stats, all activity, all filters, system status
 * - Admin: All stats, events/users/blog activity, no sync status
 * - Editor: Blog stats only, blog activity only, limited filters
 *
 * Changelog:
 * v1.5.0 - 2026-02-05 - BEP: Renamed editor → author role for semantic clarity.
 * v1.4.0 - 2026-02-05 - BEP: Fixed JBlanked sync filter (case-insensitive startsWith), added Blog GPT quick action with drawer.
 * v1.3.0 - 2026-02-05 - BEP: Added role-based visibility flags for all sections (superadmin/admin/editor).
 * v1.2.1 - 2026-02-05 - Removed Activity Trend chart, export (CSV/JSON) buttons; aligned date filters left.
 * v1.2.0 - 2026-02-05 - BEP Phase 8.1: Added date range filter, export (CSV/JSON), activity trend chart, JBlanked status card.
 * v1.1.0 - 2026-02-05 - BEP: Enhanced activity feed with type filtering, sync status, metadata display.
 * v1.0.2 - 2026-02-05 - Replaced Grid with Box (BEP, MUI v7 Grid v2).
 * v1.0.1 - 2026-02-05 - Fixed ESLint errors, added PropTypes.
 * v1.0.0 - 2026-02-05 - Initial implementation with stats cards, quick actions, activity feed.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import {
    Box,
    Card,
    CardContent,
    CardActionArea,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    useTheme,
    Alert,
    Collapse,
    Paper,
    TextField,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    Article as ArticleIcon,
    Event as EventIcon,
    People as PeopleIcon,
    CloudUpload as CloudUploadIcon,
    FileDownload as FileDownloadIcon,
    Description as DescriptionIcon,
    Refresh as RefreshIcon,
    Schedule as ScheduleIcon,
    Cancel as CancelIcon,
    Restore as RestoreIcon,
    Sync as SyncIcon,
    PersonAdd as PersonAddIcon,
    Edit as EditIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    TrendingUp as TrendingUpIcon,
    AdminPanelSettings as AdminPanelSettingsIcon,
    FilterList as FilterListIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    CloudDone as CloudDoneIcon,
    CloudOff as CloudOffIcon,
    Storage as StorageIcon,
    Person as PersonIcon,
    AutoAwesome as AutoAwesomeIcon,
    SmartToy as SmartToyIcon,
} from '@mui/icons-material';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
    fetchDashboardStats,
    ACTIVITY_TYPES,
} from '../services/adminActivityService';
import BlogUploadDrawer from '../components/BlogUploadDrawer';

// Quick action definitions (actions with 'path' navigate, actions with 'actionKey' trigger callbacks)
const getQuickActions = (t) => [
    {
        title: t('dashboard.quickActions.blogCms'),
        description: t('dashboard.quickActions.blogCmsDesc'),
        icon: ArticleIcon,
        path: '/admin/blog',
        color: 'primary',
        roles: ['admin', 'superadmin', 'author'],
    },
    {
        title: t('dashboard.quickActions.blogGpt'),
        description: t('dashboard.quickActions.blogGptDesc'),
        icon: SmartToyIcon,
        actionKey: 'openBlogUpload',
        color: 'success',
        roles: ['admin', 'superadmin', 'author'],
    },
    {
        title: t('dashboard.quickActions.openMagicPost'),
        description: t('dashboard.quickActions.openMagicPostDesc'),
        icon: AutoAwesomeIcon,
        actionKey: 'openMagicPost',
        color: 'info',
        roles: ['admin', 'superadmin', 'author'],
    },
    {
        title: t('dashboard.quickActions.blogAuthors'),
        description: t('dashboard.quickActions.blogAuthorsDesc'),
        icon: PeopleIcon,
        path: '/admin/blog/authors',
        color: 'secondary',
        roles: ['admin', 'superadmin'],
    },
    {
        title: t('dashboard.quickActions.events'),
        description: t('dashboard.quickActions.eventsDesc'),
        icon: EventIcon,
        path: '/admin/events',
        color: 'warning',
        roles: ['superadmin', 'admin'],
    },
    {
        title: t('dashboard.quickActions.descriptions'),
        description: t('dashboard.quickActions.descriptionsDesc'),
        icon: DescriptionIcon,
        path: '/admin/descriptions',
        color: 'info',
        roles: ['superadmin', 'admin'],
    },
    {
        title: t('dashboard.quickActions.gptUploader'),
        description: t('dashboard.quickActions.gptUploaderDesc'),
        icon: CloudUploadIcon,
        path: '/admin/fft2t',
        color: 'success',
        roles: ['superadmin'],
    },
    {
        title: t('dashboard.quickActions.exportEvents'),
        description: t('dashboard.quickActions.exportEventsDesc'),
        icon: FileDownloadIcon,
        path: '/admin/export',
        color: 'error',
        roles: ['superadmin'],
    },
];

// Activity icon mapping
const getActivityIcon = (type) => {
    const iconMap = {
        [ACTIVITY_TYPES.EVENT_RESCHEDULED]: ScheduleIcon,
        [ACTIVITY_TYPES.EVENT_CANCELLED]: CancelIcon,
        [ACTIVITY_TYPES.EVENT_REINSTATED]: RestoreIcon,
        [ACTIVITY_TYPES.SYNC_COMPLETED]: SyncIcon,
        [ACTIVITY_TYPES.SYNC_FAILED]: ErrorIcon,
        [ACTIVITY_TYPES.BLOG_PUBLISHED]: CheckCircleIcon,
        [ACTIVITY_TYPES.BLOG_UPDATED]: EditIcon,
        [ACTIVITY_TYPES.USER_SIGNUP]: PersonAddIcon,
        [ACTIVITY_TYPES.GPT_UPLOAD]: CloudUploadIcon,
    };
    return iconMap[type] || InfoIcon;
};

// Severity color mapping
const getSeverityColor = (severity, theme) => {
    const colorMap = {
        success: theme.palette.success.main,
        warning: theme.palette.warning.main,
        error: theme.palette.error.main,
        info: theme.palette.info.main,
    };
    return colorMap[severity] || theme.palette.text.secondary;
};

// Activity filter options (type and source) with role requirements
const ACTIVITY_TYPE_FILTERS = [
    { key: 'all', label: 'All', icon: FilterListIcon, roles: ['superadmin', 'admin', 'author'] },
    { key: 'sync', label: 'Syncs', icon: SyncIcon, types: [ACTIVITY_TYPES.SYNC_COMPLETED, ACTIVITY_TYPES.SYNC_FAILED], roles: ['superadmin'] },
    { key: 'events', label: 'Events', icon: EventIcon, types: [ACTIVITY_TYPES.EVENT_RESCHEDULED, ACTIVITY_TYPES.EVENT_CANCELLED, ACTIVITY_TYPES.EVENT_REINSTATED, ACTIVITY_TYPES.EVENT_CREATED, ACTIVITY_TYPES.EVENT_DELETED, ACTIVITY_TYPES.EVENT_UPDATED], roles: ['superadmin', 'admin'] },
    { key: 'blog', label: 'Blog', icon: ArticleIcon, types: [ACTIVITY_TYPES.BLOG_PUBLISHED, ACTIVITY_TYPES.BLOG_UPDATED, ACTIVITY_TYPES.BLOG_CREATED, ACTIVITY_TYPES.BLOG_DELETED], roles: ['superadmin', 'admin', 'author'] },
    { key: 'users', label: 'Users', icon: PeopleIcon, types: [ACTIVITY_TYPES.USER_SIGNUP], roles: ['superadmin', 'admin'] },
];

const ACTIVITY_SOURCE_FILTERS = [
    { key: 'all-sources', label: 'All Sources', sources: ['frontend', 'backend'], roles: ['superadmin', 'admin', 'author'] },
    { key: 'frontend', label: 'Frontend', icon: PersonIcon, sources: ['frontend'], roles: ['superadmin', 'admin', 'author'] },
    { key: 'backend', label: 'Backend', icon: StorageIcon, sources: ['backend'], roles: ['superadmin', 'admin'] },
];

// Format relative time
const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
};

// Stat Card Component
function StatCard({ title, value, subtitle, icon: Icon, color, trend }) {
    const themeRef = useTheme();

    return (
        <Card
            sx={{
                height: '100%',
                bgcolor: 'background.paper',
                borderLeft: 4,
                borderColor: `${color}.main`,
            }}
        >
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="overline" color="text.secondary" fontWeight={600}>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight={800} color={`${color}.main`}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: alpha(themeRef.palette[color]?.main || themeRef.palette.primary.main, 0.1),
                        }}
                    >
                        <Icon sx={{ fontSize: 32, color: `${color}.main` }} />
                    </Box>
                </Stack>
                {trend && (
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                        <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        <Typography variant="caption" color="success.main" fontWeight={600}>
                            {trend}
                        </Typography>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
}

StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    subtitle: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string.isRequired,
    trend: PropTypes.string,
};

// Quick Action Card Component
function QuickActionCard({ title, description, icon: Icon, path, color, onClick }) {
    const nav = useNavigate();
    const themeRef = useTheme();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (path) {
            nav(path);
        }
    };

    return (
        <Card
            sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: themeRef.shadows[8],
                },
            }}
        >
            <CardActionArea onClick={handleClick} sx={{ height: '100%', p: 2 }}>
                <Stack spacing={1} alignItems="center" textAlign="center">
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(themeRef.palette[color]?.main || themeRef.palette.primary.main, 0.1),
                        }}
                    >
                        <Icon sx={{ fontSize: 28, color: `${color}.main` }} />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                        {title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {description}
                    </Typography>
                </Stack>
            </CardActionArea>
        </Card>
    );
}

QuickActionCard.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    path: PropTypes.string,
    color: PropTypes.string.isRequired,
    onClick: PropTypes.func,
};

// Activity Feed Item Component
function ActivityItem({ activity }) {
    const themeRef = useTheme();
    const [expanded, setExpanded] = useState(false);
    const Icon = getActivityIcon(activity.type);
    const color = getSeverityColor(activity.severity, themeRef);
    const hasMetadata = activity.metadata && Object.keys(activity.metadata).length > 0;

    // Format type label for display
    const typeLabel = useMemo(() => {
        const labels = {
            [ACTIVITY_TYPES.EVENT_RESCHEDULED]: 'Reschedule',
            [ACTIVITY_TYPES.EVENT_CANCELLED]: 'Cancelled',
            [ACTIVITY_TYPES.EVENT_REINSTATED]: 'Reinstated',
            [ACTIVITY_TYPES.EVENT_CREATED]: 'Created',
            [ACTIVITY_TYPES.EVENT_DELETED]: 'Deleted',
            [ACTIVITY_TYPES.EVENT_UPDATED]: 'Updated',
            [ACTIVITY_TYPES.SYNC_COMPLETED]: 'Sync OK',
            [ACTIVITY_TYPES.SYNC_FAILED]: 'Sync Error',
            [ACTIVITY_TYPES.BLOG_PUBLISHED]: 'Published',
            [ACTIVITY_TYPES.BLOG_CREATED]: 'Created',
            [ACTIVITY_TYPES.BLOG_UPDATED]: 'Updated',
            [ACTIVITY_TYPES.BLOG_DELETED]: 'Deleted',
            [ACTIVITY_TYPES.USER_SIGNUP]: 'New User',
            [ACTIVITY_TYPES.GPT_UPLOAD]: 'GPT Upload',
            [ACTIVITY_TYPES.SETTINGS_CHANGED]: 'Settings',
        };
        return labels[activity.type] || activity.type.replace(/_/g, ' ');
    }, [activity.type]);

    // Source indicator
    const activitySource = activity.source || 'backend';
    const isBackend = activitySource === 'backend';
    const SourceIcon = isBackend ? StorageIcon : PersonIcon;
    const sourceColor = isBackend ? 'info' : 'success';

    return (
        <Box sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                    sx={{
                        p: 1,
                        borderRadius: '50%',
                        bgcolor: alpha(color, 0.1),
                        flexShrink: 0,
                    }}
                >
                    <Icon sx={{ fontSize: 20, color }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ display: 'block' }}>
                                {activity.title}
                            </Typography>
                            {activity.user && activity.user.email !== 'anonymous' && (
                                <Typography variant="caption" color="text.secondary">
                                    by {activity.user.displayName || activity.user.email}
                                </Typography>
                            )}
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                            <Chip
                                icon={<SourceIcon sx={{ fontSize: 14 }} />}
                                label={isBackend ? 'Backend' : 'Frontend'}
                                size="small"
                                color={sourceColor}
                                variant="outlined"
                                sx={{
                                    fontSize: '0.65rem',
                                    height: 20,
                                }}
                            />
                            <Chip
                                label={typeLabel}
                                size="small"
                                sx={{
                                    fontSize: '0.65rem',
                                    height: 20,
                                    bgcolor: alpha(color, 0.1),
                                    color,
                                    fontWeight: 600,
                                }}
                            />
                        </Stack>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {activity.description}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.disabled">
                            {formatRelativeTime(activity.createdAt)}
                        </Typography>
                        {hasMetadata && (
                            <Chip
                                label={expanded ? 'Hide details' : 'Show details'}
                                size="small"
                                variant="outlined"
                                onClick={() => setExpanded(!expanded)}
                                icon={expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
                                sx={{
                                    fontSize: '0.6rem',
                                    height: 18,
                                    cursor: 'pointer',
                                    '& .MuiChip-icon': { fontSize: 14, ml: 0.5 },
                                }}
                            />
                        )}
                    </Stack>
                </Box>
            </Stack>
            {/* Expandable metadata section */}
            <Collapse in={expanded}>
                <Paper
                    variant="outlined"
                    sx={{
                        mt: 1,
                        ml: 6,
                        p: 1.5,
                        bgcolor: alpha(themeRef.palette.background.default, 0.5),
                        borderRadius: 1,
                    }}
                >
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Event Details
                    </Typography>
                    <Box
                        component="pre"
                        sx={{
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            m: 0,
                            p: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: 'text.secondary',
                        }}
                    >
                        {JSON.stringify(activity.metadata, null, 2)}
                    </Box>
                </Paper>
            </Collapse>
        </Box>
    );
}

ActivityItem.propTypes = {
    activity: PropTypes.shape({
        type: PropTypes.string.isRequired,
        severity: PropTypes.string,
        title: PropTypes.string.isRequired,
        description: PropTypes.string,
        createdAt: PropTypes.instanceOf(Date),
        metadata: PropTypes.object,
        source: PropTypes.string, // 'frontend' or 'backend'
        user: PropTypes.shape({
            uid: PropTypes.string,
            email: PropTypes.string,
            displayName: PropTypes.string,
        }),
    }).isRequired,
};

// Sync Status Card Component (Superadmin)
function SyncStatusCard({ lastSync, syncError }) {
    const themeRef = useTheme();
    const [expanded, setExpanded] = useState(false);
    const isHealthy = lastSync && !syncError;
    const color = isHealthy ? themeRef.palette.success.main : themeRef.palette.error.main;
    const Icon = isHealthy ? CloudDoneIcon : CloudOffIcon;

    // Determine the most relevant activity for details
    const relevantActivity = syncError || lastSync;
    const hasMetadata = relevantActivity?.metadata && Object.keys(relevantActivity.metadata).length > 0;

    return (
        <Card sx={{ bgcolor: 'background.paper', borderLeft: 4, borderColor: isHealthy ? 'success.main' : 'error.main' }}>
            <CardContent>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(color, 0.1), flexShrink: 0 }}>
                            <Icon sx={{ fontSize: 32, color }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="overline" color="text.secondary" fontWeight={600}>
                                NFS Sync Status
                            </Typography>
                            <Typography variant="h6" fontWeight={700} color={isHealthy ? 'success.main' : 'error.main'}>
                                {isHealthy ? 'Healthy' : 'Issues Detected'}
                            </Typography>

                            {/* Last successful sync info */}
                            {lastSync && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    Last successful sync: {formatRelativeTime(lastSync.createdAt)}
                                </Typography>
                            )}

                            {/* Error details when issues detected */}
                            {syncError && (
                                <Box sx={{ mt: 1 }}>
                                    <Alert severity="error" sx={{ py: 0.5, '& .MuiAlert-message': { py: 0.5 } }}>
                                        <Typography variant="caption" fontWeight={600}>
                                            {syncError.title || 'Sync Failed'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block' }}>
                                            {syncError.description}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                                            Occurred: {formatRelativeTime(syncError.createdAt)}
                                        </Typography>
                                    </Alert>
                                </Box>
                            )}

                            {/* Expand button for metadata */}
                            {hasMetadata && (
                                <Chip
                                    label={expanded ? 'Hide technical details' : 'Show technical details'}
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setExpanded(!expanded)}
                                    icon={expanded ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
                                    sx={{
                                        fontSize: '0.65rem',
                                        height: 22,
                                        mt: 1,
                                        cursor: 'pointer',
                                        '& .MuiChip-icon': { fontSize: 14, ml: 0.5 },
                                    }}
                                />
                            )}
                        </Box>
                    </Stack>

                    {/* Expandable metadata section */}
                    <Collapse in={expanded}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 1.5,
                                bgcolor: alpha(themeRef.palette.background.default, 0.5),
                                borderRadius: 1,
                            }}
                        >
                            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Technical Details
                            </Typography>
                            <Box
                                component="pre"
                                sx={{
                                    fontSize: '0.7rem',
                                    fontFamily: 'monospace',
                                    m: 0,
                                    p: 0,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    color: 'text.secondary',
                                }}
                            >
                                {JSON.stringify(relevantActivity?.metadata, null, 2)}
                            </Box>
                        </Paper>
                    </Collapse>
                </Stack>
            </CardContent>
        </Card>
    );
}

SyncStatusCard.propTypes = {
    lastSync: PropTypes.shape({
        createdAt: PropTypes.instanceOf(Date),
        title: PropTypes.string,
        description: PropTypes.string,
        metadata: PropTypes.object,
    }),
    syncError: PropTypes.shape({
        createdAt: PropTypes.instanceOf(Date),
        title: PropTypes.string,
        description: PropTypes.string,
        metadata: PropTypes.object,
    }),
};

export default function AdminDashboardPage() {
    const { t } = useTranslation(['admin', 'common']);
    const { userProfile } = useAuth();

    const userRole = userProfile?.role || 'author';

    // Role-based visibility flags
    const isSuperadmin = userRole === 'superadmin';
    const isAdmin = userRole === 'admin';
    const isAuthor = userRole === 'author';
    const canViewAllStats = isSuperadmin || isAdmin; // Events, Users, Event Changes stats
    const canViewSystemStatus = isSuperadmin; // NFS/JBlanked sync status

    // Dynamic dashboard title based on role
    const dashboardTitle = useMemo(() => {
        if (isSuperadmin) return 'Superadmin Dashboard';
        if (isAdmin) return 'Admin Dashboard';
        if (isAuthor) return 'Author Dashboard';
        return 'Admin Dashboard';
    }, [isSuperadmin, isAdmin, isAuthor]);

    const [period, setPeriod] = useState('30d');
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activityTypeFilter, setActivityTypeFilter] = useState('all');
    const [activitySourceFilter, setActivitySourceFilter] = useState('all-sources');
    const [dateRangeStart, setDateRangeStart] = useState('');
    const [dateRangeEnd, setDateRangeEnd] = useState('');
    const [lastSync, setLastSync] = useState(null);
    const [lastSyncError, setLastSyncError] = useState(null);
    const [blogUploadOpen, setBlogUploadOpen] = useState(false);

    const magicPostUrl = import.meta.env.VITE_MAGIC_POST_GPT_URL;

    // Quick action handlers (for actions with actionKey instead of path)
    const actionHandlers = useMemo(() => ({
        openBlogUpload: () => setBlogUploadOpen(true),
        openMagicPost: () => {
            const url = (magicPostUrl || 'https://chatgpt.com/g/g-698594bd1e088191b85ba8633e1220dc-magic-post').trim();
            if (typeof window === 'undefined') return;
            try {
                window.open(url, '_blank', 'noopener,noreferrer');
            } catch {
                // Ignore window.open failures
            }
        },
    }), [magicPostUrl]);

    // Filter quick actions based on role and attach onClick handlers
    const availableActions = useMemo(() => {
        return getQuickActions(t)
            .filter((action) => action.roles.includes(userRole))
            .map((action) => ({
                ...action,
                onClick: action.actionKey ? actionHandlers[action.actionKey] : undefined,
            }));
    }, [userRole, actionHandlers, t]);

    // Filter activity type filters based on role
    const availableTypeFilters = useMemo(() => {
        return ACTIVITY_TYPE_FILTERS.filter((filter) => filter.roles.includes(userRole));
    }, [userRole]);

    // Filter activity source filters based on role
    const availableSourceFilters = useMemo(() => {
        return ACTIVITY_SOURCE_FILTERS.filter((filter) => filter.roles.includes(userRole));
    }, [userRole]);

    // Filter activities based on selected type, source, date range, AND role
    const filteredActivities = useMemo(() => {
        let filtered = activities;

        // First, filter by role-allowed activity types
        if (isAuthor) {
            // Authors only see blog activity
            const blogTypes = [ACTIVITY_TYPES.BLOG_PUBLISHED, ACTIVITY_TYPES.BLOG_UPDATED, ACTIVITY_TYPES.BLOG_CREATED, ACTIVITY_TYPES.BLOG_DELETED];
            filtered = filtered.filter((a) => blogTypes.includes(a.type));
        } else if (isAdmin) {
            // Admins see events, blog, and users (no sync activities)
            const adminAllowedTypes = [
                ACTIVITY_TYPES.EVENT_RESCHEDULED, ACTIVITY_TYPES.EVENT_CANCELLED, ACTIVITY_TYPES.EVENT_REINSTATED,
                ACTIVITY_TYPES.EVENT_CREATED, ACTIVITY_TYPES.EVENT_DELETED, ACTIVITY_TYPES.EVENT_UPDATED,
                ACTIVITY_TYPES.BLOG_PUBLISHED, ACTIVITY_TYPES.BLOG_UPDATED, ACTIVITY_TYPES.BLOG_CREATED, ACTIVITY_TYPES.BLOG_DELETED,
                ACTIVITY_TYPES.USER_SIGNUP,
            ];
            filtered = filtered.filter((a) => adminAllowedTypes.includes(a.type));
        }
        // Superadmins see all activity types

        // Apply type filter
        if (activityTypeFilter !== 'all') {
            const typeFilter = ACTIVITY_TYPE_FILTERS.find((f) => f.key === activityTypeFilter);
            if (typeFilter && typeFilter.types) {
                filtered = filtered.filter((a) => typeFilter.types.includes(a.type));
            }
        }

        // Apply source filter
        if (activitySourceFilter !== 'all-sources') {
            const sourceFilter = ACTIVITY_SOURCE_FILTERS.find((f) => f.key === activitySourceFilter);
            if (sourceFilter && sourceFilter.sources) {
                filtered = filtered.filter((a) => {
                    const activitySource = a.source || 'backend'; // Default to backend if not specified
                    return sourceFilter.sources.includes(activitySource);
                });
            }
        }

        // Apply date range filter
        if (dateRangeStart || dateRangeEnd) {
            filtered = filtered.filter((a) => {
                const actDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
                if (dateRangeStart) {
                    const startDate = new Date(dateRangeStart);
                    startDate.setHours(0, 0, 0, 0);
                    if (actDate < startDate) return false;
                }
                if (dateRangeEnd) {
                    const endDate = new Date(dateRangeEnd);
                    endDate.setHours(23, 59, 59, 999);
                    if (actDate > endDate) return false;
                }
                return true;
            });
        }

        return filtered;
    }, [activities, activityTypeFilter, activitySourceFilter, dateRangeStart, dateRangeEnd, isAuthor, isAdmin]);

    // Fetch stats
    const loadStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchDashboardStats(period);
            setStats(data);
        } catch (err) {
            console.error('Failed to load stats:', err);
            setError('Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    }, [period]);

    // Initial load and period change
    useEffect(() => {
        loadStats();
    }, [loadStats]);

    // Real-time activity feed listener
    useEffect(() => {
        const q = query(
            collection(db, 'systemActivityLog'),
            orderBy('createdAt', 'desc'),
            limit(30)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const activityData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.() || new Date(),
                }));
                setActivities(activityData);

                // Extract last sync status for superadmin section
                const lastSuccessSync = activityData.find((a) => a.type === ACTIVITY_TYPES.SYNC_COMPLETED);
                const lastFailedSync = activityData.find((a) => a.type === ACTIVITY_TYPES.SYNC_FAILED);

                setLastSync(lastSuccessSync || null);

                // Show error if last failed sync is more recent than last success
                if (lastFailedSync && (!lastSuccessSync || lastFailedSync.createdAt > lastSuccessSync.createdAt)) {
                    setLastSyncError(lastFailedSync);
                } else {
                    setLastSyncError(null);
                }
            },
            (err) => {
                console.error('Activity feed error:', err);
                // Silently fail - activity feed is optional
            }
        );

        return () => unsubscribe();
    }, []);

    const handlePeriodChange = (event, newPeriod) => {
        if (newPeriod !== null) {
            setPeriod(newPeriod);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                px: { xs: 2, md: 4 },
                py: 4,
            }}
        >
            <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                <Stack spacing={3}>
                    {/* Header */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={2}
                    >
                        <Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <AdminPanelSettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                <Typography variant="h4" fontWeight={900}>
                                    {dashboardTitle}
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                                Welcome back, {userProfile?.displayName || userProfile?.email || 'Admin'}
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <ToggleButtonGroup
                                value={period}
                                exclusive
                                onChange={handlePeriodChange}
                                size="small"
                            >
                                <ToggleButton value="7d">7 Days</ToggleButton>
                                <ToggleButton value="30d">30 Days</ToggleButton>
                                <ToggleButton value="all">All Time</ToggleButton>
                            </ToggleButtonGroup>
                            <Tooltip title="Refresh">
                                <span>
                                    <IconButton onClick={loadStats} disabled={loading}>
                                        <RefreshIcon />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Stack>
                    </Stack>

                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {/* Quick Actions */}
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            {t('dashboard.quickActions.title')}
                        </Typography>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' },
                                gap: 2,
                            }}
                        >
                            {availableActions.map((action) => (
                                <Box key={action.path || action.actionKey}>
                                    <QuickActionCard {...action} />
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    <Divider />

                    {/* Stats Overview */}
                    <Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                            Overview
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: 'repeat(2, 1fr)',
                                        md: isAuthor ? 'repeat(1, 1fr)' : 'repeat(4, 1fr)',
                                    },
                                    gap: 2,
                                }}
                            >
                                {/* Blog Stats - visible to all */}
                                <Box>
                                    <StatCard
                                        title="Blog Posts"
                                        value={stats?.blog?.total || 0}
                                        subtitle={`${stats?.blog?.published || 0} published, ${stats?.blog?.drafts || 0} drafts`}
                                        icon={ArticleIcon}
                                        color="primary"
                                        trend={stats?.blog?.recentCount > 0 ? `+${stats?.blog?.recentCount} new` : null}
                                    />
                                </Box>

                                {/* Events Stats - admin/superadmin only */}
                                {canViewAllStats && (
                                    <Box>
                                        <StatCard
                                            title="Economic Events"
                                            value={stats?.events?.total || 0}
                                            subtitle={`${stats?.events?.thisWeek || 0} this week`}
                                            icon={EventIcon}
                                            color="warning"
                                        />
                                    </Box>
                                )}

                                {/* Rescheduled/Cancelled - admin/superadmin only */}
                                {canViewAllStats && (
                                    <Box>
                                        <StatCard
                                            title="Event Changes"
                                            value={(stats?.events?.rescheduled || 0) + (stats?.events?.cancelled || 0)}
                                            subtitle={`${stats?.events?.rescheduled || 0} rescheduled, ${stats?.events?.cancelled || 0} cancelled`}
                                            icon={ScheduleIcon}
                                            color="info"
                                        />
                                    </Box>
                                )}

                                {/* Users Stats - admin/superadmin only */}
                                {canViewAllStats && (
                                    <Box>
                                        <StatCard
                                            title="Users"
                                            value={stats?.users?.total || 0}
                                            subtitle={`${stats?.users?.engaged || 0} engaged`}
                                            icon={PeopleIcon}
                                            color="success"
                                            trend={stats?.users?.newUsers > 0 ? `+${stats?.users?.newUsers} new` : null}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>

                    <Divider />

                    {/* Superadmin Section - System Status */}
                    {canViewSystemStatus && (
                        <>
                            <Box>
                                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                    <Chip label="Superadmin" size="small" color="error" />
                                    <Typography variant="h6" fontWeight={700}>
                                        System Status
                                    </Typography>
                                </Stack>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                                        gap: 2,
                                    }}
                                >
                                    {/* NFS Sync Status Card */}
                                    <Box>
                                        <SyncStatusCard lastSync={lastSync} syncError={lastSyncError} />
                                    </Box>

                                    {/* Recent Reschedules Summary */}
                                    <Box>
                                        <Card sx={{ bgcolor: 'background.paper', height: '100%' }}>
                                            <CardContent>
                                                <Typography variant="overline" color="text.secondary" fontWeight={600}>
                                                    Recent Event Changes
                                                </Typography>
                                                {(() => {
                                                    const reschedules = activities.filter((a) => a.type === ACTIVITY_TYPES.EVENT_RESCHEDULED).slice(0, 3);
                                                    const cancellations = activities.filter((a) => a.type === ACTIVITY_TYPES.EVENT_CANCELLED).slice(0, 3);
                                                    const totalChanges = reschedules.length + cancellations.length;

                                                    if (totalChanges === 0) {
                                                        return (
                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                                No recent event changes detected
                                                            </Typography>
                                                        );
                                                    }

                                                    return (
                                                        <Stack spacing={1} sx={{ mt: 1 }}>
                                                            {reschedules.map((r) => (
                                                                <Stack key={r.id} direction="row" spacing={1} alignItems="center">
                                                                    <ScheduleIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                                                    <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                                                                        {r.metadata?.eventName || r.title}
                                                                    </Typography>
                                                                    <Chip label="Rescheduled" size="small" color="warning" sx={{ fontSize: '0.6rem', height: 18 }} />
                                                                </Stack>
                                                            ))}
                                                            {cancellations.map((c) => (
                                                                <Stack key={c.id} direction="row" spacing={1} alignItems="center">
                                                                    <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                                                    <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                                                                        {c.metadata?.eventName || c.title}
                                                                    </Typography>
                                                                    <Chip label="Cancelled" size="small" color="error" sx={{ fontSize: '0.6rem', height: 18 }} />
                                                                </Stack>
                                                            ))}
                                                        </Stack>
                                                    );
                                                })()}
                                            </CardContent>
                                        </Card>
                                    </Box>

                                    {/* JBlanked Sync Status Card */}
                                    <Box>
                                        <Card sx={{ bgcolor: 'background.paper', height: '100%', borderLeft: 4, borderColor: 'info.main' }}>
                                            <CardContent>
                                                <Typography variant="overline" color="text.secondary" fontWeight={600}>
                                                    JBlanked Sync Status
                                                </Typography>
                                                {(() => {
                                                    // Match sources like "JBlanked (jblanked-ff)" - case-insensitive startsWith
                                                    const jblankedSyncs = activities.filter(
                                                        (a) => a.type === ACTIVITY_TYPES.SYNC_COMPLETED && a.metadata?.source?.toLowerCase().startsWith('jblanked')
                                                    );
                                                    const lastJBlankedSync = jblankedSyncs[0];

                                                    if (!lastJBlankedSync) {
                                                        return (
                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                                No JBlanked syncs recorded yet
                                                            </Typography>
                                                        );
                                                    }

                                                    const totalSyncs = jblankedSyncs.length;
                                                    const allJblankedActivities = activities.filter((a) => a.metadata?.source?.toLowerCase().startsWith('jblanked'));
                                                    const successRate = ((totalSyncs / (allJblankedActivities.length || 1)) * 100).toFixed(0);

                                                    return (
                                                        <Stack spacing={1.5} sx={{ mt: 1 }}>
                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                <CloudDoneIcon sx={{ fontSize: 20, color: 'success.main' }} />
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }}>
                                                                        Last Sync
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {formatRelativeTime(lastJBlankedSync.createdAt)}
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                <TrendingUpIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }}>
                                                                        Success Rate
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {successRate}% (Recent)
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                                <EventIcon sx={{ fontSize: 20, color: 'warning.main' }} />
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography variant="caption" fontWeight={600} sx={{ display: 'block' }}>
                                                                        Actuals Updated
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {lastJBlankedSync.metadata?.eventCount || '0'} events
                                                                    </Typography>
                                                                </Box>
                                                            </Stack>
                                                        </Stack>
                                                    );
                                                })()}
                                            </CardContent>
                                        </Card>
                                    </Box>
                                </Box>
                            </Box>
                            <Divider />
                        </>
                    )}

                    {/* Activity Feed */}
                    <Box>
                        {/* Header Row: Title + Date Filters */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
                            <Typography variant="h6" fontWeight={700}>
                                Recent Activity
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                                <TextField
                                    type="date"
                                    label="From"
                                    value={dateRangeStart}
                                    onChange={(e) => setDateRangeStart(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                    sx={{ width: { xs: '100%', sm: 180 } }}
                                />
                                <TextField
                                    type="date"
                                    label="To"
                                    value={dateRangeEnd}
                                    onChange={(e) => setDateRangeEnd(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    size="small"
                                    sx={{ width: { xs: '100%', sm: 180 } }}
                                />
                                {(dateRangeStart || dateRangeEnd) && (
                                    <Chip
                                        label="Clear dates"
                                        size="small"
                                        onDelete={() => {
                                            setDateRangeStart('');
                                            setDateRangeEnd('');
                                        }}
                                        sx={{ height: 32 }}
                                    />
                                )}
                            </Stack>
                        </Stack>

                        {/* Type Filters - role-based */}
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1, justifyContent: 'flex-end' }}>
                            {availableTypeFilters.map((filter) => {
                                const FilterIcon = filter.icon;
                                const isSelected = activityTypeFilter === filter.key;
                                const count = filter.key === 'all'
                                    ? filteredActivities.length
                                    : filteredActivities.filter((a) => filter.types?.includes(a.type)).length;
                                return (
                                    <Chip
                                        key={filter.key}
                                        icon={<FilterIcon sx={{ fontSize: 16 }} />}
                                        label={`${filter.label} (${count})`}
                                        size="small"
                                        variant={isSelected ? 'filled' : 'outlined'}
                                        color={isSelected ? 'primary' : 'default'}
                                        onClick={() => setActivityTypeFilter(filter.key)}
                                        sx={{ fontSize: '0.7rem', height: 26 }}
                                    />
                                );
                            })}
                        </Stack>

                        {/* Source Filters - role-based */}
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 2, justifyContent: 'flex-end' }}>
                            {availableSourceFilters.map((filter) => {
                                const FilterIcon = filter.icon || FilterListIcon;
                                const isSelected = activitySourceFilter === filter.key;
                                return (
                                    <Chip
                                        key={filter.key}
                                        icon={<FilterIcon sx={{ fontSize: 16 }} />}
                                        label={filter.label}
                                        size="small"
                                        variant={isSelected ? 'filled' : 'outlined'}
                                        color={isSelected ? 'success' : 'default'}
                                        onClick={() => setActivitySourceFilter(filter.key)}
                                        sx={{ fontSize: '0.7rem', height: 26 }}
                                    />
                                );
                            })}
                        </Stack>

                        <Card sx={{ bgcolor: 'background.paper' }}>
                            <CardContent sx={{ p: 0 }}>
                                {filteredActivities.length === 0 ? (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <InfoIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                        <Typography color="text.secondary">
                                            {activityTypeFilter === 'all' && activitySourceFilter === 'all-sources' ? 'No recent activity' : 'No matching activities'}
                                        </Typography>
                                        <Typography variant="caption" color="text.disabled">
                                            System events will appear here as they occur
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Stack divider={<Divider />} sx={{ px: 2, maxHeight: 500, overflowY: 'auto' }}>
                                        {filteredActivities.slice(0, 20).map((activity) => (
                                            <ActivityItem key={activity.id} activity={activity} />
                                        ))}
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                </Stack>
            </Box>

            {/* Blog Upload Drawer */}
            <BlogUploadDrawer open={blogUploadOpen} onClose={() => setBlogUploadOpen(false)} />
        </Box>
    );
}
