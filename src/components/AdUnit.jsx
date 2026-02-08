/**
 * src/components/AdUnit.jsx
 *
 * Purpose: Reusable BEP Google AdSense ad component for blog pages.
 * Handles lazy loading via IntersectionObserver, CLS prevention with
 * reserved height, consent gating (GDPR), and non-personalized ad fallback.
 *
 * Supports 3 ad formats:
 * - display: Responsive display ads (blog list, post bottom)
 * - in-article: Fluid in-article ads (mid-post content)
 * - multiplex: Grid-based recommendation ads (future use)
 *
 * Changelog:
 * v1.0.0 - 2026-02-06 - Phase 7: Initial implementation
 */

import { useEffect, useRef, useState, memo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { hasAdConsent, subscribeConsent } from '../utils/consent';
import { ADS_CLIENT_ID } from '../constants/adSlots';

/**
 * Ensures the AdSense script is loaded exactly once.
 * Reuses the global script tag already injected by index.html deferred loader,
 * or creates one if not yet present (e.g., direct page load).
 */
const ensureAdSenseScript = () => {
    if (typeof window === 'undefined') return;

    // Check if already loaded by index.html deferred loader
    const existing = document.querySelector(
        `script[src*="pagead2.googlesyndication.com"][src*="${ADS_CLIENT_ID}"]`
    );
    if (existing) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT_ID}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
};

/**
 * AdUnit — BEP Google AdSense ad component
 *
 * @param {Object} props
 * @param {string} props.slot - Ad slot ID from AD_SLOTS
 * @param {'display'|'in-article'} [props.format='display'] - Ad format type
 * @param {number} [props.minHeight=100] - Min height for CLS prevention (px)
 * @param {string} [props.label] - Optional "Advertisement" label (i18n)
 * @param {Object} [props.sx] - Additional MUI sx styles for wrapper
 */
const AdUnit = memo(function AdUnit({
    slot,
    format = 'display',
    minHeight = 100,
    label,
    sx = {},
}) {
    const containerRef = useRef(null);
    const adPushedRef = useRef(false);
    const [isVisible, setIsVisible] = useState(false);
    const [hasConsent, setHasConsent] = useState(hasAdConsent);

    // Listen for consent changes (user clicks "Allow all" on cookie banner)
    useEffect(() => {
        setHasConsent(hasAdConsent());
        const unsubscribe = subscribeConsent((newStatus) => {
            setHasConsent(newStatus === 'accepted');
        });
        return unsubscribe;
    }, []);

    // Lazy load: only initialize ad when scrolled into viewport
    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px', threshold: 0 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    // Push ad when visible and consent/script ready
    useEffect(() => {
        if (!isVisible || adPushedRef.current) return;

        // Ensure AdSense script is available
        ensureAdSenseScript();

        // Small delay to let script initialize
        const timer = setTimeout(() => {
            if (adPushedRef.current) return;
            try {
                const adsbygoogle = window.adsbygoogle || [];
                // Set non-personalized ads if no full consent
                if (!hasConsent) {
                    adsbygoogle.requestNonPersonalizedAds = 1;
                }
                adsbygoogle.push({});
                adPushedRef.current = true;
            } catch {
                // AdSense may throw if ad already pushed or blocked
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [isVisible, hasConsent]);

    // Build ins element attributes based on format
    const insProps = {
        className: 'adsbygoogle',
        'data-ad-client': ADS_CLIENT_ID,
        'data-ad-slot': slot,
    };

    if (format === 'in-article') {
        insProps.style = { display: 'block', textAlign: 'center' };
        insProps['data-ad-layout'] = 'in-article';
        insProps['data-ad-format'] = 'fluid';
    } else {
        // display (responsive)
        insProps.style = { display: 'block' };
        insProps['data-ad-format'] = 'auto';
        insProps['data-full-width-responsive'] = 'true';
    }

    return (
        <Box
            ref={containerRef}
            sx={{
                minHeight,
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                ...sx,
            }}
            aria-hidden="true"
        >
            {label && (
                <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{
                        mb: 0.5,
                        fontSize: '0.65rem',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                    }}
                >
                    {label}
                </Typography>
            )}
            {isVisible && (
                <ins {...insProps} />
            )}
        </Box>
    );
});

AdUnit.propTypes = {
    slot: PropTypes.string.isRequired,
    format: PropTypes.oneOf(['display', 'in-article']),
    minHeight: PropTypes.number,
    label: PropTypes.string,
    sx: PropTypes.object,
};

export default AdUnit;
