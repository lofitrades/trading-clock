# React Router - Quick Start Guide

## ✅ Installation Complete

React Router v6 has been successfully installed and configured with:
- Public routes
- Private routes (auth required)
- Role-based access control (RBAC)
- Subscription-based access control
- Feature-gated routes

## 🚀 Quick Start

### Accessing Routes

```
Home Page:       http://localhost:5173/trading-clock/
Export (Admin):  http://localhost:5173/trading-clock/export
Upload (Admin):  http://localhost:5173/trading-clock/upload-desc
```

### Navigation in Code

```jsx
import { Link, useNavigate } from 'react-router-dom';

// Using Link component
<Link to="/export">Export Data</Link>

// Programmatic navigation
const navigate = useNavigate();
navigate('/dashboard');
```

## 📝 Adding New Routes

### 1. Public Route (Everyone Can Access)

```jsx
// In src/routes/AppRoutes.jsx
<Route
  path="/your-page"
  element={
    <PublicRoute>
      <YourComponent />
    </PublicRoute>
  }
/>
```

### 2. Private Route (Login Required)

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

### 3. Admin Route (Admin Role Required)

```jsx
<Route
  path="/admin-panel"
  element={
    <PrivateRoute roles={['admin', 'superadmin']}>
      <AdminPanel />
    </PrivateRoute>
  }
/>
```

### 4. Premium Route (Subscription Required)

```jsx
<Route
  path="/premium-feature"
  element={
    <PrivateRoute plans={['premium', 'pro']}>
      <PremiumFeature />
    </PrivateRoute>
  }
/>
```

### 5. Feature-Gated Route

```jsx
<Route
  path="/special-tool"
  element={
    <PrivateRoute feature="api_access">
      <ApiTool />
    </PrivateRoute>
  }
/>
```

## 🔐 Using Auth Context

```jsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const {
    user,            // Firebase auth user
    userProfile,     // Full user profile
    isAuthenticated, // Function: check if logged in
    hasRole,         // Function: check role
    hasPlan,         // Function: check subscription
    hasFeature,      // Function: check feature access
    isAdmin,         // Function: check if admin
  } = useAuth();

  // Check authentication
  if (!isAuthenticated()) {
    return <div>Please log in</div>;
  }

  // Check role
  if (hasRole('admin')) {
    // Show admin UI
  }

  // Check subscription
  if (hasPlan(['premium', 'pro'])) {
    // Show premium features
  }

  // Check feature
  if (hasFeature('api_access')) {
    // Show API settings
  }

  return <div>Hello {userProfile.email}</div>;
}
```

## 🎭 User Roles

### Available Roles
- `user` - Default role (features based on subscription)
- `admin` - Administrator (all pro features + admin tools)
- `superadmin` - Super admin (full system access)

### Setting User Role (Firestore)
```javascript
// In Firestore Console or Cloud Function
users/{userId}
  {
    role: 'admin',  // Change to 'user', 'admin', or 'superadmin'
    // ... other fields
  }
```

## 💳 Subscription Plans

### Available Plans
- `free` - Free tier (default)
- `premium` - Premium subscription
- `pro` - Professional subscription

### Setting User Plan (Firestore)
```javascript
// In Firestore Console or Cloud Function
users/{userId}
  {
    subscription: {
      plan: 'premium',
      status: 'active',
      features: ['advanced_charts', 'custom_alerts', ...],
      startDate: Timestamp,
      endDate: Timestamp,
    },
    // ... other fields
  }
```

## 🛠️ Features System

### Available Features

**Free:**
- `basic_clock`
- `session_tracking`
- `timezone_selection`
- `basic_events`

**Premium:**
- All free features +
- `advanced_charts`
- `custom_alerts`
- `event_notifications`
- `multiple_timezones`
- `export_data`

**Pro:**
- All premium features +
- `api_access`
- `webhook_integration`
- `advanced_analytics`
- `custom_integrations`
- `priority_support`

**Admin:**
- All pro features +
- `manage_users`
- `manage_content`
- `system_settings`
- `view_analytics`
- `export_all_data`

## 📊 Firestore User Document

