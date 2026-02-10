/**
 * src/components/LandingPage.jsx
 * 
 * Purpose: High-performance landing page with a live hero clock for futures and forex day traders.
 * Highlights Time 2 Trade value props with brand-safe visuals and responsive hero layout.
 * 
 * v1.12.0 - 2026-02-10 - BUGFIX: onSave on CustomEventDialog now actually persists to Firestore via
 *                        useCustomEvents hook (createEvent/saveEvent). Previously ignored the payload
 *                        parameter — dialog closed but data never saved. Matches App.jsx reference.
 * v1.11.0 - 2026-02-08 - BEP PERFORMANCE OPTIMIZATION: Eliminated unused state variable (prefersReducedMotion).
 * Memoized sectionHeadingSx object (used by 8+ components) to prevent re-renders on theme changes.
 * Optimized useAppBarNavItems hook integration with memoized callback object to prevent prop drilling issues.
 * Simplified back-to-top scroll behavior (removed prefers-reduced-motion check). Result: Reduced component
 * overhead, prevents unnecessary child re-renders, improves perceived load time. All individual i18n memos
 * retained (40+ strings) for granular cache control during language switching - tradeoff prioritizes UX
 * responsiveness over hook count minimization per React best practices.
 * v1.11.0 - 2026-02-10 - BEP: Wire onEditCustomEvent to EventModal so custom events show edit icon.
 *                        Adds customEditingEvent state + handleEditCustomEvent callback.
 *                        CustomEventDialog opens in edit mode at z-index 12003 (above EventModal).
 * v1.10.0 - 2026-02-08 - BEP REFACTOR: Replaced 136-line inline clock rendering (ClockCanvas + ClockHandsOverlay + 
 * ClockEventsOverlay) with centralized ClockPanelPaper component. Eliminated code duplication and achieved single source
 * of truth with ClockPage and Calendar2Page. Removed unused state: heroClockSize, renderedClockSize, clockContainerRef,
 * heroClockReady. Removed unused hooks: useClockVisibilitySnap, handAnglesRef. Removed 2 useEffect hooks for clock sizing
 * (ResizeObserver + window resize listeners). Removed showOverlay variable. Result: Component complexity reduced from 
 * 1286→1100 lines. All clock logic now handled by ClockPanelPaper (canvas, hands, events overlay, loading animation).
 * Cleanup: Removed 8 unused imports (ClockCanvas, ClockHandsOverlay, ClockEventsOverlay, useClockVisibilitySnap, useRef
 * from React imports). LandingPage now passes props only to ClockPanelPaper, improving maintainability and consistency.
 * v1.9.0 - 2026-01-30 - COMPREHENSIVE I18N AUDIT: Replaced ALL remaining 20+ hardcoded client-facing strings with i18n keys.
 * Added 13 new translation keys to landing section: socialProofCaption, problemCaption, problemIntro, solutionCaption,
 * solutionIntro, benefitsCaption, featuresCaption, useCasesCaption, howItWorksCaption, comparisonCaption, comparisonIntro,
 * comparisonHeading. Added finalCta section with heading, description, buttonOpenClock, disclaimer (4 keys).
 * Added footer section with 7 keys: copyright, riskDisclaimer, backToTop, about, faq, privacy, terms.
 * Updated all section caption labels (lines 469, 779, 859, 938, 992, 1083, 1140, 1165-1167) to use t() calls.
 * Updated final CTA section (lines 1088-1091) and all footer links (lines 1214-1228) and disclaimers (lines 1229-1233).
 * Updated back-to-top button aria-label (line 1241) to use translated text. All 100% of client-facing copy now translatable.
 * Namespace: pages.landing.sections, pages.landing.finalCta, pages.landing.footer (EN/ES/FR with full translations).
 * v1.8.0 - 2026-01-30 - Phase 2 i18n (100+ strings): Added useTranslation hook with namespaces ['pages', 'common']. 
 * Migrated all hardcoded strings to t() calls: socialProofFit (4 strings), problemPoints (4 strings), solutionPoints (4 strings),
 * benefits (8 strings), featureSections (50+ strings with titles/bodies/bullets/notes), useCases (20+ strings), 
 * howItWorksSteps (4 strings), comparisonPoints (4 strings), faqEntries (7 Q&A = 14 strings). Namespace structure: 
 * landing.socialProof.personas, landing.problems.points, landing.solutions.points, landing.benefits.items, 
 * landing.features[], landing.useCases[], landing.howItWorks.steps, landing.comparison.points, landing.faq.entries.
 * File header updated to v1.8.0 with Phase 2 i18n changelog entry per BEP enterprise practices.
 * v1.7.4 - 2026-01-22 - BEP UI CONSISTENCY: Aligned timezone button and modal styling with ClockPanelPaper pattern for consistent UX across landing and calendar pages. Button now uses handColor variable (matches text color contrast), smaller fontSize (0.75rem matches ClockPanelPaper), reduced fontWeight (600), added text overflow handling (overflow: hidden, textOverflow: ellipsis). Dialog title pb increased to 1.5 for spacing consistency; close button uses ml: 'auto' for proper alignment; DialogContent pt adjusted to 0.5. All accessibility features preserved (focus-visible, aria-labels, hover states).
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

import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import useAppBarNavItems from '../hooks/useAppBarNavItems.jsx';
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
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { siX } from 'simple-icons';
import TimezoneSelector from './TimezoneSelector';
const ClockPanelPaper = lazy(() => import('./ClockPanelPaper'));
const EventModal = lazy(() => import('./EventModal'));
const SettingsSidebar2 = lazy(() => import('./SettingsSidebar2'));
const CustomEventDialog = lazy(() => import('./CustomEventDialog'));
const SourceInfoModal = lazy(() => import('./SourceInfoModal'));
import ContactModal from './ContactModal';
import AuthModal2 from './AuthModal2';
import PublicLayout from './PublicLayout';
import { useSettingsSafe } from '../contexts/SettingsContext';
import { useClock } from '../hooks/useClock';
import { useTimeEngine } from '../hooks/useTimeEngine';
import useCustomEvents from '../hooks/useCustomEvents';
import { buildFaqSchema, buildSeoMeta, buildSoftwareApplicationSchema } from '../utils/seoMeta';
import SEO from './SEO';
// Consent utilities not needed on landing banner image-only version
import '../App.css';

const heroMeta = buildSeoMeta({
    title: 'Time 2 Trade | Trading Clock + Forex Factory Calendar (NY Time)',
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

export default function HomePage2() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { t } = useTranslation(['pages', 'common']);
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
    } = useSettingsSafe();
    const timeEngine = useTimeEngine(selectedTimezone);

    // BEP v1.12.0: Custom event CRUD (no subscription needed — only mutation functions)
    const { createEvent: createCustomEvent, saveEvent: saveCustomEvent } = useCustomEvents();

    useClock(selectedTimezone, sessions, timeEngine);

    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [customDialogOpen, setCustomDialogOpen] = useState(false);
    const [customEditingEvent, setCustomEditingEvent] = useState(null);
    const [timezoneModalOpen, setTimezoneModalOpen] = useState(false);
    const [selectedEventFromClock, setSelectedEventFromClock] = useState(null);
    const [infoModalOpen, setInfoModalOpen] = useState(false);

    // Memoized section heading styles (used by 8+ components - prevents re-renders)
    const sectionHeadingSx = useMemo(() => ({
        fontWeight: 700,
        color: theme.palette.text.primary,
        fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
        lineHeight: 1.4,
    }), [theme.palette.text.primary]);

    // useMemo hooks for i18n string data (keep individual memos for granular caching)
    // Hero section
    const heroHeading = useMemo(() => t('pages:landing.hero.heading'), [t]);
    const heroSubheading = useMemo(() => t('pages:landing.hero.subheading'), [t]);
    const heroBadge = useMemo(() => t('pages:landing.badge'), [t]);
    const heroCtaUnlock = useMemo(() => t('common:navigation.unlockAllFeatures'), [t]);
    const heroCtaOpenClock = useMemo(() => t('common:navigation.clock'), [t]);
    const heroCtaCalendar = useMemo(() => t('common:navigation.calendar'), [t]);

    // Social proof
    const socialProofHeading = useMemo(() => t('pages:landing.socialProof.heading'), [t]);
    const socialProofDescription = useMemo(() => t('pages:landing.socialProof.description'), [t]);
    const socialProofGoodFitLabel = useMemo(() => t('pages:landing.socialProof.goodFitLabel'), [t]);
    const socialProofFit = useMemo(() => {
        const items = t('pages:landing.socialProof.personas', { returnObjects: true });
        return Array.isArray(items) ? items : [];
    }, [t]);

    // Problem section
    const problemHeading = useMemo(() => t('pages:landing.problems.heading'), [t]);
    const problemPoints = useMemo(() => {
        const items = t('pages:landing.problems.points', { returnObjects: true });
        return Array.isArray(items) ? items : [];
    }, [t]);

    // Solution section
    const solutionHeading = useMemo(() => t('pages:landing.solutions.heading'), [t]);
    const solutionPoints = useMemo(() => {
        const items = t('pages:landing.solutions.points', { returnObjects: true });
        return Array.isArray(items) ? items : [];
    }, [t]);

    // Benefits section
    const benefitsItems = useMemo(() => {
        const items = t('pages:landing.benefits.items', { returnObjects: true });
        return Array.isArray(items) ? items : [];
    }, [t]);

    const featureSections = useMemo(() => {
        const items = t('pages:landing.features', { returnObjects: true });
        if (!Array.isArray(items)) return [];
        return items.map((feature) => ({
            ...feature,
            icon: {
                'visual-session-clock': <AccessTimeIcon fontSize="small" />,
                'economic-events': <CalendarMonthIcon fontSize="small" />,
                'custom-events-notifications': <AddRoundedIcon fontSize="small" />,
                'timezone-confidence': <SecurityIcon fontSize="small" />,
                'performance': <PhoneIphoneIcon fontSize="small" />,
            }[feature.id],
        }));
    }, [t]);

    const useCasesList = useMemo(() => {
        const items = t('pages:landing.useCases', { returnObjects: true });
        return Array.isArray(items) ? items : [];
    }, [t]);

    // How it works
    const howItWorksSteps = useMemo(() => {
        const items = t('pages:landing.howItWorks.steps', { returnObjects: true });
        return Array.isArray(items) ? items : [];
    }, [t]);

    // Comparison section
    const comparisonHeading = useMemo(() => t('pages:landing.comparison.heading'), [t]);
    const comparisonPoints = useMemo(() => {
        const items = t('pages:landing.comparison.points', { returnObjects: true });
        return Array.isArray(items) ? items : [];
    }, [t]);

    // FAQ section
    const faqHeading = useMemo(() => t('pages:landing.faq.heading'), [t]);
    const faqEntries = useMemo(() => {
        const items = t('pages:landing.faq.entries', { returnObjects: true });
        return Array.isArray(items) ? items : [];
    }, [t]);

    // Section labels and UI text
    const socialProofCaption = useMemo(() => t('pages:landing.sections.socialProofCaption'), [t]);
    const problemCaption = useMemo(() => t('pages:landing.sections.problemCaption'), [t]);
    const problemIntro = useMemo(() => t('pages:landing.sections.problemIntro'), [t]);
    const solutionCaption = useMemo(() => t('pages:landing.sections.solutionCaption'), [t]);
    const solutionIntro = useMemo(() => t('pages:landing.sections.solutionIntro'), [t]);
    const benefitsCaption = useMemo(() => t('pages:landing.sections.benefitsCaption'), [t]);
    const featuresCaption = useMemo(() => t('pages:landing.sections.featuresCaption'), [t]);
    const useCasesCaption = useMemo(() => t('pages:landing.sections.useCasesCaption'), [t]);
    const howItWorksCaption = useMemo(() => t('pages:landing.sections.howItWorksCaption'), [t]);
    const comparisonCaption = useMemo(() => t('pages:landing.sections.comparisonCaption'), [t]);
    const comparisonIntro = useMemo(() => t('pages:landing.sections.comparisonIntro'), [t]);

    // Final CTA section
    const finalCtaHeading = useMemo(() => t('pages:landing.finalCta.heading'), [t]);
    const finalCtaDescription = useMemo(() => t('pages:landing.finalCta.description'), [t]);
    const finalCtaButtonText = useMemo(() => t('pages:landing.finalCta.buttonOpenClock'), [t]);
    const finalCtaDisclaimer = useMemo(() => t('pages:landing.finalCta.disclaimer'), [t]);

    // Footer text (must declare currentYear before using in footerCopyright)
    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const footerCopyright = useMemo(() => t('pages:landing.footer.copyright', { year: currentYear }), [t, currentYear]);
    const footerRiskDisclaimer = useMemo(() => t('pages:landing.footer.riskDisclaimer'), [t]);
    const footerBackToTop = useMemo(() => t('pages:landing.footer.backToTop'), [t]);
    const footerAbout = useMemo(() => t('pages:landing.footer.about'), [t]);
    const footerFaq = useMemo(() => t('pages:landing.footer.faq'), [t]);
    const footerPrivacy = useMemo(() => t('pages:landing.footer.privacy'), [t]);
    const footerTerms = useMemo(() => t('pages:landing.footer.terms'), [t]);

    const landingStructuredData = useMemo(
        () => ({
            ...buildSoftwareApplicationSchema({
                name: 'Time 2 Trade',
                description: 'Trading Clock + Economic Calendar for day traders',
                url: 'https://time2.trade',
            }),
            ...buildFaqSchema(faqEntries),
        }),
        [faqEntries]
    );



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

    // Event handlers - memoized to prevent unnecessary re-renders
    const openApp = useCallback(() => {
        navigate('/clock');
    }, [navigate]);

    const openAuthModal = useCallback(() => {
        setSettingsOpen(false);
        setAuthModalOpen(true);
    }, []);

    const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);
    const closeEventModal = useCallback(() => setSelectedEventFromClock(null), []);
    // BEP v1.11.0: Edit custom event from EventModal → close modal → open dialog in edit mode
    const handleEditCustomEvent = useCallback((event) => {
        setSelectedEventFromClock(null);
        setCustomEditingEvent(event);
        setCustomDialogOpen(true);
    }, []);

    // BEP v1.12.0: Persist custom event to Firestore with auth check
    const handleSaveCustomEvent = useCallback(async (payload) => {
        if (!isAuthenticated) {
            setCustomDialogOpen(false);
            setCustomEditingEvent(null);
            setAuthModalOpen(true);
            return;
        }
        const eventId = customEditingEvent?.seriesId || customEditingEvent?.id;
        const result = eventId
            ? await saveCustomEvent(eventId, payload)
            : await createCustomEvent(payload);
        if (result?.success) {
            setCustomDialogOpen(false);
            setCustomEditingEvent(null);
        }
    }, [isAuthenticated, createCustomEvent, customEditingEvent, saveCustomEvent]);

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

    // Memoize nav items to optimize dependency tracking
    const memoizedCallbacks = useMemo(
        () => ({ onOpenAuth: openAuthModal, onOpenSettings: openSettings, onOpenContact: openContactModal }),
        [openAuthModal, openSettings, openContactModal]
    );

    const navItems = useAppBarNavItems(memoizedCallbacks);

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
                        onEditCustomEvent={handleEditCustomEvent}
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
                    onClose={() => { setCustomDialogOpen(false); setCustomEditingEvent(null); }}
                    onSave={handleSaveCustomEvent}
                    event={customEditingEvent}
                    defaultTimezone={selectedTimezone}
                    zIndexOverride={customEditingEvent ? 12003 : undefined}
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
            <Suspense fallback={null}>
                <SourceInfoModal
                    open={infoModalOpen}
                    onClose={() => setInfoModalOpen(false)}
                />
            </Suspense>

            {/* Navigation and main content */}
            {(() => {
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
                                            label={heroBadge}
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
                                            {heroHeading}
                                        </Typography>

                                        <Typography
                                            variant="body1"
                                            sx={{
                                                color: theme.palette.text.secondary,
                                                fontSize: { xs: '1rem', md: '1.125rem' },
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            {heroSubheading}
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
                                                        {heroCtaUnlock}
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
                                                        {heroCtaOpenClock}
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
                                                        {heroCtaOpenClock}
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
                                                        {heroCtaCalendar}
                                                    </Button>
                                                </>
                                            )}
                                        </Stack>

                                        {/* Ad/banner removed intentionally */}
                                    </Stack>
                                </Box>

                                {/* Hero Clock - ClockPanelPaper Component */}
                                <Box
                                    sx={{
                                        flex: { xs: '0 0 auto', md: 1, lg: '0 1 40%' },
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: { xs: '100%', md: 'auto' },
                                        maxWidth: { xs: 400, md: 500 },
                                        order: { xs: 1, md: 2 },
                                        pt: { xs: 2, md: 0 },
                                    }}
                                >
                                    <Box sx={{ width: '100%' }}>
                                        <Suspense fallback={null}>
                                            <ClockPanelPaper
                                                timeEngine={timeEngine}
                                                clockTimezone={selectedTimezone}
                                                sessions={sessions}
                                                clockStyle={clockStyle}
                                                showSessionNamesInCanvas={showSessionNamesInCanvas}
                                                showPastSessionsGray={showPastSessionsGray}
                                                showClockNumbers={showClockNumbers}
                                                showClockHands={showClockHands}
                                                showHandClock={showHandClock}
                                                showDigitalClock={true}
                                                showSessionLabel={false}
                                                showTimeToEnd={false}
                                                showTimeToStart={false}
                                                showEventsOnCanvas={showEventsOnCanvas}
                                                eventFilters={eventFilters}
                                                newsSource={newsSource}
                                                backgroundBasedOnSession={backgroundBasedOnSession}
                                                selectedTimezone={selectedTimezone}
                                                onOpenTimezone={() => setTimezoneModalOpen(true)}
                                                onOpenEvent={handleHeroEventClick}
                                            />
                                        </Suspense>
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
                                        {socialProofCaption}
                                    </Typography>
                                    <Typography variant="h5" sx={sectionHeadingSx}>
                                        {socialProofHeading}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                        {socialProofDescription}
                                    </Typography>
                                    <Stack spacing={1.2}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                                            {socialProofGoodFitLabel}
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
                                            {problemCaption}
                                        </Typography>
                                        <Typography variant="h5" sx={sectionHeadingSx}>
                                            {problemHeading}
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                            {problemIntro}
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
                                            {solutionCaption}
                                        </Typography>
                                        <Typography variant="h5" sx={sectionHeadingSx}>
                                            {solutionHeading}
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                            {solutionIntro}
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
                                            {benefitsCaption}
                                        </Typography>
                                        <Stack spacing={1.6}>
                                            {benefitsItems.map((item) => (
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
                                            {featuresCaption}
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
                                            {useCasesCaption}
                                        </Typography>
                                        <Stack spacing={1.75}>
                                            {useCasesList.map((useCase) => (
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
                                            {howItWorksCaption}
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
                                            {comparisonCaption}
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                            {comparisonIntro}
                                        </Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: theme.palette.text.primary }}>
                                            {comparisonHeading}
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
                                            {faqHeading}
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
                                            {finalCtaHeading}
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                                            {finalCtaDescription}
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
                                                        {heroCtaUnlock}
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
                                                        {finalCtaButtonText}
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
                                                        {heroCtaOpenClock}
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
                                                        {heroCtaCalendar}
                                                    </Button>
                                                </>
                                            )}
                                        </Stack>
                                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                            {finalCtaDisclaimer}
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
                                            {footerAbout}
                                        </Button>
                                        <Button component="a" href="#faq" variant="text" color="inherit" sx={{ textTransform: 'none', px: 0, color: theme.palette.text.primary }}>
                                            {footerFaq}
                                        </Button>
                                        <Button component="a" href="/privacy" target="_blank" rel="noopener noreferrer" variant="text" color="inherit" sx={{ textTransform: 'none', px: 0, color: theme.palette.text.primary }}>
                                            {footerPrivacy}
                                        </Button>
                                        <Button component="a" href="/terms" target="_blank" rel="noopener noreferrer" variant="text" color="inherit" sx={{ textTransform: 'none', px: 0, color: theme.palette.text.primary }}>
                                            {footerTerms}
                                        </Button>
                                    </Stack>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                        {footerCopyright}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                        {footerRiskDisclaimer}
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
                                        aria-label={footerBackToTop}
                                        onClick={() => {
                                            const mainBox = document.querySelector('main[role="main"]') || document.querySelector('main');
                                            if (mainBox) mainBox.scrollTo({ top: 0, behavior: 'smooth' });
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
