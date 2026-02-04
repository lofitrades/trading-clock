/**
 * src/components/SEO.jsx
 * 
 * Purpose: Reusable SEO component powered by react-helmet-async.
 * Centralizes canonical, social, robots, hreflang, and structured data tags for SPA routes.
 * 
 * Changelog:
 * v1.2.0 - 2026-02-04 - BEP SEO CRITICAL: Updated canonical URL generation to use subpath structure (/es/, /fr/) instead of query params. Aligns with Firebase hosting rewrites and prerender output.
 * v1.1.0 - 2026-01-27 - BEP SEO: Added multi-language hreflang support, dynamic og:locale based on current language, and language-aware canonical URLs for proper international SEO crawlability.
 * v1.0.0 - 2025-12-22 - Initial implementation for route-level Helmet metadata.
 */

import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
    DEFAULT_OG_IMAGE,
    DEFAULT_THEME_COLOR,
    DEFAULT_TWITTER_SITE,
    SITE_URL,
    SUPPORTED_LANGUAGES,
    normalizePath,
    getOgLocale,
    buildHreflangUrls,
} from '../utils/seoMeta';

const getCanonicalUrl = ({ canonical, path, lang }) => {
    if (canonical) return canonical;
    const normalizedPath = normalizePath(path || '/');
    // For default language (en), use clean URL; for others, use subpath prefix
    const langPrefix = lang && lang !== 'en' ? `/${lang}` : '';
    return `${SITE_URL}${langPrefix}${normalizedPath}`;
};

const SEO = ({
    title,
    description,
    path = '/',
    canonical,
    keywords,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = 'website',
    robots = 'index,follow',
    twitterCard = 'summary_large_image',
    twitterSite = DEFAULT_TWITTER_SITE,
    themeColor = DEFAULT_THEME_COLOR,
    structuredData = [],
    lang: langOverride,
}) => {
    const { i18n } = useTranslation();
    const currentLang = langOverride || i18n.language || 'en';

    const canonicalUrl = getCanonicalUrl({ canonical, path, lang: currentLang });
    const ogLocale = getOgLocale(currentLang);
    const hreflangUrls = buildHreflangUrls(path);

    const schemas = Array.isArray(structuredData)
        ? structuredData.filter(Boolean)
        : structuredData
            ? [structuredData]
            : [];

    return (
        <Helmet prioritizeSeoTags>
            {/* Update html lang attribute dynamically */}
            <html lang={currentLang} />

            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={canonicalUrl} />
            {robots && <meta name="robots" content={robots} />}
            {themeColor && <meta name="theme-color" content={themeColor} />}

            {/* BEP SEO: hreflang tags for multi-language discoverability */}
            <link rel="alternate" href={hreflangUrls['x-default']} hreflang="x-default" />
            {SUPPORTED_LANGUAGES.map((lng) => (
                <link key={lng} rel="alternate" href={hreflangUrls[lng]} hreflang={lng} />
            ))}

            {/* Open Graph with dynamic locale */}
            <meta property="og:type" content={ogType} />
            <meta property="og:site_name" content="Time 2 Trade" />
            <meta property="og:locale" content={ogLocale} />
            {/* Alternate locales for social platforms */}
            {SUPPORTED_LANGUAGES.filter(lng => lng !== currentLang).map(lng => (
                <meta key={lng} property="og:locale:alternate" content={getOgLocale(lng)} />
            ))}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={ogImage} />

            <meta name="twitter:card" content={twitterCard} />
            <meta name="twitter:site" content={twitterSite} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {schemas.map((schema, index) => (
                <script key={`ld-${index}`} type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            ))}
        </Helmet>
    );
};

SEO.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    path: PropTypes.string,
    canonical: PropTypes.string,
    keywords: PropTypes.string,
    ogImage: PropTypes.string,
    ogType: PropTypes.string,
    robots: PropTypes.string,
    twitterCard: PropTypes.string,
    twitterSite: PropTypes.string,
    themeColor: PropTypes.string,
    structuredData: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.object),
        PropTypes.object,
    ]),
    lang: PropTypes.string,
};

export default SEO;
