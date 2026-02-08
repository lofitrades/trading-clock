/**
 * src/types/blogTypes.js
 * 
 * Purpose: Type definitions and constants for blog posts and related entities.
 * Provides centralized schema definition for blog CMS.
 * 
 * Changelog:
 * v2.1.0 - 2026-02-06 - Phase 6: Added searchTokens to LanguageContent for full-text search indexing
 * v2.0.0 - 2026-02-04 - Phase 5.B: Added event/currency taxonomy, author profiles, and enhanced related posts support
 * v1.0.0 - 2026-02-04 - Initial implementation (Phase 1 Blog)
 */

/**
 * BLOG POST STATUS
 * Lifecycle states for blog posts
 */
export const BLOG_POST_STATUS = {
  DRAFT: 'draft',           // Not yet published, only visible to CMS users
  PUBLISHED: 'published',   // Live and publicly accessible
  UNPUBLISHED: 'unpublished', // Was published, now hidden from public
};

/**
 * BLOG CATEGORIES
 * Primary categorization for blog posts (extendable)
 */
export const BLOG_CATEGORIES = {
  TRADING_TIPS: 'trading-tips',
  MARKET_ANALYSIS: 'market-analysis',
  PLATFORM_UPDATES: 'platform-updates',
  EDUCATION: 'education',
  NEWS: 'news',
};

/**
 * BLOG CATEGORY LABELS
 * Human-readable labels for each category (used in UI)
 */
export const BLOG_CATEGORY_LABELS = {
  [BLOG_CATEGORIES.TRADING_TIPS]: 'Trading Tips',
  [BLOG_CATEGORIES.MARKET_ANALYSIS]: 'Market Analysis',
  [BLOG_CATEGORIES.PLATFORM_UPDATES]: 'Platform Updates',
  [BLOG_CATEGORIES.EDUCATION]: 'Education',
  [BLOG_CATEGORIES.NEWS]: 'News',
};

/**
 * BLOG CURRENCIES
 * Canonical currency codes for blog taxonomy (ISO-like)
 */
export const BLOG_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF',
  'CNY', 'HKD', 'SGD', 'INR', 'MXN', 'BRL', 'ZAR', 'SEK', 'NOK',
];

/**
 * BLOG CURRENCY LABELS
 * Human-readable labels for currencies
 */
export const BLOG_CURRENCY_LABELS = {
  USD: 'US Dollar (USD)',
  EUR: 'Euro (EUR)',
  GBP: 'British Pound (GBP)',
  JPY: 'Japanese Yen (JPY)',
  AUD: 'Australian Dollar (AUD)',
  NZD: 'New Zealand Dollar (NZD)',
  CAD: 'Canadian Dollar (CAD)',
  CHF: 'Swiss Franc (CHF)',
  CNY: 'Chinese Yuan (CNY)',
  HKD: 'Hong Kong Dollar (HKD)',
  SGD: 'Singapore Dollar (SGD)',
  INR: 'Indian Rupee (INR)',
  MXN: 'Mexican Peso (MXN)',
  BRL: 'Brazilian Real (BRL)',
  ZAR: 'South African Rand (ZAR)',
  SEK: 'Swedish Krona (SEK)',
  NOK: 'Norwegian Krone (NOK)',
};

/**
 * BLOG ECONOMIC EVENTS
 * Canonical event names for blog taxonomy
 * Keys are URL-safe slugs, values are display labels
 */
