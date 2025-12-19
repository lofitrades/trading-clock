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
  subtitle: "Visual trading intelligence platform for futures and forex day traders.",
  sections: [
    {
      title: null,
      content: [
        {
          type: "paragraph",
          text: "Time 2 Trade is a visual trading intelligence platform designed specifically for futures and forex day traders who need to stay aligned with global market sessions across different timezones. Our dual-circle session visualization interface makes it easy to see when markets are active, track high-impact economic events, and plan your trading day with precision."
        }
      ]
    },
    
    {
      title: "What Makes Time 2 Trade Different",
      content: [
        {
          type: "paragraph",
          text: "Unlike traditional world clocks or generic market timers, Time 2 Trade is a comprehensive intelligence platform that gives you a complete picture of the trading day in one glance. Our unique dual-circle visualization interface shows AM hours on the inner ring and PM hours on the outer ring, creating an intuitive 24-hour view that matches how professional traders think about market sessions—overlaid with live economic events and timezone-aware insights."
        },
        {
          type: "paragraph",
          text: "Whether you're tracking the London open, New York session, or Asian market hours, our clock adapts to your timezone automatically. You'll always know exactly when each session starts, ends, and how much time remains."
        }
      ]
    },
    
    {
      title: "Key Features",
      content: [
        {
          type: "list",
          items: [
            {
              label: "Visual Session Intelligence",
              text: "Dual-circle interface visualizes all eight major trading sessions simultaneously with AM sessions on the inner ring and PM sessions on the outer ring—go beyond simple time tracking"
            },
            {
              label: "Live Economic Events Overlay",
              text: "High-impact economic events displayed directly on your session visualization, sourced from the same professional-grade data that powers MetaTrader platforms"
            },
            {
              label: "Timezone Intelligence",
              text: "Automatic conversion to your local timezone with support for traders in any region around the world"
            },
            {
              label: "Cloud Sync Settings",
              text: "Create a free account to save your preferences and access them from any device, anywhere"
            },
            {
              label: "Customizable Sessions",
              text: "Adjust session times, colors, and labels to match your personal trading strategy"
            },
            {
              label: "Session Alerts",
              text: "Visual indicators show you which session is currently active and when the next one begins"
            },
            {
              label: "Digital Clock Display",
              text: "Quick reference for current time in your selected timezone"
            },
            {
              label: "Responsive Design",
              text: "Works seamlessly on desktop, tablet, and mobile devices"
            }
          ]
        }
      ]
    },
    
    {
      title: "How to Use Time 2 Trade",
      content: [
        {
          type: "paragraph",
          text: "<strong>Getting Started:</strong> Simply visit time2.trade and the platform immediately displays session intelligence in your local timezone. No setup required. The default configuration shows popular trading sessions like London, New York, Tokyo, and Sydney with live economic events."
        },
        {
          type: "paragraph",
          text: "<strong>Customizing Your Intelligence:</strong> Click the settings icon to adjust session times, choose different colors, rename sessions, or turn specific sessions on and off. Configure up to eight custom sessions to match your trading strategy and filter economic events by impact level and currency pairs."
        },
        {
          type: "paragraph",
          text: "<strong>Viewing Economic Events:</strong> Toggle the economic events overlay to see when major news releases are scheduled. Filter by currency pairs that matter to your trading strategy, and click any event to see detailed descriptions and historical impact."
        },
        {
          type: "paragraph",
          text: "<strong>Changing Timezones:</strong> Use the timezone selector at the bottom of the screen to view market sessions from any timezone perspective. This is especially helpful when coordinating with traders in other regions or planning travel."
        },
        {
          type: "paragraph",
          text: "<strong>Saving Your Setup:</strong> Create a free account to automatically sync your settings across all your devices. Your session configurations, color preferences, and timezone choices are stored securely in the cloud."
        }
      ]
    },
    
    {
      title: "Who Uses Time 2 Trade",
      content: [
        {
          type: "paragraph",
          text: "Time 2 Trade is built for active day traders who work with futures contracts, forex currency pairs, and other instruments that trade on session-based schedules. It's particularly useful for traders who follow specific market sessions like ICT killzones, London session strategies, or New York open setups."
        },
        {
          type: "paragraph",
          text: "Many traders use Time 2 Trade alongside their charting platforms as a dedicated intelligence layer—maintaining session awareness and event tracking without cluttering their trading workspace. The clean, minimal design keeps your focus where it matters while providing the contextual intelligence you need to time your entries and exits."
        }
      ]
    },
    
    {
      title: "Technology and Data Sources",
      content: [
        {
          type: "paragraph",
          text: "Time 2 Trade is powered by modern web technology including React and Material Design components for a fast, responsive intelligence platform. Economic events data comes from the JBlanked News Calendar API, which aggregates information from the same professional MQL5 source used by MetaTrader platforms worldwide, ensuring you have the same event intelligence as institutional traders."
        },
        {
          type: "paragraph",
          text: "Your settings are stored using Firebase cloud infrastructure with bank-level encryption and industry-standard security practices. We never sell your data or show you ads that track your behavior."
        }
      ]
    },
    
    {
      title: "Free to Use, Built by Traders",
      content: [
        {
          type: "paragraph",
          text: "Time 2 Trade is completely free to use with all intelligence features available to anyone who creates an account. We built this platform because we needed it ourselves, and we believe every trader should have access to professional-grade session intelligence and event tracking without paying monthly subscription fees."
        },
        {
          type: "paragraph",
          text: "The project is actively maintained by the Time 2 Trade team. We regularly add new features based on feedback from the trading community and keep our economic events data synchronized daily."
        }
      ]
    },
    
    {
      title: "Get Started Today",
      content: [
        {
          type: "paragraph",
          text: "No credit card required. No trial periods. No hidden fees. Just create a free account and start leveraging visual trading intelligence with the session insights and event awareness you need to trade with confidence."
        },
        {
          type: "paragraph",
          text: "Follow us on <a href=\"https://x.com/time2_trade\" target=\"_blank\" rel=\"noopener noreferrer\">@time2_trade</a> for updates, tips, and trading insights from our community."
        }
      ]
    }
  ]
};

/**
 * SEO Metadata for About Page
 */
export const aboutMeta = {
  title: "About Time 2 Trade - Visual Trading Intelligence Platform",
  description: "Time 2 Trade is a visual trading intelligence platform for futures and forex day traders. Track global market sessions, high-impact economic events, and timezone-aware insights with our unique dual-circle visualization.",
  keywords: "trading clock, market sessions, economic events, forex trading, futures trading, timezone converter, trading intelligence, ICT killzones, London session, New York session",
  canonical: "https://time2.trade/about",
  ogType: "website",
  ogImage: "https://time2.trade/Time2Trade_SEO_Meta_2.PNG",
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
  "description": "Visual trading intelligence platform for futures and forex day traders featuring dual-circle session visualization, live economic events, and timezone-aware insights.",
  "url": "https://time2.trade",
  "creator": {
    "@type": "Organization",
    "name": "Lofi Trades",
    "url": "https://time2.trade"
  },
  "featureList": [
    "Dual-circle session visualization",
    "Live economic events overlay",
    "Timezone intelligence",
    "Cloud sync settings",
    "Customizable trading sessions",
    "Session alerts",
    "Digital clock display",
    "Responsive design"
  ],
  "screenshot": "https://time2.trade/Time2Trade_SEO_Meta_2.PNG"
};
