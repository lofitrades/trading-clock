/**
 * src/components/admin/AdminNavBar.jsx
 *
 * Purpose: RBAC-filtered admin navigation bar with mobile-first responsive design.
 * Desktop (md+): Horizontal nav with grouped menu buttons + UserAvatar.
 * Mobile (xs/sm): Hamburger icon opens a Drawer with grouped nav sections.
 * Nav items are dynamically filtered by the current user's role (superadmin/admin/author).
 *
 * Features:
 * - RBAC filtering: Each nav item has a `roles` array; only matching items render
 * - Grouped sections: Blog, Events, Tools — each collapsed into a menu on desktop
 * - Active route highlighting via useLocation
 * - Fully i18n: All labels from admin:nav.* namespace
 * - Theme-aware: Respects light/dark mode
 * - UserAvatar integration with account/logout flows
 * - "Back to Site" link to /calendar
 *
 * Changelog:
 * v1.3.0 - 2026-02-21 - BEP: Changed "Back to Site" link from /clock to /calendar.
 * v1.2.0 - 2026-02-17 - BEP: Added Blog GPT nav item (opens BlogUploadDrawer, author+).
 *                        Fixed outside-click dropdown close: replaced position:fixed backdrop
 *                        (broken by AppBar backdropFilter creating containing block) with
 *                        useRef + global mousedown listener for reliable click-away behavior.
 *                        Added actionKey item type support for callback-based nav items.
 * v1.1.0 - 2026-02-17 - BEP: Added Magic Post external link to Blog group (author+).
 *                        Extended nav config with external href/external flag support.
 *                        Desktop: opens in new tab with OpenInNew indicator.
 *                        Mobile: same pattern with trailing OpenInNew icon.
 * v1.0.0 - 2026-02-17 - Initial implementation (BEP admin RBAC nav bar)
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Box,
    Button,
    IconButton,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Typography,
    Collapse,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import PostAddIcon from '@mui/icons-material/PostAdd';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import UserAvatar from '../UserAvatar';
import BlogUploadDrawer from '../BlogUploadDrawer';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Build the nav config with RBAC roles per item.
 * @param {Function} t - i18n translation function
 * @returns {Object} Grouped nav configuration
 */
const getNavConfig = (t) => ({
    dashboard: {
        label: t('admin:nav.dashboard'),
        path: '/admin',
        icon: DashboardIcon,
        roles: ['superadmin', 'admin', 'author'],
        exact: true,
    },
    groups: [
        {
            id: 'blog',
            label: t('admin:nav.blog'),
            icon: ArticleIcon,
            roles: ['superadmin', 'admin', 'author'],
            items: [
                {
                    label: t('admin:nav.blogPosts'),
                    path: '/admin/blog',
                    icon: ArticleIcon,
                    roles: ['superadmin', 'admin', 'author'],
                },
                {
                    label: t('admin:nav.blogNewPost'),
                    path: '/admin/blog/new',
                    icon: PostAddIcon,
                    roles: ['superadmin', 'admin', 'author'],
                },
                {
                    label: t('admin:nav.blogAuthors'),
                    path: '/admin/blog/authors',
                    icon: PeopleIcon,
                    roles: ['superadmin', 'admin'],
                },
                {
                    label: t('admin:nav.blogGpt'),
                    actionKey: 'openBlogUpload',
                    icon: SmartToyIcon,
                    roles: ['superadmin', 'admin', 'author'],
                },
                {
                    label: t('admin:nav.magicPost'),
                    href: import.meta.env.VITE_MAGIC_POST_GPT_URL || 'https://chatgpt.com/g/g-698594bd1e088191b85ba8633e1220dc-magic-post',
                    icon: AutoAwesomeIcon,
                    external: true,
                    roles: ['superadmin', 'admin', 'author'],
                },
            ],
        },
        {
            id: 'events',
            label: t('admin:nav.events'),
            icon: EventIcon,
            roles: ['superadmin', 'admin'],
            items: [
                {
                    label: t('admin:nav.manageEvents'),
                    path: '/admin/events',
                    icon: EventIcon,
                    roles: ['superadmin', 'admin'],
                },
                {
                    label: t('admin:nav.descriptions'),
                    path: '/admin/descriptions',
                    icon: DescriptionIcon,
                    roles: ['superadmin', 'admin'],
                },
            ],
        },
        {
            id: 'tools',
            label: t('admin:nav.tools'),
            icon: CloudUploadIcon,
            roles: ['superadmin'],
            items: [
                {
                    label: t('admin:nav.uploadDesc'),
                    path: '/admin/upload-desc',
                    icon: CloudUploadIcon,
                    roles: ['superadmin'],
                },
                {
                    label: t('admin:nav.exportEvents'),
                    path: '/admin/export',
                    icon: FileDownloadIcon,
                    roles: ['superadmin'],
                },
                {
                    label: t('admin:nav.gptUploader'),
                    path: '/admin/fft2t',
                    icon: SmartToyIcon,
                    roles: ['superadmin'],
                },
            ],
        },
    ],
    backToSite: {
        label: t('admin:nav.backToSite'),
        path: '/calendar',
        icon: ArrowBackIcon,
    },
});

