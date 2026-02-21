/**
 * src/components/RecentPosts.jsx
 *
 * Purpose: Filter-aware recent blog posts component for Calendar2Page.
 * Reads active currency filters from SettingsContext and prioritizes
 * blog posts tagged with matching currencies. Falls back to recency
 * when no currency filters are active.
 *
 * Features:
 * - SettingsContext-aware (reads currencies from eventFilters)
 * - Prioritizes posts matching active currency filters
 * - Skeleton loading states for perceived performance
 * - Lazy-loadable via React.lazy() for code-split performance
 * - UI inspired by RelatedPostsPreview (compact row cards with thumbnails)
 * - i18n support (EN/ES/FR) with fallback strings
 *
 * Changelog:
 * v1.0.0 - 2026-02-20 - Initial implementation (BEP filter-aware recent posts)
 */

import { useState, useEffect, useMemo, memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Chip,
    Stack,
    Skeleton,
    Card,
    CardContent,
    CardMedia,
} from '@mui/material';
import { useSettingsSafe } from '../contexts/SettingsContext';
import { listPublishedPosts } from '../services/blogService';
import {
    BLOG_CATEGORY_LABELS,
    estimateReadingTime,
    DEFAULT_BLOG_LANGUAGE,
} from '../types/blogTypes';
import { getDefaultBlogThumbnail } from '../utils/blogThumbnailFallback';
import { getCurrencyFlag } from '../utils/currencyFlags';

/**
 * Skeleton loader for recent posts — matches card layout dimensions
 */
const RecentPostsSkeleton = () => (
    <Box sx={{ mt: 4, mb: 2 }}>
        <Skeleton variant="text" width={160} height={28} sx={{ mb: 2 }} />
        <Stack spacing={1.5}>
            {Array.from({ length: 3 }).map((_, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Skeleton variant="rounded" width={80} height={60} sx={{ flexShrink: 0, borderRadius: 1 }} />
                    <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="90%" height={18} />
                        <Skeleton variant="text" width="60%" height={18} />
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                            <Skeleton variant="rounded" width={40} height={18} />
                            <Skeleton variant="rounded" width={50} height={18} />
                        </Box>
                    </Box>
                </Box>
            ))}
        </Stack>
    </Box>
);

/**
 * RecentPosts Component
 *
 * Displays recent blog posts relevant to the user's active calendar filters.
 * Reads currencies from SettingsContext (same source as ClockEventsFilters)
 * and scores posts by currency tag overlap + recency.
 */
