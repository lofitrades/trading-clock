/**
 * src/components/LandingPage.jsx
 * 
 * Purpose: High-performance landing page with a live hero clock for futures and forex day traders.
 * Highlights Time 2 Trade value props with brand-safe visuals and responsive hero layout.
 * 
 * Changelog:
 * v1.5.5 - 2026-01-14 - SCROLLBAR STYLING: Applied minimal scrollbar UI from CalendarEmbedLayout to main Box container. Thin 6px width, semi-transparent rgba(60,77,99,0.32) thumb that darkens on hover, transparent track. Provides subtle, professional scrollbar appearance consistent with /calendar page.
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
import {
    Box,
    Button,
    Chip,
    IconButton,
    SvgIcon,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BoltIcon from '@mui/icons-material/Bolt';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import InfoIcon from '@mui/icons-material/Info';
import { siX } from 'simple-icons';
import ClockCanvas from './ClockCanvas';
import ClockHandsOverlay from './ClockHandsOverlay';
const ClockEventsOverlay = lazy(() => import('./ClockEventsOverlay'));
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
    title: 'Time 2 Trade | Economic Calendar + Session Clock (Forex Factory Data)',
    description:
        'Trading economic calendar with market session clock, today\'s events overview, and visual session timeline. Built on the trusted Forex Factory source with impact/currency filters, favorites, notes, and exports.',
    path: '/',
    keywords:
        'economic calendar, forex factory calendar, trading sessions clock, market session times, today\'s economic events, forex news calendar, futures economic calendar, impact filters, currency filters, session overlaps',
});

const XIcon = (props) => (
    <SvgIcon viewBox="0 0 24 24" {...props}>
        <path d={siX.path} />
    </SvgIcon>
);

const socialProofFit = [
    'Futures and forex day traders',
    'Traders who check the economic calendar daily',
    'ICT-style students and similar timing frameworks',
    'Funded and prop traders who need repeatable routines',
];

const problemPoints = [
    'Converting timezones between your chart, calendar, and phone',
    'Missing a session transition or entering late',
    'Forgetting a high-impact event is minutes away',
    'Tab-hopping between tools just to answer: "Is it safe to trade right now?"',
];

const solutionPoints = [
    'Confirm where you are in the trading day',
    'See what is coming next',
    'Keep your routine consistent across devices',
];

const benefits = [
    {
        title: 'Know what session you are in instantly',
        body: 'A dual-ring 24-hour clock makes the trading day obvious, including overlaps.',
    },
    {
        title: 'Stay aware of high-impact event windows',
        body: 'Filter events by impact and currency to focus on what actually moves your market.',
    },
    {
        title: 'Reduce surprise volatility',
        body: 'Use the app as a fast pre-trade check: session context plus upcoming events.',
    },
    {
        title: 'Build a repeatable funded-trader routine',
        body: 'Launch fast, keep settings consistent, and stick to your plan.',
    },
];

const featureSections = [
    {
        id: 'visual-session-clock',
        icon: <AccessTimeIcon fontSize="small" />,
        eyebrow: 'Visual Session Clock',
        heading: 'Sessions at a glance (NY / London / Asia)',
        body: 'See session ranges and overlaps on a clock built for intraday decision-making.',
        bullets: [
            'Active session indicator and countdown',
            'Overlap visibility when volatility and volume often change',
            'Clean canvas-based view that works great on mobile',
        ],
    },
    {
        id: 'economic-events',
        icon: <CalendarMonthIcon fontSize="small" />,
        eyebrow: 'Economic Events Timeline',
        heading: 'Economic events where you trade',
        body: 'Track upcoming releases and keep attention on the events that matter to your strategy.',
        bullets: [
            'Filter by impact level and currency',
            'Timeline view for quick scanning',
            'Save favorites and add personal notes',
            'Export events for planning (CSV or JSON)',
        ],
        note: 'The full calendar experience is unlocked with a free account so you can save preferences and access the events workspace across devices.',
    },
    {
        id: 'timezone-confidence',
        icon: <SecurityIcon fontSize="small" />,
        eyebrow: 'Timezone Confidence',
        heading: 'Designed around New York time',
        body: 'Most intraday education and session-based execution are anchored to New York time. Time 2 Trade is built around that default workflow with optional timezone handling.',
        bullets: [
            'New York time-first experience',
            'Clear, consistent time formatting in the app',
            'Built to reduce chart and calendar timezone mismatch',
        ],
    },
    {
        id: 'performance',
        icon: <PhoneIphoneIcon fontSize="small" />,
        eyebrow: 'Performance & Speed',
        heading: 'Launch like an app, not a website',
        body: 'Install Time 2 Trade and open it instantly for quick checks before a session starts or right before a release.',
        bullets: [],
    },
];

const useCases = [
    {
        title: 'Futures day trading (ES/NQ/YM/RTY)',
        bullets: [
            'Confirm session context before entries',
            'Watch overlaps and transition windows',
            'Avoid high-impact releases without tab-hopping',
        ],
    },
    {
        title: 'Forex day trading (major pairs)',
        bullets: [
            'Stay aligned with London open and NY overlap',
            'Filter events by currency such as USD-only',
            'Keep a clean what is next view throughout the day',
        ],
    },
    {
        title: 'I only care about CPI / NFP / FOMC',
        bullets: [
            'Set filters once',
            'Open the app for a 10-second check',
            'Keep the routine simple and consistent',
        ],
    },
    {
        title: 'Funded and prop trading routines',
        bullets: [
            'Reduce rule-breaking mistakes near scheduled volatility',
            'Standardize pre-trade and mid-session checks',
            'Keep settings synced across devices',
        ],
    },
    {
        title: 'Students using timing frameworks',
        bullets: [
            'Track timing windows and session structure visually',
            'Build discipline around trade windows vs no-trade windows',
            'Pair with your charting platform as a timing HUD',
        ],
    },
];

const howItWorksSteps = [
    'Step 1 - Open the app: use the clock immediately for session context.',
    'Step 2 - Set your session view: choose what sessions and ranges stay visible and keep the display clean.',
    'Step 3 - Unlock the calendar workspace (free account): save filters, view the events timeline, favorite releases, and add notes.',
    'Step 4 - Trade with better timing: use Time 2 Trade as your timing layer next to your charts.',
];

const comparisonPoints = [
    'Visual: sessions and overlaps on a clock',
    'Fast: built for quick checks, especially on mobile',
    'Workflow-oriented: timing and scheduled catalysts together',
    'Routine-friendly: favorites, notes, exports, and fast launch',
];

const faqEntries = [
    {
        question: 'Is this for futures, forex, or both?',
        answer: 'Both. The session clock is built for intraday timing and overlaps, and the economic events view helps for futures and major FX pairs that react to high-impact releases.',
    },
    {
        question: 'Do I need an account?',
        answer: 'You can use the session clock right away. Create a free account to unlock the full economic events workspace and save your settings across devices.',
    },
    {
        question: 'Can I filter to only high-impact events?',
        answer: 'Yes. Filter by impact level and currency to focus on what matters, such as USD high-impact days.',
    },
    {
        question: 'Is this a signal tool?',
        answer: 'No. Time 2 Trade provides timing and awareness for sessions and scheduled events. It does not provide buy or sell signals.',
    },
    {
        question: 'Is this for ICT killzones?',
        answer: 'It supports that workflow with session windows, timing ranges, overlaps, and a fast way to confirm whether a major event is close.',
    },
    {
        question: 'Does it work on mobile?',
        answer: 'Yes. It is optimized for mobile and can be installed using Chrome for fast access.',
    },
];

const landingStructuredData = [
    buildSoftwareApplicationSchema({ description: heroMeta.description }),
    buildFaqSchema(faqEntries),
];

export default function HomePage2() {
    const theme = useTheme();
    const navigate = useNavigate();
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
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [showInitialLoader, setShowInitialLoader] = useState(true);
    const [authModalOpen, setAuthModalOpen] = useState(false);
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
    const timezoneLabelText = useMemo(() => (selectedTimezone ? selectedTimezone.replace(/_/g, ' ') : ''), [selectedTimezone]);
    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const showOverlay = (showEventsOnCanvas ?? true) && (showHandClock ?? true);

    const openApp = useCallback(() => {
        navigate('/app');
    }, [navigate]);

    const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
    const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

    const openContactModal = useCallback(() => setContactModalOpen(true), []);
    const closeContactModal = useCallback(() => setContactModalOpen(false), []);

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
            <AuthModal2 open={authModalOpen} onClose={closeAuthModal} redirectPath="/calendar" />

            {/* Loading screen with full coverage */}
            <LoadingScreen isLoading={showInitialLoader} clockSize={96} />

            {/* Navigation and main content */}
            {(() => {
                const navItems = [
                    { id: 'calendar', label: 'Calendar', to: '/calendar', icon: <CalendarMonthIcon fontSize="small" /> },
                    { id: 'clock', label: 'Clock', onClick: openApp, icon: <AccessTimeIcon fontSize="small" /> },
                    { id: 'about', label: 'About', to: '/about', icon: <InfoIcon fontSize="small" /> },
                ];
                return (
                    <PublicLayout navItems={navItems} onOpenSettings={openContactModal}>
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
                                mx: { xs: 2, sm: 2, md: 3 },
                                py: { xs: 3, md: 4 },
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
                                            label="Forex Factory data"
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
                                            sx={{
                                                fontWeight: 700,
                                                lineHeight: 1.2,
                                                color: theme.palette.text.primary,
                                                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                                                mb: 1,
                                            }}
                                        >
                                            Economic calendar with today&apos;s session clock and events
                                        </Typography>

                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: theme.palette.text.secondary,
                                                fontSize: { xs: '1rem', md: '1.125rem' },
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            Time 2 Trade combines a trusted Forex Factory economic calendar with a live market session clock. See today&apos;s events, overlaps, and countdowns in one clean, minimalist view with impact and currency filters, favorites, notes, and exports.
                                        </Typography>

                                        <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }}>
                                            <Button
                                                onClick={openAuthModal}
                                                variant="contained"
                                                color="primary"
                                                size="large"
                                                sx={{
                                                    fontWeight: 800,
                                                    px: 3,
                                                    py: 1.5,
                                                    borderRadius: 999,
                                                    textTransform: 'none',
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        boxShadow: 'none',
                                                    },
                                                }}
                                            >
                                                Unlock all features
                                            </Button>

                                            <Button
                                                onClick={openApp}
                                                variant="text"
                                                color="inherit"
                                                sx={{
                                                    color: theme.palette.text.primary,
                                                    fontWeight: 700,
                                                    px: 3,
                                                    py: 1.5,
                                                    borderRadius: 999,
                                                    textTransform: 'none',
                                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                                                }}
                                            >
                                                Go to Calendar
                                            </Button>
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
                                                        cursor: 'pointer',
                                                    }}
                                                    onClick={openApp}
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
                                                                        disableTooltips
                                                                        onEventClick={openApp}
                                                                        suppressTooltipAutoscroll
                                                                    />
                                                                </Suspense>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            {timezoneLabelText ? (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        mt: { xs: 1.25, sm: 1 },
                                                        color: '#c7d3e0',
                                                        textAlign: 'center',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {timezoneLabelText}
                                                </Typography>
                                            ) : null}
                                        </Stack>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Social Proof Section */}
                            <Box
                                component="section"
                                id="social-proof"
                                sx={{
                                    maxWidth: { xs: '100%', md: 960, lg: 1200, xl: 1280 },
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
                                            Check today&apos;s economic events, see which session you&apos;re in, and stay aligned with overlaps and countdowns. Powered by the Forex Factory source with filters, favorites, notes, and exports.
                                        </Typography>
                                        <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'center' }}>
                                            <Button
                                                onClick={openAuthModal}
                                                variant="contained"
                                                color="primary"
                                                size="large"
                                                sx={{
                                                    fontWeight: 800,
                                                    px: 3,
                                                    py: 1.5,
                                                    borderRadius: 999,
                                                    textTransform: 'none',
                                                    boxShadow: 'none',
                                                    '&:hover': {
                                                        boxShadow: 'none',
                                                    },
                                                }}
                                            >
                                                Unlock all features
                                            </Button>
                                            <Button
                                                onClick={openApp}
                                                variant="text"
                                                color="inherit"
                                                sx={{
                                                    color: theme.palette.text.primary,
                                                    fontWeight: 700,
                                                    px: 3,
                                                    py: 1.5,
                                                    borderRadius: 999,
                                                    textTransform: 'none',
                                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                                                }}
                                            >
                                                Go to Calendar
                                            </Button>
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
