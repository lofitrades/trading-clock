/**
 * src/pages/BlogAuthorPage.jsx
 * 
 * Purpose: Public author page listing posts by a specific author.
 * BEP: SEO-first with structured data, multi-language, theme-aware.
 * 
 * Routes: /blog/author/{authorSlug}, /{lang}/blog/author/{authorSlug}
 * 
 * Changelog: * v1.0.1 - 2026-02-04 - Fixed Temporal Dead Zone issue: moved PostCard.propTypes assignment after component definition * v1.0.0 - 2026-02-04 - Initial implementation (Phase 5.B Blog)
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
    Avatar,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

import SEO from '../components/SEO';
import PublicLayout from '../components/PublicLayout';
import useAppBarNavItems from '../hooks/useAppBarNavItems';
import { listPublishedPosts } from '../services/blogService';
import { getBlogAuthorBySlug } from '../services/blogAuthorService';
import {
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
        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
            <Skeleton variant="circular" width={100} height={100} />
            <Box>
                <Skeleton variant="text" width={200} height={40} />
                <Skeleton variant="text" width={300} />
            </Box>
        </Stack>
        <Skeleton variant="text" width={200} height={24} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {[1, 2, 3].map(i => (
                <Skeleton key={i} variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            ))}
        </Box>
    </Box>
);

export default function BlogAuthorPage() {
    const { authorSlug } = useParams();
    const { t, i18n } = useTranslation(['blog', 'common']);
    const currentLang = i18n.language || 'en';

    // State
    const [author, setAuthor] = useState(null);
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

    // Fetch author and their posts
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                // Get author by slug
                const authorData = await getBlogAuthorBySlug(authorSlug);
                if (!authorData) {
                    setLoading(false);
                    return;
                }
                setAuthor(authorData);

                // Get posts by this author
                const { posts: allPosts } = await listPublishedPosts({ lang: currentLang, limit: 100 });
                const authorPosts = allPosts.filter(post =>
                    post.authorIds?.includes(authorData.id)
                );
                setPosts(authorPosts);
            } catch (err) {
                console.error('Failed to fetch author data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authorSlug, currentLang, t]);

    // SEO
    const langPrefix = currentLang !== 'en' ? `/${currentLang}` : '';
    const pageTitle = author
        ? t('blog:authorPage.title', { author: author.displayName })
        : t('blog:authorPage.notFound', 'Author Not Found');
    const pageDescription = author?.bio ||
        t('blog:authorPage.description', { author: author?.displayName || '' });
    const canonicalUrl = `${SITE_URL}${langPrefix}/blog/author/${authorSlug}`;

    // Structured data for ProfilePage
    const structuredData = author ? {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
            '@type': 'Person',
            name: author.displayName,
            description: author.bio,
            image: author.avatar?.url,
            url: canonicalUrl,
            sameAs: [
                author.social?.twitter && `https://twitter.com/${author.social.twitter}`,
                author.social?.linkedin,
            ].filter(Boolean),
        },
    } : undefined;

    // 404 for invalid author
    if (!loading && !author) {
        return (
            <PublicLayout navItems={navItems} onOpenAuth={handleOpenAuth} onOpenSettings={handleOpenSettings}>
                <SEO title={pageTitle} noindex />
                <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
                    <Alert severity="error">
                        {t('blog:authorPage.notFound', 'Author not found')}
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
                    <Typography color="text.primary">{author?.displayName || authorSlug}</Typography>
                </Breadcrumbs>

                {loading ? (
                    <PageSkeleton />
                ) : (
                    <>
                        {/* Author Header */}
                        <Box sx={{ mb: 5 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'center', sm: 'flex-start' }} spacing={3} sx={{ mb: 3 }}>
                                <Avatar
                                    src={author.avatar?.url}
                                    alt={author.avatar?.alt || author.displayName}
                                    sx={{ width: 100, height: 100 }}
                                >
                                    <PersonIcon sx={{ fontSize: 60 }} />
                                </Avatar>
                                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                                    <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, fontWeight: 700, mb: 1 }}>
                                        {author.displayName}
                                    </Typography>
                                    {author.bio && (
                                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mb: 2 }}>
                                            {author.bio}
                                        </Typography>
                                    )}
                                    {/* Social links */}
                                    <Stack direction="row" spacing={1}>
                                        {author.social?.twitter && (
                                            <Chip
                                                icon={<TwitterIcon />}
                                                label={`@${author.social.twitter}`}
                                                size="small"
                                                component="a"
                                                href={`https://twitter.com/${author.social.twitter}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                clickable
                                            />
                                        )}
                                        {author.social?.linkedin && (
                                            <Chip
                                                icon={<LinkedInIcon />}
                                                label="LinkedIn"
                                                size="small"
                                                component="a"
                                                href={author.social.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                clickable
                                            />
                                        )}
                                    </Stack>
                                </Box>
                            </Stack>
                        </Box>

                        <Divider sx={{ mb: 4 }} />

                        {/* Posts header */}
                        <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600 }}>
                            {t('blog:authorPage.posts', { count: posts.length })}
                        </Typography>

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
                                {t('blog:authorPage.noPosts', 'No posts by this author yet.')}
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
