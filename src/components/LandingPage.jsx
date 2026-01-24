/**
 * src/components/LandingPage.jsx
 * 
 * Purpose: High-performance landing page with a live hero clock for futures and forex day traders.
 * Highlights Time 2 Trade value props with brand-safe visuals and responsive hero layout.
 * 
 * v1.7.4 - 2026-01-22 - BEP UI CONSISTENCY: Aligned timezone button and modal styling with ClockPanelPaper pattern for consistent UX across landing and calendar pages. Button now uses handColor variable (matches text color contrast), smaller fontSize (0.75rem matches ClockPanelPaper), reduced fontWeight (600), added text overflow handling (overflow: hidden, textOverflow: ellipsis). Dialog title pb increased to 1.5 for spacing consistency; close button uses ml: 'auto' for proper alignment; DialogContent pt adjusted to 0.5. All accessibility features preserved (focus-visible, aria-labels, hover states).
 * v1.7.3 - 2026-01-22 - BEP ACCESSIBILITY: Improved timezone button to pass Lighthouse AA accessibility tests: changed color from alpha('#c7d3e0', 0.9) to alpha('#0F172A', 0.72) for 4.5:1+ contrast ratio on light backgrounds; increased fontWeight to 700; added focus-visible states with 2px primary-colored outline; added aria-label for screen readers. Added close icon (IconButton with CloseIcon) to timezone selector modal in DialogTitle; close button is fully accessible with aria-label and focus-visible styling. Modal title now uses flexbox layout with space-between to position close button. All following enterprise accessibility best practices.
 * v1.7.2 - 2026-01-22 - BEP: Replace interactive TimezoneSelector component below hero clock with simple button (like ClockPanelPaper pattern). Button opens Dialog modal with TimezoneSelector inside. Added Dialog/DialogContent/DialogTitle imports and timezone modal state (timezoneModalOpen). Button closes modal on selection via onTimezoneChange callback. Guests redirected to AuthModal2 via onRequestSignUp callback. Follows enterprise modal stacking patterns with proper z-index.
 * v1.7.1 - 2026-01-22 - BEP: Replace timezone label below hero clock with interactive TimezoneSelector component. Removed static timezoneLabelText memo and Typography render. Added responsive Box wrapper with mobile-first layout (full width xs, auto width sm+, minWidth 300 sm+).
 * v1.7.0 - 2026-01-22 - BEP COPY REFRESH: Updated positioning to emphasize session clock + Forex Factory-powered calendar + custom events + notifications. Removed overclaims ("works offline", "<1 second", "MQL5-sourced"). FAQ reordered with data source and custom events questions. H1 changed to "Session Clock + Economic Calendar (NY Time)". Hero paragraph emphasizes "clean intraday timing workspace" with integrated calendar. Final CTA focuses on custom events/notifications over exports/overlaps. Chip label updated to "Powered by Forex Factory". Benefits now include custom events + notifications instead of precision/routine. Feature sections reorganized: added dedicated "Custom Events + Notifications" feature (replaces performance section with generic benefits). howItWorksSteps updated: Step 2 emphasizes timezone/filters, Step 3 adds custom events/notifications, Step 4 links reminders. useCases removed "overlap" language, focused on London/NY open timing with clear countdowns. comparisonPoints removed performance claims.
 * v1.6.9 - 2026-01-22 - BEP: Allow non-auth users to open CustomEventDialog and fill values. Auth check on save - shows AuthModal2 when trying to save without auth.
 * v1.6.8 - 2026-01-22 - BEP UI CONSISTENCY: Removed custom mobileHeaderAction prop. Add reminder button now uses MobileHeader's default styling for consistent UI (add, bell, avatar) across all pages. Fixes size mismatch on xs/sm breakpoints.
 * v1.6.7 - 2026-01-22 - BEP: Add small touch tooltip delay on mobile hero clock to avoid tooltips during scroll.
 * v1.6.6 - 2026-01-22 - BEP: Enable vertical swipe scrolling over the hero clock on mobile while preserving session tooltips.
 * v1.6.5 - 2026-01-22 - BEP: Landing hero clock guest behavior updated: session arc clicks show tooltips, event markers open AuthModal2, canvas background does nothing.
 * v1.6.4 - 2026-01-22 - BEP: Landing hero clock now matches full clock behavior for authenticated users; guests see AuthModal2 on any clock click.
 * v1.6.3 - 2026-01-22 - BEP: Mobile header now uses standalone MobileHeader component via PublicLayout. Ensures consistent mobile UX across all pages (landing, clock, calendar, about). Removed duplicate mobile header logic, mobileHeaderAction still passed through to MobileHeader.
 * v1.6.2 - 2026-01-22 - BEP: Add icon-only "Add custom event" button on xs/sm mobile header for non-authenticated users. Opens AuthModal2 when clicked. Matches /clock and /calendar mobile header styling.
 * v1.6.1 - 2026-01-16 - Landing hero clock: marker clicks open AuthModal2/EventModal; background clicks route to /clock.
 * v1.6.0 - 2026-01-16 - Updated homepage SEO meta, routed primary CTAs to /clock, and promoted hero heading to the single H1.
 * v1.5.13 - 2026-01-15 - TOP SPACING ALIGNMENT: Remove extra top padding/margin on landing main content so it aligns with PublicLayout like /about.
 * v1.5.12 - 2026-01-15 - SETTINGS DRAWER WIRING: Route AppBar Settings button to SettingsSidebar2 instead of ContactModal on landing page. Added settings drawer state and handlers with proper modal coordination.
 * v1.5.8 - 2026-01-14 - HIDE MOBILE NAV: Pass hideNavOnMobile={true} to PublicLayout to remove the mobile bottom AppBar on xs/sm breakpoints. Landing page focuses on hero content without bottom nav clutter for both auth and guest visitors. Desktop sticky nav still shows on md+. Cleaner mobile-first experience with full viewport focus on hero clock and copy.
 * v1.5.11 - 2026-01-14 - OUTLINED BUTTON STYLE: Changed "Go to Calendar" secondary button from variant="text" to variant="outlined" following MUI best practices. Added explicit borderColor: theme.palette.text.primary and '&:hover' with borderColor to maintain border visibility on interaction. Outlined variant provides stronger visual affordance for secondary CTAs and improves button hierarchy contrast against primary "Unlock all features" button.
 * v1.5.10 - 2026-01-14 - MOBILE BUTTON LAYOUT: Changed CTA buttons from single row to responsive stacking on xs/sm breakpoints. Stack direction now responsive: direction={{ xs: 'column', md: 'row' }}. Buttons are full width on mobile (width: { xs: '100%', md: 'auto' }) with alignItems: stretch for better touch targets. Justification centered on xs/sm, maintains flex-start/center on md+ per section. Follows enterprise mobile UI best practices: improved accessibility and easier thumb reach on small screens.
 * v1.5.9 - 2026-01-14 - ICON ENHANCEMENT: Added LockIcon to "Unlock all features" buttons and CalendarMonthIcon to "Go to Calendar" buttons throughout landing page (hero and final-cta sections). Updated both button sizes to "large" for consistent icon display. Icons improve visual affordance and UX clarity for conversion-focused CTAs across all breakpoints.
 * Changelog:
 * v1.5.7 - 2026-01-14 - MOBILE SCROLL PADDING FIX: Added responsive pb (padding-bottom) to main Box for xs/sm to ensure content scrolls all the way to the bottom without being clipped. Formula: xs uses calc(3 * 8px + 48px) = 72px, sm uses calc(4 * 8px + 48px) = 80px, md+ uses 4 units (32px). The +48px accounts for PublicLayout mobile logo row height (32px logo + 16px pb). Split py into separate pt and pb for granular control. This matches AboutPage and CalendarEmbedLayout pattern for consistent scrollability across all pages on mobile.
 * v1.5.4 - 2026-01-14 - RESPONSIVE PADDING: Added mobile-first px padding to main Box (xs:0.5, sm:0.5, md:0) to ensure content doesn't touch viewport edges on mobile while PublicLayout provides outer centering container padding. Small internal padding on xs/sm prevents edge-touching, md+ relies on outer container padding only.
 * v1.5.0 - 2026-01-14 - REFACTOR: Notion-style minimal design. Removed all Papers/Boxes/containers/shadows/gradients, kept only simple copy with clean typography, fully responsive mobile-first layout, maintaining SEO best practices.
 * v1.4.20 - 2026-01-14 - REFACTOR: Improved UI integration with PublicLayout. Single scrollable main content area with proper height constraints, removed nested Box layers, centralized SEO outside PublicLayout, improved mobile scroll experience.
 * v1.4.17 - 2026-01-12 - Refactor: Extract landing navigation into shared NavigationMenu component.
 * v1.4.18 - 2026-01-12 - UI: Reduce top padding above navigation for a tighter hero header.
 * v1.4.16 - 2026-01-09 - Open ContactModal from nav instead of routing to /contact.
 * v1.4.15 - 2026-01-09 - Added Contact nav item linking to /contact.
 * v1.4.14 - 2026-01-07 - Snap hero clock hands on resume using shared time engine resume tokens for instant recovery after background.
 * v1.4.13 - 2026-01-07 - Wire landing hero clock to aligned time engine for second-accurate sync with the app.
 * v1.4.12 - 2026-01-07 - Add ultra-brief initial loader; hide right after first paint so hero copy shows immediately.
 * v1.4.11 - 2026-01-07 - Removed all scroll reveal animations; sections render statically.
 * v1.4.10 - 2026-01-07 - Removed the 'Learn more' anchor from landing nav.
 * v1.4.9 - 2026-01-07 - Removed the landing page ad/banner section entirely.
 * v1.4.8 - 2026-01-07 - Reduced banner to a small horizontal size (320/468/728 widths) to mimic Google leaderboard formats.
 * v1.4.7 - 2026-01-07 - Switched hero banner to a simple standalone image (no Paper/Ad overlay), sized like calendar and kept in the same spot.
 * v1.4.6 - 2026-01-07 - Rely on app-level CookiesBanner; removed local render on landing.
 * v1.4.5 - 2026-01-07 - Replaced remaining nav CTAs with calendar icon to clear lint errors.
 * v1.4.4 - 2026-01-07 - Refined Features grid spacing and added sticky back-to-top control after scroll.
 * v1.4.3 - 2026-01-07 - Refined section surfaces to an Apple-inspired, minimal premium finish.
 * v1.4.2 - 2026-01-07 - Simplified footer to X-only social link and added dynamic copyright year.
 * v1.4.1 - 2026-01-07 - Swapped nav brand mark to the multicolor primary logo.
 * v1.4.0 - 2026-01-07 - Added reduced-motion friendly scroll reveals and refreshed section surfaces for a premium feel.
 * v1.3.1 - 2026-01-07 - Softened the primary CTA shadow for a lighter hero surface.
 * v1.3.0 - 2026-01-07 - Simplified UI to light Airbnb-style surfaces, softened shadows, and made the hero clock surface transparent.
 * v1.2.9 - 2026-01-07 - CTA now routes directly to /calendar; removed hero bullet chips.
 * v1.2.8 - 2026-01-07 - Updated CTA copy to “Go to Calendar” for clearer intent.
 * v1.2.6 - 2025-12-22 - Remove the "Live hand clock" title for a cleaner hero card.
 * v1.2.7 - 2025-12-22 - Make landing hero event markers open the app or AuthModal2 on tap/click for clear CTA.
 * v1.2.5 - 2025-12-22 - Show timezone label under the hero clock to clarify the preview time context.
 * v1.2.4 - 2025-12-22 - Limit click target to the clock itself; hero card background no longer opens the app/auth modal.
 * v1.2.3 - 2025-12-22 - Disable clock event tooltips on the hero preview card so landing visitors see only the visual markers.
 * v1.2.2 - 2025-12-22 - Widened hero columns with responsive max widths so content uses more viewport space on XL while staying mobile-first.
 * v1.2.1 - 2025-12-22 - Expanded landing container width for XL viewports while keeping mobile-first padding.
 * v1.2.0 - 2025-12-22 - Swapped to Helmet-based SEO with refreshed landing copy, canonical, and structured data.
 * v1.1.4 - 2025-12-22 - Migrated to simple-icons root imports and applied X, YouTube, and Instagram icons via SvgIcon for mobile-first footer.
 * v1.1.3 - 2025-12-22 - Switched to simple-icons X logo and kept footer social icons accessible on dark background.
 * v1.1.2 - 2025-12-22 - Replaced Twitter icon with X logo using custom SvgIcon for updated branding.
 * v1.1.1 - 2025-12-22 - Added mobile-first nav menu, social icons, and high-contrast footer text for accessibility.
 * v1.1.0 - 2025-12-22 - Rewrote landing page copy and sections with enterprise SaaS structure and updated navigation anchors.
 * v1.0.13 - 2025-12-22 - Fix Open app CTA to call isAuthenticated() so guests see AuthModal2 instead of redirecting to /app.
 * v1.0.12 - 2025-12-22 - Open App CTA checks auth status: guests see AuthModal2, authenticated users redirect to /app.
 * v1.0.11 - 2025-12-22 - Remove rocket icon from the hero chip to keep the label clean.
 * v1.0.10 - 2025-12-22 - Restore Time 2 Trade label beside the logo and link header brand to home.
 * v1.0.9 - 2025-12-22 - Replace generic header badge with official secondary white logo; ensure responsive sizing for mobile-first layout.
 * v1.0.8 - 2025-12-22 - Measured clock container to keep canvas centered and contained within the paper on mobile/XS.
 * v1.0.7 - 2025-12-22 - Simplified hero to a responsive two-column/row flex layout; centered clock card and copy on mobile with balanced padding.
 * v1.0.6 - 2025-12-22 - Hero clock click now routes authenticated users to /app and opens AuthModal2 for guests.
 * v1.0.5 - 2025-12-22 - Clicking the hero app paper opens AuthModal2 for immediate signup/login.
 * v1.0.4 - 2025-12-22 - Added FAQ anchor near About for quick navigation to the FAQ section.
 * v1.0.3 - 2025-12-22 - Added FAQ section with schema markup for SEO and ensured FAQ visibility.
 * v1.0.2 - 2025-12-22 - Moved proof point highlights out of hero clock card into dedicated best-practices section.
 * v1.0.1 - 2025-12-22 - Removed MUI Grid usage to comply with licensing guidance; kept responsive flex layout.
 * v1.0.0 - 2025-12-22 - Created enterprise-grade landing page with live clock hero and SEO metadata.
 */

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    SvgIcon,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LockIcon from '@mui/icons-material/Lock';
import BoltIcon from '@mui/icons-material/Bolt';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import InfoIcon from '@mui/icons-material/Info';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { siX } from 'simple-icons';
import ClockCanvas from './ClockCanvas';
import ClockHandsOverlay from './ClockHandsOverlay';
import TimezoneSelector from './TimezoneSelector';
const ClockEventsOverlay = lazy(() => import('./ClockEventsOverlay'));
const EventModal = lazy(() => import('./EventModal'));
const SettingsSidebar2 = lazy(() => import('./SettingsSidebar2'));
const CustomEventDialog = lazy(() => import('./CustomEventDialog'));
import LoadingScreen from './LoadingScreen';
import ContactModal from './ContactModal';
import AuthModal2 from './AuthModal2';
import PublicLayout from './PublicLayout';
import { useSettings } from '../contexts/SettingsContext';
import { useClock } from '../hooks/useClock';
import { useTimeEngine } from '../hooks/useTimeEngine';
import { useClockVisibilitySnap } from '../hooks/useClockVisibilitySnap';
import { buildFaqSchema, buildSeoMeta, buildSoftwareApplicationSchema } from '../utils/seoMeta';
import SEO from './SEO';
// Consent utilities not needed on landing banner image-only version
import '../App.css';

