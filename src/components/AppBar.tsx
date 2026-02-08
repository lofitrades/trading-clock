/**
 * src/components/AppBar.tsx
 * 
 * Purpose: Calendar dashboard navigation bar.
 * Renders a sticky sub-header on md+ and an Airbnb-style bottom navigation on xs/sm.
 * 
 * Changelog:
 * v1.5.6 - 2026-02-06 - Added Blog nav handling so Blog items render between Calendar and About across desktop AppBar and mobile bottom nav for all users (auth and guests). Aligns with useAppBarNavItems hook addition.
 * v1.5.5 - 2026-01-28 - BEP: Removed ThemeToggle button from AppBar. Theme switching deferred to SettingsSidebar2 Settings tab only. Simplifies AppBar navigation chrome. Users access theme toggle via Settings gear button → General tab → Appearance section.
 * v1.5.4 - 2026-01-28 - BEP PHASE 3.4: Added ThemeToggle button to AppBar right-stack (between nav items and NotificationCenter). Quick theme cycling: light → dark → system → light. Icon adapts to current theme (LightModeIcon for light, DarkModeIcon for dark/system). Tooltip shows current mode. Circular icon-only button with hover effect. Available on all breakpoints for all users (auth and guests). Uses useThemeMode().toggleTheme() from ThemeContext for real-time switching.
 * v1.5.3 - 2026-01-28 - BEP THEME-AWARE: Updated Paper bgcolor from hardcoded 'rgba(255,255,255,0.94)' to 'alpha(theme.palette.background.paper, 0.94)' for light/dark mode support. Updated boxShadow to be theme-aware: dark mode uses deeper shadow 'rgba(0,0,0,0.3)', light mode uses subtle shadow 'rgba(15,23,42,0.06)'. Mobile BottomNavigation Paper also updated to use theme palette. Entire AppBar now respects user's light/dark theme preference with proper contrast and accessibility.
 * v1.5.2 - 2026-01-27 - BEP CONSOLE FIX: Fixed React duplicate key error "Encountered two children with the same key, `settings`". Removed key={item.id} from Button and Tooltip components inside .map() and moved key to outer Fragment wrapper. This prevents React from seeing duplicate keys when same item ID appears in multiple places during re-renders. Fixes cascading key warnings that appeared on login in AppBar tooltip and BottomNavigationAction.
 * v1.5.1 - 2026-01-27 - BEP RESPONSIVE FIX: Language switcher visibility ensured on all pages (clock, calendar, landing, about) via LanguageSwitcher display:flex + flexShrink:0. Works on all breakpoints xs/sm/md/lg/xl.
 * v1.5.0 - 2026-01-27 - PHASE 4 INTEGRATION: Added LanguageSwitcher component to right-stack. Language switcher available on all breakpoints (desktop nav + mobile bottom nav). Supports instant language switching between EN/ES/FR with persistence to localStorage + Firestore. Positioned left of NotificationCenter for consistent right-stack layout.
 * v1.4.17 - 2026-01-22 - BEP UX: Close notification menu when avatar menu opens and vice versa.
 * v1.4.16 - 2026-01-22 - BEP BUGFIX: Fixed duplicate notification bell rendering on lg+ for non-auth users. Changed condition from checking all unlock buttons (unlock-md OR unlock-lg) to only checking first unlock button (unlock-md). Prevents notification from rendering twice when both unlock buttons exist in items array. Now renders single bell before first unlock button regardless of breakpoint.
 * v1.4.15 - 2026-01-22 - BEP BUGFIX: Fixed persistent duplicate notification bells on md+. Added explicit isAuthenticated() check to right-stack notification condition alongside user object check. Ensures notifications only appear once: before Unlock button for non-auth users, right of nav for auth users only.
 * v1.4.14 - 2026-01-22 - BEP BUGFIX: Fixed duplicate notification bell on md+. Changed right-stack condition from isAuthenticated() function check to direct `user` object check. Ensures non-auth users on md+ only see notification bell before Unlock button (not duplicated in right stack).
 * v1.4.13 - 2026-01-22 - BEP NOTIFICATION BELL POSITIONING: For non-auth users on md+, moved NotificationCenter from right side (after nav) to left of Unlock button. Shows bell icon immediately before the primary CTA for non-authenticated visitors. Auth users still see bell right of nav, left of avatar (unchanged).
 * v1.4.12 - 2026-01-22 - BEP UX: Added notificationEvents prop to pass custom events array to NotificationCenter. Enables EventModal opening on notification click for seamless reminder-to-event navigation.
 * v1.4.11 - 2026-01-22 - NOTIFICATION CENTER ON DESKTOP: Added NotificationCenter component to desktop nav (md+) positioned right of Settings button and left of user avatar. Accepts notification props (notifications, unreadCount, onMarkRead, onMarkAllRead, onClearAll) from PublicLayout. Enables global notification scope with consistent UI across all breakpoints: md+ in sticky AppBar nav, xs/sm in mobile header.
 * v1.4.10 - 2026-01-21 - Z-INDEX: Keep AppBar layers below modal overlays while aligning with the global stack.
 * v1.4.9 - 2026-01-16 - NAV ORDER: Reordered nav items so Trading Clock appears before Calendar on all breakpoints.
 * v1.4.8 - 2026-01-15 - DESKTOP SETTINGS VISIBILITY: Show Settings button for non-auth users on md+ when AppBar is visible.
 * v1.4.7 - 2026-01-15 - CRITICAL CSS VARIABLE FIX: Changed isMobile from useMediaQuery(theme.breakpoints.down('sm'))
 * to useMediaQuery(theme.breakpoints.down('md')). The mobile bottom nav is displayed on xs AND sm (display: { xs: 'block', md: 'none' }),
 * but the CSS variable --t2t-bottom-nav-height was only being set on xs (below sm), not on sm itself. This caused floating buttons
 * on sm breakpoint to calculate position as 'calc(18px + 0px + env(...))' instead of 'calc(18px + 64px + env(...))' because the
 * CSS variable defaulted to 0px. Now isMobile correctly covers both xs and sm breakpoints, ensuring the CSS variable is set whenever
 * the mobile bottom nav is visible. This fixes sm breakpoint buttons appearing under the AppBar instead of above it.
 * v1.4.6 - 2026-01-14 - LOGOUT MODAL REFACTOR: Removed inline logout handler from AppBar.
 * LogoutModal now handles full logout flow independently. AppBar focuses on navigation and chrome,
 * delegating logout behavior to UserAvatar + LogoutModal. Removed dependency on signOut, auth, useSettings.
 * UserAvatar no longer requires onLogout callback - LogoutModal manages the entire logout flow.
 * v1.4.5 - 2026-01-14 - RESPONSIVE BRAND NAME: Updated brand text to show 'T2T' on md breakpoint only, 'Time 2 Trade' on xs/sm/lg/xl.
 * Uses conditional display property on separate Typography components for space-efficient branding on medium screens.
 * v1.4.4 - 2026-01-14 - USER AVATAR INTEGRATION: Added standalone UserAvatar component to desktop nav (md+ only, auth users only).
 * Positioned to the right of nav items in the Stack. Integrated logout handler that calls signOut, resets settings, and navigates home.
 * Improves separation of concerns: UserAvatar handles account modal UI, AppBar handles logout flow. Mobile bottom nav unchanged (no UserAvatar on xs/sm).
 * v1.4.3 - 2026-01-14 - BUGFIX: Filter out 'unlock-md' and 'unlock-lg' items from mobile bottom navigation. These should only show on desktop (md+ sticky nav), not on the mobile Airbnb-style bottom nav. Mobile users see Settings button instead for settings access, Unlock buttons are desktop-only.
 * v1.4.2 - 2026-01-14 - RESPONSIVE BUTTON TEXT: Desktop CTA now shows "Unlock" on md and "Unlock all features" on lg+. This provides concise copy on medium screens while showing the full value prop on larger displays where space is abundant.
 * v1.4.1 - 2026-01-14 - DESKTOP CTA: On md+ desktop navigation, replaced 'Settings' with primary 'Unlock all features' button. Mobile (xs/sm) bottom nav still shows Settings. This creates a clearer conversion path on desktop while maintaining settings access on mobile.
 * v1.4.0 - 2026-01-13 - Removed 'About' item and added placeholder 'Roadmap' item. Roadmap button shows "coming soon" alert on all breakpoints (desktop nav and mobile bottom nav) following consistent UX patterns.
 * v1.3.0 - 2026-01-13 - REDESIGN: Always show Settings button for all users (auth and non-auth). Conditionally show "Unlock all features" button only for non-authenticated visitors. Unified settings access across the dashboard with responsive mobile-first design following enterprise best practices.
 * v1.2.1 - 2026-01-13 - BUGFIX: Removed `primary: true` from Settings button so it only applies to "Unlock all features" CTA for guests.
 * v1.2.0 - 2026-01-13 - Removed 'Contact' item; implemented auth-driven CTA (guest: 'Unlock all features', auth: 'Settings' that opens SettingsSidebar2).
 * v1.1.2 - 2026-01-13 - CRITICAL FIX: Added width:100% to desktop Paper so AppBar fills the centered container (parent has maxWidth+mx:auto, child fills it).
 * v1.1.1 - 2026-01-13 - Locked AppBar to the canonical container sizing; removed per-page spacing presets to keep chrome independent from page content.
 * v1.1.0 - 2026-01-13 - Added shared AppBar profile presets so page shells consume standardized padding/margins without custom overrides.
 * v1.0.9 - 2026-01-13 - Restored horizontal centering for the shared AppBar container so /app stays aligned on md/lg.
 * v1.0.8 - 2026-01-13 - Removed horizontal auto-centering (mx) from shared container to align /app chrome with full-width layout shells.
 * v1.0.7 - 2026-01-13 - Tightened md/lg container max widths and box sizing to keep dashboard chrome centered without horizontal overflow on marketing pages.
 * v1.0.6 - 2026-01-12 - Implemented mobile-first responsive maxWidth (360/540px on xs/sm, full on md+) for proper horizontal centering on mobile breakpoints.
 * v1.0.5 - 2026-01-12 - Added maxHeight constraint to Paper component for consistent AppBar height across pages.
 * v1.0.4 - 2026-01-12 - Added shared container sizing so AppBar chrome matches across /calendar, /app, and /about.
 * v1.0.3 - 2026-01-12 - Highlight active route item in primary color on desktop nav.
 * v1.0.2 - 2026-01-12 - Add shortLabel support so mobile bottom nav labels stay compact while desktop uses full CTA labels.
 * v1.0.1 - 2026-01-12 - Desktop header: use brand logo + name (landing-style) instead of "Calendar / Quick navigation".
 * v1.0.0 - 2026-01-12 - Created responsive calendar dashboard AppBar with 5-item max nav model.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import NotificationCenter from './NotificationCenter';
import LanguageSwitcher from './LanguageSwitcher';

export const MOBILE_BOTTOM_APPBAR_HEIGHT_PX = 64;
const DEFAULT_BRAND_LOGO_SRC = '/logos/favicon/favicon.ico';

export const DASHBOARD_APP_BAR_CONTAINER_SX: SxProps<Theme> = {
  width: '100%',
  maxWidth: 1560,
  mx: 'auto',
  px: { xs: 2, sm: 2.75, md: 3.5 },
};

export type AppBarNavItem = {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ReactElement;
  to?: string;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  badge?: number | 'dot';
  ariaLabel?: string;
};

export type AppBarProps = {
  items: AppBarNavItem[];
  ariaLabel?: string;
  sx?: SxProps<Theme>;
  onOpenSettings?: () => void;
  onOpenAuth?: () => void;
  notifications?: any[];
  unreadCount?: number;
  onMarkRead?: (notificationId: string) => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  notificationEvents?: any[];
};

const clampItems = (items: AppBarNavItem[]) => {
  // Allow up to 6 items: Clock, Calendar, Roadmap, About, Settings, Unlock
  // Always ensure 'settings' and 'unlock' buttons are visible (never clamp them out)
  const settingsItem = items.find((item) => item.id === 'settings');
  const unlockMdItem = items.find((item) => item.id === 'unlock-md');
  const unlockLgItem = items.find((item) => item.id === 'unlock-lg');
  
  if (items.length > 6) {
    // Keep first N items, then settings and unlock at the end
    const keepItems = [];
    
    // Filter out settings and unlock items from the main list
    const mainItems = items.filter(
      (item) => item.id !== 'settings' && item.id !== 'unlock-md' && item.id !== 'unlock-lg'
    );
    
    // Add items up to slot for settings/unlock
    const numMainItems = 4; // Clock, Calendar, Roadmap, About
    keepItems.push(...mainItems.slice(0, numMainItems));
    
    // Add control items at the end
    if (settingsItem) keepItems.push(settingsItem);
    if (unlockMdItem) keepItems.push(unlockMdItem);
    if (unlockLgItem) keepItems.push(unlockLgItem);
    
    return keepItems;
  }
  return items;
};

const getActiveIndexFromPath = (pathname: string, items: AppBarNavItem[]) => {
  const explicit = items.findIndex((item) => item.to && pathname === item.to);
  if (explicit >= 0) return explicit;

  const prefix = items.findIndex((item) => item.to && item.to !== '/' && pathname.startsWith(item.to));
  return prefix >= 0 ? prefix : -1;
};

const isItemActive = (pathname: string, item: AppBarNavItem) => {
  if (!item.to) return false;
  if (item.to === '/') return pathname === '/';
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
};

export default function DashboardAppBar({ items, ariaLabel = 'Calendar navigation', sx, onOpenSettings, onOpenAuth, notifications, unreadCount, onMarkRead, onMarkAllRead, onClearAll, notificationEvents }: AppBarProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['common']);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, isAuthenticated } = useAuth();
  const [notificationCloseSignal, setNotificationCloseSignal] = useState(0);
  const [avatarCloseSignal, setAvatarCloseSignal] = useState(0);

  // Build processed items: remove 'contact', handle 'about' and 'roadmap', then reorder to: Clock, Calendar, Blog, About, Settings/Unlock
  const processedItems = useMemo(() => {
    // Filter out contact items but keep about items
    const filtered = items.filter((item) => item.id !== 'contact');

    // Extract Clock, Calendar, Blog, and About items to maintain their order at the start
    const clockItem = filtered.find((item) => item.id === 'clock');
    const calendarItem = filtered.find((item) => item.id === 'calendar');
    const blogItem = filtered.find((item) => item.id === 'blog');
    const aboutItem = filtered.find((item) => item.id === 'about');
    const settingsItem = filtered.find((item) => item.id === 'settings');

    // Remove them from filtered so we can rebuild in specific order
    // Also remove 'signin' since we handle unlock buttons separately based on auth state
    const otherItems = filtered.filter((item) => 
      item.id !== 'calendar' && 
      item.id !== 'clock' && 
      item.id !== 'blog' &&
      item.id !== 'about' && 
      item.id !== 'settings' &&
      item.id !== 'signin'
    );

    // Build the final ordered array
    const ordered: AppBarNavItem[] = [];

    // Add Clock first
    if (clockItem) ordered.push(clockItem);

    // Add Calendar second
    if (calendarItem) ordered.push(calendarItem);

    // Add Blog third
    if (blogItem) ordered.push(blogItem);

    // Add About item (fourth) if present
    if (aboutItem) ordered.push(aboutItem);

    // Add any remaining items (excluding settings and signin which we handle below)
    ordered.push(...otherItems);

    // Show Settings for all users (auth and non-auth)
    if (settingsItem) ordered.push(settingsItem);

    // For non-authenticated users, also show Unlock CTA buttons
    const authed = isAuthenticated ? isAuthenticated() : false;
    if (!authed) {
      // Add "Unlock" button for md only (shown on md desktop nav)
      const unlockMdItem: AppBarNavItem = {
        id: 'unlock-md',
        label: t('common:navigation.unlock'),
        shortLabel: t('common:navigation.unlock'),
        icon: <LockIcon sx={{ fontSize: 'inherit' }} />,
        onClick: onOpenAuth,
        to: undefined,
        primary: true,
        ariaLabel: 'Unlock all features',
      };
      ordered.push(unlockMdItem);

      // Add "Unlock all features" button for lg+ (full copy on larger screens)
      const unlockLgItem: AppBarNavItem = {
        id: 'unlock-lg',
        label: t('common:navigation.unlockAllFeatures'),
        shortLabel: t('common:navigation.unlock'),
        icon: <LockIcon sx={{ fontSize: 'inherit' }} />,
        onClick: onOpenAuth,
        to: undefined,
        primary: true,
        ariaLabel: 'Unlock all features',
      };
      ordered.push(unlockLgItem);
    }

    return ordered;
  }, [items, isAuthenticated, onOpenSettings, onOpenAuth, location.pathname, t]);

  const safeItems = useMemo(() => clampItems(processedItems), [processedItems]);

  const [mobileValue, setMobileValue] = useState(() => getActiveIndexFromPath(location.pathname, safeItems));

  useEffect(() => {
    setMobileValue(getActiveIndexFromPath(location.pathname, safeItems));
  }, [location.pathname, safeItems]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const root = document.documentElement;
    if (isMobile) {
      root.style.setProperty('--t2t-bottom-nav-height', `${MOBILE_BOTTOM_APPBAR_HEIGHT_PX}px`);
      return () => {
        root.style.removeProperty('--t2t-bottom-nav-height');
      };
    }

    root.style.removeProperty('--t2t-bottom-nav-height');
    return undefined;
  }, [isMobile]);

  const handleActivate = (item: AppBarNavItem) => {
    if (item.disabled) return;

    if (item.onClick) {
      item.onClick();
      return;
    }

    if (item.to) {
      navigate(item.to);
    }
  };

  const renderIcon = (item: AppBarNavItem) => {
    if (!item.badge) return item.icon;

    const badgeContent = item.badge === 'dot' ? undefined : item.badge;
    return (
      <Badge
        color="primary"
        variant={item.badge === 'dot' ? 'dot' : 'standard'}
        badgeContent={badgeContent}
        overlap="circular"
      >
        {item.icon}
      </Badge>
    );
  };

  return (
    <>
      {/* Desktop / tablet sticky bar */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, ...sx }}>
        <Paper
          variant="outlined"
          sx={{
            width: '100%',
            borderRadius: 3,
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.background.paper, 0.94),
            backdropFilter: 'blur(10px)',
            boxShadow: 'none',
            overflow: 'hidden',
            maxHeight: 72,
            zIndex: theme.zIndex.appBar,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ px: { md: 2, lg: 2.25 }, height: 52 }}
          >
            {/* Brand lockup + LanguageSwitcher on logo only, nav items after */}
            <Stack
              component={RouterLink}
              to="/"
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                minWidth: 0,
                textDecoration: 'none',
                color: 'inherit',
                '&:focus-visible': {
                  outline: '2px solid rgba(15,23,42,0.35)',
                  outlineOffset: 4,
                  borderRadius: 1,
                },
              }}
              aria-label="Time 2 Trade home"
            >
              <Box
                component="img"
                src={DEFAULT_BRAND_LOGO_SRC}
                alt="Time 2 Trade logo"
                sx={{
                  display: 'block',
                  height: 40,
                  width: 'auto',
                  maxWidth: '32vw',
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.1,
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  pr: { md: 0, lg: 0 },
                  display: { xs: 'block', md: 'none', lg: 'block' },
                }}
              >
                Time 2 Trade
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1.1,
                  color: 'text.primary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: { xs: 'none', md: 'block', lg: 'none' },
                }}
              >
                T2T
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, justifyContent: 'flex-end', minWidth: 0, overflow: 'hidden' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ justifyContent: 'flex-end', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                {safeItems.map((item, index) => {
                const variant = item.primary ? 'contained' : 'text';
                const color = item.primary ? 'primary' : 'inherit';
                const active = isItemActive(location.pathname, item);
                
                // BEP: For non-auth users, show language switcher left of FIRST Unlock button only (unlock-md) on md+
                // This prevents duplicate elements when both unlock-md and unlock-lg exist in the items array
                const isFirstUnlockButton = item.id === 'unlock-md';
                const shouldShowLanguageSwitcherBeforeUnlock = 
                  isFirstUnlockButton && 
                  !(isAuthenticated ? isAuthenticated() : false);
                
                const button = (
                  <Button
                    onClick={() => handleActivate(item)}
                    disabled={Boolean(item.disabled)}
                    variant={variant}
                    color={color as any}
                    startIcon={renderIcon(item)}
                    component={item.to && !item.onClick ? RouterLink : 'button'}
                    to={item.to && !item.onClick ? item.to : undefined}
                    sx={{
                      textTransform: 'none',
                      fontWeight: item.primary ? 800 : 700,
                      borderRadius: 999,
                      px: item.primary ? 2.5 : 2,
                      py: 0.9,
                      minWidth: 0,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      display: item.id === 'settings'
                        ? 'inline-flex'
                        : item.id === 'unlock-md'
                          ? { xs: 'none', md: 'inline-flex', lg: 'none' }
                          : item.id === 'unlock-lg'
                            ? { xs: 'none', md: 'none', lg: 'inline-flex' }
                            : 'inline-flex',
                      color: item.primary
                        ? 'primary.contrastText'
                        : active
                          ? 'primary.main'
                          : 'text.primary',
                      bgcolor: item.primary
                        ? undefined
                        : active
                          ? alpha(theme.palette.primary.main, 0.08)
                          : undefined,
                      '&:hover': item.primary
                        ? undefined
                        : {
                            bgcolor: active
                              ? alpha(theme.palette.primary.main, 0.12)
                              : alpha(theme.palette.text.primary, 0.04),
                          },
                      '& .MuiButton-startIcon': { mr: 0.75 },
                      '&:focus-visible': {
                        outline: '2px solid #0ea5e9',
                        outlineOffset: 3,
                      },
                    }}
                    aria-label={item.ariaLabel || item.label}
                  >
                    {item.label}
                  </Button>
                );

                const buttonElement = item.primary ? (
                  button
                ) : (
                  <Tooltip title={item.label} arrow>
                    <Box component="span">{button}</Box>
                  </Tooltip>
                );
                
                // BEP: Insert language switcher before Unlock button for non-auth users
                if (shouldShowLanguageSwitcherBeforeUnlock) {
                  return (
                    <React.Fragment key={item.id}>
                      <Box sx={{ display: 'flex', flexShrink: 0 }}>
                        <LanguageSwitcher />
                      </Box>
                      {buttonElement}
                    </React.Fragment>
                  );
                }

                return <React.Fragment key={item.id}>{buttonElement}</React.Fragment>;
                })}
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, display: 'flex' }}>
                {/* Notification Center - right of settings/nav items, left of user avatar for authenticated users on md+ ONLY */}
                {/* BEP: Only show for auth users; non-auth users see language switcher before Unlock button instead */}
                {notifications && unreadCount !== undefined && (isAuthenticated ? isAuthenticated() : false) && (
                  <NotificationCenter
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkRead={onMarkRead}
                    onMarkAllRead={onMarkAllRead}
                    onClearAll={onClearAll}
                    events={notificationEvents}
                    closeSignal={notificationCloseSignal}
                    onMenuOpen={() => setAvatarCloseSignal((prev) => prev + 1)}
                    onMenuClose={() => setAvatarCloseSignal((prev) => prev + 1)}
                  />
                )}

                {/* User Avatar - show only for authenticated users on md+ */}
                {user && (isAuthenticated ? isAuthenticated() : false) && (
                  <UserAvatar
                    user={user}
                    onOpen={() => setNotificationCloseSignal((prev) => prev + 1)}
                    closeSignal={avatarCloseSignal}
                  />
                )}
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Box>

      {/* Mobile bottom nav (Airbnb-style) */}
      <Paper
        elevation={6}
        component="nav"
        aria-label={ariaLabel}
        sx={{
          display: { xs: 'block', md: 'none' },
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: theme.zIndex.appBar,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.background.paper, 0.98),
          backdropFilter: 'blur(10px)',
          pb: 'env(safe-area-inset-bottom)',
        }}
      >
        <BottomNavigation
          showLabels
          value={mobileValue}
          onChange={(_, nextValue) => {
            const nextItem = safeItems[nextValue];
            const isRouteItem = Boolean(nextItem?.to);

            // Keep selection in sync with the current route; non-route actions (e.g., drawers) shouldn't stay active
            if (isRouteItem) {
              setMobileValue(nextValue);
            } else {
              setMobileValue(getActiveIndexFromPath(location.pathname, safeItems));
            }

            if (nextItem) handleActivate(nextItem);
          }}
          sx={{
            height: MOBILE_BOTTOM_APPBAR_HEIGHT_PX,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 0,
              px: 0.75,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              '& .MuiSvgIcon-root': {
                fontSize: '1.25rem',
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.75rem',
              fontWeight: 700,
              lineHeight: 1.2,
              marginTop: '2px',
            },
          }}
        >
          {safeItems.filter((item) => item.id !== 'unlock-md' && item.id !== 'unlock-lg').map((item) => (
            <BottomNavigationAction
              key={item.id}
              label={item.shortLabel || item.label}
              icon={renderIcon(item)}
              disabled={Boolean(item.disabled)}
              aria-label={item.ariaLabel || item.label}
              sx={{
                '&.Mui-selected': {
                  color: 'primary.main',
                },
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </>
  );
}