export const BLOG_ECONOMIC_EVENTS = {
  // High Impact
  'nfp': 'Non-Farm Payrolls (NFP)',
  'cpi': 'Consumer Price Index (CPI)',
  'fomc': 'FOMC Meeting / Fed Decision',
  'gdp': 'Gross Domestic Product (GDP)',
  'ppi': 'Producer Price Index (PPI)',
  'retail-sales': 'Retail Sales',
  'interest-rate-decision': 'Interest Rate Decision',
  'unemployment-rate': 'Unemployment Rate',
  'pce': 'PCE Price Index',
  'ism-manufacturing': 'ISM Manufacturing PMI',
  'ism-services': 'ISM Services PMI',
  // Medium Impact
  'jolts': 'JOLTS Job Openings',
  'initial-jobless-claims': 'Initial Jobless Claims',
  'durable-goods': 'Durable Goods Orders',
  'trade-balance': 'Trade Balance',
  'housing-starts': 'Housing Starts',
  'building-permits': 'Building Permits',
  'consumer-confidence': 'Consumer Confidence',
  'michigan-sentiment': 'Michigan Consumer Sentiment',
  'new-home-sales': 'New Home Sales',
  'existing-home-sales': 'Existing Home Sales',
  'industrial-production': 'Industrial Production',
  // Central Bank Speeches
  'fed-chair-speech': 'Fed Chair Speech',
  'ecb-president-speech': 'ECB President Speech',
  'boe-governor-speech': 'BoE Governor Speech',
  // Other
  'general': 'General Economic News',
};

/**
 * Generate a URL-safe event key from display name
 * @param {string} eventName - Event display name
 * @returns {string} URL-safe key
 */
export const getEventKeyFromName = (eventName) => {
  if (!eventName) return 'general';
  // Check if it's already a key
  if (BLOG_ECONOMIC_EVENTS[eventName]) return eventName;
  // Find matching key
  const matchingKey = Object.entries(BLOG_ECONOMIC_EVENTS).find(
    ([, label]) => label.toLowerCase() === eventName.toLowerCase()
  );
  return matchingKey ? matchingKey[0] : 'general';
};

/**
 * SUPPORTED BLOG LANGUAGES
 * Languages available for blog content (matches i18n config)
 */
export const BLOG_LANGUAGES = ['en', 'es', 'fr'];
export const DEFAULT_BLOG_LANGUAGE = 'en';

/**
 * ALLOWED EMBED DOMAINS
 * Whitelisted domains for iframe embeds in blog content (BEP security)
 */
export const ALLOWED_EMBED_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'vimeo.com',
  'player.vimeo.com',
];

/**
 * Author Profile Schema (Firestore document structure)
 * Collection: blogAuthors/{authorId}
 * 
 * @typedef {Object} BlogAuthor
 * @property {string} id - Author ID (auto-generated or slug-based)
 * @property {string} slug - URL-safe slug for author pages
 * @property {string} displayName - Public display name
 * @property {string} [bio] - Short biography (optional)
 * @property {Object} [avatar] - Avatar image info
 * @property {string} [avatar.url] - Avatar URL
 * @property {string} [avatar.alt] - Avatar alt text
 * @property {string} [linkedUserId] - Optional link to users collection (for CMS authors)
 * @property {Object} social - Social links (optional)
 * @property {string} [social.twitter] - Twitter/X handle
 * @property {string} [social.linkedin] - LinkedIn profile URL
 * @property {Timestamp} createdAt - When created
 * @property {Timestamp} updatedAt - Last modification
 */

/**
 * Default author profile
 */
export const DEFAULT_BLOG_AUTHOR = {
  slug: '',
  displayName: '',
  bio: '',
  avatar: {
    url: '',
    alt: '',
  },
  social: {
    twitter: '',
    linkedin: '',
  },
};

/**
 * Blog Post Schema (Firestore document structure)
 * Collection: blogPosts/{postId}
 * 
 * @typedef {Object} BlogPost
 * @property {string} id - Auto-generated document ID
 * @property {string} status - draft | published | unpublished
 * @property {Timestamp|null} publishedAt - When first published (null if never)
 * @property {Timestamp} createdAt - When created
 * @property {Timestamp} updatedAt - Last modification
 * @property {Object} author - Legacy author info (for backwards compat)
 * @property {string} author.uid - Author's user ID
 * @property {string} author.displayName - Author's display name
 * @property {string[]} authorIds - Array of blog author IDs (Phase 5.B)
 * @property {string} category - Primary category
 * @property {string[]} tags - Tags for filtering/search
 * @property {string[]} keywords - SEO keywords (optional)
 * @property {string[]} relatedPostIds - Manual related post selections
 * @property {string[]} eventTags - Economic event taxonomy tags (Phase 5.B)
 * @property {string[]} currencyTags - Currency taxonomy tags (Phase 5.B)
 * @property {number} [readingTimeMinutes] - Computed reading time
 * @property {Object} languages - Map keyed by language code
 */

