/**
 * src/components/SEO.jsx
 * 
 * Purpose: Reusable SEO component powered by react-helmet-async.
 * Centralizes canonical, social, robots, and structured data tags for SPA routes.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-22 - Initial implementation for route-level Helmet metadata.
 */

import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';
import { DEFAULT_OG_IMAGE, DEFAULT_THEME_COLOR, DEFAULT_TWITTER_SITE, SITE_URL, normalizePath } from '../utils/seoMeta';

const getCanonicalUrl = ({ canonical, path }) => {
    if (canonical) return canonical;
    const normalizedPath = normalizePath(path || '/');
    return `${SITE_URL}${normalizedPath}`;
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
}) => {
    const canonicalUrl = getCanonicalUrl({ canonical, path });
    const schemas = Array.isArray(structuredData)
        ? structuredData.filter(Boolean)
        : structuredData
            ? [structuredData]
            : [];

    return (
        <Helmet prioritizeSeoTags>
            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={canonicalUrl} />
            {robots && <meta name="robots" content={robots} />}
            {themeColor && <meta name="theme-color" content={themeColor} />}

            <meta property="og:type" content={ogType} />
            <meta property="og:site_name" content="Time 2 Trade" />
            <meta property="og:locale" content="en_US" />
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
};

export default SEO;
