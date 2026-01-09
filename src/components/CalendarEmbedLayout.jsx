/**
 * src/components/CalendarEmbedLayout.jsx
 * 
 * Purpose: Layout-only wrapper for the calendar workspace that manages two-column
 * dashboard structure, independent column scrolling, sticky left rail, and a
 * floating back-to-top control.
 * 
 * Changelog:
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
import { Box, IconButton } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

const TOP_OFFSET_LG = 16;
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
    showBackToTop,
    onBackToTop,
    topBanner,
}) => {
    return (
        <Box
            sx={{
                backgroundColor: '#f5f7fb',
                color: 'inherit',
                pt: 0,
                pb: { xs: 3, md: 4 },
                minHeight: '100dvh',
                height: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {topBanner && (
                <Box
                    sx={{
                        width: '100%',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1200,
                        flexShrink: 0,
                        mb: { xs: 2, md: 2.5 },
                    }}
                >
                    {topBanner}
                </Box>
            )}
            <Box
                sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', xl: 1560 },
                    mx: 'auto',
                    px: { xs: 2, sm: 2.75, md: 3.5 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 2, md: 2.5 },
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
                                md: 'repeat(2, minmax(0, 1fr))',
                                lg: 'minmax(360px, 520px) minmax(680px, 1fr)',
                            }
                            : 'minmax(0, 1fr)',
                        gap: { xs: 2, md: 2.5 },
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
                                gap: { xs: 2, md: 2.5 },
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
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: { xs: 2, md: 2.5 },
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

            {showBackToTop && (
                <Box
                    sx={{
                        position: 'fixed',
                        right: { xs: 12, sm: 18, md: 24 },
                        bottom: { xs: 18, sm: 22, md: 26 },
                        zIndex: 1500,
                    }}
                >
                    <IconButton
                        aria-label="Back to top"
                        onClick={onBackToTop}
                        sx={{
                            bgcolor: '#0F172A',
                            color: '#ffffff',
                            boxShadow: '0 12px 32px rgba(15,23,42,0.26)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            width: 48,
                            height: 48,
                            '&:hover': { bgcolor: '#16213a' },
                            '&:focus-visible': {
                                outline: '2px solid #0ea5e9',
                                outlineOffset: 3,
                            },
                        }}
                    >
                        <ArrowUpwardIcon />
                    </IconButton>
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
    showBackToTop: PropTypes.bool.isRequired,
    onBackToTop: PropTypes.func.isRequired,
    topBanner: PropTypes.node,
};

CalendarEmbedLayout.defaultProps = {
    leftContent: null,
    leftScrollRef: undefined,
    rightScrollRef: undefined,
    topBanner: null,
};

export default CalendarEmbedLayout;
