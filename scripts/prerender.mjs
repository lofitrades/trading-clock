/**
 * scripts/prerender.mjs
 * 
 * Purpose: Manual HTML generation for SEO pages. Creates static HTML with 
 * proper meta tags that crawlers can read immediately.
 * 
 * Changelog:
 * v1.1.0 - 2025-12-18 - Switched to manual HTML generation for reliability.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

const pages = {
  '/': {
    title: 'Time 2 Trade | Visual trading workspace for futures and forex day traders',
    description: 'Time 2 Trade is a visual trading workspace for futures and forex day traders: dual-circle session clock, economic events overlay, timezone-aware countdowns, and synced settings.',
    path: 'index.html',
  },
  '/about': {
    title: 'About Time 2 Trade | Sessions, events, and timezone intelligence',
    description: 'Time 2 Trade is built for futures and forex day traders who need a reliable session clock, economic events overlay, and timezone-aware workspace.',
    path: 'about/index.html',
  },
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

  return html;
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
