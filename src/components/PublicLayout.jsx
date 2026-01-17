/**
 * src/components/PublicLayout.jsx
 * 
 * Purpose: Shared public-page shell that renders the responsive DashboardAppBar with sticky positioning and shared sizing.
 * Centers the navigation chrome, preserves mobile bottom nav behavior, and keeps the layout banner-free by default.
 * 
 * Changelog:
 * v1.0.40 - 2026-01-14 - LOGOUT MODAL REFACTOR: Replaced inline ConfirmModal with standalone LogoutModal component.
 * PublicLayout now passes the logout modal to mobile brand lockup UserAvatar but delegates logout flow to LogoutModal.
 * Removes duplicated logout logic and simplifies state management. Improves separation of concerns across components.
 * Fixes double-click logout bug by centralizing logout flow in LogoutModal with proper loading state.
 * v1.0.39 - 2026-01-14 - REFACTORED USER AVATAR: Extracted user avatar menu UI and functionality into standalone UserAvatar component.
 * PublicLayout now imports and uses UserAvatar instead of inline user menu code. Removed user menu state (userMenuAnchor, showAccountModal)
 * and handlers (handleUserMenuOpen, handleUserMenuClose, handleOpenAccount, handleLogoutClick) - UserAvatar handles these internally.
 * PublicLayout retains only logout confirmation modal handling. Component remains fully responsive, mobile-first, enterprise pattern compliant.
 * Improves separation of concerns: UserAvatar handles account UI/modals, PublicLayout focuses on layout and navigation chrome.
 * v1.0.38 - 2026-01-14 - USER AVATAR MENU: Replaced "Go to Calendar" button for auth users with responsive user avatar that opens a Popover menu with "My Account" and "Log out" items. Avatar shows user photoURL or fallback AccountCircleIcon badge. Menu functionality mirrors SettingsSidebar2: opens AccountModal on "My Account" click, shows logout confirmation on "Log out". Mobile-first design (40x40px avatar) follows enterprise best practices. Unauthenticated users still see "Unlock all features" button. Added lazy-loaded AccountModal and ConfirmModal imports for modals.
 * v1.0.37 - 2026-01-14 - ICON & CORNER RADIUS REFINEMENT: Updated mobile CTA button with enterprise pill-shaped border (borderRadius: 999) matching AppBar and LandingPage pattern. Changed lock icon logic to show CalendarMonthIcon for auth users ("Go to Calendar") and LockIcon for guests ("Unlock all features"). Both icons always visible with size control for button balance.
 * v1.0.36 - 2026-01-14 - BUTTON STYLING REFINEMENT: Added borderRadius: 2 (16px) for rounded corners on mobile CTA button. Added LockIcon startIcon (1rem size) to "Unlock all features" button for non-auth users; icon hidden for authenticated users ("Go to Calendar"). Matches enterprise button pattern and improves visual affordance for unlock/feature-gating UX.
 * v1.0.35 - 2026-01-14 - MOBILE CTA BUTTON: Added responsive "Unlock all features" (guest) / "Go to Calendar" (auth) button to logo row on xs/sm only, aligned right. Uses useAuth to check user state; guests trigger onOpenAuth modal, auth users navigate to /calendar. Button sized responsively (size="small", fontSize xs/sm variants). Mobile-first conversion-focused UX for engagement from landing page.
 * v1.0.34 - 2026-01-14 - CLICKABLE AREA REFINEMENT: Made only favicon + 'Time 2 Trade' text clickable (via nested RouterLink) instead of entire container on xs/sm. Outer Box is now a layout container with aria-label; inner RouterLink wraps only the interactive content. Follows enterprise best practice: clickable area is semantic and explicit, not padding/spacing region. Focus state now properly applies only to clickable element.
 * v1.0.33 - 2026-01-14 - MOBILE CLEARANCE RESTORATION: Restored pt: { xs: 8, sm: 8, md: 0 } to properly account for 64px fixed mobile logo (32px img + 32px py). Previous accidental reduction to pt: 4 caused content to overlap logo on xs/sm breakpoints by 32px. Fixes critical mobile layout issue identified in audit.
 * v1.0.32 - 2026-01-14 - REMOVE DOUBLE SPACING GAP: Fixed excessive gap between AppBar and content on md+ by removing main content pt on desktop. Changed pt: { xs: 8, md: 2 } → pt: { xs: 8, sm: 8, md: 0 }. Now AppBar mb: 2 (16px) alone provides the gap on md+, instead of AppBar mb + content pt creating 32px total. Mobile (xs/sm) keeps pt: 8 (64px) to account for fixed brand logo (48px + 16px gap). Follows best practice: unified spacing control via AppBar mb on desktop, mobile logo accommodation on mobile.
 * v1.0.31 - 2026-01-14 - RESPONSIVE TOP PADDING: Made main content pt responsive: pt: { xs: 8, md: 2 }. Maintains 64px gap on xs/sm for mobile logo accommodation, reduces to 16px on md+ for proper desktop spacing. Combined with AppBar mb: { xs: 0, md: 2 }, creates balanced 32px total gap on desktop (16px + 16px). Follows enterprise spacing best practices: mobile-first larger gaps, desktop cleaner spacing.
 * v1.0.29 - 2026-01-14 - HIDE NAV ON MOBILE: Added hideNavOnMobile prop to PublicLayout for pages (like landing) that don't want the mobile bottom AppBar on xs/sm. When hideNavOnMobile={true}, AppBar doesn't render on any breakpoint. Implemented via hasNavItems logic: !hideNavOnMobile ensures the condition prevents nav render. LandingPage now passes hideNavOnMobile={true} to remove cluttered mobile bottom nav on homepage, keeping focus on hero content for both auth and guest visitors.
 * v1.0.28 - 2026-01-14 - FULL WIDTH MOBILE: Made mobile brand lockup 100% width on xs/sm with responsive padding (px: { xs: 2, sm: 2.75, md: 0 }) for proper gutters. Changed left from 16px to 0 on mobile to enable full-width positioning. Added width: { xs: '100%', sm: '100%', md: 'auto' } and boxSizing: 'border-box' to ensure padding doesn't overflow. Fully responsive mobile-first approach ensures logo row spans entire viewport width while maintaining consistent padding with PublicLayout container.
 * v1.0.27 - 2026-01-14 - MOBILE LOGO STYLING: Added background color (background.default = #F9F9F9) to mobile logo row on xs/sm breakpoints instead of transparent for visual separation and consistency. Added pb (padding-bottom) for xs/sm (2 units = 16px) to create spacing below logo row, improving visual hierarchy. On md+ breakpoints, background returns to transparent and pb is unset. Fully responsive mobile-first approach.
 * v1.0.26 - 2026-01-14 - MOBILE BRANDING: Added fixed mobile brand lockup (logo + "Time 2 Trade" text) for xs/sm breakpoints only, matching AboutPage pattern. Logo uses favicon icon (32px height), fixed positioning relative to AppBar, z-index:100 for visibility, responsive typography. On md+ breakpoints, logo is hidden. Follows mobile-first dashboard layout best practices with graceful responsive behavior.
 * v1.0.25 - 2026-01-14 - Z-INDEX ENTERPRISE FIX: Reduced sticky AppBar container z-index from 1450 → 1400 to match AppBar mobile bottom nav and maintain consistent navigation chrome stacking tier. Enterprise best practice: all navigation elements at same z-index level (1400), drawers at 1600, popovers at 1700, modals at 10001+. This prevents the container from interfering with elements that should stack between nav and drawers.
 * v1.0.24 - 2026-01-14 - CENTERING FIX (ENTERPRISE AUDIT): Fixed flex/width conflict that was breaking centering on all breakpoints. The issue: main centering Box had flex:1 + width:100% + maxWidth:1560 + mx:auto which conflicted. Solution: Move flex:center logic to main Box (justifyContent:center + alignItems:center), remove mx:auto, remove flex:1 from content Box. Now content Box just provides width constraint (100% + maxWidth:1560) while Main Box handles centering. This is the enterprise MUI dashboard pattern and works on xs/sm/md/lg/xl consistently.
 * v1.0.22 - 2026-01-14 - CENTERING FIX (FINAL): Removed alignItems:center from main content Box. The pattern is: parent has no alignItems:center, child uses width:100% + maxWidth:1560 + mx:auto for self-centering. This matches CalendarEmbedLayout pattern which works. See CENTERING_FIX_2026-01-13.md for detailed explanation.
 * v1.0.21 - 2026-01-14 - CENTERING AUDIT FIX: Wrapped children in centered content container (width:100%, maxWidth:1560, mx:auto, px:responsive) matching DASHBOARD_APP_BAR_CONTAINER_SX pattern used in App.jsx and CalendarEmbedLayout. This ensures hero content on xs/sm is correctly horizontally centered to the viewport, not just the AppBar. Main outer Box now properly centers its flex children.
 * v1.0.20 - 2026-01-14 - FIXED BACKGROUND FOR PUBLIC PAGES: Changed bgcolor from 'inherit' back to fixed #F9F9F9 so /calendar and other public pages maintain consistent background color. Session-based background color changes now only affect /app page (handled by App.jsx). Clock paper background in /calendar remains dynamic.
 * v1.0.19 - 2026-01-14 - GLOBAL BACKGROUND FIX: Changed bgcolor from hardcoded #F9F9F9 to 'inherit' so session-based background colors from App.jsx (via document.body) properly propagate through the layout shell. This enables the 'Session-based Background' setting to affect the entire page.
 * v1.0.18 - 2026-01-13 - BUGFIX: Account for bottom sticky AppBar height on xs/sm by constraining main Box maxHeight; inner Papers handle their own scrolling with overflowY:auto. Main Box remains overflow:hidden (not scrollable), inner content manages scroll via Paper components.
 * v1.0.17 - 2026-01-13 - Added onOpenSettings and onOpenAuth handler props to support auth-driven CTA (Settings vs Unlock).
 * v1.0.16 - 2026-01-13 - CRITICAL FIX: Removed width:100% from sticky Box (was blocking mx:auto centering). AppBar Paper now has width:100% to fill the centered container. This matches the pattern where parent constrains max width and child fills it.
 * v1.0.15 - 2026-01-13 - REFACTOR: Simplified to single-layer AppBar container matching /calendar pattern. Applied width:100%, maxWidth:1560, mx:auto, px:responsive to sticky Box directly (removed nested Box layer). Inline styles more maintainable than importing shared constant.
 * v1.0.14 - 2026-01-13 - CRITICAL: Fixed AppBar centering by separating sticky behavior from centering logic. Outer sticky Box now has width:100% for proper sticky, inner Box applies centering container SX (mx:auto, maxWidth:1560, px:responsive).
 * v1.0.13 - 2026-01-13 - CRITICAL FIX: Removed width:100% from sticky AppBar Box and main content Box; this was blocking alignItems:center centering. Children now rely on their own mx:auto + maxWidth for self-centering.
 * v1.0.12 - 2026-01-13 - Added alignItems:center to outer Box so children using mx:auto (AppBar, content) center horizontally on all breakpoints; fixes global centering issue affecting /app and /about.
 * v1.0.11 - 2026-01-13 - Removed per-page AppBar overrides; PublicLayout now always renders the canonical AppBar width independent of page content.
 * v1.0.10 - 2026-01-13 - Added standardized AppBar profile selection to keep chrome sizing consistent across all pages.
 * v1.0.9 - 2026-01-13 - Updated documentation after removing referral banner support; layout remains nav-only and sticky.
 * v1.0.8 - 2026-01-13 - Removed the ad banner row entirely; PublicLayout now renders only the navigation chrome.
 * v1.0.7 - 2026-01-13 - Added optional topBannerSx prop so pages (e.g., /app) can apply md-only right margin to the banner without impacting others.
 * v1.0.6 - 2026-01-13 - Allow page-specific AppBar spacing overrides (e.g., /app md-only right margin) without affecting other routes.
 * v1.0.5 - 2026-01-13 - Added bottom spacing on xs/sm under the banner row to create breathing room before main content.
 * v1.0.4 - 2026-01-13 - Match banner row background to /app top banner color for cross-page consistency.
 * v1.0.3 - 2026-01-13 - Switched sticky banner/AppBar backdrop to the main content background color for consistent chrome.
 * v1.0.2 - 2026-01-13 - Locked public shell to a 100dvh viewport with hidden overflow so scrolling is delegated to inner content (e.g., CalendarEmbed papers).
 * v1.0.1 - 2026-01-13 - Made both the banner row and AppBar independently sticky with measured offset so the black banner stays pinned above the nav.
 * v1.0.0 - 2026-01-13 - Created public layout wrapper with default referral banner and responsive dashboard AppBar.
 */

