# Time 2 Trade - Developer Knowledge Base

**Last Updated:** January 6, 2026  
**Version:** 2.7.0  
**Maintainer:** Lofi Trades Development Team

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Development Environment](#development-environment)
5. [Project Structure](#project-structure)
6. [Core Features](#core-features)
7. [Firebase Services](#firebase-services)
8. [API Integration](#api-integration)
9. [State Management](#state-management)
10. [Component Architecture](#component-architecture)
11. [Data Models](#data-models)
12. [Configuration Management](#configuration-management)
13. [Build & Deployment](#build--deployment)
14. [Testing Strategy](#testing-strategy)
15. [Performance Optimization](#performance-optimization)
16. [Security Considerations](#security-considerations)
17. [Troubleshooting Guide](#troubleshooting-guide)
18. [Change Log](#change-log)
19. [TargetAudience.md](TargetAudience.md)

---

## 🎯 Project Overview

### Mission Statement
Time 2 Trade (T2T) is a web application for futures and forex day traders that visualizes key market trading sessions using an innovative dual-circle analog clock design, helping traders track active market sessions and manage their trading schedule across multiple timezones.

### Key Value Propositions
- **Visual Session Management:** Dual-circle clock (AM inner, PM outer) with customizable session arcs
- **Real-Time Economic Calendar:** Integration with JBlanked News Calendar API (MQL5 data source)
- **Global Timezone Support:** Automatic conversion and display for international traders
- **Free Premium Features:** All features available with free account creation
- **Persistent Settings:** Cloud-synced user preferences via Firestore

### Target Audience
- Futures day traders
- Forex day traders
- Market analysts requiring session awareness
- International traders across multiple timezones

---

## 🏗️ Architecture

### Architecture Pattern
**Monolithic React SPA with Serverless Backend**

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Components │  │   Contexts  │  │    Hooks    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Firebase Services (Backend)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Firestore   │  │    Auth     │  │  Functions  │        │
│  │ (Database)  │  │ (Identity)  │  │ (Serverless)│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                              │
│  ┌─────────────────────────────────────────────┐           │
│  │  JBlanked News Calendar API (MQL5 Source)   │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| React 19 | Latest features, improved performance | Cutting edge, potential compatibility issues |
| Vite Build Tool | Fast HMR, optimized builds | Newer tool, less mature ecosystem |
| MUI v7 | Material Design 3, comprehensive components | Bundle size, learning curve |
| Context API | Built-in state management, no external deps | Can cause re-renders if not optimized |
| Firebase | Serverless, managed infrastructure, free tier | Vendor lock-in, NoSQL limitations |
| Cloud Functions v2 | Scheduled tasks, API proxy | Cold starts, execution limits |
| Canvas API | High-performance clock rendering | Accessibility challenges, manual drawing |

---

## 💻 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.0.0 | UI framework |
| Vite | 6.1.0 | Build tool & dev server |
| Material-UI | 7.2.0 | Component library |
| Emotion | ^11.13.5 | CSS-in-JS (via MUI) |
| Firebase SDK | 11.3.1 | Client-side Firebase integration |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Firebase Cloud Functions | v2 | Serverless compute |
| TypeScript | 5.6.3 | Type-safe backend code |
| Node.js | 22 | Runtime environment |
| firebase-admin | 12.6.0 | Server-side Firebase SDK |

### Infrastructure
| Service | Purpose | Region |
|---------|---------|--------|
| Firebase Hosting | Static site hosting | Global CDN |
| Firestore | NoSQL database | us-central1 |
| Firebase Auth | User authentication | Global |
| Cloud Functions | Scheduled sync, API proxy | us-central1 |
| GitHub Pages | Alternative hosting | Global CDN |

### Development Tools
| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Git | Version control |
| GitHub Actions | CI/CD (future) |
| VS Code | Recommended IDE |

---

## 🛠️ Development Environment

### Prerequisites
```bash
# Required
Node.js >= 18.0.0
npm >= 9.0.0
Git >= 2.30.0

# Recommended
VS Code with extensions:
  - ESLint
  - Prettier
  - Firebase
  - GitLens
```

### Environment Setup

#### 1. Clone Repository
```bash
git clone https://github.com/lofitrades/trading-clock.git
cd trading-clock
```

#### 2. Install Dependencies
```bash
# Root dependencies (React app)
npm install

# Functions dependencies (Cloud Functions)
cd functions
npm install
cd ..
```

#### 3. Environment Variables
Create `.env` file in project root:
```env
# Firebase Configuration (DO NOT COMMIT)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=time-2-trade-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=time-2-trade-app
VITE_FIREBASE_STORAGE_BUCKET=time-2-trade-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Create `functions/.env` file:
```env
# JBlanked API Configuration
JBLANKED_API_KEY=1xPQ0mcU.W6Sv0rzrDnN9dVvCQLbQ3FRgqjXe1pBM
```

#### 4. Development Commands
```bash
# Start dev server (http://localhost:5173/trading-clock/)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Build Cloud Functions
cd functions
npm run build

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy full app
npm run deploy
```

### IDE Configuration

#### VS Code Settings (`.vscode/settings.json`)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.firebase": true
  }
}
```

---

## 📁 Project Structure

```
trading-clock/
├── .github/
│   └── instructions/
│       └── t2t_Instructions.instructions.md  # AI agent instructions
├── data/
│   └── economicEventDescriptions.json        # Event descriptions database
├── functions/                                # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts                         # Function entry points
│   │   └── services/
│   │       └── syncEconomicEvents.ts        # API sync logic
│   ├── .env                                 # Functions environment variables
│   ├── package.json                         # Functions dependencies
│   └── tsconfig.json                        # TypeScript config
├── pages/                                    # Legacy SSR pages (unused)
│   ├── about.page.jsx                       # About page template (reference)
│   ├── app.page.jsx                         # App page template (reference)
│   └── index.page.jsx                       # Landing page template (reference)
├── public/
│   ├── AboutContent.txt                     # About page content
│   ├── llms.txt                             # AI crawler discovery file
│   ├── robots.txt                           # Search engine directives
│   └── sitemap.xml                          # Site URL map
├── scripts/
│   └── prerender.mjs                        # Post-build meta tag injection
├── src/
│   ├── components/                          # React components
│   │   ├── AboutPage.jsx                    # Public /about page
│   │   ├── AccountModal.jsx                 # User account management
│   │   ├── AuthModal.jsx                    # Login/signup
│   │   ├── ClockCanvas.jsx                  # Analog clock (Canvas API)
│   │   ├── ConfirmModal.jsx                 # Reusable confirmation dialog
│   │   ├── DigitalClock.jsx                 # Digital time display
│   │   ├── EconomicEvents.jsx               # Events calendar panel
│   │   ├── ForgotPasswordModal.jsx          # Password reset
│   │   ├── LandingPage.jsx                  # SEO-optimized landing page
│   │   ├── LandingPage.css                  # Landing page styles
│   │   ├── LoadingScreen.jsx                # App loading state
│   │   ├── SessionLabel.jsx                 # Active session display
│   │   ├── SettingsSidebar.jsx              # Settings drawer
│   │   ├── Switch.jsx                       # MUI Switch wrapper
│   │   ├── TimeSettings.jsx                 # Session time pickers
│   │   ├── TimeStatus.jsx                   # Time remaining display
│   │   ├── TimezoneSelector.jsx             # Timezone dropdown
│   │   ├── UnlockModal.jsx                  # Feature unlock modal
│   │   └── UploadDescriptions.jsx           # Admin upload page
│   ├── contexts/
│   │   ├── AuthContext.jsx                  # Authentication state
│   │   └── SettingsContext.jsx              # User settings state
│   ├── hooks/
│   │   ├── useClock.js                      # Clock tick & session detection
│   │   └── useSettings.js                   # Settings persistence
│   ├── routes/
│   │   └── AppRoutes.jsx                    # React Router configuration
│   ├── utils/
│   │   ├── clockUtils.js                    # Canvas drawing utilities
│   │   └── messages.js                      # User-friendly error messages
│   ├── App.jsx                              # Main app component
│   ├── App.css                              # App-specific styles
│   ├── firebase.js                          # Firebase client initialization
│   ├── index.css                            # Global styles
│   ├── main.jsx                             # React entry point
│   └── theme.js                             # MUI theme configuration
├── .env                                     # Environment variables (gitignored)
├── .env.example                             # Environment template
├── .firebaserc                              # Firebase project config
├── .gitignore                               # Git ignore rules
├── eslint.config.js                         # ESLint configuration
├── firebase.json                            # Firebase deployment config
├── firestore.indexes.json                   # Firestore composite indexes
├── firestore.rules                          # Firestore security rules
├── index.html                               # HTML entry point
├── package.json                             # Root dependencies
├── README.md                                # Project documentation
└── vite.config.js                           # Vite build configuration
```

### File Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase.jsx | `AuthModal.jsx` |
| Hooks | camelCase.js with `use` prefix | `useClock.js` |
| Utilities | camelCase.js | `clockUtils.js` |
| Context Providers | PascalCase with Context suffix | `AuthContext.jsx` |
| Styles | ComponentName.css | `App.css` |
| Constants | UPPER_SNAKE_CASE | `API_KEY` |

---

## 🎨 Core Features

### 1. Dual-Circle Analog Clock

**Component:** `ClockCanvas.jsx`

**Specifications:**
- **Inner Circle (AM):** Radius = 52% of clock radius
- **Outer Circle (PM):** Radius = 75% of clock radius
- **Session Arc Width:** 12-100px (scales with clock size)
- **Hand Lengths:**
  - Hour: 50% (AM) or 74% (PM)
  - Minute: 90% radius
  - Second: 100% radius
- **Rendering:** HTML5 Canvas API with `requestAnimationFrame`

**Clock Sizes:**
| Size | Dimension | Use Case |
|------|-----------|----------|
| Tiny | 150px | Mobile portrait |
| Small | 250px | Small screens |
| Aesthetic | 300px | Recommended default |
| Normal | 375px | Standard desktop |
| Big | 500px | Large displays/tablets |

**Performance Optimizations:**
- Static elements (face, numbers) drawn once and cached
- Dynamic elements (hands, active sessions) redrawn each frame
- High-DPI display support via `devicePixelRatio`

### 2. Session Management

**Component:** `SettingsSidebar.jsx` → Session Settings

**Session Object Structure:**
```javascript
{
  name: string,          // Display name
  startTime: string,     // HH:MM format (24-hour)
  endTime: string,       // HH:MM format (24-hour)
  color: string,         // Hex color code
  showTimeToEnd: boolean,
  showTimeToStart: boolean
}
```

**Default Sessions:**
1. **NY AM** (07:00-12:00) - #018786
2. **NY PM** (12:00-16:00) - #FFA85C
3. **Market Closed** (16:00-18:00) - #8B6CFF
4. **Asia** (18:00-03:00) - #4E7DFF
5. **London** (03:00-07:00) - #FF6F91
6-8. **User Customizable** (defaults cycle the same multicolor palette)

**Session Detection Algorithm:**
1. Get current time in selected timezone
2. Parse session start/end times (24-hour format)
3. Check if current time falls within range
4. Handle midnight crossover (end < start)
5. If multiple active, choose most recently started
6. Calculate time remaining until session ends

### 3. Economic Events Calendar

**Component:** `EconomicEvents.jsx`

**Data Source:** JBlanked News Calendar API → MQL5 Economic Calendar

**Features:**
- Real-time economic event display
- Filter by date range (default: 2 weeks)
- Impact level indicators (high/medium/low)
- Event details: Actual, Forecast, Previous values
- Outcome indicators (bullish/bearish)
- Data sync: Scheduled daily 5 AM EST + manual trigger

**Firestore Collections:**
```
economicEventsCalendar/          # Main events data
  {eventId}/
    Name: string
    Currency: string
    Category: string              # MQL5 category (e.g., "Job Report")
    Date: timestamp
    Actual: number
    Forecast: number
    Previous: number
    Outcome: string
    Strength: string
    Quality: string
    Projection: number
    Event_ID: number

economicEventDescriptions/       # Educational descriptions
  {docId}/
    name: string
    aliases: string[]
    category: string              # Matches MQL5 categories
    impact: "high" | "medium" | "low"
    frequency: string
    releaseTime: string
    source: string
    description: string
    tradingImplication: string
    keyThresholds: object
    uploadedAt: timestamp

systemJobs/                      # Sync tracking
  syncEconomicEvents/
    status: "success" | "error"
    lastRun: timestamp
    source: "scheduled_function" | "manual_sync"
    message: string
    eventsCount: number
```

**API Categories (MQL5):**
- Job Report
- Consumer Inflation Report
- Producer Inflation Report
- Core Economy Report
- Economy Report
- Production Report
- Commodity Report
- Survery Report (note: API typo)
- Monetary Policy Report
- Housing Report

### 4. Timezone Management

**Component:** `TimezoneSelector.jsx`

**Supported Timezones:**
- EST (America/New_York)
- PST (America/Los_Angeles)
- CST (America/Chicago)
- MST (America/Denver)
- UTC
- CET (Europe/Paris)
- JST (Asia/Tokyo)
- AEST (Australia/Sydney)

**Implementation:**
- Uses IANA timezone database
- Real-time conversion via `Intl.DateTimeFormat`
- Persists to user settings
- Updates all time-dependent components reactively

### 5. User Settings Persistence

**Hook:** `useSettings.js`

**Settings Schema:**
```javascript
{
  clockSize: 150 | 250 | 300 | 375 | 500,
  clockStyle: "modern" | "classic",
  sessions: Session[8],
  selectedTimezone: string,
  backgroundBasedOnSession: boolean,
  showHandClock: boolean,
  showDigitalClock: boolean,
  showSessionLabel: boolean,
  showTimeToEnd: boolean,
  showTimeToStart: boolean,
  showSessionNamesInCanvas: boolean
}
```

**Storage Strategy:**
- **Authenticated Users:** Firestore (`users/{uid}/settings`)
- **Guest Users:** localStorage fallback
- **Sync Behavior:** Debounced writes (prevents excessive API calls)
- **Validation:** At least 1 clock element must be visible

---

## 🔥 Firebase Services

### Project Configuration
- **Project ID:** `time-2-trade-app`
- **Region:** `us-central1`
- **Hosting:** GitHub Pages + Firebase Hosting (dual deployment)

### Firestore Database

#### Collections Overview
| Collection | Purpose | Document Count | Indexes Required |
|------------|---------|----------------|------------------|
| `users` | User profiles & settings | ~100s | None |
| `economicEventsCalendar` | Economic events data | ~13,000 | Date, Currency |
| `economicEventDescriptions` | Event education | 46 | Category, Impact |
| `systemJobs` | Background task tracking | 1 | None |

#### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Economic events (read-only for clients)
    match /economicEventsCalendar/{eventId} {
      allow read: if true;
      allow write: if false;  // Only Cloud Functions can write
    }
    
    // Event descriptions (public read)
    match /economicEventDescriptions/{docId} {
      allow read: if true;
      allow write: if request.auth != null;  // Authenticated users only
    }
    
    // System jobs (admin only)
    match /systemJobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if false;  // Only Cloud Functions can write
    }
  }
}
```

#### Composite Indexes
```json
{
  "indexes": [
    {
      "collectionGroup": "economicEventsCalendar",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "Currency", "order": "ASCENDING" },
        { "fieldPath": "Date", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "economicEventDescriptions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "impact", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### Authentication

**Providers Enabled:**
1. **Email/Password** (requires email verification)
2. **Google OAuth**
3. **Facebook OAuth**
4. **Twitter OAuth**

**Auth Flow:**
```
1. User initiates login/signup
2. Firebase authenticates
3. Email/password: Check email verification
4. Social providers: Auto-verified
5. Create/load user document in Firestore
6. Load user settings
7. Update AuthContext
8. Close auth modal
```

**Special Cases:**
- Login with non-existent email → Auto-create account + send verification
- Signup with existing email → Auto-login (if password correct)
- Password reset → Send email with reset link

### Cloud Functions

**Deployed Functions:**

#### 1. `syncEconomicEventsCalendarScheduled`
```typescript
// Runs daily at 5:00 AM EST
export const syncEconomicEventsCalendarScheduled = onSchedule(
  {
    schedule: "0 5 * * *",
    timeZone: "America/New_York",
    region: "us-central1"
  },
  async (event) => {
    await syncEconomicEventsCalendar({}, "scheduled_function");
  }
);
```

**Behavior:**
- Fetches events from JBlanked API (date range: yesterday to +720 days)
- Upserts to `economicEventsCalendar` collection
- Updates `systemJobs` document with sync status
- Handles errors gracefully (logs + error document)

#### 2. `syncEconomicEventsCalendarNow`
```typescript
// Manual trigger via HTTPS call
export const syncEconomicEventsCalendarNow = onRequest(
  { region: "us-central1" },
  async (req, res) => {
    const result = await syncEconomicEventsCalendar({}, "manual_sync");
    res.json(result);
  }
);
```

**Usage:**
```bash
curl https://us-central1-time-2-trade-app.cloudfunctions.net/syncEconomicEventsCalendarNow
```

**Response:**
```json
{
  "success": true,
  "eventsCount": 12966,
  "message": "Successfully synced 12966 events"
}
```

---

## 🔌 API Integration

### JBlanked News Calendar API

**Provider:** JBlanked (jblanked.com)  
**Data Source:** MQL5 Economic Calendar (official MetaQuotes data)  
**Documentation:** https://www.jblanked.com/news/api/docs/calendar/

**Credentials:**
```env
API_KEY=1xPQ0mcU.W6Sv0rzrDnN9dVvCQLbQ3FRgqjXe1pBM
```

**Credits:**
- Total: 400
- Used: 2
- Remaining: 398
- Cost per sync: 1 credit

**Endpoints Used:**

#### MQL5 Calendar Date Range
```http
GET https://www.jblanked.com/news/api/mql5/calendar/range/
  ?from=YYYY-MM-DD
  &to=YYYY-MM-DD

Authorization: Api-Key {API_KEY}
```

**Response Format:** Direct array (12,966 events for 3-year span)  
**Data Coverage:** Comprehensive historical and future events  
**Recommended:** ✅ Best option for most use cases

#### Forex Factory Calendar Date Range
```http
GET https://www.jblanked.com/news/api/forex-factory/calendar/range/
  ?from=YYYY-MM-DD
  &to=YYYY-MM-DD

Authorization: Api-Key {API_KEY}
```

**Response Format:** Direct array  
**Data Coverage:** Good coverage for major economic events  
**Recommended:** ✅ Reliable alternative source

#### FXStreet Calendar Date Range
```http
GET https://www.jblanked.com/news/api/fxstreet/calendar/range/
  ?from=YYYY-MM-DD
  &to=YYYY-MM-DD

Authorization: Api-Key {API_KEY}
```

**Response Format:** Direct array  
**Data Coverage:** ⚠️ **LIMITED** - Only 10-20 future events  
**Recommended:** ⚠️ Not recommended for primary use (sparse data)

**Response Structure (All Sources):**
```json
[
  {
    "Name": "Core CPI m/m",
    "Currency": "USD",
    "Event_ID": 840010001,
    "Category": "Consumer Inflation Report",
    "Date": "2024.02.08 15:30:00",
    "Actual": 0.4,
    "Forecast": 0.4,
    "Previous": 0.2,
    "Outcome": "Actual = Forecast > Previous",
    "Strength": "Strong Data",
    "Quality": "Good Data",
    "Projection": 0.5
  }
]
```

**Note:** All three APIs now return **direct arrays** (not wrapped in `{value: [...], Count: N}`). The `fetchCalendarData` function in Cloud Functions handles both formats for backward compatibility.

**Rate Limiting:**
- No explicit rate limits documented
- Proxy through Cloud Functions to protect API key
- Scheduled daily sync to minimize API calls

**Error Handling:**
```typescript
try {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const data = await response.json();
  return data.value;
} catch (error) {
  logger.error("API sync failed:", error);
  throw error;
}
```

---

## 🎛️ State Management

### Architecture
**Pattern:** Context API + Custom Hooks

### Contexts

#### 1. AuthContext
**File:** `src/contexts/AuthContext.jsx`

**State:**
```javascript
{
  user: User | null,           // Firebase User object
  loading: boolean,            // Auth initialization state
  login: (email, password) => Promise,
  signup: (email, password, displayName) => Promise,
  logout: () => Promise,
  loginWithGoogle: () => Promise,
  loginWithFacebook: () => Promise,
  loginWithTwitter: () => Promise,
  resetPassword: (email) => Promise,
  updateUserProfile: (updates) => Promise,
  deleteAccount: () => Promise
}
```

**Usage:**
```javascript
import { useAuth } from '../contexts/AuthContext';

function Component() {
  const { user, login, logout } = useAuth();
  
  if (!user) {
    return <button onClick={() => login(email, password)}>Login</button>;
  }
  
  return <button onClick={logout}>Logout</button>;
}
```

#### 2. SettingsContext
**File:** `src/contexts/SettingsContext.jsx`

**State:**
```javascript
{
  // Loading state
  isLoading: boolean,
  
  // Clock settings
  clockStyle: string,
  clockSize: number,
  canvasSize: number,
  
  // Sessions
  sessions: Session[],
  
  // Visual settings
  backgroundBasedOnSession: boolean,
  showHandClock: boolean,
  showDigitalClock: boolean,
  showSessionLabel: boolean,
  showTimeToEnd: boolean,
  showTimeToStart: boolean,
  showSessionNamesInCanvas: boolean,
  
  // Timezone
  selectedTimezone: string,
  
  // Update functions
  updateClockStyle: (style) => void,
  updateClockSize: (size) => void,
  updateSessions: (sessions) => void,
  toggleBackgroundBasedOnSession: () => void,
  toggleShowHandClock: () => void,
  toggleShowDigitalClock: () => void,
  toggleShowSessionLabel: () => void,
  toggleShowTimeToEnd: () => void,
  toggleShowTimeToStart: () => void,
  setSelectedTimezone: (timezone) => void
}
```

### Custom Hooks

#### useClock
**File:** `src/hooks/useClock.js`

**Purpose:** Manages clock tick and session detection

**Returns:**
```javascript
{
  currentTime: Date,           // Updates every 1 second
  activeSession: Session | null,
  timeToEnd: number | null,    // Seconds remaining in active session
  nextSession: Session | null,
  timeToStart: number | null   // Seconds until next session
}
```

**Implementation Highlights:**
- Uses `setInterval` with 1-second tick
- Timezone-aware time calculations
- Handles midnight crossover
- Memoized session computations

#### useSettings
**File:** `src/hooks/useSettings.js`

**Purpose:** Manages settings persistence (Firestore + localStorage)

**Key Functions:**
```javascript
// Load settings on mount
useEffect(() => {
  if (user) {
    loadSettingsFromFirestore(user.uid);
  } else {
    loadSettingsFromLocalStorage();
  }
}, [user]);

// Save settings on change (debounced)
useEffect(() => {
  const timer = setTimeout(() => {
    if (user) {
      saveSettingsToFirestore(user.uid, settings);
    } else {
      saveSettingsToLocalStorage(settings);
    }
  }, 500);  // 500ms debounce
  
  return () => clearTimeout(timer);
}, [settings, user]);
```

---

## 🧩 Component Architecture

### Component Hierarchy
```
App
├── LoadingScreen (conditional)
├── IconButton (settings menu)
├── .clock-elements-container
│   ├── ClockCanvas (if showHandClock)
│   ├── DigitalClock (if showDigitalClock)
│   └── SessionLabel (if showSessionLabel)
├── TimezoneSelector (fixed bottom)
├── SettingsSidebar (drawer)
│   ├── User Menu (login/logout/account)
│   ├── About Section (collapsible)
│   └── Settings Section
│       ├── General Settings
│       └── Session Settings (8 sessions)
└── EconomicEvents (conditional panel)
```

### Component Specifications

#### ClockCanvas
**Type:** Pure Component (React.memo optimized)

**Props:**
```typescript
interface ClockCanvasProps {
  size: number;                  // Clock diameter in pixels
  time: Date;                    // Current time
  sessions: Session[];           // Active sessions
  handColor: string;             // Clock hands color
  clockStyle: "modern" | "classic";
  showSessionNamesInCanvas: boolean;
  activeSession: Session | null;
  backgroundBasedOnSession: boolean;
}
```

**Rendering Logic:**
1. Calculate canvas size with DPR
2. Draw static elements (once):
   - Clock face
   - Hour numbers
   - Center dot
3. Draw dynamic elements (every frame):
   - Session arcs (with hover detection)
   - Hour hand
   - Minute hand
   - Second hand (if modern style)
   - Session name tooltips (on hover)

**Performance:**
- Uses `useRef` for canvas element
- `requestAnimationFrame` for smooth animations
- Memoized calculations
- Static layer caching

#### SettingsSidebar
**Type:** Complex Component

**Structure:**
```jsx
<Drawer anchor="right" open={open} onClose={onClose}>
  <Box sx={{ width: 350, p: 3 }}>
    {/* User Menu */}
    {user ? (
      <UserMenu />
    ) : (
      <Button onClick={openAuthModal}>Login</Button>
    )}
    
    {/* About Accordion */}
    <Accordion>
      <AccordionSummary>About Time 2 Trade</AccordionSummary>
      <AccordionDetails>{aboutContent}</AccordionDetails>
    </Accordion>
    
    {/* Settings Accordion */}
    <Accordion defaultExpanded>
      <AccordionSummary>Settings</AccordionSummary>
      <AccordionDetails>
        {/* General Settings */}
        <GeneralSettings />
        
        {/* Session Settings (8 sessions) */}
        {sessions.map((session, index) => (
          <SessionSettings key={index} session={session} />
        ))}
      </AccordionDetails>
    </Accordion>
  </Box>
</Drawer>
```

#### EconomicEvents
**Type:** Data-Fetching Component

**Features:**
- Real-time Firestore query
- Date range filtering
- Impact level filtering
- Event detail modal
- Loading states
- Error handling

**Query:**
```javascript
const eventsQuery = query(
  collection(db, 'economicEventsCalendar'),
  where('Currency', '==', 'USD'),
  where('Date', '>=', startDate),
  where('Date', '<=', endDate),
  orderBy('Date', 'asc')
);

const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
  const events = snapshot.docs.map(doc => doc.data());
  setEvents(events);
});
```

---

## 📊 Data Models

### User Document
```typescript
interface UserDocument {
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: {
    clockSize: 150 | 250 | 300 | 375 | 500;
    clockStyle: "modern" | "classic";
    sessions: Session[];
    selectedTimezone: string;
    backgroundColor: string;
    backgroundBasedOnSession: boolean;
    showHandClock: boolean;
    showDigitalClock: boolean;
    showSessionLabel: boolean;
    showTimeToEnd: boolean;
    showTimeToStart: boolean;
    showSessionNamesInCanvas: boolean;
  };
}
```

### Session Model
```typescript
interface Session {
  name: string;
  startTime: string;  // "HH:MM" format (24-hour)
  endTime: string;    // "HH:MM" format (24-hour)
  color: string;      // Hex color code
  showTimeToEnd: boolean;
  showTimeToStart: boolean;
}
```

### Economic Event Model
```typescript
/**
 * News Source Types (v2.2.0+)
 * Supports multiple economic calendar providers
 */
type NewsSource = 'mql5' | 'forex-factory' | 'fxstreet';
const DEFAULT_NEWS_SOURCE: NewsSource = 'mql5';

/**
 * Economic Event Document
 * Stored in Firestore at: /economicEvents/{source}/events/{eventDocId}
 * 
 * IMPORTANT: Field availability varies by source
 */
interface EconomicEvent {
  name: string;           // ✅ All sources
  currency: string;       // ✅ All sources
  date: Timestamp;        // ✅ All sources (Firestore Timestamp)
  actual: number | null;  // ✅ All sources
  forecast: number | null;// ✅ All sources
  previous: number | null;// ✅ All sources
  outcome: string | null; // ✅ All sources
  strength: string | null;// ✅ All sources (impact level)
  quality: string | null; // ✅ All sources
  source: NewsSource;     // ✅ All sources (v2.2.0+)
  lastSyncedAt: Timestamp;// ✅ All sources
  
  // MQL5-ONLY FIELDS (null for other sources):
  category: string | null;    // ⚠️ MQL5 only (e.g., "Job Report", "Consumer Inflation Report")
  projection: number | null;  // ⚠️ MQL5 only
}

/**
 * Firestore Structure (v2.2.0+)
 * Per-source subcollections for data isolation:
 * 
 * /economicEvents/
 *   ├─ mql5/                    ✅ 12,966 events, full field support
 *   │   └─ events/
 *   │       ├─ {eventDocId1}
 *   │       └─ {eventDocId2}
 *   ├─ forex-factory/           ✅ 9,354 events, NO category/projection
 *   │   └─ events/
 *   │       └─ {eventDocId3}
 *   └─ fxstreet/                ⚠️ ~10 events only, NO category/projection
 *       └─ events/
 *           └─ {eventDocId4}
 * 
 * KEY DIFFERENCES BY SOURCE:
 * 
 * | Field      | MQL5 | Forex Factory | FXStreet |
 * |------------|------|---------------|----------|
 * | name       | ✅   | ✅            | ✅       |
 * | currency   | ✅   | ✅            | ✅       |
 * | date       | ✅   | ✅            | ✅       |
 * | actual     | ✅   | ✅            | ✅       |
 * | forecast   | ✅   | ✅            | ✅       |
 * | previous   | ✅   | ✅            | ✅       |
 * | outcome    | ✅   | ✅            | ✅       |
 * | strength   | ✅   | ✅            | ✅       |
 * | quality    | ✅   | ✅            | ✅       |
 * | category   | ✅   | ❌ null       | ❌ null  |
 * | projection | ✅   | ❌ null       | ❌ null  |
 * 
 * HANDLING NULL FIELDS IN CODE:
 * - Always use optional chaining: `event.category?.toLowerCase()`
 * - Null checks before display: `{event.category && event.category !== null && ...}`
 * - Filters skip null values: `if (category && category !== null && category !== 'null')`
 */
```

### Event Description Model
```typescript
interface EventDescription {
  name: string;
  aliases: string[];
  category: string;
  impact: "high" | "medium" | "low";
  frequency: string;
  releaseTime: string;
  source: string;
  description: string;
  tradingImplication: string;
  keyThresholds: {
    strong?: string;
    moderate?: string;
    weak?: string;
    [key: string]: string | undefined;
  };
  docId: string;
  uploadedAt: Timestamp;
}
```

---

## ⚙️ Configuration Management

### Vite Configuration
**File:** `vite.config.js`

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/trading-clock/',  // GitHub Pages path
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@emotion/react', '@emotion/styled'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  }
});
```

### Firebase Configuration
**File:** `firebase.json`

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs22",
    "codebase": "default"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### ESLint Configuration
**File:** `eslint.config.js`

```javascript
export default [
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '19.0' } },
    plugins: {
      react: pluginReact,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginReact.configs.flat.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
];
```

---

## 🚀 Build & Deployment

### Build Process

#### Production Build
```bash
# 1. Install dependencies
npm install
cd functions && npm install && cd ..

# 2. Build Cloud Functions
cd functions
npm run build
cd ..

# 3. Build React app (includes postbuild prerender)
npm run build

# 4. Preview locally (optional)
npm run preview
```

**Output:**
- React app: `dist/` directory
- Cloud Functions: `functions/lib/` directory

**Build Process Details:**
```bash
# npm run build executes:
1. vite build                    # Compiles React SPA
2. node scripts/prerender.mjs    # Updates meta tags (postbuild)

# To skip prerender:
npm run build:no-prerender
```

**Prerender Script (`scripts/prerender.mjs`):**
- Reads `dist/index.html` template
- Updates `<title>` and `<meta name="description">` per route
- Updates `<link rel="canonical">` to route-specific URL
- Writes modified HTML to:
  - `dist/index.html` (for / route)
  - `dist/about/index.html` (for /about route)

#### Build Optimization
- **Code Splitting:** Vendor chunks for React, MUI, Firebase
- **Tree Shaking:** Unused code eliminated
- **Minification:** Terser for JS, cssnano for CSS
- **Asset Optimization:** Images compressed, fonts subset
- **Source Maps:** Generated for debugging

### Deployment Strategies

#### Option 1: Firebase Hosting (Primary)
```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

**URL:** https://time-2-trade-app.web.app

#### Option 2: GitHub Pages (Alternative)
```bash
# Build and deploy
npm run deploy
```

**Behind the scenes:**
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

**URL:** https://lofitrades.github.io/trading-clock/

### Deployment Checklist
- [ ] Update version number in `package.json`
- [ ] Run `npm run lint` (fix all errors)
- [ ] Test build locally (`npm run build && npm run preview`)
- [ ] Verify environment variables are set
- [ ] Check Firestore security rules
- [ ] Review Cloud Functions logs
- [ ] Test authentication flows
- [ ] Verify API sync functionality
- [ ] Check responsive design on mobile
- [ ] Test timezone conversions
- [ ] Clear browser cache and test
- [ ] Deploy to staging (if available)
- [ ] Deploy to production
- [ ] Verify deployment URL
- [ ] Monitor error logs
- [ ] Update documentation

### Rollback Procedure
```bash
# Firebase Hosting rollback
firebase hosting:clone SITE_ID:SOURCE_VERSION SITE_ID:DESTINATION_VERSION

# Cloud Functions rollback (manual)
# 1. Go to Firebase Console → Functions
# 2. Select function
# 3. Click "Rollback" to previous version

# GitHub Pages rollback
git revert <commit-hash>
git push origin main
npm run deploy
```

---

## 🧪 Testing Strategy

### Current Status
⚠️ **No formal testing framework implemented yet**

### Recommended Testing Strategy

#### Unit Testing
**Framework:** Vitest (Vite-native)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Test Structure:**
```
src/
├── components/
│   ├── ClockCanvas.jsx
│   └── __tests__/
│       └── ClockCanvas.test.jsx
├── hooks/
│   ├── useClock.js
│   └── __tests__/
│       └── useClock.test.js
└── utils/
    ├── clockUtils.js
    └── __tests__/
        └── clockUtils.test.js
```

**Example Test:**
```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DigitalClock from '../DigitalClock';

describe('DigitalClock', () => {
  it('renders current time', () => {
    const now = new Date('2025-11-29T14:30:00');
    render(<DigitalClock time={now} clockSize={300} textColor="#000" />);
    expect(screen.getByText(/14:30/)).toBeInTheDocument();
  });
});
```

#### Integration Testing
**Framework:** React Testing Library

**Test Scenarios:**
- Auth flow (login/signup/logout)
- Settings persistence (Firestore + localStorage)
- Session detection and display
- Timezone changes
- Economic events loading

#### E2E Testing
**Framework:** Playwright or Cypress

**Critical User Flows:**
1. New user signup → Email verification → Login
2. Guest user → Browse app → Create account → Settings persist
3. Change timezone → Clock updates → Sessions adjust
4. Configure sessions → Save → Reload → Settings restored
5. View economic events → Filter by date → View details

#### Cloud Functions Testing
**Framework:** Firebase Emulators

```bash
firebase emulators:start
```

**Test Commands:**
```bash
# functions/src/__tests__/syncEconomicEvents.test.ts
import { describe, it, expect } from '@jest/globals';
import { syncEconomicEventsCalendar } from '../services/syncEconomicEvents';

describe('syncEconomicEventsCalendar', () => {
  it('should fetch and store events', async () => {
    const result = await syncEconomicEventsCalendar({}, 'manual_sync');
    expect(result.success).toBe(true);
    expect(result.eventsCount).toBeGreaterThan(0);
  });
});
```

### Test Coverage Goals
- **Unit Tests:** 80% coverage
- **Integration Tests:** Critical paths
- **E2E Tests:** 5-10 key user flows
- **Cloud Functions:** 90% coverage

---

## ⚡ Performance Optimization

### Current Optimizations

#### 1. Code Splitting
```javascript
// vite.config.js
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'mui-vendor': ['@mui/material', '@emotion/react'],
  'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore']
}
```

**Result:** Faster initial load, better caching

#### 2. React Optimizations
```javascript
// Memoized components
const ClockCanvas = React.memo(({ size, time, sessions }) => {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.size === nextProps.size &&
         prevProps.time === nextProps.time &&
         JSON.stringify(prevProps.sessions) === JSON.stringify(nextProps.sessions);
});

// Memoized calculations
const activeSession = useMemo(() => {
  return detectActiveSession(currentTime, sessions, selectedTimezone);
}, [currentTime, sessions, selectedTimezone]);
```

#### 3. Canvas Rendering
```javascript
// Static elements drawn once
const drawStaticElements = useCallback(() => {
  drawClockFace();
  drawNumbers();
  drawCenterDot();
}, [size, clockStyle]);

// Dynamic elements drawn every frame
const drawDynamicElements = () => {
  drawSessionArcs();
  drawHands();
  drawTooltips();
};
```

#### 4. Firestore Queries
```javascript
// Indexed queries
const eventsQuery = query(
  collection(db, 'economicEventsCalendar'),
  where('Currency', '==', 'USD'),  // Indexed
  where('Date', '>=', startDate),  // Indexed
  orderBy('Date', 'asc')           // Indexed
);

// Pagination
const paginatedQuery = query(
  eventsQuery,
  limit(50)
);
```

#### 5. Settings Debouncing
```javascript
// Prevent excessive writes
useEffect(() => {
  const timer = setTimeout(() => {
    saveSettings();
  }, 500);  // 500ms debounce
  return () => clearTimeout(timer);
}, [settings]);
```

### Performance Metrics (Lighthouse)
**Target Scores:**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 95
- SEO: > 90

**Current Optimizations:**
- Lazy loading for heavy components
- Image optimization
- Font preloading
- Service worker (future)

### Bundle Size Analysis
```bash
npm run build -- --mode production

# Analyze bundle
npx vite-bundle-visualizer
```

**Target Bundle Sizes:**
- Initial JS: < 200 KB (gzipped)
- Vendor chunks: < 150 KB each
- CSS: < 50 KB
- Total: < 500 KB

---

## 🔒 Security Considerations

### Authentication Security

#### Email Verification Required
```javascript
const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  if (!userCredential.user.emailVerified) {
    await auth.signOut();
    throw new Error('Please verify your email before logging in');
  }
  
  return userCredential.user;
};
```

#### Password Requirements
- Minimum 6 characters (Firebase default)
- Consider implementing stronger validation:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 number
  - At least 1 special character

#### OAuth Security
- Firebase handles OAuth flows securely
- No client-side secrets
- Tokens managed by Firebase SDK

### Firestore Security

#### Rules Best Practices
```javascript
// ✅ CORRECT: User can only access their own data
allow read, write: if request.auth.uid == userId;

// ❌ WRONG: Allow all authenticated users
allow read, write: if request.auth != null;

// ✅ CORRECT: Public read, authenticated write
allow read: if true;
allow write: if request.auth != null;

// ✅ CORRECT: Field validation
allow write: if request.resource.data.keys().hasAll(['name', 'email'])
            && request.resource.data.name is string
            && request.resource.data.email.matches('.*@.*');
```

#### Data Validation
```javascript
// Validate in Cloud Functions before writing
const validateEventData = (data) => {
  if (!data.Name || typeof data.Name !== 'string') {
    throw new Error('Invalid event name');
  }
  if (!data.Currency || !['USD', 'EUR', 'GBP', 'JPY'].includes(data.Currency)) {
    throw new Error('Invalid currency');
  }
  // ... more validations
};
```

### API Security

#### Environment Variables
```bash
# ❌ NEVER commit these files
.env
functions/.env

# ✅ Always use .gitignore
.env
.env.local
.env.*.local
functions/.env
```

#### API Key Protection
```javascript
// ✅ CORRECT: Proxy through Cloud Functions
// functions/src/services/syncEconomicEvents.ts
const API_KEY = process.env.JBLANKED_API_KEY;
const headers = { 'Authorization': `Api-Key ${API_KEY}` };

// ❌ WRONG: Expose API key in client
// const API_KEY = 'YOUR_KEY_HERE';  // NEVER DO THIS
```

#### Rate Limiting
```typescript
// Implement in Cloud Functions
const rateLimiter = new Map();

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  const recentRequests = userRequests.filter(time => now - time < 60000);
  
  if (recentRequests.length >= 10) {
    return false;  // Exceeded 10 requests per minute
  }
  
  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
};
```

### XSS Prevention
- React auto-escapes content
- Use `dangerouslySetInnerHTML` sparingly
- Sanitize user inputs

```javascript
// ✅ CORRECT: Auto-escaped
<div>{userInput}</div>

// ⚠️ USE WITH CAUTION
<div dangerouslySetInnerHTML={{ __html: sanitize(userInput) }} />
```

### CSRF Protection
- Firebase handles CSRF tokens automatically
- Cloud Functions use Firebase Auth tokens

### Content Security Policy
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://www.gstatic.com;
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src 'self' https://fonts.gstatic.com;
               connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;">
```

---

## 🔧 Troubleshooting Guide

### Common Issues

#### 1. Blank Screen on Load
**Symptoms:** App shows white screen, no errors in console

**Causes:**
- Incorrect base path in `vite.config.js`
- Missing environment variables
- Firebase initialization failure

**Solutions:**
```bash
# Check environment variables
cat .env

# Verify base path
grep "base:" vite.config.js

# Check browser console for errors
# Open DevTools → Console

# Test local build
npm run build
npm run preview
```

#### 2. Settings Not Persisting
**Symptoms:** Settings reset on page reload

**Causes:**
- User not authenticated (localStorage fallback not working)
- Firestore permissions error
- Network connectivity issues

**Solutions:**
```javascript
// Check auth state
console.log('User:', user);

// Check localStorage
console.log('LocalStorage:', localStorage.getItem('t2t_settings'));

// Check Firestore rules
// Firebase Console → Firestore → Rules

// Check network tab
// DevTools → Network → Filter: firestore
```

#### 3. Clock Not Updating
**Symptoms:** Clock hands frozen, time not progressing

**Causes:**
- `setInterval` not running
- Component unmounted
- Timezone conversion error

**Solutions:**
```javascript
// Check useClock hook
useEffect(() => {
  console.log('useClock mounted');
  const interval = setInterval(() => {
    console.log('Clock tick:', new Date());
  }, 1000);
  
  return () => {
    console.log('useClock unmounted');
    clearInterval(interval);
  };
}, []);
```

#### 4. Economic Events Not Loading
**Symptoms:** Empty events list, "No events" message

**Causes:**
- Firestore query error
- Date range too narrow
- API sync failed

**Solutions:**
```bash
# Check Firestore data
# Firebase Console → Firestore → economicEventsCalendar

# Check systemJobs for sync status
# Firestore → systemJobs → syncEconomicEvents

# Manual sync trigger
curl https://us-central1-time-2-trade-app.cloudfunctions.net/syncEconomicEventsCalendarNow

# Check Cloud Functions logs
firebase functions:log
```

#### 5. Authentication Errors
**Symptoms:** Login fails, "Invalid credentials" errors

**Causes:**
- Email not verified
- Incorrect password
- Firebase Auth configuration

**Solutions:**
```javascript
// Check email verification
console.log('Email verified:', user?.emailVerified);

// Resend verification email
await sendEmailVerification(user);

// Check Firebase Auth settings
// Firebase Console → Authentication → Settings

// Check provider configuration
// Firebase Console → Authentication → Sign-in method
```

#### 6. Build Errors
**Symptoms:** `npm run build` fails

**Causes:**
- Syntax errors
- Missing dependencies
- TypeScript errors (in functions)

**Solutions:**
```bash
# Check for syntax errors
npm run lint

# Install missing dependencies
npm install

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
cd functions
npm run build
cd ..
```

#### 7. Deployment Failures
**Symptoms:** Firebase deploy fails

**Causes:**
- Insufficient permissions
- Invalid configuration
- Functions build errors

**Solutions:**
```bash
# Check Firebase login
firebase login

# Verify project
firebase projects:list
firebase use time-2-trade-app

# Check configuration
cat firebase.json

# Deploy with debug output
firebase deploy --debug

# Deploy only specific targets
firebase deploy --only hosting
firebase deploy --only functions
```

### Error Messages Reference

| Error | Meaning | Solution |
|-------|---------|----------|
| `auth/user-not-found` | Email not registered | Sign up or check email |
| `auth/wrong-password` | Incorrect password | Reset password or retry |
| `auth/email-not-verified` | Email verification required | Check inbox for verification link |
| `auth/too-many-requests` | Rate limited | Wait 15 minutes and retry |
| `permission-denied` | Firestore security rule violation | Check auth state and rules |
| `unavailable` | Firestore temporarily unavailable | Retry after delay |
| `not-found` | Document doesn't exist | Check document path |
| `failed-precondition` | Missing index | Create composite index |

### Multi-Source Troubleshooting

**Issue:** Categories not loading for Forex Factory/FXStreet  
**Cause:** These sources don't provide category data (MQL5-only field)  
**Solution:** Expected behavior - categories will be empty array for non-MQL5 sources  
**Code:** `getEventCategories(source)` filters out null values automatically

**Issue:** Events display without category chips  
**Cause:** Normal for Forex Factory/FXStreet events (category field is null)  
**Solution:** Timeline conditionally renders: `{event.category && event.category !== null && ...}`  
**Expected:** MQL5 events show categories, other sources don't - working as designed

**Issue:** Sync returns 0 events despite API showing thousands  
**Cause:** Firestore rejecting undefined fields (e.g., `category: undefined`)  
**Solution:** Cloud Functions normalize with null: `category: event.Category || null`  
**Fixed In:** v2.2.0 with nullable TypeScript types and proper normalization

**Issue:** Filter options not updating after source change  
**Cause:** EventsFilters2 not receiving newsSource prop  
**Solution:** Pass `newsSource={newsSource}` prop from EconomicEvents  
**Code:** `useEffect(() => { fetchOptions(); }, [newsSource]);`

**Issue:** Cache returning wrong source data  
**Cause:** eventsCache.js queries old collection structure  
**Solution:** Temporarily disabled cache with TODO - falls back to Firestore  
**Status:** Known limitation - cache refactor scheduled for v2.3.0

### Debug Mode

Enable debug logging:
```javascript
// src/firebase.js
import { setLogLevel } from 'firebase/firestore';

if (import.meta.env.DEV) {
  setLogLevel('debug');
}
```

### Performance Profiling

Use React DevTools Profiler:
```bash
npm install -D @welldone-software/why-did-you-render

# Add to src/main.jsx
import whyDidYouRender from '@welldone-software/why-did-you-render';
whyDidYouRender(React, {
  trackAllPureComponents: true,
});
```

---

## 📝 Change Log

### Version 2.7.37 - January 16, 2026
**SEO Route Refactor (/clock launch)**

#### ✅ Updates
- Added indexable /clock route with unique metadata, updated CTAs and navigation targets, and set /app to noindex,nofollow with canonical /. Updated sitemap/robots for clean crawlability.

### Version 2.7.35 - January 16, 2026
**GPT Placeholder Events (Fallback)**

#### ✅ Updates
- Added GPT as lowest-priority canonical provider and surfaced all-day/tentative time labels in UI while keeping NFS/JBlanked precedence.

### Version 2.7.36 - January 16, 2026
**FF-T2T GPT Uploader**

#### ✅ Updates
- Added superadmin-only FF-T2T uploader route and callable ingest for GPT event seeding into canonical collection.

### Version 2.7.34 - January 15, 2026
**ads.txt Hosting Verification**

#### ✅ Updates
- Added ads.txt cache/content-type headers for Firebase Hosting and clarified ads.txt metadata for AdSense verification.

### Version 2.7.23 - January 15, 2026
**Auth Modal Backdrop Layering**

#### 🐛 Fixes
- Ensured AuthModal2 backdrop stays behind the modal paper on initial open (no overlay flash).

### Version 2.7.24 - January 15, 2026
**Contact Modal Layering**

#### 🐛 Fixes
- Aligned ContactModal stacking with AuthModal2 and kept its backdrop behind the paper to prevent overlay flash.

### Version 2.7.25 - January 15, 2026
**Timezone Selector Layering**

#### 🐛 Fixes
- Raised TimezoneSelector popper z-index above AppBar for consistent overlay priority.

### Version 2.7.26 - January 15, 2026
**Timezone Modal Layering**

#### 🐛 Fixes
- Raised the /calendar timezone modal z-index above the AppBar so the overlay stays on top.

### Version 2.7.27 - January 15, 2026
**Timezone Modal Backdrop**

#### 🐛 Fixes
- Ensured /calendar and /app timezone modals keep the backdrop behind the dialog paper to prevent overlaying the modal.

### Version 2.7.28 - January 15, 2026
**Modal Layering Audit**

#### 🐛 Fixes
- Aligned AccountModal, WelcomeModal, ForgotPasswordModal, and NewsSourceSelector stacking above the AppBar and kept backdrops behind the paper.

### Version 2.7.29 - January 15, 2026
**Logout Modal Layering**

#### 🐛 Fixes
- Aligned LogoutModal stacking above the AppBar and kept backdrop behind the paper.

### Version 2.7.30 - January 15, 2026
**Forgot Password Modal Priority**

#### 🐛 Fixes
- Raised ForgotPasswordModal z-index above AccountModal for correct stacking priority.

### Version 2.7.32 - January 15, 2026
**Forgot Password Modal Stacking**

#### 🐛 Fixes
- Increased ForgotPasswordModal z-index to ensure it always overlays AccountModal.

### Version 2.7.33 - January 15, 2026
**Account Modal Visibility**

#### 🐛 Fixes
- Hid AccountModal while ForgotPasswordModal is active to avoid stacking conflicts.

### Version 2.7.34 - January 15, 2026
**Account Modal Reset Flow**

#### 🐛 Fixes
- Hide AccountModal when the reset password action is initiated, restoring it after confirmation.

### Version 2.7.35 - January 15, 2026
**Forgot Password Overlay Priority**

#### 🐛 Fixes
- Raised ForgotPasswordModal backdrop above the AppBar while keeping the paper on top.

### Version 2.7.36 - January 15, 2026
**Forgot Password Modal Global Priority**

#### 🐛 Fixes
- Raised ForgotPasswordModal z-index to the top-level stack so AppBar never overlays it on any page.

### Version 2.7.31 - January 15, 2026
**Auth Context Resilience**

#### 🐛 Fixes
- Added a safe default AuthContext value to prevent useAuth crashes during HMR/context mismatch.

### Version 2.7.22 - January 15, 2026
**Calendar Column Header Behavior**

#### 🐛 Fixes
- Disabled sticky positioning for column headers so only day headers remain sticky.

### Version 2.7.21 - January 15, 2026
**Calendar Header Polish**

#### 🎨 UI
- Added vertical padding to day headers and ensured sticky column headers show a visible bottom border.

### Version 2.7.20 - January 15, 2026
**Calendar Day Header Solid Fill**

#### 🎨 UI
- Replaced the translucent day header background with a solid grey tone.

### Version 2.7.19 - January 15, 2026
**Calendar Day Header Tone**

#### 🎨 UI
- Darkened the day header background using theme action surface for enterprise header contrast.

### Version 2.7.18 - January 15, 2026
**Calendar Day Header Background**

#### 🎨 UI
- Set day header container background to match the Paper surface for consistent styling.

### Version 2.7.17 - January 15, 2026
**Calendar Sticky Header Cascade**

#### 🎨 UI
- Removed the gap between day headers and column headers so sticky stacks cascade cleanly.

### Version 2.7.16 - January 15, 2026
**Calendar Day Header Centering**

#### 🎨 UI
- Adjusted day header typography and chip sizing to keep content centered in both sticky and non-sticky states.

### Version 2.7.15 - January 15, 2026
**Calendar Day Header Alignment**

#### 🎨 UI
- Tightened day header vertical alignment by removing excess padding and adjusting line-height for centered text.

### Version 2.7.14 - January 15, 2026
**Calendar Header Shadow**

#### 🎨 UI
- Moved the shadow from the day header to the sticky column headers for clearer separation.

### Version 2.7.13 - January 15, 2026
**Calendar Column Header Padding**

#### 🎨 UI
- Reduced column header vertical padding for cleaner, consistent table header spacing.

### Version 2.7.12 - January 15, 2026
**Calendar Column Header Offset**

#### 🐛 Fixes
- Nudged sticky column headers slightly lower beneath day headers for clearer separation while scrolling.

### Version 2.7.11 - January 15, 2026
**Calendar Sticky Header Init Order**

#### 🐛 Fixes
- Reordered sticky header offset calculation to run after `filtersHeight` initialization, preventing render-time reference errors.

### Version 2.7.10 - January 15, 2026
**Calendar Sticky Header Offset**

#### 🐛 Fixes
- Adjusted sticky day/table header offsets to include both dynamic filter height and responsive Paper padding so headers stack beneath filters correctly.

### Version 2.7.9 - January 15, 2026
**Calendar Sticky Header Fix**

#### 🐛 Fixes
- Removed an intermediate scroll container in CalendarEmbed that broke sticky day/table headers; filters are now measured directly to calculate sticky offsets reliably.

### Version 2.7.8 - January 13, 2026
**Referral Banner Removal**

#### 🔄 Changes
- Removed all referral banner placements from CalendarEmbed and public shells; calendar, app, and marketing routes now run banner-free.

### Version 2.7.7 - January 13, 2026
**Calendar Mobile Spacing**

#### 🐛 Fixes
- Added xs/sm top margin to the Economic Calendar paper when rendered on /calendar to clear sticky chrome and match mobile spacing across the public shell.

### Version 2.7.6 - January 13, 2026
**Public Layout Chrome Cleanup**

#### 🔄 Changes
- PublicLayout now omits the referral banner; DashboardAppBar remains sticky so public pages keep navigation without duplicate ad rows.
- /app and /about use PublicLayout with page-level AppBar spacing overrides to keep chrome centered across marketing and app shells.

#### 🐛 Fixes
- About page card removes top margin and adds responsive max-heights with internal scrolling to prevent page-level overflow on small viewports.

### Version 2.7.5 - January 13, 2026
**Public Layout Shell**

#### ✨ New Features
- Added PublicLayout wrapper with sticky banner slot followed by the DashboardAppBar so public pages share the same chrome and referral placement.
- /calendar now uses PublicLayout and disables the in-embed top banner to avoid duplicate ads while preserving router-aware SEO behavior.

### Version 2.7.4 - January 13, 2026
**Calendar Navigation Chrome**

#### ✨ New Features
- /calendar now renders the DashboardAppBar (sticky desktop bar + mobile bottom nav) inside CalendarEmbed for consistent navigation chrome.
- CalendarPage conditionally hydrates a router wrapper only when needed, so embeds without React Router still load the new navigation safely.

### Version 2.7.3 - January 11, 2026
**Calendar Mobile UX + Next Navigation**

#### ✨ New Features
- /calendar now uses a floating "Jump to Next" control that appears only when a NEXT event exists and is not currently visible.

#### 🐛 Fixes
- Improved xs clock canvas sizing/centering to keep session labels visible on mobile.
- Day sections now use sticky day + column headers below the sticky filters.

### Version 2.7.2 - January 9, 2026
**Contact Modal Embed Mode**

#### ✨ New Features
- Contact navigation on the landing page opens a responsive modal that embeds the /contact page.
- /contact supports an embed mode (`?embed=1`) that hides non-form header copy and the bottom navigation links when rendered inside the modal.

### Version 2.7.1 - January 8, 2026
**Removed Background Color Setting**

#### ✨ Removals
- Removed standalone "Background Color" setting and picker from entire codebase
- Removed `backgroundColor` state variable and related functions from `SettingsContext.jsx` and `useSettings.js`
- Removed `updateBackgroundColor()` method and localStorage sync for backgroundColor
- Removed backgroundColor from Firestore user settings schema
- Removed Background Color UI from SettingsModal and SettingsSidebar2 components

#### 🔄 Changes
- **Session-based Background** is now the ONLY background functionality available
- Default background is fixed at `#F9F9F9` (light gray)
- When Session-based Background is enabled, background dynamically shifts to active session color
- Updated App.jsx to always default to `#F9F9F9` when Session-based Background is disabled
- Updated kb.md and userTypes.js documentation to remove backgroundColor references

#### 🎯 Rationale
- Simplifies settings UI and reduces feature complexity
- Session-based Background provides dynamic background capability for active users
- Fixed default background provides consistent base for inactive sessions

### Version 2.7.0 - January 6, 2026
**Calendar Embed UX Parity**

#### ✨ New Features
- CalendarEmbed now shows NOW/NEXT badges with live countdowns and opens EventModal on row click/touch.
- Added notes actions to embed rows with EventNotesDialog wiring for add/remove flows.

#### 🔄 Changes
- Past events gray out using timezone-aware detection (matches TimezoneSelector selection).
- Today headers in day groups use primary background for immediate visual emphasis.
- Favorites and notes controls mirror auth-aware handling used in EventsTable/Timeline components.

### Version 2.6.2 - December 22, 2025
**Firebase Analytics Initialization**

- Added guarded Firebase Analytics initialization that reuses the existing app instance without touching firebase.js.
- SPA page views now log on every route change via a router-level initializer.
- Provides helpers for future event logging with GA4.

### Version 2.6.1 - December 22, 2025
**Passwordless Magic Link Reliability**

- Magic link continue URLs now resolve to /app across production, dev, and GitHub Pages so callbacks land inside the authenticated shell.
- EmailLinkHandler runs at the routing layer, ensuring email link sign-in completes even when users open links on marketing routes.
- Authenticated visitors hitting /login now redirect to /app for a consistent post-auth landing.

### Version 2.6.0 - December 18, 2025
**SEO Optimization (SPA-Based, No SSR)**

#### ✨ New Features
- **Custom Prerender Script:** Post-build meta tag injection via `scripts/prerender.mjs`
  - Updates `<title>` and `<meta name="description">` for / and /about routes
  - Updates canonical URLs per route
  - Runs automatically via `postbuild` npm script
- **SEO Fallback Content:** Hidden HTML in `index.html` for crawlers without JavaScript
  - `<div id="seo-fallback">` with `display: none` by default
  - Shown only via `<noscript>` CSS override for bots
  - Removed by `main.jsx` before React mounts (prevents FOUC)
- **AI Crawler Discovery:** `/public/llms.txt` file for LLM agents (ChatGPT, Claude, Perplexity)
  - 100-line plain-text summary of features, URLs, and contact info
- **Client-Side Route Pages:**
  - `LandingPage.jsx` - SEO-optimized marketing page at /
  - `AboutPage.jsx` - Public about page at /about
  - Both update `document.title` and meta description on mount
- **Routing Structure:**
  - / → LandingPage (marketing with FAQ schema)
  - /app → HomePage → App (interactive clock)
  - /about → AboutPage (about content)
  - /calendar → CalendarPage (economic events calendar)

#### 🔄 Changes
- Added `AppRoutes.jsx` with React Router for client-side navigation
- Updated `main.jsx` to render `<AppRoutes />` instead of `<App />`
- Enhanced `index.html` with:
  - Structured data (WebSite + SoftwareApplication schema)
  - Open Graph and Twitter Card meta tags
  - Crawlable fallback content in `<noscript>` blocks
- Updated `package.json` scripts:
  - `build` → runs `vite build` + `postbuild` automatically
  - `postbuild` → executes `prerender.mjs`
  - `build:no-prerender` → bypasses meta tag updates
- Default session colors and reset palette now use multicolor BrandGuide arcs (#4E7DFF, #FFA85C, #018786, #FF6F91, #8B6CFF)
- Loading animation donuts updated to the same multicolor palette to avoid legacy pastel colors on reset
 - Swapped NY AM/NY PM defaults (NY AM → teal #018786, NY PM → orange #FFA85C) per BrandGuide direction
 - Centralized impact colors; low-impact markers/chips now use yellow (#F2C94C), unknown uses taupe (#C7B8A4) to avoid collisions with session/NOW colors

#### 🔧 Technical
- **Architecture:** Pure SPA (no SSR) with client-side meta updates
- **SEO Strategy:** Prerendered meta tags + hidden HTML fallback + AI discovery file
- **Crawlability:** Tested with curl - full content visible to bots without JS
- **Performance:** No SSR overhead, instant client-side navigation

#### 📚 Files Added
- `scripts/prerender.mjs` - Meta tag injection script
- `src/components/LandingPage.jsx` - Marketing page component
- `src/components/LandingPage.css` - Landing page styles
- `src/components/AboutPage.jsx` - About page component
- `src/routes/AppRoutes.jsx` - Route configuration
- `public/llms.txt` - AI crawler discovery
- `public/robots.txt` - Search engine directives
- `public/sitemap.xml` - Site URL map

#### 📚 Files Modified
- `index.html` - Added SEO meta tags, structured data, fallback content
- `src/main.jsx` - Changed to render AppRoutes, removes SEO fallback
- `package.json` - Added postbuild script

### Version 2.5.1 - January 7, 2026
**Clock events overlay performance**

- Extracted clock overlay data fetching into `useClockEventsData` and marker shaping into `useClockEventMarkers` to cut per-second recompute and allow reuse of preloaded event data.
- Favorites and notes badges now listen live to preference changes for immediate marker badge updates, keeping the overlay UI purely presentational.

### Version 2.5.0 - January 6, 2026
**Calendar workspace + /calendar route**

#### ✨ New Features
- Added `/calendar` SSR page with structured data, prerendered SEO copy, and client hydration into the new provider-wrapped CalendarPage.
- Introduced `CalendarEmbed` with This Week default preset, day-grouped table (shows "No events" on empty days), and reusable two-panel layout built on `EventsFilters3` + `NewsSourceSelector`.
- Added headless `useCalendarData` hook plus CalendarPage shell for embedding the calendar workspace in other pages (e.g., LandingPage hero slots).

#### 🔄 Changes
- `EventsFilters3` now accepts an optional `defaultPreset` prop (defaults to Today) so hosts can seed ranges like This Week while keeping existing UX.

### Version 2.4.6 - December 17, 2025
**Installable PWA + Chrome install CTA**

#### ✨ New Features
- Added PWA manifest, theme color, and service worker registration to unlock Chrome/Android add-to-homescreen flows.
- Generated 192px/512px maskable icons and linked Apple touch icon for cross-device install readiness.
- Introduced in-app install CTA that listens for the deferred `beforeinstallprompt` event and prompts users with a dismissible, safe-area-aware banner.

### Version 2.4.5 - December 17, 2025
**Magic link domain hardening**

#### 🔄 Changes
- Centralized passwordless magic link continue URL to https://time2.trade/ with explicit dev/staging fallbacks to prevent localhost links in production emails.
- Enforced session sign-out before email link authentication and eager profile creation for new users to avoid cross-account reuse and ensure onboarding UI.

#### 🐛 Bug Fixes
- Prevented previously authenticated Google users from being reused when opening a magic link for another email address.

### Version 2.4.4 - December 2025
**SEO + AI Discoverability**

#### ✨ New Features
- Added crawlable static HTML fallbacks and JSON-LD for the homepage and About route to surface content without JavaScript.
- Introduced /public/llms.txt for AI crawlers with product summary and key URLs.

#### 🔄 Changes
- Implemented shared SEO helper with route-level Helmet metadata for home, events, and login.
- Updated About metadata to use the existing SEO image and added breadcrumb structured data.

### Version 2.4.3 - December 2025
**Guest Auth CTA**

#### ✨ New Features
- Added a fixed top-right "Get started free" button that shows only for guests and opens the authentication modal with safe-area spacing for mobile devices.

### Version 2.4.2 - December 2025
**Timezone Label Toggle**

#### ✨ New Features
- Added `showTimezoneLabel` setting to show/hide a text-only selected timezone label between the digital clock and the active session label.
- Added a "Show timezone label" toggle below the timezone selector in the settings drawer.

### Version 2.4.1 - December 2025
**Clock Event Tooltip UX Stability**

#### 🔄 Changes
- Stabilized clock event marker tooltip so it no longer flickers on 1-second clock updates.
- Improved hover usability (graceful leave delay) and touch usability (no auto-hide; outside tap/Escape close).

### Version 2.4.0 - December 2025
**Event Notes Sync**

#### ✨ New Features
- Added per-event notes stored in `/users/{uid}/eventNotes/{eventId}/notes`, synced in real time across timeline, table, and clock overlays.
- Introduced EventNotesDialog with add/remove actions, mobile-first full-screen mode, and timezone-aware timestamps.
- Clock markers now display a notes badge when any note exists for the underlying event.

#### 🔄 Changes
- Timeline and table action rows include note controls with loading states and auth-aware handling.
- Economic events drawer wires notes hook for unified add/remove and streaming subscriptions.

### Version 2.3.1 - December 2025
**Clock Events Visibility Toggle**

#### 🔄 Changes
- Added `showEventsOnCanvas` setting to control whether economic event markers render on the analog clock; toggle appears only when Hand Clock is enabled.
- Loading screen no longer waits on clock event markers when the overlay is disabled, preventing unnecessary loader delays.

### Version 2.3.0 - December 2025
**Clock-Integrated Economic Events Overlay**

#### ✨ New Features
- **Hand Clock Event Markers:** Today's filtered economic events now render directly on the analog clock (AM inner ring, PM outer ring) with impact-based icons.
- **Impact-Aware Tooltips:** Hover markers to see grouped events at the same timestamp, showing names, currency/category, impact level, and timezone-correct time.

#### 🔄 Changes
- Added `ClockEventsOverlay` component with timezone-aware grouping and highest-impact selection per timeslot.
- Wrapped hand clock in a relative container to host overlay without modifying the canvas implementation.
- Styled overlay markers and tooltips for enterprise UX consistency.

### Version 2.2.0 - December 2025
**Multi-Source Economic Calendar Architecture**

#### ✨ New Features
- **Multi-Source News Providers:** Support for 3 economic calendar sources
  - MQL5 (MetaQuotes) - Default source
  - Forex Factory - Alternative provider
  - FXStreet - Third option for redundancy
- **Per-Source Firestore Subcollections:** Isolated data storage at `/economicEvents/{source}/events/{eventDocId}`
- **User-Configurable Source:** Settings dropdown to select preferred news provider
- **Multi-Source Sync Modal:** Enhanced sync UI with:
  - Checkbox selection for multiple sources
  - Per-source progress bars with visual feedback
  - Success/error status indicators
  - Record count reporting per source
- **Cache Invalidation:** Automatic event refetch when user changes news source preference

#### 🔄 Changes
- Extended TypeScript types with NewsSource ('mql5' | 'forex-factory' | 'fxstreet')
- Updated Cloud Functions to accept sources array in POST body for multi-source sync
- Enhanced economicEventsService.js with source-aware queries
- Added SyncCalendarModal component (300+ lines) with accessibility features
- Updated SettingsContext with newsSource field and updateNewsSource function
- Modified SettingsSidebar with News Source dropdown and descriptions

#### 🔧 Technical
- functions/src/types/economicEvents.ts: Added NewsSource type and DEFAULT_NEWS_SOURCE constant
- functions/src/services/syncEconomicEvents.ts: Refactored with getCalendarPathForSource helper
- src/services/firestoreHelpers.js: New helper for accessing per-source subcollections
- src/types/economicEvents.js: Client-side types with NEWS_SOURCE_OPTIONS array
- EconomicEvents.jsx: useEffect watching newsSource changes for cache invalidation
- Cloud Functions: Support for both single-source (GET) and multi-source (POST) sync

#### 📚 Architecture Decisions
- **Subcollection Structure:** Chosen for data isolation, prevents source conflicts
- **Sequential Sync:** Avoid parallel API calls to respect JBlanked rate limits
- **Default Pre-selection:** SyncCalendarModal pre-selects user's preferred source
- **Backward Compatibility:** Legacy ConfirmModal kept alongside new SyncCalendarModal

### Version 2.1.0 - November 30, 2025
**Performance Optimization + Event Filter Persistence**

#### ✨ New Features
- **LocalStorage Caching:** Implemented comprehensive event caching system (eventsCache.js)
  - 95%+ reduction in Firestore reads on repeat loads
  - 24-hour cache expiry with real-time sync detection
  - In-memory filtering for instant results
  - Automatic cache invalidation on API sync
- **Event Filter Persistence:** User filter selections (date range, currencies, categories, impacts) now persist across sessions
  - Firestore sync for logged-in users with Timestamp serialization
  - localStorage fallback for guest users with ISO date strings
  - Automatic initialization from saved preferences on mount

#### 🔄 Changes
- EconomicEvents.jsx now initializes filters from SettingsContext
- EventsFilters2.jsx: Added currency flag icons (27 currencies)
- EventsFilters2.jsx: Mobile-first responsive grid (2 columns mobile, 3 tablet)
- EventsTimeline2.jsx: Optimized pagination button spacing and styling
- economicEventsService.js: Enhanced with cache-aware methods

#### 🐛 Bug Fixes
- Fixed API response parsing (data.value vs data) in syncEconomicEvents.ts
- Resolved Firestore permission errors on systemJobs collection (changed to public read)
- Fixed React hydration error in FilterCheckbox (Typography span vs p tag)
- Corrected pagination button spacing alignment

#### 🔧 Technical
- Added eventsCache.js service (450+ lines) with enterprise-grade caching
- Updated firestore.rules for systemJobs public read access
- Improved date serialization in SettingsContext for cross-platform compatibility

### Version 2.0.0 - November 29, 2025
**Economic Events Integration + Major Cleanup**

#### ✨ New Features
- Economic events calendar integration (JBlanked News Calendar API)
- Real-time event display with Firestore sync
- Scheduled daily sync at 5 AM EST via Cloud Functions
- Manual sync trigger via UI button
- Event descriptions database (46 USD events)
- Admin upload page for event descriptions (`/upload-desc`)
- Password-protected admin routes

#### 🔄 Changes
- Updated event categories to match MQL5 API nomenclature
- Migrated from styled-components to MUI for consistency
- Improved sidebar organization (collapsible sections)
- Enhanced settings context with economic events toggle

#### 🐛 Bug Fixes
- Fixed confirmation modal showing on component mount
- Resolved IconButton prop warnings (variant, startIcon)
- Fixed nested `<p>` tags in dialog content
- Corrected React prop warnings in Switch component

#### 🗑️ Removed
- Deleted 17 redundant documentation files
- Removed backup files (AuthModal.jsx.backup)
- Cleaned up temporary files (temp_newsApi.txt)
- Removed empty scripts and docs directories
- Deleted unused upload scripts

#### 🔧 Technical
- Added Cloud Functions v2 with TypeScript
- Implemented source tracking for sync operations
- Created Firestore composite indexes
- Set up systemJobs collection for background task monitoring

### Version 1.1.0 - October 2025
**MUI Migration Phase**

#### ✨ Completed Migrations
- MUI theme configuration
- Switch component → MUI Switch
- ConfirmModal → MUI Dialog
- UnlockModal → MUI Dialog
- ForgotPasswordModal → MUI Dialog
- DigitalClock → MUI Typography
- SessionLabel → MUI Paper + Typography
- App.jsx menu button → MUI IconButton

#### 🔄 Changes
- Removed Font Awesome icons
- Removed Material Symbols
- Removed Facebook SDK from HTML (Firebase handles OAuth)
- Cleaned up index.html

#### ⏳ Pending
- AuthModal migration
- AccountModal migration
- SettingsSidebar complete migration

### Version 1.0.0 - September 2025
**Initial Release**

#### ✨ Features
- Dual-circle analog clock with session visualization
- 8 customizable trading sessions
- Multiple timezone support
- Digital clock display
- Session label with countdown timers
- User authentication (Email, Google, Facebook, Twitter)
- Settings persistence (Firestore + localStorage fallback)
- Responsive design (mobile, tablet, desktop)
- Multiple clock sizes (5 options)
- Dynamic background color based on active session
- Canvas-based hand clock with hour numbers

#### 🏗️ Architecture
- React 19 with Vite
- Firebase Authentication
- Firestore database
- Firebase Hosting
- GitHub Pages deployment

---

## 📚 Additional Resources

### Documentation
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Material-UI Documentation](https://mui.com)
- [Vite Documentation](https://vitejs.dev)
- [JBlanked API Documentation](https://www.jblanked.com/news/api/docs/calendar/)

### Project Links
- **Production URL:** https://time2.trade/
- **Repository:** https://github.com/lofitrades/trading-clock
- **Firebase Console:** https://console.firebase.google.com/project/time-2-trade-app
- **Support:** lofitradesx@gmail.com
- **Twitter/X:** [@time2_trade](https://x.com/time2_trade)

### Contributing
This is currently a private project. For questions or suggestions, contact the development team.

---

## 🎨 Brand Guide

**Reference:** `kb/BrandGuide.md`

For detailed brand guidelines, color palettes, typography, logo usage, and visual identity standards, see the dedicated Brand Guide document:

📄 **[kb/BrandGuide.md](kb/BrandGuide.md)**

**Quick Reference:**
- **Brand Name:** Time 2 Trade (T2T)
- **Primary Colors:** See BrandGuide.md → Color Palette
- **Typography:** See BrandGuide.md → Fonts & Typography
- **Logo Assets:** See BrandGuide.md → Logo Usage
- **Tone & Voice:** Professional, trader-focused, data-driven

**Note:** This Knowledge Base focuses on technical implementation. For marketing assets, design specs, and brand consistency rules, refer to the Brand Guide.

---
See [TargetAudience.md](TargetAudience.md) for audience definitions, JTBD, UX implications, and terminology guidance.
Reference kb\TargetAudience.md

**End of Knowledge Base**

*This document is a living resource and should be updated with each significant change to the project.*
