/**
 * src/utils/seoMeta.js
 * 
 * Purpose: Shared SEO metadata helpers for building canonical URLs, social tags, and structured data.
 * Provides consistent OG/Twitter images and schema objects across routes.
 * 
 * Changelog:
 * v1.1.0 - 2025-12-22 - Added robots/theme-color defaults, exported normalizer, and refreshed SoftwareApplication schema.
 * v1.0.0 - 2025-12-17 - Initial helpers for route-level Helmet metadata and JSON-LD.
 */

const SITE_URL = 'https://time2.trade';
const DEFAULT_OG_IMAGE = `${SITE_URL}/Time2Trade_SEO_Meta_5.PNG`;
const DEFAULT_TWITTER_SITE = '@time2_trade';
const DEFAULT_THEME_COLOR = '#018786';

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
  robots = 'index,follow',
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

export const buildSoftwareApplicationSchema = ({ description }) => ({
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Time 2 Trade',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free account available to unlock the economic events workspace.',
  },
  description,
  url: `${SITE_URL}/`,
  creator: {
    '@type': 'Organization',
    name: 'Lofi Trades',
    url: `${SITE_URL}/`,
  },
  featureList: [
    'Dual-circle session clock with overlaps and active session detection',
    'Timezone-aware countdowns anchored to New York time by default',
    'Economic events timeline and table views with impact/currency filters',
    'Favorites and personal notes for authenticated users',
    'Exports (CSV and JSON) from the events workspace',
    'Customizable trading sessions and colors (up to eight)',
    'Chrome install prompt for fast launch',
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