import { useMemo, useState, Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import DashboardAppBar from './AppBar';
import UserAvatar from './UserAvatar';
import { useAuth } from '../contexts/AuthContext';

const LogoutModal = lazy(() => import('./LogoutModal'));

const PublicLayout = ({ children, navItems, onOpenSettings, onOpenAuth, hideNavOnMobile }) => {
    const hasNavItems = useMemo(() => Array.isArray(navItems) && navItems.length > 0, [navItems]);
    const { user } = useAuth();

    const [showLogoutModal, setShowLogoutModal] = useState(false);

    return (
        <>
            <Box
                sx={{
                    minHeight: 'var(--t2t-vv-height, 100dvh)',
                    height: 'var(--t2t-vv-height, 100dvh)',
                    bgcolor: '#F9F9F9',
                    display: 'flex',
                    flexDirection: 'column',
                    color: 'inherit',
                    overflow: 'hidden',
                }}
            >
                {/* Mobile brand lockup - fixed on xs/sm ONLY (matching AboutPage pattern) */}
                <Box
                    sx={{
                        display: { xs: 'inline-flex', sm: 'inline-flex', md: 'none' },
                        alignItems: 'center',
                        gap: 1,
                        width: { xs: '100%', sm: '100%', md: 'auto' },
                        px: { xs: 2.5, sm: 2.75, md: 0 },
                        bgcolor: { xs: 'background.default', sm: 'background.default', md: 'transparent' },
                        py: { xs: 1, sm: 1, md: 'unset' },
                        mb: 2,
                        position: { xs: 'fixed', sm: 'fixed', md: 'relative' },
                        top: 0,
                        left: { xs: 0, sm: 0, md: 'auto' },
                        zIndex: { xs: 100, sm: 100, md: 'auto' },
                        boxSizing: 'border-box',
                        justifyContent: 'space-between',
                    }}
                    aria-label="Time 2 Trade home"
                >
                    <Box
                        component={RouterLink}
                        to="/"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            textDecoration: 'none',
                            color: 'inherit',
                            '&:focus-visible': {
                                outline: '2px solid rgba(15,23,42,0.35)',
                                outlineOffset: 4,
                                borderRadius: 1,
                            },
                        }}
                    >
                        <Box
                            component="img"
                            src="/logos/favicon/favicon.ico"
                            alt="Time 2 Trade logo"
                            sx={{
                                display: 'block',
                                height: 32,
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
                            }}
                        >
                            Time 2 Trade
                        </Typography>
                    </Box>

                    {/* Mobile CTA button - shows "Unlock all features" for guests, user avatar for auth users */}
                    {user ? (
                        <UserAvatar
                            user={user}
                            onLogout={() => setShowLogoutModal(true)}
                        />
                    ) : (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<LockIcon sx={{ fontSize: '1rem' }} />}
                            onClick={onOpenAuth}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                py: { xs: 0.75, sm: 1 },
                                px: { xs: 1.5, sm: 2 },
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                borderRadius: 999,
                            }}
                        >
                            Unlock all features
                        </Button>
                    )}
                </Box>

                {hasNavItems ? (
                    <Box
                        sx={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 1400,
                            width: '100%',
                            display: { xs: hideNavOnMobile ? 'none' : 'flex', md: 'flex' },
                            justifyContent: 'center',
                            mb: { xs: 0, md: 2 },
                        }}
                    >
                        <Box
                            sx={{
                                width: '100%',
                                maxWidth: 1560,
                                px: { xs: 2, sm: 2.75, md: 3.5 },
                            }}
                        >
                            <DashboardAppBar
                                items={navItems}
                                ariaLabel="Time 2 Trade navigation"
                                sx={{ mt: { xs: 1, md: 2 } }}
                                onOpenSettings={onOpenSettings}
                                onOpenAuth={onOpenAuth}
                            />
                        </Box>
                    </Box>
                ) : null}

                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: 0,
                        overflow: 'hidden',
                        pt: { xs: 6, sm: 6, md: 0 },
                        // Mobile-first: account for fixed top logo on xs/sm (64px = 32px img + 32px py)
                        // Desktop: no top padding (AppBar mb handles gap)
                        // Constrain height so inner content can scroll without hiding behind nav
                        maxHeight: {
                            xs: 'calc(100vh - var(--t2t-bottom-nav-height, 64px))',
                            sm: 'calc(100vh - var(--t2t-bottom-nav-height, 64px))',
                            md: '100%', // md+ has sticky top AppBar, flex handles layout
                        },
                    }}
                >
                    {/* CENTERING PATTERN (ENTERPRISE): 
                    Main Box uses flex layout with justifyContent:center + alignItems:center for centering.
                    Content Box gets width:100% + maxWidth:1560 + px:responsive to stay constrained and centered.
                    Children fill the content Box using flex: 1.
                    This prevents double flex/width conflicts and works consistently on all breakpoints. */}
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: 1560,
                            px: { xs: 2, sm: 2.75, md: 3.5 },
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                            flex: 1,
                        }}
                    >
                        {children}
                    </Box>
                </Box>
            </Box>
            {/* Logout Modal */}
            {showLogoutModal && (
                <Suspense fallback={null}>
                    <LogoutModal
                        open={showLogoutModal}
                        onClose={() => setShowLogoutModal(false)}
                    />
                </Suspense>
            )}
        </>
    );
};

PublicLayout.propTypes = {
    children: PropTypes.node.isRequired,
    navItems: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            shortLabel: PropTypes.string,
            icon: PropTypes.node.isRequired,
            to: PropTypes.string,
            onClick: PropTypes.func,
            primary: PropTypes.bool,
            disabled: PropTypes.bool,
            badge: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf(['dot'])]),
            ariaLabel: PropTypes.string,
        }),
    ),
    onOpenSettings: PropTypes.func,
    onOpenAuth: PropTypes.func,
    hideNavOnMobile: PropTypes.bool,
};

PublicLayout.defaultProps = {
    navItems: [],
    hideNavOnMobile: false,
};

export default PublicLayout;
