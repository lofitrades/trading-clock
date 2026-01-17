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
  title: "About Time 2 Trade",
  subtitle: "Visual trading clock for intraday traders. See market sessions (New York, London, Asia) with countdowns plus Forex Factory economic events.",
  sections: [
    {
      title: null,
      content: [
        {
          type: "paragraph",
          text: "Time 2 Trade is a visual trading clock built for intraday traders. It shows you exactly where you are in the trading day (New York, London, Asia sessions) with real-time countdowns to session transitions. Plus, Forex Factory economic events integrated so you see what catalysts are coming."
        },
        {
          type: "paragraph",
          text: "Most intraday traders struggle with the same problem: timezone confusion and event surprises. Time 2 Trade eliminates both. One clock, all sessions, all countdowns. No tab-hopping. No mental math."
        }
      ]
    },
    
    {
      title: "What Time 2 Trade does",
      content: [
        {
          type: "paragraph",
          text: "Time 2 Trade is built for one job: Show you the trading day clearly so you execute with timing precision."
        },
        {
          type: "list",
          items: [
            {
              label: "Visual trading clock (New York / London / Asia)",
              text: "A dual-circle 24-hour clock shows session windows, your current position in the day, and real-time countdowns to next session transitions. This is your primary tool—it answers 'what session am I in right now?' instantly."
            },
            {
              label: "Integrated Forex Factory calendar",
              text: "See high-impact economic releases with countdown timers. Know when major catalysts fire so you never trade blind into a release. Filter by impact level and currency, save favorites, add notes, and export for prep."
            }
          ]
        },
        {
          type: "paragraph",
          text: "Time 2 Trade is not a broker, signal tool, or terminal. It's a session awareness + event awareness layer. Use it as your pre-trade checklist next to your charts."
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
              label: "Day traders (futures/forex)",
              text: "If you're trading ES, NQ, EUR/USD, GBP/USD, or any liquid intraday pair, session awareness is your edge. Time 2 Trade eliminates the mental load of timezone math."
            },
            {
              label: "ICT and smart money traders",
              text: "You already understand session structure drives volatility and order flow. Time 2 Trade lets you visualize exactly when high-volume periods collide with economic releases—execution windows become obvious."
            },
            {
              label: "Prop traders and funded accounts",
              text: "With strict drawdown rules and daily limits, precision timing is non-negotiable. Catch sessions and events in real-time instead of discovering them post-trade."
            },
            {
              label: "Trading students",
              text: "Learn session dynamics visually. See why London open often reverses New York close, where volatility concentrates, and how economic data moves markets—through live observation, not theory."
            },
            {
              label: "Multi-timezone traders",
              text: "Managing workflows across New York, London, and Asia sessions requires constant mental switching. One clock shows all three overlaps at once."
            }
          ]
        },
        {
          type: "paragraph",
          text: "If your trading process includes session windows, overlaps, or event-driven volatility, this tool fits seamlessly."
        }
      ]
    },
    
    {
      title: "Why \"visualizing time\" matters",
      content: [
        {
          type: "paragraph",
          text: "Most trading losses don't come from bad setups—they come from bad timing. Executing a solid setup at the wrong time (against a session transition, before a high-impact release, or during low-liquidity periods) turns profit into pain."
        },
        {
          type: "list",
          items: [
            {
              label: "Session transitions",
              text: "Volume and volatility spike predictably as sessions open and close. Miss the timing, miss the move—or get stopped out by whipsaw."
            },
            {
              label: "Overlaps = volatility windows",
              text: "When two or three sessions trade simultaneously, volume surges and spreads tighten. Most profitable scalps and swings happen here."
            },
            {
              label: "Economic catalysts",
              text: "A strong setup can become a trap if a high-impact release fires 2 minutes into your trade. You either survive the spike or get liquidated."
            }
          ]
        },
        {
          type: "paragraph",
          text: "Time 2 Trade answers the critical question in real-time: \"Is this the right time to execute?\""
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
      title: "Built for speed—because your edge is timing",
      content: [
        {
          type: "paragraph",
          text: "In intraday trading, every second counts. Time 2 Trade loads instantly, works offline, and installs as a web app (PWA) so you can get your answer before the candle closes. No spinning wheels, no lag—just real-time session and event data at your fingertips."
        },
        {
          type: "list",
          items: [
            {
              label: "Sub-1-second clock updates",
              text: "See exact countdown to session transitions and economic releases in real-time."
            },
            {
              label: "Works on phone and desktop",
              text: "Check session status from anywhere—between trades, pre-market, post-trade analysis."
            },
            {
              label: "Installs as a native app",
              text: "One tap to launch from your home screen, no browser tabs needed."
            }
          ]
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
      title: "Ready to see your trading day clearly?",
      content: [
        {
          type: "paragraph",
          text: "Open the app now and answer three questions in seconds: What session am I in? What's the next event? Is it safe to trade right now? Start making timing-based decisions, not guesses."
        }
      ]
    }
  ]
};

/**
 * SEO Metadata for About Page
 */
export const aboutMeta = {
  title: "About Time 2 Trade | New York-Time Trading Focus",
  description: "Why Time 2 Trade exists: New York-time-first session clock plus a Forex Factory economic calendar for futures and forex day traders.",
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
