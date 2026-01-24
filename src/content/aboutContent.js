/**
 * src/content/aboutContent.js
 *
 * Purpose: Single source of truth for About page content.
 * Used by both the Settings Drawer About tab and the public /about route.
 * Contains SEO-rich enterprise copywriting for search engines and external tools.
 *
 * To update About content:
 * 1. Edit the content object below (title, sections array)
 * 2. Changes automatically appear in both locations
 * 3. Rebuild/redeploy for public route to reflect updates
 *
 * Changelog:
 * v1.4.0 - 2026-01-22 - Updated positioning: session clock + Forex Factory-powered calendar + custom events + notifications.
 *                         Removed “overlaps/PWA/exports/offline” as core features, tightened claims for trust, refreshed metadata + schema to WebApplication.
 * v1.3.2 - 2026-01-16 - Shortened About meta title/description for uniqueness and CTR-friendly length.
 * v1.3.1 - 2026-01-07 - Cleaned string escapes to satisfy lint rules without altering copy.
 * v1.3.0 - 2026-01-07 - Updated About copy and metadata to emphasize Forex Factory economic calendar + session clock experience.
 * v1.2.0 - 2025-12-22 - Rewrote About copy for clarity on sessions + economic events, updated metadata and structured data.
 * v1.1.0 - 2025-12-22 - Updated About positioning, metadata, and structured data for trading clock + economic events workspace.
 * v1.0.0 - 2025-12-17 - Initial extraction from AboutContent.txt for shared use across routes
 */

/**
 * About Page Content Configuration
 *
 * Structure:
 * - title: Main page title
 * - subtitle: Brief tagline/description
 * - sections: Array of content sections with title and content blocks
 *
 * Content Types:
 * - paragraph: Regular text content
 * - list: Bulleted list with items
 * - heading: Section heading
 */
