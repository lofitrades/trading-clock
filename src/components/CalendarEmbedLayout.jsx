/**
 * src/components/CalendarEmbedLayout.jsx
 * 
 * Purpose: Layout-only wrapper for the calendar workspace that manages two-column
 * dashboard structure, independent column scrolling, sticky left rail, and a
 * floating jump-to-next/now control.
 * 
 * Changelog:
 * v1.0.28 - 2026-01-15 - TOP SPACING ALIGNMENT: Removed extra top padding so the Economic Calendar paper aligns with PublicLayout spacing like /about.
 * v1.0.27 - 2026-01-15 - HEIGHT & SCROLL FIX (ENTERPRISE AUDIT): Fixed right column height exceeding left column and missing vertical scroll. (1) Added height:'100%' to grid container to fill parent flex. (2) Added maxHeight:'100%' and overflow:'hidden' to both columns to constrain content. (3) Ensured right column has overflowY:'auto' for proper vertical scrolling. (4) Grid now uses alignItems:'stretch' instead of 'start' so columns share same height. Follows enterprise pattern: grid fills available space, columns scroll independently within their bounds.
 * v1.0.26 - 2026-01-15 - GRID LAYOUT FIX (ENTERPRISE AUDIT): Simplified two-column grid to use flexible fr units instead of strict minmax with large pixel minimums that caused overflow. Changed from minmax(360px, 520px) minmax(480px, 1fr) to 1fr 2fr on md and 1fr 2.5fr on lg. This ensures columns scale properly within PublicLayout constraints (maxWidth:1560, px:responsive) without forcing content wider than viewport. Mobile-first responsive: xs uses single column (1fr), md/lg use proportional two-column splits. Follows enterprise MUI dashboard pattern: grid columns should be flexible within their container, not force container to expand.
 * v1.0.25 - 2026-01-15 - WIDTH CONSTRAINT FIX (ENTERPRISE AUDIT): Removed DASHBOARD_APP_BAR_CONTAINER_SX from AppBar wrapper and removed unused import (eliminates double-layering of width constraints when appBar prop is used). Removed overflowX:'hidden' from content container (was hiding overflow instead of preventing it). AppBar wrapper now only handles sticky positioning and margin-bottom, not width constraints. Content container now properly constrains children without hiding overflow. Follows enterprise single-layer width constraint pattern: PublicLayout provides authoritative centering (maxWidth:1560, mx:auto, px:responsive), all children use width:100% only.
 * v1.0.24 - 2026-01-15 - WIDTH CONSTRAINT FIX (REVERTED): Removed maxWidth/mx/px from CONTENT_CONTAINER_SX and topBanner wrapper. CalendarEmbedLayout is a child of PublicLayout which already provides outer centering (maxWidth: 1560, mx: auto, px: responsive). Double-layering constraints caused width overflow. Now follows AboutPage pattern: child uses only width:100%, parent (PublicLayout) handles centering. Enterprise best practice: single responsibility for width constraints at layout level.
 * v1.0.23 - 2026-01-15 - WIDTH CONSTRAINT FIX: Applied DASHBOARD_APP_BAR_CONTAINER_SX width constraints (maxWidth: 1560, mx: auto, px: responsive) to CONTENT_CONTAINER_SX and topBanner wrapper. This ensures Calendar and Clock papers stay within proper viewport bounds and center correctly on all breakpoints. Prevents right edge overflow and ensures enterprise-grade responsive centering across xs/sm/md/lg/xl.
 * v1.0.22 - 2026-01-14 - VIEWPORT HEIGHT FILL FIX: Changed from height:auto to flex:1 to properly fill available viewport height constrained by PublicLayout (calc(100vh - 64px) on xs/sm for bottom nav, 100% on md+). Ensures Economic Calendar Paper sizes correctly within available space on all breakpoints.
 * v1.0.21 - 2026-01-14 - LAYOUT CONSTRAINT FIXES: Simplified pb formula from calc(10*8px+48px)→10 units on xs/sm as bottom nav is already handled by PublicLayout maxHeight constraint. Removed height:100dvh and minHeight:100dvh constraints that conflicted with parent maxHeight, now using minHeight:0 and height:auto for proper flex-child behavior. Fixes height conflicts and excessive padding identified in mobile layout audit.
 * v1.0.20 - 2026-01-14 - NOW JUMP BUTTON: Added showJumpToNow/onJumpToNow/jumpToNowDirection props for "Jump to Now" floating button (blue, info color) with priority over NEXT button (green, success color). NOW events take precedence when visible. Mobile-first responsive design.
 * v1.0.19 - 2026-01-13 - Changed root backgroundColor to 'inherit' for session-based background propagation; allows App.jsx effectiveBackground to apply globally.
 * v1.0.18 - 2026-01-13 - BUGFIX: Add margin-bottom on xs/sm to account for fixed bottom AppBar; prevents content from hiding behind fixed navigation on mobile.
 * v1.0.18 - 2026-01-14 - MOBILE LOGO SCROLL FIX: Increased pb (padding-bottom) on xs/sm from 10 units (80px) to account for PublicLayout mobile logo row height (32px logo + 16px padding-bottom = 48px additional). New formula: calc(10 * 8px + 48px) for xs/sm ensures calendar content can scroll all the way to bottom without being hidden by reserved space for bottom nav. On md+, pb returns to 12 units. Fully responsive mobile-first approach.
 * v1.0.17 - 2026-01-13 - Aligned main content width with canonical AppBar container (1560 max) for consistent chrome/content sizing across /calendar, /app, and /about.
 * v1.0.16 - 2026-01-13 - Switched root background to the main app background color for visual consistency with public shell.
 * v1.0.15 - 2026-01-13 - Aligned xl maxWidth with DashboardAppBar container (1560px) via shared constant for two-column layout parity.
 * v1.0.14 - 2026-01-12 - Implemented mobile-first responsive centering: replaced width:100% + maxWidth:100% with responsive maxWidth (360/540/full) for xs/sm/md+ to ensure proper horizontal centering of chrome and content on mobile breakpoints.
 * v1.0.13 - 2026-01-12 - Applied maxWidth constraint and flexbox centering to chrome wrapper for xs/sm horizontal centering and consistent AppBar height across pages.
 * v1.0.12 - 2026-01-12 - Standardized AppBar container sizing/z-index so chrome matches /calendar, /app, and /about.
 * v1.0.11 - 2026-01-12 - Add sticky dashboard AppBar slot below the top banner; offset floating Jump to Next + layout padding for mobile bottom navigation.
 * v1.0.10 - 2026-01-11 - Remove extra bottom padding in locked-viewport two-column mode to prevent unnecessary left-rail scrolling.
 * v1.0.9 - 2026-01-11 - Replace back-to-top control with Jump to Next event control and expose scroll root marker for visibility detection.
 * v1.0.8 - 2026-01-08 - Use an even 50/50 split on md while preserving the original lg+ sticky/narrow left rail and wide right rail.
 * v1.0.7 - 2026-01-07 - Expand xl max width and guarantee a wider right rail to keep the events table fully visible after left rail growth.
 * v1.0.6 - 2026-01-07 - Widened left rail column and hid horizontal overflow to prevent sideways scrolling when two-column layout is active.
 * v1.0.5 - 2026-01-07 - Added responsive bottom margin under sticky topBanner to separate it from column papers on all breakpoints.
 * v1.0.4 - 2026-01-07 - Removed top padding and made topBanner sticky at y=0 with z-index to eliminate any gap and keep it always visible.
 * v1.0.3 - 2026-01-07 - Allow topBanner to span full width (no maxWidth/padding) for full-bleed, non-scrollable header sections.
 * v1.0.2 - 2026-01-07 - Added topBanner prop to render non-scrollable banner above columns, following MUI dashboard best practices for always-visible header content.
 * v1.0.1 - 2026-01-07 - Locked viewport to 100dvh with column-only scrolling (mobile-first) and applied minimal scrollbars to scrollable rails.
 * v1.0.0 - 2026-01-07 - Initial extraction of calendar layout shell with sticky
 * left rail, per-column scroll containers, and shared back-to-top control.
 */

