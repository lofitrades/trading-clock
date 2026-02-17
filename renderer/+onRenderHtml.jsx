/**
 * renderer/+onRenderHtml.jsx
 * 
 * Purpose: Server-side HTML renderer for vite-plugin-ssr. Builds semantic,
 * SEO-focused head tags and injects structured data for prerendered pages
 * while keeping the payload lean for marketing routes.
 * 
 * Changelog:
 * v1.0.2 - 2026-02-10 - Rename Market Clock branding in default SSR title/description fallbacks.
 * v1.0.1 - 2026-01-09 - Added robust favicon links (ico + sized PNG) for Google SERP compatibility.
 * v1.0.0 - 2025-12-18 - Initial SSR renderer with structured data support.
 */

import ReactDOMServer from 'react-dom/server';
import { escapeInject, dangerouslySkipEscape } from 'vite-plugin-ssr/server';
import { PageShell } from './PageShell';

const siteUrl = 'https://time2.trade';
const defaultOgImage = `${siteUrl}/Time2Trade_SEO_Meta_5.PNG`;
const fontHref = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap';

const globalStyles = `
:root {
  color-scheme: light;
  --bg: #050914;
  --surface: #0b1224;
  --card: #0f172a;
  --accent: #5eead4;
  --accent-2: #7c3aed;
  --text: #e8edf5;
  --muted: #95a1b5;
  --border: rgba(255,255,255,0.08);
  --shadow: 0 18px 60px rgba(0,0,0,0.4);
  --radius: 18px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Manrope', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: radial-gradient(circle at 15% 20%, rgba(124,58,237,0.18), transparent 32%),
              radial-gradient(circle at 82% 10%, rgba(94,234,212,0.18), transparent 30%),
              var(--bg);
  color: var(--text);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
main { width: 100%; }
.page-shell { min-height: 100vh; display: flex; flex-direction: column; }
.page-shell__inner { flex: 1; display: flex; flex-direction: column; }
.page-shell__max { width: min(1200px, 100%); margin: 0 auto; padding: 0 20px; }
.hero-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 28px; align-items: center; }
.card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 18px; border-radius: 999px; border: 1px solid transparent; font-weight: 700; font-size: 1rem; cursor: pointer; transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease, color 160ms ease; }
.btn-primary { background: linear-gradient(135deg, #22d3ee, #7c3aed); color: #050914; box-shadow: 0 18px 40px rgba(34,211,238,0.35); }
.btn-primary:hover { transform: translateY(-1px) scale(1.01); }
.btn-secondary { background: rgba(255,255,255,0.04); border-color: var(--border); color: var(--text); }
.btn-secondary:hover { background: rgba(255,255,255,0.08); }
.badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(94,234,212,0.14); color: #c5fff5; padding: 10px 14px; border-radius: 999px; font-weight: 700; border: 1px solid rgba(94,234,212,0.24); }
.heading-xl { font-size: clamp(2.4rem, 3vw, 3rem); line-height: 1.05; margin: 12px 0 16px; font-weight: 800; }
.heading-lg { font-size: clamp(1.35rem, 2vw, 1.6rem); font-weight: 800; margin: 0 0 12px; }
.heading-md { font-size: 1.15rem; font-weight: 700; margin: 0 0 10px; }
.text-lead { font-size: 1.05rem; line-height: 1.7; color: var(--muted); margin: 0 0 24px; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.faq { border-top: 1px solid var(--border); padding-top: 6px; margin-top: 12px; }
.faq h3 { margin: 12px 0 8px; font-size: 1rem; }
.faq p { margin: 0; color: var(--muted); line-height: 1.6; }
.footer { border-top: 1px solid var(--border); padding: 28px 0; margin-top: 48px; color: var(--muted); font-size: 0.95rem; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 18px 0; }
.nav { display: flex; align-items: center; gap: 14px; }
.nav a { padding: 10px 12px; border-radius: 999px; color: var(--muted); border: 1px solid transparent; }
.nav a:hover { border-color: var(--border); color: var(--text); }
.logo { font-weight: 800; font-size: 1.05rem; letter-spacing: 0.02em; display: inline-flex; align-items: center; gap: 10px; }
.logo__dot { width: 10px; height: 10px; border-radius: 50%; background: linear-gradient(135deg, #22d3ee, #7c3aed); box-shadow: 0 0 0 6px rgba(124,58,237,0.25); }
.muted-chip { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 0.95rem; }
.list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
.list li { display: flex; gap: 10px; align-items: flex-start; color: var(--muted); }
.list strong { color: var(--text); }
.section { margin: 38px 0; }
.hero-visual { padding: 18px; background: linear-gradient(145deg, rgba(94,234,212,0.08), rgba(124,58,237,0.12)); border-radius: var(--radius); border: 1px solid var(--border); }
.hero-visual__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.hero-visual__item { padding: 12px; background: rgba(255,255,255,0.03); border-radius: 14px; border: 1px solid var(--border); }
.hero-visual__title { font-weight: 700; margin: 0 0 6px; }
.hero-visual__stat { font-weight: 800; font-size: 1.25rem; margin: 0 0 4px; color: #a5f3fc; }
.hero-visual__hint { margin: 0; color: var(--muted); font-size: 0.95rem; }
@media (max-width: 720px) {
  .header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .nav { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
}
`;

