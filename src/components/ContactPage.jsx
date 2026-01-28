/**
 * src/components/ContactPage.jsx
 * 
 * Purpose: Contact page with an accessible form and X link that can render standalone or inside ContactModal; writes submissions to Firestore and validates phone numbers.
 * Key responsibility and main functionality: Render the contact form in standalone or embedded contexts, validate inputs, and submit to Firestore with success feedback.
 * 
 * Changelog:
 * v1.4.0 - 2026-01-27 - Full i18n integration: Replaced all hardcoded strings with t() calls from contact namespace (EN/ES/FR). Added useTranslation hook. SEO meta now generated from i18n translations.
 * v1.3.6 - 2026-01-13 - PostMessage ready signal in embed mode so ContactModal keeps progress until form is ready.
 * v1.3.5 - 2026-01-13 - Skip SEO render in embed mode to slim iframe payload.
 * v1.3.4 - 2026-01-13 - Embed performance tuning; lazy-load country data and Firestore on demand.
 * v1.3.3 - 2026-01-09 - Add explicit titles to contact inputs for better accessibility/UX.
 * v1.3.2 - 2026-01-09 - Add embed mode (?embed=1) to hide non-form header copy and footer links when shown in ContactModal.
 * v1.3.1 - 2026-01-09 - Refine /contact copy and layout to an enterprise UX.
 * v1.3.0 - 2026-01-09 - Add embeddable ContactCard, success state with centered confirmation CTAs, and hide form after submit.
 * v1.2.0 - 2026-01-09 - Remove mailto flow, enforce phone country codes via libphonenumber-js, store phone metadata and message.
 * v1.1.0 - 2026-01-09 - Store to Firestore (contactMessages), add phone country code dropdown, enforce numeric phone, require message, and open mailto to time2tradex@gmail.com.
 * v1.0.0 - 2026-01-09 - Initial implementation with form and X link.
 */

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Alert, Box, Button, Container, Link, MenuItem, Paper, Stack, SvgIcon, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { siX } from 'simple-icons';
import SEO from './SEO';
import { buildSeoMeta } from '../utils/seoMeta';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Link as RouterLink } from 'react-router-dom';

const XIcon = (props) => (
    <SvgIcon viewBox="0 0 24 24" {...props}>
        <path d={siX.path} />
    </SvgIcon>
);

