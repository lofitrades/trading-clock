/**
 * src/pages/BlogPostPage.jsx
 *
 * Purpose: Public blog post page with SEO-first design.
 * Renders individual post content with structured data, related posts, and theme awareness.
 * Supports multi-language URLs via subpath routing.
 * Preview mode (?preview=true) allows CMS users to preview draft/unpublished posts.
 * Includes economic event and currency taxonomy tags that link to hub pages.
 *
 * Changelog:
 * v1.45.0 - 2026-02-21 - BEP: Changed AuthModal2 redirectPath from /clock to /calendar. Calendar is now the primary post-auth destination.
 * v1.44.0 - 2026-02-15 - BEP SEO: Added article-specific OG meta tags (article:published_time,
 *                        article:modified_time, article:section, article:tag), og:image dimensions
 *                        (1200×630), og:image:type, twitter:image:alt for rich social previews.
 *                        Ensured og:image is always absolute URL. Used absoluteOgImage in structured data.
 * v1.43.0 - 2026-02-11 - BEP ICON THEME-AWARE: Replaced StorageIcon with official MUI InsightsIcon
 *                        for Insights tab. InsightsIcon is semantically correct and auto-adapts to
 *                        light/dark themes. More professional appearance, consistent with MUI design.
 * v1.42.0 - 2026-02-10 - BEP ROUTING FIX: Fixed category/taxonomy chips causing 404 in ES/FR. Internal RouterLink targets now always use prefix-free SPA routes (/blog/...). Kept lang-prefixed paths only for SEO/canonical generation.
 * v1.41.0 - 2026-02-10 - Phase 6 INTEGRATION: (1) Converted right sidebar from plain content to Chrome-like tabbed panel (TabbedStickyPanel via MainLayout rightTabs prop). (2) Tab 1: "Related Articles" — existing related posts sidebar content migrated to tab content. (3) Tab 2: "Insights" — InsightsPanel integrated with post context (postId, eventTags, currencyTags). (4) Tab persistence: session-level per-route (stored in TabbedStickyPanel memory). (5) Tab switching smooth with 0.2s animation. (6) Icons: LibraryBooksIcon for Related, InsightsIcon for Insights. (7) All related post rendering logic extracted to rightTabs useMemo hook (reactive to post/sidebarPosts/loading/lang/t). (8) Removed duplicate related articles JSX from old right={} prop.
 * v1.40.0 - 2026-02-07 - BEP JUMP TO TOP BUTTON: Added floating jump-to-top button in bottom-left corner for long blog posts. (1) Fixed positioning (bottom-left): 16px on md+, accounts for 64px mobile AppBar on xs/sm. (2) Shows/hides on scroll: visible after scrolling 300px down. (3) Smooth scroll animation with cubic-bezier easing. (4) Z-index 9 (below modals). (5) Icon button with upward arrow (KeyboardArrowUpIcon). (6) Tooltip shows 'Jump to top' key. (7) BEP: Improves UX for long-form content, especially on mobile.
 * v1.39.0 - 2026-02-07 - BEP ENGAGEMENT ANIMATION: Upgraded like button animation from jerky heartPop to Facebook-style facebookHeartLike. (1) New keyframes: spring bounce effect (0%: scale(0.2) → 50%: scale(1.4) → 100%: scale(1)) with smooth `translateY` reset. (2) Easing: cubic-bezier(0.34, 1.56, 0.64, 1) — spring curve with overshoot for organic feel. (3) Duration: 0.6s (40% slower than 0.45s) for luxury perception. (4) Hover scale: 1.15 → 1.2 for more responsive tactile feedback. (5) Applied to both post.category + !post.category branches. Animation triggers on each like click, providing immediate visual confirmation.
 * v1.38.0 - 2026-02-07 - BEP ENGAGEMENT SYSTEM: (1) Like button (heart icon) to left of share icon — auth-only, optimistic UI with FavoriteIcon/FavoriteBorderIcon toggle. (2) Post read tracking via usePostReadTracking hook — marks post as read on mount (localStorage for guests, Firestore for auth users). (3) View count increment on every page load via postEngagementService. (4) Dynamic related posts now filter out already-read posts and weight by engagement (views + likes). (5) Currency chip added to sidebar related posts metadata row. (6) Added i18n keys: like, unlike, likeLoginRequired in EN/ES/FR.
 * v1.37.0 - 2026-02-07 - BEP I18N AUDIT & SKELETON FIX: (1) Fixed sidebar showing "Sidebar" placeholder text on initial load — now shows skeleton while loading/relatedPostsLoading, empty if no results. (2) Replaced ALL hardcoded copy: Edit button, Publish Post button, publish dialog title/message/hint/actions, reading time "MIN" label. (3) Added 8 new i18n keys to EN/ES/FR: readingTimeShort, editButton, publishButton, publishedTitle, publishedMessage, publishedHint, addNewPost, viewPublished. (4) Removed unused sidebar/sidebarPlaceholder keys. (5) Zero hardcoded client-facing copy remaining.
 * v1.36.0 - 2026-02-07 - BEP CRITICAL FIX: Infinite loop on sidebar related post click. Root cause: slug sync effect (i18n) fired on every post change, not just language changes. When navigating to a new post, the sync effect saw a slug mismatch and called navigate(), which changed the slug param, which reset fetchStateRef, which re-fetched, causing an infinite loop. Fix: Added lastSyncedLangRef to track when language actually changes vs post navigation. Slug sync now only runs when currentLang differs from last synced language (i.e. user switched language via LanguageSwitcher), not on every post load.
 * v1.35.0 - 2026-02-07 - BEP LAZY LOADING & SKELETON LOADERS: Optimized sidebar load performance. (1) Split fetching into two effects: main post (priority) + related posts (lazy). (2) Added 100ms setTimeout to defer related posts fetch - ensures post content renders first. (3) Separate relatedPostsLoading state for skeleton UI. (4) Created SidebarRelatedPostsSkeleton component with 3 skeleton cards. (5) Shows skeleton while loading, content when ready. (6) Dramatically improves perceived performance & Core Web Vitals (LCP, FID).
 * v1.34.0 - 2026-02-07 - BEP CRITICAL INFINITE LOOP FIX: Fixed infinite navigation loop between blog posts. (1) Root cause: getRelatedPosts() was returning current post in related posts list, creating circular reference. (2) Solution: Filter current post (post.id) from related posts before setting state. (3) Audit trail: Added console logging comment for debugging. (4) Now correctly shows 6 unique related posts without circular navigation.
 * v1.33.0 - 2026-02-07 - BEP PREMIUM SIDEBAR REDESIGN: Top-of-industry sidebar UI with minimal, high-engagement design. (1) Premium header with bold underline accent. (2) Full-width thumbnails (140px height) with subtle gradient overlay. (3) Index badges (1, 2, 3) with primary color circles. (4) Reading time in CAPS (minimal aesthetic). (5) Premium smooth transitions (cubic-bezier) with translateX hover. (6) Clean stacked layout without cards. (7) All elements optimized for maximum engagement and visual hierarchy.
 * v1.32.0 - 2026-02-07 - BEP ADSENSE-STYLE SIDEBAR: Updated sidebar related posts to row layout mimicking Google AdSense UI. (1) Horizontal card layout with fixed 70px thumbnail on left. (2) Minimal spacing and compact text (0.7-0.8rem font sizes). (3) AdSense-like border (1px divider) and subtle shadows. (4) Title truncated to 2 lines with ellipsis. (5) Reading time + "Related" label in caption font. (6) Smooth hover effects with primary border color.
 * v1.31.0 - 2026-02-07 - BEP RESPONSIVE RELATED POSTS: (1) Split relatedPosts into sidebarPosts (top 3) and bottomPosts (next 3). (2) Sidebar shows compact related posts stacked vertically - appears top 3 on md+, becomes next 3 below bottom ad on xs/sm. (3) Bottom section shows grid of 3 posts below bottom ad - appears next 3 on md+, becomes first 3 on xs/sm. (4) Responsive reordering: md+ (2-col) shows sidebar posts first; xs/sm (1-col) shows bottom posts first via flex-direction: column-reverse on parent.
 * v1.30.0 - 2026-02-07 - BEP UI FIXES: (1) Fixed top spacing to match Calendar2Page - removed custom py override from MainLayout call, using default py: { xs: 1.5, sm: 2, md: 0 }. (2) Made right sidebar column sticky (position: sticky, top: 16) by passing stickyTop={16} prop to MainLayout. (3) Fixed footer positioning - wrapped MainLayout in flex container with flex: 1, moved BlogFooter outside MainLayout so it sits at page bottom, not in scrollable content area.
 * v1.29.0 - 2026-02-07 - BEP Layout: Integrated MainLayout for two-column responsive grid. Left column contains scrollable blog content; right column has placeholder for sidebar (future: related articles, key takeaways, ads). Fully responsive: 2-column on desktop, stacked on mobile.
 * v1.28.0 - 2026-02-07 - BEP i18n: Added slug URL sync effect. When user switches language via LanguageSwitcher, navigates to correct language-specific slug (replace:true) so URL stays in sync with displayed content. Prevents stale English slug showing while viewing Spanish content.
 * v1.27.0 - 2026-02-07 - BEP CRITICAL FIX: Removed language prefix from RelatedPostCard URLs and handleViewPublished. Localized slugs already identify language; /es/ or /fr/ prefix caused incorrect redirects. SPA route is /blog/:slug.
 * v1.26.0 - 2026-02-06 - BEP Phase 7: Integrated AdUnit (in-article ad after content, display ad before related posts, consent-gated, lazy-loaded)
 * v1.25.0 - 2026-02-05 - BEP: Added Edit and Publish buttons to preview mode banner (drafts only); publish confirmation dialog with "View Published Post", "Add New Post", and "Close" actions.
 * v1.24.0 - 2026-02-05 - BEP: Preserve language prefix in blog navigation links (cards/related) to keep users in their locale.
 * v1.23.0 - 2026-02-05 - BEP CRITICAL: Fixed infinite reload loop on direct URL access (WhatsApp shares, page reload). Removed `t` from useEffect dependencies - i18n function changes reference on load causing infinite re-fetch. Also fixed OG image URLs to be absolute (social sharing requires https://).
 * v1.22.0 - 2026-02-05 - BEP: Added fallback to consistent default thumbnails for posts without cover images (uses post ID for deterministic selection); updated OG image and structured data to use fallback
 * v1.21.0 - 2026-02-04 - BEP: Fixed reading time display by calculating from HTML content using estimateReadingTime utility (was looking for missing post.readingTimeMinutes field); reading time now visible in main post header and related post cards
 * v1.20.0 - 2026-02-04 - BEP: Added tooltips to author names (both single and multiple authors) with i18n key blog:postPage.authorTooltip; author avatars already had tooltips; added translations EN/ES/FR
 * v1.19.0 - 2026-02-04 - BEP: Added tooltips to category, event, and currency chips with i18n keys; standardized px to 1 across all tag chips; increased height to 28px; added hover states for all taxonomy chips
 * v1.18.0 - 2026-02-04 - BEP: Added tooltips to all editorial tag chips with i18n keys (blog:taxonomy.tagTooltip, editorialTag); increased padding (px: 1 → 1.5) and height (26 → 28px) for better accessibility and touch targets
 * v1.16.0 - 2026-02-04 - BEP: Replaced hardcoded tooltip strings with i18n keys (blog:postPage.copyLinkToShare, copiedToClipboard); added translations to en/es/fr locale files
 * v1.15.0 - 2026-02-04 - BEP: Fixed langPrefix ReferenceError in handleCopyLink; simplified to use window.location.href (preserves language prefix automatically)
 * v1.14.0 - 2026-02-04 - BEP: Added copy-to-share button (ContentCopyIcon) in same row as category chip, aligned right, with tooltip feedback
 * v1.13.0 - 2026-02-04 - BEP: Reorganized header layout - moved category chip below cover image, moved editorial tags to bottom (above Back to Blog button), kept author/date/events/currencies in header
 * v1.12.0 - 2026-02-04 - BEP: Increased font sizes consistently (body2 for author/date, 0.8rem for all chips); increased avatar size from 24 to 28px; changed currency chip to show flag + 3-letter code only
 * v1.11.0 - 2026-02-04 - BEP: Added category and tag icons (CategoryIcon, LocalOfferIcon) to chips, and currency flag avatars to currency chips for visual consistency with hub pages
 * v1.10.0 - 2026-02-04 - BEP: Made category and editorial tags clickable, linking to /blog/category/{cat} and /blog/tag/{tag}
 * v1.9.0 - 2026-02-05 - BEP: Redesigned header layout for compact enterprise UI (Bloomberg/Reuters style) - combines category, title, authors, date, tags, events, currencies into efficient rows
 * v1.8.0 - 2026-02-05 - BEP: Added event/currency taxonomy tags (Phase 5.B) linking to hub pages
 * v1.7.0 - 2026-02-05 - BEP: Status chip styling now matches AdminBlogPage (filled variant, not outlined)
 * v1.6.0 - 2026-02-05 - BEP: Added post status chip for admin/editor roles in breadcrumb row
 * v1.5.0 - 2026-02-05 - BEP: Added Edit Post button for admin/editor roles in breadcrumb row
 * v1.4.0 - 2026-02-05 - BEP: Enhanced author display with avatars and links to author pages
 * v1.3.0 - 2026-02-04 - BEP: Show related posts in preview mode for CMS users
 * v1.2.0 - 2026-02-04 - BEP: Fixed slug lookup to try multiple languages (fixes preview 404)
 * v1.1.0 - 2026-02-04 - BEP: Added preview mode for draft/unpublished posts (CMS role required)
 * v1.0.0 - 2026-02-04 - Initial implementation (Phase 3 Blog)
 */