const heroMeta = buildSeoMeta({
    title: 'Time 2 Trade | Session Clock + Forex Factory Calendar (NY Time)',
    description:
        'Intraday timing workspace for futures & forex day traders. NY-time session clock with countdowns + a Forex Factory-powered economic calendar with impact/currency filters, custom events, and notifications.',
    path: '/',
    keywords:
        'session clock, trading sessions, new york session, london session, asia session, session countdown, forex factory economic calendar, high-impact events, CPI, NFP, FOMC, custom events, event notifications, prop trader routine, intraday day trading tool',
});

const XIcon = (props) => (
    <SvgIcon viewBox="0 0 24 24" {...props}>
        <path d={siX.path} />
    </SvgIcon>
);

const socialProofFit = [
    'Futures day traders (ES, NQ, YM, indices)',
    'Forex day traders (majors and USD pairs)',
    'ICT-style traders and timing framework students',
    'Prop traders and funded account traders',
];

const problemPoints = [
    'Timezone math in your head while your charts are moving',
    'Entering a perfect setup right before a high-impact release hits',
    'Missing key session transitions like London open or New York open',
    'Tab-hopping between multiple tools just to answer: "is it safe to trade now?"',
];

const solutionPoints = [
    'One trading clock shows New York, London, and Asia sessions in real-time',
    'Countdown timers tell you exactly when key session transitions happen',
    'Forex Factory-powered events so you see scheduled catalysts before they hit',
    'Add custom events and enable notifications to follow your own rules and routines',
];

