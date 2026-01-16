/**
 * src/components/CalendarGridLayout.jsx
 * 
 * Purpose: Two-column responsive layout for /calendar page using MUI Grid component.
 * Left rail (clock) is sticky on desktop, right rail (events) scrolls independently.
 * Mobile-first: stacks to single column on xs/sm with clock hidden.
 * 
 * Changelog:
 * v1.0.4 - 2026-01-15 - JUMP BUTTONS SAFE-AREA-INSET FIX: Added env(safe-area-inset-bottom) to both xs and sm
 *   button positioning. The AppBar has pb: 'env(safe-area-inset-bottom)' which adds bottom padding on devices with safe areas
 *   (notches, home indicators). The CSS variable --t2t-bottom-nav-height only accounts for the 64px BottomNavigation height,
 *   not the additional safe-area padding. Buttons now use 'calc(18px + var(--t2t-bottom-nav-height, 0px) + env(safe-area-inset-bottom))'
 *   to properly position above the entire AppBar including safe area padding. This fixes sm breakpoint buttons appearing
 *   under the AppBar instead of above it, matching the xs behavior.
 * v1.0.3 - 2026-01-15 - JUMP BUTTONS SM BREAKPOINT FIX: Changed "Jump to Next" and "Jump to Now"
 *   floating buttons bottom positioning on sm breakpoint from 'calc(22px + var(--t2t-bottom-nav-height, 0px))'
 *   to 'calc(18px + var(--t2t-bottom-nav-height, 0px))' to match xs behavior. Both xs/sm now use consistent
 *   18px baseline offset above the mobile AppBar (64px). Fixes buttons overlapping bottom nav on sm breakpoint.
 * v1.0.2 - 2026-01-15 - MOBILE SCROLLING FIX: Added height constraint to right column Grid on xs/sm.
 *   Changed maxHeight from { xs: 'none', md: 'calc(100vh - 120px)' } to responsive
 *   { xs: 'calc(100vh - 140px)', sm: 'calc(100vh - 140px)', md: 'calc(100vh - 120px)' }.
 *   On xs/sm (single-column), right column needs maxHeight to force inner Box to become scrollable.
 *   Without maxHeight, flex child Box has undefined height and content expands freely without scroll.
 *   Follows enterprise pattern: constrain parent height to enable child scroll behavior.
 * v1.0.1 - 2026-01-15 - OVERFLOW FIX (ENTERPRISE AUDIT): Added proper overflow containment
 *   to prevent content escaping Grid column bounds. Key fixes:
 *   - Added minWidth: 0 to all Grid columns (critical for flex shrinking)
 *   - Added overflow: hidden to content wrapper Boxes
 *   - Added maxWidth: 100% to ensure content respects parent bounds
 *   - Root Box now has overflow: hidden to clip any escaping content
 *   - Follows enterprise MUI pattern: flex children need minWidth:0 to shrink
 * v1.0.0 - 2026-01-15 - Initial implementation using MUI Grid (free) component with v7 API.
 *   Uses size={{ xs: 12, md: 4 }} syntax (not legacy item xs={12}).
 *   Enterprise best practices: separation of concerns, mobile-first responsive design,
 *   sticky left rail on md+, independent scroll on right rail, proper height constraints.
 */

import PropTypes from 'prop-types';
import { Box, Grid, IconButton, Tooltip } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import KeyboardDoubleArrowDownRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowDownRounded';
import KeyboardDoubleArrowUpRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowUpRounded';

/**
 * Minimal scrollbar styling for scroll containers
 */