/**
 * Blog Post Language Content Schema
 * Nested under blogPosts/{postId}.languages.{lang}
 * 
 * @typedef {Object} BlogPostLanguage
 * @property {string} title - Post title
 * @property {string} slug - URL-safe slug (unique per language)
 * @property {string} excerpt - Short description for list view
 * @property {string} contentHtml - Sanitized HTML content
 * @property {string} seoTitle - SEO meta title (fallback to title)
 * @property {string} seoDescription - SEO meta description (fallback to excerpt)
 * @property {Object} coverImage - Cover image info
 * @property {string} coverImage.url - Public URL to image
 * @property {string} coverImage.alt - Alt text for accessibility
 * @property {number} readingTimeMin - Estimated reading time in minutes
 * @property {string[]} [searchTokens] - Pre-computed lowercase tokens for full-text search (Phase 6)
 *   Computed from: title + excerpt + tags + category + keywords
 *   Used for Firestore array-contains queries (deterministic, low-cost full-text search)
 */

/**
 * Default values for new blog post
 */
export const DEFAULT_BLOG_POST = {
  status: BLOG_POST_STATUS.DRAFT,
  publishedAt: null,
  category: BLOG_CATEGORIES.TRADING_TIPS,
  tags: [],
  keywords: [],
  relatedPostIds: [],
  authorIds: [], // Phase 5.B: Multiple authors
  eventTags: [], // Phase 5.B: Economic event taxonomy
  currencyTags: [], // Phase 5.B: Currency taxonomy
  languages: {},
};

/**
 * Default values for new language content
 */
export const DEFAULT_LANGUAGE_CONTENT = {
  title: '',
  slug: '',
  excerpt: '',
  contentHtml: '',
  seoTitle: '',
  seoDescription: '',
  coverImage: {
    url: '',
    alt: '',
  },
  readingTimeMin: 0,
  searchTokens: [], // Phase 6: Computed at publish time
};

/**
 * Roles allowed to manage blog posts
 */
export const BLOG_CMS_ROLES = ['superadmin', 'admin', 'author'];

/**
 * Maximum values for blog content
 */
export const BLOG_LIMITS = {
  MAX_TITLE_LENGTH: 200,
  MAX_EXCERPT_LENGTH: 500,
  MAX_SEO_TITLE_LENGTH: 70,
  MAX_SEO_DESCRIPTION_LENGTH: 160,
  MAX_TAGS: 10,
  MAX_KEYWORDS: 15,
  MAX_RELATED_POSTS: 6,
  MAX_COVER_IMAGE_SIZE_MB: 5,
  MAX_EVENT_TAGS: 5,
  MAX_CURRENCY_TAGS: 5,
  MAX_AUTHORS: 3,
};

/**
 * Related posts scoring weights (Phase 5.B)
 * Used for deterministic related-post fallback engine
 */
export const RELATED_POST_WEIGHTS = {
  CATEGORY_MATCH: 3,     // Same category
  EVENT_OVERLAP: 2,      // Each matching event tag
  CURRENCY_OVERLAP: 2,   // Each matching currency tag
  TAG_OVERLAP: 1,        // Each matching editorial tag
  KEYWORD_OVERLAP: 0.5,  // Each matching keyword
  RECENCY_BONUS: 0.1,    // Per day within 30 days (max 3 points)
};

/**
 * Generate a URL-safe slug from a title
 * @param {string} title - The title to slugify
 * @returns {string} URL-safe slug
 */
export const generateSlug = (title) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '')  // Remove leading/trailing hyphens
    .substring(0, 100);       // Limit length
};

/**
 * Estimate reading time based on content
 * @param {string} htmlContent - HTML content string
 * @returns {number} Estimated reading time in minutes
 */
export const estimateReadingTime = (htmlContent) => {
  if (!htmlContent) return 0;
  // Strip HTML tags and count words
  const text = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = text.split(' ').filter(Boolean).length;
  // Average reading speed: 200-250 words per minute
  return Math.max(1, Math.ceil(wordCount / 225));
};
