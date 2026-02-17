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
 * v3.0.0 - 2026-02-17 - BEP ADMIN LAYOUT: Wrapped all /admin/* routes in AdminLayout with RBAC AdminNavBar.
 *                       Nested routes via <Outlet />. AdminLayout provides consistent nav chrome across admin pages.
 * v2.3.0 - 2026-02-17 - BEP RBAC: Restricted /admin/upload-desc and /admin/export to superadmin only (was admin+superadmin).
 * v2.2.0 - 2026-02-13 - BEP PERFORMANCE: Lazy-loaded EmailLinkHandler. Made analytics.js
 *                       imports fully dynamic. Reduces main bundle critical path.
 * v2.1.0 - 2026-02-07 - MIGRATION: Calendar2Page became primary /calendar route. Removed /calendar2 route.
 * v2.0.0 - 2026-02-05 - BEP: Added /admin dashboard with stats overview, quick actions, activity feed.
 * v1.9.0 - 2026-02-04 - BEP Blog Phase 5.C: Added /blog/category/:category and /blog/tag/:tagSlug routes
 * v1.8.0 - 2026-02-05 - BEP Blog Phase 6: Added /admin/blog/authors route for author management
 *                       (admin/superadmin only - not editors)
 * v1.7.0 - 2026-02-04 - BEP Blog Phase 5.B: Added combined event+currency taxonomy route 
 *                       (/blog/event/:eventKey/:currency) for filtering by both event AND currency
 * v1.6.0 - 2026-02-04 - BEP Blog Phase 5.B: Added blog taxonomy routes (/blog/event/:eventKey, 
 *                       /blog/currency/:currency, /blog/author/:authorSlug)
 * v1.5.0 - 2026-02-04 - BEP SEO: Added note about language subpath handling. Firebase hosting rewrites handle /es/* and /fr/* paths by serving appropriate static files, while LanguageContext extracts language from pathname for runtime detection. No React Router changes needed - subpath routing is transparent to the SPA.
 * v1.4.0 - 2026-02-03 - BEP: Add PushPermissionHandler to prompt PWA users for notification permission
 *                       when they have push reminders enabled. Shows friendly modal on mobile PWA reload.
 * v1.3.0 - 2026-02-02 - Added /events/:eventId route for SEO-discoverable event pages (53 events × 3 languages = 159 pages).
 * v1.2.2 - 2026-02-02 - Added /admin/descriptions route for event descriptions management (superadmin only).
 * v1.2.1 - 2026-02-02 - Added /admin/events route for event management (superadmin only).
 * v1.2.0 - 2026-01-16 - Added /clock public route for the market clock UI and retained /app as noindex app shell.
 * v1.2.0 - 2026-02-05 - BEP: Moved /fft2t → /admin/fft2t (admin routing structure).
 * v1.1.8 - 2026-01-16 - Added /fft2t superadmin route for GPT event uploader.
 * v1.1.7 - 2026-01-09 - Added /contact route using ContactPage component.
 * v1.1.6 - 2026-01-07 - Added /privacy route using shared PrivacyPage component.
 * v1.1.5 - 2026-01-07 - Mount CookiesBanner globally so consent prompt appears on all SPA routes.
 * v1.1.4 - 2025-12-22 - Initialize Firebase Analytics with SPA page view logging across route changes.
 * v1.1.3 - 2025-12-22 - Mount EmailLinkHandler globally so magic links resolve on any route and keep /app routing aligned.
 * v1.1.2 - 2025-12-22 - Route / to HomePage2 (landing) and /app to HomePage (app) to fix landing/app split.
 * v1.1.1 - 2025-12-09 - Removed redundant Suspense loader to avoid double-loading animation (App handles unified loader).
 * v1.1.0 - 2025-12-09 - Replaced CircularProgress fallback with branded donut loader
 * v1.0.0 - 2025-11-30 - Initial implementation with RBAC and subscription support
 */

import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';

