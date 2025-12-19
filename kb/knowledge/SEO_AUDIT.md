<!--
/SEO_AUDIT.md

Purpose: Record technical SEO and AI discoverability audit for Time 2 Trade SPA.
Changelog:
v1.0.0 - 2025-12-17 - Initial audit with findings, evidence, and recommendations.
-->

# SEO + AI Discoverability Audit (Time 2 Trade)

## Findings
- **SPA shell renders no primary content for / and /about (High):** Initial HTML is only the root container with no crawlable copy; React lazy routes render after JS execution, leaving bots and LLM scrapers with empty markup. Evidence: [index.html](index.html#L51) contains an empty `div#root`; routes are lazy-loaded with a null fallback in [src/routes/AppRoutes.jsx](src/routes/AppRoutes.jsx#L30-L93).
- **Home/events/login lack per-route meta (High):** Only global tags in [index.html](index.html#L12-L40) and About-specific Helmet. Events/Login pages ship without `<title>`, descriptions, canonical, or social tags, risking duplicate titles in search and poor link previews.
- **About page OG image placeholder (Medium):** `aboutMeta.ogImage` points to a non-existent `https://time2.trade/og-image.png` in [src/content/aboutContent.js](src/content/aboutContent.js#L189-L204) despite real assets existing in /public, leading to broken social previews.
- **No structured data on homepage (Medium):** Only About injects JSON-LD; the homepage lacks WebSite/SoftwareApplication schema, missing rich-result eligibility and entity signals.
- **No LLM-specific surface (Low):** There is no `/llms.txt` or AI-readable summary; important copy lives inside JS-only routes or canvas/UI elements.

## Recommended Fixes
- Pre-render or provide static HTML fallbacks for `/` and `/about` so meaningful copy is present in the initial response. Keep React mounting for interactivity where needed.
- Introduce a shared SEO helper and apply per-route Helmet metadata (title, description, canonical, OG/Twitter) for home, events, and login.
- Point About OG/Twitter images to existing hosted assets and ensure canonical domain `https://time2.trade` is used everywhere.
- Add WebSite + SoftwareApplication JSON-LD to the homepage (and About), aligning with product positioning.
- Add `/public/llms.txt` with a concise product overview, key URLs, and usage intent for AI crawlers.

## Implementation Plan
1. Add static, crawlable HTML blocks for `/` and `/about` (visible H1/H2, feature list) and structured data, ensuring they remain even when JS is disabled.
2. Create a `buildSeoMeta` helper and wrap key routes (home/events/login/about) with Helmet-powered metadata and JSON-LD.
3. Swap About OG image to an existing asset; keep canonical URLs absolute.
4. Add `/public/llms.txt` and, if needed, update sitemap/robots to advertise it.
5. Validate sitemap/robots remain correct; update Firebase hosting rewrites if static `/about` should bypass SPA rewrite.
