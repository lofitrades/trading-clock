/**
 * src/components/layouts/TabbedStickyPanel.jsx
 *
 * Purpose: Chrome-like tabbed panel for MainLayout right column.
 * Renders a browser-tab bar visually "above" a Paper container with smooth
 * tab switching, session-level tab persistence per route, and vertical
 * scrolling within the Paper content area.
 *
 * Key Features:
 * - Chrome-inspired tab shapes (rounded top, active tab merges with Paper)
 * - Session-level persistence (Map keyed by pathname — survives SPA nav, resets on full reload)
 * - Vertical overflow scroll inside Paper (not page-level)
 * - Inactive tabs unmounted for performance (no hidden canvas/timers)
 * - Accessible: role=tablist/tab/tabpanel, aria-selected
 * - Responsive: works inline on xs/sm, sticky on md+
 * - BEP THEME-AWARE: All colors use theme tokens (light/dark mode support)
 *
 * Changelog:
 * v1.11.0 - 2026-02-20 - BEP PAGE-SCROLL MODE: Added pageScroll prop (forwarded from MainLayout).
 *                        When pageScroll=true on md+: wrapper uses position:sticky + top:stickyTop
 *                        (no height:100% — grid stretch provides height from left column content).
 *                        Paper uses maxHeight:calc(100vh - stickyTop - 52px) for viewport-relative
 *                        internal scroll instead of calc(100% - 52px). When pageScroll=false (default):
 *                        wrapper fills grid cell height (height:100%), no sticky (already viewport-locked).
 *                        Ensures right column sticks to top during page scroll on BlogPostPage.
 * v1.10.0 - 2026-02-20 - BEP STICKY WRAPPER: Added position:sticky + top:stickyTop to the main
 *                        wrapper Box on md+ (static on xs/sm). TabbedStickyPanel now sticks to
 *                        the top of the viewport while tab bar + content scroll internally via
 *                        Paper's overflowY:auto. Improves sticky positioning reliability by moving
 *                        sticky from Paper to wrapper. Also allows the grid parent to have
 *                        overflow:visible without breaking sticky behavior.
 * v1.9.2 - 2026-02-14 - BEP CONTENT-HEIGHT PANEL: On md+, the Paper no longer flex-grows to fill
 *                        the entire column when content is short. Instead it sizes to content up
 *                        to a maxHeight (column height minus tab bar), and only then scrolls.
 * v1.9.1 - 2026-02-14 - BEP HEIGHT LOCK: Added minHeight:0 on the md+ container so the Paper
 *                        can shrink inside the MainLayout grid cell. Prevents the right column
 *                        from exceeding the left column height while keeping internal scroll.
 * v1.9.0 - 2026-02-14 - BEP NO-PAGE-SCROLL: On md+, replaced position:sticky + maxHeight:calc(100vh-...)
 *                        with height:100% to fill the grid cell set by MainLayout (which matches left column
 *                        height). The Paper keeps overflowY:auto for internal scrolling. On xs/sm, remains
 *                        position:static (stacked layout, natural height). Eliminates page-level vertical
 *                        scroll — only the right column Paper scrolls.
 * v1.8.0 - 2026-02-14 - BEP RESPONSIVE: Reduced Paper padding from p:2 (16px) to p:{xs:1.5, md:2}
 *                        (12px on xs/sm) to give clock canvas + content more horizontal room on mobile.
 * v1.7.0 - 2026-02-14 - BEP SKELETON UX: Added i18n ready check to prevent tab label flash on mount.
 *                        Tab labels now show Skeleton placeholder until translations are loaded.
 *                        Smooth transition from skeleton to actual label when i18n ready flag becomes true.
 * v1.6.0 - 2026-02-13 - BEP TABLET/MOBILE FIX: Increased active tab z-index from 1 → 2 and negative
 *                        margin from -1px → -2px to ensure seamless tab-to-Paper overlap on xs/sm
 *                        (stacked layout). Fixes visible bottom border on mobile/tablet viewports
 *                        where Paper was not properly hidden behind active tab.
 * v1.5.0 - 2026-02-12 - BEP PERFORMANCE: Replaced animated LoadingAnimation with static Skeleton
 *                        circle in Suspense fallback. REVERTED — user prefers LoadingAnimation.
 *                        LoadingAnimation (120px donut) restored as tab Suspense fallback.
 * v1.4.0 - 2026-02-12 - BUGFIX: Replaced CircularProgress with LoadingAnimation for consistent
 *                        loading UX across Insights tab. Uses LoadingAnimation (120px donut spinner)
 *                        instead of MUI's small CircularProgress. Prevents loader style conflicts
 *                        when Calendar2Page wraps InsightsPanel in its own Suspense boundary.
 * v1.3.0 - 2026-02-11 - BEP ACCESSIBILITY: Increased font weight for better contrast on dark theme.
 *   Active tabs: fontWeight 600 → 700 (bold). Inactive tabs: 400 → 600 (semi-bold).
 *   Improves readability on dark backgrounds and meets WCAG AA contrast requirements.
 *   Better visual hierarchy with consistent text weight across active/inactive states.
 * v1.2.0 - 2026-02-11 - BEP SPACING: Increased tab height from py:0.875 (7px) to py:1.25 (10px)
 *   for better visual prominence and accessibility. Matches MUI spacing scale (8px units).
 *   Improved touch target size (44px minimum for mobile). Updated to use MUI standard padding.
 * v1.1.0 - 2026-02-11 - BEP THEME-AWARE: All colors now theme-aware using palette tokens.
 *   Active tab: background.paper (white/dark surface), text.primary (high contrast).
 *   Inactive tabs: action.hover (light gray/dark surface), text.secondary (medium contrast).
 *   Hover state: action.selected adapts to light/dark. Icon color: primary.main when active,
 *   text.disabled when inactive. Border: divider color (light: rgba(0,0,0,0.12), dark: rgba(255,255,255,0.12)).
 *   Ensures consistent appearance across all themes without hardcoded colors.
 * v1.0.0 - 2026-02-09 - Initial implementation (BEP Chrome-tab UI)
 */