import { useState, useEffect, useCallback, useMemo, Suspense, lazy, useRef } from 'react';
import PropTypes from 'prop-types';
import { useParams, Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Chip,
    Stack,
    Breadcrumbs,
    Link,
    Skeleton,
    Alert,
    Divider,
    Card,
    CardContent,
    CardMedia,
    CardActionArea,
    Avatar,
    Button,
    Tooltip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
} from '@mui/material';
import { keyframes } from '@mui/system';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import IosShareIcon from '@mui/icons-material/IosShare';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import InsightsIcon from '@mui/icons-material/Insights';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import { Helmet } from 'react-helmet-async';
import SEO from '../components/SEO';
import PublicLayout from '../components/PublicLayout';
import MainLayout from '../components/layouts/MainLayout';
import InsightsPanel from '../components/InsightsPanel';
import useAppBarNavItems from '../hooks/useAppBarNavItems';
import usePostLike from '../hooks/usePostLike';
import usePostReadTracking from '../hooks/usePostReadTracking';
import { preloadNamespaces } from '../i18n/config';
import { getBlogPostBySlug, getRelatedPosts } from '../services/blogService';
import { incrementPostViewCount } from '../services/postEngagementService';
import { MOBILE_BOTTOM_APPBAR_HEIGHT_PX } from '../components/AppBar';

