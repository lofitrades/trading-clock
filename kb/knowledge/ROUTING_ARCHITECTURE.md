# React Router Architecture - Visual Guide

## 🏗️ Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  URL: http://localhost:5173/trading-clock/export                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BrowserRouter                                 │
│              basename="/trading-clock"                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ThemeProvider (MUI)                           │
│                  Custom theme applied                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AuthProvider                                  │
│  - Firebase auth state                                           │
│  - User profile from Firestore                                   │
│  - Role checking (hasRole, isAdmin)                             │
│  - Subscription checking (hasPlan)                              │
│  - Feature checking (hasFeature)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SettingsProvider                               │
│  - Clock settings                                                │
│  - User preferences                                              │
│  - Firestore sync                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AppRoutes                                   │
│  - Route configuration                                           │
│  - Lazy loading                                                  │
│  - Suspense fallback                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        ┌──────────────┐          ┌──────────────┐
        │ PublicRoute  │          │ PrivateRoute │
        │  - Anyone    │          │  - Auth req. │
        │  - Optional  │          │  - Role req. │
        │    restrict  │          │  - Plan req. │
        └──────────────┘          │  - Feature   │
                                  └──────────────┘
                │                           │
                ▼                           ▼
        ┌──────────────┐          ┌──────────────┐
        │  Component   │          │  Component   │
        │   (Lazy)     │          │   (Lazy)     │
        └──────────────┘          └──────────────┘
```

---

## 🔄 Request Flow

### Example: User Visits `/export`

```
1. Browser → /trading-clock/export
           │
           ▼
2. BrowserRouter matches route
           │
           ▼
3. AppRoutes finds matching <Route>
           │
           ▼
4. PrivateRoute guard checks:
   ┌─────────────────────────┐
   │ Is user authenticated?  │ → NO → Redirect to /
   └─────────────────────────┘
           │ YES
           ▼
   ┌─────────────────────────┐
   │ Does user have role?    │ → NO → Show "Access Denied"
   │ Required: admin         │
   └─────────────────────────┘
           │ YES
           ▼
5. Component loads (lazy)
           │
           ▼
6. Component rendered
```

---

## 🎭 Role-Based Access Flow

```
User Login
    │
    ▼
Firebase Authentication
    │
    ▼
AuthContext loads user profile from Firestore
    │
    ├─→ user.role = 'user'
    ├─→ user.role = 'admin'
    └─→ user.role = 'superadmin'
    │
    ▼
Route Guard Checks
    │
    ├─→ hasRole(['admin', 'superadmin']) ?
    ├─→ hasPlan(['premium', 'pro']) ?
    └─→ hasFeature('api_access') ?
    │
    ▼
Access Decision
    │
    ├─→ ✅ Grant Access → Render Component
    └─→ ❌ Deny Access → Show Error Message
```

---

## 📊 Data Flow

### User Profile Loading

```
User Logs In
    │
    ▼
Firebase Auth State Change
    │
    ▼
AuthContext.useEffect triggers
    │
    ▼
Fetch user document from Firestore
    │
    ├─→ Document exists? → Load profile
    └─→ Document missing? → Create default profile
    │
    ▼
Real-time listener established
    │
    ▼
Profile updates automatically on Firestore changes
```

### Route Access Check

```
Component Renders
    │
    ▼
PrivateRoute wrapper
    │
    ▼
Check authentication state
    │
    ├─→ Loading? → Show spinner
    ├─→ Not authenticated? → Redirect
    └─→ Authenticated? → Continue
    │
    ▼
Check role requirement (if specified)
    │
    ├─→ Role matches? → Continue
    └─→ Role doesn't match? → Show "Access Denied"
    │
    ▼
Check subscription requirement (if specified)
    │
    ├─→ Plan matches? → Continue
    └─→ Plan doesn't match? → Show "Upgrade Required"
    │
    ▼
Check feature requirement (if specified)
    │
    ├─→ Feature available? → Continue
    └─→ Feature missing? → Show "Feature Not Available"
    │
    ▼