// BEP PERFORMANCE v2.2.0: Lazy load EmailLinkHandler - only active for magic link callbacks,
// no need to parse its Firebase auth dependencies on every page load.
const EmailLinkHandler = lazy(() => import('../components/EmailLinkHandler'));

// BEP PERFORMANCE: analytics imports are now fully dynamic inside analytics.js
import { initAnalytics, logPageView } from '../utils/analytics';

// Route Guards
import PrivateRoute from '../components/routes/PrivateRoute';
import PublicRoute from '../components/routes/PublicRoute';
const CookiesBanner = lazy(() => import('../components/CookiesBanner'));
import { usePushPermissionPrompt } from '../hooks/usePushPermissionPrompt';

// Lazy load components for code splitting
const LandingPage = lazy(() => import('../components/LandingPage'));
const HomePage = lazy(() => import('../components/HomePage'));
const ClockPage = lazy(() => import('../pages/ClockPage2'));
const AboutPage = lazy(() => import('../components/AboutPage'));
const LoginPage = lazy(() => import('../components/LoginPage'));
const UploadDescriptions = lazy(() => import('../components/UploadDescriptions'));
const ExportEvents = lazy(() => import('../components/ExportEvents'));
const FFTTUploader = lazy(() => import('../components/FFTTUploader'));
const PrivacyPage = lazy(() => import('../components/PrivacyPage'));
const TermsPage = lazy(() => import('../components/TermsPage'));
const ContactPage = lazy(() => import('../components/ContactPage'));
const AdminEventsPage = lazy(() => import('../pages/AdminEventsPage'));
const PushPermissionModal = lazy(() => import('../components/PushPermissionModal'));
const AdminDescriptionsPage = lazy(() => import('../pages/AdminDescriptionsPage'));
const EventPage = lazy(() => import('../components/EventPage'));
// Blog CMS pages (Phase 2)
const AdminBlogPage = lazy(() => import('../pages/AdminBlogPage'));
const AdminBlogEditorPage = lazy(() => import('../pages/AdminBlogEditorPage'));
const AdminBlogAuthorsPage = lazy(() => import('../pages/AdminBlogAuthorsPage'));
// Blog public pages (Phase 3)
const BlogListPage = lazy(() => import('../pages/BlogListPage'));
const BlogPostPage = lazy(() => import('../pages/BlogPostPage'));
// Blog taxonomy pages (Phase 5.B/5.C)
const BlogEventHubPage = lazy(() => import('../pages/BlogEventHubPage'));
const BlogCurrencyHubPage = lazy(() => import('../pages/BlogCurrencyHubPage'));
const BlogEventCurrencyHubPage = lazy(() => import('../pages/BlogEventCurrencyHubPage'));
const BlogAuthorPage = lazy(() => import('../pages/BlogAuthorPage'));
const BlogCategoryHubPage = lazy(() => import('../pages/BlogCategoryHubPage'));
const BlogTagHubPage = lazy(() => import('../pages/BlogTagHubPage'));
// Calendar 2.0 (fast table layout)
const Calendar2Page = lazy(() => import('../pages/Calendar2Page'));
// Admin Dashboard + Layout
const AdminLayout = lazy(() => import('../components/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));

/**
 * Loading Component
 * Displayed while lazy-loaded components are loading
 */
const LoadingFallback = () => null;

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
      minHeight: 'var(--t2t-vv-height, 100dvh)',
      p: 4,
      textAlign: 'center',
    }}
  >
    <h1>404 - Page Not Found</h1>
    <p>The page you&apos;re looking for doesn&apos;t exist.</p>
    <a href="/">Go back home</a>
  </Box>
);

function AnalyticsInitializer() {
  const location = useLocation();

  // BEP PERFORMANCE: Defer analytics initialization to idle time.
  // Analytics is non-critical and should not block first paint or interactivity.
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => initAnalytics(), { timeout: 3000 });
    } else {
      setTimeout(() => initAnalytics(), 2000);
    }
  }, []);

  useEffect(() => {
    logPageView(location.pathname + location.search, document.title, location.search);
  }, [location.pathname, location.search]);

  return null;
}

