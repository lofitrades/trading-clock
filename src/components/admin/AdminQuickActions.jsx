/**
 * src/components/admin/AdminQuickActions.jsx
 *
 * Purpose: Standalone RBAC-filtered quick actions panel for the admin dashboard.
 * Groups actions by domain (Blog, Events, Tools) mirroring AdminNavBar structure.
 * Compact chip/button design replaces the previous card grid for better density.
 *
 * Features:
 * - RBAC filtering: Each action has a `roles` array; only matching items render
 * - Grouped sections: Blog (author+), Events (admin+), Tools (superadmin)
 * - Two item types: `path` (navigate) and `actionKey` (callback trigger)
 * - External links: `external` + `href` opens in new tab
 * - Compact layout: Horizontal chip rows within labeled sections
 * - Fully i18n: All labels from admin:dashboard.quickActions.* namespace
 *
 * Changelog:
 * v1.1.0 - 2026-02-17 - BEP: Row-first layout — groups render as equal-width columns
 *                        side-by-side using the full viewport width, wrapping on narrow
 *                        viewports. Buttons full-width and left-justified within each column.
 * v1.0.0 - 2026-02-17 - Initial implementation (BEP, extracted from AdminDashboardPage)
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import {
    Box,
    Button,
    Typography,
} from '@mui/material';
import {
    Article as ArticleIcon,
    Event as EventIcon,
    People as PeopleIcon,
    CloudUpload as CloudUploadIcon,
    FileDownload as FileDownloadIcon,
    Description as DescriptionIcon,
    AutoAwesome as AutoAwesomeIcon,
    SmartToy as SmartToyIcon,
    OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';

/* ─── Action Config ─── */

/**
 * Build grouped quick actions config with RBAC roles per item.
 * Groups mirror AdminNavBar structure: Blog, Events, Tools.
 * @param {Function} t - i18n translation function (admin namespace)
 * @param {string} magicPostUrl - Magic Post GPT URL from env
 * @returns {Array<Object>} Grouped action configuration
 */
const getGroupedActions = (t, magicPostUrl) => [
    {
        id: 'blog',
        label: t('dashboard.quickActions.blogGroup'),
        roles: ['superadmin', 'admin', 'author'],
        items: [
            {
                id: 'blog-cms',
                label: t('dashboard.quickActions.blogCms'),
                icon: ArticleIcon,
                path: '/admin/blog',
                roles: ['superadmin', 'admin', 'author'],
            },
            {
                id: 'blog-new',
                label: t('dashboard.quickActions.blogNewPost'),
                icon: ArticleIcon,
                path: '/admin/blog/new',
                roles: ['superadmin', 'admin', 'author'],
            },
            {
                id: 'blog-gpt',
                label: t('dashboard.quickActions.blogGpt'),
                icon: SmartToyIcon,
                actionKey: 'openBlogUpload',
                roles: ['superadmin', 'admin', 'author'],
            },
            {
                id: 'magic-post',
                label: t('dashboard.quickActions.openMagicPost'),
                icon: AutoAwesomeIcon,
                external: true,
                href: magicPostUrl || 'https://chatgpt.com/g/g-698594bd1e088191b85ba8633e1220dc-magic-post',
                roles: ['superadmin', 'admin', 'author'],
            },
            {
                id: 'blog-authors',
                label: t('dashboard.quickActions.blogAuthors'),
                icon: PeopleIcon,
                path: '/admin/blog/authors',
                roles: ['superadmin', 'admin'],
            },
        ],
    },
    {
        id: 'events',
        label: t('dashboard.quickActions.eventsGroup'),
        roles: ['superadmin', 'admin'],
        items: [
            {
                id: 'manage-events',
                label: t('dashboard.quickActions.events'),
                icon: EventIcon,
                path: '/admin/events',
                roles: ['superadmin', 'admin'],
            },
            {
                id: 'descriptions',
                label: t('dashboard.quickActions.descriptions'),
                icon: DescriptionIcon,
                path: '/admin/descriptions',
                roles: ['superadmin', 'admin'],
            },
        ],
    },
    {
        id: 'tools',
        label: t('dashboard.quickActions.toolsGroup'),
        roles: ['superadmin'],
        items: [
            {
                id: 'gpt-uploader',
                label: t('dashboard.quickActions.gptUploader'),
                icon: CloudUploadIcon,
                path: '/admin/fft2t',
                roles: ['superadmin'],
            },
            {
                id: 'export-events',
                label: t('dashboard.quickActions.exportEvents'),
                icon: FileDownloadIcon,
                path: '/admin/export',
                roles: ['superadmin'],
            },
        ],
    },
];

