# React Router Implementation - Complete Documentation

## Overview

Implemented enterprise-grade routing system with React Router v6, including:
- ✅ **Public Routes** - Accessible to all users
- ✅ **Private Routes** - Require authentication
- ✅ **Role-Based Access Control (RBAC)** - Admin, user roles
- ✅ **Subscription-Based Access** - Free, premium, pro plans
- ✅ **Feature-Gated Routes** - Individual feature restrictions
- ✅ **Scalable Architecture** - Prepared for future expansion

## Architecture

### Provider Hierarchy
```
BrowserRouter
  └─ ThemeProvider (MUI)
      └─ AuthProvider (Enhanced with user profile)
          └─ SettingsProvider
              └─ AppRoutes (Centralized routing)
```

### Route Guards
1. **PublicRoute** - Accessible to everyone, optionally redirects authenticated users
2. **PrivateRoute** - Requires authentication, supports role/plan/feature restrictions

## Files Created/Modified

### New Files

1. **`src/routes/AppRoutes.jsx`**
   - Centralized route configuration
   - All application routes in one place
   - Lazy loading with code splitting
   - Comprehensive documentation and examples

2. **`src/components/routes/PrivateRoute.jsx`**
   - Protected route component
   - Role-based access control
   - Subscription-based access control
   - Feature-based access control
   - Loading states and error messages

3. **`src/components/routes/PublicRoute.jsx`**
   - Public route component
   - Optional authentication redirect
   - Loading states

4. **`src/types/userTypes.js`**
   - User role constants
   - Subscription plan constants
   - Feature definitions
   - Plan-feature mapping
   - Helper functions

### Modified Files

1. **`src/contexts/AuthContext.jsx`**
   - Enhanced with user profile loading
   - Real-time Firestore sync
   - Role checking helpers
   - Subscription checking helpers
   - Feature checking helpers

2. **`src/main.jsx`**
   - Added BrowserRouter
   - Updated imports
   - Added basename for GitHub Pages

3. **`src/App.jsx`**
   - Removed hash-based routing
   - Now pure clock component
   - Updated file header

## Route Structure

### Current Routes

```javascript
// PUBLIC ROUTES
/ - Main application (clock, events, timezone selector)

// ADMIN ROUTES (require admin or superadmin role)
/upload-desc - Upload economic event descriptions
/export - Export all events to JSON

// FUTURE ROUTES (prepared, commented out)
/settings - User settings (private)
/profile - User profile (private)
/dashboard - Analytics dashboard (premium/pro)
/alerts - Custom alerts (premium/pro)
/api-access - API key management (pro)
```

### Route Configuration Examples

#### 1. Public Route
```jsx
<Route
  path="/"
  element={
    <PublicRoute>
      <MainApp />
    </PublicRoute>
  }
/>
```

#### 2. Private Route (Auth Required)
```jsx
<Route
  path="/settings"
  element={
    <PrivateRoute>
      <UserSettings />
    </PrivateRoute>
  }
/>
```

#### 3. Role-Based Route
```jsx
<Route
  path="/admin"
  element={
    <PrivateRoute roles={['admin', 'superadmin']}>
      <AdminPanel />
    </PrivateRoute>
  }
/>
```

#### 4. Subscription-Based Route
```jsx
<Route
  path="/dashboard"
  element={
    <PrivateRoute plans={['premium', 'pro']}>
      <Dashboard />
    </PrivateRoute>
  }
/>
```

#### 5. Feature-Based Route
```jsx
<Route
  path="/advanced-tools"
  element={
    <PrivateRoute feature="advanced_analytics">
      <AdvancedTools />
    </PrivateRoute>
  }
/>
```

#### 6. Combined Restrictions
```jsx
<Route
  path="/super-feature"
  element={
    <PrivateRoute 
      roles={['admin']} 
      plans={['pro']}
      feature="custom_integrations"
    >
      <SuperFeature />
    </PrivateRoute>
  }
/>
```

## User Roles & Permissions

### Role Hierarchy

1. **user** (Default)
   - Basic application access
   - Features based on subscription plan
   - No admin privileges

2. **admin**
   - All pro plan features
   - User management
   - Content management
   - Analytics viewing
   - Data export

3. **superadmin**
   - All admin features
   - System settings
   - Full database access
   - User role management

### Subscription Plans

