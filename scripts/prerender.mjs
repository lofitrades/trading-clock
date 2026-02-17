/**
 * scripts/prerender.mjs
 * 
 * Purpose: Manual HTML generation for SEO pages with full multi-language support. 
 * Creates static HTML with proper localized meta tags that crawlers can read immediately.
 * Generates language variants (/es/, /fr/) for enhanced international crawlability (BEP).
 * 
 * Changelog:
 * v1.8.0 - 2026-02-04 - BEP SEO CRITICAL: Fixed URL strategy mismatch. All language URLs now use subpath structure (/es/, /fr/) instead of query params (?lang=es) for canonical tags, hreflang tags, and structured data. Eliminates duplicate URLs (e.g., /es/clock vs /clock?lang=es), prevents conflicting canonicals, and improves Google indexing. Matches Firebase hosting rewrites and sitemap.xml structure.
 * v1.7.0 - 2026-02-03 - BEP SEO: Updated EN page metadata to match new hero messaging ("Market Clock", benefit-driven descriptions, "never trade blind").
 * v1.6.0 - 2026-02-02 - BEP SEO FIX: Added BreadcrumbList and WebPage structured data injection for event pages.
 *                       Addresses "Discovered - currently not indexed" GSC status by providing site hierarchy signals.
 *                       Event pages now have 3-level breadcrumbs: Home → Economic Calendar → [Event Name].
 * v1.5.0 - 2026-02-02 - BEP SEO SOFT-404 FIX: Added page-specific noscript fallback content for Privacy, Terms, About, Contact pages. Google was flagging /privacy as soft-404 because the noscript content was generic landing page copy. Now each prerendered page has unique, crawlable content that matches its purpose, eliminating soft-404 issues.
 * v1.4.0 - 2026-02-03 - BEP SEO ENHANCEMENT: Integrated dynamic sitemap generation. Now calls generate-sitemap.mjs at end of prerender to create sitemap.xml with all 166 URLs (7 base + 159 events × 3 languages) with proper hreflang tags. Ensures Google has complete URL list immediately after build.
 * v1.3.0 - 2026-02-02 - BEP SEO: Added event pages prerendering. Generates 159 event pages (53 events × 3 languages) from economicEventDescriptions.json. Total pages: 180 (21 static + 159 events).
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
import { spawn } from 'child_process';
import { DEFAULT_OG_IMAGE, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../src/utils/seoMeta.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');
const dataPath = path.resolve(__dirname, '../data');

/**
 * Load economic event descriptions for SEO event pages
 * @returns {Array} Array of event objects
 */
async function loadEventDescriptions() {
  const filePath = path.join(dataPath, 'economicEventDescriptions.json');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    return data.events || [];
  } catch (error) {
    console.warn(`⚠️  Failed to load event descriptions: ${error.message}`);
    return [];
  }
}

/**
 * Get localized content for an event
 */
function getLocalizedEventContent(event, lang = 'en') {
  const i18n = event?.i18n || {};
  const langContent = i18n[lang] || i18n.en || {};
  
  return {
    description: langContent.description || event?.description || '',
    tradingImplication: langContent.tradingImplication || event?.tradingImplication || '',
  };
}

/**
 * BEP SEO: English (EN) page metadata
 * Fallback for missing translations and primary language
 */
const pages = {
  '/': {
    title: 'Time 2 Trade | Market Clock + Forex Factory Economic Calendar (NY Time)',
    description: 'See every trading session and market-moving event at a glance. A visual 24-hour clock displays New York, London, and Asia sessions with real-time countdowns—plus a Forex Factory-powered calendar filtered by impact and currency.',
    path: 'index.html',
  },
  '/clock': {
    title: 'Market Clock | Live NY, London, Asia Sessions with Countdowns',
    description: 'Visual 24-hour market clock for futures and forex day traders. See New York, London, and Asia sessions in real-time with countdowns to key transitions—never miss a session open again.',
    path: 'clock/index.html',
  },
  '/calendar': {
    title: 'Economic Calendar | Forex Factory Events Filtered by Impact & Currency',
    description: 'Forex Factory-powered economic calendar with fast filters for impact and currency. See scheduled releases that move price, add favorites and notes, and never trade blind into a high-impact release.',
    path: 'calendar/index.html',
  },
  '/about': {
    title: 'About Time 2 Trade | Market Clock for Futures & Forex',
    description: 'About Time 2 Trade: a visual 24-hour market clock displaying New York, London, and Asia sessions with real-time countdowns—plus a Forex Factory-powered economic calendar filtered by impact and currency.',
    path: 'about/index.html',
  },
  '/privacy': {
    title: 'Privacy Policy | Time 2 Trade',
    description: 'How Time 2 Trade collects, uses, and protects your data. Learn about your rights, our legal basis for processing, and controls for consent, deletion, and ad personalization.',
    path: 'privacy/index.html',
  },
  '/terms': {
    title: 'Terms & Conditions | Time 2 Trade',
    description: 'Time 2 Trade Terms & Conditions, including acceptable use, disclaimers, and ad disclosures. Free trading timing workspace for futures and forex day traders.',
    path: 'terms/index.html',
  },
  '/contact': {
    title: 'Contact | Time 2 Trade',
    description: 'Contact Time 2 Trade. Send a message for support, feedback, or questions. Prefer DM? Reach us on X.',
    path: 'contact/index.html',
  },
};

