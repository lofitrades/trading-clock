/**
 * src/pages/BlogListPage.jsx
 *
 * Purpose: Public blog listing page with SEO-first design.
 * Displays published posts with infinite scroll (magic pagination), full-text search, and taxonomy filters.
 * Supports multi-language URLs via subpath routing.
 *
 * Changelog:
 * v2.4.0 - 2026-02-08 - BEP CRITICAL FIX: Fixed infinite skeleton loop on xs/sm breakpoints. (1) Root cause: rootMargin:'200px' on IntersectionObserver triggered sentinel detection 200px before viewport on small mobile screens, causing race condition with hasMore checks. (2) Solution: Changed rootMargin to '0px' — sentinel only triggers when truly visible, preventing re-triggers after hasMore=false. (3) Added protective guard: skeleton cards now show ONLY if `loadingMore && hasMore`, not just loadingMore. (4) Result: Skeleton cards appear naturally while loading, stop immediately when end reached, no infinite loop on mobile.
 * v2.3.0 - 2026-02-07 - BEP CRITICAL FIX: Removed language prefix from blog post card URLs. Localized slugs already carry language identity; adding /es/ or /fr/ prefix caused incorrect redirects (e.g., /es/blog/{en-slug}). SPA route is /blog/:slug with no prefix. BlogPostPage resolves slugs across all languages.
 * v2.2.0 - 2026-02-06 - BEP UX FIX: Fixed duplicate posts on scroll (deduplicate via Set before adding), changed posts.map to flatMap for proper array flattening, show skeleton cards during loadingMore (not just text) for better perceived performance
 * v2.1.0 - 2026-02-06 - BEP Phase 7: Integrated AdUnit (display ad after every 6th post card, consent-gated, lazy-loaded)
 * v2.0.0 - 2026-02-06 - BEP Phase 6: Integrated searchBlogPosts service with relevance scoring, debounced search, and token-based full-text search (title/excerpt/tags/category/keywords/events/currencies)
 * v1.7.0 - 2026-02-06 - BEP: Fixed observer never connecting to sentinel. Used callback ref pattern so IntersectionObserver reconnects every time sentinel mounts. Fixed Firestore startAfter/limit constraint ordering.
 * v1.6.0 - 2026-02-06 - BEP: Implemented true Firestore cursor-based pagination with startAfterDoc cursor.
 * v1.5.0 - 2026-02-06 - BEP: Added progressive image lazy loading with skeleton loaders. Native browser lazy loading (loading="lazy", decoding="async") for optimal performance. Images render with fade transition as they load.
 * v1.4.0 - 2026-02-06 - BEP: Added infinite scroll pagination with Intersection Observer for performance. Removed traditional pagination UI.
 * v1.3.0 - 2026-02-05 - BEP: Preserve language prefix on blog card navigation to keep users in their locale.
 * v1.2.0 - 2026-02-05 - BEP: Updated getDefaultBlogThumbnail call to use relative URL for img src (absolute URLs only needed for OG meta)
 * v1.1.0 - 2026-02-05 - BEP: Added fallback to consistent default thumbnails for posts without cover images (uses post ID for deterministic selection)
 * v1.0.0 - 2026-02-04 - Initial implementation (Phase 3 Blog)
 */

import { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    CardMedia,
    CardActionArea,
    Chip,
    Stack,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Skeleton,
    Alert,
    Autocomplete,
    Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InsightsIcon from '@mui/icons-material/Insights';

import SEO from '../components/SEO';
import PublicLayout from '../components/PublicLayout';
import useAppBarNavItems from '../hooks/useAppBarNavItems';
import { preloadNamespaces } from '../i18n/config';
import { searchBlogPosts, getBlogSearchFilters } from '../services/blogSearchService';
import { BLOG_CATEGORY_LABELS, BLOG_ECONOMIC_EVENTS, DEFAULT_BLOG_LANGUAGE } from '../types/blogTypes';
import { SITE_URL } from '../utils/seoMeta';
import { getCurrencyFlag } from '../utils/currencyFlags';
import { getDefaultBlogThumbnail } from '../utils/blogThumbnailFallback';
import AdUnit from '../components/AdUnit';
import { AD_SLOTS } from '../constants/adSlots';

const AuthModal2 = lazy(() => import('../components/AuthModal2'));
const SettingsSidebar2 = lazy(() => import('../components/SettingsSidebar2'));
const ContactModal = lazy(() => import('../components/ContactModal'));
const BlogFooter = lazy(() => import('../components/BlogFooter'));

const POSTS_PER_PAGE = 12;

/**
 * Post card component for the blog listing
 */
const PostCard = ({ post, lang }) => {
    const { t } = useTranslation('blog');
    const [imageLoaded, setImageLoaded] = useState(false);
    const content = post.languages?.[lang] || post.languages?.[DEFAULT_BLOG_LANGUAGE] || {};
    const slug = content.slug;
    const postUrl = `/blog/${slug}`;

    // Format date
    const publishedDate = post.publishedAt?.toDate?.() || new Date();
    const formattedDate = new Intl.DateTimeFormat(lang, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(publishedDate);

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                    borderColor: 'primary.light',
                },
            }}
        >
            <CardActionArea component={RouterLink} to={postUrl} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                {content.coverImage?.url && (
                    <Box
                        sx={{
                            position: 'relative',
                            height: 180,
                            backgroundColor: 'action.hover',
                            overflow: 'hidden',
                        }}
                    >
                        {!imageLoaded && (
                            <Skeleton
                                variant="rectangular"
                                width="100%"
                                height="100%"
                                sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
                            />
                        )}
                        <CardMedia
                            component="img"
                            height="180"
                            image={content.coverImage?.url || getDefaultBlogThumbnail(post.id, true)}
                            alt={content.coverImage?.alt || content.title}
                            onLoad={() => setImageLoaded(true)}
                            sx={{
                                objectFit: 'cover',
                                backgroundColor: 'action.hover',
                                opacity: imageLoaded ? 1 : 0,
                                transition: 'opacity 0.3s ease-in',
                            }}
                            loading="lazy"
                            decoding="async"
                        />
                    </Box>
                )}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Category chip */}
                    {post.category && (
                        <Box sx={{ mb: 1 }}>
                            <Chip
                                label={t(`categories.${post.category}`, BLOG_CATEGORY_LABELS[post.category] || post.category)}
                                size="small"
                                variant="filled"
                                color="default"
                                sx={{
                                    height: 26,
                                    fontSize: '0.7rem',
                                    fontWeight: 500,
                                    px: 1,
                                    bgcolor: 'action.hover',
                                    color: 'text.primary',
                                }}
                            />
                        </Box>
                    )}

                    {/* Title */}
                    <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                            fontWeight: 700,
                            lineHeight: 1.3,
                            mb: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {content.title}
                    </Typography>

                    {/* Excerpt */}
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 1.5,
                            lineHeight: 1.5,
                        }}
                    >
                        {content.excerpt}
                    </Typography>

                    {/* Event and Currency tags */}
                    {(post.eventTags?.length > 0 || post.currencyTags?.length > 0) && (
                        <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {post.eventTags?.slice(0, 2).map((eventKey) => {
                                const eventLabel = BLOG_ECONOMIC_EVENTS[eventKey] || eventKey;
                                return (
                                    <Chip
                                        key={eventKey}
                                        label={eventLabel}
                                        size="small"
                                        variant="filled"
                                        color="primary"
                                        sx={{
                                            height: 26,
                                            fontSize: '0.7rem',
                                            fontWeight: 500,
                                            px: 1,
                                            cursor: 'pointer',
                                        }}
                                    />
                                );
                            })}
                            {post.currencyTags?.slice(0, 2).map((currency) => {
                                const flagCode = getCurrencyFlag(currency);
                                return (
                                    <Chip
                                        key={currency}
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
                                        color="success"
                                        sx={{
                                            height: 26,
                                            fontSize: '0.7rem',
                                            fontWeight: 500,
                                            px: 1,
                                            cursor: 'pointer',
                                            bgcolor: 'background.paper',
                                        }}
                                    />
                                );
                            })}
                        </Box>
                    )}

                    {/* Meta info */}
                    <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{
                            mt: 'auto',
                            pt: 1.5,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                {formattedDate}
                            </Typography>
                        </Box>
                        {post.readingTimeMinutes && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                    {t('readingTime', { minutes: post.readingTimeMinutes })}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

PostCard.propTypes = {
    post: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
};

/**
 * Loading skeleton for post cards
 */
const PostCardSkeleton = () => (
    <Card sx={{ height: '100%' }}>
        <Skeleton variant="rectangular" height={180} />
        <CardContent>
            <Skeleton variant="text" width={60} height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={28} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="60%" />
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Skeleton variant="text" width={80} />
                <Skeleton variant="text" width={60} />
            </Stack>
        </CardContent>
    </Card>
);

export default function BlogListPage() {
    const { t, i18n } = useTranslation(['blog', 'common']);
    const currentLang = i18n.language || 'en';
    const observerRef = useRef(null);

    // State
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const lastDocRef = useRef(null);
    const loadingMoreRef = useRef(false);
    const hasMoreRef = useRef(true);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const debounceTimerRef = useRef(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedEvent, setSelectedEvent] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedAuthorIds, setSelectedAuthorIds] = useState([]);

    // Filter options (loaded from Firestore)
    const [availableFilters, setAvailableFilters] = useState({
        categories: [],
        tags: [],
        events: [],
        currencies: [],
        authors: [],
    });

    // Modal states
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);

    // Preload namespaces
    useEffect(() => {
        preloadNamespaces(['blog', 'common', 'auth', 'settings']);
    }, []);

    // Debounce search query (300ms for performance)
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchQuery]);

    // Load available filters (categories, tags, events, currencies, authors)
    useEffect(() => {
        const loadFilters = async () => {
            try {
                const filters = await getBlogSearchFilters(currentLang);
                setAvailableFilters(filters);
            } catch (err) {
                console.warn('Failed to load search filters:', err);
            }
        };
        loadFilters();
    }, [currentLang]);

    // Fetch initial page of posts (resets on filter/language change)
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            setPosts([]);
            lastDocRef.current = null;
            setHasMore(true);
            try {
                const result = await searchBlogPosts({
                    query: debouncedQuery,
                    lang: currentLang,
                    category: selectedCategory || undefined,
                    events: selectedEvent ? [selectedEvent] : [],
                    currencies: selectedCurrency ? [selectedCurrency] : [],
                    tags: selectedTags.length > 0 ? selectedTags : [],
                    authorIds: selectedAuthorIds.length > 0 ? selectedAuthorIds : [],
                    limit: POSTS_PER_PAGE,
                    cursor: null,
                });
                setPosts(result.posts);
                lastDocRef.current = result.lastCursor;
                setHasMore(result.hasMore);
            } catch (err) {
                console.error('Failed to fetch posts:', err);
                setError(err.message || 'Failed to load posts');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [currentLang, selectedCategory, selectedEvent, selectedCurrency, selectedTags, selectedAuthorIds, debouncedQuery]);

    // Keep refs in sync to avoid stale closures in observer callback
    useEffect(() => { loadingMoreRef.current = loadingMore; }, [loadingMore]);
    useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

    // Load next page from Firestore (cursor-based with search service)
    const loadMorePosts = useCallback(async () => {
        if (loadingMoreRef.current || !hasMoreRef.current) return;
        setLoadingMore(true);
        loadingMoreRef.current = true;
        try {
            const result = await searchBlogPosts({
                query: debouncedQuery,
                lang: currentLang,
                category: selectedCategory || undefined,
                events: selectedEvent ? [selectedEvent] : [],
                currencies: selectedCurrency ? [selectedCurrency] : [],
                tags: selectedTags.length > 0 ? selectedTags : [],
                authorIds: selectedAuthorIds.length > 0 ? selectedAuthorIds : [],
                limit: POSTS_PER_PAGE,
                cursor: lastDocRef.current,
            });

            // Deduplicate posts using Set to prevent duplicates from cursor pagination
            const existingIds = new Set(posts.map(p => p.id));
            const newPosts = result.posts.filter(p => !existingIds.has(p.id));

            if (newPosts.length > 0) {
                setPosts((prev) => [...prev, ...newPosts]);
            }

            lastDocRef.current = result.lastCursor;
            setHasMore(result.hasMore);
            hasMoreRef.current = result.hasMore;
        } catch (err) {
            console.error('Failed to load more posts:', err);
        } finally {
            setLoadingMore(false);
            loadingMoreRef.current = false;
        }
    }, [currentLang, selectedCategory, selectedEvent, selectedCurrency, selectedTags, selectedAuthorIds, debouncedQuery, posts]);

    // Callback ref for infinite scroll sentinel (BEP: reconnects observer on mount/unmount)
    // CRITICAL: Reduced rootMargin to 0px to prevent mobile sentinel from re-triggering after hasMore=false
    // On xs/sm: smaller viewport + 200px margin caused infinite loop of skeleton cards
    // Fix: Use 0px margin, let scroll naturally reach sentinel, prevents race condition on mobile
    const sentinelRef = useCallback(
        (node) => {
            // Disconnect previous observer
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }

            if (!node) return;

            // Create new observer and connect to the sentinel node
            const observer = new IntersectionObserver(
                (entries) => {
                    // Guard: Only load if sentinel is visible AND has more AND not already loading
                    if (entries[0].isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
                        loadMorePosts();
                    }
                },
                { threshold: 0.1, rootMargin: '0px' } // Changed from 200px to 0px to fix mobile loop
            );

            observer.observe(node);
            observerRef.current = observer;
        },
        [loadMorePosts]
    );

    // Cleanup observer on unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // Modal handlers
    const handleOpenAuth = useCallback(() => {
        setSettingsOpen(false);
        setAuthModalOpen(true);
    }, []);

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

    // SEO data
    const langPrefix = currentLang !== 'en' ? `/${currentLang}` : '';
    const pageTitle = t('blog:listPage.title', 'Blog | Time 2 Trade');
    const pageDescription = t(
        'blog:listPage.description',
        'Trading insights, market analysis, and tips for futures and forex traders. Stay informed with Time 2 Trade.'
    );

    // BlogPosting list schema
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Time 2 Trade Blog',
        description: pageDescription,
        url: `${SITE_URL}${langPrefix}/blog`,
        publisher: {
            '@type': 'Organization',
            name: 'Time 2 Trade',
            url: SITE_URL,
        },
    };

    return (
        <>
            <SEO
                title={pageTitle}
                description={pageDescription}
                path={`${langPrefix}/blog`}
                ogType="website"
                structuredData={structuredData}
            />

            <PublicLayout
                navItems={navItems}
                onOpenAuth={handleOpenAuth}
                onOpenSettings={handleOpenSettings}
            >
                <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
                    {/* Page Header */}
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="center"
                            spacing={1.5}
                            sx={{ mb: 1 }}
                        >
                            <InsightsIcon sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, color: 'primary.main' }} />
                            <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 700 }}>
                                {t('blog:listPage.heading', 'Insights')}
                            </Typography>
                        </Stack>
                        <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                            {t('blog:listPage.subtitle', 'Real-time market intelligence for futures and forex traders')}
                        </Typography>
                    </Box>

                    {/* Filters */}
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        sx={{ mb: 4 }}
                        justifyContent="center"
                    >
                        {/* Search */}
                        <TextField
                            placeholder={t('blog:listPage.searchPlaceholder', 'Search insights...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            size="small"
                            sx={{
                                minWidth: 250,
                                backgroundColor: 'background.paper',
                                borderRadius: 1,
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {/* Category filter */}
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>{t('blog:listPage.categoryLabel', 'Category')}</InputLabel>
                            <Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                label={t('blog:listPage.categoryLabel', 'Category')}
                                sx={{
                                    backgroundColor: 'background.paper',
                                    borderRadius: 1,
                                }}
                            >
                                <MenuItem value="">{t('blog:listPage.allCategories', 'All Categories')}</MenuItem>
                                {availableFilters.categories.map((cat) => (
                                    <MenuItem key={cat} value={cat}>
                                        {t(`blog:categories.${cat}`, BLOG_CATEGORY_LABELS[cat] || cat)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Event filter */}
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>{t('blog:listPage.eventLabel', 'Economic Event')}</InputLabel>
                            <Select
                                value={selectedEvent}
                                onChange={(e) => setSelectedEvent(e.target.value)}
                                label={t('blog:listPage.eventLabel', 'Economic Event')}
                                sx={{
                                    backgroundColor: 'background.paper',
                                    borderRadius: 1,
                                }}
                            >
                                <MenuItem value="">{t('blog:listPage.allEvents', 'All Events')}</MenuItem>
                                {availableFilters.events.map((event) => (
                                    <MenuItem key={event} value={event}>
                                        {t(`blog:events.${event.toLowerCase()}`, event)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Currency filter */}
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>{t('blog:listPage.currencyLabel', 'Currency')}</InputLabel>
                            <Select
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value)}
                                label={t('blog:listPage.currencyLabel', 'Currency')}
                                sx={{
                                    backgroundColor: 'background.paper',
                                    borderRadius: 1,
                                }}
                            >
                                <MenuItem value="">{t('blog:listPage.allCurrencies', 'All Currencies')}</MenuItem>
                                {availableFilters.currencies.map((currency) => {
                                    const flagCode = getCurrencyFlag(currency);
                                    return (
                                        <MenuItem key={currency} value={currency} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {flagCode && (
                                                <Box
                                                    component="span"
                                                    className={`fi fi-${flagCode}`}
                                                    sx={{
                                                        display: 'inline-block',
                                                        width: '1.2em',
                                                        height: '1.2em',
                                                        borderRadius: '2px',
                                                        fontSize: '1rem',
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            )}
                                            {currency}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>

                        {/* Tags multi-select filter */}
                        <Autocomplete
                            multiple
                            size="small"
                            options={availableFilters.tags}
                            value={selectedTags}
                            onChange={(e, newValue) => setSelectedTags(newValue)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('blog:listPage.tagsLabel', 'Tags')}
                                    placeholder={t('blog:listPage.tagsPlaceholder', 'Select tags...')}
                                    sx={{ minWidth: 200 }}
                                />
                            )}
                            sx={{ backgroundColor: 'background.paper', borderRadius: 1 }}
                        />

                        {/* Authors multi-select filter - HIDDEN (only 1 author currently) */}
                        {/* Commenting out authors filter: not needed with single author setup */}
                        {/* 
                        <Autocomplete
                            multiple
                            size="small"
                            options={availableFilters.authors || []}
                            getOptionLabel={(author) => author.displayName || author.name || 'Unknown'}
                            value={selectedAuthorIds.map(id =>
                                (availableFilters.authors || []).find(a => a.id === id) || { id, displayName: id }
                            )}
                            onChange={(e, newAuthors) => {
                                setSelectedAuthorIds(newAuthors.map(a => a.id));
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={t('blog:listPage.authorsLabel', 'Authors')}
                                    placeholder={t('blog:listPage.authorsPlaceholder', 'Select authors...')}
                                    sx={{ minWidth: 200 }}
                                />
                            )}
                            sx={{ backgroundColor: 'background.paper', borderRadius: 1 }}
                        />
                        */}
                    </Stack>

                    {/* Clear filters button */}
                    {(searchQuery || selectedCategory || selectedEvent || selectedCurrency || selectedTags.length > 0 || selectedAuthorIds.length > 0) && (
                        <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('');
                                setSelectedEvent('');
                                setSelectedCurrency('');
                                setSelectedTags([]);
                                setSelectedAuthorIds([]);
                            }}
                            sx={{ mt: 2, mb: 2 }}
                        >
                            {t('blog:listPage.clearFilters', 'Clear All Filters')}
                        </Button>
                    )}

                    {/* Error state */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 4 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Posts Grid with inline ads */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(3, 1fr)',
                            },
                            gap: 3,
                            mb: 4,
                        }}
                    >
                        {loading
                            ? Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)
                            : posts.flatMap((post, index) => {
                                const items = [
                                    <PostCard key={post.id} post={post} lang={currentLang} />,
                                ];
                                // Insert ad after every 6th card (not above fold: first ad at position 6)
                                if ((index + 1) % 6 === 0 && index > 0) {
                                    items.push(
                                        <Box
                                            key={`ad-${index}`}
                                            sx={{
                                                gridColumn: '1 / -1',
                                                my: 1,
                                            }}
                                        >
                                            <AdUnit
                                                slot={AD_SLOTS.BLOG_LIST_DISPLAY}
                                                format="display"
                                                minHeight={90}
                                                label={t('blog:ads.advertisement', 'Advertisement')}
                                            />
                                        </Box>
                                    );
                                }
                                return items;
                            })}

                        {/* Show skeleton cards while loading more (BEP UX: perceived performance) */}
                        {/* CRITICAL FIX: Only show skeletons if loadingMore AND hasMore, prevents infinite loop on mobile */}
                        {loadingMore && hasMore && Array.from({ length: 3 }).map((_, i) => (
                            <PostCardSkeleton key={`skeleton-${i}`} />
                        ))}
                    </Box>

                    {/* Empty state */}
                    {!loading && posts.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                {t('blog:listPage.noPostsTitle', 'No posts found')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {debouncedQuery
                                    ? t('blog:listPage.noPostsSearch', 'Try adjusting your search or filters')
                                    : t('blog:listPage.noPostsYet', 'Check back soon for new content')}
                            </Typography>
                        </Box>
                    )}

                    {/* Infinite scroll sentinel (invisible, triggers on intersection) */}
                    {!loading && hasMore && (
                        <Box
                            ref={sentinelRef}
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                py: 4,
                                minHeight: 40,
                            }}
                        />
                    )}
                </Container>

                {/* Blog Footer with dynamic hub links */}
                <Suspense fallback={null}>
                    <BlogFooter showCategories showEvents showCurrencies showTags />
                </Suspense>
            </PublicLayout>

            {/* Modals */}
            <Suspense fallback={null}>
                <AuthModal2 open={authModalOpen} onClose={handleCloseAuth} redirectPath="/clock" />
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
        </>
    );
}
