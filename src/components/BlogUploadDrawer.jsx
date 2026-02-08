/**
 * src/components/BlogUploadDrawer.jsx
 *
 * Purpose: Admin drawer for uploading GPT-generated blog post JSON files.
 * Validates JSON schema, optional image upload to Firebase Storage,
 * then creates post in Firestore via blogService.
 *
 * Changelog:
 * v1.5.0 - 2026-02-05 - BEP: Added "Preview Post" button in success dialog with language-aware URLs (?preview=true)
 * v1.4.0 - 2026-02-05 - BEP: Enhanced activity logging for published posts (logBlogPublished)
 * v1.3.0 - 2026-02-05 - Added activity logging for blog uploads
 * v1.2.0 - 2026-02-05 - BEP: Alternate between 3 default thumbnails randomly
 * v1.1.0 - 2026-02-06 - BEP: Add placeholder URL detection, confirmation dialog for no image, default thumbnail fallback
 * v1.0.0 - 2026-02-06 - Initial implementation
 */

import { useState, useCallback, useRef } from 'react';

// Default blog thumbnails for posts without cover image (randomly alternated)
const DEFAULT_BLOG_THUMBNAILS = [
    '/blog/Blog_Default_Thumbnail_1.png',
    '/blog/Blog_Default_Thumbnail_2.png',
    '/blog/Blog_Default_Thumbnail_3.png',
];

/**
 * Get a random default thumbnail URL
 * @returns {string} Random default thumbnail URL
 */
const getRandomDefaultThumbnail = () => {
    const randomIndex = Math.floor(Math.random() * DEFAULT_BLOG_THUMBNAILS.length);
    return DEFAULT_BLOG_THUMBNAILS[randomIndex];
};
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
    Drawer,
    Box,
    Typography,
    Button,
    IconButton,
    Alert,
    AlertTitle,
    CircularProgress,
    Stack,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { createBlogPost } from '../services/blogService';
import { logBlogCreated, logBlogPublished } from '../services/activityLogger';
import { useAuth } from '../contexts/AuthContext';
import {
    BLOG_POST_STATUS,
    BLOG_CATEGORIES,
    BLOG_CURRENCIES,
    BLOG_ECONOMIC_EVENTS,
    BLOG_LIMITS,
    BLOG_LANGUAGES,
} from '../types/blogTypes';

const DRAWER_WIDTH = 500;

/**
 * Check if a cover image URL is valid (not a placeholder)
 * @param {string} url - Image URL to check
 * @returns {boolean} True if valid URL
 */
