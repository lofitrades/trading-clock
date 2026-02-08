/**
 * src/pages/BlogEventHubPage.jsx
 * 
 * Purpose: Public event taxonomy page listing posts related to a specific economic event.
 * BEP: SEO-first with structured data, multi-language, theme-aware.
 * 
 * Routes: /blog/event/{eventKey}, /{lang}/blog/event/{eventKey}
 * 
 * Changelog:
 * v1.0.1 - 2026-02-04 - Fixed Temporal Dead Zone issue: moved PostCard.propTypes assignment after component definition
 * v1.0.0 - 2026-02-04 - Initial implementation (Phase 5.B Blog)
 */

import PropTypes from 'prop-types';
import { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
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
    Breadcrumbs,
    Link,
    Skeleton,
    Alert,
    Divider,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';

import SEO from '../components/SEO';
import PublicLayout from '../components/PublicLayout';
import useAppBarNavItems from '../hooks/useAppBarNavItems';
import { listPublishedPosts } from '../services/blogService';
import {
    BLOG_ECONOMIC_EVENTS,
    BLOG_CATEGORY_LABELS,
    DEFAULT_BLOG_LANGUAGE,
} from '../types/blogTypes';
import { SITE_URL } from '../utils/seoMeta';

const AuthModal2 = lazy(() => import('../components/AuthModal2'));
const SettingsSidebar2 = lazy(() => import('../components/SettingsSidebar2'));
const BlogFooter = lazy(() => import('../components/BlogFooter'));

/**
 * Post card component
 */
const PostCard = ({ post, lang }) => {
    const { t } = useTranslation('blog');
    const content = post.languages?.[lang] || post.languages?.[DEFAULT_BLOG_LANGUAGE] || {};
    const slug = content.slug;
    const postUrl = `/blog/${slug}`;

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
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                },
            }}
        >
            <CardActionArea
                component={RouterLink}
                to={postUrl}
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
                {content.coverImage?.url && (
                    <CardMedia
                        component="img"
                        height="160"
                        image={content.coverImage.url}
                        alt={content.coverImage.alt || content.title}
                        sx={{ objectFit: 'cover' }}
                    />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                    {post.category && (
                        <Chip
                            label={t(`categories.${post.category}`, BLOG_CATEGORY_LABELS[post.category] || post.category)}
                            size="small"
                            sx={{ mb: 1 }}
                        />
                    )}
                    <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                        {content.title}
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 2,
                        }}
                    >
                        {content.excerpt}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 'auto' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                                {formattedDate}
                            </Typography>
                        </Box>
                        {post.readingTimeMinutes && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
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
    post: PropTypes.shape({
        id: PropTypes.string,
        languages: PropTypes.object,
        publishedAt: PropTypes.object,
        category: PropTypes.string,
        readingTimeMinutes: PropTypes.number,
    }).isRequired,
    lang: PropTypes.string.isRequired,
};

/**
 * Loading skeleton
 */
