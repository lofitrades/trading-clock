/**
 * pages/terms.page.jsx
 *
 * Purpose: Terms & Conditions page describing acceptable use, disclaimers,
 * and AdSense disclosure required for Time 2 Trade.
 * 
 * Changelog:
 * v1.2.0 - 2026-01-24 - Phase 2 i18n migration: Added useTranslation hook, converted all strings to i18n keys (terms, common namespaces)
 * v1.1.0 - 2026-01-22 - BEP upgrade: Expanded acceptable use, added data accuracy disclaimers, clarified account responsibilities, tightened AdSense language
 * v1.0.1 - 2026-01-16 - Updated primary CTA to /clock
 * v1.0.0 - 2026-01-07 - Initial implementation with trading and advertising disclaimers
 */

import { useTranslation } from 'react-i18next';

const siteUrl = 'https://time2.trade';
const ogImage = `${siteUrl}/Time2Trade_SEO_Meta_5.PNG`;
const lastUpdated = 'January 22, 2026';

const termsSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms & Conditions | Time 2 Trade',
    url: `${siteUrl}/terms`,
    description:
        'Terms & Conditions for Time 2 Trade, including acceptable use, disclaimers, third-party data notice, and advertising disclosure.',
};

// eslint-disable-next-line react-refresh/only-export-components
export const documentProps = {
    title: 'Terms & Conditions | Time 2 Trade',
    description:
        'Read the Time 2 Trade Terms & Conditions, acceptable use rules, disclaimers, and advertising disclosures.',
    canonical: `${siteUrl}/terms`,
    robots: 'index,follow',
    ogImage,
    structuredData: [termsSchema],
};

export default function Page() {
    const { t } = useTranslation();
    
    const items = [
        { titleKey: 'terms:items.item1.title', textKey: 'terms:items.item1.text' },
        { titleKey: 'terms:items.item2.title', textKey: 'terms:items.item2.text' },
        { titleKey: 'terms:items.item3.title', textKey: 'terms:items.item3.text' },
        { titleKey: 'terms:items.item4.title', textKey: 'terms:items.item4.text' },
        { titleKey: 'terms:items.item5.title', textKey: 'terms:items.item5.text' },
        { titleKey: 'terms:items.item6.title', textKey: 'terms:items.item6.text' },
        { titleKey: 'terms:items.item7.title', textKey: 'terms:items.item7.text' },
        { titleKey: 'terms:items.item8.title', textKey: 'terms:items.item8.text' },
        { titleKey: 'terms:items.item9.title', textKey: 'terms:items.item9.text' },
        { titleKey: 'terms:items.item10.title', textKey: 'terms:items.item10.text' },
        { titleKey: 'terms:items.item11.title', textKey: 'terms:items.item11.text' },
        { titleKey: 'terms:items.item12.title', textKey: 'terms:items.item12.text' },
        { titleKey: 'terms:items.item13.title', textKey: 'terms:items.item13.text' },
        { titleKey: 'terms:items.item14.title', textKey: 'terms:items.item14.text' },
        { titleKey: 'terms:items.item15.title', textKey: 'terms:items.item15.text' },
    ];

    return (
        <div className="page-shell__max" role="main">
            <header className="header" aria-label="Terms navigation">
                <div className="logo" aria-label="Time 2 Trade">
                    <span className="logo__dot" aria-hidden="true" />
                    <span>Time 2 Trade</span>
                </div>
                <nav className="nav">
                    <a href="/clock">{t('common:nav.openClock')}</a>
                    <a href="/">{t('common:nav.home')}</a>
                </nav>
            </header>

            <section className="section" aria-labelledby="terms-heading">
                <p className="badge" aria-hidden="true">{t('terms:badge')}</p>
                <h1 id="terms-heading" className="heading-xl">{t('terms:heading')}</h1>
                <p className="text-lead" style={{ marginBottom: '8px' }}>
                    {t('common:labels.lastUpdated', { date: lastUpdated })}
                </p>
                <p className="text-lead">
                    {t('terms:intro')}
                </p>
            </section>

            <section className="section" aria-labelledby="terms-list">
                <h2 id="terms-list" className="heading-lg">{t('terms:keyTermsHeading')}</h2>
                <div className="feature-grid">
                    {items.map((item) => (
                        <div className="card" key={item.titleKey} style={{ padding: '16px' }}>
                            <h3 className="heading-md">{t(item.titleKey)}</h3>
                            <p className="text-lead" style={{ margin: 0, fontSize: '1rem' }}>
                                {t(item.textKey)}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="section" aria-labelledby="cta">
                <h2 id="cta" className="heading-lg">{t('terms:ctaHeading')}</h2>
                <p className="text-lead">
                    {t('terms:ctaText')}
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <a className="btn btn-primary" href="/clock" aria-label={t('terms:openClockAriaLabel')}>
                        {t('common:nav.openClock')}
                    </a>
                    <a className="btn btn-secondary" href="/privacy" aria-label={t('terms:privacyPolicyAriaLabel')}>
                        {t('terms:privacyPolicy')}
                    </a>
                </div>
            </section>

            <footer className="footer" aria-label="Footer">
                <div
                    className="page-shell__max"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        alignItems: 'center',
                    }}
                >
                    <div className="logo" aria-label="Time 2 Trade footer">
                        <span className="logo__dot" aria-hidden="true" />
                        <span>Time 2 Trade</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a className="btn btn-secondary" href="/privacy">
                            {t('terms:privacyPolicy')}
                        </a>
                        <a className="btn btn-secondary" href="/">
                            {t('common:nav.home')}
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
