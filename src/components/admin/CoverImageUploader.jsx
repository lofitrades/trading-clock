/**
 * src/components/admin/CoverImageUploader.jsx
 *
 * Purpose: Reusable cover image upload component for the Blog Editor.
 * Provides drag-and-drop, click-to-browse, image preview, replace, and delete
 * functionality. Uploads to Firebase Storage via useBlogCoverImageUpload hook.
 * Keeps existing Cover Image URL + Alt Text fields intact for GPT JSON uploads.
 *
 * Features:
 * - Drag-and-drop zone with visual feedback
 * - Click-to-browse file picker
 * - Live image preview (uploaded or URL-based)
 * - Upload progress bar
 * - Replace and delete actions
 * - File validation (type, size) with user-friendly errors
 * - Fully i18n (admin:blog.coverImageUploader namespace)
 * - Theme-aware, responsive, accessible
 *
 * Changelog:
 * v1.0.0 - 2026-02-15 - Initial implementation (BEP blog cover image upload)
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Button,
    IconButton,
    Tooltip,
    LinearProgress,
    Alert,
    Stack,
    Paper,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ImageIcon from '@mui/icons-material/Image';
import useBlogCoverImageUpload from '../../hooks/useBlogCoverImageUpload';
import { BLOG_LIMITS } from '../../types/blogTypes';

/**
 * CoverImageUploader component for blog editor.
 *
 * @param {Object} props
 * @param {string} props.postId - Blog post document ID (required for upload path)
 * @param {string} props.lang - Current language tab (en, es, fr)
 * @param {string} props.currentUrl - Current cover image URL (from languageContent)
 * @param {string} props.currentAlt - Current cover image alt text
 * @param {function} props.onImageChange - Callback: ({ url, alt }) => void
 * @param {boolean} props.disabled - Disable all interactions
 */