const RecentPosts = memo(() => {
    const { t, i18n } = useTranslation(['blog', 'calendar']);
    const currentLang = i18n.language || 'en';
    const { eventFilters } = useSettingsSafe();

    // Active currency filters — same source as ClockEventsFilters
    const activeCurrencies = useMemo(
        () => eventFilters?.currencies || [],
        [eventFilters?.currencies]
    );

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch published posts once on mount / language change
    useEffect(() => {
        let isMounted = true;

        const fetchPosts = async () => {
            try {
                setLoading(true);
                const { posts: allPosts } = await listPublishedPosts({
                    lang: currentLang,
                    limit: 30,
                });

                if (!isMounted) return;
                setPosts(allPosts);
            } catch (err) {
                console.error('RecentPosts: Error fetching posts:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchPosts();
        return () => { isMounted = false; };
    }, [currentLang]);

    // Score and sort posts based on active currency filters + recency
    const rankedPosts = useMemo(() => {
        if (posts.length === 0) return [];

        const hasCurrencyFilter = activeCurrencies.length > 0;
        const currencySet = new Set(activeCurrencies.map(c => c.toUpperCase()));

        const scored = posts.map((post) => {
            let score = 0;

            // Currency match bonus: +3 per matching currency tag
            if (hasCurrencyFilter && post.currencyTags?.length > 0) {
                const matches = post.currencyTags.filter(c => currencySet.has(c.toUpperCase()));
                score += matches.length * 3;
            }

            // Recency bonus: recent posts get a boost
            const publishedAt = post.publishedAt?.toDate?.() || new Date(0);
            const daysSince = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince <= 7) score += 2;
            else if (daysSince <= 30) score += 1;

            return { ...post, _score: score };
        });

        // Sort: highest score first, then by publish date (most recent)
        scored.sort((a, b) => {
            if (b._score !== a._score) return b._score - a._score;
            const aDate = a.publishedAt?.toDate?.()?.getTime() || 0;
            const bDate = b.publishedAt?.toDate?.()?.getTime() || 0;
            return bDate - aDate;
        });

        return scored.slice(0, 4);
    }, [posts, activeCurrencies]);

    if (loading) return <RecentPostsSkeleton />;
    if (rankedPosts.length === 0) return null;

    return (
        <Box sx={{ mt: 4, mb: 2 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: '1rem' }}>
                {activeCurrencies.length > 0
                    ? t('calendar:recentPosts.filteredTitle', 'Related Articles')
                    : t('calendar:recentPosts.title', 'Recent Articles')}
            </Typography>

            <Stack spacing={1.5}>
                {rankedPosts.map((post) => {
                    const content = post.languages?.[currentLang] || post.languages?.[DEFAULT_BLOG_LANGUAGE] || {};
                    const slug = content.slug;
                    if (!slug) return null;

                    const readingTime = estimateReadingTime(content.contentHtml);

                    return (
                        <Card
                            key={post.id}
                            variant="outlined"
                            component={RouterLink}
                            to={`/blog/${slug}`}
                            sx={{
                                display: 'flex',
                                textDecoration: 'none',
                                color: 'inherit',
                                borderColor: 'divider',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: 'primary.light',
                                    boxShadow: 1,
                                    transform: 'translateX(2px)',
                                },
                            }}
                        >
                            {/* Thumbnail */}
                            <CardMedia
                                component="img"
                                image={content.coverImage?.url || getDefaultBlogThumbnail(post.id, true)}
                                alt=""
                                sx={{ width: 80, height: 60, objectFit: 'cover', flexShrink: 0 }}
                            />

                            <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 }, flex: 1, minWidth: 0 }}>
                                {/* Title */}
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        lineHeight: 1.3,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        mb: 0.5,
                                    }}
                                >
                                    {content.title}
                                </Typography>

                                {/* Meta chips */}
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                    {post.currencyTags?.slice(0, 2).map((currency) => {
                                        const flag = getCurrencyFlag(currency);
                                        return (
                                            <Chip
                                                key={currency}
                                                label={currency}
                                                size="small"
                                                icon={flag ? (
                                                    <Box
                                                        component="img"
                                                        loading="lazy"
                                                        src={`https://flagcdn.com/w20/${flag}.png`}
                                                        alt={currency}
                                                        sx={{ width: 14, height: 'auto', borderRadius: '1px', flexShrink: 0 }}
                                                    />
                                                ) : undefined}
                                                sx={{
                                                    height: 18,
                                                    fontSize: '0.6rem',
                                                    fontWeight: 700,
                                                    '& .MuiChip-icon': { ml: '4px', mr: '-2px' },
                                                }}
                                            />
                                        );
                                    })}
                                    {!post.currencyTags?.length && post.category && (
                                        <Chip
                                            label={t(`blog:categories.${post.category}`, BLOG_CATEGORY_LABELS[post.category] || post.category)}
                                            size="small"
                                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: 'primary.main', color: 'primary.contrastText' }}
                                        />
                                    )}
                                    {readingTime > 0 && (
                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', alignSelf: 'center' }}>
                                            {t('blog:postPage.readingTimeShort', { minutes: readingTime })}
                                        </Typography>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    );
                })}
            </Stack>
        </Box>
    );
});

RecentPosts.displayName = 'RecentPosts';

export default RecentPosts;