const benefits = [
    {
        title: "Visualize today's market sessions at a glance",
        body: "See New York, London, and Asia sessions in real-time on a dual-circle clock. Know exactly where you are in the trading day—without timezone confusion.",
    },
    {
        title: 'Avoid event surprises',
        body: "High-impact releases can flip conditions instantly. Filter by impact and currency, then trade with confidence because you know what's scheduled.",
    },
    {
        title: 'Plan your own timing windows',
        body: 'Create custom events for your rules (no-trade windows, routines, session checkpoints). Keep your timing layer consistent every day.',
    },
    {
        title: 'Stay ahead with notifications',
        body: 'Turn on reminders for upcoming events so you\'re not caught mid-trade when volatility spikes.',
    },
];

const featureSections = [
    {
        id: 'visual-session-clock',
        icon: <AccessTimeIcon fontSize="small" />,
        eyebrow: 'Session Awareness',
        heading: 'Your session clock: New York, London, Asia',
        body:
            'A dual-circle 24-hour clock shows where you are in the trading day and when key session transitions happen. Real-time countdowns and clean session context—built for intraday routines.',
        bullets: [
            'Session windows for New York, London, Asia',
            'Real-time countdowns to key session transitions',
            'Active session indicator (know where you are now)',
        ],
    },
    {
        id: 'economic-events',
        icon: <CalendarMonthIcon fontSize="small" />,
        eyebrow: 'Event Awareness',
        heading: 'Forex Factory-powered economic calendar',
        body:
            'See scheduled releases that move price—right alongside session context. Filter by impact and currency so you only track what matters to your instruments and your plan.',
        bullets: [
            'Powered by Forex Factory economic event data',
            'Filter by impact and currency (USD, EUR, etc.)',
            'Save favorites and add trading notes (signed-in)',
        ],
        note:
            'A free account unlocks the full calendar workspace so you can save filters, notes, favorites, and reminders across devices.',
    },
    {
        id: 'custom-events-notifications',
        icon: <AddRoundedIcon fontSize="small" />,
        eyebrow: 'Personal Timing Layer',
        heading: 'Custom events + notifications for your rules',
        body:
            'Not every timing window comes from the macro calendar. Add your own events (no-trade windows, session checkpoints, routine reminders) and enable notifications so you stay consistent under pressure.',
        bullets: [
            'Create custom events for your personal rules and routines',
            'Set reminders/notifications for upcoming events (where supported)',
            'Keep your workflow consistent across sessions and instruments',
        ],
    },
    {
        id: 'timezone-confidence',
        icon: <SecurityIcon fontSize="small" />,
        eyebrow: 'Timezone Clarity',
        heading: 'New York time by default (switch anytime)',
        body:
            'Most intraday education anchors to New York time. Time 2 Trade defaults to New York but lets you switch to your local timezone instantly—while keeping countdowns consistent.',
        bullets: [
            'New York time-first interface by default',
            'Switch timezones instantly (stays consistent)',
            'Countdown timers stay aligned with your selected timezone',
        ],
    },
    {
        id: 'performance',
        icon: <PhoneIphoneIcon fontSize="small" />,
        eyebrow: 'Built for Daily Use',
        heading: 'Fast, clean, mobile-first',
        body:
            'Open it, confirm session + event risk, and get back to your charts. Designed to stay lightweight and readable on mobile—no noisy dashboards or signal clutter.',
        bullets: [],
    },
];

