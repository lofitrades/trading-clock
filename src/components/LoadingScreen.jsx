/**
 * src/components/LoadingScreen.jsx
 * 
 * Purpose: Fullscreen branded loading experience with donut animation.
 * Provides smooth fade transitions and consistent UX across app entry points.
 * 
 * Changelog:
 * v1.4.0 - 2026-01-14 - GLOBAL BACKGROUND FIX: Changed backgroundColor from hardcoded #F9F9F9 to 'inherit' so session-based background colors from App.jsx (via document.body) properly propagate to the loading screen. This enables the 'Session-based Background' setting to affect all UI elements.
 * v1.3.0 - 2025-12-20 - Added responsive brand line below loader for clearer progress feedback
 * v1.2.0 - 2025-12-09 - Reduced loader size to compact, CircularProgress-like footprint
 * v1.1.0 - 2025-12-09 - Lengthened fade, keep-mounted transitions for smoother handoff
 * v1.0.0 - 2025-11-30 - Initial implementation
 */


import PropTypes from 'prop-types';
import { Box, Fade } from '@mui/material';
import LoadingAnimation from './LoadingAnimation';

const LoadingScreen = ({ isLoading, clockSize = 375 }) => {
  const effectiveSize = Math.min(clockSize || 375, 96);

  return (
    <Fade in={isLoading} timeout={{ enter: 400, exit: 650 }} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          gap: 2.5,
          transition: 'opacity 0.6s ease',
          px: { xs: 2, sm: 3 },
        }}
      >
        <LoadingAnimation clockSize={effectiveSize} isLoading={isLoading} />

      </Box>
    </Fade>
  );
};

LoadingScreen.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  clockSize: PropTypes.number,
};

export default LoadingScreen;
