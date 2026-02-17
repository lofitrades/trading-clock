/**
 * src/pages/AdminBlogEditorPage.jsx
 * 
 * Purpose: Admin blog post editor with multi-language support.
 * RBAC: superadmin, admin, editor roles only
 * BEP: Full i18n, theme-aware, responsive, slug validation
 * 
 * Changelog:
 * v2.4.0 - 2026-02-15 - BEP: Added CoverImageUploader component for direct Firebase Storage upload/replace/delete of cover images alongside existing URL fields
 * v2.3.0 - 2026-02-05 - Added activity logging for blog create/update/publish actions
 * v2.2.0 - 2026-02-05 - BEP: Added link to author management in empty authors helper text
 * v2.1.0 - 2026-02-04 - Phase 5.B: Added RelatedPostsPreview panel with scoring visualization
 * v2.0.0 - 2026-02-04 - Phase 5.B: Added event/currency taxonomy and author selectors with preview
 * v1.0.0 - 2026-02-04 - Initial implementation (Phase 2 Blog)
 */

import PropTypes from 'prop-types';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    Alert,
    Snackbar,
    CircularProgress,
    Paper,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tabs,
    Tab,
    Chip,
    Stack,
    Divider,
    Autocomplete,
    IconButton,
    Tooltip,
    Collapse,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LinkIcon from '@mui/icons-material/Link';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../contexts/AuthContext';
import {
    createBlogPost,
    getBlogPost,
    updateBlogPost,
    publishBlogPost,
    isSlugAvailable,
} from '../services/blogService';
import { listBlogAuthors } from '../services/blogAuthorService';
import {
    logBlogCreated,
    logBlogUpdated,
    logBlogPublished,
} from '../services/activityLogger';
import {
    BLOG_POST_STATUS,
    BLOG_CATEGORIES,
    BLOG_CMS_ROLES,
    BLOG_LANGUAGES,
    DEFAULT_BLOG_LANGUAGE,
    DEFAULT_LANGUAGE_CONTENT,
    BLOG_LIMITS,
    BLOG_CURRENCIES,
    BLOG_CURRENCY_LABELS,
    BLOG_ECONOMIC_EVENTS,
    generateSlug,
    estimateReadingTime,
} from '../types/blogTypes';
import BlogContentEditor from '../components/admin/BlogContentEditor';
import RelatedPostsPreview from '../components/admin/RelatedPostsPreview';
import CoverImageUploader from '../components/admin/CoverImageUploader';

/**
 * Language tab panel
 */
