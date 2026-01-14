/**
 * src/components/AppLayout.jsx
 * 
 * Purpose: Centered layout wrapper for the /app experience, aligning content to the viewport with consistent paddings and max widths.
 * Key responsibility and main functionality: Provide an enterprise-grade MUI dashboard container that keeps the clock and drawers horizontally centered across breakpoints.
 * 
 * Changelog:
 * v1.0.3 - 2026-01-13 - Removed inner maxWidth/padding to rely on outer shared container; prevents double padding/overflow and keeps content centered like /calendar.
 * v1.0.2 - 2026-01-13 - Centered /app content on md/lg by capping maxWidth to shared dashboard sizing instead of 100%.
 * v1.0.1 - 2026-01-13 - Match dashboard container widths with AppBar for consistent centering across breakpoints.
 * v1.0.0 - 2026-01-13 - Initial implementation for unified /app layout centering and padding.
 */

import PropTypes from 'prop-types';
import { Box } from '@mui/material';

export default function AppLayout({ children, background }) {
    return (
        <Box
            sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: background,
            }}
        >
            <Box
                sx={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: 0,
                }}
            >
                {children}
            </Box>
        </Box>
    );
}

AppLayout.propTypes = {
    children: PropTypes.node.isRequired,
    background: PropTypes.string,
};
