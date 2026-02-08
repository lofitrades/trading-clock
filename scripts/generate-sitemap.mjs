/**
 * scripts/generate-sitemap.mjs
 * 
 * Purpose: Generate static sitemaps for pages and events (sitemap-pages.xml, sitemap-events.xml)
 * Key responsibility: Reads economicEventDescriptions.json and generates XML with hreflang tags for EN/ES/FR
 * 
 * Note: /sitemap.xml and /sitemap-blog.xml are served dynamically by Cloud Functions.
 * This script only generates the STATIC sitemaps that don't change frequently.
 * 
 * Changelog:
 * v3.0.0 - 2026-02-09 - BEP SEO CRITICAL: Bidirectional hreflang compliance. Each language variant (EN/ES/FR) now gets its own <url> entry with full hreflang links to all other variants. Pages: 7→21 URLs. Events: 53→159 URLs. Integrated into build pipeline via prebuild hook. Lastmod set once per generation (= deployment date).
 * v2.0.0 - 2026-02-04 - BEP SITEMAP INDEX: Refactored to generate split sitemaps (sitemap-pages.xml, sitemap-events.xml). Main sitemap.xml now served by Cloud Function serveSitemapIndex.
 * v1.2.0 - 2026-02-04 - BEP BLOG: Added /blog page to sitemap with hreflang support.
 * v1.1.0 - 2026-02-04 - BEP SEO CRITICAL: Fixed URL strategy mismatch. Changed from query params to subpath structure.
 * v1.0.0 - 2026-02-02 - Initial implementation: Generate sitemap with 159 event pages (53 events × 3 languages) + 7 base pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Load event descriptions
const descriptionsPath = path.join(projectRoot, 'data', 'economicEventDescriptions.json');
const descriptionsData = JSON.parse(fs.readFileSync(descriptionsPath, 'utf-8'));

// Base URL for the site
const BASE_URL = 'https://time2.trade';

// Compute lastmod once per generation run (= deployment date for build pipeline)
const LASTMOD = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Base pages (static marketing pages - blog index excluded, served dynamically)
const basePages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/clock', priority: '0.9', changefreq: 'daily' },
  { path: '/calendar', priority: '0.9', changefreq: 'daily' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.6', changefreq: 'monthly' },
  { path: '/terms', priority: '0.6', changefreq: 'monthly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' },
];

// Language variants for each URL
const languages = ['en', 'es', 'fr'];

/**
 * Build the full URL for a given base path and language
 * EN uses the bare path, ES/FR use subpath prefix (/es/, /fr/)
 * @param {string} basePath - The canonical page path (e.g., /clock, /events/nfp)
 * @param {string} lang - Language code (en, es, fr)
 * @returns {string} Full URL
 */
function buildLangUrl(basePath, lang) {
  return lang === 'en' ? `${BASE_URL}${basePath}` : `${BASE_URL}/${lang}${basePath}`;
}

/**
 * Generate xhtml:link tags for hreflang (multi-language support)
 * BEP SEO: Bidirectional — every language variant links to ALL variants including itself
 * Uses subpath-based URLs (/es/, /fr/) to match Firebase hosting rewrites
 * @param {string} basePath - The page path (e.g., /events/adp_employment_change)
 * @returns {string} XML string with x-default + all hreflang variants
 */
function generateHreflangLinks(basePath) {
  // x-default always points to the English canonical
  let xml = `    <xhtml:link rel="alternate" hreflang="x-default" href="${buildLangUrl(basePath, 'en')}"/>\n`;

  for (const lang of languages) {
    xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${buildLangUrl(basePath, lang)}"/>\n`;
  }

  return xml;
}

/**
 * Generate XML <url> entries for ALL language variants of a page
 * BEP SEO: Bidirectional hreflang — each language gets its own <url> entry
 * with identical hreflang links pointing to all variants (including itself).
 * Google requires this for proper multi-language indexing.
 *
 * @param {string} basePath - The canonical page path (e.g., /clock)
 * @param {string} priority - Priority (0.0-1.0)
 * @param {string} changefreq - How often the page changes (daily, weekly, monthly)
 * @returns {string} XML string with one <url> per language variant
 */
