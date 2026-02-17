/**
 * src/components/BlogFooter.jsx
 *
 * Purpose: Dynamic footer component for blog pages showing hub page links.
 * Automatically aggregates and displays available categories, events, currencies,
 * and tags from published posts with configurable max items per section.
 *
 * Features:
 * - Dynamic hub page links (categories, events, currencies, tags)
 * - Configurable max items per section with "View all" expansion
 * - i18n support (EN/ES/FR)
 * - Theme-aware styling
 * - Memoized for performance
 * - Mobile-responsive design
 *
 * Changelog:
 * v1.2.1 - 2026-02-07 - BEP LOGO & ICONS: (1) Replaced T2T text button with actual favicon logo matching AppBar.tsx (DEFAULT_BRAND_LOGO_SRC). (2) Removed section title icons from Categories, Economic Events, Currencies, and Popular Tags sections. (3) Cleaner, more minimal footer design with reduced visual clutter. (4) Improved visual hierarchy focusing on text labels and content.
 */

import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Container,
    Typography,
    Link,
    Stack,
    Divider,
    Skeleton,
    Button,
    Chip,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ClockIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoIcon from '@mui/icons-material/Info';
import MailIcon from '@mui/icons-material/Mail';

import { listPublishedPosts } from '../services/blogService';
import {
    BLOG_CATEGORY_LABELS,
    BLOG_ECONOMIC_EVENTS,
    BLOG_CURRENCY_LABELS,
} from '../types/blogTypes';
import { getCurrencyFlag } from '../utils/currencyFlags';
import { loadFlagIconsCSS } from '../app/clientEffects';

/**
 * Brand logo matching AppBar.tsx
 */
const DEFAULT_BRAND_LOGO_SRC = '/logos/favicon/favicon.ico';

/**
 * Default maximum items to show per section before "Show more"
 */
const DEFAULT_MAX_ITEMS = {
    categories: 6,
    events: 8,
    currencies: 8,
    tags: 10,
};

/**
 * Section component for displaying hub links
 */
const FooterSection = memo(({
    title,
    items,
    maxItems = 6,
    renderItem,
    showMoreLabel,
    showLessLabel,
}) => {
    const [expanded, setExpanded] = useState(false);

    const visibleItems = useMemo(() => {
        if (expanded || items.length <= maxItems) return items;
        return items.slice(0, maxItems);
    }, [items, maxItems, expanded]);

    const hasMore = items.length > maxItems;

    const toggleExpanded = useCallback(() => {
        setExpanded((prev) => !prev);
    }, []);

    if (items.length === 0) {
        return null; // Don't render empty sections
    }

    return (
        <Box sx={{ mb: 3 }}>
            <Typography
                variant="subtitle2"
                sx={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    mb: 1.5,
                }}
            >
                {title}
            </Typography>
            <Stack
                direction="column"
                spacing={0.5}
                sx={{
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                }}
            >
                {visibleItems.map((item, idx) => renderItem(item, idx))}
            </Stack>
            {hasMore && (
                <Button
                    size="small"
                    onClick={toggleExpanded}
                    endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{
                        mt: 1,
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        color: 'primary.main',
                        '&:hover': {
                            backgroundColor: 'action.hover',
                        },
                    }}
                >
                    {expanded ? showLessLabel : `${showMoreLabel} (${items.length - maxItems})`}
                </Button>
            )}
        </Box>
    );
});

FooterSection.displayName = 'FooterSection';

FooterSection.propTypes = {
    title: PropTypes.string.isRequired,
    items: PropTypes.array.isRequired,
    maxItems: PropTypes.number,
    renderItem: PropTypes.func.isRequired,
    showMoreLabel: PropTypes.string.isRequired,
    showLessLabel: PropTypes.string.isRequired,
};

/**
 * Loading skeleton for footer
 */