function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`language-tabpanel-${index}`}
            aria-labelledby={`language-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    value: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
};

const AdminBlogEditorPage = () => {
    const { t } = useTranslation(['admin', 'common']);
    const navigate = useNavigate();
    const { postId } = useParams();
    const { user, userProfile, hasRole } = useAuth();

    const isEditMode = Boolean(postId);

    // State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Post data
    const [status, setStatus] = useState(BLOG_POST_STATUS.DRAFT);
    const [category, setCategory] = useState(BLOG_CATEGORIES.TRADING_TIPS);
    const [tags, setTags] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [relatedPostIds, setRelatedPostIds] = useState([]);

    // Phase 5.B: Taxonomy and authors
    const [eventTags, setEventTags] = useState([]);
    const [currencyTags, setCurrencyTags] = useState([]);
    const [authorIds, setAuthorIds] = useState([]);
    const [availableAuthors, setAvailableAuthors] = useState([]);
    const [showTaxonomyPreview, setShowTaxonomyPreview] = useState(false);

    // Language content
    const [activeLanguages, setActiveLanguages] = useState([DEFAULT_BLOG_LANGUAGE]);
    const [languageContent, setLanguageContent] = useState({
        [DEFAULT_BLOG_LANGUAGE]: { ...DEFAULT_LANGUAGE_CONTENT },
    });
    const [activeTab, setActiveTab] = useState(0);

    // Slug validation
    const [slugErrors, setSlugErrors] = useState({});
    const [slugChecking, setSlugChecking] = useState({});

    // RBAC check
    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        if (!hasRole(BLOG_CMS_ROLES)) {
            navigate('/', { replace: true });
            return;
        }
    }, [user, hasRole, navigate]);

    // Load available authors
    useEffect(() => {
        const loadAuthors = async () => {
            try {
                const authors = await listBlogAuthors();
                setAvailableAuthors(authors);
            } catch (err) {
                console.error('Failed to load authors:', err);
            }
        };
        loadAuthors();
    }, []);

    // Load existing post
    useEffect(() => {
        if (!isEditMode || !hasRole(BLOG_CMS_ROLES)) return;

        const loadPost = async () => {
            setLoading(true);
            setError('');

            try {
                const post = await getBlogPost(postId);
                if (!post) {
                    setError(t('admin:blog.postNotFound'));
                    return;
                }

                setStatus(post.status);
                setCategory(post.category || BLOG_CATEGORIES.TRADING_TIPS);
                setTags(post.tags || []);
                setKeywords(post.keywords || []);
                setRelatedPostIds(post.relatedPostIds || []);

                // Phase 5.B: Load taxonomy
                setEventTags(post.eventTags || []);
                setCurrencyTags(post.currencyTags || []);
                setAuthorIds(post.authorIds || []);

                const langs = Object.keys(post.languages || {});
                if (langs.length > 0) {
                    setActiveLanguages(langs);
                    setLanguageContent(post.languages);
                }
            } catch (err) {
                console.error('Failed to load post:', err);
                setError(err.message || 'Failed to load post');
            } finally {
                setLoading(false);
            }
        };

        loadPost();
    }, [isEditMode, postId, hasRole, t]);

    // Update language content
    const updateLanguageField = useCallback((lang, field, value) => {
        setLanguageContent((prev) => ({
            ...prev,
            [lang]: {
                ...prev[lang],
                [field]: value,
            },
        }));
    }, []);

    // Validate slug uniqueness
    const validateSlug = useCallback(async (lang, slug) => {
        if (!slug) {
            setSlugErrors((prev) => ({ ...prev, [lang]: '' }));
            return true;
        }

        setSlugChecking((prev) => ({ ...prev, [lang]: true }));

        try {
            const available = await isSlugAvailable(lang, slug, isEditMode ? postId : null);
            setSlugErrors((prev) => ({
                ...prev,
                [lang]: available ? '' : t('admin:blog.slugTaken'),
            }));
            return available;
        } catch (err) {
            console.error('Slug validation error:', err);
            return false;
        } finally {
            setSlugChecking((prev) => ({ ...prev, [lang]: false }));
        }
    }, [isEditMode, postId, t]);

    // Generate slug from title
    const handleGenerateSlug = useCallback((lang) => {
        const title = languageContent[lang]?.title || '';
        const slug = generateSlug(title);
        updateLanguageField(lang, 'slug', slug);
        validateSlug(lang, slug);
    }, [languageContent, updateLanguageField, validateSlug]);

    // Add language
    const handleAddLanguage = useCallback((lang) => {
        if (activeLanguages.includes(lang)) return;

        setActiveLanguages((prev) => [...prev, lang]);
        setLanguageContent((prev) => ({
            ...prev,
            [lang]: { ...DEFAULT_LANGUAGE_CONTENT },
        }));
        setActiveTab(activeLanguages.length); // Switch to new tab
    }, [activeLanguages]);

    // Remove language
    const handleRemoveLanguage = useCallback((lang) => {
        if (activeLanguages.length <= 1) {
            setSnackbar({
                open: true,
                message: t('admin:blog.cannotRemoveLastLanguage'),
                severity: 'warning',
            });
            return;
        }

        const index = activeLanguages.indexOf(lang);
        setActiveLanguages((prev) => prev.filter((l) => l !== lang));
        setLanguageContent((prev) => {
            const updated = { ...prev };
            delete updated[lang];
            return updated;
        });

        // Adjust active tab if needed
        if (activeTab >= index && activeTab > 0) {
            setActiveTab(activeTab - 1);
        }
    }, [activeLanguages, activeTab, t]);

    // Save post
    const handleSave = useCallback(async (andPublish = false) => {
        setSaving(true);
        setError('');

        try {
            // Validate at least one language has required fields
            const hasValidContent = Object.values(languageContent).some(
                (content) => content.title && content.slug
            );

            if (!hasValidContent) {
                throw new Error(t('admin:blog.validation.requiredFields'));
            }

            // Validate all slugs
            for (const lang of activeLanguages) {
                const slug = languageContent[lang]?.slug;
                if (slug) {
                    const available = await validateSlug(lang, slug);
                    if (!available) {
                        throw new Error(t('admin:blog.validation.slugConflict', { lang }));
                    }
                }
            }

            // Prepare languages with reading time
            const languages = {};
            for (const lang of activeLanguages) {
                const content = languageContent[lang];
                if (content.title || content.contentHtml) {
                    languages[lang] = {
                        ...content,
                        readingTimeMin: estimateReadingTime(content.contentHtml || ''),
                    };
                }
            }

            const postData = {
                category,
                tags,
                keywords,
                relatedPostIds,
                eventTags,
                currencyTags,
                authorIds,
                languages,
            };

            // Get the primary title for logging (prefer default language, then first available)
            const primaryTitle = languages[DEFAULT_BLOG_LANGUAGE]?.title
                || Object.values(languages).find(l => l.title)?.title
                || 'Untitled';
            // BEP: Use activeLanguages for activity logging (all languages in the post, not just saved ones)
            const languageKeys = activeLanguages;

            if (isEditMode) {
                await updateBlogPost(postId, postData);
                setSnackbar({ open: true, message: t('admin:blog.saveSuccess'), severity: 'success' });

                // Log activity: blog updated
                await logBlogUpdated(primaryTitle, postId, user.uid, languageKeys);
            } else {
                const newPostId = await createBlogPost(postData, {
                    uid: user.uid,
                    displayName: userProfile?.displayName || user.email,
                });

                setSnackbar({ open: true, message: t('admin:blog.createSuccess'), severity: 'success' });

                // Log activity: blog created
                await logBlogCreated(primaryTitle, newPostId, user.uid, languageKeys);

                // Redirect to edit mode
                navigate(`/admin/blog/edit/${newPostId}`, { replace: true });
            }

            // Publish if requested
            if (andPublish && isEditMode) {
                await publishBlogPost(postId);
                setStatus(BLOG_POST_STATUS.PUBLISHED);
                setSnackbar({ open: true, message: t('admin:blog.publishSuccess'), severity: 'success' });

                // BEP: Get fresh title from languageContent (most up-to-date)
                const publishTitle = languageContent[DEFAULT_BLOG_LANGUAGE]?.title
                    || Object.values(languageContent).find(l => l.title)?.title
                    || primaryTitle;

                // Log activity: blog published (with all active languages)
                await logBlogPublished(publishTitle, postId, user.uid, languageKeys);
            }
        } catch (err) {
            console.error('Save error:', err);
            setError(err.message || 'Failed to save post');
            setSnackbar({ open: true, message: err.message, severity: 'error' });
        } finally {
            setSaving(false);
        }
    }, [
        isEditMode,
        postId,
        user,
        userProfile,
        category,
        tags,
        keywords,
        relatedPostIds,
        eventTags,
        currencyTags,
        authorIds,
        activeLanguages,
        languageContent,
        validateSlug,
        navigate,
        t,
    ]);

    // Available languages to add
    const availableLanguages = useMemo(() => {
        return BLOG_LANGUAGES.filter((lang) => !activeLanguages.includes(lang));
    }, [activeLanguages]);

    // Phase 5.B: Compute taxonomy pages this post will appear on
    const taxonomyPagePreview = useMemo(() => {
        const pages = [];
        const baseUrl = 'https://time2.trade';

        // Event pages
        eventTags.forEach(eventKey => {
            pages.push({
                type: 'event',
                label: BLOG_ECONOMIC_EVENTS[eventKey] || eventKey,
                url: `${baseUrl}/blog/event/${eventKey}`,
            });
        });

        // Currency pages
        currencyTags.forEach(currency => {
            pages.push({
                type: 'currency',
                label: BLOG_CURRENCY_LABELS[currency] || currency,
                url: `${baseUrl}/blog/currency/${currency.toLowerCase()}`,
            });
        });

        // Event + Currency combinations
        eventTags.forEach(eventKey => {
            currencyTags.forEach(currency => {
                pages.push({
                    type: 'event-currency',
                    label: `${BLOG_ECONOMIC_EVENTS[eventKey] || eventKey} + ${currency}`,
                    url: `${baseUrl}/blog/event/${eventKey}/${currency.toLowerCase()}`,
                });
            });
        });

        // Author pages
        authorIds.forEach(authorId => {
            const author = availableAuthors.find(a => a.id === authorId);
            if (author?.slug) {
                pages.push({
                    type: 'author',
                    label: author.displayName,
                    url: `${baseUrl}/blog/author/${author.slug}`,
                });
            }
        });

        return pages;
    }, [eventTags, currencyTags, authorIds, availableAuthors]);

    if (!hasRole(BLOG_CMS_ROLES)) {
        return null;
    }

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/admin/blog')}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h4" component="h1">
                        {isEditMode ? t('admin:blog.editPost') : t('admin:blog.newPost')}
                    </Typography>
                    {isEditMode && (
                        <Chip
                            size="small"
                            label={t(`admin:blog.status.${status}`)}
                            color={status === BLOG_POST_STATUS.PUBLISHED ? 'success' : 'warning'}
                        />
                    )}
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSave(false)}
                        disabled={saving}
                    >
                        {t('common:save')}
                    </Button>
                    {isEditMode && status !== BLOG_POST_STATUS.PUBLISHED && (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<PublishIcon />}
                            onClick={() => handleSave(true)}
                            disabled={saving}
                        >
                            {t('admin:blog.saveAndPublish')}
                        </Button>
                    )}
                </Stack>
            </Box>

            {/* Error */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
                    gap: 3,
                }}
            >
                {/* Main Content */}
                <Box>
                    <Paper sx={{ p: 2 }}>
                        {/* Language Tabs */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Tabs
                                    value={activeTab}
                                    onChange={(_, newValue) => setActiveTab(newValue)}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    sx={{ flexGrow: 1 }}
                                >
                                    {activeLanguages.map((lang, index) => (
                                        <Tab
                                            key={lang}
                                            label={lang.toUpperCase()}
                                            id={`language-tab-${index}`}
                                            aria-controls={`language-tabpanel-${index}`}
                                        />
                                    ))}
                                </Tabs>
                                {activeLanguages.length > 1 && (
                                    <Tooltip title={t('admin:blog.removeLanguage')}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRemoveLanguage(activeLanguages[activeTab])}
                                            color="error"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Stack>
                        </Box>

                        {/* Add Language Button */}
                        {availableLanguages.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>{t('admin:blog.addLanguage')}</InputLabel>
                                    <Select
                                        value=""
                                        label={t('admin:blog.addLanguage')}
                                        onChange={(e) => handleAddLanguage(e.target.value)}
                                    >
                                        {availableLanguages.map((lang) => (
                                            <MenuItem key={lang} value={lang}>
                                                {lang.toUpperCase()}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}

                        {/* Language Content Panels */}
                        {activeLanguages.map((lang, index) => (
                            <TabPanel key={lang} value={activeTab} index={index}>
                                <Stack spacing={3}>
                                    {/* Title */}
                                    <TextField
                                        fullWidth
                                        label={t('admin:blog.fields.title')}
                                        value={languageContent[lang]?.title || ''}
                                        onChange={(e) => updateLanguageField(lang, 'title', e.target.value)}
                                        inputProps={{ maxLength: BLOG_LIMITS.MAX_TITLE_LENGTH }}
                                        helperText={`${(languageContent[lang]?.title || '').length}/${BLOG_LIMITS.MAX_TITLE_LENGTH}`}
                                        required
                                    />

                                    {/* Slug */}
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            fullWidth
                                            label={t('admin:blog.fields.slug')}
                                            value={languageContent[lang]?.slug || ''}
                                            onChange={(e) => {
                                                updateLanguageField(lang, 'slug', e.target.value);
                                            }}
                                            onBlur={() => validateSlug(lang, languageContent[lang]?.slug)}
                                            error={Boolean(slugErrors[lang])}
                                            helperText={slugErrors[lang] || t('admin:blog.fields.slugHelp')}
                                            required
                                            InputProps={{
                                                endAdornment: slugChecking[lang] && <CircularProgress size={20} />,
                                            }}
                                        />
                                        <Tooltip title={t('admin:blog.generateSlug')}>
                                            <IconButton onClick={() => handleGenerateSlug(lang)}>
                                                <AutorenewIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    {/* Excerpt */}
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label={t('admin:blog.fields.excerpt')}
                                        value={languageContent[lang]?.excerpt || ''}
                                        onChange={(e) => updateLanguageField(lang, 'excerpt', e.target.value)}
                                        inputProps={{ maxLength: BLOG_LIMITS.MAX_EXCERPT_LENGTH }}
                                        helperText={`${(languageContent[lang]?.excerpt || '').length}/${BLOG_LIMITS.MAX_EXCERPT_LENGTH}`}
                                    />

                                    {/* Content Editor */}
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            {t('admin:blog.fields.content')}
                                        </Typography>
                                        <BlogContentEditor
                                            value={languageContent[lang]?.contentHtml || ''}
                                            onChange={(html) => updateLanguageField(lang, 'contentHtml', html)}
                                        />
                                    </Box>

                                    <Divider />

                                    {/* SEO Fields */}
                                    <Typography variant="h6">{t('admin:blog.seoSettings')}</Typography>

                                    <TextField
                                        fullWidth
                                        label={t('admin:blog.fields.seoTitle')}
                                        value={languageContent[lang]?.seoTitle || ''}
                                        onChange={(e) => updateLanguageField(lang, 'seoTitle', e.target.value)}
                                        inputProps={{ maxLength: BLOG_LIMITS.MAX_SEO_TITLE_LENGTH }}
                                        helperText={`${(languageContent[lang]?.seoTitle || '').length}/${BLOG_LIMITS.MAX_SEO_TITLE_LENGTH}`}
                                    />

                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label={t('admin:blog.fields.seoDescription')}
                                        value={languageContent[lang]?.seoDescription || ''}
                                        onChange={(e) => updateLanguageField(lang, 'seoDescription', e.target.value)}
                                        inputProps={{ maxLength: BLOG_LIMITS.MAX_SEO_DESCRIPTION_LENGTH }}
                                        helperText={`${(languageContent[lang]?.seoDescription || '').length}/${BLOG_LIMITS.MAX_SEO_DESCRIPTION_LENGTH}`}
                                    />

                                    {/* Cover Image */}
                                    <Typography variant="h6">{t('admin:blog.coverImage')}</Typography>

                                    {/* Upload / Replace / Delete cover image */}
                                    <CoverImageUploader
                                        postId={postId}
                                        lang={lang}
                                        currentUrl={languageContent[lang]?.coverImage?.url || ''}
                                        currentAlt={languageContent[lang]?.coverImage?.alt || ''}
                                        onImageChange={(coverImage) =>
                                            updateLanguageField(lang, 'coverImage', coverImage)
                                        }
                                        disabled={saving}
                                    />

                                    {/* Manual URL fields (kept for GPT JSON uploads / advanced use) */}
                                    <Typography variant="caption" color="text.secondary">
                                        {t('admin:blog.coverImageUploader.orEnterUrl')}
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        label={t('admin:blog.fields.coverImageUrl')}
                                        value={languageContent[lang]?.coverImage?.url || ''}
                                        onChange={(e) => updateLanguageField(lang, 'coverImage', {
                                            ...languageContent[lang]?.coverImage,
                                            url: e.target.value,
                                        })}
                                        placeholder="https://..."
                                        size="small"
                                    />
                                    <TextField
                                        fullWidth
                                        label={t('admin:blog.fields.coverImageAlt')}
                                        value={languageContent[lang]?.coverImage?.alt || ''}
                                        onChange={(e) => updateLanguageField(lang, 'coverImage', {
                                            ...languageContent[lang]?.coverImage,
                                            alt: e.target.value,
                                        })}
                                        size="small"
                                    />
                                </Stack>
                            </TabPanel>
                        ))}
                    </Paper>
                </Box>

                {/* Sidebar */}
                <Box>
                    <Paper sx={{ p: 2, position: 'sticky', top: 16 }}>
                        <Stack spacing={3}>
                            {/* Category */}
                            <FormControl fullWidth>
                                <InputLabel>{t('admin:blog.fields.category')}</InputLabel>
                                <Select
                                    value={category}
                                    label={t('admin:blog.fields.category')}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    {Object.values(BLOG_CATEGORIES).map((cat) => (
                                        <MenuItem key={cat} value={cat}>
                                            {t(`admin:blog.categories.${cat}`)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Tags */}
                            <Autocomplete
                                multiple
                                freeSolo
                                options={[]}
                                value={tags}
                                onChange={(_, newValue) => setTags(newValue.slice(0, BLOG_LIMITS.MAX_TAGS))}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            size="small"
                                            label={option}
                                            {...getTagProps({ index })}
                                            key={option}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('admin:blog.fields.tags')}
                                        placeholder={t('admin:blog.fields.tagsPlaceholder')}
                                        helperText={`${tags.length}/${BLOG_LIMITS.MAX_TAGS}`}
                                    />
                                )}
                            />

                            {/* Keywords */}
                            <Autocomplete
                                multiple
                                freeSolo
                                options={[]}
                                value={keywords}
                                onChange={(_, newValue) => setKeywords(newValue.slice(0, BLOG_LIMITS.MAX_KEYWORDS))}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            size="small"
                                            label={option}
                                            {...getTagProps({ index })}
                                            key={option}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('admin:blog.fields.keywords')}
                                        placeholder={t('admin:blog.fields.keywordsPlaceholder')}
                                        helperText={`${keywords.length}/${BLOG_LIMITS.MAX_KEYWORDS}`}
                                    />
                                )}
                            />

                            <Divider />

                            {/* Phase 5.B: Taxonomy Section */}
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventIcon fontSize="small" />
                                {t('admin:blog.taxonomy.title', 'Event & Currency Taxonomy')}
                            </Typography>

                            {/* Economic Events */}
                            <Autocomplete
                                multiple
                                options={Object.keys(BLOG_ECONOMIC_EVENTS)}
                                value={eventTags}
                                onChange={(_, newValue) => setEventTags(newValue.slice(0, BLOG_LIMITS.MAX_EVENT_TAGS))}
                                getOptionLabel={(key) => BLOG_ECONOMIC_EVENTS[key] || key}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            size="small"
                                            label={BLOG_ECONOMIC_EVENTS[option] || option}
                                            color="primary"
                                            variant="outlined"
                                            {...getTagProps({ index })}
                                            key={option}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('admin:blog.taxonomy.events', 'Economic Events')}
                                        placeholder={t('admin:blog.taxonomy.eventsPlaceholder', 'Select events...')}
                                        helperText={`${eventTags.length}/${BLOG_LIMITS.MAX_EVENT_TAGS}`}
                                    />
                                )}
                            />

                            {/* Currencies */}
                            <Autocomplete
                                multiple
                                options={BLOG_CURRENCIES}
                                value={currencyTags}
                                onChange={(_, newValue) => setCurrencyTags(newValue.slice(0, BLOG_LIMITS.MAX_CURRENCY_TAGS))}
                                getOptionLabel={(code) => BLOG_CURRENCY_LABELS[code] || code}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            size="small"
                                            label={option}
                                            color="secondary"
                                            variant="outlined"
                                            icon={<AttachMoneyIcon sx={{ fontSize: 14 }} />}
                                            {...getTagProps({ index })}
                                            key={option}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('admin:blog.taxonomy.currencies', 'Currencies')}
                                        placeholder={t('admin:blog.taxonomy.currenciesPlaceholder', 'Select currencies...')}
                                        helperText={`${currencyTags.length}/${BLOG_LIMITS.MAX_CURRENCY_TAGS}`}
                                    />
                                )}
                            />

                            {/* Authors */}
                            <Autocomplete
                                multiple
                                options={availableAuthors}
                                value={availableAuthors.filter(a => authorIds.includes(a.id))}
                                onChange={(_, newValue) => setAuthorIds(newValue.map(a => a.id).slice(0, BLOG_LIMITS.MAX_AUTHORS))}
                                getOptionLabel={(author) => author.displayName || author.slug}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderTags={(value, getTagProps) =>
                                    value.map((author, index) => (
                                        <Chip
                                            size="small"
                                            label={author.displayName}
                                            icon={<PersonIcon sx={{ fontSize: 14 }} />}
                                            {...getTagProps({ index })}
                                            key={author.id}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={t('admin:blog.taxonomy.authors', 'Authors')}
                                        placeholder={t('admin:blog.taxonomy.authorsPlaceholder', 'Select authors...')}
                                        helperText={availableAuthors.length === 0
                                            ? (
                                                <Box component="span">
                                                    {t('admin:blog.taxonomy.noAuthors', 'No authors available.')}{' '}
                                                    <Box
                                                        component="a"
                                                        href="/admin/blog/authors"
                                                        sx={{ color: 'primary.main', textDecoration: 'underline', cursor: 'pointer' }}
                                                    >
                                                        {t('admin:blog.authors.addAuthor', 'Add Author')}
                                                    </Box>
                                                </Box>
                                            )
                                            : `${authorIds.length}/${BLOG_LIMITS.MAX_AUTHORS}`
                                        }
                                    />
                                )}
                                noOptionsText={t('admin:blog.taxonomy.noAuthors', 'No authors available')}
                            />

                            {/* Taxonomy Preview */}
                            {taxonomyPagePreview.length > 0 && (
                                <Box>
                                    <Button
                                        size="small"
                                        onClick={() => setShowTaxonomyPreview(!showTaxonomyPreview)}
                                        endIcon={showTaxonomyPreview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        sx={{ mb: 1 }}
                                    >
                                        {t('admin:blog.taxonomy.preview', 'Preview taxonomy pages')} ({taxonomyPagePreview.length})
                                    </Button>
                                    <Collapse in={showTaxonomyPreview}>
                                        <Paper variant="outlined" sx={{ p: 1, maxHeight: 200, overflowY: 'auto' }}>
                                            <List dense disablePadding>
                                                {taxonomyPagePreview.map((page, idx) => (
                                                    <ListItem key={idx} disablePadding sx={{ py: 0.25 }}>
                                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                                            {page.type === 'event' && <EventIcon fontSize="small" color="primary" />}
                                                            {page.type === 'currency' && <AttachMoneyIcon fontSize="small" color="secondary" />}
                                                            {page.type === 'event-currency' && <LinkIcon fontSize="small" color="info" />}
                                                            {page.type === 'author' && <PersonIcon fontSize="small" />}
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={page.label}
                                                            secondary={page.url.replace('https://time2.trade', '')}
                                                            primaryTypographyProps={{ variant: 'body2' }}
                                                            secondaryTypographyProps={{ variant: 'caption', sx: { wordBreak: 'break-all' } }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Paper>
                                    </Collapse>
                                </Box>
                            )}

                            {/* Warnings */}
                            {eventTags.length === 0 && currencyTags.length === 0 && (
                                <Alert severity="info" variant="outlined">
                                    {t('admin:blog.taxonomy.noTaxonomyWarning', 'No event or currency tags set. Post will not appear on taxonomy pages.')}
                                </Alert>
                            )}
                            {authorIds.length === 0 && status === BLOG_POST_STATUS.PUBLISHED && (
                                <Alert severity="warning" variant="outlined">
                                    {t('admin:blog.taxonomy.noAuthorWarning', 'No author assigned. Consider adding an author for attribution.')}
                                </Alert>
                            )}

                            <Divider />

                            {/* Related Posts Preview */}
                            <RelatedPostsPreview
                                postData={{
                                    id: postId,
                                    category,
                                    eventTags,
                                    currencyTags,
                                    tags,
                                    keywords,
                                }}
                                relatedPostIds={relatedPostIds}
                                onRelatedPostsChange={setRelatedPostIds}
                                lang={activeLanguages[activeTab] || DEFAULT_BLOG_LANGUAGE}
                            />

                            <Divider />

                            {/* Reading Time Estimate */}
                            {activeLanguages.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        {t('admin:blog.readingTime')}
                                    </Typography>
                                    <Typography variant="body2">
                                        {estimateReadingTime(languageContent[activeLanguages[activeTab]]?.contentHtml || '')} min
                                    </Typography>
                                </Box>
                            )}
                        </Stack>
                    </Paper>
                </Box>
            </Box>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default AdminBlogEditorPage;
