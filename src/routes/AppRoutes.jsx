/**
 * src/routes/AppRoutes.jsx
 * 
 * Purpose: Centralized route configuration for the entire application.
 * Manages public, private, admin, and subscription-based routes.
 * Scalable architecture for future RBAC and feature-gating.
 * 
 * Route Structure:
 * - Public Routes: Accessible to all users
 * - Private Routes: Require authentication
 * - Admin Routes: Require admin role
 * - Premium Routes: Require specific subscription plans
 * 
 * Changelog:
 * v1.0.0 - 2025-11-30 - Initial implementation with RBAC and subscription support
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Route Guards
import PrivateRoute from '../components/routes/PrivateRoute';
import PublicRoute from '../components/routes/PublicRoute';

// Lazy load components for code splitting
const MainApp = lazy(() => import('../App'));
const UploadDescriptions = lazy(() => import('../components/UploadDescriptions'));
const ExportEvents = lazy(() => import('../components/ExportEvents'));
const EventsPage = lazy(() => import('../components/EventsPage'));

/**
 * Loading Component
 * Displayed while lazy-loaded components are loading
 */
const LoadingFallback = () => (
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
  </Box>
);

/**
 * Not Found Component
 * 404 page for invalid routes
 */
const NotFound = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      p: 4,
      textAlign: 'center',
    }}
  >
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go back home</a>
  </Box>
);

/**
 * AppRoutes Component
 * 
 * Centralized routing configuration with the following features:
 * 
 * 1. PUBLIC ROUTES (accessible to everyone)
 *    - / - Main application (clock, events, etc.)
 * 
 * 2. PRIVATE ROUTES (require authentication)
 *    - None currently (clock is public)
 * 
 * 3. ADMIN ROUTES (require admin role)
 *    - /upload-desc - Upload economic event descriptions
 *    - /export - Export all events to JSON
 * 
 * 4. PREMIUM ROUTES (require specific subscription plans)
 *    - Can be added as features are developed
 * 
 * 5. FUTURE ROUTES (prepared for expansion)
 *    - /settings - User settings (requires auth)
 *    - /profile - User profile management (requires auth)
 *    - /subscription - Manage subscription (requires auth)
 *    - /dashboard - Analytics dashboard (requires premium plan)
 *    - /alerts - Custom alerts (requires premium plan)
 *    - /api-access - API key management (requires pro plan)
 */
export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* ==================== PUBLIC ROUTES ==================== */}
        
        {/* Main Application - Accessible to everyone */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <MainApp />
            </PublicRoute>
          }
        />

        {/* Economic Events Page - Table and Timeline views */}
        <Route
          path="/events"
          element={
            <PublicRoute>
              <EventsPage />
            </PublicRoute>
          }
        />

        {/* ==================== ADMIN ROUTES ==================== */}
        
        {/* Upload Economic Event Descriptions - Admin only */}
        <Route
          path="/upload-desc"
          element={
            <PrivateRoute roles={['admin', 'superadmin']}>
              <UploadDescriptions />
            </PrivateRoute>
          }
        />

        {/* Export Events - Admin only */}
        <Route
          path="/export"
          element={
            <PrivateRoute roles={['admin', 'superadmin']}>
              <ExportEvents />
            </PrivateRoute>
          }
        />

        {/* ==================== PRIVATE ROUTES ==================== */}
        
        {/* User Settings - Requires authentication
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <UserSettings />
            </PrivateRoute>
          }
        />
        */}

        {/* User Profile - Requires authentication
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        />
        */}

        {/* ==================== PREMIUM ROUTES ==================== */}
        
        {/* Analytics Dashboard - Requires premium or pro plan
        <Route
          path="/dashboard"
          element={
            <PrivateRoute plans={['premium', 'pro']}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        */}

        {/* Custom Alerts - Requires premium or pro plan
        <Route
          path="/alerts"
          element={
            <PrivateRoute plans={['premium', 'pro']}>
              <CustomAlerts />
            </PrivateRoute>
          }
        />
        */}

        {/* API Access - Requires pro plan
        <Route
          path="/api-access"
          element={
            <PrivateRoute plans={['pro']}>
              <ApiAccess />
            </PrivateRoute>
          }
        />
        */}

        {/* ==================== FEATURE-GATED ROUTES ==================== */}
        
        {/* Advanced Trading Tools - Requires specific feature
        <Route
          path="/advanced-tools"
          element={
            <PrivateRoute feature="advanced_trading_tools">
              <AdvancedTools />
            </PrivateRoute>
          }
        />
        */}

        {/* ==================== CATCH-ALL ROUTES ==================== */}
        
        {/* 404 Not Found - Catch all unmatched routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

/**
 * ROUTE CONFIGURATION GUIDE
 * ========================
 * 
 * Adding New Routes:
 * 
 * 1. PUBLIC ROUTE (no authentication required):
 *    <Route
 *      path="/your-path"
 *      element={
 *        <PublicRoute>
 *          <YourComponent />
 *        </PublicRoute>
 *      }
 *    />
 * 
 * 2. PUBLIC ROUTE (redirect if authenticated):
 *    <Route
 *      path="/login"
 *      element={
 *        <PublicRoute restricted={true} redirectTo="/dashboard">
 *          <Login />
 *        </PublicRoute>
 *      }
 *    />
 * 
 * 3. PRIVATE ROUTE (authentication required):
 *    <Route
 *      path="/your-path"
 *      element={
 *        <PrivateRoute>
 *          <YourComponent />
 *        </PrivateRoute>
 *      }
 *    />
 * 
 * 4. ROLE-BASED ROUTE (specific role required):
 *    <Route
 *      path="/admin"
 *      element={
 *        <PrivateRoute roles={['admin', 'superadmin']}>
 *          <AdminPanel />
 *        </PrivateRoute>
 *      }
 *    />
 * 
 * 5. SUBSCRIPTION-BASED ROUTE (specific plan required):
 *    <Route
 *      path="/premium-feature"
 *      element={
 *        <PrivateRoute plans={['premium', 'pro']}>
 *          <PremiumFeature />
 *        </PrivateRoute>
 *      }
 *    />
 * 
 * 6. FEATURE-GATED ROUTE (specific feature required):
 *    <Route
 *      path="/special-tool"
 *      element={
 *        <PrivateRoute feature="special_tool_access">
 *          <SpecialTool />
 *        </PrivateRoute>
 *      }
 *    />
 * 
 * 7. COMBINED RESTRICTIONS:
 *    <Route
 *      path="/advanced-admin"
 *      element={
 *        <PrivateRoute 
 *          roles={['admin']} 
 *          plans={['pro']}
 *          feature="advanced_features"
 *        >
 *          <AdvancedAdminPanel />
 *        </PrivateRoute>
 *      }
 *    />
 * 
 * User Roles:
 * - 'user' - Default role for all authenticated users
 * - 'admin' - Application administrators
 * - 'superadmin' - Super administrators with full access
 * 
 * Subscription Plans:
 * - 'free' - Free tier (default)
 * - 'premium' - Premium subscription
 * - 'pro' - Professional subscription
 * 
 * Features:
 * - Defined per subscription plan in user profile
 * - Examples: 'advanced_charts', 'custom_alerts', 'api_access', etc.
 */
