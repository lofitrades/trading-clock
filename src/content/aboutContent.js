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
  title: "About Time 2 Trade",
  subtitle: "Forex Factory-powered economic calendar and session clock for futures and forex day traders.",
  sections: [
    {
      title: null,
      content: [
        {
          type: "paragraph",
          text: "Time 2 Trade is a lightweight web app that pairs a Forex Factory economic calendar with a live market session clock so you can plan and execute around sessions and scheduled events."
        },
        {
          type: "paragraph",
          text: "The goal is simple: help you visualize time so you can trade with better timing, fewer surprises, and a more consistent routine."
        }
      ]
    },
    
    {
      title: "What Time 2 Trade does",
      content: [
        {
          type: "paragraph",
          text: "Time 2 Trade turns the 24-hour day into a clean visual clock so you can instantly see New York, London, and Asia session windows, overlaps, where you are right now, and what's next—alongside today's economic events."
        },
        {
          type: "list",
          items: [
            {
              label: "Visual market sessions",
              text: "Dual-circle clock shows session windows, overlaps, and your current position in the trading day."
            },
            {
              label: "Forex Factory economic calendar",
              text: "View upcoming releases in a timeline or table, filter by impact level and currency, save favorites and add notes (with an account), and export events for planning."
            }
          ]
        },
        {
          type: "paragraph",
          text: "Time 2 Trade is not a trading terminal and does not provide buy/sell signals. It's a timing and awareness layer you can keep next to your charts."
        }
      ]
    },
    
    {
      title: "Who it's built for",
      content: [
        {
          type: "list",
          items: [
            {
              label: "Futures and forex day traders",
              text: "Intraday traders who rely on session timing."
            },
            {
              label: "Economic calendar users",
              text: "Traders who check news releases regularly."
            },
            {
              label: "New York time workflows",
              text: "Teams and individuals who anchor to NY session timing."
            },
            {
              label: "Funded/prop traders",
              text: "Traders who need disciplined routines and event awareness."
            },
            {
              label: "Session-based frameworks",
              text: "Students and practitioners of session-focused timing (including ICT-style timing)."
            }
          ]
        },
        {
          type: "paragraph",
          text: "If your process includes session windows, overlaps, or avoiding high-impact releases, this tool fits naturally."
        }
      ]
    },
    
    {
      title: "Why \"visualizing time\" matters",
      content: [
        {
          type: "paragraph",
          text: "Intraday trading often comes down to timing:"
        },
        {
          type: "list",
          items: [
            {
              label: "Session transitions",
              text: "Volatility and volume shift as sessions open and close."
            },
            {
              label: "Overlaps",
              text: "The conditions many strategies depend on are tied to overlaps."
            },
            {
              label: "High-impact events",
              text: "News can turn a normal setup into a high-risk one."
            }
          ]
        },
        {
          type: "paragraph",
          text: "Time 2 Trade helps you answer the key question fast: Is this the right time to trade?"
        }
      ]
    },
    
    {
      title: "Privacy, security, and data handling",
      content: [
        {
          type: "paragraph",
          text: "Trust matters. Time 2 Trade is designed to be safe by default."
        },
        {
          type: "paragraph",
          text: "What we store"
        },
        {
          type: "list",
          items: [
            {
              label: "Guest mode",
              text: "Basic preferences can be saved locally on your device."
            },
            {
              label: "Account mode",
              text: "If you create an account, settings can sync across devices and you can save calendar favorites and notes."
            }
          ]
        },
        {
          type: "paragraph",
          text: "What we don't do"
        },
        {
          type: "list",
          items: [
            {
              label: "No broker connections",
              text: "We do not connect to your broker or execute trades."
            },
            {
              label: "No signals",
              text: "We do not sell trading signals."
            },
            {
              label: "No sensitive asks",
              text: "We do not ask for sensitive personal financial information to provide core functionality."
            }
          ]
        },
        {
          type: "paragraph",
          text: "Data protection principles"
        },
        {
          type: "list",
          items: [
            {
              label: "Minimal data collection",
              text: "Only what's needed for the feature to work."
            },
            {
              label: "Clear separation",
              text: "Public content and account-only features stay distinct."
            },
            {
              label: "User-first features",
              text: "Account features exist to improve your workflow, not to harvest data."
            }
          ]
        }
      ]
    },
    
    {
      title: "Built for speed and everyday use",
      content: [
        {
          type: "paragraph",
          text: "Time 2 Trade is built to load fast, work on mobile, and stay out of your way. You can also install it as a web app (PWA) so it launches like a native app, ideal for quick checks before a session starts or before a release."
        }
      ]
    },
    
    {
      title: "A note from the founder",
      content: [
        {
          type: "paragraph",
          text: "Time 2 Trade is built by Juan Diego, a developer and day-trading tool builder focused on making time-based trading workflows simpler and more consistent."
        },
        {
          type: "paragraph",
          text: "The product is shaped by real intraday routines (sessions, overlaps, and scheduled events) so the app stays practical, focused, and fast."
        }
      ]
    },
    
    {
      title: "Ready to visualize your trading day?",
      content: [
        {
          type: "paragraph",
          text: "Open the app and get instant session and event context in one clean view."
        }
      ]
    }
  ]
};

/**
 * SEO Metadata for About Page
 */
export const aboutMeta = {
  title: "About Time 2 Trade | Forex Factory Economic Calendar + Session Clock",
  description: "Forex Factory-powered economic calendar paired with a live session clock for futures and forex day traders. See New York / London / Asia overlaps, filter events by impact and currency, save favorites and notes, export, and install fast as a PWA. No trading signals.",
  keywords: "economic calendar, forex factory calendar, trading session clock, market session overlaps, futures economic calendar, forex news calendar, impact filters, currency filters, day trading routine, prop trader workflow, New York session timing, London session timing",
  canonical: "https://time2.trade/about",
  ogType: "website",
  ogImage: "https://time2.trade/Time2Trade_SEO_Meta_3.PNG",
  twitterCard: "summary_large_image",
  twitterSite: "@time2_trade"
};

/**
 * Structured Data (JSON-LD) for SEO
 */
export const aboutStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Time 2 Trade",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Forex Factory economic calendar paired with a live session clock for futures and forex day traders. Visualize sessions and overlaps, filter events by impact and currency, save favorites/notes, export, and install as a fast PWA.",
  "url": "https://time2.trade",
  "creator": {
    "@type": "Organization",
    "name": "Lofi Trades",
    "url": "https://time2.trade"
  },
  "featureList": [
    "Dual-circle session clock showing overlaps and current position in the day",
    "New York time-first defaults with timezone-aware countdowns",
    "Forex Factory economic events timeline and table views with impact and currency filters",
    "Favorites and personal notes for authenticated users",
    "Exports from the events workspace for planning",
    "Customizable trading sessions and colors (up to eight)",
    "Installable PWA for fast launch"
  ],
  "screenshot": "https://time2.trade/Time2Trade_SEO_Meta_3.PNG"
};
