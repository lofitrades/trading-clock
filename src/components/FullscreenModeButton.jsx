/**
 * src/components/FullscreenModeButton.jsx
 * 
 * Purpose: Fixed fullscreen toggle button positioned at bottom-left of viewport.
 * Hides AppBar, EventsFilters3, headings, and timezone button when active.
 * Provides immersive clock-only viewing experience.
 * 
 * Changelog:
 * v1.0.0 - 2026-01-17 - Initial implementation with fixed positioning and responsive sizing
 */

import PropTypes from 'prop-types';
import { IconButton, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

export default function FullscreenModeButton({ isFullscreenMode, onToggle }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Tooltip title={isFullscreenMode ? 'Exit fullscreen' : 'Enter fullscreen'} arrow>
            <IconButton
                onClick={onToggle}
                aria-label={isFullscreenMode ? 'Exit fullscreen mode' : 'Enter fullscreen mode'}
                sx={{
                    position: 'fixed',
                    bottom: { xs: 24, sm: 32, md: 40 },
                    left: { xs: 16, sm: 20, md: 24 },
                    zIndex: 1050,
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    color: 'text.primary',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                        transform: 'scale(1.05)',
                    },
                    '&:active': {
                        transform: 'scale(0.95)',
                    },
                    width: isMobile ? 44 : 48,
                    height: isMobile ? 44 : 48,
                }}
            >
                {isFullscreenMode ? (
                    <FullscreenExitIcon fontSize="small" />
                ) : (
                    <FullscreenIcon fontSize="small" />
                )}
            </IconButton>
        </Tooltip>
    );
}

FullscreenModeButton.propTypes = {
    isFullscreenMode: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
};