```javascript
// Collection: users
// Document ID: {Firebase Auth UID}
{
  // Basic Info
  email: "user@example.com",
  displayName: "John Doe",
  photoURL: "https://...",
  
  // Role
  role: "user",  // 'user' | 'admin' | 'superadmin'
  
  // Subscription
  subscription: {
    plan: "free",  // 'free' | 'premium' | 'pro'
    status: "active",
    features: ["basic_clock", "session_tracking"],
    startDate: Timestamp,
    endDate: Timestamp,
  },
  
  // Settings (existing)
  settings: { /* your settings */ },
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLoginAt: Timestamp,
}
```

## 🧪 Testing Routes Locally

### Test as Regular User (No Auth)
1. Don't log in
2. Visit `/export` - Should redirect to home
3. Visit `/` - Should work

### Test as Authenticated User
1. Log in with email/password
2. User profile loads automatically
3. Default role: `user`, plan: `free`

### Test as Admin
1. Update Firestore:
   ```javascript
   users/{yourUserId}
     { role: 'admin' }
   ```
2. Refresh page
3. Visit `/export` - Should work
4. Visit `/upload-desc` - Should work

### Test Premium Features (Future)
1. Update Firestore:
   ```javascript
   users/{yourUserId}
     {
       subscription: {
         plan: 'premium',
         status: 'active',
         features: [ /* premium features */ ]
       }
     }
   ```
2. Refresh page
3. Premium routes should be accessible

## 🔍 Debugging

### Check Auth State
```jsx
import { useAuth } from './contexts/AuthContext';

function DebugPanel() {
  const { user, userProfile, loading, profileLoading } = useAuth();
  
  return (
    <div>
      <h3>Auth Debug</h3>
      <p>Loading: {loading ? 'Yes' : 'No'}</p>
      <p>Profile Loading: {profileLoading ? 'Yes' : 'No'}</p>
      <p>User: {user ? user.email : 'Not logged in'}</p>
      <p>Role: {userProfile?.role || 'None'}</p>
      <p>Plan: {userProfile?.subscription?.plan || 'None'}</p>
      <pre>{JSON.stringify(userProfile, null, 2)}</pre>
    </div>
  );
}
```

### Browser Console
```javascript
// In browser console
// Check auth state
console.log('Auth:', auth.currentUser);

// Check Firestore connection
console.log('Firestore:', db);
```

## 📁 File Structure

```
src/
  routes/
    AppRoutes.jsx           ← Main route configuration
  components/
    routes/
      PrivateRoute.jsx      ← Protected route guard
      PublicRoute.jsx       ← Public route component
  contexts/
    AuthContext.jsx         ← Enhanced auth context
  types/
    userTypes.js            ← Role/plan/feature definitions
  main.jsx                  ← BrowserRouter setup
  App.jsx                   ← Main app component (no routing)
```

## 🚨 Important Notes

### Security
- ⚠️ **Route guards are UI only** - not security!
- ✅ **Always enforce permissions in Firestore rules**
- ✅ **Validate on backend (Cloud Functions)**

### Migration from Hash Routing
- Old: `#/export` → New: `/export`
- Update all links from `href="#/page"` to `<Link to="/page">`
- Remove `#` from URLs

### GitHub Pages
- Basename is set to `/trading-clock`
- Routes work: `/trading-clock/export`
- 404 handling configured

## 📚 Documentation

**Full Documentation:** See `ROUTING_IMPLEMENTATION.md`

**Topics Covered:**
- Architecture overview
- Route configuration examples
- User roles & permissions
- Subscription management
- Firestore structure
- Security best practices
- Performance optimization
- Troubleshooting guide

## ✅ Ready to Use!

The routing system is fully implemented and production-ready:
- ✅ React Router v6 installed
- ✅ Public/private routes configured
- ✅ RBAC system ready
- ✅ Subscription system prepared
- ✅ Feature-gating supported
- ✅ Loading states implemented
- ✅ Error handling complete
- ✅ Documentation comprehensive

**Start the dev server:** `npm run dev`  
**Test routes:** Visit `http://localhost:5173/trading-clock/`

---

**Questions?** See `ROUTING_IMPLEMENTATION.md` for complete details.
