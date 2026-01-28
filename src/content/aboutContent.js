/**
 * src/content/aboutContent.js
 *
 * Purpose: Configuration for About page and Settings drawer content.
 * v2.0.0 - CRITICAL BEP REFACTOR: Converted from hardcoded strings to i18n key structure.
 * All content now uses translation keys (about:sections.*) for full multi-language support.
 * ContentBlock components render text via useTranslation() for dynamic language switching.
 * 
 * Key Change: Instead of exporting hardcoded copy like:
 *   { label: "Session clock", text: "A visual 24-hour clock..." }
 * 
 * Now exports i18n key references:
 *   { labelKey: "aboutKey.path", textKey: "aboutKey.path" }
 * 
 * AboutPage.jsx and SettingsSidebar2.jsx use useTranslation('about') to look up keys.
 * 
 * Changelog:
 * v2.0.0 - 2026-01-27 - CRITICAL BEP: Full i18n refactor. Removed all hardcoded strings.
 *                       Export key references only. Components use t() to translate.
 *                       Matches LanguageSwitcher.jsx best practice pattern.
 *                       Updated public/locales/en|es|fr/about.json with full content.
 * v1.4.0 - 2026-01-22 - Previous: Hardcoded strings (no longer used)
 */

/**
 * About Content Configuration - Now i18n Key References
 * 
 * Structure explains which keys to use for translation lookup.
 * Components receive this config and use useTranslation('about') to translate.
 * 
 * Example:
 *   aboutContent.sections.intro.content[0]
 *   Returns: { type: 'paragraph', keyPath: 'sections.intro.paragraphs.0' }
 *   Component does: t('sections.intro.paragraphs.0') → loads translated text
 */
