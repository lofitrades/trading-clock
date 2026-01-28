/**
 * scripts/prerender.mjs
 * 
 * Purpose: Manual HTML generation for SEO pages with full multi-language support. 
 * Creates static HTML with proper localized meta tags that crawlers can read immediately.
 * Generates language variants (/es/, /fr/) for enhanced international crawlability (BEP).
 * 
 * Changelog:
 * v1.2.0 - 2026-01-27 - BEP ENHANCED: Full multi-language prerendering. Generates 21 static HTML files (7 pages × 3 languages). Loads i18n translations during build, injects localized titles/descriptions, updates canonical URLs and hreflang tags per language variant. Firebase rewrites handle /es/* and /fr/* subpaths. Enables non-JS crawlers to see localized content immediately.
 * v1.1.5 - 2026-01-27 - Added /contact route prerendering for SEO discoverability.
 * v1.1.4 - 2026-01-09 - Fixed </head> insertion regex so postbuild prerender runs.
 * v1.1.3 - 2026-01-07 - Inject OG/Twitter/screenshot images from DEFAULT_OG_IMAGE or VITE_OG_IMAGE_URL for one-touch updates.
 * v1.1.2 - 2025-12-22 - Synced /about prerender metadata with refreshed About copy.
 * v1.1.1 - 2025-12-22 - Updated landing/about prerender metadata to match refreshed positioning.
 * v1.1.0 - 2025-12-18 - Switched to manual HTML generation for reliability.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_OG_IMAGE, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../src/utils/seoMeta.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

/**
 * BEP SEO: English (EN) page metadata
 * Fallback for missing translations and primary language
 */
const pages = {
  '/': {
    title: 'Time 2 Trade | Free Trading Clock + Economic Calendar',
    description: 'Free economic calendar for forex and futures traders. Live session clock with today\'s events, impact/currency filters, favorites, notes, exports. Trusted Forex Factory source.',
    path: 'index.html',
  },
  '/clock': {
    title: 'Trading Clock | Live Market Sessions for Forex & Futures',
    description: 'Free live trading clock for day traders. Real-time market sessions (NY, London, Asia), overlaps, countdowns, economic events, and timezone-aware insights.',
    path: 'clock/index.html',
  },
  '/calendar': {
    title: 'Free Economic Calendar | Forex Factory + Session Clock',
    description: 'Free economic calendar for forex and futures traders. Forex Factory data with session clock context, impact/currency filters, favorites, notes, and exports.',
    path: 'calendar/index.html',
  },
  '/about': {
    title: 'About Time 2 Trade | Trading Clock for Futures & Forex',
    description: 'Time 2 Trade: a lightweight trading clock + economic calendar for futures and forex day traders. Visualize sessions, overlaps, and events with timezone-aware countdowns.',
    path: 'about/index.html',
  },
  '/privacy': {
    title: 'Privacy Policy | Time 2 Trade',
    description: 'How Time 2 Trade collects, uses, and protects your data. Learn about your rights, our legal basis for processing, and controls for consent, deletion, and ad personalization.',
    path: 'privacy/index.html',
  },
  '/terms': {
    title: 'Terms & Conditions | Time 2 Trade',
    description: 'Time 2 Trade Terms & Conditions, including acceptable use, disclaimers, and ad disclosures. Free trading intelligence platform for futures and forex day traders.',
    path: 'terms/index.html',
  },
  '/contact': {
    title: 'Contact | Time 2 Trade',
    description: 'Contact Time 2 Trade. Send a message for support, feedback, or questions. Prefer DM? Reach us on X.',
    path: 'contact/index.html',
  },
};

/**
 * BEP SEO: Language-specific metadata translations
 * Maps routes to translation keys in the i18n namespaces
 */
const pageTranslations = {
  '/': { namespace: 'pages', keys: { title: 'landing.hero.heading', description: 'landing.hero.subheading' } },
  '/clock': { namespace: 'pages', keys: { title: 'clock.hero.heading', description: 'clock.hero.subheading' } },
  '/calendar': { namespace: 'pages', keys: { title: 'calendar.hero.heading', description: 'calendar.hero.subheading' } },
  '/about': { namespace: 'pages', keys: { title: 'about.hero.heading', description: 'about.hero.subheading' } },
  '/privacy': { namespace: 'pages', keys: { title: 'privacy.heading', description: 'privacy.intro' } },
  '/terms': { namespace: 'pages', keys: { title: 'terms.heading', description: 'terms.intro' } },
  '/contact': { namespace: 'pages', keys: { title: 'contact.heading', description: 'contact.intro' } },
};

