/**
 * src/components/PublicLayout.jsx
 * 
 * Purpose: Shared public-page shell that renders the responsive DashboardAppBar with sticky positioning and shared sizing.
 * Centers the navigation chrome, preserves mobile bottom nav behavior, and keeps the layout banner-free by default.
 * 
 * Changelog:
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

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import DashboardAppBar from './AppBar';

const PublicLayout = ({ children, navItems, onOpenSettings, onOpenAuth }) => {
    const hasNavItems = useMemo(() => Array.isArray(navItems) && navItems.length > 0, [navItems]);

    return (
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
            {hasNavItems ? (
                <Box
                    sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1450,
                        width: '100%',
                        display: 'flex',
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
                    // Mobile-first: account for fixed bottom AppBar on xs/sm
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
};

PublicLayout.defaultProps = {
    navItems: [],
};

export default PublicLayout;
