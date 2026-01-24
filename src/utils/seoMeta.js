/**
 * src/utils/seoMeta.js
 *
 * Purpose: Shared SEO metadata helpers for building canonical URLs, social tags, and structured data.
 * Provides consistent OG/Twitter images and schema objects across routes.
 *
 * Changelog:
 * v1.2.0 - 2026-01-22 - SEO refresh aligned with index.html: stronger robots defaults, theme-color alignment, and updated featureList (custom events, notifications, Forex Factory-powered calendar). Removed overlaps/PWA/exports from “main features”.
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
}) => {
  const normalizedPath = normalizePath(path);
  const url = canonical || `${SITE_URL}${normalizedPath}`;

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
    ogLocale: 'en_US',
    ogSiteName: 'Time 2 Trade',
    twitterCard: 'summary_large_image',
    twitterSite: DEFAULT_TWITTER_SITE,
  };
};

/**
 * JSON-LD: WebApplication schema (preferred for a web-first app)
 * Keep it light and consistent across routes; page-level schemas can extend this if needed.
 */
export const buildSoftwareApplicationSchema = ({ description }) => ({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Time 2 Trade',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  isAccessibleForFree: true,
  url: `${SITE_URL}/`,
  image: DEFAULT_OG_IMAGE,
  description,
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

export { SITE_URL, DEFAULT_OG_IMAGE, DEFAULT_THEME_COLOR, DEFAULT_TWITTER_SITE };
