/**
 * src/utils/seoMeta.js
 * 
 * Purpose: Shared SEO metadata helpers for building canonical URLs, social tags, and structured data.
 * Provides consistent OG/Twitter images and schema objects across routes.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-17 - Initial helpers for route-level Helmet metadata and JSON-LD.
 */

const SITE_URL = 'https://time2.trade';
const DEFAULT_OG_IMAGE = `${SITE_URL}/Time2Trade_SEO_Meta_2.PNG`;

const normalizePath = (path = '/') => {
  if (!path) return '/';
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : `/${path}`;
};

export const buildSeoMeta = ({ title, description, path = '/', canonical, ogImage = DEFAULT_OG_IMAGE, keywords }) => {
  const normalizedPath = normalizePath(path);
  const url = canonical || `${SITE_URL}${normalizedPath}`;

  return {
    title,
    description,
    canonical: url,
    keywords,
    ogType: 'website',
    ogImage,
    ogUrl: url,
    twitterCard: 'summary_large_image',
    twitterSite: '@time2_trade',
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
  },
  description,
  url: `${SITE_URL}/`,
  creator: {
    '@type': 'Organization',
    name: 'Lofi Trades',
    url: `${SITE_URL}/`,
  },
  featureList: [
    'Dual-circle session visualization',
    'Live economic events overlay',
    'Timezone intelligence',
    'Cloud sync settings',
    'Customizable trading sessions',
    'Session alerts',
    'Digital clock display',
    'Responsive design',
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

export { SITE_URL, DEFAULT_OG_IMAGE };
