/**
 * src/components/routes/RouteLoading.jsx
 * 
 * Purpose: Shared full-screen loading experience using the branded donut animation.
 * Provides consistent enterprise-grade UX for route guards and suspense fallbacks.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-09 - Initial implementation for route guards and lazy loading
 */

import React from 'react';
import { Box, Fade, Typography } from '@mui/material';
import LoadingAnimation from '../LoadingAnimation';

const RouteLoading = ({ message = 'Loading...' }) => (
  <Fade in timeout={200}>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
        bgcolor: '#F9F9F9',
        px: 3,
      }}
    >
      <LoadingAnimation clockSize={240} isLoading />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  </Fade>
);

export default RouteLoading;