const useCases = [
    {
        title: 'Futures day trading (ES/NQ/YM/RTY)',
        bullets: [
            "Know exactly which session you're in before every entry",
            'Time entries around London open and New York open with clear countdowns',
            'Avoid surprise volatility near high-impact releases',
        ],
    },
    {
        title: 'Forex day trading (major pairs + crosses)',
        bullets: [
            'Execute London open with timing confidence',
            'Focus on the currencies that move your pairs (USD, EUR, GBP, JPY)',
            'Avoid getting chopped up during scheduled releases',
        ],
    },
    {
        title: 'ICT / Smart Money timing frameworks',
        bullets: [
            'Visualize session windows and execution zones',
            'Confirm event risk before entering a setup',
            'Pair timing context with your analysis—without extra tabs',
        ],
    },
    {
        title: 'Funded and prop trading routines',
        bullets: [
            'Standardize your pre-trade checklist (session + events + reminders)',
            'Avoid rule-breaking trades near major catalysts',
            'Keep a consistent daily routine across devices',
        ],
    },
    {
        title: 'Trading students and learning',
        bullets: [
            'See how session transitions affect volatility (live)',
            'Understand why London open and NY open change conditions',
            'Learn when economic events hit and how markets react',
        ],
    },
];

const howItWorksSteps = [
    'Step 1 - Open the app: Get instant session and event context without leaving your charts.',
    'Step 2 - Customize for your strategy: Show only the sessions, timezones, and event filters that match your plan.',
    'Step 3 - Add your timing layer: Create custom events and enable notifications for your rules and routines.',
    'Step 4 - Execute with clarity: Use Time 2 Trade as your timing check before entries—sessions + catalysts + reminders.',
];

const comparisonPoints = [
    'Built on a visual session clock (the fast intraday context layer)',
    'Shows market sessions + Forex Factory-powered events together',
    'Designed for quick pre-trade checks (clean, lightweight, mobile-first)',
    'Made specifically for intraday session-based traders and prop routines',
];

const faqEntries = [
    {
        question: 'Is this for futures, forex, or both?',
        answer:
            'Both. The session clock supports intraday routines, and the economic events view helps for futures and FX pairs that react to high-impact releases.',
    },
    {
        question: 'Where does the economic calendar data come from?',
        answer:
            'The calendar is powered by Forex Factory economic event data.',
    },
    {
        question: 'Can I add my own custom events?',
        answer:
            'Yes. You can create custom events for personal timing windows, routines, or rules. Saving/sync may require a free account.',
    },
    {
        question: 'Can I get notifications for upcoming events?',
        answer:
            'Yes—where supported, you can enable reminders/notifications so you stay ahead of scheduled catalysts.',
    },
    {
        question: 'Do I need an account?',
        answer:
            'You can use the session clock right away. A free account unlocks the full calendar workspace and saves your preferences across devices.',
    },
    {
        question: 'Is this a signal tool?',
        answer:
            'No. Time 2 Trade provides timing and awareness for sessions and scheduled events. It does not provide buy or sell signals.',
    },
    {
        question: 'Does it work on mobile?',
        answer:
            'Yes. It\'s optimized for mobile and designed for fast daily checks without clutter.',
    },
];

const landingStructuredData = [
    buildSoftwareApplicationSchema({ description: heroMeta.description }),
    buildFaqSchema(faqEntries),
];