const FooterSkeleton = memo(() => (
    <Box sx={{ py: 4 }}>
        <Container maxWidth="lg">
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 3,
                }}
            >
                {[1, 2, 3, 4].map((i) => (
                    <Box key={i}>
                        <Skeleton variant="text" width={100} height={24} sx={{ mb: 1 }} />
                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                            {[1, 2, 3, 4].map((j) => (
                                <Skeleton key={j} variant="rounded" width={60} height={26} />
                            ))}
                        </Stack>
                    </Box>
                ))}
            </Box>
        </Container>
    </Box>
));

FooterSkeleton.displayName = 'FooterSkeleton';

/**
 * Converts a tag to URL-safe slug
 */
const tagToSlug = (tag) => {
    if (!tag) return '';
    return encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'));
};

/**
 * BlogFooter Component
 *
 * Dynamic footer displaying links to blog hub pages.
 * Aggregates taxonomy data from published posts.
 */
const BlogFooter = memo(({
    maxCategories = DEFAULT_MAX_ITEMS.categories,
    maxEvents = DEFAULT_MAX_ITEMS.events,
    maxCurrencies = DEFAULT_MAX_ITEMS.currencies,
    maxTags = DEFAULT_MAX_ITEMS.tags,
    showCategories = true,
    showEvents = true,
    showCurrencies = true,
    showTags = true,
}) => {
    const { t, i18n } = useTranslation('blog');
    const currentLang = i18n.language || 'en';

    // State for taxonomy data
    const [loading, setLoading] = useState(true);
    const [taxonomyData, setTaxonomyData] = useState({
        categories: [],
        events: [],
        currencies: [],
        tags: [],
    });

    // Fetch and aggregate taxonomy data from published posts
    // BEP PERFORMANCE: Load flag-icons CSS on-demand for currency flag display
    useEffect(() => { loadFlagIconsCSS(); }, []);
    useEffect(() => {
        let isMounted = true;

        const fetchTaxonomyData = async () => {
            try {
                setLoading(true);
                const { posts } = await listPublishedPosts({ lang: currentLang, limit: 200 });

                if (!isMounted) return;

                // Aggregate unique values with counts
                const categoryCounts = new Map();
                const eventCounts = new Map();
                const currencyCounts = new Map();
                const tagCounts = new Map();

                posts.forEach((post) => {
                    // Categories
                    if (post.category) {
                        categoryCounts.set(
                            post.category,
                            (categoryCounts.get(post.category) || 0) + 1
                        );
                    }

                    // Events
                    (post.eventTags || []).forEach((event) => {
                        eventCounts.set(event, (eventCounts.get(event) || 0) + 1);
                    });

                    // Currencies
                    (post.currencyTags || []).forEach((currency) => {
                        currencyCounts.set(currency, (currencyCounts.get(currency) || 0) + 1);
                    });

                    // Tags
                    (post.tags || []).forEach((tag) => {
                        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                    });
                });

                // Sort by count (descending) then alphabetically
                const sortByCountAndName = (a, b) => {
                    if (b.count !== a.count) return b.count - a.count;
                    return a.key.localeCompare(b.key);
                };

                // Convert to arrays with labels
                const categories = Array.from(categoryCounts.entries())
                    .map(([key, count]) => ({
                        key,
                        label: t(`categories.${key}`, BLOG_CATEGORY_LABELS[key] || key),
                        count,
                        url: `/blog/category/${key}`,
                    }))
                    .sort(sortByCountAndName);

                const events = Array.from(eventCounts.entries())
                    .map(([key, count]) => ({
                        key,
                        // BEP: Event names are NEVER translated - they are universal financial terms
                        label: BLOG_ECONOMIC_EVENTS[key] || key,
                        count,
                        url: `/blog/event/${key}`,
                    }))
                    .sort(sortByCountAndName);

                const currencies = Array.from(currencyCounts.entries())
                    .map(([key, count]) => ({
                        key,
                        label: key, // Currency codes are universal
                        fullLabel: t(`currencies.${key}`, BLOG_CURRENCY_LABELS[key] || key),
                        count,
                        url: `/blog/currency/${key}`,
                    }))
                    .sort(sortByCountAndName);

                const tags = Array.from(tagCounts.entries())
                    .map(([key, count]) => ({
                        key,
                        label: key,
                        count,
                        url: `/blog/tag/${tagToSlug(key)}`,
                    }))
                    .sort(sortByCountAndName);

                setTaxonomyData({ categories, events, currencies, tags });
            } catch (error) {
                console.error('BlogFooter: Error fetching taxonomy data:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchTaxonomyData();

        return () => {
            isMounted = false;
        };
    }, [currentLang, t]);

    // Render functions for each section
    const renderCategoryItem = useCallback(
        (item) => (
            <Link
                key={item.key}
                component={RouterLink}
                to={item.url}
                underline="hover"
                sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'primary.main',
                    '&:hover': {
                        color: 'primary.dark',
                    },
                }}
            >
                {item.label}
            </Link>
        ),
        []
    );

    const renderEventItem = useCallback(
        (item) => (
            <Link
                key={item.key}
                component={RouterLink}
                to={item.url}
                underline="hover"
                sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'primary.main',
                    '&:hover': {
                        color: 'primary.dark',
                    },
                }}
            >
                {item.label}
            </Link>
        ),
        []
    );

    const renderCurrencyItem = useCallback(
        (item) => {
            const countryCode = getCurrencyFlag(item.key);
            const flag = countryCode ? (
                <Box
                    component="span"
                    className={`fi fi-${countryCode}`}
                    sx={{
                        display: 'inline-block',
                        width: '0.9em',
                        height: '0.9em',
                        fontSize: '0.75rem',
                        lineHeight: 1,
                        borderRadius: '2px',
                    }}
                />
            ) : null;
            return (
                <Chip
                    key={item.key}
                    icon={flag}
                    label={item.label}
                    component={RouterLink}
                    to={item.url}
                    size="small"
                    variant="filled"
                    clickable
                    title={item.fullLabel}
                    sx={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        px: 1,
                        color: 'text.primary',
                        bgcolor: 'action.hover',
                        '&:hover': {
                            backgroundColor: 'action.selected',
                        },
                    }}
                />
            );
        },
        []
    );

    const renderTagItem = useCallback(
        (item) => (
            <Chip
                key={item.key}
                icon={<LocalOfferIcon sx={{ fontSize: '0.9rem !important' }} />}
                label={item.label}
                component={RouterLink}
                to={item.url}
                size="small"
                variant="filled"
                clickable
                sx={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    px: 1,
                    color: 'text.primary',
                    bgcolor: 'action.hover',
                    '&:hover': {
                        backgroundColor: 'action.selected',
                    },
                }}
            />
        ),
        []
    );

    // Check if there's any content to show
    const hasContent =
        (showCategories && taxonomyData.categories.length > 0) ||
        (showEvents && taxonomyData.events.length > 0) ||
        (showCurrencies && taxonomyData.currencies.length > 0) ||
        (showTags && taxonomyData.tags.length > 0);

    if (loading) {
        return <FooterSkeleton />;
    }

    if (!hasContent) {
        return null; // Don't render empty footer
    }

    return (
        <Box
            component="footer"
            sx={{
                py: 4,
                mt: 6,
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default',
            }}
        >
            <Container maxWidth="lg">
                {/* Header */}
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        mb: 3,
                        color: 'text.primary',
                    }}
                >
                    {t('footer.exploreMore', 'Explore More Articles')}
                </Typography>

                {/* Hub sections grid */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(4, 1fr)',
                        },
                        gap: 3,
                        alignItems: 'start',
                    }}
                >
                    {/* Categories */}
                    {showCategories && taxonomyData.categories.length > 0 && (
                        <FooterSection
                            title={t('footer.categories', 'Categories')}
                            items={taxonomyData.categories}
                            maxItems={maxCategories}
                            renderItem={renderCategoryItem}
                            showMoreLabel={t('footer.showMore', 'Show more')}
                            showLessLabel={t('footer.showLess', 'Show less')}
                        />
                    )}

                    {/* Events */}
                    {showEvents && taxonomyData.events.length > 0 && (
                        <FooterSection
                            title={t('footer.events', 'Economic Events')}
                            items={taxonomyData.events}
                            maxItems={maxEvents}
                            renderItem={renderEventItem}
                            showMoreLabel={t('footer.showMore', 'Show more')}
                            showLessLabel={t('footer.showLess', 'Show less')}
                        />
                    )}

                    {/* Currencies */}
                    {showCurrencies && taxonomyData.currencies.length > 0 && (
                        <FooterSection
                            title={t('footer.currencies', 'Currencies')}
                            items={taxonomyData.currencies}
                            maxItems={maxCurrencies}
                            renderItem={renderCurrencyItem}
                            showMoreLabel={t('footer.showMore', 'Show more')}
                            showLessLabel={t('footer.showLess', 'Show less')}
                        />
                    )}

                    {/* Tags */}
                    {showTags && taxonomyData.tags.length > 0 && (
                        <FooterSection
                            title={t('footer.tags', 'Popular Tags')}
                            items={taxonomyData.tags}
                            maxItems={maxTags}
                            renderItem={renderTagItem}
                            showMoreLabel={t('footer.showMore', 'Show more')}
                            showLessLabel={t('footer.showLess', 'Show less')}
                        />
                    )}
                </Box>

                {/* Quick Navigation Menu */}
                <Divider sx={{ my: 3 }} />
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                >
                    {/* Logo + Navigation Links */}
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                    >
                        <Link
                            component={RouterLink}
                            to="/"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: 32,
                                width: 'auto',
                                maxWidth: 32,
                                textDecoration: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    transform: 'scale(1.05)',
                                },
                                title: 'Time 2 Trade home',
                            }}
                        >
                            <Box
                                component="img"
                                src={DEFAULT_BRAND_LOGO_SRC}
                                alt="Time 2 Trade logo"
                                sx={{
                                    display: 'block',
                                    height: 32,
                                    width: 'auto',
                                    objectFit: 'contain',
                                    flexShrink: 0,
                                }}
                            />
                        </Link>
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{
                                flexWrap: 'wrap',
                                gap: { xs: 0.5, sm: 1 },
                            }}
                        >
                            <Link
                                component={RouterLink}
                                to="/clock"
                                underline="hover"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: 'text.secondary',
                                    '&:hover': {
                                        color: 'primary.main',
                                    },
                                }}
                            >
                                <ClockIcon sx={{ fontSize: '1rem' }} />
                                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{t('footer.clock', 'Clock')}</Box>
                            </Link>
                            <Link
                                component={RouterLink}
                                to="/calendar"
                                underline="hover"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: 'text.secondary',
                                    '&:hover': {
                                        color: 'primary.main',
                                    },
                                }}
                            >
                                <CalendarTodayIcon sx={{ fontSize: '1rem' }} />
                                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{t('footer.calendar', 'Calendar')}</Box>
                            </Link>
                            <Link
                                component={RouterLink}
                                to="/about"
                                underline="hover"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: 'text.secondary',
                                    '&:hover': {
                                        color: 'primary.main',
                                    },
                                }}
                            >
                                <InfoIcon sx={{ fontSize: '1rem' }} />
                                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{t('footer.about', 'About')}</Box>
                            </Link>
                            <Link
                                component={RouterLink}
                                to="/contact"
                                underline="hover"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: 'text.secondary',
                                    '&:hover': {
                                        color: 'primary.main',
                                    },
                                }}
                            >
                                <MailIcon sx={{ fontSize: '1rem' }} />
                                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{t('footer.contact', 'Contact')}</Box>
                            </Link>
                        </Stack>
                    </Stack>
                    {/* Financial Disclaimer */}
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                        © 2026 {t('footer.financialDisclaimer', 'Time 2 Trade. Not financial advice. Always verify market data independently.')}
                    </Typography>
                </Stack>
            </Container>
        </Box>
    );
});

BlogFooter.displayName = 'BlogFooter';

BlogFooter.propTypes = {
    maxCategories: PropTypes.number,
    maxEvents: PropTypes.number,
    maxCurrencies: PropTypes.number,
    maxTags: PropTypes.number,
    showCategories: PropTypes.bool,
    showEvents: PropTypes.bool,
    showCurrencies: PropTypes.bool,
    showTags: PropTypes.bool,
};

export default BlogFooter;
