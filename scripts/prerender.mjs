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
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_OG_IMAGE } from '../src/utils/seoMeta.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

const pages = {
  '/': {
    title: 'Time 2 Trade | Trading Clock + Economic Events for Day Traders',
    description: 'Visual market sessions and economic events in a New York time-first workspace. Filters, favorites/notes, exports, and fast launch for futures and forex day traders.',
    path: 'index.html',
  },
  '/about': {
    title: 'About Time 2 Trade | A clearer view of the trading day',
    description: 'Lightweight trading clock for futures and forex day traders. Visualize New York, London, and Asia sessions plus an optional economic events workspace with filters, favorites/notes, exports, and fast PWA install. No trading signals.',
    path: 'about/index.html',
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

async function generateHTML(route, meta) {
  // Read the base index.html template
  const templatePath = path.join(distPath, 'index.html');
  let html = await fs.readFile(templatePath, 'utf-8');

  // Update title and description
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${meta.title}</title>`
  );
  
  html = html.replace(
    /<meta name="description" content=".*?">/,
    `<meta name="description" content="${meta.description}">`
  );

  // Update canonical URL
  const canonicalUrl = route === '/' ? 'https://time2.trade/' : `https://time2.trade${route}`;
  html = html.replace(
    /<link rel="canonical" href=".*?"(\s*\/>|>)/,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );

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