const minimalScrollbarSx = {
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

/**
 * CalendarGridLayout - Pure layout component for calendar page
 * 
 * @param {boolean} isTwoColumn - Whether to show two-column layout (clock + calendar)
 * @param {React.ReactNode} leftContent - Content for left rail (clock panel)
 * @param {React.ReactNode} rightContent - Content for right rail (calendar events)
 * @param {React.RefObject} leftScrollRef - Ref for left scroll container
 * @param {React.RefObject} rightScrollRef - Ref for right scroll container
 * @param {React.ReactNode} appBar - Optional AppBar to render above content
 * @param {boolean} showJumpToNext - Show jump to next event button
 * @param {function} onJumpToNext - Handler for jump to next
 * @param {string} jumpToNextDirection - 'up' or 'down'
 * @param {boolean} showJumpToNow - Show jump to now button (takes priority over next)
 * @param {function} onJumpToNow - Handler for jump to now
 * @param {string} jumpToNowDirection - 'up' or 'down'
 */
const CalendarGridLayout = ({
    isTwoColumn,
    leftContent,
    rightContent,
    leftScrollRef,
    rightScrollRef,
    appBar,
    showJumpToNext,
    onJumpToNext,
    jumpToNextDirection,
    showJumpToNow,
    onJumpToNow,
    jumpToNowDirection,
    stickyFiltersNode,
}) => {
    const JumpNextIcon = jumpToNextDirection === 'up'
        ? KeyboardDoubleArrowUpRoundedIcon
        : KeyboardDoubleArrowDownRoundedIcon;

    const JumpNowIcon = jumpToNowDirection === 'up'
        ? KeyboardDoubleArrowUpRoundedIcon
        : KeyboardDoubleArrowDownRoundedIcon;

    // Track if filters are sticky (frozen at top)
    const [isFilterSticky, setIsFilterSticky] = useState(false);
    const filterBoxRef = useRef(null);

    useEffect(() => {
        if (!stickyFiltersNode || !filterBoxRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // If the element's top is out of view (entry.boundingClientRect.top <= 0),
                // it means it's stuck at the top
                setIsFilterSticky(entry.boundingClientRect.top <= 0);
            },
            { threshold: [0] }
        );

        observer.observe(filterBoxRef.current);
        return () => observer.disconnect();
    }, [stickyFiltersNode]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                width: '100%',
                maxWidth: '100%',
                pt: 2,
                pb: 2,
                overflow: 'hidden',
                boxSizing: 'border-box',
            }}
        >
            {/* AppBar slot */}
            {appBar && (
                <Box
                    sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1100,
                        mb: 2,
                        flexShrink: 0,
                    }}
                >
                    {appBar}
                </Box>
            )}

            {/* Main Grid Container */}
            <Grid
                container
                spacing={{ xs: 1.5, md: 2.5 }}
                sx={{
                    flex: 1,
                    minHeight: 0,
                    minWidth: 0,
                    maxWidth: '100%',
                    alignItems: 'flex-start',
                    overflow: 'hidden',
                    px: { xs: 2, sm: 3, md: 3 },
                }}
            >
                {/* Left Rail - Clock Panel (hidden on xs/sm when not two-column) */}
                {isTwoColumn && (
                    <Grid
                        size={{ xs: 12, md: 5, lg: 4, xl: 4 }}
                        sx={{
                            display: { xs: 'none', md: 'block' },
                            minWidth: 0,
                            maxWidth: '100%',
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            ref={leftScrollRef}
                            sx={{
                                position: { md: 'sticky' },
                                top: { md: 16 },
                                maxHeight: { md: 'calc(100vh - 120px)' },
                                overflowY: { md: 'auto' },
                                overflowX: 'hidden',
                                minWidth: 0,
                                maxWidth: '100%',
                                width: '100%',
                                boxSizing: 'border-box',
                                ...minimalScrollbarSx,
                            }}
                        >
                            {leftContent}
                        </Box>
                    </Grid>
                )}

                {/* Right Rail - Calendar Events (scrollable) */}
                <Grid
                    size={{ xs: 12, md: isTwoColumn ? 7 : 12, lg: isTwoColumn ? 8 : 12, xl: isTwoColumn ? 8 : 12 }}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        minWidth: 0,
                        maxWidth: '100%',
                        maxHeight: { xs: 'calc(100vh - 140px)', sm: 'calc(100vh - 140px)', md: 'calc(100vh - 120px)' },
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        ref={rightScrollRef}
                        data-t2t-calendar-scroll-root="true"
                        sx={{
                            flex: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            minHeight: 0,
                            minWidth: 0,
                            maxWidth: '100%',
                            width: '100%',
                            boxSizing: 'border-box',
                            ...minimalScrollbarSx,
                        }}
                    >
                        {/* Sticky Filters - constrained to right column width, sticky within scroll context */}
                        {stickyFiltersNode && (
                            <Box
                                ref={filterBoxRef}
                                sx={{
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 1000,
                                    bgcolor: 'background.default',
                                    flexShrink: 0,
                                    borderBottom: isFilterSticky ? '1px solid' : 'none',
                                    borderColor: 'divider',
                                    overflow: 'visible',
                                    ml: -1,
                                    mb: { xs: 0, lg: 1 },
                                }}
                            >
                                {stickyFiltersNode}
                            </Box>
                        )}
                        {rightContent}
                    </Box>
                </Grid>
            </Grid>

            {/* Floating Jump Buttons */}
            {/* NOW jump button (blue) - takes priority over NEXT */}
            {showJumpToNow && (
                <Box
                    sx={{
                        position: 'fixed',
                        right: { xs: 12, sm: 18, md: 24 },
                        bottom: {
                            xs: 'calc(18px + var(--t2t-bottom-nav-height, 0px) + env(safe-area-inset-bottom))',
                            sm: 'calc(18px + var(--t2t-bottom-nav-height, 0px) + env(safe-area-inset-bottom))',
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
            {showJumpToNext && !showJumpToNow && (
                <Box
                    sx={{
                        position: 'fixed',
                        right: { xs: 12, sm: 18, md: 24 },
                        bottom: {
                            xs: 'calc(18px + var(--t2t-bottom-nav-height, 0px) + env(safe-area-inset-bottom))',
                            sm: 'calc(18px + var(--t2t-bottom-nav-height, 0px) + env(safe-area-inset-bottom))',
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
                                    outline: '2px solid #22c55e',
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

CalendarGridLayout.propTypes = {
    isTwoColumn: PropTypes.bool,
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
    appBar: PropTypes.node,
    showJumpToNext: PropTypes.bool,
    onJumpToNext: PropTypes.func,
    jumpToNextDirection: PropTypes.oneOf(['up', 'down']),
    showJumpToNow: PropTypes.bool,
    onJumpToNow: PropTypes.func,
    jumpToNowDirection: PropTypes.oneOf(['up', 'down']),
    stickyFiltersNode: PropTypes.node,
};

CalendarGridLayout.defaultProps = {
    isTwoColumn: true,
    leftContent: null,
    leftScrollRef: undefined,
    rightScrollRef: undefined,
    appBar: null,
    showJumpToNext: false,
    onJumpToNext: undefined,
    jumpToNextDirection: 'down',
    showJumpToNow: false,
    onJumpToNow: undefined,
    jumpToNowDirection: 'down',
    stickyFiltersNode: null,
};

export default CalendarGridLayout;