const getOgImage = () => process.env.VITE_OG_IMAGE_URL || DEFAULT_OG_IMAGE;

/**
 * Load i18n translations for a specific language and namespace during build
 * BEP SEO: Enables server-side translation injection for prerendered HTML
 * @param {string} lang - Language code (en, es, fr)
 * @param {string} namespace - i18n namespace (e.g., 'pages')
 * @returns {Object} Translation object for the namespace
 */
async function loadTranslations(lang, namespace) {
  const localesPath = path.resolve(__dirname, `../public/locales/${lang}/${namespace}.json`);
  try {
    const content = await fs.readFile(localesPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  Failed to load translations for ${lang}/${namespace}: ${error.message}`);
    return {};
  }
}

/**
 * Get nested value from translation object using dot notation
 * @param {Object} obj - Translation object
 * @param {string} dotPath - Dot-notation path (e.g., 'landing.hero.heading')
 * @returns {string} Translation value or empty string if not found
 */
function getNestedValue(obj, dotPath) {
  return dotPath.split('.').reduce((current, key) => current?.[key] || '', obj);
}

/**
 * Get translated metadata for a page in a specific language
 * Falls back to English if translation not available
 * BEP: Graceful fallback ensures all pages have valid metadata
 */
async function getPageMetadata(route, lang) {
  const fallback = pages[route] || {};
  
  // If English, use fallback directly
  if (lang === DEFAULT_LANGUAGE) {
    return fallback;
  }
  
  // For other languages, attempt to load translations
  const translationConfig = pageTranslations[route];
  if (!translationConfig) {
    return fallback;
  }
  
  try {
    const translations = await loadTranslations(lang, translationConfig.namespace);
    const title = getNestedValue(translations, translationConfig.keys.title) || fallback.title;
    const description = getNestedValue(translations, translationConfig.keys.description) || fallback.description;
    
    return {
      title,
      description,
      path: fallback.path,
    };
  } catch (error) {
    console.warn(`⚠️  Could not get translated metadata for ${lang}${route}, using fallback`);
    return fallback;
  }
}

const applyOgImage = (html, ogImage) => {
  const replacements = [
    { pattern: /<meta property="og:image" content=".*?" \/>/i, value: `<meta property="og:image" content="${ogImage}" />` },
    { pattern: /<meta property="og:image:secure_url" content=".*?" \/>/i, value: `<meta property="og:image:secure_url" content="${ogImage}" />` },
    { pattern: /<meta name="twitter:image" content=".*?" \/>/i, value: `<meta name="twitter:image" content="${ogImage}" />` },
    { pattern: /"screenshot":\s*".*?"/i, value: `"screenshot": "${ogImage}"` },
  ];

  return replacements.reduce((acc, { pattern, value }) => acc.replace(pattern, value), html);
};

const replaceMeta = (html, matcher, replacement) => {
  const re = matcher instanceof RegExp ? matcher : new RegExp(matcher, 'i');
  return re.test(html) ? html.replace(re, replacement) : html;
};

const upsertMetaTag = (html, { key, value, by = 'name' }) => {
  const escapedValue = value.replace(/\$/g, '$$$$');
  const attr = by === 'property' ? 'property' : 'name';
  const regex = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*\\/?>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${escapedValue}" />`;
  if (regex.test(html)) return html.replace(regex, tag);

  // Insert before closing head as a fallback.
  return html.replace(/<\/head>/i, `${tag}\n  </head>`);
};

/**
 * Update hreflang tags for multi-language discovery
 * BEP SEO: Ensures crawlers can find all language variants
 */
function updateHreflangTags(html, route, currentLang) {
  // Build hreflang URLs for all supported languages
  const baseUrl = `https://time2.trade${route}`;
  
  // Remove old hreflang tags
  let updated = html.replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\n?/g, '');
  
  // Add hreflang tags for all languages
  const hreflangTags = [];
  
  // x-default points to English
  hreflangTags.push(`<link rel="alternate" hreflang="x-default" href="${baseUrl}" />`);
  
  // Language-specific hreflang tags
  SUPPORTED_LANGUAGES.forEach((lang) => {
    const href = lang === DEFAULT_LANGUAGE ? baseUrl : `${baseUrl}?lang=${lang}`;
    hreflangTags.push(`<link rel="alternate" hreflang="${lang}" href="${href}" />`);
  });
  
  // Insert hreflang tags before closing head
  const hreflangHtml = hreflangTags.join('\n    ');
  updated = updated.replace(/<\/head>/i, `    ${hreflangHtml}\n  </head>`);
  
  return updated;
}

async function generateHTML(route, meta, lang) {
  // Read the base index.html template
  const templatePath = path.join(distPath, 'index.html');
  let html = await fs.readFile(templatePath, 'utf-8');

  // Update title and primary meta
  html = replaceMeta(html, /<title>[^<]*<\/title>/i, `<title>${meta.title}</title>`);
  html = upsertMetaTag(html, { by: 'name', key: 'title', value: meta.title });
  html = upsertMetaTag(html, { by: 'name', key: 'description', value: meta.description });

  // BEP SEO: Update canonical URL based on language
  let canonicalUrl;
  if (route === '/') {
    canonicalUrl = lang === DEFAULT_LANGUAGE ? 'https://time2.trade/' : 'https://time2.trade/?lang=' + lang;
  } else {
    canonicalUrl = lang === DEFAULT_LANGUAGE ? `https://time2.trade${route}` : `https://time2.trade${route}?lang=${lang}`;
  }
  
  html = replaceMeta(
    html,
    /<link\s+rel="canonical"\s+href=".*?"(\s*\/?>|>)/i,
    `<link rel="canonical" href="${canonicalUrl}" />`,
  );

  // Update hreflang tags for multi-language discovery
  html = updateHreflangTags(html, route, lang);

  // Update social meta so crawlers and link previews match the route
  html = upsertMetaTag(html, { by: 'property', key: 'og:title', value: meta.title });
  html = upsertMetaTag(html, { by: 'property', key: 'og:description', value: meta.description });
  html = upsertMetaTag(html, { by: 'property', key: 'og:url', value: canonicalUrl });
  html = upsertMetaTag(html, { by: 'name', key: 'twitter:title', value: meta.title });
  html = upsertMetaTag(html, { by: 'name', key: 'twitter:description', value: meta.description });

  // BEP SEO: Update og:locale for language
  const localeMap = { en: 'en_US', es: 'es_ES', fr: 'fr_FR' };
  const ogLocale = localeMap[lang] || 'en_US';
  html = upsertMetaTag(html, { by: 'property', key: 'og:locale', value: ogLocale });

  // BEP SEO: Update html lang attribute
  html = html.replace(/<html[^>]*lang="[^"]*"/i, `<html lang="${lang}"`);

  const ogImage = getOgImage();
  const withOg = applyOgImage(html, ogImage);

  return withOg;
}

async function prerender() {
  console.log('🚀 Generating static HTML for SEO pages (multi-language)...\n');
  
  let successCount = 0;
  let failCount = 0;

  // BEP SEO: Generate pages for all supported languages
  for (const lang of SUPPORTED_LANGUAGES) {
    const langLabel = lang === DEFAULT_LANGUAGE ? '(DEFAULT)' : '';
    console.log(`\n📍 Language: ${lang.toUpperCase()} ${langLabel}`);
    
    for (const [route, basePageMeta] of Object.entries(pages)) {
      try {
        // Get localized metadata
        const meta = await getPageMetadata(route, lang);
        
        // Generate localized HTML
        const html = await generateHTML(route, meta, lang);
        
        // Determine output path based on language
        let outputPath;
        if (lang === DEFAULT_LANGUAGE) {
          // English goes to default locations
          outputPath = path.join(distPath, meta.path);
        } else {
          // Other languages go to language subdirectories
          const pathWithoutFilename = path.dirname(meta.path);
          const filename = path.basename(meta.path);
          outputPath = path.join(distPath, lang, pathWithoutFilename, filename);
        }
        
        const outputDir = path.dirname(outputPath);
        
        // Ensure directory exists
        await fs.mkdir(outputDir, { recursive: true });
        
        // Write HTML file
        await fs.writeFile(outputPath, html, 'utf-8');
        
        console.log(`  📄 ${route.padEnd(12)} → ${outputPath.replace(distPath, '')}`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ ${route} failed: ${error.message}`);
        failCount++;
      }
    }
  }

  console.log(`\n✨ Static HTML generation complete!`);
  console.log(`✅ Success: ${successCount} files`);
  if (failCount > 0) {
    console.log(`⚠️  Failed: ${failCount} files`);
  }
}

prerender().catch((error) => {
  console.error('💥 Prerender failed:', error);
  process.exit(1);
});