const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    // Check for common placeholder patterns
    const placeholderPatterns = [
        /\[PLACEHOLDER/i,
        /\[TODO/i,
        /\[REPLACE/i,
        /placeholder/i,
        /example\.com/i,
        /your-image-url/i,
    ];
    if (placeholderPatterns.some((pattern) => pattern.test(url))) return false;
    // Must be a valid URL format (http/https or relative path starting with /)
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

/**
 * Check if JSON data has valid cover images in all languages
 * @param {Object} data - Blog post JSON data
 * @returns {{ hasValidImage: boolean, hasPlaceholder: boolean }}
 */
const checkCoverImages = (data) => {
    let hasValidImage = false;
    let hasPlaceholder = false;

    for (const content of Object.values(data.languages || {})) {
        const url = content.coverImage?.url;
        if (isValidImageUrl(url)) {
            hasValidImage = true;
        } else if (url && typeof url === 'string' && url.length > 0) {
            hasPlaceholder = true;
        }
    }

    return { hasValidImage, hasPlaceholder };
};

/**
 * Validate blog post JSON schema
 * @param {Object} data - Parsed JSON data
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
const validateBlogPostJson = (data) => {
    const errors = [];
    const warnings = [];

    // Required top-level fields
    if (!data.status || !Object.values(BLOG_POST_STATUS).includes(data.status)) {
        errors.push(`Invalid or missing status. Must be one of: ${Object.values(BLOG_POST_STATUS).join(', ')}`);
    }

    if (!data.authorIds || !Array.isArray(data.authorIds) || data.authorIds.length === 0) {
        errors.push('authorIds is required and must be a non-empty array');
    }

    if (!data.category || !Object.values(BLOG_CATEGORIES).includes(data.category)) {
        errors.push(`Invalid or missing category. Must be one of: ${Object.values(BLOG_CATEGORIES).join(', ')}`);
    }

    // Languages validation
    if (!data.languages || typeof data.languages !== 'object') {
        errors.push('languages object is required');
    } else {
        const langs = Object.keys(data.languages);
        const requiredLangs = ['en', 'es', 'fr'];

        // Check all 3 languages present
        const missingLangs = requiredLangs.filter((l) => !langs.includes(l));
        if (missingLangs.length > 0) {
            errors.push(`Missing required languages: ${missingLangs.join(', ')}`);
        }

        // Validate each language content
        for (const [lang, content] of Object.entries(data.languages)) {
            if (!BLOG_LANGUAGES.includes(lang)) {
                warnings.push(`Unknown language code: ${lang}`);
            }

            if (!content.title || typeof content.title !== 'string') {
                errors.push(`languages.${lang}.title is required`);
            } else if (content.title.length > BLOG_LIMITS.MAX_TITLE_LENGTH) {
                errors.push(`languages.${lang}.title exceeds ${BLOG_LIMITS.MAX_TITLE_LENGTH} chars`);
            }

            if (!content.slug || typeof content.slug !== 'string') {
                errors.push(`languages.${lang}.slug is required`);
            } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(content.slug)) {
                errors.push(`languages.${lang}.slug must be URL-safe (lowercase, hyphens only)`);
            }

            if (!content.excerpt || typeof content.excerpt !== 'string') {
                errors.push(`languages.${lang}.excerpt is required`);
            } else if (content.excerpt.length > BLOG_LIMITS.MAX_EXCERPT_LENGTH) {
                errors.push(`languages.${lang}.excerpt exceeds ${BLOG_LIMITS.MAX_EXCERPT_LENGTH} chars`);
            }

            if (!content.contentHtml || typeof content.contentHtml !== 'string') {
                errors.push(`languages.${lang}.contentHtml is required`);
            }

            // Optional SEO fields
            if (content.seoTitle && content.seoTitle.length > BLOG_LIMITS.MAX_SEO_TITLE_LENGTH) {
                warnings.push(`languages.${lang}.seoTitle exceeds ${BLOG_LIMITS.MAX_SEO_TITLE_LENGTH} chars (will be truncated in SERP)`);
            }

            if (content.seoDescription && content.seoDescription.length > BLOG_LIMITS.MAX_SEO_DESCRIPTION_LENGTH) {
                warnings.push(`languages.${lang}.seoDescription exceeds ${BLOG_LIMITS.MAX_SEO_DESCRIPTION_LENGTH} chars (will be truncated in SERP)`);
            }

            // Cover image validation
            if (!content.coverImage || !content.coverImage.alt) {
                warnings.push(`languages.${lang}.coverImage.alt missing (accessibility)`);
            }
        }
    }

    // Tags validation
    if (data.tags) {
        if (!Array.isArray(data.tags)) {
            errors.push('tags must be an array');
        } else if (data.tags.length > BLOG_LIMITS.MAX_TAGS) {
            errors.push(`tags exceeds maximum of ${BLOG_LIMITS.MAX_TAGS}`);
        }
    }

    if (data.keywords) {
        if (!Array.isArray(data.keywords)) {
            errors.push('keywords must be an array');
        } else if (data.keywords.length > BLOG_LIMITS.MAX_KEYWORDS) {
            errors.push(`keywords exceeds maximum of ${BLOG_LIMITS.MAX_KEYWORDS}`);
        }
    }

    // Event tags validation
    if (data.eventTags) {
        if (!Array.isArray(data.eventTags)) {
            errors.push('eventTags must be an array');
        } else {
            const validEvents = Object.keys(BLOG_ECONOMIC_EVENTS);
            const invalidEvents = data.eventTags.filter((e) => !validEvents.includes(e));
            if (invalidEvents.length > 0) {
                warnings.push(`Unknown eventTags: ${invalidEvents.join(', ')}`);
            }
        }
    }

    // Currency tags validation
    if (data.currencyTags) {
        if (!Array.isArray(data.currencyTags)) {
            errors.push('currencyTags must be an array');
        } else {
            const invalidCurrencies = data.currencyTags.filter((c) => !BLOG_CURRENCIES.includes(c));
            if (invalidCurrencies.length > 0) {
                warnings.push(`Unknown currencyTags: ${invalidCurrencies.join(', ')}`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};

/**
 * BlogUploadDrawer component
 */
const BlogUploadDrawer = ({ open, onClose }) => {
    const { t, i18n } = useTranslation(['admin', 'common']);
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);

    // State
    const [jsonFile, setJsonFile] = useState(null);
    const [jsonData, setJsonData] = useState(null);
    const [validation, setValidation] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [successDialog, setSuccessDialog] = useState({ open: false, postId: null, slug: null });
    const [dragOver, setDragOver] = useState(false);
    const [noImageConfirmDialog, setNoImageConfirmDialog] = useState(false);

    // Reset state
    const resetState = useCallback(() => {
        setJsonFile(null);
        setJsonData(null);
        setValidation(null);
        setImageFile(null);
        setImagePreview(null);
        setUploadError('');
        setDragOver(false);
        setNoImageConfirmDialog(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (imageInputRef.current) imageInputRef.current.value = '';
    }, []);

    // Handle close
    const handleClose = useCallback(() => {
        resetState();
        onClose();
    }, [onClose, resetState]);

    // Handle JSON file selection
    const handleJsonSelect = useCallback((file) => {
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            setUploadError(t('admin:blog.upload.invalidFileType'));
            return;
        }

        setUploadError('');
        setJsonFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const parsed = JSON.parse(e.target.result);
                setJsonData(parsed);
                const result = validateBlogPostJson(parsed);
                setValidation(result);
            } catch (err) {
                setUploadError(t('admin:blog.upload.parseError', { error: err.message }));
                setJsonData(null);
                setValidation(null);
            }
        };
        reader.readAsText(file);
    }, [t]);

    // Handle drag events
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleJsonSelect(file);
    }, [handleJsonSelect]);

    // Handle image selection
    const handleImageSelect = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError(t('admin:blog.upload.invalidImageType'));
            return;
        }

        // Validate file size
        if (file.size > BLOG_LIMITS.MAX_COVER_IMAGE_SIZE_MB * 1024 * 1024) {
            setUploadError(t('admin:blog.upload.imageTooLarge', { max: BLOG_LIMITS.MAX_COVER_IMAGE_SIZE_MB }));
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setUploadError('');
    }, [t]);

    // Check if upload can proceed (may need image confirmation)
    const handleUploadClick = useCallback(() => {
        if (!jsonData || !validation?.valid) return;

        // Check if we have a valid image (either uploaded or valid URL in JSON)
        const { hasValidImage, hasPlaceholder } = checkCoverImages(jsonData);

        // If user uploaded an image, proceed directly
        if (imageFile) {
            handleUpload(false);
            return;
        }

        // If JSON has valid image URLs, proceed directly
        if (hasValidImage && !hasPlaceholder) {
            handleUpload(false);
            return;
        }

        // Otherwise, show confirmation dialog
        setNoImageConfirmDialog(true);
    }, [jsonData, validation, imageFile]);

    // Upload to Firestore
    const handleUpload = useCallback(async (useDefaultImage = false) => {
        if (!jsonData || !validation?.valid) return;

        setUploading(true);
        setUploadError('');
        setNoImageConfirmDialog(false);

        try {
            let postData = { ...jsonData };
            let imageUrl = null;

            // Upload image to Firebase Storage if provided
            if (imageFile) {
                const timestamp = Date.now();
                const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const storagePath = `blog-images/${timestamp}_${sanitizedName}`;
                const storageRef = ref(storage, storagePath);

                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);

                // Update all languages with the uploaded image URL
                for (const lang of Object.keys(postData.languages)) {
                    postData.languages[lang].coverImage = {
                        ...postData.languages[lang].coverImage,
                        url: imageUrl,
                    };
                }
            } else {
                // No image uploaded - check if we need to use default
                const { hasValidImage } = checkCoverImages(postData);

                if (!hasValidImage || useDefaultImage) {
                    // Use random default thumbnail for all languages
                    const defaultThumbnail = getRandomDefaultThumbnail();
                    for (const lang of Object.keys(postData.languages)) {
                        postData.languages[lang].coverImage = {
                            url: defaultThumbnail,
                            alt: postData.languages[lang].coverImage?.alt || postData.languages[lang].title || 'Blog post cover',
                        };
                    }
                }
            }

            // Create the blog post
            const author = {
                uid: user.uid,
                displayName: user.displayName || user.email,
            };

            const postId = await createBlogPost(postData, author);

            // Log activity: blog created/published via GPT upload
            const primaryTitle = postData.languages?.en?.title
                || Object.values(postData.languages || {}).find(l => l.title)?.title
                || 'Untitled';
            const languageKeys = Object.keys(postData.languages || {});

            // Log appropriate activity based on post status
            if (postData.status === 'published') {
                await logBlogPublished(primaryTitle, postId, user.uid, languageKeys);
            } else {
                await logBlogCreated(primaryTitle, postId, user.uid, languageKeys);
            }

            // Extract slug for preview (use current language or fallback to first available)
            const currentLang = i18n.language || 'en';
            const slug = postData.languages?.[currentLang]?.slug
                || postData.languages?.en?.slug
                || Object.values(postData.languages || {}).find(l => l.slug)?.slug
                || 'untitled';

            // Show success dialog
            setSuccessDialog({ open: true, postId, slug });
        } catch (err) {
            console.error('Upload error:', err);
            setUploadError(err.message || t('admin:blog.upload.uploadFailed'));
        } finally {
            setUploading(false);
        }
    }, [jsonData, validation, imageFile, user, t]);

    // Handle success dialog actions
    const handleSuccessClose = useCallback(() => {
        setSuccessDialog({ open: false, postId: null, slug: null });
        handleClose();
    }, [handleClose]);

    const handleEditDraft = useCallback(() => {
        const { postId } = successDialog;
        setSuccessDialog({ open: false, postId: null, slug: null });
        handleClose();
        navigate(`/admin/blog/edit/${postId}`);
    }, [successDialog, handleClose, navigate]);

    const handlePreviewPost = useCallback(() => {
        const { slug } = successDialog;
        const previewUrl = `/blog/${slug}?preview=true`;
        setSuccessDialog({ open: false, postId: null, slug: null });
        handleClose();
        navigate(previewUrl);
    }, [successDialog, handleClose, navigate]);

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={handleClose}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: { xs: '100%', sm: DRAWER_WIDTH },
                        maxWidth: '100%',
                    },
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Header */}
                    <Box
                        sx={{
                            p: 2,
                            borderBottom: 1,
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Typography variant="h6">{t('admin:blog.upload.title')}</Typography>
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        <Stack spacing={3}>
                            {/* JSON File Drop Zone */}
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    {t('admin:blog.upload.jsonFile')}
                                </Typography>
                                <Paper
                                    variant="outlined"
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    sx={{
                                        p: 3,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        borderStyle: 'dashed',
                                        borderWidth: 2,
                                        borderColor: dragOver ? 'primary.main' : 'divider',
                                        bgcolor: dragOver ? 'action.hover' : 'background.paper',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: 'action.hover',
                                        },
                                    }}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".json"
                                        onChange={(e) => handleJsonSelect(e.target.files?.[0])}
                                        hidden
                                    />
                                    {jsonFile ? (
                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                            <DescriptionIcon color="primary" />
                                            <Typography>{jsonFile.name}</Typography>
                                        </Stack>
                                    ) : (
                                        <>
                                            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                            <Typography color="text.secondary">
                                                {t('admin:blog.upload.dropZone')}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {t('admin:blog.upload.clickOrDrag')}
                                            </Typography>
                                        </>
                                    )}
                                </Paper>
                            </Box>

                            {/* Validation Results */}
                            {validation && (
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>
                                        {t('admin:blog.upload.validation')}
                                    </Typography>

                                    {validation.valid ? (
                                        <Alert severity="success" icon={<CheckCircleIcon />}>
                                            <AlertTitle>{t('admin:blog.upload.validationPassed')}</AlertTitle>
                                            {t('admin:blog.upload.validationPassedDesc')}
                                        </Alert>
                                    ) : (
                                        <Alert severity="error" icon={<ErrorIcon />}>
                                            <AlertTitle>{t('admin:blog.upload.validationFailed')}</AlertTitle>
                                            <List dense disablePadding>
                                                {validation.errors.map((err, i) => (
                                                    <ListItem key={i} disablePadding sx={{ py: 0.25 }}>
                                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                                            <ErrorIcon fontSize="small" color="error" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={err}
                                                            primaryTypographyProps={{ variant: 'body2' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Alert>
                                    )}

                                    {validation.warnings.length > 0 && (
                                        <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 1 }}>
                                            <AlertTitle>{t('admin:blog.upload.warnings')}</AlertTitle>
                                            <List dense disablePadding>
                                                {validation.warnings.map((warn, i) => (
                                                    <ListItem key={i} disablePadding sx={{ py: 0.25 }}>
                                                        <ListItemIcon sx={{ minWidth: 28 }}>
                                                            <WarningIcon fontSize="small" color="warning" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={warn}
                                                            primaryTypographyProps={{ variant: 'body2' }}
                                                        />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Alert>
                                    )}

                                    {/* Post Summary */}
                                    {jsonData && validation.valid && (
                                        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>
                                                {t('admin:blog.upload.summary')}
                                            </Typography>
                                            <Stack spacing={1}>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {t('admin:blog.fields.title')}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {jsonData.languages?.en?.title || '—'}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {t('admin:blog.columns.status')}
                                                    </Typography>
                                                    <Box>
                                                        <Chip
                                                            label={t(`admin:blog.status.${jsonData.status}`)}
                                                            size="small"
                                                            color={jsonData.status === 'published' ? 'success' : 'warning'}
                                                        />
                                                    </Box>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {t('admin:blog.category')}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {t(`admin:blog.categories.${jsonData.category}`)}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {t('admin:blog.columns.languages')}
                                                    </Typography>
                                                    <Stack direction="row" spacing={0.5}>
                                                        {Object.keys(jsonData.languages || {}).map((lang) => (
                                                            <Chip key={lang} label={lang.toUpperCase()} size="small" variant="outlined" />
                                                        ))}
                                                    </Stack>
                                                </Box>
                                                {jsonData.tags?.length > 0 && (
                                                    <Box>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {t('admin:blog.fields.tags')}
                                                        </Typography>
                                                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                            {jsonData.tags.map((tag) => (
                                                                <Chip key={tag} label={tag} size="small" />
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Paper>
                                    )}
                                </Box>
                            )}

                            {/* Cover Image Upload (Optional) */}
                            {validation?.valid && (
                                <Box>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="subtitle2" gutterBottom>
                                        {t('admin:blog.upload.coverImage')}
                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                            ({t('common:optional')})
                                        </Typography>
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        {t('admin:blog.upload.coverImageDesc')}
                                    </Typography>

                                    <Button
                                        variant="outlined"
                                        startIcon={<ImageIcon />}
                                        onClick={() => imageInputRef.current?.click()}
                                        fullWidth
                                    >
                                        {imageFile ? imageFile.name : t('admin:blog.upload.selectImage')}
                                    </Button>
                                    <input
                                        ref={imageInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        hidden
                                    />

                                    {imagePreview && (
                                        <Box sx={{ mt: 2 }}>
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                style={{
                                                    width: '100%',
                                                    maxHeight: 200,
                                                    objectFit: 'cover',
                                                    borderRadius: 8,
                                                }}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            )}

                            {/* Error Display */}
                            {uploadError && (
                                <Alert severity="error">{uploadError}</Alert>
                            )}
                        </Stack>
                    </Box>

                    {/* Footer Actions */}
                    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Stack direction="row" spacing={2}>
                            <Button variant="outlined" onClick={handleClose} fullWidth disabled={uploading}>
                                {t('common:cancel')}
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleUploadClick}
                                fullWidth
                                disabled={!validation?.valid || uploading}
                                startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                            >
                                {uploading ? t('admin:blog.upload.uploading') : t('admin:blog.upload.uploadButton')}
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Drawer>

            {/* No Image Confirmation Dialog */}
            <Dialog open={noImageConfirmDialog} onClose={() => setNoImageConfirmDialog(false)}>
                <DialogTitle>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <WarningIcon color="warning" />
                        <span>{t('admin:blog.upload.noImageTitle')}</span>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2 }}>{t('admin:blog.upload.noImageDesc')}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        {DEFAULT_BLOG_THUMBNAILS.map((src, idx) => (
                            <Box
                                key={idx}
                                component="img"
                                src={src}
                                alt={`Default thumbnail ${idx + 1}`}
                                sx={{
                                    width: 'calc(33.33% - 8px)',
                                    height: 80,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            />
                        ))}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {t('admin:blog.upload.defaultThumbnailNote')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNoImageConfirmDialog(false)}>
                        {t('admin:blog.upload.goBackUploadImage')}
                    </Button>
                    <Button variant="contained" onClick={() => handleUpload(true)}>
                        {t('admin:blog.upload.useDefaultImage')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={successDialog.open} onClose={handleSuccessClose}>
                <DialogTitle>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <CheckCircleIcon color="success" />
                        <span>{t('admin:blog.upload.successTitle')}</span>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Typography>{t('admin:blog.upload.successDesc')}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSuccessClose}>{t('common:close')}</Button>
                    <Button onClick={handleEditDraft}>
                        {t('admin:blog.upload.editDraft')}
                    </Button>
                    <Button variant="contained" onClick={handlePreviewPost}>
                        {t('admin:blog.upload.previewPost') || 'Preview Post'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

BlogUploadDrawer.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default BlogUploadDrawer;
