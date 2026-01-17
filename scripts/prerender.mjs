/**
 * scripts/prerender.mjs
 * 
 * Purpose: Manual HTML generation for SEO pages. Creates static HTML with 
 * proper meta tags that crawlers can read immediately.
 * 
 * Changelog:
 * v1.1.3 - 2026-01-07 - Inject OG/Twitter/screenshot images from DEFAULT_OG_IMAGE or VITE_OG_IMAGE_URL for one-touch updates.
 * v1.1.2 - 2025-12-22 - Synced /about prerender metadata with refreshed About copy.
 * v1.1.1 - 2025-12-22 - Updated landing/about prerender metadata to match refreshed positioning.
 * v1.1.0 - 2025-12-18 - Switched to manual HTML generation for reliability.
 * v1.1.4 - 2026-01-09 - Fixed </head> insertion regex so postbuild prerender runs.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_OG_IMAGE } from '../src/utils/seoMeta.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

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
};

const getOgImage = () => process.env.VITE_OG_IMAGE_URL || DEFAULT_OG_IMAGE;

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

async function generateHTML(route, meta) {
  // Read the base index.html template
  const templatePath = path.join(distPath, 'index.html');
  let html = await fs.readFile(templatePath, 'utf-8');

  // Update title and primary meta
  html = replaceMeta(html, /<title>[^<]*<\/title>/i, `<title>${meta.title}</title>`);
  html = upsertMetaTag(html, { by: 'name', key: 'title', value: meta.title });
  html = upsertMetaTag(html, { by: 'name', key: 'description', value: meta.description });

  // Update canonical URL
  const canonicalUrl = route === '/' ? 'https://time2.trade/' : `https://time2.trade${route}`;
  html = replaceMeta(
    html,
    /<link\s+rel="canonical"\s+href=".*?"(\s*\/?>|>)/i,
    `<link rel="canonical" href="${canonicalUrl}" />`,
  );

  // Update social meta so crawlers and link previews match the route.
  html = upsertMetaTag(html, { by: 'property', key: 'og:title', value: meta.title });
  html = upsertMetaTag(html, { by: 'property', key: 'og:description', value: meta.description });
  html = upsertMetaTag(html, { by: 'property', key: 'og:url', value: canonicalUrl });
  html = upsertMetaTag(html, { by: 'name', key: 'twitter:title', value: meta.title });
  html = upsertMetaTag(html, { by: 'name', key: 'twitter:description', value: meta.description });

  const ogImage = getOgImage();
  const withOg = applyOgImage(html, ogImage);

  return withOg;
}

async function prerender() {
  console.log('🚀 Generating static HTML for SEO pages...\n');

  for (const [route, meta] of Object.entries(pages)) {
    try {
      console.log(`📄 Generating: ${route}`);
      
      const html = await generateHTML(route, meta);
      const outputPath = path.join(distPath, meta.path);
      const outputDir = path.dirname(outputPath);
      
      // Ensure directory exists
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write HTML file
      await fs.writeFile(outputPath, html, 'utf-8');
      
      console.log(`   ✅ Saved to: ${meta.path}`);
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log('\n✨ Static HTML generation complete!');
}

prerender().catch((error) => {
  console.error('💥 Prerender failed:', error);
  process.exit(1);
});