/**
 * BEP SEO: Page-specific noscript fallback content
 * Prevents soft-404 detection by Google - each page must have unique, relevant content
 */
const noscriptContent = {
  '/': null, // Use default landing page content from index.html
  '/clock': `
        <main class="t2t-noscript" aria-label="Market Clock">
          <h1>Market Clock | Live Market Sessions for Forex & Futures</h1>
          <p>
            Track global trading sessions in real-time with our free <strong>trading session clock</strong>.
            See when New York, London, Tokyo, and Sydney markets are open with visual overlaps and countdowns.
          </p>

          <h2>Key Features</h2>
          <ul>
            <li><strong>Live session tracking:</strong> Real-time display of all major market sessions</li>
            <li><strong>Session overlaps:</strong> Visualize high-volume overlap periods</li>
            <li><strong>Customizable timezone:</strong> View everything in your local time</li>
            <li><strong>Economic events:</strong> See upcoming releases directly on the clock</li>
            <li><strong>Countdown timers:</strong> Know exactly when sessions open and close</li>
          </ul>

          <h2>Why Use a Market Clock?</h2>
          <p>
            Different trading sessions have different characteristics. The London-New York overlap often sees
            the highest volume and volatility. Our clock helps you time your trades with session awareness.
          </p>

          <a class="cta primary" href="/clock">Open Market Clock</a>
          <a class="cta secondary" href="/calendar">View Economic Calendar</a>

          <p class="note">
            JavaScript is required for the full interactive experience. Enable JavaScript and refresh.
          </p>
        </main>`,
  '/calendar': `
        <main class="t2t-noscript" aria-label="Economic Calendar">
          <h1>Free Economic Calendar | Forex Factory Data + Market Clock</h1>
          <p>
            Access a comprehensive <strong>economic events calendar</strong> powered by Forex Factory data.
            Filter by impact level, currency, and timeframe to find the events that matter to your trading.
          </p>

          <h2>Calendar Features</h2>
          <ul>
            <li><strong>Forex Factory data:</strong> Trusted economic event source</li>
            <li><strong>Impact filtering:</strong> Focus on high, medium, or low impact events</li>
            <li><strong>Currency filters:</strong> Track USD, EUR, GBP, JPY, and more</li>
            <li><strong>Personal notes:</strong> Add your own notes to any event</li>
            <li><strong>Favorites:</strong> Mark and track events you follow</li>
            <li><strong>Export options:</strong> Download events for your records</li>
          </ul>

          <h2>Plan Around Economic Releases</h2>
          <p>
            High-impact economic releases like NFP, FOMC decisions, and GDP reports can cause significant
            market volatility. Use our calendar to plan entries, exits, or stay flat during major releases.
          </p>

          <a class="cta primary" href="/calendar">Open Economic Calendar</a>
          <a class="cta secondary" href="/clock">View Market Clock</a>

          <p class="note">
            JavaScript is required for the full interactive experience. Enable JavaScript and refresh.
          </p>
        </main>`,
  '/about': `
        <main class="t2t-noscript" aria-label="About Time 2 Trade">
          <h1>About Time 2 Trade | Market Clock for Futures & Forex</h1>
          <p>
            <strong>Time 2 Trade</strong> is a free, lightweight trading tool built for futures and forex day traders.
            We combine a visual session clock with an economic events calendar — everything you need to know
            when to trade and what's coming up.
          </p>

          <h2>Our Mission</h2>
          <p>
            We believe traders shouldn't have to bounce between tabs to know what session is open or when
            the next Fed announcement drops. Time 2 Trade puts timing context front and center.
          </p>

          <h2>What We Offer</h2>
          <ul>
            <li><strong>Market Clock:</strong> Visual display of global market sessions and overlaps</li>
            <li><strong>Economic Calendar:</strong> Forex Factory-powered event data with filters</li>
            <li><strong>Custom Events:</strong> Add your own trading reminders and routines</li>
            <li><strong>Notifications:</strong> Get alerted before important events</li>
            <li><strong>Cloud Sync:</strong> Your settings follow you across devices</li>
          </ul>

          <h2>Built for Traders, By Traders</h2>
          <p>
            This is not a signals service or broker. Time 2 Trade is purely for awareness and context — 
            helping you make better timing decisions in your own trading strategy.
          </p>

          <a class="cta primary" href="/clock">Try the Market Clock</a>
          <a class="cta secondary" href="/calendar">View Economic Calendar</a>

          <p class="note">
            JavaScript is required for the full interactive experience. Enable JavaScript and refresh.
          </p>
        </main>`,
  '/privacy': `
        <main class="t2t-noscript" aria-label="Privacy Policy">
          <h1>Privacy Policy | Time 2 Trade</h1>
          <p>
            <strong>Last Updated: February 2, 2026</strong>
          </p>
          <p>
            This Privacy Policy explains how Time 2 Trade ("we", "us", "our") collects, uses, and protects
            your personal information when you use our market clock and economic calendar application.
          </p>

          <h2>Information We Collect</h2>
          <ul>
            <li><strong>Account Information:</strong> Email address when you sign up (optional)</li>
            <li><strong>Usage Data:</strong> Pages visited, features used, session duration</li>
            <li><strong>Preferences:</strong> Your timezone, theme, and calendar filter settings</li>
            <li><strong>Device Information:</strong> Browser type, operating system, device type</li>
            <li><strong>Conversion Data:</strong> Sign-ups and logins tracked via Meta Pixel for ad measurement</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>To provide and improve our market clock and calendar services</li>
            <li>To sync your settings across devices when logged in</li>
            <li>To analyze usage patterns and optimize performance</li>
            <li>To display relevant advertisements through Google AdSense</li>
            <li>To measure ad effectiveness via Meta Pixel conversion tracking</li>
          </ul>

          <h2>Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li><strong>Firebase:</strong> Authentication, database, and hosting</li>
            <li><strong>Google Analytics:</strong> Usage analytics and insights</li>
            <li><strong>Google AdSense:</strong> Advertising (with consent controls)</li>
            <li><strong>Meta Pixel:</strong> Conversion tracking and ad measurement</li>
          </ul>

          <h2>Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. You can manage ad 
            personalization preferences and request data export or deletion by contacting us.
          </p>

          <h2>Contact Us</h2>
          <p>
            Questions about this Privacy Policy? Contact us at <a href="/contact">time2.trade/contact</a>
            or reach out on X (Twitter).
          </p>

          <a class="cta primary" href="/clock">Return to Market Clock</a>
          <a class="cta secondary" href="/contact">Contact Us</a>
        </main>`,
  '/terms': `
        <main class="t2t-noscript" aria-label="Terms and Conditions">
          <h1>Terms & Conditions | Time 2 Trade</h1>
          <p>
            <strong>Last Updated: January 7, 2026</strong>
          </p>
          <p>
            By accessing and using Time 2 Trade, you agree to these Terms & Conditions. Please read them
            carefully before using our market clock and economic calendar application.
          </p>

          <h2>Service Description</h2>
          <p>
            Time 2 Trade provides a free trading session clock and economic events calendar for informational
            purposes only. We are <strong>not</strong> a broker, signals provider, or financial advisor.
          </p>

          <h2>Acceptable Use</h2>
          <ul>
            <li>Use the service for personal, non-commercial trading research</li>
            <li>Do not attempt to scrape, reverse-engineer, or abuse our systems</li>
            <li>Do not redistribute our data without permission</li>
            <li>Respect other users and our community guidelines</li>
          </ul>

          <h2>Disclaimer</h2>
          <p>
            <strong>Trading involves substantial risk of loss.</strong> Time 2 Trade does not provide 
            financial advice, trading signals, or investment recommendations. All trading decisions are
            your own responsibility. Past performance does not guarantee future results.
          </p>

          <h2>Data Accuracy</h2>
          <p>
            Economic calendar data is sourced from third parties including Forex Factory. While we strive
            for accuracy, we cannot guarantee the completeness or timeliness of all data. Always verify
            important releases through official sources.
          </p>

          <h2>Advertising</h2>
          <p>
            Time 2 Trade displays advertisements through Google AdSense and tracks conversions via Meta Pixel
            to support our free service. You can manage ad personalization in your settings or browser preferences.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the service after changes
            constitutes acceptance of the new terms.
          </p>

          <a class="cta primary" href="/clock">Return to Market Clock</a>
          <a class="cta secondary" href="/contact">Contact Us</a>
        </main>`,
  '/contact': `
        <main class="t2t-noscript" aria-label="Contact Time 2 Trade">
          <h1>Contact | Time 2 Trade</h1>
          <p>
            Have questions, feedback, or need support? We'd love to hear from you.
          </p>

          <h2>Get in Touch</h2>
          <ul>
            <li><strong>Contact Form:</strong> Use our contact form (requires JavaScript)</li>
            <li><strong>X (Twitter):</strong> DM us <a href="https://x.com/time2aborrar" target="_blank" rel="noopener">@time2aborrar</a></li>
          </ul>

          <h2>Common Questions</h2>
          <ul>
            <li><strong>Is Time 2 Trade free?</strong> Yes, our core features are completely free.</li>
            <li><strong>Where does the calendar data come from?</strong> Forex Factory and other trusted sources.</li>
            <li><strong>Can I use this on mobile?</strong> Yes, Time 2 Trade is fully responsive and PWA-installable.</li>
            <li><strong>How do I report a bug?</strong> Use the contact form or DM us on X.</li>
          </ul>

          <h2>Response Time</h2>
          <p>
            We typically respond within 24-48 hours. For urgent issues, X (Twitter) DM is often fastest.
          </p>

          <a class="cta primary" href="/clock">Return to Market Clock</a>
          <a class="cta secondary" href="/calendar">View Economic Calendar</a>
        </main>`,
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
 * BEP SEO: Ensures crawlers can find all language variants using subpath structure
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
  
  // Language-specific hreflang tags using subpath structure
  SUPPORTED_LANGUAGES.forEach((lang) => {
    const href = lang === DEFAULT_LANGUAGE ? baseUrl : `https://time2.trade/${lang}${route}`;
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

  // BEP SEO: Update canonical URL based on language (subpath structure)
  let canonicalUrl;
  if (route === '/') {
    canonicalUrl = lang === DEFAULT_LANGUAGE ? 'https://time2.trade/' : `https://time2.trade/${lang}/`;
  } else {
    canonicalUrl = lang === DEFAULT_LANGUAGE ? `https://time2.trade${route}` : `https://time2.trade/${lang}${route}`;
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

  // BEP SEO SOFT-404 FIX: Replace noscript content with page-specific content
  // This prevents Google from seeing duplicate generic content across all pages
  const pageNoscript = noscriptContent[route];
  if (pageNoscript) {
    // Replace the entire noscript content
    html = html.replace(
      /<noscript>[\s\S]*?<\/noscript>/i,
      `<noscript>${pageNoscript}\n      </noscript>`
    );
  }

  const ogImage = getOgImage();
  const withOg = applyOgImage(html, ogImage);

  return withOg;
}

/**
 * Generate HTML for event pages with event-specific noscript content and structured data
 * BEP SEO: Prevents soft-404 by providing unique, crawlable content for each event
 * BEP SEO: Adds BreadcrumbList schema for site hierarchy signals to Google
 */
async function generateEventHTML(route, meta, lang, event, localizedContent) {
  // Start with standard HTML generation
  let html = await generateHTML(route, meta, lang);
  
  // Generate event-specific noscript content
  const eventName = event.name || 'Economic Event';
  const description = localizedContent.description || meta.description;
  const tradingImplication = localizedContent.tradingImplication || '';
  const currency = event.currency || 'USD';
  const frequency = event.frequency || 'Monthly';
  const eventId = event.id || event.docId;
  
  // BEP SEO: Generate BreadcrumbList and WebPage structured data for event pages
  const siteUrl = 'https://time2.trade';
  const eventUrl = lang === DEFAULT_LANGUAGE 
    ? `${siteUrl}/events/${eventId}` 
    : `${siteUrl}/${lang}/events/${eventId}`;
  
  const eventStructuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": siteUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Economic Calendar",
          "item": `${siteUrl}/calendar`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": eventName,
          "item": eventUrl
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": meta.title,
      "url": eventUrl,
      "description": description.substring(0, 160),
      "isPartOf": {
        "@type": "WebSite",
        "name": "Time 2 Trade",
        "url": siteUrl
      },
      "about": {
        "@type": "Event",
        "name": eventName,
        "description": description
      }
    }
  ];
  
  // Inject structured data into head
  const structuredDataScript = `<script type="application/ld+json">${JSON.stringify(eventStructuredData, null, 2)}</script>`;
  html = html.replace(/<\/head>/i, `    ${structuredDataScript}\n  </head>`);
  
  const eventNoscript = `
        <main class="t2t-noscript" aria-label="${eventName} - Economic Event Guide">
          <h1>${eventName} | Economic Event Guide</h1>
          <p>
            <strong>Currency:</strong> ${currency} | <strong>Frequency:</strong> ${frequency}
          </p>
          
          <h2>What is ${eventName}?</h2>
          <p>${description}</p>
          
          ${tradingImplication ? `
          <h2>Trading Implications</h2>
          <p>${tradingImplication}</p>
          ` : ''}
          
          <h2>Track This Event</h2>
          <p>
            Use Time 2 Trade's economic calendar to track ${eventName} releases. Set notifications,
            add personal notes, and see how this event fits into your trading session.
          </p>

          <a class="cta primary" href="/calendar">View Economic Calendar</a>
          <a class="cta secondary" href="/clock">Open Market Clock</a>

          <p class="note">
            JavaScript is required for the full interactive experience. Enable JavaScript and refresh.
          </p>
        </main>`;
  
  // Replace noscript content with event-specific content
  html = html.replace(
    /<noscript>[\s\S]*?<\/noscript>/i,
    `<noscript>${eventNoscript}\n      </noscript>`
  );
  
  return html;
}

async function prerender() {
  console.log('🚀 Generating static HTML for SEO pages (multi-language)...\n');
  
  let successCount = 0;
  let failCount = 0;

  // BEP SEO: Generate static pages for all supported languages
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

  // BEP SEO: Generate event pages (53 events × 3 languages = 159 pages)
  console.log('\n📰 Generating event pages...');
  const events = await loadEventDescriptions();
  console.log(`   Found ${events.length} events to process\n`);

  for (const lang of SUPPORTED_LANGUAGES) {
    const langLabel = lang === DEFAULT_LANGUAGE ? '(DEFAULT)' : '';
    console.log(`\n📍 Event Pages - ${lang.toUpperCase()} ${langLabel}`);
    
    for (const event of events) {
      try {
        const eventId = event.id || event.docId;
        if (!eventId) {
          console.warn(`   ⚠️  Skipping event without ID`);
          continue;
        }

        const route = `/events/${eventId}`;
        const localizedContent = getLocalizedEventContent(event, lang);
        
        // Build SEO metadata for event page
        const seoTitleSuffix = lang === 'es' ? 'Guía de Eventos Económicos' 
          : lang === 'fr' ? 'Guide des Événements Économiques' 
          : 'Economic Event Guide';
        
        const meta = {
          title: `${event.name} | ${seoTitleSuffix} - Time 2 Trade`,
          description: localizedContent.description.substring(0, 160),
          path: `events/${eventId}/index.html`,
        };
        
        // Generate HTML with event-specific noscript content
        const html = await generateEventHTML(route, meta, lang, event, localizedContent);
        
        // Determine output path based on language
        let outputPath;
        if (lang === DEFAULT_LANGUAGE) {
          outputPath = path.join(distPath, meta.path);
        } else {
          outputPath = path.join(distPath, lang, meta.path);
        }
        
        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(outputPath, html, 'utf-8');
        
        successCount++;
      } catch (error) {
        console.error(`   ❌ Event ${event.id || event.name} failed: ${error.message}`);
        failCount++;
      }
    }
    
    console.log(`   ✓ ${events.length} event pages generated for ${lang.toUpperCase()}`);
  }

  console.log(`\n✨ Static HTML generation complete!`);
  console.log(`✅ Success: ${successCount} files`);
  if (failCount > 0) {
    console.log(`⚠️  Failed: ${failCount} files`);
  }

  // Generate SEO sitemap after prerender completes
  console.log(`\n📋 Generating SEO sitemap with all 166 URLs...`);
  await generateSitemap();
}

/**
 * Generate sitemap.xml with all pages and language variants
 */
async function generateSitemap() {
  return new Promise((resolve, reject) => {
    const sitemapScript = path.join(__dirname, 'generate-sitemap.mjs');
    const child = spawn('node', [sitemapScript]);
    
    let output = '';
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      console.error(`❌ Sitemap error: ${data}`);
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(output);
        resolve();
      } else {
        reject(new Error(`Sitemap generation failed with code ${code}`));
      }
    });
  });
}

prerender().catch((error) => {
  console.error('💥 Prerender failed:', error);
  process.exit(1);
});
