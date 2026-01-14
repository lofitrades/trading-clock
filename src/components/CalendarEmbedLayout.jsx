/**
 * src/components/CalendarEmbedLayout.jsx
 * 
 * Purpose: Layout-only wrapper for the calendar workspace that manages two-column
 * dashboard structure, independent column scrolling, sticky left rail, and a
 * floating jump-to-next/now control.
 * 
 * Changelog:
 * v1.0.20 - 2026-01-14 - NOW JUMP BUTTON: Added showJumpToNow/onJumpToNow/jumpToNowDirection props for "Jump to Now" floating button (blue, info color) with priority over NEXT button (green, success color). NOW events take precedence when visible. Mobile-first responsive design.
 * v1.0.19 - 2026-01-13 - Changed root backgroundColor to 'inherit' for session-based background propagation; allows App.jsx effectiveBackground to apply globally.
 * v1.0.18 - 2026-01-13 - BUGFIX: Add margin-bottom on xs/sm to account for fixed bottom AppBar; prevents content from hiding behind fixed navigation on mobile.
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
import { DASHBOARD_APP_BAR_CONTAINER_SX } from './AppBar';

const TOP_OFFSET_LG = 16;
const CONTENT_CONTAINER_SX = {
    width: '100%',
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
                // In two-column mode we lock to the viewport height and scroll within columns.
                // Extra outer padding reduces usable height and can trigger unnecessary scrollbars.
                pb: { xs: 10, md: 12 },
                minHeight: '100dvh',
                height: '100dvh',
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
                                ...DASHBOARD_APP_BAR_CONTAINER_SX,
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
                    overflowX: 'hidden',
                    flex: 1,
                    minHeight: 0,
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: isTwoColumn
                            ? {
                                xs: 'minmax(0, 1fr)',
                                md: 'minmax(360px, 520px) minmax(480px, 1fr)',
                                lg: 'minmax(360px, 520px) minmax(680px, 1fr)',
                            }
                            : 'minmax(0, 1fr)',
                        gap: { xs: 1.5, md: 2.25 },
                        alignItems: 'start',
                        minWidth: 0,
                        flex: 1,
                        minHeight: 0,
                        height: '100%',
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
                                height: '100%',
                                minHeight: 0,
                                overflowX: 'hidden',
                                overflowY: { md: 'auto' },
                                pr: { lg: 0.25 },
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
                            height: '100%',
                            minHeight: 0,
                            overflowY: 'auto',
                            position: 'relative',
                            pr: { lg: 0.25 },
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