const renderTags = (items, tagName) => {
  if (!items?.length) return '';
  return items
    .map((item) => {
      const attrs = Object.entries(item)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      return `<${tagName} ${attrs} />`;
    })
    .join('\n');
};

export async function onRenderHtml(pageContext) {
  const { Page, pageProps, urlPathname } = pageContext;
  const documentProps = pageContext.documentProps || {};

  if (!Page) {
    throw new Error('No Page component found for route: ' + urlPathname);
  }

  const title = documentProps.title || 'Time 2 Trade | Market Clock & Events';
  const description = documentProps.description || 'Visual market intelligence with a dual-circle market clock, live economic events overlay, and timezone-aware guidance for futures and forex day traders.';
  const canonical = documentProps.canonical || `${siteUrl}${urlPathname}`;
  const robots = documentProps.robots || 'index,follow';
  const ogImage = documentProps.ogImage || defaultOgImage;
  const ogType = documentProps.ogType || 'website';
  const twitterCard = documentProps.twitterCard || 'summary_large_image';
  const twitterSite = documentProps.twitterSite || '@time2_trade';
  const themeColor = documentProps.themeColor || '#0b1224';
  const structuredData = documentProps.structuredData || [];
  const extraLinks = documentProps.links || [];
  const extraMeta = documentProps.meta || [];
  const lang = documentProps.lang || 'en';

  const pageHtml = ReactDOMServer.renderToString(
    <PageShell pageContext={pageContext}>
      <Page {...pageProps} />
    </PageShell>
  );

  const jsonLd = structuredData
    .map((schema, index) => `<script type="application/ld+json" id="ld-${index}">${JSON.stringify(schema)}</script>`)
    .join('\n');

  const linkTags = renderTags(extraLinks, 'link');
  const metaTags = renderTags(extraMeta, 'meta');

  return escapeInject`<!DOCTYPE html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
    <meta name="theme-color" content="${themeColor}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="${fontHref}" rel="stylesheet" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
    <link rel="apple-touch-icon" href="/icons/icon-apple-180.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta property="og:site_name" content="Time 2 Trade" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${ogImage}" />
    <meta name="twitter:card" content="${twitterCard}" />
    <meta name="twitter:site" content="${twitterSite}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />
    <style>${dangerouslySkipEscape(globalStyles)}</style>
    ${dangerouslySkipEscape(jsonLd)}
    ${dangerouslySkipEscape(linkTags)}
    ${dangerouslySkipEscape(metaTags)}
  </head>
  <body>
    <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
  </body>
</html>`;
}