export function ContactCard({ embedded = false, paperSx = undefined }) {
    const theme = useTheme();
    const { user } = useAuth();
    const { t } = useTranslation('contact');

    const [form, setForm] = useState({
        email: '',
        name: '',
        phoneCountry: 'US',
        phone: '',
        message: '',
    });
    const [touched, setTouched] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const readyPostedRef = useRef(false);

    const displayNames = useMemo(() => new Intl.DisplayNames(['en'], { type: 'region' }), []);
    const [countryOptions, setCountryOptions] = useState(() => [{ value: 'US', label: 'United States (+1)', callingCode: '+1' }]);

    useEffect(() => {
        let cancelled = false;
        const loadCountryData = async () => {
            try {
                const [{ getCountries, getCountryCallingCode }] = await Promise.all([
                    import('libphonenumber-js'),
                ]);
                const countries = getCountries();
                const options = countries.map((code) => {
                    const callingCode = getCountryCallingCode(code);
                    const label = `${displayNames.of(code)} (+${callingCode})`;
                    return { value: code, label, callingCode: `+${callingCode}` };
                });
                if (!cancelled && options.length > 0) {
                    setCountryOptions(options);
                }
            } catch (error) {
                console.error('Failed to load country data', error);
            }
        };
        loadCountryData();
        return () => { cancelled = true; };
    }, [displayNames]);

    useEffect(() => {
        if (!embedded) return;
        if (readyPostedRef.current) return;
        // Notify parent modal that the iframe content is ready to display.
        readyPostedRef.current = true;
        const timer = window.setTimeout(() => {
            try {
                window.parent?.postMessage({ type: 'contact-embed-ready' }, window.location.origin);
            } catch {
                // Swallow postMessage errors silently; fallback timer in ContactModal will handle display.
            }
        }, 0);
        return () => {
            clearTimeout(timer);
        };
    }, [embedded, countryOptions.length]);

    const emailError = useMemo(() => {
        if (!touched.email) return '';
        if (!form.email) return 'Email is required';
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(form.email) ? '' : 'Enter a valid email address';
    }, [form.email, touched.email]);

    const messageError = useMemo(() => {
        if (!touched.message) return '';
        if (!form.message || form.message.trim().length === 0) return 'Message is required';
        return '';
    }, [form.message, touched.message]);

    const onChange = useCallback((e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const digitsOnly = value.replace(/[^\d]/g, '');
            setForm((prev) => ({ ...prev, phone: digitsOnly }));
            return;
        }
        setForm((prev) => ({ ...prev, [name]: value }));
    }, []);

    const onBlur = useCallback((e) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setSubmitError('');
        const hasEmailIssue = !form.email || Boolean(emailError);
        const hasMessageIssue = !form.message || Boolean(messageError);
        if (hasEmailIssue || hasMessageIssue) {
            setTouched((prev) => ({ ...prev, email: true, message: true }));
            return;
        }

        try {
            setSubmitting(true);
            const ua = navigator.userAgent;
            const language = navigator.language;
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            const referrer = document.referrer || '';
            const path = window.location.pathname || '/contact';

            const [{ getCountryCallingCode }, { addDoc, collection, serverTimestamp }] = await Promise.all([
                import('libphonenumber-js'),
                import('firebase/firestore'),
            ]);

            const callingCode = getCountryCallingCode(form.phoneCountry);
            const phoneE164 = `+${callingCode}${form.phone}`.replace(/\s+/g, '');

            const payload = {
                createdAt: serverTimestamp(),
                status: 'new',
                source: 'web-contact',
                isAuthenticated: Boolean(user),
                userId: user?.uid || null,
                authEmail: user?.email || null,
                email: form.email,
                name: form.name || '',
                phoneCountry: form.phoneCountry,
                phoneCallingCode: `+${callingCode}`,
                phoneNumber: form.phone,
                phoneE164,
                message: form.message,
                userAgent: ua,
                language,
                timezone,
                referrer,
                path,
            };

            await addDoc(collection(db, 'contactMessages'), payload);

            setSubmitted(true);
        } catch (error) {
            console.error('Contact submit failed', error);
            setSubmitError(t('form.submitError'));
        } finally {
            setSubmitting(false);
        }
    }, [form, emailError, messageError, user, t]);

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2.5, sm: 3.25 },
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.96)',
                backgroundImage: 'linear-gradient(160deg, rgba(255,255,255,0.98), rgba(242,246,255,0.9))',
                boxShadow: '0 26px 78px rgba(15,23,42,0.06), 0 4px 18px rgba(15,23,42,0.04)',
                border: '1px solid rgba(255,255,255,0.7)',
                outline: '1px solid rgba(15,23,42,0.04)',
                backdropFilter: 'blur(12px)',
                ...(paperSx || {}),
            }}
        >
            {submitted ? (
                <Stack spacing={2.5} alignItems="center" textAlign="center" sx={{ py: { xs: 3, sm: 4 } }}>
                    <CheckCircleOutlineIcon color="primary" sx={{ fontSize: 48 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {t('success.heading')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#475569', maxWidth: 520 }}>
                        {t('success.message')}
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%', maxWidth: 520 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <Button
                            component={RouterLink}
                            to="/calendar"
                            variant="contained"
                            color="primary"
                            sx={{ flex: 1, py: 1.15 }}
                        >
                            {t('success.calendarButton')}
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/"
                            variant="outlined"
                            color="primary"
                            sx={{ flex: 1, py: 1.15 }}
                        >
                            {t('success.homeButton')}
                        </Button>
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems="center">
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                            {t('success.preferQuickDm')}
                        </Typography>
                        <Link
                            href="https://x.com/time2_trade"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t('success.xAriaLabel')}
                            sx={{ display: 'inline-flex', alignItems: 'center' }}
                        >
                            <XIcon sx={{ fontSize: 22, color: theme.palette.text.primary }} />
                            <Typography variant="body2" sx={{ ml: 0.75, fontWeight: 700 }}>
                                {t('success.xHandle')}
                            </Typography>
                        </Link>
                    </Stack>
                </Stack>
            ) : (
                <Box component="form" noValidate onSubmit={handleSubmit}>
                    <Stack spacing={2.1}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
                                {t('form.heading')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#475569', mt: 0.6 }}>
                                {t('form.subheading')}
                            </Typography>
                        </Box>

                        {submitError && (
                            <Alert severity="error">{submitError}</Alert>
                        )}

                        <Typography variant="caption" sx={{ color: '#475569' }}>
                            {t('form.requiredNotice')}
                        </Typography>

                        <TextField
                            label={t('form.email.label')}
                            name="email"
                            type="email"
                            required
                            value={form.email}
                            onChange={onChange}
                            onBlur={onBlur}
                            error={Boolean(emailError)}
                            helperText={emailError || t('form.email.helperText')}
                            fullWidth
                            inputProps={{ inputMode: 'email', autoComplete: 'email', title: t('form.email.label') }}
                        />
                        <TextField
                            label={t('form.name.label')}
                            name="name"
                            value={form.name}
                            onChange={onChange}
                            onBlur={onBlur}
                            fullWidth
                            inputProps={{ autoComplete: 'name', title: t('form.name.title') }}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                            <TextField
                                select
                                label={t('form.country.label')}
                                name="phoneCountry"
                                value={form.phoneCountry}
                                onChange={onChange}
                                onBlur={onBlur}
                                sx={{ width: { xs: '100%', sm: 240 } }}
                                inputProps={{ title: t('form.country.title') }}
                            >
                                {countryOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label={t('form.phone.label')}
                                name="phone"
                                value={form.phone}
                                onChange={onChange}
                                onBlur={onBlur}
                                fullWidth
                                inputProps={{ inputMode: 'numeric', autoComplete: 'tel', pattern: '[0-9]*', title: t('form.phone.title') }}
                                helperText={t('form.phone.helperText')}
                            />
                        </Stack>
                        <TextField
                            label={t('form.message.label')}
                            name="message"
                            required
                            value={form.message}
                            onChange={onChange}
                            onBlur={onBlur}
                            fullWidth
                            multiline
                            minRows={4}
                            error={Boolean(messageError)}
                            helperText={messageError || t('form.message.helperText')}
                            inputProps={{ title: t('form.message.label') }}
                        />

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                            <Button type="submit" variant="contained" color="primary" sx={{ px: 3, py: 1.25 }} disabled={submitting} fullWidth={!embedded}>
                                {submitting ? t('form.submitButtonLoading') : t('form.submitButton')}
                            </Button>
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#475569' }}>
                                {t('form.preferDm')}
                            </Typography>
                            <Link
                                href="https://x.com/time2_trade"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={t('form.xAriaLabel')}
                                sx={{ display: 'inline-flex', alignItems: 'center' }}
                            >
                                <XIcon sx={{ fontSize: 22, color: theme.palette.text.primary }} />
                                <Typography variant="body2" sx={{ ml: 0.75, fontWeight: 700 }}>
                                    {t('form.xHandle')}
                                </Typography>
                            </Link>
                        </Stack>

                        <Typography variant="caption" sx={{ color: '#475569' }}>
                            {t('form.disclaimer')}
                        </Typography>
                    </Stack>
                </Box>
            )}
        </Paper>
    );
}

ContactCard.propTypes = {
    embedded: PropTypes.bool,
    paperSx: PropTypes.object,
};

export default function ContactPage() {
    const { t } = useTranslation('contact');
    const isEmbedded = useMemo(() => {
        if (typeof window === 'undefined') return false;
        const params = new URLSearchParams(window.location.search || '');
        if (params.get('embed') === '1') return true;
        return params.has('embed');
    }, []);

    const contactMeta = useMemo(() => buildSeoMeta({
        title: t('seo.title'),
        description: t('seo.description'),
        path: '/contact',
        keywords: 'contact, support, help, time 2 trade, trading clock, economic calendar',
    }), [t]);

    return (
        <Box
            component="main"
            sx={{
                bgcolor: isEmbedded ? 'background.default' : '#f9fafb',
                color: '#0f172a',
                minHeight: isEmbedded ? '100dvh' : '100vh',
                // Desktop: use a viewport-fit layout (no page scroll)
                height: isEmbedded ? '100dvh' : { md: 'var(--t2t-vv-height, 100dvh)' },
                overflowY: isEmbedded ? 'hidden' : { xs: 'auto', md: 'hidden' },
                display: isEmbedded ? 'flex' : { md: 'flex' },
                flexDirection: isEmbedded ? 'column' : { md: 'column' },
                justifyContent: isEmbedded ? 'center' : undefined,
                alignItems: isEmbedded ? 'center' : undefined,
                px: isEmbedded ? 1.5 : undefined,
            }}
        >
            {!isEmbedded && <SEO {...contactMeta} />}

            <Container
                maxWidth="md"
                sx={{
                    py: isEmbedded ? { xs: 2, sm: 2.5, md: 2.5 } : { xs: 4, sm: 6, md: 4 },
                    // Desktop: flex container that fits viewport height
                    height: isEmbedded ? 'auto' : { md: '100%' },
                    display: isEmbedded ? 'flex' : { md: 'flex' },
                    flexDirection: isEmbedded ? 'column' : { md: 'column' },
                    minHeight: isEmbedded ? 0 : { md: 0 },
                    justifyContent: isEmbedded ? 'center' : undefined,
                    alignItems: isEmbedded ? 'center' : undefined,
                }}
            >
                <Stack spacing={3} sx={{ flex: 1, minHeight: 0, width: '100%', maxWidth: isEmbedded ? 720 : '100%' }}>
                    {!isEmbedded && (
                        <Box>
                            <Typography variant="overline" sx={{ color: '#475569', fontWeight: 800, letterSpacing: '0.08em' }}>
                                {t('page.overline')}
                            </Typography>
                            <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.15rem' }, letterSpacing: '-0.02em' }}>
                                {t('page.heading')}
                            </Typography>
                            <Typography variant="body1" sx={{ color: '#475569', mt: 1, maxWidth: 680 }}>
                                {t('page.description')}
                            </Typography>
                        </Box>
                    )}

                    <Box
                        sx={{
                            // Desktop: keep the card area within viewport (internal scroll if needed)
                            flex: 1,
                            minHeight: 0,
                            display: 'flex',
                            alignItems: isEmbedded ? 'center' : { md: 'center' },
                            justifyContent: 'center',
                            width: '100%',
                        }}
                    >
                        <ContactCard
                            embedded={isEmbedded}
                            paperSx={{
                                width: '100%',
                                maxWidth: 760,
                                height: isEmbedded ? 'auto' : undefined,
                                maxHeight: isEmbedded
                                    ? { xs: 'min(760px, calc(100dvh - 120px))', sm: 'min(820px, calc(100dvh - 140px))', md: 'min(880px, calc(100dvh - 160px))' }
                                    : { md: 'calc(var(--t2t-vv-height, 100dvh) - 280px)' },
                                overflowY: isEmbedded ? 'auto' : { md: 'auto' },
                                m: isEmbedded ? '0 auto' : 0,
                            }}
                        />
                    </Box>

                    {!isEmbedded && (
                        <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                            <Link href="/" underline="hover" sx={{ fontWeight: 700 }}>
                                {t('footer.home')}
                            </Link>
                            <Link href="/calendar" underline="hover" sx={{ fontWeight: 700 }}>
                                {t('footer.calendar')}
                            </Link>
                            <Link href="/privacy" underline="hover" sx={{ fontWeight: 700 }}>
                                {t('footer.privacy')}
                            </Link>
                            <Link href="/terms" underline="hover" sx={{ fontWeight: 700 }}>
                                {t('footer.terms')}
                            </Link>
                        </Stack>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}