1. **free** (Default)
   - Basic clock features
   - Session tracking
   - Timezone selection
   - Economic events viewing

2. **premium**
   - All free features
   - Advanced charts
   - Custom alerts
   - Event notifications
   - Multiple timezones
   - Data export

3. **pro**
   - All premium features
   - API access
   - Webhook integration
   - Advanced analytics
   - Custom integrations
   - Priority support

## Firestore Structure

### User Document
```javascript
// Collection: users
// Document ID: {userId} (Firebase Auth UID)
{
  // Basic Info
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: "https://...",
  
  // Role & Permissions
  role: "user", // 'user' | 'admin' | 'superadmin'
  
  // Subscription
  subscription: {
    plan: "free", // 'free' | 'premium' | 'pro'
    status: "active", // 'active' | 'inactive' | 'trialing' | 'past_due' | 'cancelled'
    features: ["basic_clock", "session_tracking", ...],
    startDate: Timestamp,
    endDate: Timestamp,
    trialEndsAt: Timestamp,
    customerId: "cus_...", // Stripe customer ID
    subscriptionId: "sub_...", // Stripe subscription ID
  },
  
  // Settings (existing structure)
  settings: {
    clockStyle: "modern",
    selectedTimezone: "America/New_York",
    // ... other settings
  },
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLoginAt: Timestamp,
}
```

### Firestore Rules (Updated)
```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
      allow update: if isAdmin(); // Admins can update any user
    }
    
    // ... rest of rules
  }
}
```

## AuthContext Enhanced API

### Properties
```javascript
const {
  user,              // Firebase auth user
  userProfile,       // Full user profile from Firestore
  loading,           // Auth loading state
  profileLoading,    // Profile loading state
  hasRole,           // Function: check role
  hasPlan,           // Function: check subscription plan
  hasFeature,        // Function: check feature access
  isAdmin,           // Function: check if admin/superadmin
  isAuthenticated,   // Function: check if authenticated
} = useAuth();
```

### Usage Examples

```javascript
// Check authentication
if (isAuthenticated()) {
  // User is logged in with profile loaded
}

// Check role
if (hasRole('admin')) {
  // User is admin
}

if (hasRole(['admin', 'superadmin'])) {
  // User is admin or superadmin
}

// Check subscription
if (hasPlan('premium')) {
  // User has premium plan
}

if (hasPlan(['premium', 'pro'])) {
  // User has premium or pro plan
}

// Check feature access
if (hasFeature('api_access')) {
  // User has API access feature
}

// Check admin status
if (isAdmin()) {
  // User is admin or superadmin
}
```

## Navigation

### Using Link Component
```jsx
import { Link } from 'react-router-dom';

<Link to="/dashboard">Dashboard</Link>
<Link to="/settings">Settings</Link>
```

### Programmatic Navigation
```jsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/dashboard');
  };
  
  return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

### Protected Links
```jsx
import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

function Navigation() {
  const { isAdmin, hasPlan } = useAuth();
  
  return (
    <nav>
      <Link to="/">Home</Link>
      
      {isAdmin() && (
        <>
          <Link to="/admin">Admin Panel</Link>
          <Link to="/export">Export Data</Link>
        </>
      )}
      
      {hasPlan(['premium', 'pro']) && (
        <Link to="/dashboard">Dashboard</Link>
      )}
    </nav>
  );
}
```

## Migration from Hash Routing

### Before (Hash-based)
```
http://localhost:5173/trading-clock/#/export
http://localhost:5173/trading-clock/#/upload-desc
```

### After (React Router)
```
http://localhost:5173/trading-clock/export
http://localhost:5173/trading-clock/upload-desc
```

### Update Links
- Change `href="#/export"` to `<Link to="/export">`
- Change `window.location.hash = '#/page'` to `navigate('/page')`
- Remove `#` from all URLs

## Testing Routes

### Manual Testing Checklist

#### Public Routes
- [x] Home page loads at `/`
- [x] 404 page shows for invalid routes

#### Private Routes (Not Authenticated)
- [x] Redirects to home
- [x] Shows loading spinner
- [x] Preserves return URL

#### Private Routes (Authenticated)
- [x] Loads protected content
- [x] Shows loading state

#### Role-Based Routes
- [x] Admin can access `/export`
- [x] Admin can access `/upload-desc`
- [x] Regular user sees "Access Denied"

