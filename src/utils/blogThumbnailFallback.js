/**
 * src/utils/blogThumbnailFallback.js
 *
 * Purpose: Determine a consistent default blog thumbnail for posts without cover images.
 * Uses post ID to deterministically select from 3 default thumbnail options.
 * Returns ABSOLUTE URLs for OG meta tags (social sharing requires absolute URLs).
 *
 * Changelog:
 * v1.1.0 - 2026-02-05 - BEP: Return absolute URLs with SITE_URL prefix for OG meta tags (WhatsApp, Facebook, Twitter require absolute URLs)
 * v1.0.0 - 2026-02-05 - Initial implementation (BEP)
 */

import { SITE_URL } from './seoMeta';

const DEFAULT_THUMBNAILS = [
    '/blog/Blog_Default_Thumbnail_1.png',
    '/blog/Blog_Default_Thumbnail_2.png',
    '/blog/Blog_Default_Thumbnail_3.png',
];

/**
 * Get a consistent default thumbnail URL for a post (ABSOLUTE URL)
 * Uses post ID to deterministically select from 3 options
 * @param {string} postId - Post document ID
 * @param {boolean} [relative=false] - Return relative URL (for img src) vs absolute (for OG meta)
 * @returns {string} Default thumbnail URL (absolute by default for social sharing)
 */
export const getDefaultBlogThumbnail = (postId, relative = false) => {
    if (!postId) {
        return relative ? DEFAULT_THUMBNAILS[0] : `${SITE_URL}${DEFAULT_THUMBNAILS[0]}`;
    }
    
    // Simple hash: sum of character codes mod 3
    // Ensures same post ID always gets same thumbnail
    const hash = postId
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const index = hash % DEFAULT_THUMBNAILS.length;
    return relative ? DEFAULT_THUMBNAILS[index] : `${SITE_URL}${DEFAULT_THUMBNAILS[index]}`;
};

export default getDefaultBlogThumbnail;
