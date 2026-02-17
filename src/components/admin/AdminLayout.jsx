/**
 * src/components/admin/AdminLayout.jsx
 *
 * Purpose: Layout wrapper for all /admin/* routes. Renders the RBAC-filtered
 * AdminNavBar at the top, contextual breadcrumbs, and an <Outlet /> for the
 * active admin page below. Provides consistent chrome across every admin page.
 *
 * Architecture:
 *   AppRoutes
 *   └── /admin (AdminLayout)
 *       ├── AdminNavBar (sticky top, RBAC-filtered)
 *       ├── AdminBreadcrumbs (contextual path trail)
 *       └── <Outlet /> (AdminDashboardPage, AdminBlogPage, etc.)
 *
 * Changelog:
 * v1.1.0 - 2026-02-17 - BEP: Added AdminBreadcrumbs with i18n labels, dynamic :postId, theme-aware styling.
 * v1.0.0 - 2026-02-17 - Initial implementation (BEP admin layout with RBAC nav)
 */

import { useMemo } from 'react';
import { Outlet, useLocation, Link as RouterLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Breadcrumbs,
    Link,
    Typography,
    Container,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AdminNavBar from './AdminNavBar';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Map of path segments → i18n translation keys (admin:nav.*).
 * Segments not in this map are rendered as-is (e.g. dynamic :postId).
 */
const SEGMENT_LABELS = {
    admin: 'dashboard',
    blog: 'blog',
    new: 'blogNewPost',
    edit: 'blogEditPost',
    authors: 'blogAuthors',
    events: 'manageEvents',
    descriptions: 'descriptions',
    'upload-desc': 'uploadDesc',
    export: 'exportEvents',
    fft2t: 'gptUploader',
    tools: 'tools',
};

/**
 * AdminBreadcrumbs — renders a contextual breadcrumb trail based on pathname.
 * Hidden on the dashboard index route (no crumbs needed at root).
 */
const AdminBreadcrumbs = () => {
    const { t } = useTranslation('admin');
    const location = useLocation();
    const params = useParams();

    const crumbs = useMemo(() => {
        // Strip trailing slash and split
        const path = location.pathname.replace(/\/+$/, '');
        const segments = path.split('/').filter(Boolean); // e.g. ['admin', 'blog', 'edit', 'abc123']

        if (segments.length <= 1) return []; // Dashboard only — no breadcrumbs

        const items = [];
        let accumulated = '';

        segments.forEach((segment, index) => {
            accumulated += `/${segment}`;
            const isLast = index === segments.length - 1;

            // Determine label
            let label;
            const i18nKey = SEGMENT_LABELS[segment];

            if (i18nKey) {
                label = t(`nav.${i18nKey}`);
            } else if (params?.postId && segment === params.postId) {
                // Dynamic :postId — show truncated ID
                label = segment.length > 8 ? `${segment.slice(0, 8)}…` : segment;
            } else {
                // Unknown segment — title-case it
                label = segment.charAt(0).toUpperCase() + segment.slice(1);
            }

            items.push({
                label,
                path: accumulated,
                isLast,
            });
        });

        return items;
    }, [location.pathname, params?.postId, t]);

    // Don't render breadcrumbs on dashboard root
    if (crumbs.length === 0) return null;

    return (
        <Container maxWidth="lg">
            <Breadcrumbs
                separator={<NavigateNextIcon sx={{ fontSize: '0.9rem' }} />}
                aria-label={t('nav.adminNavigation')}
                sx={{
                    py: { xs: 1, md: 1.5 },
                    px: { xs: 0.5, md: 0 },
                    '& .MuiBreadcrumbs-ol': {
                        flexWrap: 'nowrap',
                    },
                }}
            >
                {crumbs.map((crumb) =>
                    crumb.isLast ? (
                        <Typography
                            key={crumb.path}
                            variant="body2"
                            sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                fontSize: { xs: '0.8125rem', md: '0.875rem' },
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {crumb.label}
                        </Typography>
                    ) : (
                        <Link
                            key={crumb.path}
                            component={RouterLink}
                            to={crumb.path}
                            underline="hover"
                            variant="body2"
                            sx={{
                                color: 'text.secondary',
                                fontWeight: 400,
                                fontSize: { xs: '0.8125rem', md: '0.875rem' },
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                    color: 'primary.main',
                                },
                            }}
                        >
                            {crumb.label}
                        </Link>
                    )
                )}
            </Breadcrumbs>
        </Container>
    );
};

/* ─── Main Layout ─── */
const AdminLayout = () => {
    const { user } = useAuth();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                bgcolor: 'background.default',
            }}
        >
            {/* RBAC-filtered admin navigation bar */}
            <AdminNavBar user={user} />

            {/* Contextual breadcrumbs — hidden on dashboard index */}
            <AdminBreadcrumbs />

            {/* Page content — each admin page renders here */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: '100%',
                    // Match existing admin page padding (Container maxWidth="lg" defaults)
                    py: { xs: 2, md: 3 },
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default AdminLayout;
