/**
 * scripts/generate-sitemap.mjs
 * 
 * Purpose: Generate SEO-optimized sitemap.xml with all event pages and language variants
 * Key responsibility: Reads economicEventDescriptions.json and generates XML with hreflang tags for EN/ES/FR
 * 
 * Changelog:
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

// Base pages (marketing pages)
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
 * Generate xhtml:link tags for hreflang (multi-language support)
 * @param {string} basePath - The page path (e.g., /events/adp_employment_change)
 * @returns {string} XML string with all hreflang variants
 */
function generateHreflangLinks(basePath) {
  let xml = `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${basePath}"/>\n`;
  
  for (const lang of languages) {
    const url = lang === 'en' ? `${BASE_URL}${basePath}` : `${BASE_URL}${basePath}?lang=${lang}`;
    xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${url}"/>\n`;
  }
  
  return xml;
}

/**
 * Generate XML for a single URL entry
 * @param {string} path - The page path
 * @param {string} priority - Priority (0.0-1.0)
 * @param {string} changefreq - How often the page changes (daily, weekly, monthly, etc.)
 * @param {boolean} hasLanguageVariants - Whether to include hreflang tags
 * @returns {string} XML string for the URL entry
 */
function generateUrlEntry(path, priority, changefreq, hasLanguageVariants = true) {
  const lastmod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  let xml = `  <url>\n`;
  xml += `    <loc>${BASE_URL}${path}</loc>\n`;
  
  if (hasLanguageVariants) {
    xml += generateHreflangLinks(path);
  }
  
  xml += `    <lastmod>${lastmod}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority}</priority>\n`;
  xml += `  </url>\n`;
  
  return xml;
}

/**
 * Generate complete sitemap XML
 * @returns {string} Complete sitemap.xml content
 */
function generateSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n`;
  xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
  xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
  xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n`;
  xml += `  <!-- \n`;
  xml += `    BEP SEO: Dynamic sitemap with ${basePages.length} base pages + ${descriptionsData.events.length * languages.length} event pages (${descriptionsData.events.length} events × ${languages.length} languages)\n`;
  xml += `    Multi-language support with xhtml:link hreflang annotations\n`;
  xml += `    Generated: ${new Date().toISOString()}\n`;
  xml += `  -->\n\n`;
  
  // Add base pages
  for (const page of basePages) {
    xml += generateUrlEntry(page.path, page.priority, page.changefreq);
  }
  
  // Add event pages (each event with 3 language variants)
  const sortedEvents = descriptionsData.events.sort((a, b) => a.id.localeCompare(b.id));
  
  for (const event of sortedEvents) {
    const eventPath = `/events/${event.id}`;
    xml += generateUrlEntry(eventPath, '0.7', 'weekly');
  }
  
  xml += `</urlset>\n`;
  
  return xml;
}

/**
 * Write sitemap to file
 */
function writeSitemap() {
  try {
    const sitemapContent = generateSitemap();
    const outputPath = path.join(projectRoot, 'public', 'sitemap.xml');
    
    fs.writeFileSync(outputPath, sitemapContent, 'utf-8');
    
    const totalUrls = basePages.length + (descriptionsData.events.length * languages.length);
    console.log(`✅ Sitemap generated successfully!`);
    console.log(`   📍 Base pages: ${basePages.length}`);
    console.log(`   🎯 Event pages: ${descriptionsData.events.length * languages.length} (${descriptionsData.events.length} events × ${languages.length} languages)`);
    console.log(`   📊 Total URLs: ${totalUrls}`);
    console.log(`   📁 Output: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error generating sitemap: ${error.message}`);
    process.exit(1);
  }
}

// Run sitemap generation
writeSitemap();
