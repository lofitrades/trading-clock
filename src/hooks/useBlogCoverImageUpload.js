/**
 * src/hooks/useBlogCoverImageUpload.js
 *
 * Purpose: Custom hook for uploading, replacing, and deleting blog cover images
 * to Firebase Storage. Uses structured path: blog/cover/{postId}/{lang}/{filename}
 * for proper storage rules compliance (CMS roles required).
 *
 * Features:
 * - Upload with progress tracking via uploadBytesResumable
 * - Automatic image compression validation (max 5 MB per storage rules)
 * - Replace existing cover image (deletes old, uploads new)
 * - Delete cover image from storage
 * - Returns public download URL for Firestore coverImage.url field
 *
 * Changelog:
 * v1.0.0 - 2026-02-15 - Initial implementation (BEP blog cover image upload)
 */

import { useState, useCallback } from 'react';
import { storage } from '../firebase';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
} from 'firebase/storage';
import { BLOG_LIMITS } from '../types/blogTypes';

/** Max file size in bytes (5 MB — matches storage.rules isValidSize) */
const MAX_FILE_SIZE_BYTES = (BLOG_LIMITS.MAX_COVER_IMAGE_SIZE_MB || 5) * 1024 * 1024;

/** Accepted MIME types (matches storage.rules isImage) */
const ACCEPTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
];

/**
 * Build the storage path for a blog cover image.
 * Structure: blog/cover/{postId}/{lang}/{filename}
 * @param {string} postId - Firestore blog post document ID
 * @param {string} lang - Language code (en, es, fr)
 * @param {string} filename - Sanitized filename with timestamp
 * @returns {string} Firebase Storage path
 */
const buildStoragePath = (postId, lang, filename) =>
    `blog/cover/${postId}/${lang}/${filename}`;

/**
 * Sanitize a filename for safe Firebase Storage usage.
 * @param {string} name - Original filename
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (name) => {
    const timestamp = Date.now();
    const cleaned = name.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${timestamp}_${cleaned}`;
};

/**
 * Custom hook for blog cover image upload, replace, and delete.
 *
 * @returns {Object} Hook state and methods
 */
const useBlogCoverImageUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    /**
     * Validate an image file before upload.
     * @param {File} file - The file to validate
     * @returns {{ valid: boolean, error: string }} Validation result
     */
    const validateFile = useCallback((file) => {
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            return {
                valid: false,
                error: `Invalid file type "${file.type}". Accepted: JPEG, PNG, WebP, GIF, SVG.`,
            };
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
            return {
                valid: false,
                error: `File too large (${sizeMB} MB). Maximum: ${BLOG_LIMITS.MAX_COVER_IMAGE_SIZE_MB} MB.`,
            };
        }
        return { valid: true, error: '' };
    }, []);

    /**
     * Delete all existing cover images for a given postId + lang folder.
     * Cleans up old images before replacing.
     * @param {string} postId - Blog post ID
     * @param {string} lang - Language code
     */
    const deleteExistingImages = useCallback(async (postId, lang) => {
        try {
            const folderRef = ref(storage, `blog/cover/${postId}/${lang}`);
            const listResult = await listAll(folderRef);
            const deletePromises = listResult.items.map((itemRef) => deleteObject(itemRef));
            await Promise.all(deletePromises);
        } catch (err) {
            // Folder may not exist yet — that's fine
            if (err.code !== 'storage/object-not-found') {
                console.error('Error cleaning up existing cover images:', err);
            }
        }
    }, []);

    /**
     * Upload a cover image to Firebase Storage.
     * Replaces any existing image in the same postId/lang folder.
     *
     * @param {File} file - Image file to upload
     * @param {string} postId - Blog post document ID
     * @param {string} lang - Language code (en, es, fr)
     * @returns {Promise<string>} Public download URL
     * @throws {Error} If validation or upload fails
     */
    const uploadCoverImage = useCallback(async (file, postId, lang) => {
        // Validate inputs
        if (!postId) throw new Error('Post must be saved before uploading a cover image.');
        if (!lang) throw new Error('Language code is required.');

        const validation = validateFile(file);
        if (!validation.valid) {
            setError(validation.error);
            throw new Error(validation.error);
        }

        setUploading(true);
        setProgress(0);
        setError('');

        try {
            // Clean up existing images in this lang folder
            await deleteExistingImages(postId, lang);

            // Upload new image
            const filename = sanitizeFilename(file.name);
            const storagePath = buildStoragePath(postId, lang, filename);
            const storageRef = ref(storage, storagePath);

            // Use resumable upload for progress tracking
            const uploadTask = uploadBytesResumable(storageRef, file, {
                contentType: file.type,
                customMetadata: {
                    postId,
                    lang,
                    originalName: file.name,
                },
            });

            // Return a promise that resolves with the download URL
            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const pct = Math.round(
                            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                        );
                        setProgress(pct);
                    },
                    (uploadError) => {
                        setError(uploadError.message);
                        setUploading(false);
                        reject(uploadError);
                    },
                    async () => {
                        try {
                            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                            setUploading(false);
                            setProgress(100);
                            resolve(downloadUrl);
                        } catch (urlError) {
                            setError(urlError.message);
                            setUploading(false);
                            reject(urlError);
                        }
                    }
                );
            });
        } catch (err) {
            setError(err.message);
            setUploading(false);
            throw err;
        }
    }, [validateFile, deleteExistingImages]);

    /**
     * Delete the cover image for a specific postId/lang.
     * Removes all files in the folder.
     *
     * @param {string} postId - Blog post document ID
     * @param {string} lang - Language code
     */
    const deleteCoverImage = useCallback(async (postId, lang) => {
        if (!postId || !lang) return;

        setUploading(true);
        setError('');

        try {
            await deleteExistingImages(postId, lang);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setUploading(false);
        }
    }, [deleteExistingImages]);

    /**
     * Clear any error state.
     */
    const clearError = useCallback(() => {
        setError('');
    }, []);

    return {
        uploading,
        progress,
        error,
        uploadCoverImage,
        deleteCoverImage,
        validateFile,
        clearError,
    };
};

export default useBlogCoverImageUpload;
