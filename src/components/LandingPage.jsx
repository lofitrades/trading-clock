/**
 * src/components/LandingPage.jsx
 * 
 * Purpose: High-performance landing page with a live hero clock for futures and forex day traders.
 * Highlights Time 2 Trade value props with brand-safe visuals and responsive hero layout.
 * 
 * Changelog:
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
    Card,
    CardContent,
    Chip,
    Container,
    Drawer,
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
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { siX } from 'simple-icons';
import ClockCanvas from './ClockCanvas';
import ClockHandsOverlay from './ClockHandsOverlay';
const ClockEventsOverlay = lazy(() => import('./ClockEventsOverlay'));
import LoadingScreen from './LoadingScreen';
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

const brandLogoSrc = '/logos/svg/Time2Trade_Logo_Main_Multicolor_Transparent_1080.svg';

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
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [showInitialLoader, setShowInitialLoader] = useState(true);
    // Scroll reveal animations removed; sections render without animated entrance.
    // No ad overlay on landing; image-only banner


    // Removed IntersectionObserver-based reveal logic

    const getRevealProps = useCallback(() => ({ ref: undefined, sx: {} }), []);

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
        navigate('/calendar');
    }, [navigate]);

    const openMobileNav = () => setMobileNavOpen(true);
    const closeMobileNav = () => setMobileNavOpen(false);

    const navLinks = useMemo(
        () => [
            { label: 'Go to Calendar', onClick: openApp },
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Features', href: '#features' },
            { label: 'Use cases', href: '#use-cases' },
            { label: 'FAQ', href: '#faq' },
            { label: 'About', to: '/about' },
            { label: 'Contact', to: '/contact' },
        ],
        [openApp],
    );

    const sectionCardSx = {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '24px',
        bgcolor: 'rgba(255,255,255,0.92)',
        backgroundImage: 'linear-gradient(160deg, rgba(255,255,255,0.98), rgba(242,246,255,0.9))',
        boxShadow: '0 26px 78px rgba(15,23,42,0.08), 0 4px 18px rgba(15,23,42,0.05)',
        border: '1px solid rgba(255,255,255,0.7)',
        outline: '1px solid rgba(15,23,42,0.04)',
        backdropFilter: 'blur(16px)',
        px: { xs: 2.6, sm: 3.1 },
        py: { xs: 2.9, sm: 3.3 },
        '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(120% 80% at 18% 0%, rgba(255,255,255,0.36), transparent 55%), linear-gradient(120deg, rgba(255,255,255,0.18), transparent 38%)',
            opacity: 0.9,
            pointerEvents: 'none',
            mixBlendMode: 'screen',
        },
        '&::after': {
            content: '""',
            position: 'absolute',
            inset: 1,
            borderRadius: '22px',
            border: '1px solid rgba(255,255,255,0.55)',
            pointerEvents: 'none',
        },
    };

    const heroClockReveal = getRevealProps('hero-clock', { delay: 70, distance: 12 });
    const problemReveal = getRevealProps('problem', { distance: 22 });
    const solutionReveal = getRevealProps('solution', { distance: 22, delay: 60 });
    const benefitsReveal = getRevealProps('benefits', { distance: 22, delay: 90 });
    const featuresReveal = getRevealProps('features', { distance: 22 });
    const useCasesReveal = getRevealProps('use-cases', { distance: 22, delay: 60 });
    const howItWorksReveal = getRevealProps('how-it-works', { distance: 22, delay: 90 });
    const comparisonReveal = getRevealProps('comparison', { distance: 22 });
    const faqReveal = getRevealProps('faq', { distance: 22, delay: 60 });
    const finalCtaReveal = getRevealProps('final-cta', { distance: 18 });
    const sectionHeadingSx = {
        fontWeight: 800,
        color: theme.palette.text.primary,
        letterSpacing: '-0.01em',
        fontSize: { xs: '1.38rem', sm: '1.46rem', md: '1.62rem' },
        lineHeight: 1.3,
    };
    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }, []);

    return (
        <>
            <SEO {...heroMeta} structuredData={landingStructuredData} />
            <Box
                component="main"
                sx={{
                    overflow: 'hidden',
                    minHeight: 'var(--t2t-vv-height, 100dvh)',
                    bgcolor: '#f8f9fb',
                    scrollBehavior: 'smooth',
                }}
            >
                <LoadingScreen isLoading={showInitialLoader} clockSize={96} />

                <Container
                    maxWidth={false}
                    sx={{
                        position: 'relative',
                        zIndex: 1,
                        py: { xs: 5, md: 7.25 },
                        px: { xs: 2.5, sm: 3, md: 3.5, xl: 4.5 },
                        maxWidth: { xs: '100%', md: 1160, lg: 1320, xl: 1520 },
                        mx: 'auto',
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: { xs: 3, md: 4 } }}>
                        <Stack
                            component={RouterLink}
                            to="/"
                            direction="row"
                            alignItems="center"
                            spacing={1.25}
                            sx={{
                                textDecoration: 'none',
                                color: 'inherit',
                                '&:focus-visible': {
                                    outline: '2px solid rgba(255,255,255,0.6)',
                                    outlineOffset: 4,
                                    borderRadius: 1,
                                },
                            }}
                        >
                            <Box
                                component="img"
                                src={brandLogoSrc}
                                alt="Time 2 Trade logo"
                                sx={{
                                    display: 'block',
                                    height: { xs: 34, sm: 38, md: 42 },
                                    width: 'auto',
                                    maxWidth: '70vw',
                                    objectFit: 'contain',
                                }}
                            />
                            <Typography variant="h7" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                                Time 2 Trade
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1.1} alignItems="center" flexWrap="wrap" justifyContent="flex-end" sx={{ display: { xs: 'none', md: 'flex' } }}>
                            {navLinks
                                .filter((link) => link.label !== 'Go to Calendar')
                                .map((link) => {
                                    if (link.to) {
                                        return (
                                            <Button key={link.label} component={RouterLink} to={link.to} variant="text" color="inherit" sx={{ color: theme.palette.text.primary, fontWeight: 600, textTransform: 'none' }}>
                                                {link.label}
                                            </Button>
                                        );
                                    }
                                    return (
                                        <Button key={link.label} component="a" href={link.href} variant="text" color="inherit" sx={{ color: theme.palette.text.primary, fontWeight: 600, textTransform: 'none' }}>
                                            {link.label}
                                        </Button>
                                    );
                                })}
                            <Button
                                onClick={openApp}
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<CalendarMonthIcon />}
                                sx={{ fontWeight: 800, borderRadius: 999, px: 2.2, py: 1 }}
                            >
                                Go to Calendar
                            </Button>
                        </Stack>

                        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>
                            <Button
                                onClick={openApp}
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<CalendarMonthIcon />}
                                sx={{ fontWeight: 800, borderRadius: 999, px: 2, py: 0.8 }}
                            >
                                Go to Calendar
                            </Button>
                            <IconButton aria-label="Open navigation" onClick={openMobileNav} sx={{ color: theme.palette.text.primary }}>
                                <MenuIcon />
                            </IconButton>
                        </Box>
                    </Stack>

                    <Drawer anchor="right" open={mobileNavOpen} onClose={closeMobileNav} PaperProps={{ sx: { width: 320, bgcolor: '#ffffff', color: theme.palette.text.primary } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2.5, pb: 1.5 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Box component="img" src={brandLogoSrc} alt="Time 2 Trade logo" sx={{ height: 30, width: 'auto', objectFit: 'contain' }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                    Time 2 Trade
                                </Typography>
                            </Stack>
                            <IconButton aria-label="Close navigation" onClick={closeMobileNav} sx={{ color: '#f4f7fb' }}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <Stack spacing={1} sx={{ px: 2.5, pb: 3 }}>
                            {navLinks.map((link) => {
                                if (link.onClick) {
                                    return (
                                        <Button
                                            key={link.label}
                                            onClick={() => {
                                                closeMobileNav();
                                                link.onClick();
                                            }}
                                            variant={link.label === 'Go to Calendar' ? 'contained' : 'text'}
                                            color={link.label === 'Go to Calendar' ? 'primary' : 'inherit'}
                                            sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: link.label === 'Go to Calendar' ? 800 : 600 }}
                                            startIcon={link.label === 'Go to Calendar' ? <CalendarMonthIcon /> : undefined}
                                        >
                                            {link.label}
                                        </Button>
                                    );
                                }

                                if (link.to) {
                                    return (
                                        <Button
                                            key={link.label}
                                            component={RouterLink}
                                            to={link.to}
                                            variant="text"
                                            color="inherit"
                                            onClick={closeMobileNav}
                                            sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 600 }}
                                        >
                                            {link.label}
                                        </Button>
                                    );
                                }

                                return (
                                    <Button
                                        key={link.label}
                                        component="a"
                                        href={link.href}
                                        variant="text"
                                        color="inherit"
                                        onClick={closeMobileNav}
                                        sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 600 }}
                                    >
                                        {link.label}
                                    </Button>
                                );
                            })}
                        </Stack>
                    </Drawer>

                    <Box
                        component="section"
                        aria-labelledby="hero-heading"
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column-reverse', md: 'row' },
                            gap: { xs: 3, md: 4 },
                            alignItems: { xs: 'center', md: 'flex-start' },
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box
                            sx={{
                                color: theme.palette.text.primary,
                                width: '100%',
                                maxWidth: { xs: '100%', md: 640, lg: 720, xl: 820 },
                                flexGrow: 1,
                                textAlign: { xs: 'center', md: 'left' },
                            }}
                        >
                            <Stack spacing={2.5}>
                                <Chip
                                    label="Forex Factory data"
                                    sx={{
                                        alignSelf: { xs: 'center', md: 'flex-start' },
                                        bgcolor: 'rgba(15, 23, 42, 0.06)',
                                        color: theme.palette.text.primary,
                                        fontWeight: 700,
                                        letterSpacing: 0.2,
                                        textTransform: 'uppercase',
                                    }}
                                />

                                <Typography
                                    id="hero-heading"
                                    variant="h3"
                                    sx={{
                                        fontWeight: 800,
                                        lineHeight: 1.04,
                                        color: theme.palette.text.primary,
                                        letterSpacing: '-0.02em',
                                        fontSize: { xs: '2.1rem', sm: '2.45rem', md: '2.9rem', lg: '3.1rem' },
                                    }}
                                >
                                    Economic calendar with today&apos;s session clock and events
                                </Typography>

                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: theme.palette.text.secondary,
                                        fontWeight: 500,
                                        lineHeight: 1.6,
                                        fontSize: { xs: '1.02rem', sm: '1.08rem', md: '1.12rem' },
                                    }}
                                >
                                    Time 2 Trade combines a trusted Forex Factory economic calendar with a live market session clock. See today&apos;s events, overlaps, and countdowns in one clean, minimalist view with impact and currency filters, favorites, notes, and exports.
                                </Typography>

                                <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }}>
                                    <Button
                                        onClick={openApp}
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        startIcon={<CalendarMonthIcon />}
                                        sx={{
                                            fontWeight: 800,
                                            px: { xs: 2.6, sm: 3.2 },
                                            py: { xs: 1.2, sm: 1.3 },
                                            borderRadius: 999,
                                            boxShadow: '0 6px 14px rgba(15,23,42,0.08)',
                                        }}
                                    >
                                        Go to Calendar
                                    </Button>

                                    <Button
                                        component="a"
                                        href="#how-it-works"
                                        variant="outlined"
                                        color="inherit"
                                        sx={{
                                            color: theme.palette.text.primary,
                                            borderColor: 'rgba(0,0,0,0.12)',
                                            fontWeight: 700,
                                            px: { xs: 2.1, sm: 2.6 },
                                            py: { xs: 1.05, sm: 1.15 },
                                            borderRadius: 999,
                                            '&:hover': { borderColor: theme.palette.text.primary, backgroundColor: 'rgba(15,23,42,0.04)' },
                                        }}
                                    >
                                        See how it works
                                    </Button>
                                </Stack>

                                {/* Ad/banner removed intentionally */}
                            </Stack>
                        </Box>

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                maxWidth: { xs: '100%', md: 620, lg: 700, xl: 740 },
                                flexGrow: 1,
                                mx: { xs: 'auto', md: 0 },
                                py: { xs: 2, sm: 1 },
                            }}
                        >
                            <Card
                                ref={heroClockReveal.ref}
                                elevation={0}
                                sx={{
                                    ...heroClockReveal.sx,
                                    position: 'relative',
                                    overflow: 'visible',
                                    borderRadius: 0,
                                    bgcolor: 'transparent',
                                    boxShadow: 'none',
                                    width: '100%',
                                }}
                            >

                                <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 1.5, sm: 2 } }}>
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
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>

                    <Card
                        component="section"
                        id="social-proof"
                        elevation={0}
                        sx={{
                            ...sectionCardSx,
                            mt: { xs: 5, md: 6 },
                        }}
                    >
                        <Stack spacing={2.5}>
                            <Typography variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 1, fontWeight: 700 }}>
                                Social proof
                            </Typography>
                            <Typography variant="h5" sx={sectionHeadingSx}>
                                Built for session-based traders and calendar users
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                If your process includes session windows, overlaps, kill zones, or avoiding major releases, this workspace fits your day.
                            </Typography>
                            <Stack spacing={1}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
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
                    </Card>

                    <Stack spacing={{ xs: 4.25, md: 5.25 }} sx={{ mt: { xs: 4, md: 5 } }}>
                        <Card component="section" id="problem" ref={problemReveal.ref} elevation={0} sx={{ ...sectionCardSx, ...problemReveal.sx }}>
                            <Stack spacing={2.5}>
                                <Typography variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 1, fontWeight: 700 }}>
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
                        </Card>

                        <Card component="section" id="solution" ref={solutionReveal.ref} elevation={0} sx={{ ...sectionCardSx, ...solutionReveal.sx }}>
                            <Stack spacing={2.5}>
                                <Typography variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 1, fontWeight: 700 }}>
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
                        </Card>

                        <Card component="section" id="benefits" ref={benefitsReveal.ref} elevation={0} sx={{ ...sectionCardSx, ...benefitsReveal.sx }}>
                            <Stack spacing={2.5}>
                                <Typography variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 1, fontWeight: 700 }}>
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
                        </Card>

                        <Card component="section" id="features" ref={featuresReveal.ref} elevation={0} sx={{ ...sectionCardSx, ...featuresReveal.sx }}>
                            <Stack spacing={2.5}>
                                <Typography variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 1, fontWeight: 700 }}>
                                    Features
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gap: { xs: 2.4, sm: 2.8, md: 3.2, lg: 3.6 },
                                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                                        alignItems: 'stretch',
                                    }}
                                >
                                    {featureSections.map((feature) => (
                                        <Box
                                            key={feature.id}
                                            sx={{
                                                position: 'relative',
                                                borderRadius: 3,
                                                p: { xs: 2.2, sm: 2.6, md: 2.8, lg: 3 },
                                                bgcolor: 'rgba(255,255,255,0.9)',
                                                boxShadow: '0 16px 48px rgba(15,23,42,0.06), 0 2px 10px rgba(15,23,42,0.04)',
                                                border: '1px solid rgba(255,255,255,0.7)',
                                                outline: '1px solid rgba(15,23,42,0.05)',
                                                backdropFilter: 'blur(12px)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                            }}
                                        >
                                            <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: { xs: 1, md: 1.2 } }}>
                                                <Box
                                                    sx={{
                                                        width: { xs: 38, sm: 40, md: 42 },
                                                        height: { xs: 38, sm: 40, md: 42 },
                                                        borderRadius: '14px',
                                                        bgcolor: 'rgba(1,135,134,0.12)',
                                                        color: theme.palette.primary.main,
                                                        display: 'grid',
                                                        placeItems: 'center',
                                                        flexShrink: 0,
                                                        border: '1px solid rgba(1,135,134,0.2)',
                                                    }}
                                                >
                                                    {feature.icon}
                                                </Box>
                                                <Typography variant="overline" sx={{ letterSpacing: 0.9, color: theme.palette.text.secondary, fontWeight: 700 }}>
                                                    {feature.eyebrow}
                                                </Typography>
                                            </Stack>
                                            <Typography variant="h6" sx={{ ...sectionHeadingSx, fontSize: { xs: '1.18rem', sm: '1.26rem', md: '1.32rem', lg: '1.38rem' }, lineHeight: 1.35 }}>
                                                {feature.heading}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: { xs: 0.7, md: 0.8 }, lineHeight: { xs: 1.65, md: 1.7 }, fontSize: { xs: '0.95rem', sm: '0.97rem', md: '1rem' } }}>
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
                        </Card>

                        <Card component="section" id="use-cases" ref={useCasesReveal.ref} elevation={0} sx={{ ...sectionCardSx, ...useCasesReveal.sx }}>
                            <Stack spacing={2.5}>
                                <Typography variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 1, fontWeight: 700 }}>
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
                        </Card>

                        <Card component="section" id="how-it-works" ref={howItWorksReveal.ref} elevation={0} sx={{ ...sectionCardSx, ...howItWorksReveal.sx }}>
                            <Stack spacing={2.5}>
                                <Typography variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 1, fontWeight: 700 }}>
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
                        </Card>

                        <Card component="section" id="comparison" ref={comparisonReveal.ref} elevation={0} sx={{ ...sectionCardSx, ...comparisonReveal.sx }}>
                            <Stack spacing={2.5}>
                                <Typography variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 1, fontWeight: 700 }}>
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
                        </Card>

                        <Card
                            id="faq"
                            component="section"
                            aria-labelledby="faq-heading"
                            ref={faqReveal.ref}
                            elevation={0}
                            sx={{ ...sectionCardSx, ...faqReveal.sx }}
                        >
                            <Stack spacing={2.5}>
                                <Typography id="faq-heading" variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 1, fontWeight: 700 }}>
                                    Frequently asked questions
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
                                    {faqEntries.map((faq) => (
                                        <Box key={faq.question} sx={{ borderBottom: '1px solid rgba(0,0,0,0.06)', pb: 1.2 }}>
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
                        </Card>

                        <Card component="section" id="final-cta" ref={finalCtaReveal.ref} elevation={0} sx={{ ...sectionCardSx, ...finalCtaReveal.sx }}>
                            <Stack spacing={2.5} alignItems={{ xs: 'flex-start', md: 'center' }} textAlign={{ xs: 'left', md: 'center' }}>
                                <Typography variant="h5" sx={sectionHeadingSx}>
                                    Go to the calendar with session context
                                </Typography>
                                <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                    Check today&apos;s economic events, see which session you&apos;re in, and stay aligned with overlaps and countdowns. Powered by the Forex Factory source with filters, favorites, notes, and exports.
                                </Typography>
                                <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'center' }}>
                                    <Button
                                        onClick={openApp}
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        startIcon={<CalendarMonthIcon />}
                                        sx={{ fontWeight: 800, px: { xs: 2.4, sm: 3 }, py: { xs: 1.1, sm: 1.25 }, borderRadius: 999 }}
                                    >
                                        Go to Calendar
                                    </Button>
                                    <Button
                                        onClick={openApp}
                                        variant="outlined"
                                        color="inherit"
                                        sx={{
                                            color: theme.palette.text.primary,
                                            borderColor: 'rgba(0,0,0,0.14)',
                                            fontWeight: 700,
                                            px: { xs: 2.1, sm: 2.6 },
                                            py: { xs: 1.05, sm: 1.15 },
                                            borderRadius: 999,
                                            '&:hover': { borderColor: theme.palette.text.primary },
                                        }}
                                    >
                                        Create free account
                                    </Button>
                                </Stack>
                                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    Not financial advice. Trading involves risk.
                                </Typography>
                            </Stack>
                        </Card>

                        <Box
                            component="footer"
                            sx={{
                                color: theme.palette.text.primary,
                                textAlign: { xs: 'left', md: 'center' },
                                pb: { xs: 1, md: 0 },
                            }}
                        >
                            <Stack spacing={1.4} alignItems={{ xs: 'flex-start', md: 'center' }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <IconButton component="a" href="https://x.com/time2_trade" aria-label="@time2_trade on X" target="_blank" rel="noopener noreferrer" sx={{ color: theme.palette.text.primary }}>
                                        <XIcon />
                                    </IconButton>
                                </Stack>
                                <Stack direction="row" spacing={1.4} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'center' }}>
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
                    </Stack>
                </Container>

                {showBackToTop && (
                    <Box
                        sx={{
                            position: 'fixed',
                            right: { xs: 12, sm: 18, md: 24 },
                            bottom: { xs: 18, sm: 22, md: 26 },
                            zIndex: 1200,
                        }}
                    >
                        <IconButton
                            aria-label="Back to top"
                            onClick={() => {
                                const behavior = prefersReducedMotion ? 'auto' : 'smooth';
                                window.scrollTo({ top: 0, behavior });
                            }}
                            sx={{
                                bgcolor: '#0F172A',
                                color: '#ffffff',
                                boxShadow: '0 12px 32px rgba(15,23,42,0.26)',
                                border: '1px solid rgba(255,255,255,0.18)',
                                width: 48,
                                height: 48,
                                '&:hover': { bgcolor: '#16213a' },
                                '&:focus-visible': {
                                    outline: '2px solid #0ea5e9',
                                    outlineOffset: 3,
                                },
                            }}
                        >
                            <ArrowUpwardIcon />
                        </IconButton>
                    </Box>
                )}

            </Box>
        </>
    );
}