export default function HomePage2() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAuthenticated = !!user;
    const {
        sessions,
        selectedTimezone,
        clockStyle,
        showSessionNamesInCanvas,
        showPastSessionsGray,
        showClockNumbers,
        showClockHands,
        showEventsOnCanvas,
        eventFilters,
        newsSource,
        showHandClock,
        backgroundBasedOnSession,
    } = useSettings();
    const timeEngine = useTimeEngine(selectedTimezone);

    const { currentTime, activeSession } = useClock(selectedTimezone, sessions, timeEngine);
    const handAnglesRef = useRef({ hour: 0, minute: 0, second: 0 });
    useClockVisibilitySnap({ handAnglesRef, currentTime, resumeToken: timeEngine?.resumeToken });

    const [heroClockSize, setHeroClockSize] = useState(320);
    const [renderedClockSize, setRenderedClockSize] = useState(320);
    const clockContainerRef = useRef(null);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [showInitialLoader, setShowInitialLoader] = useState(true);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [customDialogOpen, setCustomDialogOpen] = useState(false);
    const [timezoneModalOpen, setTimezoneModalOpen] = useState(false);
    // Scroll reveal animations removed; sections render without animated entrance.
    // No ad overlay on landing; image-only banner


    // Removed IntersectionObserver-based reveal logic and getRevealProps function

    useEffect(() => {
        // Hide the loader right after first paint so copy appears immediately
        let raf1;
        let raf2;
        if (typeof window !== 'undefined') {
            raf1 = window.requestAnimationFrame(() => {
                raf2 = window.requestAnimationFrame(() => setShowInitialLoader(false));
            });
        } else {
            setShowInitialLoader(false);
        }
        return () => {
            if (raf1) cancelAnimationFrame(raf1);
            if (raf2) cancelAnimationFrame(raf2);
        };
    }, []);

    useEffect(() => {
        const onScroll = () => {
            const threshold = (document.documentElement?.clientHeight || window.innerHeight || 0) * 0.3;
            const scrolled = window.scrollY || document.documentElement.scrollTop || 0;
            setShowBackToTop(scrolled > threshold);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Removed AdSense overlay push on landing: banner is image-only.

    useEffect(() => {
        const computeSize = () => {
            const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
            const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
            const horizontalMax = Math.max(240, Math.min(vw - 32, 520));
            const verticalMax = vh * 0.6;
            const base = Math.min(horizontalMax, verticalMax);
            const capped = Math.max(240, base);
            setHeroClockSize(Math.round(capped));
        };

        computeSize();
        const onResize = () => window.requestAnimationFrame(computeSize);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const measure = () => {
            const el = clockContainerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const next = Math.min(rect.width, heroClockSize);
            if (Number.isFinite(next) && next > 0) {
                setRenderedClockSize((prev) => (prev === next ? prev : next));
            }
        };

        measure();

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(measure);
            if (clockContainerRef.current) observer.observe(clockContainerRef.current);
            return () => observer.disconnect();
        }
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [heroClockSize]);

    const handColor = useMemo(() => '#0F172A', []);
    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const showOverlay = (showEventsOnCanvas ?? true) && (showHandClock ?? true);

    const openApp = useCallback(() => {
        navigate('/clock');
    }, [navigate]);

    const openAuthModal = useCallback(() => {
        setSettingsOpen(false);
        setAuthModalOpen(true);
    }, []);
    const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

    const [selectedEventFromClock, setSelectedEventFromClock] = useState(null);
    const closeEventModal = useCallback(() => setSelectedEventFromClock(null), []);

    const handleHeroEventClick = useCallback((evt) => {
        if (!isAuthenticated) {
            setAuthModalOpen(true);
            return;
        }
        setSelectedEventFromClock(evt);
    }, [isAuthenticated]);

    const openContactModal = useCallback(() => {
        setSettingsOpen(false);
        setContactModalOpen(true);
    }, []);
    const closeContactModal = useCallback(() => setContactModalOpen(false), []);

    const openSettings = useCallback(() => setSettingsOpen(true), []);
    const closeSettings = useCallback(() => setSettingsOpen(false), []);

    const sectionHeadingSx = {
        fontWeight: 700,
        color: theme.palette.text.primary,
        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
        lineHeight: 1.4,
    };
    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    return (
        <>
            {/* SEO metadata and modals rendered outside PublicLayout */}
            <SEO {...heroMeta} structuredData={landingStructuredData} />
            <ContactModal open={contactModalOpen} onClose={closeContactModal} />
            <AuthModal2 open={authModalOpen} onClose={closeAuthModal} redirectPath="/clock" />
            {selectedEventFromClock && isAuthenticated && (
                <Suspense fallback={null}>
                    <EventModal
                        open={Boolean(selectedEventFromClock)}
                        onClose={closeEventModal}
                        event={selectedEventFromClock}
                        timezone={selectedTimezone}
                    />
                </Suspense>
            )}
            <Suspense fallback={null}>
                <SettingsSidebar2
                    open={settingsOpen && !authModalOpen}
                    onClose={closeSettings}
                    onOpenAuth={openAuthModal}
                    onOpenContact={openContactModal}
                />
            </Suspense>
            <Suspense fallback={null}>
                <CustomEventDialog
                    open={customDialogOpen}
                    onClose={() => setCustomDialogOpen(false)}
                    onSave={() => {
                        // BEP: Auth check on save - show AuthModal2 if not authenticated
                        if (!isAuthenticated) {
                            setCustomDialogOpen(false);
                            setAuthModalOpen(true);
                        } else {
                            setCustomDialogOpen(false);
                        }
                    }}
                    defaultTimezone={selectedTimezone}
                />
            </Suspense>
            <Dialog
                open={timezoneModalOpen}
                onClose={() => setTimezoneModalOpen(false)}
                fullWidth
                maxWidth="sm"
                sx={{ zIndex: 12000 }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        pb: 1.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    Select Timezone
                    <IconButton
                        onClick={() => setTimezoneModalOpen(false)}
                        aria-label="Close timezone selector"
                        sx={{
                            color: 'text.primary',
                            p: 0.5,
                            ml: 'auto',
                            '&:hover': {
                                bgcolor: alpha(theme.palette.text.primary, 0.08),
                            },
                            '&:focus-visible': {
                                outline: '2px solid',
                                outlineColor: theme.palette.primary.main,
                                outlineOffset: '2px',
                            },
                        }}
                    >
                        <CloseIcon fontSize="medium" />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 0.5, pb: 2 }}>
                    <TimezoneSelector
                        textColor="inherit"
                        onTimezoneChange={() => setTimezoneModalOpen(false)}
                        onRequestSignUp={() => {
                            setTimezoneModalOpen(false);
                            setAuthModalOpen(true);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Loading screen with full coverage */}
            <LoadingScreen isLoading={showInitialLoader && !authModalOpen} clockSize={96} />

            {/* Navigation and main content */}
            {(() => {
                const navItems = [
                    { id: 'calendar', label: 'Calendar', to: '/calendar', icon: <CalendarMonthIcon fontSize="small" /> },
                    { id: 'clock', label: 'Trading Clock', shortLabel: 'Clock', onClick: openApp, icon: <AccessTimeIcon fontSize="small" /> },
                    { id: 'about', label: 'About', to: '/about', icon: <InfoIcon fontSize="small" /> },
                    { id: 'signin', label: 'Settings', shortLabel: 'Settings', icon: <SettingsRoundedIcon fontSize="small" /> },
                ];
                return (
                    <PublicLayout navItems={navItems} onOpenSettings={openSettings} onOpenAuth={openAuthModal} onOpenAddReminder={() => setCustomDialogOpen(true)}>
                        {/* NOTE: PublicLayout handles centering with flex:center pattern.
                             Content flows within centered container (width:100%, maxWidth:1560, px:responsive).
                             Just provide vertical padding and flex fill. No additional width constraints. */}
                        <Box
                            component="main"
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                overflowY: 'auto',
                                overflowX: 'hidden',
                                scrollBehavior: 'smooth',
                                flex: 1,
                                minHeight: 0,
                                px: { xs: 2, sm: 2, md: 4, lg: 4, xl: 2 },
                                mt: 0,
                                pt: 0,
                                pb: { xs: 'calc(3 * 8px + 48px)', sm: 'calc(4 * 8px + 48px)', md: 4 },
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(60,77,99,0.32) transparent',
                                '&::-webkit-scrollbar': {
                                    width: 6,
                                },
                                '&::-webkit-scrollbar-track': {
                                    background: 'transparent',
                                },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: 'rgba(60,77,99,0.32)',
                                    borderRadius: 999,
                                },
                                '&::-webkit-scrollbar-thumb:hover': {
                                    backgroundColor: 'rgba(60,77,99,0.45)',
                                },
                            }}
                        >
                            {/* Hero Section */}
                            <Box
                                component="section"
                                aria-labelledby="hero-heading"
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: 'row' },
                                    gap: { xs: 4, md: 6 },
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mb: { xs: 6, md: 8 },
                                }}
                            >
                                {/* Hero Content - Text Column */}
                                <Box
                                    sx={{
                                        flex: { xs: 1, lg: '1 1 60%' },
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: { xs: 'center', md: 'flex-start' },
                                        textAlign: { xs: 'center', md: 'left' },
                                        order: { xs: 2, md: 1 },
                                    }}
                                >
                                    <Stack spacing={2.5}>
                                        <Chip
                                            label="Powered by Forex Factory"
                                            sx={{
                                                alignSelf: { xs: 'center', md: 'flex-start' },
                                                bgcolor: 'rgba(0,0,0,0.06)',
                                                color: theme.palette.text.secondary,
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                                height: 28,
                                            }}
                                        />

                                        <Typography
                                            id="hero-heading"
                                            variant="h3"
                                            component="h1"
                                            sx={{
                                                fontWeight: 700,
                                                lineHeight: 1.2,
                                                color: theme.palette.text.primary,
                                                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                                                mb: 1,
                                            }}
                                        >
                                            Session Clock + Economic Calendar (NY Time)
                                        </Typography>

                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: theme.palette.text.secondary,
                                                fontSize: { xs: '1rem', md: '1.125rem' },
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            A clean intraday timing workspace for futures and forex day traders. See New York, London, and Asia sessions with countdown timers—plus a Forex Factory-powered calendar, custom events, and notifications so you never trade blind into a release.
                                        </Typography>

                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap" alignItems={{ xs: 'stretch', md: 'center' }} justifyContent={{ xs: 'center', md: 'flex-start' }}>
                                            {!isAuthenticated ? (
                                                <>
                                                    <Button
                                                        onClick={openAuthModal}
                                                        variant="contained"
                                                        color="primary"
                                                        size="large"
                                                        startIcon={<LockIcon />}
                                                        sx={{
                                                            fontWeight: 800,
                                                            px: 3,
                                                            py: 1.5,
                                                            borderRadius: 999,
                                                            textTransform: 'none',
                                                            boxShadow: 'none',
                                                            width: { xs: '100%', md: 'auto' },
                                                            '&:hover': {
                                                                boxShadow: 'none',
                                                            },
                                                        }}
                                                    >
                                                        Unlock all features
                                                    </Button>

                                                    <Button
                                                        onClick={openApp}
                                                        variant="outlined"
                                                        color="inherit"
                                                        size="large"
                                                        startIcon={<AccessTimeIcon />}
                                                        sx={{
                                                            color: theme.palette.text.primary,
                                                            fontWeight: 700,
                                                            px: 3,
                                                            py: 1.5,
                                                            borderRadius: 999,
                                                            textTransform: 'none',
                                                            width: { xs: '100%', md: 'auto' },
                                                            borderColor: theme.palette.text.primary,
                                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderColor: theme.palette.text.primary },
                                                        }}
                                                    >
                                                        Open Trading Clock
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        onClick={() => navigate('/clock')}
                                                        variant="contained"
                                                        color="primary"
                                                        size="large"
                                                        startIcon={<AccessTimeIcon />}
                                                        sx={{
                                                            fontWeight: 800,
                                                            px: 3,
                                                            py: 1.5,
                                                            borderRadius: 999,
                                                            textTransform: 'none',
                                                            boxShadow: 'none',
                                                            width: { xs: '100%', md: 'auto' },
                                                            '&:hover': {
                                                                boxShadow: 'none',
                                                            },
                                                        }}
                                                    >
                                                        Open Trading Clock
                                                    </Button>

                                                    <Button
                                                        onClick={() => navigate('/calendar')}
                                                        variant="outlined"
                                                        color="inherit"
                                                        size="large"
                                                        startIcon={<CalendarMonthIcon />}
                                                        sx={{
                                                            color: theme.palette.text.primary,
                                                            fontWeight: 700,
                                                            px: 3,
                                                            py: 1.5,
                                                            borderRadius: 999,
                                                            textTransform: 'none',
                                                            width: { xs: '100%', md: 'auto' },
                                                            borderColor: theme.palette.text.primary,
                                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderColor: theme.palette.text.primary },
                                                        }}
                                                    >
                                                        Go to Calendar
                                                    </Button>
                                                </>
                                            )}
                                        </Stack>

                                        {/* Ad/banner removed intentionally */}
                                    </Stack>
                                </Box>

                                {/* Hero Clock - Visual Column */}
                                <Box
                                    sx={{
                                        flex: { xs: '0 0 auto', md: 1, lg: '0 1 40%' },
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: { xs: '100%', md: 'auto' },
                                        maxWidth: { xs: 400, md: 500 },
                                        order: { xs: 1, md: 2 },
                                    }}
                                >
                                    <Box sx={{ width: '100%' }}>
                                        <Stack spacing={1.25} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    mb: { xs: 1.5, sm: 1 },
                                                }}
                                            >
                                                <Box
                                                    ref={clockContainerRef}
                                                    sx={{
                                                        position: 'relative',
                                                        width: '100%',
                                                        maxWidth: heroClockSize,
                                                        aspectRatio: '1 / 1',
                                                        cursor: 'default',
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                        }}
                                                    >
                                                        <Box sx={{ position: 'relative', width: renderedClockSize, height: renderedClockSize }}>
                                                            <ClockCanvas
                                                                size={renderedClockSize}
                                                                time={currentTime}
                                                                sessions={sessions}
                                                                handColor={handColor}
                                                                clockStyle={clockStyle}
                                                                showSessionNamesInCanvas={showSessionNamesInCanvas}
                                                                showPastSessionsGray={showPastSessionsGray}
                                                                showClockNumbers={showClockNumbers}
                                                                showClockHands={showClockHands}
                                                                activeSession={activeSession}
                                                                backgroundBasedOnSession={backgroundBasedOnSession}
                                                                renderHandsInCanvas={false}
                                                                handAnglesRef={handAnglesRef}
                                                                allowTouchScroll
                                                                touchTooltipDelayMs={140}
                                                            />
                                                            <ClockHandsOverlay
                                                                size={renderedClockSize}
                                                                handAnglesRef={handAnglesRef}
                                                                handColor={handColor}
                                                                time={currentTime}
                                                                showSecondsHand={showClockHands}
                                                            />
                                                            {showOverlay && (
                                                                <Suspense fallback={null}>
                                                                    <ClockEventsOverlay
                                                                        size={renderedClockSize}
                                                                        timezone={selectedTimezone}
                                                                        eventFilters={eventFilters}
                                                                        newsSource={newsSource}
                                                                        disableTooltips={!isAuthenticated}
                                                                        onEventClick={handleHeroEventClick}
                                                                        suppressTooltipAutoscroll={!isAuthenticated}
                                                                    />
                                                                </Suspense>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Button
                                                variant="text"
                                                size="small"
                                                onClick={() => setTimezoneModalOpen(true)}
                                                aria-label="Select timezone"
                                                sx={{
                                                    mt: { xs: 1.5, sm: 1.25 },
                                                    textTransform: 'none',
                                                    color: alpha(handColor, 0.7),
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    minWidth: 'auto',
                                                    px: 1,
                                                    py: 0.5,
                                                    maxWidth: '100%',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    '&:hover': {
                                                        bgcolor: alpha(handColor, 0.08),
                                                        color: handColor,
                                                    },
                                                    '&:focus-visible': {
                                                        outline: '2px solid',
                                                        outlineColor: theme.palette.primary.main,
                                                        outlineOffset: '2px',
                                                        borderRadius: 1,
                                                    },
                                                }}
                                            >
                                                {selectedTimezone?.replace(/_/g, ' ') || 'Select Timezone'}
                                            </Button>
                                        </Stack>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Social Proof Section */}
                            <Box
                                component="section"
                                id="social-proof"
                                sx={{
                                    maxWidth: { xs: '100%', lg: 1560, xl: 1560 },
                                    mx: 'auto',
                                    width: '100%',
                                    mb: { xs: 6, md: 8 },
                                }}
                            >
                                <Stack spacing={2.5} sx={{ width: '100%' }}>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                                        Social proof
                                    </Typography>
                                    <Typography variant="h5" sx={sectionHeadingSx}>
                                        Built for session-based traders and calendar users
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                        If your process includes session windows, overlaps, kill zones, or avoiding major releases, this workspace fits your day.
                                    </Typography>
                                    <Stack spacing={1.2}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                                            Good fit for:
                                        </Typography>
                                        <Stack spacing={0.75}>
                                            {socialProofFit.map((item) => (
                                                <Stack key={item} direction="row" spacing={1} alignItems="center">
                                                    <CheckCircleIcon fontSize="small" color="primary" />
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                        {item}
                                                    </Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </Box>

                            {/* Main Content Sections */}
                            <Stack spacing={{ xs: 6, md: 8 }}>
                                <Box component="section" id="problem">
                                    <Stack spacing={2.5}>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                                            The problem
                                        </Typography>
                                        <Typography variant="h5" sx={sectionHeadingSx}>
                                            Trading is hard enough - timing should not be
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                            Most day traders lose focus to friction:
                                        </Typography>
                                        <Stack spacing={0.75}>
                                            {problemPoints.map((item) => (
                                                <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                                                    <BoltIcon fontSize="small" color="primary" />
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                        {item}
                                                    </Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Stack>
                                </Box>

                                <Box component="section" id="solution">
                                    <Stack spacing={2.5}>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                                            The solution
                                        </Typography>
                                        <Typography variant="h5" sx={sectionHeadingSx}>
                                            One clean view: sessions plus scheduled catalysts
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                            Time 2 Trade combines a visual session clock with an economic events view so you can:
                                        </Typography>
                                        <Stack spacing={0.75}>
                                            {solutionPoints.map((item) => (
                                                <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                                                    <CheckCircleIcon fontSize="small" color="primary" />
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                        {item}
                                                    </Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Stack>
                                </Box>

                                <Box component="section" id="benefits">
                                    <Stack spacing={2.5}>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                                            Why day traders use Time 2 Trade
                                        </Typography>
                                        <Stack spacing={1.6}>
                                            {benefits.map((item) => (
                                                <Box key={item.title}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                                                        {item.title}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                        {item.body}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Stack>
                                </Box>

                                <Box component="section" id="features">
                                    <Stack spacing={2.5}>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                                            Features
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gap: { xs: 3, md: 4 },
                                                gridTemplateColumns: { xs: '1fr' },
                                            }}
                                        >
                                            {featureSections.map((feature) => (
                                                <Box key={feature.id}>
                                                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: { xs: 1, md: 1.2 } }}>
                                                        <Box
                                                            sx={{
                                                                color: theme.palette.primary.main,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                            }}
                                                        >
                                                            {feature.icon}
                                                        </Box>
                                                        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, color: theme.palette.text.secondary, fontWeight: 600, fontSize: '0.75rem' }}>
                                                            {feature.eyebrow}
                                                        </Typography>
                                                    </Stack>
                                                    <Typography variant="h6" sx={{ ...sectionHeadingSx, fontSize: { xs: '1.125rem', md: '1.25rem' }, mt: 1 }}>
                                                        {feature.heading}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1, lineHeight: 1.6 }}>
                                                        {feature.body}
                                                    </Typography>
                                                    {feature.bullets.length > 0 && (
                                                        <Stack spacing={{ xs: 0.7, md: 0.75 }} sx={{ mt: { xs: 1.3, md: 1.4 } }}>
                                                            {feature.bullets.map((bullet) => (
                                                                <Stack key={bullet} direction="row" spacing={{ xs: 0.85, md: 0.95 }} alignItems="flex-start">
                                                                    <CheckCircleIcon fontSize="small" color="primary" />
                                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                                        {bullet}
                                                                    </Typography>
                                                                </Stack>
                                                            ))}
                                                        </Stack>
                                                    )}
                                                    {feature.note && (
                                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 1 }}>
                                                            {feature.note}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    </Stack>
                                </Box>

                                <Box component="section" id="use-cases">
                                    <Stack spacing={2.5}>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                                            Use cases
                                        </Typography>
                                        <Stack spacing={1.75}>
                                            {useCases.map((useCase) => (
                                                <Box key={useCase.title}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                                                        {useCase.title}
                                                    </Typography>
                                                    <Stack spacing={0.6} sx={{ mt: 0.6 }}>
                                                        {useCase.bullets.map((bullet) => (
                                                            <Stack key={bullet} direction="row" spacing={1} alignItems="flex-start">
                                                                <CheckCircleIcon fontSize="small" color="primary" />
                                                                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                                    {bullet}
                                                                </Typography>
                                                            </Stack>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Stack>
                                </Box>

                                <Box component="section" id="how-it-works">
                                    <Stack spacing={2.5}>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                                            How it works
                                        </Typography>
                                        <Stack spacing={1}>
                                            {howItWorksSteps.map((step) => (
                                                <Stack key={step} direction="row" spacing={1} alignItems="flex-start">
                                                    <CheckCircleIcon fontSize="small" color="primary" />
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                        {step}
                                                    </Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Stack>
                                </Box>

                                <Box component="section" id="comparison">
                                    <Stack spacing={2.5}>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                                            Why this instead of just a calendar tab?
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                            Economic calendars are useful, but they are not built for fast intraday context.
                                        </Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                                            Time 2 Trade is different because it is:
                                        </Typography>
                                        <Stack spacing={0.75}>
                                            {comparisonPoints.map((item) => (
                                                <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                                                    <CheckCircleIcon fontSize="small" color="primary" />
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                        {item}
                                                    </Typography>
                                                </Stack>
                                            ))}
                                        </Stack>
                                    </Stack>
                                </Box>

                                <Box
                                    id="faq"
                                    component="section"
                                    aria-labelledby="faq-heading"
                                >
                                    <Stack spacing={2.5}>
                                        <Typography id="faq-heading" variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, fontSize: '0.75rem' }}>
                                            Frequently asked questions
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
                                            {faqEntries.map((faq) => (
                                                <Box key={faq.question} sx={{ borderBottom: '1px solid rgba(0,0,0,0.08)', pb: 2, mb: 2, '&:last-child': { borderBottom: 'none', mb: 0 } }}>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                                                        {faq.question}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.4 }}>
                                                        {faq.answer}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Stack>
                                </Box>

                                <Box component="section" id="final-cta">
                                    <Stack spacing={2.5} alignItems={{ xs: 'flex-start', md: 'center' }} textAlign={{ xs: 'left', md: 'center' }}>
                                        <Typography variant="h5" sx={sectionHeadingSx}>
                                            Go to the calendar with session context
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                            Check today&apos;s economic events, confirm session context with countdowns, and set your own custom events and notifications. Powered by Forex Factory with fast filters, favorites, and notes.
                                        </Typography>
                                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap" alignItems={{ xs: 'stretch', md: 'center' }} justifyContent={{ xs: 'center', md: 'center' }}>
                                            {!isAuthenticated ? (
                                                <>
                                                    <Button
                                                        onClick={openAuthModal}
                                                        variant="contained"
                                                        color="primary"
                                                        size="large"
                                                        startIcon={<LockIcon />}
                                                        sx={{
                                                            fontWeight: 800,
                                                            px: 3,
                                                            py: 1.5,
                                                            borderRadius: 999,
                                                            textTransform: 'none',
                                                            boxShadow: 'none',
                                                            width: { xs: '100%', md: 'auto' },
                                                            '&:hover': {
                                                                boxShadow: 'none',
                                                            },
                                                        }}
                                                    >
                                                        Unlock all features
                                                    </Button>
                                                    <Button
                                                        onClick={openApp}
                                                        variant="outlined"
                                                        color="inherit"
                                                        size="large"
                                                        startIcon={<AccessTimeIcon />}
                                                        sx={{
                                                            color: theme.palette.text.primary,
                                                            fontWeight: 700,
                                                            px: 3,
                                                            py: 1.5,
                                                            borderRadius: 999,
                                                            textTransform: 'none',
                                                            width: { xs: '100%', md: 'auto' },
                                                            borderColor: theme.palette.text.primary,
                                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderColor: theme.palette.text.primary },
                                                        }}
                                                    >
                                                        Open Trading Clock
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        onClick={() => navigate('/clock')}
                                                        variant="contained"
                                                        color="primary"
                                                        size="large"
                                                        startIcon={<AccessTimeIcon />}
                                                        sx={{
                                                            fontWeight: 800,
                                                            px: 3,
                                                            py: 1.5,
                                                            borderRadius: 999,
                                                            textTransform: 'none',
                                                            boxShadow: 'none',
                                                            width: { xs: '100%', md: 'auto' },
                                                            '&:hover': {
                                                                boxShadow: 'none',
                                                            },
                                                        }}
                                                    >
                                                        Open Trading Clock
                                                    </Button>
                                                    <Button
                                                        onClick={() => navigate('/calendar')}
                                                        variant="outlined"
                                                        color="inherit"
                                                        size="large"
                                                        startIcon={<CalendarMonthIcon />}
                                                        sx={{
                                                            color: theme.palette.text.primary,
                                                            fontWeight: 700,
                                                            px: 3,
                                                            py: 1.5,
                                                            borderRadius: 999,
                                                            textTransform: 'none',
                                                            width: { xs: '100%', md: 'auto' },
                                                            borderColor: theme.palette.text.primary,
                                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderColor: theme.palette.text.primary },
                                                        }}
                                                    >
                                                        Go to Calendar
                                                    </Button>
                                                </>
                                            )}
                                        </Stack>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            Not financial advice. Trading involves risk.
                                        </Typography>
                                    </Stack>
                                </Box>

                            </Stack>

                            <Box
                                component="footer"
                                sx={{
                                    maxWidth: { xs: '100%', md: 960, lg: 1200, xl: 1280 },
                                    mx: 'auto',
                                    width: '100%',
                                    mt: { xs: 8, md: 10 },
                                    pt: { xs: 4, md: 6 },
                                    borderTop: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <IconButton component="a" href="https://x.com/time2_trade" aria-label="@time2_trade on X" target="_blank" rel="noopener noreferrer" sx={{ color: theme.palette.text.primary }}>
                                            <XIcon />
                                        </IconButton>
                                    </Stack>
                                    <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
                                        <Button component={RouterLink} to="/about" variant="text" color="inherit" sx={{ textTransform: 'none', px: 0, color: theme.palette.text.primary }}>
                                            About
                                        </Button>
                                        <Button component="a" href="#faq" variant="text" color="inherit" sx={{ textTransform: 'none', px: 0, color: theme.palette.text.primary }}>
                                            FAQ
                                        </Button>
                                        <Button component="a" href="/privacy" variant="text" color="inherit" sx={{ textTransform: 'none', px: 0, color: theme.palette.text.primary }}>
                                            Privacy
                                        </Button>
                                        <Button component="a" href="/terms" variant="text" color="inherit" sx={{ textTransform: 'none', px: 0, color: theme.palette.text.primary }}>
                                            Terms
                                        </Button>
                                    </Stack>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                        © {currentYear} Time 2 Trade. All rights reserved.
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                        Not financial advice. Trading involves risk and may not be suitable for all investors.
                                    </Typography>
                                </Stack>
                            </Box>

                            {/* Back-to-top button - scrolls the main content area to top */}
                            {showBackToTop && (
                                <Box
                                    sx={{
                                        position: 'fixed',
                                        right: { xs: 12, sm: 18, md: 24 },
                                        bottom: { xs: 88, sm: 94, md: 74 },
                                        zIndex: 1200,
                                    }}
                                >
                                    <IconButton
                                        aria-label="Back to top"
                                        onClick={() => {
                                            const behavior = prefersReducedMotion ? 'auto' : 'smooth';
                                            const mainBox = document.querySelector('main[role="main"]') || document.querySelector('main');
                                            if (mainBox) mainBox.scrollTo({ top: 0, behavior });
                                        }}
                                        sx={{
                                            bgcolor: 'rgba(0,0,0,0.06)',
                                            color: theme.palette.text.primary,
                                            width: 40,
                                            height: 40,
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' },
                                        }}
                                    >
                                        <ArrowUpwardIcon />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                    </PublicLayout>
                );
            })()}
        </>
    );
}