const PageSkeleton = () => (
    <Box>
        <Skeleton variant="text" width={200} height={24} sx={{ mb: 2 }} />
        <Skeleton variant="text" width="60%" height={48} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="40%" sx={{ mb: 4 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {[1, 2, 3].map(i => (
                <Skeleton key={i} variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            ))}
        </Box>
    </Box>
);

export default function BlogEventHubPage() {
    const { eventKey } = useParams();
    const { t, i18n } = useTranslation(['blog', 'common']);
    const currentLang = i18n.language || 'en';

    // State
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleOpenAuth = () => setAuthModalOpen(true);
    const handleCloseAuth = () => setAuthModalOpen(false);
    const handleOpenSettings = () => setSettingsOpen(true);
    const handleCloseSettings = () => setSettingsOpen(false);

    const navItems = useAppBarNavItems({
        onOpenSettings: handleOpenSettings,
        onOpenAuth: handleOpenAuth,
    });

    // Validate event key
    const eventLabel = BLOG_ECONOMIC_EVENTS[eventKey];
    const isValidEvent = Boolean(eventLabel);

    // Fetch posts with this event tag
    useEffect(() => {
        const fetchPosts = async () => {
            if (!isValidEvent) {
                setLoading(false);
                return;
            }

            setLoading(true);

            try {
                const { posts: allPosts } = await listPublishedPosts({ lang: currentLang, limit: 100 });
                // Filter posts that have this event tag
                const filteredPosts = allPosts.filter(post =>
                    post.eventTags?.includes(eventKey)
                );
                setPosts(filteredPosts);
            } catch (err) {
                console.error('Failed to fetch event posts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [eventKey, currentLang, isValidEvent, t]);

    // SEO
    const langPrefix = currentLang !== 'en' ? `/${currentLang}` : '';
    const pageTitle = eventLabel
        ? t('blog:eventHub.title', { event: eventLabel })
        : t('blog:eventHub.notFound', 'Event Not Found');
    const pageDescription = eventLabel
        ? t('blog:eventHub.description', { event: eventLabel })
        : '';
    const canonicalUrl = `${SITE_URL}${langPrefix}/blog/event/${eventKey}`;

    // Structured data for CollectionPage
    const structuredData = isValidEvent && posts.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: pageTitle,
        description: pageDescription,
        url: canonicalUrl,
        mainEntity: {
            '@type': 'ItemList',
            itemListElement: posts.slice(0, 10).map((post, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    '@type': 'BlogPosting',
                    headline: post.languages?.[currentLang]?.title || post.languages?.[DEFAULT_BLOG_LANGUAGE]?.title,
                    url: `${SITE_URL}${langPrefix}/blog/${post.languages?.[currentLang]?.slug || post.languages?.[DEFAULT_BLOG_LANGUAGE]?.slug}`,
                },
            })),
        },
    } : undefined;

    // 404 for invalid event
    if (!loading && !isValidEvent) {
        return (
            <PublicLayout navItems={navItems} onOpenAuth={handleOpenAuth} onOpenSettings={handleOpenSettings}>
                <SEO title={pageTitle} noindex />
                <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
                    <Alert severity="error">
                        {t('blog:eventHub.notFound', 'Event not found')}
                    </Alert>
                </Container>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout navItems={navItems} onOpenAuth={handleOpenAuth} onOpenSettings={handleOpenSettings}>
            <SEO
                title={pageTitle}
                description={pageDescription}
                canonical={canonicalUrl}
                structuredData={structuredData}
                noindex={posts.length === 0}
            />

            <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
                {/* Breadcrumbs */}
                <Breadcrumbs sx={{ mb: 3 }}>
                    <Link component={RouterLink} to="/" color="inherit" underline="hover">
                        {t('common:navigation.home', 'Home')}
                    </Link>
                    <Link component={RouterLink} to="/blog" color="inherit" underline="hover">
                        {t('common:blog', 'Blog')}
                    </Link>
                    <Typography color="text.primary">{eventLabel}</Typography>
                </Breadcrumbs>

                {loading ? (
                    <PageSkeleton />
                ) : (
                    <>
                        {/* Header */}
                        <Box sx={{ mb: 5 }}>
                            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                <EventIcon color="primary" sx={{ fontSize: 40 }} />
                                <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, fontWeight: 700 }}>
                                    {eventLabel}
                                </Typography>
                            </Stack>
                            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800 }}>
                                {t('blog:eventHub.intro', { event: eventLabel, count: posts.length })}
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 5 }} />

                        {/* Posts grid */}
                        {posts.length > 0 ? (
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
                                {posts.map((post) => (
                                    <PostCard key={post.id} post={post} lang={currentLang} />
                                ))}
                            </Box>
                        ) : (
                            <Alert severity="info">
                                {t('blog:eventHub.noPosts', 'No posts found for this event yet.')}
                            </Alert>
                        )}
                    </>
                )}
            </Container>

            {/* Blog Footer with dynamic hub links */}
            <Suspense fallback={null}>
                <BlogFooter showCategories showEvents showCurrencies showTags />
            </Suspense>

            {/* Modals */}
            <Suspense fallback={null}>
                <AuthModal2 open={authModalOpen} onClose={handleCloseAuth} redirectPath="/clock" />
            </Suspense>
            <Suspense fallback={null}>
                <SettingsSidebar2 open={settingsOpen && !authModalOpen} onClose={handleCloseSettings} onOpenAuth={handleOpenAuth} />
            </Suspense>
        </PublicLayout>
    );
}