const CoverImageUploader = ({
    postId,
    lang,
    currentUrl = '',
    currentAlt = '',
    onImageChange,
    disabled = false,
}) => {
    const { t } = useTranslation(['admin']);
    const fileInputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);
    const [localPreview, setLocalPreview] = useState(null);

    const {
        uploading,
        progress,
        error: uploadError,
        uploadCoverImage,
        deleteCoverImage,
        validateFile,
        clearError,
    } = useBlogCoverImageUpload();

    /** Whether we have a visible image to show */
    const hasImage = useMemo(() => Boolean(currentUrl || localPreview), [currentUrl, localPreview]);

    /** The preview source — local blob URL takes priority during upload */
    const previewSrc = useMemo(() => localPreview || currentUrl, [localPreview, currentUrl]);

    /**
     * Handle file selection (from input or drop).
     */
    const handleFileSelected = useCallback(async (file) => {
        if (!file || disabled) return;

        clearError();

        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) return;

        // Create local preview immediately
        const blobUrl = URL.createObjectURL(file);
        setLocalPreview(blobUrl);

        // If no postId yet, warn user to save first
        if (!postId) {
            // Can't upload without postId — show preview but inform user
            return;
        }

        try {
            const downloadUrl = await uploadCoverImage(file, postId, lang);
            // Update parent state with the Firebase Storage URL
            onImageChange({
                url: downloadUrl,
                alt: currentAlt || file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
            });
            // Clean up local preview
            URL.revokeObjectURL(blobUrl);
            setLocalPreview(null);
        } catch {
            // Error is already set in the hook — keep local preview so user sees what failed
        }
    }, [postId, lang, currentAlt, disabled, validateFile, clearError, uploadCoverImage, onImageChange]);

    /**
     * Handle drag events for the drop zone.
     */
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    /**
     * Handle file drop.
     */
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (disabled) return;

        const file = e.dataTransfer?.files?.[0];
        if (file) handleFileSelected(file);
    }, [disabled, handleFileSelected]);

    /**
     * Handle file input change.
     */
    const handleInputChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelected(file);
        // Reset input so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, [handleFileSelected]);

    /**
     * Open file browser.
     */
    const handleBrowse = useCallback(() => {
        if (disabled) return;
        fileInputRef.current?.click();
    }, [disabled]);

    /**
     * Delete the current cover image from Storage and clear the URL.
     */
    const handleDelete = useCallback(async () => {
        if (disabled) return;
        clearError();

        try {
            if (postId && lang) {
                await deleteCoverImage(postId, lang);
            }
            onImageChange({ url: '', alt: currentAlt });
            setLocalPreview(null);
        } catch {
            // Error displayed via hook state
        }
    }, [postId, lang, currentAlt, disabled, deleteCoverImage, clearError, onImageChange]);

    /**
     * Replace — open file picker for new image.
     */
    const handleReplace = useCallback(() => {
        if (disabled) return;
        handleBrowse();
    }, [disabled, handleBrowse]);

    return (
        <Box>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                style={{ display: 'none' }}
                onChange={handleInputChange}
                disabled={disabled || uploading}
            />

            {/* Error alert */}
            {uploadError && (
                <Alert severity="error" onClose={clearError} sx={{ mb: 1.5 }}>
                    {uploadError}
                </Alert>
            )}

            {/* No postId warning */}
            {!postId && localPreview && (
                <Alert severity="info" sx={{ mb: 1.5 }}>
                    {t('admin:blog.coverImageUploader.saveFirstToUpload')}
                </Alert>
            )}

            {hasImage ? (
                /* ─── Image Preview State ─── */
                <Paper
                    variant="outlined"
                    sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'action.hover',
                    }}
                >
                    {/* Image preview */}
                    <Box
                        component="img"
                        src={previewSrc}
                        alt={currentAlt || t('admin:blog.coverImageUploader.previewAlt')}
                        sx={{
                            width: '100%',
                            maxHeight: 220,
                            objectFit: 'cover',
                            display: 'block',
                        }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />

                    {/* Upload progress overlay */}
                    {uploading && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                bgcolor: 'rgba(0,0,0,0.6)',
                                p: 1,
                            }}
                        >
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ height: 6, borderRadius: 3 }}
                            />
                            <Typography
                                variant="caption"
                                sx={{ color: 'common.white', mt: 0.5, display: 'block', textAlign: 'center' }}
                            >
                                {t('admin:blog.coverImageUploader.uploading', { progress })}
                            </Typography>
                        </Box>
                    )}

                    {/* Action buttons overlay */}
                    {!uploading && (
                        <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                            }}
                        >
                            <Tooltip title={t('admin:blog.coverImageUploader.replace')}>
                                <IconButton
                                    size="small"
                                    onClick={handleReplace}
                                    disabled={disabled}
                                    sx={{
                                        bgcolor: 'rgba(0,0,0,0.6)',
                                        color: 'common.white',
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                                    }}
                                >
                                    <SwapHorizIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title={t('admin:blog.coverImageUploader.delete')}>
                                <IconButton
                                    size="small"
                                    onClick={handleDelete}
                                    disabled={disabled}
                                    sx={{
                                        bgcolor: 'rgba(0,0,0,0.6)',
                                        color: 'error.light',
                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Stack>
                    )}
                </Paper>
            ) : (
                /* ─── Drop Zone (No Image) ─── */
                <Paper
                    variant="outlined"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={handleBrowse}
                    sx={{
                        p: 3,
                        textAlign: 'center',
                        cursor: disabled ? 'default' : 'pointer',
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        borderColor: dragActive ? 'primary.main' : 'divider',
                        bgcolor: dragActive ? 'action.hover' : 'transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': disabled
                            ? {}
                            : {
                                borderColor: 'primary.light',
                                bgcolor: 'action.hover',
                            },
                        borderRadius: 2,
                    }}
                >
                    {uploading ? (
                        <Box>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ mb: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                {t('admin:blog.coverImageUploader.uploading', { progress })}
                            </Typography>
                        </Box>
                    ) : (
                        <Stack alignItems="center" spacing={1}>
                            <CloudUploadIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                            <Typography variant="body2" color="text.secondary">
                                {t('admin:blog.coverImageUploader.dropZone')}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                                {t('admin:blog.coverImageUploader.acceptedFormats', {
                                    maxSize: BLOG_LIMITS.MAX_COVER_IMAGE_SIZE_MB,
                                })}
                            </Typography>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ImageIcon />}
                                disabled={disabled}
                                sx={{ mt: 0.5 }}
                            >
                                {t('admin:blog.coverImageUploader.browse')}
                            </Button>
                        </Stack>
                    )}
                </Paper>
            )}
        </Box>
    );
};

CoverImageUploader.propTypes = {
    postId: PropTypes.string,
    lang: PropTypes.string.isRequired,
    currentUrl: PropTypes.string,
    currentAlt: PropTypes.string,
    onImageChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};

export default CoverImageUploader;
