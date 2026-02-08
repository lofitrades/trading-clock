/**
 * src/components/layouts/MainLayout.jsx
 * 
 * Purpose: Reusable two-column layout for admin and main pages.
 * Left column (scrollable) + Right column (sticky sidebar).
 * Responsive: 2-column on md+ (2fr 1fr), 1-column on xs/sm.
 * BEP: Theme-aware, responsive, flexible content slots, independent scrolling.
 * 
 * Changelog:
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

import PropTypes from 'prop-types';
import { Box, Paper } from '@mui/material';

/**
 * MainLayout Component
 * 
 * Two-column responsive grid with white Paper containers:
 * - Left: Main scrollable content (2fr width on desktop)
 * - Right: Sticky sidebar (1fr width on desktop, hidden on mobile)
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.left - Left column content (required)
 * @param {React.ReactNode} props.right - Right column content (optional)
 * @param {number} props.gap - Gap between columns (default: 3)
 * @param {number} props.stickyTop - Distance from top for sticky positioning (default: 16)
 * @param {Object} props.sx - Additional MUI sx props for wrapper
 */
const MainLayout = ({
    left,
    right,
    gap = 3,
    stickyTop = 16,
    sx = {},
}) => {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                /* BEP: minmax(0,1fr) on md+ overrides the default auto (minmax(min-content,max-content))
                   so the single row can shrink to the grid's flex-constrained height instead of being
                   floored at min-content. On xs/sm the grid stacks 1-col so auto rows are correct. */
                gridAutoRows: { md: 'minmax(0, 1fr)' },
                gap,
                px: { xs: 2, sm: 2.75, md: 3.5 },
                py: { xs: 1.5, sm: 2, md: 0 },
                flex: 1,
                minHeight: 0,
                /* BEP: No alignItems — grid default is 'stretch', so right column wrapper
                   fills the full row height. This gives position:sticky on the inner Paper
                   room to travel as user scrolls (same pattern as AdminBlogEditorPage). */
                ...sx,
            }}
        >
            {/* Left Column - Main scrollable content */}
            <Box sx={{ mb: { xs: 1.5, md: 2 }, minHeight: { md: 0 }, overflow: { md: 'hidden' } }}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 2,
                        borderRadius: 3,
                        borderColor: 'divider',
                        boxShadow: 'none',
                        /* BEP: On md+ the Paper is viewport-constrained so only
                           internal content (e.g. a table) scrolls — the page itself
                           never gets a vertical scrollbar from this column. Uses 100%
                           to respect parent MainLayout's flex: 1 constraint. */
                        display: { md: 'flex' },
                        flexDirection: { md: 'column' },
                        height: { md: '100%' },
                        overflow: { md: 'hidden' },
                    }}
                >
                    {left}
                </Paper>
            </Box>

            {/* Right Column - Sticky sidebar (shown below on mobile, sticky on desktop) */}
            {/* BEP: No alignSelf on the wrapper — grid cell must stretch to full row height
                so the inner Paper's position:sticky has scrollable room (same as AdminBlogEditorPage). */}
            {right && (
                <Box sx={{ pb: { xs: 1.5, sm: 1.5, md: 0 }, minHeight: { md: 0 }, overflow: { md: 'hidden' } }}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            position: { xs: 'static', md: 'sticky' },
                            top: { xs: 'auto', md: stickyTop },
                            borderRadius: 3,
                            borderColor: 'divider',
                            boxShadow: 'none',
                        }}
                    >
                        {right}
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

MainLayout.propTypes = {
    left: PropTypes.node.isRequired,
    right: PropTypes.node,
    gap: PropTypes.number,
    stickyTop: PropTypes.number,
    sx: PropTypes.object,
};

export default MainLayout;