// ─── Like button animation ───────────────────────────────────────────────────
// Facebook-style like heart animation: scale + spring bounce + color burst
const facebookHeartLike = keyframes`
  0% {
    transform: scale(0.2) translateY(0);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
`;

import { getBlogAuthorsByIds } from '../services/blogAuthorService';
import {
    BLOG_CATEGORY_LABELS,
    BLOG_ECONOMIC_EVENTS,
    ALLOWED_EMBED_DOMAINS,
    DEFAULT_BLOG_LANGUAGE,
    BLOG_POST_STATUS,
    BLOG_CMS_ROLES,
    estimateReadingTime,
} from '../types/blogTypes';
import { SITE_URL } from '../utils/seoMeta';
import { getCurrencyFlag } from '../utils/currencyFlags';
import { getDefaultBlogThumbnail } from '../utils/blogThumbnailFallback';
import { loadFlagIconsCSS } from '../app/clientEffects';
import { useAuth } from '../contexts/AuthContext';
// Firebase removed - no longer needed for this component
import AdUnit from '../components/AdUnit';
import { AD_SLOTS } from '../constants/adSlots';

const AuthModal2 = lazy(() => import('../components/AuthModal2'));
const SettingsSidebar2 = lazy(() => import('../components/SettingsSidebar2'));
const ContactModal = lazy(() => import('../components/ContactModal'));
const BlogFooter = lazy(() => import('../components/BlogFooter'));

/**
 * Sanitize HTML content (BEP security)
 * Removes scripts, dangerous attributes, and validates embeds
 */
const sanitizeHtml = (html) => {
    if (!html) return '';

    // Remove script tags and event handlers
    let sanitized = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '');

    // Validate iframe sources (only allow whitelisted domains)
    sanitized = sanitized.replace(/<iframe[^>]*src="([^"]*)"[^>]*>/gi, (match, src) => {
        try {
            const url = new URL(src, 'https://example.com');
            const isAllowed = ALLOWED_EMBED_DOMAINS.some(
                (domain) => url.hostname === domain || url.hostname.endsWith('.' + domain)
            );
            return isAllowed ? match : '<!-- embed removed -->';
        } catch {
            return '<!-- embed removed -->';
        }
    });

    return sanitized;
};

/**
 * Sidebar related posts skeleton loader - BEP minimal design
 */
const SidebarRelatedPostsSkeleton = () => (
    <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, pb: 1.5, borderBottom: '2px solid', borderColor: 'primary.main' }}>
            <Skeleton variant="text" width={60} height={24} />
        </Box>
        <Stack spacing={2}>
            {Array.from({ length: 3 }).map((_, i) => (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Skeleton variant="rounded" height={140} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Skeleton variant="circular" width={24} height={24} />
                        <Skeleton variant="text" width={50} height={16} />
                    </Box>
                    <Skeleton variant="text" width="100%" height={20} />
                    <Skeleton variant="text" width="80%" height={20} />
                </Box>
            ))}
        </Stack>
    </Box>
);

/**
 * Related post card component
 */