Render Protected Component
```

---

## 🗂️ File Organization

```
src/
├── main.jsx                     ← Entry point
│   └── BrowserRouter setup
│
├── routes/
│   └── AppRoutes.jsx            ← Route configuration
│       ├── Public routes
│       ├── Private routes
│       ├── Admin routes
│       └── Premium routes
│
├── components/
│   ├── routes/
│   │   ├── PrivateRoute.jsx     ← Auth + role guard
│   │   └── PublicRoute.jsx      ← Public guard
│   │
│   ├── App.jsx                  ← Main clock component
│   ├── ExportEvents.jsx         ← Admin: Export data
│   └── UploadDescriptions.jsx   ← Admin: Upload data
│
├── contexts/
│   ├── AuthContext.jsx          ← Auth + user profile
│   └── SettingsContext.jsx      ← User settings
│
└── types/
    └── userTypes.js             ← Roles, plans, features
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: UI/UX                            │
│  - PrivateRoute component                                    │
│  - Shows "Access Denied" messages                           │
│  - Redirects unauthenticated users                          │
│  - NOT SECURITY - Just user experience                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Layer 2: Firestore Rules                      │
│  - Validates user role in Firestore                         │
│  - Checks subscription status                               │
│  - Enforces read/write permissions                          │
│  - REAL SECURITY - Backend enforcement                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Layer 3: Cloud Functions                        │
│  - Additional validation                                     │
│  - Business logic enforcement                               │
│  - Data transformation                                       │
│  - REAL SECURITY - Server-side logic                         │
└─────────────────────────────────────────────────────────────┘
```

**Key Point:** All 3 layers work together. UI guards provide good UX, but Firestore rules and Cloud Functions provide actual security.

---

## 🎯 Route Configuration Patterns

### Pattern 1: Simple Public Route
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

### Pattern 2: Simple Private Route
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

### Pattern 3: Role-Based Route
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

### Pattern 4: Subscription-Based Route
```jsx
<Route 
  path="/premium" 
  element={
    <PrivateRoute plans={['premium', 'pro']}>
      <PremiumFeature />
    </PrivateRoute>
  } 
/>
```

### Pattern 5: Feature-Based Route
```jsx
<Route 
  path="/api" 
  element={
    <PrivateRoute feature="api_access">
      <ApiSettings />
    </PrivateRoute>
  } 
/>
```

### Pattern 6: Combined Restrictions
```jsx
<Route 
  path="/super-admin" 
  element={
    <PrivateRoute 
      roles={['superadmin']}
      plans={['pro']}
      feature="system_settings"
    >
      <SuperAdminPanel />
    </PrivateRoute>
  } 
/>
```

---

## 🔄 State Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│                      Component Tree                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  BrowserRouter                                               │
│    │                                                          │
│    └─→ ThemeProvider                                         │
│         │                                                     │
│         └─→ AuthProvider ← Firebase Auth + Firestore         │
│              │              (User, Profile, Roles, Plans)    │
│              │                                                │
│              └─→ SettingsProvider ← Firestore Settings       │
│                   │                 (Clock, Timezone, etc.)  │
│                   │                                           │
│                   └─→ AppRoutes ← React Router               │
│                        │           (Route matching)          │
│                        │                                      │
│                        └─→ Route Guards                       │
│                             │      (Access control)          │
│                             │                                 │
│                             └─→ Components                    │
│                                  (UI rendering)              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📱 Navigation Patterns

### Using Link Component
```jsx
import { Link } from 'react-router-dom';

<Link to="/">Home</Link>
<Link to="/export">Export</Link>
<Link to="/dashboard">Dashboard</Link>
```

### Using useNavigate Hook
```jsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/dashboard');
  };
  
  const handleBack = () => {
    navigate(-1);  // Go back
  };
  
  const handleReplace = () => {
    navigate('/home', { replace: true });  // Replace history
  };
}
```

### Programmatic with State
```jsx
const navigate = useNavigate();