function generateLanguageUrlEntries(basePath, priority, changefreq) {
  const hreflangBlock = generateHreflangLinks(basePath);
  let xml = '';

  for (const lang of languages) {
    const loc = buildLangUrl(basePath, lang);
    xml += `  <url>\n`;
    xml += `    <loc>${loc}</loc>\n`;
    xml += hreflangBlock;
    xml += `    <lastmod>${LASTMOD}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  return xml;
}

/**
 * Generate sitemap XML wrapper with header
 * @param {string} content - URL entries content
 * @param {string} comment - Comment describing the sitemap
 * @returns {string} Complete sitemap XML
 */
function wrapSitemap(content, comment) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;
  xml += `  <!--\n`;
  xml += `    ${comment}\n`;
  xml += `    Generated: ${new Date().toISOString()}\n`;
  xml += `  -->\n`;
  xml += content;
  xml += `</urlset>\n`;
  return xml;
}

/**
 * Generate sitemap-pages.xml (base pages × all languages)
 * BEP SEO: Bidirectional hreflang — each language variant has its own <url>
 * @returns {string} Pages sitemap XML
 */
function generatePagesSitemap() {
  let content = '';
  for (const page of basePages) {
    content += generateLanguageUrlEntries(page.path, page.priority, page.changefreq);
  }
  const totalUrls = basePages.length * languages.length;
  return wrapSitemap(content, `BEP SEO: Static pages sitemap — ${basePages.length} pages × ${languages.length} languages = ${totalUrls} URL entries (bidirectional hreflang)`);
}

/**
 * Generate sitemap-events.xml (event pages × all languages)
 * BEP SEO: Bidirectional hreflang — each language variant has its own <url>
 * @returns {string} Events sitemap XML
 */
function generateEventsSitemap() {
  const sortedEvents = descriptionsData.events.sort((a, b) => a.id.localeCompare(b.id));
  let content = '';
  for (const event of sortedEvents) {
    const eventPath = `/events/${event.id}`;
    content += generateLanguageUrlEntries(eventPath, '0.7', 'weekly');
  }
  const totalUrls = sortedEvents.length * languages.length;
  return wrapSitemap(content, `BEP SEO: Economic events sitemap — ${sortedEvents.length} events × ${languages.length} languages = ${totalUrls} URL entries (bidirectional hreflang)`);
}

/**
 * Write both sitemaps to files
 */
function writeSitemaps() {
  try {
    // Generate and write sitemap-pages.xml
    const pagesContent = generatePagesSitemap();
    const pagesPath = path.join(projectRoot, 'public', 'sitemap-pages.xml');
    fs.writeFileSync(pagesPath, pagesContent, 'utf-8');

    // Generate and write sitemap-events.xml
    const eventsContent = generateEventsSitemap();
    const eventsPath = path.join(projectRoot, 'public', 'sitemap-events.xml');
    fs.writeFileSync(eventsPath, eventsContent, 'utf-8');

    const pagesTotal = basePages.length * languages.length;
    const eventsTotal = descriptionsData.events.length * languages.length;

    console.log(`✅ Sitemaps generated successfully!`);
    console.log(`   📍 sitemap-pages.xml: ${basePages.length} pages × ${languages.length} langs = ${pagesTotal} URLs`);
    console.log(`   🎯 sitemap-events.xml: ${descriptionsData.events.length} events × ${languages.length} langs = ${eventsTotal} URLs`);
    console.log(`   🌐 Languages: ${languages.join(', ')} (bidirectional hreflang)`);
    console.log(`   📅 lastmod: ${LASTMOD}`);
    console.log(`   📁 Output: ${path.join(projectRoot, 'public')}`);
    console.log(`\n   ℹ️  Note: /sitemap.xml and /sitemap-blog.xml are served by Cloud Functions`);
  } catch (error) {
    console.error(`❌ Error generating sitemaps: ${error.message}`);
    process.exit(1);
  }
}

// Run sitemap generation
writeSitemaps();
