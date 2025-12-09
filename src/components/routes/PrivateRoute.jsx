/**
 * src/components/routes/PrivateRoute.jsx
 * 
 * Purpose: Protected route component that requires authentication.
 * Redirects unauthenticated users to login page.
 * Supports role-based and subscription-based access control.
 * 
 * Changelog:
 * v1.1.0 - 2025-12-09 - Swapped CircularProgress for branded donut loader in guarded states
 * v1.0.0 - 2025-11-30 - Initial implementation with RBAC and subscription support
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import RouteLoading from './RouteLoading';

/**
 * PrivateRoute Component
 * 
 * Protects routes that require authentication.
 * Optionally enforces role-based or subscription-based access.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Protected content
 * @param {string|string[]} props.roles - Required role(s) for access
 * @param {string|string[]} props.plans - Required subscription plan(s) for access
 * @param {string} props.feature - Required feature for access
 * @param {string} props.redirectTo - Custom redirect path (default: '/')
 */
export default function PrivateRoute({ 
  children, 
  roles = null, 
  plans = null, 
  feature = null,
  redirectTo = '/',
}) {
  const { user, userProfile, loading, profileLoading, hasRole, hasPlan, hasFeature } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading || profileLoading) {
    return <RouteLoading message="Verifying access..." />;
  }

  // User not authenticated - redirect to home with return URL
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check email verification (optional - uncomment if needed)
  // if (!user.emailVerified) {
  //   return (
  //     <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 8 }}>
  //       <Alert severity="warning">
  //         <Typography variant="h6" gutterBottom>
  //           Email Verification Required
  //         </Typography>
  //         <Typography variant="body2">
  //           Please verify your email address to access this page.
  //           Check your inbox for a verification link.
  //         </Typography>
  //       </Alert>
  //     </Box>
  //   );
  // }

  // Check role-based access
  if (roles && !hasRole(roles)) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 8 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body2">
            You don't have the required permissions to access this page.
            {Array.isArray(roles) 
              ? ` Required role(s): ${roles.join(', ')}`
              : ` Required role: ${roles}`
            }
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Your current role: <strong>{userProfile?.role || 'none'}</strong>
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Check subscription-based access
  if (plans && !hasPlan(plans)) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 8 }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>
            Upgrade Required
          </Typography>
          <Typography variant="body2">
            This feature requires a subscription upgrade.
            {Array.isArray(plans)
              ? ` Required plan(s): ${plans.join(', ')}`
              : ` Required plan: ${plans}`
            }
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Your current plan: <strong>{userProfile?.subscription?.plan || 'free'}</strong>
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Check feature-based access
  if (feature && !hasFeature(feature)) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 8 }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>
            Feature Not Available
          </Typography>
          <Typography variant="body2">
            This feature is not included in your current subscription.
            Required feature: <strong>{feature}</strong>
          </Typography>
        </Alert>
      </Box>
    );
  }

  // All checks passed - render protected content
  return children;
}