// Navigate with state
navigate('/profile', { 
  state: { from: location.pathname } 
});

// Access state in destination
import { useLocation } from 'react-router-dom';

function Profile() {
  const location = useLocation();
  const from = location.state?.from || '/';
}
```

---

## 🎓 Access Control Examples

### Example 1: Show/Hide UI Elements
```jsx
import { useAuth } from './contexts/AuthContext';

function Navigation() {
  const { isAuthenticated, isAdmin, hasPlan } = useAuth();
  
  return (
    <nav>
      <Link to="/">Home</Link>
      
      {isAuthenticated() && (
        <Link to="/settings">Settings</Link>
      )}
      
      {isAdmin() && (
        <>
          <Link to="/export">Export</Link>
          <Link to="/admin">Admin</Link>
        </>
      )}
      
      {hasPlan(['premium', 'pro']) && (
        <Link to="/dashboard">Dashboard</Link>
      )}
    </nav>
  );
}
```

### Example 2: Feature Flags
```jsx
import { useAuth } from './contexts/AuthContext';

function Features() {
  const { hasFeature } = useAuth();
  
  return (
    <div>
      {hasFeature('advanced_charts') && (
        <AdvancedCharts />
      )}
      
      {hasFeature('custom_alerts') && (
        <CustomAlerts />
      )}
      
      {hasFeature('api_access') && (
        <ApiSettings />
      )}
    </div>
  );
}
```

### Example 3: Conditional Rendering
```jsx
import { useAuth } from './contexts/AuthContext';

function Dashboard() {
  const { userProfile } = useAuth();
  
  if (!userProfile) {
    return <div>Loading...</div>;
  }
  
  if (userProfile.subscription.plan === 'free') {
    return <UpgradePrompt />;
  }
  
  if (userProfile.subscription.plan === 'premium') {
    return <PremiumDashboard />;
  }
  
  return <ProDashboard />;
}
```

---

## 🚀 Performance Optimization

### Code Splitting
```
Before React Router:
├── main.bundle.js (1.2 MB)

After React Router:
├── main.bundle.js (800 KB)
├── App.lazy.js (200 KB) ← Loaded on demand
├── Export.lazy.js (100 KB) ← Loaded on demand
└── Upload.lazy.js (100 KB) ← Loaded on demand
```

### Lazy Loading Implementation
```jsx
// In AppRoutes.jsx
const MainApp = lazy(() => import('../App'));
const ExportEvents = lazy(() => import('../components/ExportEvents'));
const UploadDescriptions = lazy(() => import('../components/UploadDescriptions'));

// Wrapped in Suspense
<Suspense fallback={<LoadingFallback />}>
  <Routes>
    {/* Routes here */}
  </Routes>
</Suspense>
```

---

## 📈 Scalability

### Adding New Role
```javascript
// 1. Add to userTypes.js
export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',  // NEW
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

// 2. Use in route
<Route 
  path="/moderate" 
  element={
    <PrivateRoute roles={['moderator', 'admin']}>
      <ModeratorPanel />
    </PrivateRoute>
  } 
/>

// 3. Update Firestore rules
function isModerator() {
  return getUserProfile().role in ['moderator', 'admin', 'superadmin'];
}
```

### Adding New Plan
```javascript
// 1. Add to userTypes.js
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',  // NEW
  PRO: 'pro',
};

// 2. Define features
export const PLAN_FEATURES = {
  [SUBSCRIPTION_PLANS.ENTERPRISE]: [
    // ... all pro features
    FEATURES.CUSTOM_BRANDING,
    FEATURES.DEDICATED_SUPPORT,
    FEATURES.SLA_GUARANTEE,
  ],
};

// 3. Use in route
<Route 
  path="/enterprise" 
  element={
    <PrivateRoute plans={['enterprise']}>
      <EnterpriseFeatures />
    </PrivateRoute>
  } 
/>
```

---

**Version:** 1.0.0  
**Last Updated:** November 30, 2025  
**Purpose:** Visual guide to understand React Router architecture
