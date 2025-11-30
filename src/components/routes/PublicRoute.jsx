/**
 * src/components/routes/PublicRoute.jsx
 * 
 * Purpose: Public route component accessible to all users.
 * Optionally redirects authenticated users (e.g., login/signup pages).
 * 
 * Changelog:
 * v1.0.0 - 2025-11-30 - Initial implementation
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * PublicRoute Component
 * 
 * Routes accessible to everyone.
 * Can optionally redirect authenticated users (for login/signup pages).
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Public content
 * @param {boolean} props.restricted - If true, authenticated users are redirected
 * @param {string} props.redirectTo - Where to redirect authenticated users (default: '/')
 */
export default function PublicRoute({ 
  children, 
  restricted = false, 
  redirectTo = '/',
}) {
  const { user, loading, profileLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading || (user && profileLoading)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // If route is restricted and user is authenticated, redirect
  if (restricted && user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render public content
  return children;
}
