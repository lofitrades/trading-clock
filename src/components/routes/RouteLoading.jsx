/**
 * src/components/routes/RouteLoading.jsx
 * 
 * Purpose: Shared full-screen loading experience using the unified small loader.
 * Provides consistent enterprise-grade UX for route guards and suspense fallbacks.
 * 
 * Changelog:
 * v1.1.0 - 2025-12-09 - Switched to unified LoadingScreen (small loader) to avoid double animations.
 * v1.0.0 - 2025-12-09 - Initial implementation for route guards and lazy loading
 */

import PropTypes from 'prop-types';
import LoadingScreen from '../LoadingScreen';
import { Box, Typography } from '@mui/material';

const RouteLoading = ({ message = 'Almost ready...' }) => (
  <Box sx={{ position: 'relative', minHeight: '100vh' }}>
    <LoadingScreen isLoading clockSize={240} />
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        pb: 4,
        pointerEvents: 'none',
      }}
    >
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  </Box>
);

RouteLoading.propTypes = {
  message: PropTypes.string,
};

export default RouteLoading;