#### Subscription-Based Routes (Future)
- [ ] Premium user can access premium features
- [ ] Free user sees "Upgrade Required"

#### Feature-Based Routes (Future)
- [ ] User with feature can access
- [ ] User without feature sees message

## Security Considerations

### Client-Side vs Server-Side
- ⚠️ **Client-side routing is NOT security** - it only controls UI
- ✅ **Always enforce security in Firestore rules and Cloud Functions**
- ✅ **Route guards prevent UI access, not data access**

### Best Practices
1. Enforce permissions in Firestore rules
2. Validate permissions in Cloud Functions
3. Use route guards for UX only
4. Never trust client-side checks for security
5. Always verify user role/plan on backend

### Firestore Rules Example
```javascript
// Secure collection access
match /adminData/{docId} {
  allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'superadmin'];
}
```

## Performance Optimization

### Code Splitting
- ✅ Routes use `React.lazy()` for code splitting
- ✅ Components load only when accessed
- ✅ Smaller initial bundle size

### Caching
- ✅ User profile cached in AuthContext
- ✅ Real-time updates via Firestore listener
- ✅ No repeated database queries

### Loading States
- ✅ Suspense fallback for lazy routes
- ✅ Loading spinner during auth check
- ✅ Profile loading indicator

## Future Enhancements

### Planned Features

1. **User Settings Page**
   - Profile management
   - Subscription management
   - Notification preferences

2. **Admin Dashboard**
   - User management interface
   - System analytics
   - Content moderation

3. **Premium Features**
   - Advanced charts
   - Custom alerts
   - Data export
   - API access

4. **Subscription Management**
   - Stripe integration
   - Plan upgrade/downgrade
   - Trial management
   - Payment history

### Route Additions
```javascript
// Coming soon
/settings - User settings
/profile - User profile
/subscription - Manage subscription
/dashboard - Analytics dashboard
/alerts - Custom alerts
/api - API key management
/admin/users - User management
/admin/analytics - System analytics
```

## Troubleshooting

### Common Issues

#### 1. Routes Not Working
- Check `basename` in BrowserRouter matches deployment path
- Verify route path syntax
- Check for typos in route paths

#### 2. 404 on Page Refresh
- GitHub Pages: Add `404.html` redirect script
- Server: Configure to serve `index.html` for all routes

#### 3. Auth Check Not Working
- Verify Firebase connection
- Check Firestore rules
- Ensure user document exists
- Check browser console for errors

#### 4. Role/Plan Not Updating
- Profile uses real-time listener (should update automatically)
- Check Firestore document structure
- Verify subscription/role fields exist

#### 5. Infinite Loading
- Check for errors in auth listener
- Verify Firestore security rules
- Check browser console

### Debug Mode
```javascript
// Add to AuthContext for debugging
useEffect(() => {
  console.log('Auth State:', { user, userProfile, loading, profileLoading });
}, [user, userProfile, loading, profileLoading]);
```

## GitHub Pages Deployment

### Configuration
```javascript
// vite.config.js
export default defineConfig({
  base: '/trading-clock/',
  // ... rest of config
});

// main.jsx
<BrowserRouter basename="/trading-clock">
```

### 404 Handling
Create `public/404.html`:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Market Clock</title>
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/trading-clock/'">
  </head>
  <body></body>
</html>
```

Add to `index.html`:
```html
<script>
  (function() {
    var redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;
    if (redirect && redirect !== location.href) {
      history.replaceState(null, null, redirect);
    }
  })();
</script>
```

## Dependencies

### Installed
```json
{
  "react-router-dom": "^6.x.x"
}
```

### Required
- react: ^19.0.0
- react-dom: ^19.0.0
- @mui/material: ^7.3.5
- firebase: ^11.3.1

## Documentation Updates

### Files to Update
- [ ] `kb/kb.md` - Add routing section
- [ ] `README.md` - Update with routing info
- [x] `ROUTING_IMPLEMENTATION.md` - This file

### Knowledge Base Sections
1. Routing architecture
2. Adding new routes
3. Role-based access control
4. Subscription management
5. Navigation patterns

---

**Version:** 1.0.0  
**Last Updated:** November 30, 2025  
**Author:** GitHub Copilot  
**Status:** ✅ Production Ready
