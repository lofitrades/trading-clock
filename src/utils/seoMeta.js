/**
 * src/utils/seoMeta.js
 *
 * Purpose: Shared SEO metadata helpers for building canonical URLs, social tags, hreflang, and structured data.
 * Provides consistent OG/Twitter images, language-aware metadata, and schema objects across routes.
 *
 * Changelog:
 * v1.3.0 - 2026-01-27 - BEP SEO: Added multi-language support with SUPPORTED_LANGUAGES, getOgLocale(), buildHreflangUrls(), and language-aware schema builders. Enables proper international SEO crawlability for EN/ES/FR.
 * v1.2.0 - 2026-01-22 - SEO refresh aligned with index.html: stronger robots defaults, theme-color alignment, and updated featureList (custom events, notifications, Forex Factory-powered calendar). Removed overlaps/PWA/exports from "main features".
 * v1.1.0 - 2025-12-22 - Added robots/theme-color defaults, exported normalizer, and refreshed SoftwareApplication schema.
 * v1.0.0 - 2025-12-17 - Initial helpers for route-level Helmet metadata and JSON-LD.
 */

const SITE_URL = 'https://time2.trade';
const DEFAULT_OG_IMAGE = `${SITE_URL}/Time2Trade_SEO_Meta_5.PNG`;
const DEFAULT_TWITTER_SITE = '@time2_trade';

// Keep consistent with index.html for browser chrome + PWA theme
const DEFAULT_THEME_COLOR = '#0f6fec';

// Strong default indexing + rich preview permissions (matches index.html intent)
const DEFAULT_ROBOTS =
  'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

// BEP SEO: Supported languages for i18n (must match public/locales/ structure)
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr'];
const DEFAULT_LANGUAGE = 'en';

// Map language codes to OG locale format
const OG_LOCALE_MAP = {
  en: 'en_US',
  es: 'es_ES',
  fr: 'fr_FR',
};

/**
 * Get Open Graph locale for a language code
 * @param {string} lang - Language code (en, es, fr)
 * @returns {string} OG locale (e.g., en_US, es_ES, fr_FR)
 */
export const getOgLocale = (lang = DEFAULT_LANGUAGE) => {
  return OG_LOCALE_MAP[lang] || OG_LOCALE_MAP[DEFAULT_LANGUAGE];
};

/**
 * Build hreflang URLs for a given path
 * BEP SEO: Generates proper hreflang URLs for all supported languages
 * Uses ?lang=xx format for non-default languages (simpler than subpaths for SPA)
 * @param {string} path - Route path (e.g., '/', '/clock', '/calendar')
 * @returns {Object} Map of language codes to URLs, including x-default
 */
export const buildHreflangUrls = (path = '/') => {
  const normalizedPath = normalizePath(path);
  const baseUrl = `${SITE_URL}${normalizedPath}`;
  
  const urls = {
    'x-default': baseUrl, // Default to English for unknown languages
  };
  
  SUPPORTED_LANGUAGES.forEach((lang) => {
    if (lang === DEFAULT_LANGUAGE) {
      urls[lang] = baseUrl;
    } else {
      // Use query param for non-default languages
      const separator = normalizedPath.includes('?') ? '&' : '?';
      urls[lang] = `${baseUrl}${separator}lang=${lang}`;
    }
  });
  
  return urls;
};

export const normalizePath = (path = '/') => {
  if (!path) return '/';
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : `/${path}`;
};

export const buildSeoMeta = ({
  title,
  description,
  path = '/',
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  keywords,
  robots = DEFAULT_ROBOTS,
  themeColor = DEFAULT_THEME_COLOR,
  lang = DEFAULT_LANGUAGE,
}) => {
  const normalizedPath = normalizePath(path);
  const langSuffix = lang && lang !== 'en' ? `?lang=${lang}` : '';
  const url = canonical || `${SITE_URL}${normalizedPath}${langSuffix}`;

  return {
    title,
    description,
    canonical: url,
    keywords,
    robots,
    // Some routes/Helmet setups also support googlebot as a separate meta tag.
    googlebot: robots,
    themeColor,
    ogType: 'website',
    ogImage,
    ogUrl: url,
    ogLocale: getOgLocale(lang),
    ogSiteName: 'Time 2 Trade',
    twitterCard: 'summary_large_image',
    twitterSite: DEFAULT_TWITTER_SITE,
    // BEP SEO: Include hreflang URLs for multi-language discoverability
    hreflangUrls: buildHreflangUrls(path),
  };
};

/**
 * JSON-LD: WebApplication schema (preferred for a web-first app)
 * Keep it light and consistent across routes; page-level schemas can extend this if needed.
 * @param {Object} options - Schema options
 * @param {string} options.description - App description
 * @param {string} [options.lang='en'] - Language code for inLanguage field
 */
export const buildSoftwareApplicationSchema = ({ description, lang = DEFAULT_LANGUAGE }) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Time 2 Trade',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  isAccessibleForFree: true,
  url: `${SITE_URL}/`,
  image: DEFAULT_OG_IMAGE,
  description,
  inLanguage: lang,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description:
      'Free to use. Optional sign-in unlocks personalization (e.g., notes/favorites, notifications, custom events sync).',
  },
  creator: {
    '@type': 'Organization',
    name: 'Lofi Trades',
    url: `${SITE_URL}/`,
  },
  featureList: [
    'Session clock with New York time-first session awareness and countdowns',
    'Forex Factory-powered economic calendar for scheduled releases',
    'Fast filters for impact, currency, and search',
    'Custom events for personal timing windows and reminders',
    'Notifications for upcoming events (where supported)',
    'Favorites and personal notes for authenticated users',
    'Designed for intraday awareness and event-avoidance (not trading signals)',
  ],
  screenshot: DEFAULT_OG_IMAGE,
});

export const buildWebPageBreadcrumbs = (crumbs) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: crumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: crumb.url,
  })),
});

export const buildFaqSchema = (entries = []) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: entries.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
});

export {
  SITE_URL,
  DEFAULT_OG_IMAGE,
  DEFAULT_THEME_COLOR,
  DEFAULT_TWITTER_SITE,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
};