export const aboutContent = {
  title: 'About Time 2 Trade',
  subtitle:
    'Intraday timing workspace: NY-time session clock with countdowns + Forex Factory-powered economic calendar, custom events, and notifications.',
  sections: [
    {
      title: null,
      content: [
        {
          type: 'paragraph',
          text:
            'Time 2 Trade is a clean intraday timing workspace for futures and forex day traders. It shows where you are in the trading day (New York, London, Asia sessions) with clear countdowns—then pairs that session context with a Forex Factory-powered economic calendar so you can see scheduled catalysts before they hit.',
        },
        {
          type: 'paragraph',
          text:
            'The goal is simple: reduce timing friction. Less timezone math. Less tab-hopping. Fewer “I forgot CPI was today” moments. More consistent execution decisions.',
        },
      ],
    },

    {
      title: 'What Time 2 Trade does',
      content: [
        {
          type: 'paragraph',
          text:
            'Time 2 Trade focuses on one job: make the trading day obvious—so you can act (or stand down) with confidence.',
        },
        {
          type: 'list',
          items: [
            {
              label: 'Session clock (NY / London / Asia) with countdowns',
              text:
                'A visual 24-hour clock shows session windows and the countdown to key transitions. This answers “where are we right now?” instantly—without switching tools.',
            },
            {
              label: 'Forex Factory-powered economic calendar',
              text:
                'See scheduled releases that move price. Filter by impact and currency, and keep your attention on the events that matter to your instruments and strategy.',
            },
            {
              label: 'Custom events for your personal timing rules',
              text:
                'Add your own events (no-trade windows, routine checkpoints, session reminders, personal rules) so the app matches how you actually trade—not a generic calendar.',
            },
            {
              label: 'Notifications (where supported)',
              text:
                'Enable reminders for upcoming events and personal checkpoints so you are not surprised by scheduled volatility mid-trade.',
            },
            {
              label: 'Personalization (optional account)',
              text:
                'Save filters, favorites, and notes when signed in, so your routine stays consistent across devices.',
            },
          ],
        },
        {
          type: 'paragraph',
          text:
            'Time 2 Trade is not a broker, signal tool, or execution platform. It is an awareness layer: sessions + scheduled catalysts + your own timing rules—next to your charts.',
        },
      ],
    },

    {
      title: "Who it's built for",
      content: [
        {
          type: 'list',
          items: [
            {
              label: 'Futures day traders',
              text:
                'If you trade ES/NQ/YM/RTY (or related markets), session timing matters. A clear session clock plus event awareness helps you avoid low-quality timing and sudden volatility windows.',
            },
            {
              label: 'Forex day traders and scalpers',
              text:
                'Currency-specific filtering helps you focus on what moves your pairs. Session awareness (especially London open and New York open) keeps your routine aligned with liquidity conditions.',
            },
            {
              label: 'Prop / funded account traders',
              text:
                'Constraint-driven trading demands repeatable routines. Use Time 2 Trade as a fast pre-trade check to avoid rule-breaking entries near major releases.',
            },
            {
              label: 'Students of session-based frameworks',
              text:
                'If your learning process references “New York time” and session windows, this tool helps you internalize timing patterns through consistent daily use.',
            },
            {
              label: 'Multi-timezone traders',
              text:
                'If you live outside the U.S. but follow NY-time education and charts, a NY-time-first workflow reduces confusion and improves consistency.',
            },
          ],
        },
        {
          type: 'paragraph',
          text:
            'If your process includes session timing, event avoidance, and repeatable daily routines, Time 2 Trade fits naturally.',
        },
      ],
    },

    {
      title: 'Why visualizing time matters',
      content: [
        {
          type: 'paragraph',
          text:
            'Many trading mistakes are timing mistakes—not analysis mistakes. Entering right before a high-impact release, trading through a session transition, or executing during low-liquidity conditions can turn a good setup into a bad trade.',
        },
        {
          type: 'list',
          items: [
            {
              label: 'Session transitions',
              text:
                'Market conditions shift around major opens and closes. Clear countdowns help you avoid entering into unstable transitions.',
            },
            {
              label: 'Scheduled catalysts',
              text:
                'A strong setup can fail if a major release hits minutes after entry. A clean “what’s coming next?” view reduces preventable surprises.',
            },
            {
              label: 'Routine consistency',
              text:
                'A stable, repeatable pre-trade checklist is a performance advantage—especially in funded environments where discipline matters.',
            },
          ],
        },
        {
          type: 'paragraph',
          text:
            'Time 2 Trade helps you answer, in real time: “What session am I in, what’s coming next, and does this timing match my plan?”',
        },
      ],
    },

    {
      title: 'Data source and reliability',
      content: [
        {
          type: 'paragraph',
          text:
            'Intraday tools are judged on correctness. Session boundaries and event timing must be reliable, especially around DST and date rollovers.',
        },
        {
          type: 'list',
          items: [
            {
              label: 'Economic calendar',
              text:
                'Calendar events are powered by Forex Factory economic event data so traders can reference a familiar source.',
            },
            {
              label: 'Timezone clarity',
              text:
                'New York time is a common reference for intraday education. The app is designed to keep session and event timing consistent with your selected timezone policy.',
            },
            {
              label: 'No mixed signals',
              text:
                'The product avoids “signal language.” It is built for awareness and timing context—not buy/sell calls.',
            },
          ],
        },
      ],
    },

    {
      title: 'Privacy, security, and data handling',
      content: [
        {
          type: 'paragraph',
          text:
            'Trust matters. Time 2 Trade is designed to be safe by default and minimal in what it stores.',
        },
        {
          type: 'paragraph',
          text: 'What we store',
        },
        {
          type: 'list',
          items: [
            {
              label: 'Guest mode',
              text:
                'Basic preferences can be saved locally on your device for a low-friction first use.',
            },
            {
              label: 'Account mode',
              text:
                'If you create an account, settings can sync across devices and you can save filters, favorites, notes, and reminders (depending on feature availability).',
            },
          ],
        },
        {
          type: 'paragraph',
          text: "What we don't do",
        },
        {
          type: 'list',
          items: [
            {
              label: 'No broker connections',
              text:
                'We do not connect to your broker or execute trades.',
            },
            {
              label: 'No signals',
              text:
                'We do not sell trading signals or “entries.”',
            },
            {
              label: 'No sensitive asks',
              text:
                'We do not require sensitive personal financial information for core functionality.',
            },
          ],
        },
        {
          type: 'paragraph',
          text: 'Data protection principles',
        },
        {
          type: 'list',
          items: [
            {
              label: 'Minimal data collection',
              text:
                'Only what is needed for the feature to work.',
            },
            {
              label: 'Clear separation',
              text:
                'Public/guest features and account-only features are kept distinct.',
            },
            {
              label: 'User-first purpose',
              text:
                'Account features exist to improve workflow consistency—not to harvest data.',
            },
          ],
        },
      ],
    },

    {
      title: 'Product principles',
      content: [
        {
          type: 'paragraph',
          text:
            'Time 2 Trade is built around a few non-negotiables:',
        },
        {
          type: 'list',
          items: [
            {
              label: 'Clarity over complexity',
              text:
                'The UI should answer “what time is it in my trading day?” faster than a calendar tab can load.',
            },
            {
              label: 'Consistency over novelty',
              text:
                'The same workflow should work daily, especially for prop traders and students building discipline.',
            },
            {
              label: 'Trust over hype',
              text:
                'No exaggerated promises, no signal claims—just reliable session + event context.',
            },
          ],
        },
      ],
    },

    {
      title: 'A note from the founder',
      content: [
        {
          type: 'paragraph',
          text:
            'Time 2 Trade is built by an independent software developer focused on practical tools for intraday routines—especially session timing, event awareness, and repeatable daily checklists.',
        },
        {
          type: 'paragraph',
          text:
            'The product is intentionally narrow: it aims to be the timing layer you keep next to your charts, built with a “fast, clean, reliable” mindset rather than feature bloat.',
        },
      ],
    },

    {
      title: 'Ready to see your trading day clearly?',
      content: [
        {
          type: 'paragraph',
          text:
            'Open the app and answer three questions in seconds: What session am I in? What’s the next scheduled catalyst? Does this timing match my plan?',
        },
      ],
    },
  ],
};