/**
 * AppRoutes Component
 * 
 * Centralized routing configuration with the following features:
 * 
 * LANGUAGE HANDLING (BEP SEO):
 * - Firebase hosting rewrites serve /es/* and /fr/* requests from language-specific static files
 * - LanguageContext extracts language from pathname (e.g., /es/clock → 'es')
 * - React Router sees all routes without language prefix (transparent to SPA)
 * - No duplicate route definitions needed - same routes work for all languages
 * 
 * 1. PUBLIC ROUTES (accessible to everyone)
 *    - / - Marketing landing page
 *    - /clock - Public market clock experience
 *    - /app - Noindex app shell for users who prefer the legacy route
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
/**
 * Global Push Permission Handler
 * Prompts PWA users for notification permission if they have push reminders
 */
function PushPermissionHandler() {
  const { shouldShowModal, dismissModal, requestPermission, isRequesting } = usePushPermissionPrompt();

  if (!shouldShowModal) return null;

  return (
    <Suspense fallback={null}>
      <PushPermissionModal
        open={shouldShowModal}
        onClose={dismissModal}
        onRequestPermission={requestPermission}
        isRequesting={isRequesting}
      />
    </Suspense>
  );
}

/**
 * BEP: Deferred CookiesBanner - renders last after clock canvas
 * Uses requestIdleCallback to defer banner mount until main thread is idle
 * Banner has internal 5s delay before showing anyway
 */
function DeferredCookiesBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof requestIdleCallback !== 'undefined') {
      const idleCallback = requestIdleCallback(() => {
        setShowBanner(true);
      }, { timeout: 500 });
      return () => cancelIdleCallback(idleCallback);
    } else {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showBanner) return null;

  return (
    <Suspense fallback={null}>
      <CookiesBanner />
    </Suspense>
  );
}