export const aboutContent = {
  title: 'title',
  subtitle: 'subtitle',
  footer: {
    questionsKey: 'footer.questions',
    contactUsKey: 'footer.contactUs',
  },
  sections: [
    {
      // Intro section - no title
      title: null,
      titleKey: null,
      content: [
        {
          type: 'paragraph',
          key: 'sections.intro.paragraphs.0',
        },
        {
          type: 'paragraph',
          key: 'sections.intro.paragraphs.1',
        },
      ],
    },
    {
      title: 'sections.whatItDoes.title',
      content: [
        {
          type: 'paragraph',
          key: 'sections.whatItDoes.intro',
        },
        {
          type: 'list',
          items: [
            { labelKey: 'sections.whatItDoes.features.0.label', textKey: 'sections.whatItDoes.features.0.text' },
            { labelKey: 'sections.whatItDoes.features.1.label', textKey: 'sections.whatItDoes.features.1.text' },
            { labelKey: 'sections.whatItDoes.features.2.label', textKey: 'sections.whatItDoes.features.2.text' },
            { labelKey: 'sections.whatItDoes.features.3.label', textKey: 'sections.whatItDoes.features.3.text' },
            { labelKey: 'sections.whatItDoes.features.4.label', textKey: 'sections.whatItDoes.features.4.text' },
          ],
        },
        {
          type: 'paragraph',
          key: 'sections.whatItDoes.closing',
        },
      ],
    },
    {
      title: 'sections.audience.title',
      content: [
        {
          type: 'list',
          items: [
            { labelKey: 'sections.audience.items.0.label', textKey: 'sections.audience.items.0.text' },
            { labelKey: 'sections.audience.items.1.label', textKey: 'sections.audience.items.1.text' },
            { labelKey: 'sections.audience.items.2.label', textKey: 'sections.audience.items.2.text' },
            { labelKey: 'sections.audience.items.3.label', textKey: 'sections.audience.items.3.text' },
            { labelKey: 'sections.audience.items.4.label', textKey: 'sections.audience.items.4.text' },
          ],
        },
        {
          type: 'paragraph',
          key: 'sections.audience.closing',
        },
      ],
    },
    {
      title: 'sections.whyTime.title',
      content: [
        {
          type: 'paragraph',
          key: 'sections.whyTime.intro',
        },
        {
          type: 'list',
          items: [
            { labelKey: 'sections.whyTime.items.0.label', textKey: 'sections.whyTime.items.0.text' },
            { labelKey: 'sections.whyTime.items.1.label', textKey: 'sections.whyTime.items.1.text' },
            { labelKey: 'sections.whyTime.items.2.label', textKey: 'sections.whyTime.items.2.text' },
          ],
        },
        {
          type: 'paragraph',
          key: 'sections.whyTime.closing',
        },
      ],
    },
    {
      title: 'sections.dataSource.title',
      content: [
        {
          type: 'paragraph',
          key: 'sections.dataSource.intro',
        },
        {
          type: 'list',
          items: [
            { labelKey: 'sections.dataSource.items.0.label', textKey: 'sections.dataSource.items.0.text' },
            { labelKey: 'sections.dataSource.items.1.label', textKey: 'sections.dataSource.items.1.text' },
            { labelKey: 'sections.dataSource.items.2.label', textKey: 'sections.dataSource.items.2.text' },
          ],
        },
      ],
    },
    {
      title: 'sections.privacy.title',
      content: [
        {
          type: 'paragraph',
          key: 'sections.privacy.intro',
        },
        {
          type: 'heading',
          key: 'sections.privacy.whatWeDo.title',
        },
        {
          type: 'list',
          items: [
            { labelKey: 'sections.privacy.whatWeDo.items.0.label', textKey: 'sections.privacy.whatWeDo.items.0.text' },
            { labelKey: 'sections.privacy.whatWeDo.items.1.label', textKey: 'sections.privacy.whatWeDo.items.1.text' },
          ],
        },
        {
          type: 'heading',
          key: 'sections.privacy.whatWeDoNot.title',
        },
        {
          type: 'list',
          items: [
            { labelKey: 'sections.privacy.whatWeDoNot.items.0.label', textKey: 'sections.privacy.whatWeDoNot.items.0.text' },
            { labelKey: 'sections.privacy.whatWeDoNot.items.1.label', textKey: 'sections.privacy.whatWeDoNot.items.1.text' },
            { labelKey: 'sections.privacy.whatWeDoNot.items.2.label', textKey: 'sections.privacy.whatWeDoNot.items.2.text' },
          ],
        },
        {
          type: 'heading',
          key: 'sections.privacy.principles.title',
        },
        {
          type: 'list',
          items: [
            { labelKey: 'sections.privacy.principles.items.0.label', textKey: 'sections.privacy.principles.items.0.text' },
            { labelKey: 'sections.privacy.principles.items.1.label', textKey: 'sections.privacy.principles.items.1.text' },
            { labelKey: 'sections.privacy.principles.items.2.label', textKey: 'sections.privacy.principles.items.2.text' },
          ],
        },
      ],
    },
    {
      title: 'sections.principles.title',
      content: [
        {
          type: 'paragraph',
          key: 'sections.principles.intro',
        },
        {
          type: 'list',
          items: [
            { labelKey: 'sections.principles.items.0.label', textKey: 'sections.principles.items.0.text' },
            { labelKey: 'sections.principles.items.1.label', textKey: 'sections.principles.items.1.text' },
            { labelKey: 'sections.principles.items.2.label', textKey: 'sections.principles.items.2.text' },
          ],
        },
      ],
    },
    {
      title: 'sections.founder.title',
      content: [
        {
          type: 'paragraph',
          key: 'sections.founder.paragraphs.0',
        },
        {
          type: 'paragraph',
          key: 'sections.founder.paragraphs.1',
        },
      ],
    },
    {
      title: 'sections.cta.title',
      content: [
        {
          type: 'paragraph',
          key: 'sections.cta.text',
        },
      ],
    },
  ],
};

/**
 * SEO Metadata for About Page
 * BEP NOTE: Meta content is NOT translated (SEO best practice).
 * English copy only; Google crawlers expect EN metadata for x-default variant.
 * Language-specific variants (es, fr) still serve this same English metadata.
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
 * BEP NOTE: Structured data is NOT translated (SEO best practice).
 * English copy only; search engines index the x-default variant.
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