/**
 * Check if a path is currently active.
 * @param {string} currentPath - Current location pathname
 * @param {string} itemPath - Nav item path
 * @param {boolean} exact - Exact match required
 * @returns {boolean}
 */
const isActive = (currentPath, itemPath, exact = false) => {
    if (exact) return currentPath === itemPath;
    // For non-exact, match prefix but avoid /admin matching /admin/blog
    if (itemPath === '/admin') return currentPath === '/admin';
    return currentPath.startsWith(itemPath);
};

/**
 * Check if any item in a group is currently active.
 * @param {string} currentPath - Current location pathname
 * @param {Array} items - Group items
 * @returns {boolean}
 */
const isGroupActive = (currentPath, items) =>
    items.some((item) => item.path && isActive(currentPath, item.path));

/* ─── Desktop Group Menu Button ─── */
const DesktopGroupMenu = ({ group, userRole, currentPath, onNavigate, onAction }) => {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    // Filter items by role
    const visibleItems = useMemo(
        () => group.items.filter((item) => item.roles.includes(userRole)),
        [group.items, userRole]
    );

    // Global mousedown listener — close dropdown when clicking outside the menu container
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    if (visibleItems.length === 0) return null;

    const groupIsActive = isGroupActive(currentPath, visibleItems);

    const handleToggle = () => setOpen((prev) => !prev);
    const handleClose = () => setOpen(false);
    const handleNavigate = (path) => {
        onNavigate(path);
        handleClose();
    };
    const handleAction = (actionKey) => {
        if (onAction) onAction(actionKey);
        handleClose();
    };

    const GroupIcon = group.icon;

    return (
        <Box ref={menuRef} sx={{ position: 'relative', display: 'inline-flex' }}>
            <Button
                onClick={handleToggle}
                startIcon={<GroupIcon sx={{ fontSize: '1.1rem' }} />}
                endIcon={open ? <ExpandLess /> : <ExpandMore />}
                sx={{
                    textTransform: 'none',
                    fontWeight: groupIsActive ? 600 : 400,
                    color: groupIsActive ? 'primary.main' : 'text.secondary',
                    fontSize: '0.875rem',
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    bgcolor: groupIsActive
                        ? (theme) => alpha(theme.palette.primary.main, 0.08)
                        : 'transparent',
                    '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                    },
                }}
            >
                {group.label}
            </Button>

            {/* Dropdown menu */}
            {open && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        mt: 0.5,
                        zIndex: 1400,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        minWidth: 200,
                        py: 0.5,
                    }}
                >
                    {visibleItems.map((item) => {
                        const ItemIcon = item.icon;

                        // Action items — trigger a callback (e.g. open BlogUploadDrawer)
                        if (item.actionKey) {
                            return (
                                <Button
                                    key={item.actionKey}
                                    fullWidth
                                    onClick={() => handleAction(item.actionKey)}
                                    startIcon={<ItemIcon sx={{ fontSize: '1rem' }} />}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        textTransform: 'none',
                                        fontWeight: 400,
                                        color: 'text.primary',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 0,
                                        fontSize: '0.875rem',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    {item.label}
                                </Button>
                            );
                        }

                        // External links — open in a new tab
                        if (item.external && item.href) {
                            return (
                                <Button
                                    key={item.href}
                                    fullWidth
                                    component="a"
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    startIcon={<ItemIcon sx={{ fontSize: '1rem' }} />}
                                    endIcon={<OpenInNewIcon sx={{ fontSize: '0.75rem', opacity: 0.5 }} />}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        textTransform: 'none',
                                        fontWeight: 400,
                                        color: 'text.primary',
                                        px: 2,
                                        py: 1,
                                        borderRadius: 0,
                                        fontSize: '0.875rem',
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    {item.label}
                                </Button>
                            );
                        }

                        // Internal route links
                        const active = isActive(currentPath, item.path);
                        return (
                            <Button
                                key={item.path}
                                fullWidth
                                onClick={() => handleNavigate(item.path)}
                                startIcon={<ItemIcon sx={{ fontSize: '1rem' }} />}
                                sx={{
                                    justifyContent: 'flex-start',
                                    textTransform: 'none',
                                    fontWeight: active ? 600 : 400,
                                    color: active ? 'primary.main' : 'text.primary',
                                    bgcolor: active
                                        ? (theme) => alpha(theme.palette.primary.main, 0.08)
                                        : 'transparent',
                                    px: 2,
                                    py: 1,
                                    borderRadius: 0,
                                    fontSize: '0.875rem',
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                {item.label}
                            </Button>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};

DesktopGroupMenu.propTypes = {
    group: PropTypes.object.isRequired,
    userRole: PropTypes.string.isRequired,
    currentPath: PropTypes.string.isRequired,
    onNavigate: PropTypes.func.isRequired,
    onAction: PropTypes.func,
};

/* ─── Mobile Drawer Group Section ─── */
const MobileDrawerGroup = ({ group, userRole, currentPath, onNavigate, onAction, defaultOpen }) => {
    const [open, setOpen] = useState(defaultOpen);

    const visibleItems = useMemo(
        () => group.items.filter((item) => item.roles.includes(userRole)),
        [group.items, userRole]
    );

    if (visibleItems.length === 0) return null;

    const GroupIcon = group.icon;

    return (
        <>
            <ListItemButton onClick={() => setOpen((prev) => !prev)} sx={{ px: 2.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                    <GroupIcon sx={{ fontSize: '1.25rem', color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText
                    primary={group.label}
                    slotProps={{
                        primary: {
                            sx: {
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            },
                        },
                    }}
                />
                {open ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {visibleItems.map((item) => {
                        const ItemIcon = item.icon;

                        // Action items — trigger a callback (e.g. open BlogUploadDrawer)
                        if (item.actionKey) {
                            return (
                                <ListItemButton
                                    key={item.actionKey}
                                    onClick={() => { if (onAction) onAction(item.actionKey); onNavigate(null); }}
                                    sx={{
                                        pl: 5,
                                        py: 1,
                                        '&:hover': {
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        <ItemIcon sx={{ fontSize: '1.1rem', color: 'text.secondary' }} />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.label}
                                        slotProps={{
                                            primary: {
                                                sx: {
                                                    fontWeight: 400,
                                                    fontSize: '0.875rem',
                                                    color: 'text.primary',
                                                },
                                            },
                                        }}
                                    />
                                </ListItemButton>
                            );
                        }

                        // External links open in a new tab
                        const active = !item.external && isActive(currentPath, item.path);

                        if (item.external && item.href) {
                            return (
                                <ListItemButton
                                    key={item.href}
                                    component="a"
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                        pl: 5,
                                        py: 1,
                                        '&:hover': {
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        <ItemIcon
                                            sx={{
                                                fontSize: '1.1rem',
                                                color: 'text.secondary',
                                            }}
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.label}
                                        slotProps={{
                                            primary: {
                                                sx: {
                                                    fontWeight: 400,
                                                    fontSize: '0.875rem',
                                                    color: 'text.primary',
                                                },
                                            },
                                        }}
                                    />
                                    <OpenInNewIcon sx={{ fontSize: '0.85rem', color: 'text.disabled', ml: 0.5 }} />
                                </ListItemButton>
                            );
                        }

                        return (
                            <ListItemButton
                                key={item.path}
                                onClick={() => onNavigate(item.path)}
                                sx={{
                                    pl: 5,
                                    py: 1,
                                    bgcolor: active
                                        ? (theme) => alpha(theme.palette.primary.main, 0.1)
                                        : 'transparent',
                                    borderRight: active ? '3px solid' : 'none',
                                    borderColor: 'primary.main',
                                    '&:hover': {
                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                    <ItemIcon
                                        sx={{
                                            fontSize: '1.1rem',
                                            color: active ? 'primary.main' : 'text.secondary',
                                        }}
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    slotProps={{
                                        primary: {
                                            sx: {
                                                fontWeight: active ? 600 : 400,
                                                fontSize: '0.875rem',
                                                color: active ? 'primary.main' : 'text.primary',
                                            },
                                        },
                                    }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            </Collapse>
        </>
    );
};

MobileDrawerGroup.propTypes = {
    group: PropTypes.object.isRequired,
    userRole: PropTypes.string.isRequired,
    currentPath: PropTypes.string.isRequired,
    onNavigate: PropTypes.func.isRequired,
    onAction: PropTypes.func,
    defaultOpen: PropTypes.bool,
};

/* ─── Main AdminNavBar ─── */
const AdminNavBar = ({ user }) => {
    const { t } = useTranslation(['admin', 'common']);
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { userProfile } = useAuth();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [blogUploadOpen, setBlogUploadOpen] = useState(false);

    const userRole = userProfile?.role || 'user';
    const currentPath = location.pathname;

    const navConfig = useMemo(() => getNavConfig(t), [t]);

    // Action handlers for actionKey-based nav items
    const handleAction = useCallback((actionKey) => {
        if (actionKey === 'openBlogUpload') {
            setBlogUploadOpen(true);
        }
    }, []);

    // Filter groups that have at least one visible item for the role
    const visibleGroups = useMemo(
        () =>
            navConfig.groups.filter(
                (group) =>
                    group.roles.includes(userRole) &&
                    group.items.some((item) => item.roles.includes(userRole))
            ),
        [navConfig.groups, userRole]
    );

    const showDashboard = navConfig.dashboard.roles.includes(userRole);

    const handleNavigate = useCallback(
        (path) => {
            navigate(path);
            setDrawerOpen(false);
        },
        [navigate]
    );

    const toggleDrawer = useCallback(() => {
        setDrawerOpen((prev) => !prev);
    }, []);

    const dashboardActive = isActive(currentPath, '/admin', true);
    const DashboardIcon_ = navConfig.dashboard.icon;

    return (
        <>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: (th) => alpha(th.palette.background.paper, 0.92),
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    zIndex: 1300,
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: { xs: 56, md: 64 },
                        px: { xs: 1.5, sm: 2, md: 3 },
                        gap: { xs: 0.5, md: 1 },
                    }}
                >
                    {/* Mobile: Hamburger */}
                    {isMobile && (
                        <IconButton
                            onClick={toggleDrawer}
                            aria-label={t('admin:nav.openMenu')}
                            edge="start"
                            sx={{ mr: 0.5 }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    {/* Brand / Title */}
                    <Typography
                        variant="h6"
                        component="div"
                        onClick={() => handleNavigate('/admin')}
                        sx={{
                            fontWeight: 700,
                            fontSize: { xs: '1rem', md: '1.15rem' },
                            color: 'primary.main',
                            cursor: 'pointer',
                            mr: { xs: 'auto', md: 2 },
                            whiteSpace: 'nowrap',
                            userSelect: 'none',
                        }}
                    >
                        {t('admin:nav.title')}
                    </Typography>

                    {/* Desktop: Horizontal nav items */}
                    {!isMobile && (
                        <Box
                            component="nav"
                            aria-label={t('admin:nav.adminNavigation')}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                flexGrow: 1,
                            }}
                        >
                            {/* Dashboard link */}
                            {showDashboard && (
                                <Button
                                    onClick={() => handleNavigate('/admin')}
                                    startIcon={<DashboardIcon_ sx={{ fontSize: '1.1rem' }} />}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: dashboardActive ? 600 : 400,
                                        color: dashboardActive ? 'primary.main' : 'text.secondary',
                                        fontSize: '0.875rem',
                                        px: 1.5,
                                        py: 0.75,
                                        borderRadius: 2,
                                        bgcolor: dashboardActive
                                            ? (th) => alpha(th.palette.primary.main, 0.08)
                                            : 'transparent',
                                        '&:hover': {
                                            bgcolor: (th) =>
                                                alpha(th.palette.primary.main, 0.06),
                                        },
                                    }}
                                >
                                    {navConfig.dashboard.label}
                                </Button>
                            )}

                            {/* Grouped nav menus */}
                            {visibleGroups.map((group) => (
                                <DesktopGroupMenu
                                    key={group.id}
                                    group={group}
                                    userRole={userRole}
                                    currentPath={currentPath}
                                    onNavigate={handleNavigate}
                                    onAction={handleAction}
                                />
                            ))}
                        </Box>
                    )}

                    {/* Right side: Back to Site + UserAvatar */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
                        {/* Back to Site — desktop only (in mobile drawer) */}
                        {!isMobile && (
                            <Button
                                onClick={() => handleNavigate('/calendar')}
                                startIcon={<ArrowBackIcon sx={{ fontSize: '1rem' }} />}
                                size="small"
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 400,
                                    color: 'text.secondary',
                                    fontSize: '0.8125rem',
                                    px: 1.5,
                                    borderRadius: 2,
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    },
                                }}
                            >
                                {navConfig.backToSite.label}
                            </Button>
                        )}

                        {/* UserAvatar */}
                        {user && <UserAvatar user={user} />}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* ─── Mobile Drawer ─── */}
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={toggleDrawer}
                slotProps={{
                    paper: {
                        sx: {
                            width: { xs: 280, sm: 320 },
                            bgcolor: 'background.paper',
                        },
                    },
                }}
            >
                {/* Drawer header */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 2.5,
                        py: 2,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, fontSize: '1rem', color: 'primary.main' }}
                    >
                        {t('admin:nav.title')}
                    </Typography>
                    <IconButton onClick={toggleDrawer} size="small" aria-label={t('common:buttons.close')}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Dashboard item */}
                {showDashboard && (
                    <List disablePadding>
                        <ListItemButton
                            onClick={() => handleNavigate('/admin')}
                            sx={{
                                px: 2.5,
                                py: 1.25,
                                bgcolor: dashboardActive
                                    ? (th) => alpha(th.palette.primary.main, 0.1)
                                    : 'transparent',
                                borderRight: dashboardActive ? '3px solid' : 'none',
                                borderColor: 'primary.main',
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                <DashboardIcon_
                                    sx={{
                                        fontSize: '1.25rem',
                                        color: dashboardActive ? 'primary.main' : 'text.secondary',
                                    }}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary={navConfig.dashboard.label}
                                slotProps={{
                                    primary: {
                                        sx: {
                                            fontWeight: dashboardActive ? 600 : 400,
                                            fontSize: '0.9rem',
                                            color: dashboardActive ? 'primary.main' : 'text.primary',
                                        },
                                    },
                                }}
                            />
                        </ListItemButton>
                    </List>
                )}

                <Divider sx={{ my: 0.5 }} />

                {/* Nav groups */}
                <List disablePadding>
                    {visibleGroups.map((group) => (
                        <MobileDrawerGroup
                            key={group.id}
                            group={group}
                            userRole={userRole}
                            currentPath={currentPath}
                            onNavigate={handleNavigate}
                            onAction={handleAction}
                            defaultOpen={isGroupActive(currentPath, group.items)}
                        />
                    ))}
                </List>

                {/* Bottom section: Back to Site */}
                <Box sx={{ mt: 'auto', borderTop: '1px solid', borderColor: 'divider' }}>
                    <List disablePadding>
                        <ListItemButton
                            onClick={() => handleNavigate('/calendar')}
                            sx={{ px: 2.5, py: 1.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                <ArrowBackIcon sx={{ fontSize: '1.25rem', color: 'text.secondary' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={navConfig.backToSite.label}
                                slotProps={{
                                    primary: {
                                        sx: {
                                            fontWeight: 400,
                                            fontSize: '0.875rem',
                                            color: 'text.secondary',
                                        },
                                    },
                                }}
                            />
                        </ListItemButton>
                    </List>
                </Box>
            </Drawer>

            {/* Blog GPT upload drawer — triggered from Blog nav group */}
            <BlogUploadDrawer
                open={blogUploadOpen}
                onClose={() => setBlogUploadOpen(false)}
            />
        </>
    );
};

AdminNavBar.propTypes = {
    /** Firebase user object for UserAvatar rendering */
    user: PropTypes.shape({
        photoURL: PropTypes.string,
        displayName: PropTypes.string,
        email: PropTypes.string,
    }),
};

AdminNavBar.defaultProps = {
    user: null,
};

export default AdminNavBar;