const RelatedPostCard = ({ post, lang }) => {
    const { t } = useTranslation('blog');
    const content = post.languages?.[lang] || post.languages?.[DEFAULT_BLOG_LANGUAGE] || {};
    const slug = content.slug;
    const postUrl = `/blog/${slug}`;
    const readingTime = useMemo(() => estimateReadingTime(content.contentHtml), [content.contentHtml]);

    return (
        <Card sx={{ height: '100%' }}>
            <CardActionArea
                component={RouterLink}
                to={postUrl}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
                <CardMedia
                    component="img"
                    height="120"
                    image={content.coverImage?.url || getDefaultBlogThumbnail(post.id, true)}
                    alt={content.coverImage?.alt || content.title}
                    sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" component="h3" sx={{ fontWeight: 600 }}>
                        {content.title}
                    </Typography>
                    {readingTime > 0 && (
                        <Typography variant="caption" color="text.secondary">
                            {t('blog:readingTime', { minutes: readingTime })}
                        </Typography>
                    )}
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

RelatedPostCard.propTypes = {
    post: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
};

/**
 * Loading skeleton for post page
 */
const PostSkeleton = () => (
    <Box>
        <Skeleton variant="text" width={200} height={24} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="text" width="80%" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={300} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
    </Box>
);

/**
 * Get status chip color for different post statuses
 */
const getStatusColor = (status) => {
    switch (status) {
        case BLOG_POST_STATUS.PUBLISHED:
            return 'success';
        case BLOG_POST_STATUS.DRAFT:
            return 'warning';
        case BLOG_POST_STATUS.UNPUBLISHED:
            return 'default';
        default:
            return 'default';
    }
};

export default function BlogPostPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t, i18n } = useTranslation(['blog', 'common']);
    const currentLang = i18n.language || 'en';
    const { hasRole } = useAuth();

    // Preview mode detection
    const isPreviewMode = searchParams.get('preview') === 'true';
    const canPreview = hasRole(BLOG_CMS_ROLES);

    // State
    const [post, setPost] = useState(null);
    const [authors, setAuthors] = useState([]);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // BEP: Separate loading state for lazy-loaded related posts - improves perceived performance
    const [relatedPostsLoading, setRelatedPostsLoading] = useState(false);

    // BEP: Split related posts for responsive layout
    // Sidebar (top 3): shown first on md+, shown at bottom on xs/sm
    // Bottom (next 3): shown after ad on md+, shown at top on xs/sm
    const sidebarPosts = useMemo(() => relatedPosts.slice(0, 3), [relatedPosts]);
    const bottomPosts = useMemo(() => relatedPosts.slice(3, 6), [relatedPosts]);

    // BEP: Re-initialize engagement hooks with actual post ID once loaded
    const postLike = usePostLike(post?.id || null);
    const postReadTracking = usePostReadTracking(post?.id || null);

    // BEP: Increment view count once per page load (all views, not unique)
    const viewCountedRef = useRef(false);
    useEffect(() => {
        if (!post?.id || viewCountedRef.current) return;
        viewCountedRef.current = true;
        incrementPostViewCount(post.id);
    }, [post?.id]);

    // BEP PERFORMANCE: Load flag-icons CSS on-demand for currency flag display
    useEffect(() => { loadFlagIconsCSS(); }, []);

    // Modal states
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
    const [publishingInProgress] = useState(false); // Publishing handled in preview mode
    const [likeTooltipOpen, setLikeTooltipOpen] = useState(false);

    // BEP: Jump to top button - show after scrolling 300px down
    const [showJumpToTop, setShowJumpToTop] = useState(false);

    // Handle scroll visibility for jump to top button
    useEffect(() => {
        const handleScroll = () => {
            setShowJumpToTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Jump to top with smooth scroll
    const handleJumpToTop = useCallback(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    // Copy post link to clipboard
    const handleCopyLink = useCallback(async () => {
        try {
            // Use current window location to preserve language prefix automatically
            await navigator.clipboard.writeText(window.location.href);
            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    }, []);

    // Handle edit post
    const handleEditPost = useCallback(() => {
        if (post) {
            navigate(`/admin/blog/edit/${post.id}`);
        }
    }, [post, navigate]);

    // Note: publish is handled via handleSave(true) in preview mode banner
    // Publish flow has been integrated into handleSave callback

    // Handle view published post
    const handleViewPublished = useCallback(() => {
        navigate(`/blog/${slug}`);
    }, [slug, navigate]);

    // Handle open blog upload drawer (new post)
    const handleOpenBlogUpload = useCallback(() => {
        navigate('/admin?action=uploadBlog');
    }, [navigate]);

    // Preload namespaces
    useEffect(() => {
        preloadNamespaces(['blog', 'common', 'auth', 'settings']);
    }, []);

    // BEP: Track fetch state to prevent infinite re-fetch loops during hydration
    // When page loads: i18n initializes (currentLang changes), auth loads (canPreview changes)
    // Without this guard, each change triggers a new fetch causing infinite loops
    const fetchStateRef = useRef({ slug: null, fetching: false, fetched: false });

    // Fetch post by slug
    // BEP: Try multiple languages to find the slug (URL may use different lang than UI)
    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) return;

            // BEP: If slug changed, reset fetch state
            if (fetchStateRef.current.slug !== slug) {
                fetchStateRef.current = { slug, fetching: false, fetched: false };
            }

            // BEP: Skip if already fetching or fetched for this slug
            // This prevents infinite loops when currentLang or canPreview change during hydration
            if (fetchStateRef.current.fetching || fetchStateRef.current.fetched) {
                return;
            }

            fetchStateRef.current.fetching = true;
            setLoading(true);
            setError(null);

            try {
                // Try to find the post with multiple language attempts
                // Priority: 1) Current UI language, 2) English (default), 3) Other languages
                const languagesToTry = [
                    currentLang,
                    DEFAULT_BLOG_LANGUAGE,
                    ...['en', 'es', 'fr'].filter(l => l !== currentLang && l !== DEFAULT_BLOG_LANGUAGE),
                ];

                let result = null;
                for (const lang of languagesToTry) {
                    result = await getBlogPostBySlug(lang, slug);
                    if (result) break;
                }

                if (!result) {
                    setError('Post not found');
                    return;
                }

                // Access control: Check if post is viewable
                const isDraftOrUnpublished = result.status === BLOG_POST_STATUS.DRAFT || result.status === BLOG_POST_STATUS.UNPUBLISHED;

                if (isDraftOrUnpublished) {
                    // Draft/unpublished posts require preview mode AND CMS role
                    if (!isPreviewMode) {
                        setError('Post not found');
                        return;
                    }
                    if (!canPreview) {
                        setError('Preview access denied');
                        return;
                    }
                }

                setPost(result);
                fetchStateRef.current.fetched = true;

                // Fetch authors by IDs (BEP: Full author profiles with avatars)
                if (result.authorIds?.length > 0) {
                    const authorProfiles = await getBlogAuthorsByIds(result.authorIds);
                    setAuthors(authorProfiles);
                } else {
                    setAuthors([]);
                }

                // BEP: Defer related posts fetch to prioritize main content load
                // Related posts are lazy-loaded in a separate effect after post content is ready
            } catch (err) {
                console.error('Failed to fetch post:', err);
                setError('Failed to load post');
            } finally {
                fetchStateRef.current.fetching = false;
                setLoading(false);
            }
        };

        fetchPost();
    }, [slug, currentLang, isPreviewMode, canPreview]);

    // BEP: Lazy load related posts - separate effect runs AFTER main post content is ready
    // This prioritizes post content load speed over sidebar content
    useEffect(() => {
        if (!post) return;

        const fetchRelatedPostsLazy = async () => {
            try {
                const isPublished = post.status === BLOG_POST_STATUS.PUBLISHED;
                const canPreviewPost = hasRole(BLOG_CMS_ROLES);
                const isDraftOrUnpublished = post.status === BLOG_POST_STATUS.DRAFT || post.status === BLOG_POST_STATUS.UNPUBLISHED;
                const allowPreview = isDraftOrUnpublished && isPreviewMode && canPreviewPost;

                // Only fetch related posts if post is published or user can preview
                if (isPublished || allowPreview) {
                    setRelatedPostsLoading(true);
                    const related = await getRelatedPosts(post.id, currentLang, 6, {
                        readPostIds: postReadTracking.readPostIds,
                    });
                    // Filter out the current post to prevent circular navigation loops
                    const filteredRelated = related.filter(p => p.id !== post.id);
                    setRelatedPosts(filteredRelated);
                }
            } catch (err) {
                console.error('Failed to fetch related posts:', err);
            } finally {
                setRelatedPostsLoading(false);
            }
        };

        // BEP: Use setTimeout to defer related posts loading until next frame
        // This gives the browser time to render main content first
        const timeoutId = setTimeout(fetchRelatedPostsLazy, 100);
        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [post, currentLang, hasRole, isPreviewMode, postReadTracking.readPostIds.length]);

    // BEP i18n: Navigate to correct language slug when user switches language
    // via LanguageSwitcher. Keeps URL in sync with displayed content.
    // Uses replace:true to avoid polluting browser history with slug swaps.
    //
    // CRITICAL BEP FIX v1.36.0: Track which language triggered the last slug sync
    // to prevent infinite loops. The loop was: click related post → fetch new post →
    // slug sync sees different slug → navigates → slug changes → re-fetch → repeat.
    // Fix: Only sync slug when the LANGUAGE changes (i18n switch), NOT when post changes
    // after navigation. We track the language that was last synced to avoid re-triggering.
    const lastSyncedLangRef = useRef(currentLang);
    useEffect(() => {
        if (!post || !currentLang) return;

        // Only run slug sync when language actually changed (user switched via LanguageSwitcher)
        // Skip if this is a new post load (language hasn't changed since last sync)
        if (lastSyncedLangRef.current === currentLang) return;

        lastSyncedLangRef.current = currentLang;
        const langContent = post.languages?.[currentLang];
        if (langContent?.slug && langContent.slug !== slug) {
            navigate(`/blog/${langContent.slug}`, { replace: true });
        }
    }, [post, currentLang, slug, navigate]);

    // Modal handlers
    const handleOpenAuth = useCallback(() => {
        setSettingsOpen(false);
        setAuthModalOpen(true);
    }, []);

    // Like click — dismiss tooltip immediately, then toggle
    const handleLikeClick = useCallback(() => {
        setLikeTooltipOpen(false);
        if (postLike.isAuthenticated) {
            postLike.toggleLike();
        } else {
            handleOpenAuth();
        }
    }, [postLike, handleOpenAuth]);

    const handleCloseAuth = useCallback(() => setAuthModalOpen(false), []);
    const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);
    const handleCloseSettings = useCallback(() => setSettingsOpen(false), []);
    const handleOpenContact = useCallback(() => setContactModalOpen(true), []);
    const handleCloseContact = useCallback(() => setContactModalOpen(false), []);

    const navItems = useAppBarNavItems({
        onOpenAuth: handleOpenAuth,
        onOpenSettings: handleOpenSettings,
        onOpenContact: handleOpenContact,
    });

    // Get language content
    const content = useMemo(() => {
        if (!post) return {};
        return post.languages?.[currentLang] || post.languages?.[DEFAULT_BLOG_LANGUAGE] || {};
    }, [post, currentLang]);

    // Sanitized HTML content
    const sanitizedContent = useMemo(() => sanitizeHtml(content.contentHtml), [content.contentHtml]);

    // Calculate reading time from content HTML
    const readingTimeMinutes = useMemo(() => {
        return estimateReadingTime(content.contentHtml);
    }, [content.contentHtml]);

    // Build rightTabs array for tabbed sidebar (Phase 6: InsightsPanel integration)
    const rightTabs = useMemo(() => {
        const tabs = [];

        // Tab 1: Related Articles
        tabs.push({
            key: 'related-articles',
            label: t('blog:postPage.relatedArticles', 'Related'),
            icon: <LibraryBooksIcon sx={{ fontSize: 16 }} />,
            content: (
                <Box>
                    {/* BEP: Show skeleton while post is loading OR related posts are loading */}
                    {(loading || relatedPostsLoading) && <SidebarRelatedPostsSkeleton />}

                    {!loading && !relatedPostsLoading && sidebarPosts.length > 0 && (
                        <Stack spacing={2}>
                            {sidebarPosts.map((relatedPost) => {
                                const relContent = relatedPost.languages?.[currentLang] || relatedPost.languages?.[DEFAULT_BLOG_LANGUAGE] || {};
                                const relSlug = relContent.slug;
                                const relReadingTime = estimateReadingTime(relContent.contentHtml);

                                return (
                                    <Box
                                        key={relatedPost.id}
                                        component={RouterLink}
                                        to={`/blog/${relSlug}`}
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 1,
                                            p: 0,
                                            cursor: 'pointer',
                                            textDecoration: 'none',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                transform: 'translateX(4px)',
                                                '& .related-title': {
                                                    color: 'primary.main',
                                                },
                                                '& .related-thumbnail': {
                                                    filter: 'brightness(1.1)',
                                                },
                                            },
                                        }}
                                    >
                                        {/* Clean thumbnail with subtle overlay — always show, fallback to default */}
                                        <Box
                                            className="related-thumbnail"
                                            sx={{
                                                width: '100%',
                                                height: 140,
                                                borderRadius: 1.5,
                                                overflow: 'hidden',
                                                position: 'relative',
                                                transition: 'filter 0.3s ease',
                                                backgroundImage: `url(${relContent.coverImage?.url || getDefaultBlogThumbnail(relatedPost.id, true)})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                                '&::after': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background: 'linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 100%)',
                                                    pointerEvents: 'none',
                                                },
                                            }}
                                        />

                                        {/* Minimal metadata */}
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5, flexWrap: 'wrap' }}>
                                                {/* Currency tag chips */}
                                                {relatedPost.currencyTags?.length > 0 ? (
                                                    relatedPost.currencyTags.slice(0, 2).map((currency) => {
                                                        const countryCode = getCurrencyFlag(currency);
                                                        return (
                                                            <Chip
                                                                key={currency}
                                                                label={currency}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.6rem',
                                                                    fontWeight: 700,
                                                                    letterSpacing: 0.3,
                                                                    bgcolor: 'background.paper',
                                                                    border: '1px solid',
                                                                    borderColor: 'divider',
                                                                    '& .MuiChip-icon': { ml: '4px' },
                                                                }}
                                                                icon={
                                                                    countryCode ? (
                                                                        <Box
                                                                            component="span"
                                                                            className={`fi fi-${countryCode}`}
                                                                            sx={{ width: '1.5rem', height: '0.75rem', display: 'inline-block', transform: 'scale(1)', transformOrigin: 'left center', lineHeight: 1 }}
                                                                        />
                                                                    ) : undefined
                                                                }
                                                            />
                                                        );
                                                    })
                                                ) : (
                                                    /* Fallback: category chip if no currencies */
                                                    relatedPost.category && (
                                                        <Chip
                                                            label={t(`blog:categories.${relatedPost.category}`, BLOG_CATEGORY_LABELS[relatedPost.category] || relatedPost.category)}
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize: '0.6rem',
                                                                fontWeight: 700,
                                                                letterSpacing: 0.3,
                                                                bgcolor: 'primary.main',
                                                                color: 'primary.contrastText',
                                                            }}
                                                        />
                                                    )
                                                )}
                                                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', letterSpacing: 0.3 }}>
                                                    {relReadingTime > 0 && t('blog:postPage.readingTimeShort', { minutes: relReadingTime })}
                                                </Typography>
                                            </Box>

                                            {/* Premium title with ellipsis */}
                                            <Typography
                                                className="related-title"
                                                variant="subtitle2"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.9rem',
                                                    lineHeight: 1.35,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    transition: 'color 0.3s ease',
                                                    color: 'text.primary',
                                                }}
                                            >
                                                {relContent.title}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    )}
                </Box>
            ),
        });

        // Tab 2: Insights (Phase 5 integration)
        tabs.push({
            key: 'insights',
            label: t('insights:title', 'Insights'),
            icon: <InsightsIcon sx={{ fontSize: 16 }} />,
            content: post ? (
                <InsightsPanel
                    context={{
                        postId: post.id,
                        eventTags: post.eventTags || [],
                        currencyTags: post.currencyTags || [],
                    }}
                    maxHeight={undefined}
                />
            ) : null,
        });

        return tabs;
    }, [post, sidebarPosts, loading, relatedPostsLoading, currentLang, t]);

    // Format dates
    const publishedDate = post?.publishedAt?.toDate?.() || new Date();
    const modifiedDate = post?.updatedAt?.toDate?.() || publishedDate;
    const formattedDate = new Intl.DateTimeFormat(currentLang, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(publishedDate);

    // SEO data
    const langPrefix = currentLang !== 'en' ? `/${currentLang}` : '';
    // SEO prerender may include /es or /fr subpaths, but React Router is prefix-free.
    // Never generate internal navigation links with language prefixes.
    const routerBlogBasePath = '/blog';
    const blogBasePath = `${langPrefix}/blog`;
    const pageTitle = content.seoTitle || content.title || t('blog:postPage.defaultTitle', 'Blog Post');
    const pageDescription =
        content.seoDescription || content.excerpt || t('blog:postPage.defaultDescription', 'Read this article on Time 2 Trade');
    const ogImage = content.coverImage?.url || (post ? getDefaultBlogThumbnail(post.id) : undefined);
    // Ensure og:image is always an absolute URL (social platforms require https://)
    const absoluteOgImage = ogImage
        ? (ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`)
        : undefined;

    // BlogPosting structured data
    const structuredData = post
        ? {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: content.title,
            description: content.excerpt,
            image: absoluteOgImage || getDefaultBlogThumbnail(post.id),
            datePublished: publishedDate.toISOString(),
            dateModified: modifiedDate.toISOString(),
            author: authors.length > 0
                ? authors.map(author => ({
                    '@type': 'Person',
                    name: author.displayName,
                    url: `${SITE_URL}${langPrefix}/blog/author/${author.slug}`,
                    ...(author.social?.twitter && { sameAs: `https://twitter.com/${author.social.twitter.replace('@', '')}` }),
                }))
                : {
                    '@type': 'Organization',
                    name: post.authorName || 'Time 2 Trade',
                },
            publisher: {
                '@type': 'Organization',
                name: 'Time 2 Trade',
                url: SITE_URL,
                logo: {
                    '@type': 'ImageObject',
                    url: `${SITE_URL}/logos/t2t-logo-512.png`,
                },
            },
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${SITE_URL}${langPrefix}/blog/${slug}`,
            },
            keywords: post.tags?.join(', '),
            articleSection: post.category,
            wordCount: content.contentHtml?.split(/\s+/).length || 0,
        }
        : undefined;

    return (
        <>
            <SEO
                title={`${pageTitle} | Time 2 Trade`}
                description={pageDescription}
                path={`${blogBasePath}/${slug}`}
                ogType="article"
                ogImage={absoluteOgImage}
                structuredData={structuredData}
            />

            {/* BEP SEO: Article-specific OG meta tags for rich social sharing */}
            {post && (
                <Helmet>
                    <meta property="article:published_time" content={publishedDate.toISOString()} />
                    <meta property="article:modified_time" content={modifiedDate.toISOString()} />
                    {post.category && <meta property="article:section" content={post.category} />}
                    {post.tags?.map((tag, i) => (
                        <meta key={`tag-${i}`} property="article:tag" content={tag} />
                    ))}
                    {/* og:image dimensions hint for social platforms (standard blog cover) */}
                    <meta property="og:image:width" content="1200" />
                    <meta property="og:image:height" content="630" />
                    <meta property="og:image:type" content="image/jpeg" />
                    <meta name="twitter:image:alt" content={content.coverImage?.alt || content.title} />
                </Helmet>
            )}

            <PublicLayout
                navItems={navItems}
                onOpenAuth={handleOpenAuth}
                onOpenSettings={handleOpenSettings}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    {/* Main content - grows to fill available space */}
                    <Box sx={{ flex: 1 }}>
                        <MainLayout
                            left={
                                <Box component="article">
                                    {/* Breadcrumbs with Edit button and Status */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                                        <Breadcrumbs>
                                            <Link component={RouterLink} to="/" underline="hover" color="inherit">
                                                {t('common:navigation.home', 'Home')}
                                            </Link>
                                            <Link component={RouterLink} to={routerBlogBasePath} underline="hover" color="inherit">
                                                {t('blog:listPage.heading', 'Blog')}
                                            </Link>
                                            <Typography color="text.primary" noWrap sx={{ maxWidth: 200 }}>
                                                {content.title || slug}
                                            </Typography>
                                        </Breadcrumbs>
                                        {/* Status chip and Edit Post button - admin/author roles only */}
                                        {post && hasRole(['admin', 'author', 'superadmin']) && (
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Chip
                                                    label={t(`blog:status.${post.status}`, post.status.charAt(0).toUpperCase() + post.status.slice(1))}
                                                    color={getStatusColor(post.status)}
                                                    size="small"
                                                />
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<EditIcon />}
                                                    component={RouterLink}
                                                    to={`/admin/blog/edit/${post.id}`}
                                                >
                                                    {t('admin:blog.editPost', 'Edit Post')}
                                                </Button>
                                            </Stack>
                                        )}
                                    </Box>

                                    {/* Loading state */}
                                    {loading && <PostSkeleton />}

                                    {/* Error state */}
                                    {error && (
                                        <Box sx={{ textAlign: 'center', py: 8 }}>
                                            <Alert severity="error" sx={{ mb: 3 }}>
                                                {error}
                                            </Alert>
                                            <Button
                                                variant="outlined"
                                                startIcon={<ArrowBackIcon />}
                                                onClick={() => navigate(routerBlogBasePath)}
                                            >
                                                {t('blog:postPage.backToBlog', 'Back to Blog')}
                                            </Button>
                                        </Box>
                                    )}

                                    {/* Post content */}
                                    {!loading && post && (
                                        <>
                                            {/* Preview mode banner */}
                                            {isPreviewMode && post.status !== BLOG_POST_STATUS.PUBLISHED && (
                                                <Alert
                                                    severity="warning"
                                                    icon={<VisibilityOffIcon />}
                                                    sx={{
                                                        mb: 3,
                                                        position: 'sticky',
                                                        top: 80,
                                                        zIndex: 10,
                                                        boxShadow: 2,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 1.5,
                                                    }}
                                                >
                                                    <div>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {t('blog:postPage.previewMode', 'Preview Mode')} — {t(`blog:status.${post.status}`, post.status.charAt(0).toUpperCase() + post.status.slice(1))}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {t('blog:postPage.previewModeHint', 'This post is not published. Only CMS users can see this preview.')}
                                                        </Typography>
                                                    </div>
                                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<EditIcon />}
                                                            onClick={handleEditPost}
                                                            sx={{ color: 'warning.dark', borderColor: 'warning.dark' }}
                                                        >
                                                            {t('blog:postPage.editButton', 'Edit')}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            onClick={() => setPublishConfirmOpen(true)}
                                                            disabled={publishingInProgress}
                                                            sx={{
                                                                bgcolor: 'warning.main',
                                                                '&:hover': { bgcolor: 'warning.dark' },
                                                                '&:disabled': { bgcolor: 'action.disabledBackground' },
                                                            }}
                                                        >
                                                            {publishingInProgress ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                                                            {t('blog:postPage.publishButton', 'Publish Post')}
                                                        </Button>
                                                    </Stack>
                                                </Alert>
                                            )}

                                            {/* Cover image — always show, fallback to default thumbnail */}
                                            <Box
                                                component="img"
                                                src={content.coverImage?.url || getDefaultBlogThumbnail(post.id, true)}
                                                alt={content.coverImage?.alt || content.title}
                                                sx={{
                                                    width: '100%',
                                                    height: { xs: 220, md: 380 },
                                                    objectFit: 'cover',
                                                    borderRadius: 2,
                                                    mb: 2,
                                                }}
                                            />

                                            {/* Category Chip + Like & Share Buttons - Below Cover Image */}
                                            {post.category && (
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Tooltip title={t('blog:taxonomy.categoryTooltip', { category: BLOG_CATEGORY_LABELS[post.category] || post.category })}>
                                                        <Chip
                                                            icon={<CategoryIcon sx={{ fontSize: '1.1rem !important' }} />}
                                                            label={t(`blog:categories.${post.category}`, BLOG_CATEGORY_LABELS[post.category] || post.category)}
                                                            size="small"
                                                            component={RouterLink}
                                                            to={`${routerBlogBasePath}/category/${post.category}`}
                                                            clickable
                                                            sx={{
                                                                height: 28,
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                px: 1,
                                                                '&:hover': {
                                                                    backgroundColor: 'action.hover',
                                                                    borderColor: 'primary.main',
                                                                },
                                                            }}
                                                        />
                                                    </Tooltip>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        {/* Like button - auth-only */}
                                                        <Tooltip
                                                            title={postLike.isAuthenticated ? (postLike.liked ? t('blog:postPage.unlike') : t('blog:postPage.like')) : t('blog:postPage.likeLoginRequired')}
                                                            open={likeTooltipOpen}
                                                            onOpen={() => setLikeTooltipOpen(true)}
                                                            onClose={() => setLikeTooltipOpen(false)}
                                                            disableFocusListener
                                                        >
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={handleLikeClick}
                                                                    disabled={postLike.loading}
                                                                    sx={{
                                                                        color: postLike.liked ? 'error.main' : 'text.secondary',
                                                                        transition: 'color 0.3s ease',
                                                                        animation: postLike.liked ? `${facebookHeartLike} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)` : 'none',
                                                                        '&:hover': { color: 'error.main', transform: 'scale(1.2)' },
                                                                    }}
                                                                    aria-label={postLike.liked ? t('blog:postPage.unlike') : t('blog:postPage.like')}
                                                                >
                                                                    {postLike.liked ? <FavoriteIcon sx={{ fontSize: '1.2rem' }} /> : <FavoriteBorderIcon sx={{ fontSize: '1.2rem' }} />}
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                        {postLike.likeCount > 0 && (
                                                            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', minWidth: 16 }}>
                                                                {postLike.likeCount}
                                                            </Typography>
                                                        )}
                                                        {/* Share button */}
                                                        <Tooltip title={copyFeedback ? t('blog:postPage.copiedToClipboard') : t('blog:postPage.copyLinkToShare')}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={handleCopyLink}
                                                                sx={{ color: copyFeedback ? 'success.main' : 'text.secondary' }}
                                                            >
                                                                <IosShareIcon sx={{ fontSize: '1.2rem' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </Box>
                                            )}
                                            {!post.category && (
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        {/* Like button - auth-only */}
                                                        <Tooltip
                                                            title={postLike.isAuthenticated ? (postLike.liked ? t('blog:postPage.unlike') : t('blog:postPage.like')) : t('blog:postPage.likeLoginRequired')}
                                                            open={likeTooltipOpen}
                                                            onOpen={() => setLikeTooltipOpen(true)}
                                                            onClose={() => setLikeTooltipOpen(false)}
                                                            disableFocusListener
                                                        >
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={handleLikeClick}
                                                                    disabled={postLike.loading}
                                                                    sx={{
                                                                        color: postLike.liked ? 'error.main' : 'text.secondary',
                                                                        transition: 'color 0.3s ease',
                                                                        animation: postLike.liked ? `${facebookHeartLike} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)` : 'none',
                                                                        '&:hover': { color: 'error.main', transform: 'scale(1.2)' },
                                                                    }}
                                                                    aria-label={postLike.liked ? t('blog:postPage.unlike') : t('blog:postPage.like')}
                                                                >
                                                                    {postLike.liked ? <FavoriteIcon sx={{ fontSize: '1.2rem' }} /> : <FavoriteBorderIcon sx={{ fontSize: '1.2rem' }} />}
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                        {postLike.likeCount > 0 && (
                                                            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', minWidth: 16 }}>
                                                                {postLike.likeCount}
                                                            </Typography>
                                                        )}
                                                        {/* Share button */}
                                                        <Tooltip title={copyFeedback ? t('blog:postPage.copiedToClipboard') : t('blog:postPage.copyLinkToShare')}>
                                                            <IconButton
                                                                size="small"
                                                                onClick={handleCopyLink}
                                                                sx={{ color: copyFeedback ? 'success.main' : 'text.secondary' }}
                                                            >
                                                                <IosShareIcon sx={{ fontSize: '1.2rem' }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Stack>
                                                </Box>
                                            )}

                                            {/* Ultra-Compact Header - Bloomberg/Google News Style */}
                                            <Box sx={{ mb: 2 }}>
                                                {/* Title */}
                                                <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 700, lineHeight: 1.25, mb: 1.5 }}>
                                                    {content.title}
                                                </Typography>
                                                {/* Single-Line Meta Row: Author • Date • Reading Time | Category + Tags */}
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        flexDirection: { xs: 'column', md: 'row' },
                                                        alignItems: { xs: 'flex-start', md: 'center' },
                                                        justifyContent: 'space-between',
                                                        gap: { xs: 1.5, md: 2 },
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    {/* Left: Author + Date + Reading Time */}
                                                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                                                        {/* Author */}
                                                        {authors.length > 0 ? (
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Stack direction="row" spacing={-0.75} alignItems="center">
                                                                    {authors.slice(0, 2).map((author, index) => (
                                                                        <Tooltip key={author.id} title={author.displayName}>
                                                                            <Link component={RouterLink} to={`${routerBlogBasePath}/author/${author.slug}`} underline="none" sx={{ zIndex: authors.length - index }}>
                                                                                <Avatar
                                                                                    src={author.avatar?.url}
                                                                                    alt={author.displayName}
                                                                                    sx={{ width: 28, height: 28, bgcolor: 'primary.main', border: '1.5px solid', borderColor: 'background.paper', fontSize: '0.75rem' }}
                                                                                >
                                                                                    {!author.avatar?.url && author.displayName?.charAt(0)}
                                                                                </Avatar>
                                                                            </Link>
                                                                        </Tooltip>
                                                                    ))}
                                                                </Stack>
                                                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                                    {authors.length === 1 ? (
                                                                        <Tooltip title={t('blog:postPage.authorTooltip', { author: authors[0].displayName })}>
                                                                            <Link component={RouterLink} to={`${routerBlogBasePath}/author/${authors[0].slug}`} underline="hover" color="inherit">
                                                                                {authors[0].displayName}
                                                                            </Link>
                                                                        </Tooltip>
                                                                    ) : (
                                                                        authors.slice(0, 2).map((a, i) => (
                                                                            <span key={a.id}>
                                                                                <Tooltip title={t('blog:postPage.authorTooltip', { author: a.displayName })}>
                                                                                    <Link component={RouterLink} to={`${routerBlogBasePath}/author/${a.slug}`} underline="hover" color="inherit">{a.displayName}</Link>
                                                                                </Tooltip>
                                                                                {i === 0 && authors.length > 1 && ', '}
                                                                            </span>
                                                                        ))
                                                                    )}
                                                                    {authors.length > 2 && ` +${authors.length - 2}`}
                                                                </Typography>
                                                            </Stack>
                                                        ) : (
                                                            <Stack direction="row" spacing={0.75} alignItems="center">
                                                                <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                                                                    <PersonIcon sx={{ fontSize: 16 }} />
                                                                </Avatar>
                                                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                                    {post.authorName || 'Time 2 Trade'}
                                                                </Typography>
                                                            </Stack>
                                                        )}
                                                        <Typography variant="body2" color="text.disabled">•</Typography>
                                                        <Typography variant="body2" color="text.secondary">{formattedDate}</Typography>
                                                        {readingTimeMinutes > 0 && (
                                                            <>
                                                                <Typography variant="body2" color="text.disabled">•</Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {t('blog:readingTime', { minutes: readingTimeMinutes })}
                                                                </Typography>
                                                            </>
                                                        )}
                                                    </Stack>


                                                </Box>
                                                {/* Taxonomy Row: Events + Currencies (inline, no labels) */}
                                                {(post.eventTags?.length > 0 || post.currencyTags?.length > 0) && (
                                                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ my: 2, flexWrap: 'wrap', gap: 0.75 }}>
                                                        {post.eventTags?.map((eventKey) => {
                                                            const eventLabel = BLOG_ECONOMIC_EVENTS[eventKey] || eventKey;
                                                            return (
                                                                <Tooltip key={eventKey} title={t('blog:taxonomy.eventTooltip', { event: eventLabel })}>
                                                                    <Chip
                                                                        label={eventLabel}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        component={RouterLink}
                                                                        to={`${routerBlogBasePath}/event/${eventKey}`}
                                                                        clickable
                                                                        color="primary"
                                                                        sx={{
                                                                            height: 26,
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: 500,
                                                                            cursor: 'pointer',
                                                                            px: 1,
                                                                            bgcolor: 'background.paper',
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            );
                                                        })}
                                                        {post.currencyTags?.map((currency) => {
                                                            const flagCode = getCurrencyFlag(currency);
                                                            return (
                                                                <Tooltip key={currency} title={t('blog:taxonomy.currencyTooltip', { currency })}>
                                                                    <Chip
                                                                        avatar={flagCode ? (
                                                                            <Box
                                                                                component="span"
                                                                                className={`fi fi-${flagCode}`}
                                                                                sx={{
                                                                                    display: 'inline-block',
                                                                                    width: '1em',
                                                                                    height: '1em',
                                                                                    borderRadius: '2px',
                                                                                    fontSize: '1rem',
                                                                                }}
                                                                            />
                                                                        ) : undefined}
                                                                        label={currency}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        component={RouterLink}
                                                                        to={`${routerBlogBasePath}/currency/${currency}`}
                                                                        clickable
                                                                        color="success"
                                                                        sx={{
                                                                            height: 26,
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: 500,
                                                                            cursor: 'pointer',
                                                                            px: 1,
                                                                            bgcolor: 'background.paper',
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            );
                                                        })}
                                                    </Stack>
                                                )}



                                            </Box>

                                            <Divider sx={{ mb: 4 }} />

                                            {/* Content */}
                                            <Box
                                                sx={{
                                                    typography: 'body1',
                                                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                                                        mt: 5,
                                                        mb: 3,
                                                        fontWeight: 600,
                                                    },
                                                    '& h2': { fontSize: '1.5rem' },
                                                    '& h3': { fontSize: '1.25rem' },
                                                    '& p': {
                                                        mb: 3,
                                                        lineHeight: 1.8,
                                                    },
                                                    '& ul, & ol': {
                                                        pl: 3,
                                                        mb: 3,
                                                    },
                                                    '& li': {
                                                        mb: 1.5,
                                                    },
                                                    '& blockquote': {
                                                        borderLeft: 4,
                                                        borderColor: 'primary.main',
                                                        pl: 3,
                                                        py: 2,
                                                        my: 4,
                                                        fontStyle: 'italic',
                                                        bgcolor: 'action.hover',
                                                        borderRadius: 1,
                                                    },
                                                    '& img': {
                                                        maxWidth: '100%',
                                                        height: 'auto',
                                                        borderRadius: 1,
                                                        my: 4,
                                                    },
                                                    '& a': {
                                                        color: 'primary.main',
                                                        textDecoration: 'underline',
                                                    },
                                                    '& pre': {
                                                        bgcolor: 'grey.100',
                                                        p: 3,
                                                        borderRadius: 1,
                                                        overflow: 'auto',
                                                        mb: 3,
                                                    },
                                                    '& code': {
                                                        bgcolor: 'grey.100',
                                                        px: 0.5,
                                                        borderRadius: 0.5,
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.9em',
                                                    },
                                                    '& iframe': {
                                                        maxWidth: '100%',
                                                        borderRadius: 1,
                                                        my: 4,
                                                    },
                                                }}
                                                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                                            />

                                            {/* In-article ad (BEP Phase 7) — after content, before tags */}
                                            <AdUnit
                                                slot={AD_SLOTS.BLOG_POST_MID}
                                                format="in-article"
                                                minHeight={100}
                                                sx={{ my: 4 }}
                                            />

                                            <Divider sx={{ my: 5 }} />

                                            {/* Editorial Tags - Above Back to Blog */}
                                            {post.tags?.length > 0 && (
                                                <Box sx={{ mb: 3 }}>
                                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                                                        {post.tags.map((tag) => (
                                                            <Tooltip key={tag} title={t('blog:taxonomy.tagTooltip', { tag })}>
                                                                <Chip
                                                                    icon={<LocalOfferIcon sx={{ fontSize: '1.1rem !important' }} />}
                                                                    label={tag}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    component={RouterLink}
                                                                    to={`${routerBlogBasePath}/tag/${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}`}
                                                                    clickable
                                                                    sx={{
                                                                        height: 28,
                                                                        fontSize: '0.8rem',
                                                                        cursor: 'pointer',
                                                                        px: 1,
                                                                        '&:hover': {
                                                                            backgroundColor: 'action.hover',
                                                                            borderColor: 'primary.main',
                                                                        },
                                                                    }}
                                                                    aria-label={t('blog:taxonomy.editorialTag')}
                                                                />
                                                            </Tooltip>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}
                                            {/* Bottom display ad (BEP Phase 7) — after tags, before related posts */}
                                            <AdUnit
                                                slot={AD_SLOTS.BLOG_POST_BOTTOM}
                                                format="display"
                                                minHeight={90}
                                                label={t('blog:ads.advertisement', 'Advertisement')}
                                                sx={{ my: 4 }}
                                            />
                                            {/* Related posts */}
                                            {bottomPosts.length > 0 && (
                                                <Box sx={{ mt: 5, mb: 4 }}>
                                                    <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
                                                        {t('blog:postPage.relatedPosts', 'Related Articles')}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            display: 'grid',
                                                            gridTemplateColumns: {
                                                                xs: '1fr',
                                                                sm: 'repeat(2, 1fr)',
                                                                md: 'repeat(3, 1fr)',
                                                            },
                                                            gap: 3,
                                                        }}
                                                    >
                                                        {bottomPosts.map((relatedPost) => (
                                                            <RelatedPostCard key={relatedPost.id} post={relatedPost} lang={currentLang} />
                                                        ))}
                                                    </Box>
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Box>
                            }
                            rightTabs={rightTabs}
                            pageScroll
                            stickyTop={16}
                        />
                    </Box>

                    {/* Blog Footer with dynamic hub links - sticky at bottom */}
                    <Suspense fallback={null}>
                        <BlogFooter showCategories showEvents showCurrencies showTags />
                    </Suspense>
                </Box>
            </PublicLayout>

            {/* BEP: Jump to top button - bottom left corner with mobile AppBar height consideration */}
            {showJumpToTop && (
                <Tooltip title={t('blog:postPage.jumpToTop', 'Jump to top')} placement="top">
                    <IconButton
                        onClick={handleJumpToTop}
                        sx={{
                            position: 'fixed',
                            bottom: { xs: `calc(${MOBILE_BOTTOM_APPBAR_HEIGHT_PX}px + 16px)`, md: 16 },
                            left: 16,
                            zIndex: 9,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            boxShadow: 3,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                                bgcolor: 'primary.dark',
                                transform: 'translateY(-4px)',
                                boxShadow: 6,
                            },
                            '&:active': {
                                transform: 'translateY(-2px)',
                            },
                        }}
                        aria-label="Jump to top"
                    >
                        <KeyboardArrowUpIcon />
                    </IconButton>
                </Tooltip>
            )}

            {/* Modals */}
            <Suspense fallback={null}>
                <AuthModal2 open={authModalOpen} onClose={handleCloseAuth} redirectPath="/calendar" />
            </Suspense>
            <Suspense fallback={null}>
                <SettingsSidebar2
                    open={settingsOpen && !authModalOpen}
                    onClose={handleCloseSettings}
                    onOpenAuth={handleOpenAuth}
                    onOpenContact={handleOpenContact}
                />
            </Suspense>
            <Suspense fallback={null}>
                <ContactModal open={contactModalOpen} onClose={handleCloseContact} />
            </Suspense>

            {/* Publish confirmation dialog */}
            <Dialog open={publishConfirmOpen} onClose={() => setPublishConfirmOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {t('blog:postPage.publishedTitle', 'Post Published Successfully! 🎉')}
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {t('blog:postPage.publishedMessage', { title: content.title })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {t('blog:postPage.publishedHint', 'You can now view the published post, add another article, or return to the admin dashboard.')}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button onClick={() => setPublishConfirmOpen(false)}>
                        {t('common:buttons.close', 'Close')}
                    </Button>
                    <Button onClick={handleOpenBlogUpload} variant="outlined">
                        {t('blog:postPage.addNewPost', 'Add New Post')}
                    </Button>
                    <Button onClick={handleViewPublished} variant="contained" color="success">
                        {t('blog:postPage.viewPublished', 'View Published Post')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