import { memo, useState, useCallback, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { Box, Paper, ButtonBase, Typography, Skeleton } from '@mui/material';
import LoadingAnimation from '../LoadingAnimation';

// ─── Session-level tab persistence ─────────────────────────────────────────
// Survives SPA navigation (route changes), resets on full page reload.
// Keyed by pathname so each route remembers its own last-selected tab.
const tabMemory = new Map();

/**
 * TabbedStickyPanel
 *
 * @param {Object} props
 * @param {Array<{ key?: string, label: string, icon?: React.ReactNode, content: React.ReactNode }>} props.tabs
 * @param {number} [props.stickyTop=16] - Distance from viewport top for sticky positioning (md+)
 * @param {boolean} [props.pageScroll=false] - When true, uses position:sticky for page-scroll mode
 */
const TabbedStickyPanel = memo(({ tabs, stickyTop = 16, pageScroll = false }) => {
    const { pathname } = useLocation();
    const { ready } = useTranslation(undefined, { useSuspense: false });

    // Restore persisted tab or default to 0
    const [activeIndex, setActiveIndex] = useState(() => {
        const persisted = tabMemory.get(pathname);
        return (persisted != null && persisted < tabs.length) ? persisted : 0;
    });

    const handleTabChange = useCallback((index) => {
        setActiveIndex(index);
        tabMemory.set(pathname, index);
    }, [pathname]);

    // Clamp to valid range if tabs array changes between renders
    const safeIndex = activeIndex < tabs.length ? activeIndex : 0;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                /* BEP: Two modes on md+:
                   - Default (pageScroll=false): height:100% fills grid cell (viewport-locked).
                     No sticky needed — both columns are already constrained.
                   - pageScroll=true: position:sticky sticks to top. No explicit height —
                     grid stretch provides the wrapper height from left column content.
                     Tab bar + Paper stay at top while page scrolls. */
                ...(pageScroll
                    ? {
                        position: { xs: 'static', md: 'sticky' },
                        top: { xs: 'auto', md: stickyTop },
                    }
                    : {
                        height: { md: '100%' },
                    }
                ),
            }}
        >
            {/* ─── Chrome-like Tab Bar ─────────────────────────────── */}
            <Box
                role="tablist"
                sx={{
                    display: 'flex',
                    gap: 0,
                    /* Inset tabs from left edge for breathing room */
                    pl: 2,
                    /* Prevent tab bar from shrinking when Paper needs space */
                    flexShrink: 0,
                }}
            >
                {tabs.map((tab, index) => {
                    const isActive = index === safeIndex;
                    return (
                        <ButtonBase
                            key={tab.key || index}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={`tabpanel-${tab.key || index}`}
                            id={`tab-${tab.key || index}`}
                            onClick={() => handleTabChange(index)}
                            sx={{
                                px: 2,
                                py: 1.25,
                                borderRadius: '10px 10px 0 0',
                                /* BEP: Active = paper (white/dark), Inactive = hover bg (light/dark) */
                                backgroundColor: isActive
                                    ? 'background.paper'
                                    : 'action.hover',
                                border: '1px solid',
                                /* BEP: divider color adapts to light/dark (rgba 0,0,0 vs 255,255,255) */
                                borderColor: 'divider',
                                /* Active tab: no bottom border → merges visually with Paper */
                                borderBottom: isActive ? 'none' : undefined,
                                /* Pull active tab down 2px to overlap Paper's top border on all screens */
                                mb: isActive ? '-2px' : 0,
                                /* BEP: Active tab higher z-index to cover Paper border on xs/sm/md */
                                zIndex: isActive ? 2 : 0,
                                position: 'relative',
                                /* BEP ACCESSIBILITY: Bold fonts for contrast (active: 700, inactive: 600) */
                                fontWeight: isActive ? 700 : 600,
                                fontSize: '0.8125rem',
                                color: isActive ? 'text.primary' : 'text.secondary',
                                transition: 'background-color 0.2s ease, color 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                '&:hover': {
                                    backgroundColor: isActive
                                        ? 'background.paper'
                                        : 'action.selected',
                                },
                            }}
                        >
                            {tab.icon && (
                                <Box
                                    component="span"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: 16,
                                        /* BEP: Icon color adapts — primary when active, disabled when inactive */
                                        color: isActive ? 'primary.main' : 'text.disabled',
                                    }}
                                >
                                    {tab.icon}
                                </Box>
                            )}
                            <Typography
                                variant="caption"
                                component="span"
                                sx={{
                                    fontWeight: 'inherit',
                                    fontSize: 'inherit',
                                    lineHeight: 1,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {ready ? (
                                    tab.label
                                ) : (
                                    <Skeleton variant="text" width={60} sx={{ display: 'inline-block' }} />
                                )}
                            </Typography>
                        </ButtonBase>
                    );
                })}
            </Box>

            {/* ─── Paper Content Area ─────────────────────────────── */}
            <Paper
                variant="outlined"
                role="tabpanel"
                id={`tabpanel-${tabs[safeIndex]?.key || safeIndex}`}
                aria-labelledby={`tab-${tabs[safeIndex]?.key || safeIndex}`}
                sx={{
                    p: { xs: 1.5, md: 2 },
                    /* BEP: Keep all rounded corners on Paper for consistent appearance.
                       Tabs sit inset (pl: 2), so they don't connect to top-left corner visually. */
                    borderRadius: 3,
                    /* BEP: divider color adapts to light/dark mode */
                    borderColor: 'divider',
                    boxShadow: 'none',
                    /* BEP: Two maxHeight strategies:
                       - Default: calc(100% - 52px) — relative to grid cell height (viewport-locked).
                       - pageScroll: calc(100vh - stickyTop - 52px) — viewport-relative, so Paper
                         scrolls internally while sticky at top during page scroll.
                       52px = conservative tab-bar height. */
                    flexGrow: 0,
                    maxHeight: { md: pageScroll
                        ? `calc(100vh - ${stickyTop}px - 52px)`
                        : 'calc(100% - 52px)'
                    },
                    overflowY: 'auto',
                }}
            >
                <Suspense
                    fallback={
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: 200 }}>
                            <LoadingAnimation clockSize={120} isLoading />
                        </Box>
                    }
                >
                    {tabs[safeIndex]?.content}
                </Suspense>
            </Paper>
        </Box>
    );
});

TabbedStickyPanel.displayName = 'TabbedStickyPanel';

TabbedStickyPanel.propTypes = {
    /** Array of tab definitions. Each tab has a label, optional icon, and content node. */
    tabs: PropTypes.arrayOf(
        PropTypes.shape({
            /** Stable key for React reconciliation + ARIA IDs (falls back to index) */
            key: PropTypes.string,
            /** Visible tab label (use t() for i18n) */
            label: PropTypes.string.isRequired,
            /** Optional leading icon node (e.g. <AccessTimeIcon sx={{ fontSize: 16 }} />) */
            icon: PropTypes.node,
            /** Tab panel content (lazy-loadable — wrapped in Suspense internally) */
            content: PropTypes.node.isRequired,
        })
    ).isRequired,
    /** Distance from viewport top for sticky positioning on md+ (default: 16) */
    stickyTop: PropTypes.number,
    /** When true, enables position:sticky for page-scroll mode (default: false) */
    pageScroll: PropTypes.bool,
};

export default TabbedStickyPanel;