/* ─── Component ─── */

/**
 * AdminQuickActions
 *
 * Renders RBAC-filtered quick actions grouped by domain (Blog, Events, Tools).
 * Compact chip-button design within labeled sections.
 *
 * @param {Object} props
 * @param {string} props.userRole - Current user's role (superadmin/admin/author)
 * @param {Object} props.actionHandlers - Map of actionKey → callback functions
 */
export default function AdminQuickActions({ userRole, actionHandlers }) {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();

    const magicPostUrl = import.meta.env.VITE_MAGIC_POST_GPT_URL;

    // Build & filter groups by role
    const visibleGroups = useMemo(() => {
        const groups = getGroupedActions(t, magicPostUrl);
        return groups
            .filter((group) => group.roles.includes(userRole))
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => item.roles.includes(userRole)),
            }))
            .filter((group) => group.items.length > 0);
    }, [t, userRole, magicPostUrl]);

    const handleClick = (item) => {
        if (item.external && item.href) {
            try {
                window.open(item.href, '_blank', 'noopener,noreferrer');
            } catch {
                /* ignore */
            }
        } else if (item.actionKey && actionHandlers?.[item.actionKey]) {
            actionHandlers[item.actionKey]();
        } else if (item.path) {
            navigate(item.path);
        }
    };

    if (visibleGroups.length === 0) return null;

    return (
        <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
                {t('dashboard.quickActions.title')}
            </Typography>

            {/* Row of groups — content-sized, wrapping on narrow viewports */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}>
                {visibleGroups.map((group) => (
                    <Box key={group.id}>
                        {/* Group label */}
                        <Typography
                            variant="caption"
                            fontWeight={600}
                            color="text.secondary"
                            sx={{
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                display: 'block',
                                mb: 0.75,
                            }}
                        >
                            {group.label}
                        </Typography>

                        {/* Action buttons — inline row, content-width, wrapping */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 1, md: 0.75 } }}>
                            {group.items.map((item) => {
                                const ItemIcon = item.icon;
                                return (
                                    <Button
                                        key={item.id}
                                        variant="outlined"
                                        size="small"
                                        color="primary"
                                        onClick={() => handleClick(item)}
                                        startIcon={<ItemIcon sx={{ fontSize: '1rem' }} />}
                                        endIcon={
                                            item.external ? (
                                                <OpenInNewIcon sx={{ fontSize: '0.75rem', opacity: 0.5 }} />
                                            ) : undefined
                                        }
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            fontSize: '0.8125rem',
                                            borderRadius: 2,
                                            px: { xs: 2, md: 1.5 },
                                            py: { xs: 1, md: 0.5 },
                                            minHeight: { xs: 44, md: 'auto' },
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {item.label}
                                    </Button>
                                );
                            })}
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

AdminQuickActions.propTypes = {
    /** Current user role for RBAC filtering */
    userRole: PropTypes.oneOf(['superadmin', 'admin', 'author', 'user']).isRequired,
    /** Map of actionKey string → callback function (e.g. { openBlogUpload: () => ... }) */
    actionHandlers: PropTypes.objectOf(PropTypes.func),
};

AdminQuickActions.defaultProps = {
    actionHandlers: {},
};