export default function AppRoutes() {
  return (
    <>
      <Suspense fallback={null}><EmailLinkHandler /></Suspense>
      <AnalyticsInitializer />
      <DeferredCookiesBanner />
      <PushPermissionHandler />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* ==================== PUBLIC ROUTES ==================== */}

          {/* Landing Page - SEO-optimized marketing page (HomePage2) */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />

          {/* Public Market Clock - Interactive clock UI */}
          <Route
            path="/clock"
            element={
              <PublicRoute>
                <ClockPage />
              </PublicRoute>
            }
          />

          {/* Legacy Application Route - Noindex app shell */}
          <Route
            path="/app"
            element={
              <PublicRoute>
                <HomePage />
              </PublicRoute>
            }
          />

          {/* About Page - Accessible to everyone */}
          <Route
            path="/about"
            element={
              <PublicRoute>
                <AboutPage />
              </PublicRoute>
            }
          />

          {/* Privacy Page - Accessible to everyone */}
          <Route
            path="/privacy"
            element={
              <PublicRoute>
                <PrivacyPage />
              </PublicRoute>
            }
          />

          {/* Terms Page - Accessible to everyone */}
          <Route
            path="/terms"
            element={
              <PublicRoute>
                <TermsPage />
              </PublicRoute>
            }
          />

          {/* Contact Page - Accessible to everyone */}
          <Route
            path="/contact"
            element={
              <PublicRoute>
                <ContactPage />
              </PublicRoute>
            }
          />

          {/* Calendar Page - Primary /calendar route with two-column layout */}
          <Route
            path="/calendar"
            element={
              <PublicRoute>
                <Calendar2Page />
              </PublicRoute>
            }
          />

          {/* Event Detail Page - SEO-optimized individual event pages */}
          <Route
            path="/events/:eventId"
            element={
              <PublicRoute>
                <EventPage />
              </PublicRoute>
            }
          />

          {/* Blog Pages - Public (Phase 3) */}
          <Route
            path="/blog"
            element={
              <PublicRoute>
                <BlogListPage />
              </PublicRoute>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <PublicRoute>
                <BlogPostPage />
              </PublicRoute>
            }
          />

          {/* Blog Taxonomy Pages - Public (Phase 5.B) */}
          {/* Combined event+currency route must come BEFORE single event route */}
          <Route
            path="/blog/event/:eventKey/:currency"
            element={
              <PublicRoute>
                <BlogEventCurrencyHubPage />
              </PublicRoute>
            }
          />
          <Route
            path="/blog/event/:eventKey"
            element={
              <PublicRoute>
                <BlogEventHubPage />
              </PublicRoute>
            }
          />
          <Route
            path="/blog/currency/:currency"
            element={
              <PublicRoute>
                <BlogCurrencyHubPage />
              </PublicRoute>
            }
          />
          <Route
            path="/blog/author/:authorSlug"
            element={
              <PublicRoute>
                <BlogAuthorPage />
              </PublicRoute>
            }
          />
          <Route
            path="/blog/category/:category"
            element={
              <PublicRoute>
                <BlogCategoryHubPage />
              </PublicRoute>
            }
          />
          <Route
            path="/blog/tag/:tagSlug"
            element={
              <PublicRoute>
                <BlogTagHubPage />
              </PublicRoute>
            }
          />

          {/* Login Page - Standalone passwordless authentication */}
          <Route
            path="/login"
            element={
              <PublicRoute restricted={true} redirectTo="/clock">
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* ==================== ADMIN ROUTES ==================== */}
          {/* All admin routes wrapped in AdminLayout (AdminNavBar + Outlet) */}
          {/* PrivateRoute on parent ensures auth; per-child PrivateRoute enforces RBAC */}
          <Route
            path="/admin"
            element={
              <PrivateRoute roles={['superadmin', 'admin', 'author']} redirectTo="/login">
                <AdminLayout />
              </PrivateRoute>
            }
          >
            {/* Admin Dashboard - index route */}
            <Route index element={<AdminDashboardPage />} />

            {/* Blog CMS - List all posts */}
            <Route path="blog" element={<AdminBlogPage />} />

            {/* Blog CMS - Create new post */}
            <Route path="blog/new" element={<AdminBlogEditorPage />} />

            {/* Blog CMS - Edit existing post */}
            <Route path="blog/edit/:postId" element={<AdminBlogEditorPage />} />

            {/* Blog CMS - Manage authors (admin/superadmin only) */}
            <Route
              path="blog/authors"
              element={
                <PrivateRoute roles={['superadmin', 'admin']} redirectTo="/admin">
                  <AdminBlogAuthorsPage />
                </PrivateRoute>
              }
            />

            {/* Event Management - Admin and Superadmin */}
            <Route
              path="events"
              element={
                <PrivateRoute roles={['superadmin', 'admin']} redirectTo="/admin">
                  <AdminEventsPage />
                </PrivateRoute>
              }
            />

            {/* Descriptions Management - Admin and Superadmin */}
            <Route
              path="descriptions"
              element={
                <PrivateRoute roles={['superadmin', 'admin']} redirectTo="/admin">
                  <AdminDescriptionsPage />
                </PrivateRoute>
              }
            />

            {/* Upload Event Descriptions - Superadmin only */}
            <Route
              path="upload-desc"
              element={
                <PrivateRoute roles={['superadmin']} redirectTo="/admin">
                  <UploadDescriptions />
                </PrivateRoute>
              }
            />

            {/* Export Events - Superadmin only */}
            <Route
              path="export"
              element={
                <PrivateRoute roles={['superadmin']} redirectTo="/admin">
                  <ExportEvents />
                </PrivateRoute>
              }
            />

            {/* FF-T2T GPT Uploader - Superadmin only */}
            <Route
              path="fft2t"
              element={
                <PrivateRoute roles={['superadmin']} redirectTo="/admin">
                  <FFTTUploader />
                </PrivateRoute>
              }
            />
          </Route>

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
    </>
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