import PropTypes from 'prop-types';
import { Box, IconButton, Tooltip } from '@mui/material';
import KeyboardDoubleArrowDownRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowDownRounded';
import KeyboardDoubleArrowUpRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowUpRounded';

const TOP_OFFSET_LG = 16;
const CONTENT_CONTAINER_SX = {
    width: '100%',
    // Width constraints (maxWidth: 1560, mx: auto, px) are handled by PublicLayout parent
    // This container fills its parent width and lets PublicLayout manage viewport centering
};

const minimalScrollbar = {
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(60,77,99,0.32) transparent',
    '&::-webkit-scrollbar': {
        width: 6,
    },
    '&::-webkit-scrollbar-track': {
        background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(60,77,99,0.32)',
        borderRadius: 999,
    },
    '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: 'rgba(60,77,99,0.45)',
    },
};

const CalendarEmbedLayout = ({
    isTwoColumn,
    leftContent,
    rightContent,
    leftScrollRef,
    rightScrollRef,
    showJumpToNext,
    onJumpToNext,
    jumpToNextDirection,
    showJumpToNow,
    onJumpToNow,
    jumpToNowDirection,
    topBanner,
    appBar,
}) => {
    const JumpNextIcon = jumpToNextDirection === 'up'
        ? KeyboardDoubleArrowUpRoundedIcon
        : KeyboardDoubleArrowDownRoundedIcon;

    const JumpNowIcon = jumpToNowDirection === 'up'
        ? KeyboardDoubleArrowUpRoundedIcon
        : KeyboardDoubleArrowDownRoundedIcon;

    return (
        <Box
            sx={{
                backgroundColor: 'inherit',
                color: 'inherit',
                pt: 0,
                // Standard bottom padding for scrollable content.
                // Bottom nav constraint handled by PublicLayout maxHeight (calc(100vh - 64px)).
                pb: 2,
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {(topBanner || appBar) && (
                <Box
                    sx={{
                        width: '100%',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1400,
                        flexShrink: 0,
                        bgcolor: 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    {topBanner && (
                        <Box sx={{ width: '100%', mb: { xs: 1, md: 0 } }}>
                            {topBanner}
                        </Box>
                    )}
                    {appBar && (
                        <Box
                            sx={{
                                width: '100%',
                                mb: { xs: 0, md: 2 },
                            }}
                        >
                            {appBar}
                        </Box>
                    )}
                </Box>
            )}

            <Box
                sx={{
                    ...CONTENT_CONTAINER_SX,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 1.5, md: 2.25 },
                    flex: 1,
                    minHeight: 0,
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: isTwoColumn
                            ? {
                                xs: '1fr',
                                md: '8fr 12fr',
                                lg: '3fr 7fr',
                                xl: '3fr 7fr',
                            }
                            : '1fr',
                        gap: { xs: 1.5, md: 2.25 },
                        alignItems: 'stretch',
                        minWidth: 0,
                        flex: 1,
                        minHeight: 0,
                        height: '100%',
                        width: '100%',
                    }}
                >
                    {isTwoColumn && (
                        <Box
                            ref={leftScrollRef}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: { xs: 1.5, md: 2.25 },
                                minWidth: 0,
                                position: { xs: 'relative', lg: 'sticky' },
                                top: { lg: TOP_OFFSET_LG },
                                alignSelf: { lg: 'start' },
                                minHeight: 0,
                                maxHeight: '100%',
                                overflow: 'hidden',
                                ...minimalScrollbar,
                            }}
                        >
                            {leftContent}
                        </Box>
                    )}

                    <Box
                        ref={rightScrollRef}
                        data-t2t-calendar-scroll-root="true"
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: { xs: 1.5, md: 2.25 },
                            minWidth: 0,
                            minHeight: 0,
                            maxHeight: '100%',
                            overflowX: 'hidden',
                            overflowY: 'auto',
                            position: 'relative',
                            ...minimalScrollbar,
                        }}
                    >
                        {rightContent}
                    </Box>
                </Box>
            </Box>

            {/* NOW jump button (blue) - takes priority over NEXT */}
            {showJumpToNow && (
                <Box
                    sx={{
                        position: 'fixed',
                        right: { xs: 12, sm: 18, md: 24 },
                        bottom: {
                            xs: 'calc(18px + var(--t2t-bottom-nav-height, 0px))',
                            sm: 'calc(22px + var(--t2t-bottom-nav-height, 0px))',
                            md: 26,
                        },
                        zIndex: 1500,
                    }}
                >
                    <Tooltip title="Jump to Now" placement="left">
                        <IconButton
                            aria-label="Jump to event in progress"
                            onClick={onJumpToNow}
                            sx={{
                                bgcolor: 'info.main',
                                color: 'info.contrastText',
                                boxShadow: '0 12px 32px rgba(15,23,42,0.26)',
                                border: '1px solid rgba(255,255,255,0.18)',
                                width: 48,
                                height: 48,
                                '&:hover': { bgcolor: 'info.dark' },
                                '&:focus-visible': {
                                    outline: '2px solid #0ea5e9',
                                    outlineOffset: 3,
                                },
                            }}
                        >
                            <JumpNowIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}

            {/* NEXT jump button (green) - shown when no NOW events */}
            {showJumpToNext && (
                <Box
                    sx={{
                        position: 'fixed',
                        right: { xs: 12, sm: 18, md: 24 },
                        bottom: {
                            xs: 'calc(18px + var(--t2t-bottom-nav-height, 0px))',
                            sm: 'calc(22px + var(--t2t-bottom-nav-height, 0px))',
                            md: 26,
                        },
                        zIndex: 1500,
                    }}
                >
                    <Tooltip title="Jump to Next" placement="left">
                        <IconButton
                            aria-label="Jump to next event"
                            onClick={onJumpToNext}
                            sx={{
                                bgcolor: 'success.main',
                                color: 'success.contrastText',
                                boxShadow: '0 12px 32px rgba(15,23,42,0.26)',
                                border: '1px solid rgba(255,255,255,0.18)',
                                width: 48,
                                height: 48,
                                '&:hover': { bgcolor: 'success.dark' },
                                '&:focus-visible': {
                                    outline: '2px solid #0ea5e9',
                                    outlineOffset: 3,
                                },
                            }}
                        >
                            <JumpNextIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
        </Box>
    );
};

CalendarEmbedLayout.propTypes = {
    isTwoColumn: PropTypes.bool.isRequired,
    leftContent: PropTypes.node,
    rightContent: PropTypes.node.isRequired,
    leftScrollRef: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({ current: PropTypes.any }),
    ]),
    rightScrollRef: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({ current: PropTypes.any }),
    ]),
    showJumpToNext: PropTypes.bool,
    onJumpToNext: PropTypes.func,
    jumpToNextDirection: PropTypes.oneOf(['up', 'down']),
    showJumpToNow: PropTypes.bool,
    onJumpToNow: PropTypes.func,
    jumpToNowDirection: PropTypes.oneOf(['up', 'down']),
    topBanner: PropTypes.node,
    appBar: PropTypes.node,
};

CalendarEmbedLayout.defaultProps = {
    leftContent: null,
    leftScrollRef: undefined,
    rightScrollRef: undefined,
    showJumpToNext: false,
    onJumpToNext: undefined,
    jumpToNextDirection: 'down',
    showJumpToNow: false,
    onJumpToNow: undefined,
    jumpToNowDirection: 'down',
    topBanner: null,
    appBar: null,
};

export default CalendarEmbedLayout;
