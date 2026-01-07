/**
 * src/components/LandingPage.jsx
 * 
 * Purpose: High-performance landing page with a live hero clock for futures and forex day traders.
 * Highlights Time 2 Trade value props with brand-safe visuals and responsive hero layout.
 * 
 * Changelog:
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

import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BoltIcon from '@mui/icons-material/Bolt';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ClockCanvas from './ClockCanvas';
import ClockHandsOverlay from './ClockHandsOverlay';
import SessionLabel from './SessionLabel';
import DigitalClock from './DigitalClock';
const ClockEventsOverlay = lazy(() => import('./ClockEventsOverlay'));
const AuthModal2 = lazy(() => import('./AuthModal2'));
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useClock } from '../hooks/useClock';
import { isColorDark } from '../utils/clockUtils';
import { buildSeoMeta } from '../utils/seoMeta';
import '../App.css';

const heroMeta = buildSeoMeta({
    title: 'Time 2 Trade | Live session clock for futures & forex day traders',
    description:
        'Award-winning dual-circle trading clock built for futures and forex day traders, including ICT, TTrades, and AMTrades students. Track London, New York, and Asia sessions with live countdowns and economic catalysts.',
    path: '/',
    keywords:
        'futures trading clock, forex session clock, ICT killzones, TTrades, AMTrades, trading sessions, economic events overlay, timezone aware clock',
});

const brandLogoSrc = '/logos/svg/Time2Trade_Logo_Secondary_White_Transparent_1080.svg';

const formatCountdown = (seconds) => {
    if (seconds == null) return 'Live now';
    const safe = Math.max(0, seconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    if (minutes > 0) return `${minutes}m ${secs.toString().padStart(2, '0')}s`;
    return `${secs}s`;
};

export default function HomePage2() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const {
        sessions,
        selectedTimezone,
        clockStyle,
        showSessionNamesInCanvas,
        showClockNumbers,
        showClockHands,
        showEventsOnCanvas,
        eventFilters,
        newsSource,
        showHandClock,
        backgroundBasedOnSession,
        backgroundColor,
    } = useSettings();

    const { currentTime, activeSession, timeToEnd, nextSession, timeToStart } = useClock(selectedTimezone, sessions);
    const handAnglesRef = useRef({ hour: 0, minute: 0, second: 0 });

    const [heroClockSize, setHeroClockSize] = useState(320);
    const [renderedClockSize, setRenderedClockSize] = useState(320);
    const clockContainerRef = useRef(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const faqEntries = useMemo(() => ([
        {
            question: 'How does Time 2 Trade handle overlapping sessions and midnight crossovers?',
            answer:
                'Sessions are plotted on a dual-circle 24h clock with strict timezone math, so overlapping ranges and midnight crossovers stay accurate whether you trade NY, London, or Asia rotations.',
        },
        {
            question: 'Can I overlay high-impact economic events on the clock?',
            answer:
                'Yes. The app pulls the latest economic calendar events and can pin them as markers on the analog clock and timeline, so you see session context and catalysts together.',
        },
        {
            question: 'Does it adapt to my timezone automatically?',
            answer:
                'The app detects your local timezone on first load and lets you override it at any time. All session arcs, countdowns, and event timestamps adjust instantly.',
        },
        {
            question: 'Is this mobile-friendly for deskless trading?',
            answer:
                'The UI scales from phones to ultrawide monitors with viewport-aware sizing, safe-area spacing, and responsive controls for quick session checks on the go.',
        },
        {
            question: 'Are my settings saved to the cloud?',
            answer:
                'Yes. When signed in, preferences sync to Firestore; guests fall back to local storage so your layout, sessions, and filters persist between visits.',
        },
    ]), []);

    useEffect(() => {
        const computeSize = () => {
            const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
            const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
            // On xs, fill most of the viewport width; height derives from width.
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

    // Measure the actual rendered clock container to keep canvas/overlays centered and bounded.
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

    useEffect(() => {
        document.title = heroMeta.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.setAttribute('content', heroMeta.description);
        }
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.setAttribute('href', heroMeta.canonical);
        } else {
            const link = document.createElement('link');
            link.setAttribute('rel', 'canonical');
            link.setAttribute('href', heroMeta.canonical);
            document.head.appendChild(link);
        }

        // Inject FAQ structured data for rich results
        const faqSchema = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqEntries.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                },
            })),
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 't2t-faq-schema';
        script.text = JSON.stringify(faqSchema);
        document.head.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [faqEntries]);

    const surfaceColor = backgroundBasedOnSession && activeSession?.color
        ? activeSession.color
        : backgroundColor || '#0f1f2f';
    const handColor = useMemo(() => (isColorDark(surfaceColor) ? '#F6F9FB' : '#0F172A'), [surfaceColor]);
    const heroGradient = 'linear-gradient(135deg, rgba(1,135,134,0.28) 0%, rgba(12,31,47,0.9) 45%, #081723 100%)';

    const handleCanvasClick = () => {
        if (isAuthenticated?.()) {
            navigate('/app');
            return;
        }
        setAuthModalOpen(true);
    };
    const handleCloseAuth = () => setAuthModalOpen(false);

    const headline = 'Live sessions, catalysts, and countdowns on a dual-circle clock';
    const subhead =
        'Built for futures and forex day traders across London, New York, and Asia rotations—trusted by ICT, TTrades, and AMTrades students for precise timing, overlap clarity, and timezone confidence.';

    const pills = [
        'London ↔ New York overlap clarity',
        'ICT killzones + AM/PM rotations',
        'Economic events pinned on-clock',
        'Guest-safe, cloud-synced settings',
        '1s refresh • zero jitter',
    ];

    const proofPoints = useMemo(() => ([
        {
            icon: <AccessTimeIcon fontSize="small" />,
            title: 'Session logic you can trust',
            body: 'Midnight crossovers, DST shifts, and overlaps handled automatically with live countdowns.',
        },
        {
            icon: <SecurityIcon fontSize="small" />,
            title: 'Resilient & secure',
            body: 'Firebase-backed auth with local fallback so layouts stay safe for guests and signed-in traders.',
        },
        {
            icon: <TrendingUpIcon fontSize="small" />,
            title: 'Economic catalysts in view',
            body: '12,966+ events available with on-clock markers and one-tap timeline context.',
        },
    ]), []);

    const secondaryBg = theme.palette.background.paper;
    const showOverlay = (showEventsOnCanvas ?? true) && (showHandClock ?? true);

    return (
        <Box
            component="main"
            sx={{
                position: 'relative',
                overflow: 'hidden',
                minHeight: 'var(--t2t-vv-height, 100dvh)',
                bgcolor: '#050b12',
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: heroGradient,
                    opacity: 0.9,
                    filter: 'saturate(1.05)',
                }}
            />

            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: 'radial-gradient(circle at 20% 20%, rgba(78,125,255,0.18), transparent 35%), radial-gradient(circle at 80% 30%, rgba(1,135,134,0.28), transparent 40%), radial-gradient(circle at 50% 80%, rgba(255,168,92,0.14), transparent 35%)',
                }}
            />

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 4, md: 6 } }}>
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
                        <Typography variant="h6" sx={{ color: '#e8edf2', fontWeight: 700 }}>
                            Time 2 Trade
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                        <Button
                            component={RouterLink}
                            to="/about"
                            variant="text"
                            color="inherit"
                            sx={{ color: '#c8d3df', fontWeight: 600, textTransform: 'none' }}
                        >
                            About
                        </Button>
                        <Button
                            component="a"
                            href="#faq"
                            variant="text"
                            color="inherit"
                            sx={{ color: '#c8d3df', fontWeight: 600, textTransform: 'none' }}
                        >
                            FAQ
                        </Button>
                    </Stack>
                </Stack>

                <Box
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
                            color: '#e8edf2',
                            width: '100%',
                            maxWidth: { xs: 720, md: 560 },
                            textAlign: { xs: 'center', md: 'left' },
                        }}
                    >
                        <Stack spacing={2.5}>
                            <Chip
                                label="Sessions • Events • Timezones"
                                sx={{
                                    alignSelf: { xs: 'center', md: 'flex-start' },
                                    bgcolor: 'rgba(1,135,134,0.14)',
                                    color: '#d8f6f3',
                                    fontWeight: 700,
                                    letterSpacing: 0.2,
                                    textTransform: 'uppercase',
                                }}
                            />

                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 800,
                                    lineHeight: 1.05,
                                    color: '#f4f7fb',
                                    textShadow: '0 12px 32px rgba(0,0,0,0.35)',
                                }}
                            >
                                {headline}
                            </Typography>

                            <Typography
                                variant="h6"
                                sx={{
                                    color: '#c7d3e0',
                                    fontWeight: 500,
                                    lineHeight: 1.5,
                                }}
                            >
                                {subhead}
                            </Typography>

                            <Stack
                                direction="row"
                                flexWrap="wrap"
                                sx={{ columnGap: 1.5, rowGap: 1.1 }}
                            >
                                {pills.map((pill) => (
                                    <Chip
                                        key={pill}
                                        label={pill}
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.08)',
                                            color: '#e8edf2',
                                            borderColor: 'rgba(255,255,255,0.18)',
                                            borderWidth: 1,
                                            borderStyle: 'solid',
                                            px: 0.5,
                                        }}
                                    />
                                ))}
                            </Stack>

                            <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
                                <Button
                                    onClick={() => {
                                        if (isAuthenticated?.()) {
                                            navigate('/app');
                                        } else {
                                            setAuthModalOpen(true);
                                        }
                                    }}
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    startIcon={<RocketLaunchIcon />}
                                    sx={{
                                        fontWeight: 800,
                                        px: { xs: 2.4, sm: 3 },
                                        py: { xs: 1.1, sm: 1.25 },
                                        borderRadius: 999,
                                        boxShadow: '0 16px 40px rgba(1,135,134,0.35)',
                                    }}
                                >
                                    Open app
                                </Button>

                                <Button
                                    component={RouterLink}
                                    to="/about"
                                    variant="outlined"
                                    color="inherit"
                                    sx={{
                                        color: '#e8edf2',
                                        borderColor: 'rgba(232,237,242,0.4)',
                                        fontWeight: 700,
                                        px: { xs: 2.1, sm: 2.6 },
                                        py: { xs: 1.05, sm: 1.15 },
                                        borderRadius: 999,
                                        '&:hover': { borderColor: '#e8edf2', backgroundColor: 'rgba(255,255,255,0.06)' },
                                    }}
                                >
                                    See product story
                                </Button>
                            </Stack>
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: '100%',
                            maxWidth: { xs: '100%', md: 560 },
                            mx: { xs: 'auto', md: 0 },
                            py: { xs: 2, sm: 1 },
                        }}
                    >
                        <Card
                            elevation={16}
                            sx={{
                                position: 'relative',
                                overflow: 'hidden',
                                borderRadius: 3,
                                bgcolor: surfaceColor,
                                boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
                                cursor: 'pointer',
                                width: '100%',
                            }}
                            onClick={handleCanvasClick}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'radial-gradient(circle at 25% 25%, rgba(78,125,255,0.18), transparent 40%), radial-gradient(circle at 80% 30%, rgba(255,111,145,0.16), transparent 35%)',
                                }}
                            />

                            <CardContent sx={{ position: 'relative', zIndex: 1, p: { xs: 2.25, sm: 3 } }}>
                                <Stack spacing={1.5} alignItems="center">
                                    <Typography
                                        variant="overline"
                                        sx={{ color: '#a6b9cc', letterSpacing: 1.2, fontWeight: 700 }}
                                    >
                                        Live hand clock
                                    </Typography>

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
                                                        showClockNumbers={showClockNumbers}
                                                        showClockHands={showClockHands}
                                                        activeSession={activeSession}
                                                        backgroundBasedOnSession={backgroundBasedOnSession}
                                                        renderHandsInCanvas={false}
                                                        handAnglesRef={handAnglesRef}
                                                    />
                                                    {showClockHands && (
                                                        <ClockHandsOverlay
                                                            size={renderedClockSize}
                                                            handAnglesRef={handAnglesRef}
                                                            handColor={handColor}
                                                            time={currentTime}
                                                        />
                                                    )}
                                                    {showOverlay && (
                                                        <Suspense fallback={null}>
                                                            <ClockEventsOverlay
                                                                size={renderedClockSize}
                                                                timezone={selectedTimezone}
                                                                eventFilters={eventFilters}
                                                                newsSource={newsSource}
                                                                onEventClick={() => { }}
                                                                suppressTooltipAutoscroll
                                                            />
                                                        </Suspense>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Stack spacing={1} alignItems="center" sx={{ textAlign: 'center' }}>
                                        <DigitalClock time={currentTime} clockSize={heroClockSize} textColor={handColor} />
                                        <SessionLabel
                                            activeSession={activeSession}
                                            showTimeToEnd
                                            timeToEnd={timeToEnd}
                                            showTimeToStart
                                            nextSession={nextSession}
                                            timeToStart={timeToStart}
                                            clockSize={heroClockSize}
                                            contrastTextColor={handColor}
                                        />
                                        <Typography variant="caption" sx={{ color: '#a9bccc' }}>
                                            {selectedTimezone?.replace(/_/g, ' ') || 'Your timezone'}
                                        </Typography>
                                    </Stack>

                                    {/* Proof points moved to best-practices section below */}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>

                <Card
                    elevation={8}
                    sx={{
                        mt: { xs: 5, md: 6 },
                        borderRadius: 3,
                        bgcolor: secondaryBg,
                        px: { xs: 2.5, sm: 3 },
                        py: { xs: 2.5, sm: 3 },
                    }}
                >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} justifyContent="space-between" alignItems="flex-start">
                        <Box>
                            <Typography variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 1, fontWeight: 700 }}>
                                For futures and forex day traders
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.text.primary, mt: 0.5 }}>
                                Faster decisions with context you trust
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, color: theme.palette.text.secondary }}>
                                Open the app to see your live dual-circle clock, session overlaps, and economic events in the same view—optimized for ICT-style timing, prop evaluations, and real accounts.
                            </Typography>
                        </Box>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <Chip icon={<AccessTimeIcon />} label={`Active: ${activeSession?.name || 'No session'}`} variant="outlined" />
                            <Chip icon={<TrendingUpIcon />} label={timeToEnd ? `Ends in ${formatCountdown(timeToEnd)}` : nextSession ? `Next in ${formatCountdown(timeToStart)}` : 'Live schedule ready'} variant="outlined" />
                        </Stack>
                    </Stack>
                </Card>

                <Card
                    elevation={6}
                    sx={{
                        mt: { xs: 3.5, md: 4 },
                        borderRadius: 3,
                        bgcolor: secondaryBg,
                        px: { xs: 2.25, sm: 2.75 },
                        py: { xs: 2.5, sm: 3 },
                    }}
                >
                    <Stack spacing={2}>
                        <Typography variant="overline" sx={{ color: theme.palette.text.secondary, letterSpacing: 1, fontWeight: 700 }}>
                            Highlights
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '12px',
                                rowGap: '14px',
                                width: '100%',
                                justifyContent: { xs: 'flex-start', sm: 'space-between' },
                            }}
                        >
                            {proofPoints.map((item) => (
                                <Box
                                    key={item.title}
                                    sx={{
                                        flex: '1 1 240px',
                                        maxWidth: { xs: '100%', sm: '32%' },
                                        minWidth: 240,
                                    }}
                                >
                                    <Stack direction="row" spacing={1.2} alignItems="flex-start">
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: '50%',
                                                bgcolor: 'rgba(1,135,134,0.12)',
                                                color: theme.palette.primary.main,
                                                display: 'grid',
                                                placeItems: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {item.icon}
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, fontWeight: 800 }}>
                                                {item.title}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                                                {item.body}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Box>
                            ))}
                        </Box>
                    </Stack>
                </Card>

                <Card
                    id="faq"
                    component="section"
                    aria-labelledby="faq-heading"
                    elevation={5}
                    sx={{
                        mt: { xs: 3.5, md: 4 },
                        mb: { xs: 2, md: 3 },
                        borderRadius: 3,
                        bgcolor: secondaryBg,
                        px: { xs: 2.25, sm: 2.75 },
                        py: { xs: 2.5, sm: 3 },
                    }}
                >
                    <Stack spacing={2.2}>
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
            </Container>
            {authModalOpen && (
                <Suspense fallback={null}>
                    <AuthModal2
                        open={authModalOpen}
                        onClose={handleCloseAuth}
                        initialMode="signup"
                    />
                </Suspense>
            )}
        </Box>
    );
}
