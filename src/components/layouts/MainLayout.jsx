/**
 * src/components/layouts/MainLayout.jsx
 *
 * Purpose: Reusable two-column layout for admin and main pages.
 * Left column (scrollable) + Right column (sticky sidebar).
 * Responsive: 2-column on md+ (2fr 1fr), 1-column on xs/sm.
 * BEP: Theme-aware, responsive, flexible content slots, independent scrolling.
 * Supports Chrome-like tabbed right column via rightTabs prop (backward compat with right).
 *
 * Two scroll modes (md+):
 * - Default (pageScroll=false): Both columns viewport-locked, internal scroll only.
 *   Grid fills available height via flex:1 + minmax(0,1fr). Used by Calendar2Page, ClockPage.
 * - pageScroll=true: Left column grows naturally, causes page-level scroll.
 *   Right column is position:sticky, stays at top while page scrolls.
 *   Matches AdminBlogEditorPage pattern. Used by BlogPostPage.
 *
 * Changelog:
 * v2.5.0 - 2026-02-20 - BEP PAGE-SCROLL MODE: Added pageScroll prop for pages with long-form
 *                       left column content (e.g. BlogPostPage). When pageScroll=true on md+:
 *                       (1) Grid uses default auto rows instead of minmax(0,1fr) — row height
 *                       grows with left column content, enabling page-level scroll.
 *                       (2) Grid drops flex:1 — no longer constrained to viewport height.
 *                       (3) Left column Paper has natural height (no overflow:hidden, no height:100%).
 *                       (4) Right column wrapper stretches via grid default stretch (no explicit
 *                       height:100%) — gives sticky inner content room to travel.
 *                       (5) TabbedStickyPanel/Paper use position:sticky + maxHeight:calc(100vh-top)
 *                       for viewport-relative internal scroll.
 *                       Matches AdminBlogEditorPage sticky sidebar pattern exactly.
 *                       Default (pageScroll=false) is unchanged — Calendar2Page/ClockPage unaffected.
 * v2.4.0 - 2026-02-20 - BEP STICKY RIGHT COLUMN: (1) Removed overflow:hidden from right column
 *                       wrapper on md+ to allow position:sticky to work properly — sticky needs
 *                       a scrollable ancestor to position relative to. (2) Added overflow:auto +
 *                       maxHeight:calc(100vh - stickyTop) to right column Paper (plain mode) so
 *                       it scrolls internally when content exceeds viewport. (3) Right column now
 *                       sticks to top (position:sticky, top:stickyTop) while only left column
 *                       Paper scrolls. Improves UX for long blog posts and sidebars.
 * v2.3.2 - 2026-02-14 - BEP MD+ BOTTOM GAP: Removed grid-level pb and moved md+ bottom breathing
 *                       room to the right column wrapper via pb. This keeps the md+ right Paper
 *                       off the viewport bottom without affecting overall grid sizing.
 * v2.3.1 - 2026-02-14 - BEP BOTTOM BREATHING (MD+): Moved md+ bottom spacing from per-column mb
 *                       (which conflicts with height-locked grid cells) to a grid-level pb. Keeps
 *                       both columns visually off the viewport bottom while preserving the md+
 *                       contract: left column is non-scrollable, right column scrolls internally.
 * v2.3.0 - 2026-02-14 - BEP NO-PAGE-SCROLL: On md+, right column wrapper now has overflow:hidden +
 *                       height:100% so it fills exactly the grid row height (matching left column).
 *                       The TabbedStickyPanel (or plain Paper) scrolls internally within this
 *                       constrained cell — no page-level vertical scroll from the grid. On xs/sm,
 *                       behavior unchanged (natural content height, columns stacked).
 * v2.2.0 - 2026-02-14 - BEP CLOCK PARITY: Reduced left column Paper padding from p:2 to
 *                       p:{xs:1.5, md:2} to match TabbedStickyPanel padding on xs/sm. Ensures
 *                       clock canvas in /clock left column gets same available width as /calendar
 *                       right column. 12px vs 16px = 8px more horizontal room for clock on mobile.
 * v2.1.2 - 2026-02-14 - BEP MOBILE FLEX FIX: Changed flex:1 to flex:{xs:'none',md:1}. On xs/sm
 *                       the grid stacks columns vertically and should use natural content height
 *                       so the PublicLayout scroll container's pb is visible below the last Paper.
 *                       With flex:1 on all breakpoints, the grid stretched to fill the container,
 *                       absorbing all bottom padding and leaving the right column Paper flush
 *                       against the viewport edge.
 * v2.1.1 - 2026-02-14 - BEP BOTTOM BREATHING: Added mb (xs:1, sm:1.5) to right column wrapper so
 *                       the last Paper on mobile has visual breathing room from the viewport bottom.
 *                       Works in tandem with PublicLayout scroll container pb for consistent spacing.
 * v2.1.0 - 2026-02-14 - BEP FULL VIEWPORT: Removed mobile bottom spacing (mb/pb on xs/sm) from
 *                       both left and right column wrappers. Bottom AppBar auto-hides on scroll
 *                       (AppBar v1.5.11+), so content extends to viewport bottom. The nav overlays
 *                       on top (position:fixed) and slides away — no reserved gap needed.
 * v2.0.0 - 2026-02-09 - BEP TABBED PANEL: Added rightTabs prop for Chrome-like tabbed right column.
 *                       When rightTabs (array of {key,label,icon,content}) is provided, renders
 *                       TabbedStickyPanel instead of plain Paper. Backward compat: right prop still
 *                       works as before. Tabs persist per-route during session. Vertical scrolling
 *                       within Paper. Lazy TabbedStickyPanel import for pages that don't use tabs.
 * v1.8.0 - 2026-02-09 - BEP STICKY FIX: Removed overflow:hidden from md+ on right column wrapper.
 *                       The overflow was creating a stacking context that prevented position:sticky
 *                       on the Paper from working with parent grid scroll. Now matches AdminBlogEditorPage
 *                       pattern: wrapper has no overflow constraint, Paper is sticky with grid as scroll container.
 * v1.7.0 - 2026-02-07 - BEP BOTTOM SPACING FIX: Moved mb from Paper (inside grid item) to left
 *                       Box wrapper (grid item itself). When Paper has height:100% on md+, its
 *                       internal margin-bottom can't display. Moving margin to the grid item wrapper
 *                       ensures spacing appears at grid level. xs/sm: mb:1.5 creates gap before
 *                       fixed bottom nav. md+: mb:0 (grid gap handles spacing). Prevents Paper from
 *                       touching viewport bottom.
 * v1.6.0 - 2026-02-07 - BEP OVERFLOW FIX: Root-caused page-level vertical scroll on md+ to CSS Grid
 *                       implicit row sizing. Default grid-auto-rows:auto resolves to minmax(min-content,
 *                       max-content); the min-content floor of both columns prevented the row from
 *                       shrinking below natural content height, overflowing into PublicLayout's centering
 *                       Box (overflowY:auto). Fix: (1) gridAutoRows: minmax(0,1fr) on md+ allows the row
 *                       to match the grid's flex-constrained height. (2) overflow:hidden + minHeight:0 on
 *                       both grid item wrappers prevents content from pushing the row. (3) Left Paper keeps
 *                       height:100% + overflow:hidden for internal table scroll. Mobile (xs/sm) unchanged.
 * v1.4.0 - 2026-02-07 - BEP STICKY SCROLL: Removed alignItems:'start' — grid default 'stretch' is required so the right column wrapper fills the full row height, giving position:sticky on the inner Paper room to travel during scroll. Matches AdminBlogEditorPage pattern exactly: sticky sidebar sticks to top, scrolls when sidebar content overflows, then sticks again.
 * v1.3.0 - 2026-02-07 - BEP ALIGNMENT: Changed alignContent:start → alignItems:start on grid. alignItems controls per-item alignment in grid cells; alignContent controls track-level alignment. Now both columns align to top at same vertical position like AdminBlogEditorPage (2-column header layout). Maintains sticky behavior on right column.
 * v1.2.0 - 2026-02-07 - BEP STICKY FIX: Removed alignSelf:'flex-start' from right column wrapper. Grid cell must stretch to full row height so inner Paper's position:sticky has scrollable room — matches AdminBlogEditorPage pattern. Without this fix, the wrapper collapsed to content height and sticky had no room to scroll.
 * v1.1.1 - 2026-02-06 - BEP MOBILE GAP: Added responsive pb to right column (xs:1.5, sm:1.5, md:0) to create gap between bottom of right paper and fixed bottom AppBar on xs/sm. Prevents visual overlap and ensures content is fully accessible above fixed nav.
 * v1.1.0 - 2026-02-06 - BEP RESPONSIVE: Added responsive py (xs:1.5, sm:2, md:0) for breathing room between MobileHeader/bottom AppBar on mobile. Added flex:1 + minHeight:0 to fill available viewport space. Added alignContent:start to anchor grid content to top. Fully viewport-aware on all breakpoints.
 * v1.0.0 - 2026-02-06 - Initial implementation (extracted from AdminBlogEditorPage layout pattern)
 */

import { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { Box, Paper } from '@mui/material';

// BEP: Lazy-load TabbedStickyPanel — only pages using rightTabs pay the import cost
const TabbedStickyPanel = lazy(() => import('./TabbedStickyPanel'));

/**
 * MainLayout Component
 *
 * Two-column responsive grid with white Paper containers:
 * - Left: Main scrollable content (2fr width on desktop)
 * - Right: Sticky sidebar (1fr width on desktop, shown below on mobile)
 *
 * Right column supports two modes:
 * - `right` prop: Plain Paper with content (backward compat)
 * - `rightTabs` prop: Chrome-like tabbed panel with tab persistence
 *
 * @param {Object} props
 * @param {React.ReactNode} props.left - Left column content (required)
 * @param {React.ReactNode} props.right - Right column content (optional, plain Paper)
 * @param {Array<{key?,label,icon?,content}>} props.rightTabs - Tabbed right column (optional)
 * @param {boolean} props.pageScroll - When true, left column grows naturally (page scrolls),
 *   right column is position:sticky. When false (default), both columns are viewport-locked
 *   with internal scroll only.
 * @param {number} props.gap - Gap between columns (default: 3)
 * @param {number} props.stickyTop - Distance from top for sticky positioning (default: 16)
 * @param {Object} props.sx - Additional MUI sx props for wrapper
 */
const MainLayout = ({
    left,
    right,
    rightTabs,
    pageScroll = false,
    gap = 3,
    stickyTop = 16,
    sx = {},
}) => {
    // Determine if right column should render (either mode)
    const hasRightColumn = right || (rightTabs && rightTabs.length > 0);
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                /* BEP: Two modes on md+:
                   - Default: minmax(0,1fr) locks row to grid's flex-constrained height (viewport).
                   - pageScroll: default auto rows — row grows with left column content. */
                ...(!pageScroll && { gridAutoRows: { md: 'minmax(0, 1fr)' } }),
                gap,
                px: { xs: 2, sm: 2.75, md: 3.5 },
                py: { xs: 1.5, sm: 2, md: 0 },
                /* BEP: flex:1 only in default mode where grid must fill viewport.
                   In pageScroll mode, grid grows naturally with content. */
                flex: pageScroll ? 'none' : { xs: 'none', md: 1 },
                minHeight: 0,
                /* BEP: No alignItems — grid default is 'stretch', so right column wrapper
                   fills the full row height. This gives position:sticky on the inner Paper
                   room to travel as user scrolls (same pattern as AdminBlogEditorPage). */
                ...sx,
            }}
        >
            {/* Left Column - Main scrollable content */}
            {/* BEP: In default mode, overflow:hidden constrains content to viewport height.
                In pageScroll mode, no overflow constraint — content grows naturally. */}
            <Box sx={{
                mb: { xs: 0, md: 0 },
                minHeight: { md: 0 },
                ...(!pageScroll && { overflow: { md: 'hidden' } }),
            }}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: { xs: 1.5, md: 2 },
                        borderRadius: 3,
                        borderColor: 'divider',
                        boxShadow: 'none',
                        /* BEP: In default mode, Paper is viewport-constrained with internal scroll.
                           In pageScroll mode, Paper has natural height — page scrolls instead. */
                        ...(!pageScroll && {
                            display: { md: 'flex' },
                            flexDirection: { md: 'column' },
                            height: { md: '100%' },
                            overflow: { md: 'hidden' },
                        }),
                    }}
                >
                    {left}
                </Paper>
            </Box>

            {/* Right Column - Sticky sidebar (shown below on mobile, sticky on desktop) */}
            {/* BEP: Grid default 'stretch' makes wrapper fill full row height.
                In pageScroll mode, row height is driven by left column content,
                so wrapper is tall and sticky inner content has room to travel. */}
            {hasRightColumn && (
                <Box
                    sx={{
                        mb: { xs: 1, sm: 1.5, md: 0 },
                        ...(!pageScroll && { pb: { md: 2 } }),
                        minHeight: { md: 0 },
                        /* BEP: In default mode, overflow:hidden constrains to grid cell.
                           In pageScroll mode, overflow:visible allows sticky to work. */
                        overflow: { md: pageScroll ? 'visible' : 'hidden' },
                        /* BEP: In default mode, explicit height:100% fills grid cell.
                           In pageScroll mode, grid stretch handles height — no explicit value. */
                        ...(!pageScroll && { height: { md: '100%' } }),
                    }}
                >
                    {rightTabs && rightTabs.length > 0 ? (
                        /* BEP: Chrome-tabbed mode — TabbedStickyPanel owns its own
                           sticky positioning and Paper, so no wrapper Paper needed. */
                        <Suspense fallback={null}>
                            <TabbedStickyPanel
                                tabs={rightTabs}
                                stickyTop={stickyTop}
                                pageScroll={pageScroll}
                            />
                        </Suspense>
                    ) : (
                        /* BEP: Plain mode (backward compat) — single Paper with content */
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                position: { xs: 'static', md: 'sticky' },
                                top: { xs: 'auto', md: stickyTop },
                                borderRadius: 3,
                                borderColor: 'divider',
                                boxShadow: 'none',
                                /* BEP: maxHeight + overflow:auto for internal scroll when
                                   content exceeds viewport. */
                                maxHeight: { md: `calc(100vh - ${stickyTop}px)` },
                                overflow: { md: 'auto' },
                            }}
                        >
                            {right}
                        </Paper>
                    )}
                </Box>
            )}
        </Box>
    );
};

MainLayout.propTypes = {
    left: PropTypes.node.isRequired,
    /** Plain right column content (renders in a single Paper). Use this OR rightTabs, not both. */
    right: PropTypes.node,
    /** Chrome-tabbed right column. Array of { key?, label, icon?, content } objects. */
    rightTabs: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string,
            label: PropTypes.string.isRequired,
            icon: PropTypes.node,
            content: PropTypes.node.isRequired,
        })
    ),
    /** When true, left column grows naturally (page scrolls), right column is sticky.
     *  When false (default), both columns are viewport-locked with internal scroll. */
    pageScroll: PropTypes.bool,
    gap: PropTypes.number,
    stickyTop: PropTypes.number,
    sx: PropTypes.object,
};

export default MainLayout;