/**
 * SEO Metadata for About Page
 */
export const aboutMeta = {
  title: 'About Time 2 Trade | Session Clock + Forex Factory Calendar (NY Time)',
  description:
    'Why Time 2 Trade exists: a NY-time-first session clock with countdowns plus a Forex Factory-powered economic calendar, custom events, and notifications for intraday futures and forex traders.',
  keywords:
    'session clock, trading sessions, new york time trading, london session, asia session, session countdown, forex factory economic calendar, high-impact events, CPI, NFP, FOMC, custom events, trading reminders, event notifications, prop trader routine, intraday trading tool',
  canonical: 'https://time2.trade/about',
  ogType: 'website',
  ogImage: 'https://time2.trade/Time2Trade_SEO_Meta_5.PNG',
  twitterCard: 'summary_large_image',
  twitterSite: '@time2_trade',
};

/**
 * Structured Data (JSON-LD) for SEO
 * Use WebApplication to reflect a web-first SPA accurately.
 */
export const aboutStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Time 2 Trade',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description:
    'A New York time-first intraday timing workspace for futures and forex day traders: session countdowns + a Forex Factory-powered economic calendar with fast filters, custom events, and notifications. Built for awareness, not trading signals.',
  url: 'https://time2.trade',
  creator: {
    '@type': 'Organization',
    name: 'Lofi Trades',
    url: 'https://time2.trade',
  },
  featureList: [
    'Session clock with New York time-first session awareness and countdowns',
    'Forex Factory-powered economic calendar for scheduled releases',
    'Fast filters for impact, currency, and search',
    'Custom events for personal timing windows and reminders',
    'Notifications for upcoming events (where supported)',
    'Favorites and personal notes for authenticated users',
    'Designed for intraday awareness and event-avoidance (not trading signals)',
  ],
  image: 'https://time2.trade/Time2Trade_SEO_Meta_5.PNG',
  screenshot: 'https://time2.trade/Time2Trade_SEO_Meta_5.PNG',
};
