/**
 * src/components/ContactPage.jsx
 * 
 * Purpose: Simple, mobile-first contact page with an accessible form (email*, name, phone, message)
 * and a direct link to our X account for fast responses. Uses SEO helpers and MUI v7.
 * Writes submissions to Firestore for follow-up and support workflows.
 * 
 * Changelog:
 * v1.3.1 - 2026-01-09 - Refine /contact copy + layout to an Airbnb-like enterprise UX.
 * v1.3.0 - 2026-01-09 - Add embeddable ContactCard, success state with centered confirmation CTA buttons, and hide form after submit.
 * v1.2.0 - 2026-01-09 - Remove mailto flow, enforce phone country codes via libphonenumber-js, store phone metadata and message.
 * v1.1.0 - 2026-01-09 - Store to Firestore (contactMessages), add phone country code dropdown, enforce numeric phone, require message, and open mailto to time2tradex@gmail.com.
 * v1.0.0 - 2026-01-09 - Initial implementation with form and X link.
 */

import { useMemo, useState, useCallback } from 'react';
import { Alert, Box, Button, Container, Link, MenuItem, Paper, Stack, SvgIcon, TextField, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { siX } from 'simple-icons';
import SEO from './SEO';
import { buildSeoMeta } from '../utils/seoMeta';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Link as RouterLink } from 'react-router-dom';

const contactMeta = buildSeoMeta({
    title: 'Contact | Time 2 Trade',
    description: 'Contact Time 2 Trade. Send a message for support, feedback, or questions. Prefer DM? Reach us on X.',
    path: '/contact',
    keywords: 'contact, support, help, time 2 trade, trading clock, economic calendar',
});

const XIcon = (props) => (
    <SvgIcon viewBox="0 0 24 24" {...props}>
        <path d={siX.path} />
    </SvgIcon>
);

export function ContactCard({ embedded = false, paperSx = undefined }) {
    const theme = useTheme();
    const { user } = useAuth();

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

    const displayNames = useMemo(() => new Intl.DisplayNames(['en'], { type: 'region' }), []);

    const countryOptions = useMemo(() => {
        const countries = getCountries();
        return countries
            .map((code) => {
                const name = displayNames.of(code) || code;
                const calling = getCountryCallingCode(code);
                return { value: code, label: `${name} (+${calling})`, callingCode: `+${calling}` };
            })
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [displayNames]);

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
        } catch (err) {
            console.error('Contact submit failed', err);
            setSubmitError('Sorry, something went wrong. Please try again or DM us on X.');
        } finally {
            setSubmitting(false);
        }
    }, [form, emailError, messageError, user]);

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
                        Thanks — we got it
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#475569', maxWidth: 520 }}>
                        We’ll follow up using the email you provided. In the meantime, you can jump into the calendar or head back home.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%', maxWidth: 520 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <Button
                            component={RouterLink}
                            to="/calendar"
                            variant="contained"
                            color="primary"
                            sx={{ flex: 1, py: 1.15 }}
                        >
                            Go to Calendar
                        </Button>
                        <Button
                            component={RouterLink}
                            to="/"
                            variant="outlined"
                            color="primary"
                            sx={{ flex: 1, py: 1.15 }}
                        >
                            Go to Home
                        </Button>
                    </Stack>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems="center">
                        <Typography variant="body2" sx={{ color: '#475569' }}>
                            Prefer a quick DM?
                        </Typography>
                        <Link
                            href="https://x.com/time2_trade"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Visit Time 2 Trade on X"
                            sx={{ display: 'inline-flex', alignItems: 'center' }}
                        >
                            <XIcon sx={{ fontSize: 22, color: theme.palette.text.primary }} />
                            <Typography variant="body2" sx={{ ml: 0.75, fontWeight: 700 }}>
                                @time2_trade
                            </Typography>
                        </Link>
                    </Stack>
                </Stack>
            ) : (
                <Box component="form" noValidate onSubmit={handleSubmit}>
                    <Stack spacing={2.1}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
                                Send a message
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#475569', mt: 0.6 }}>
                                Support, feedback, or questions — we read every message.
                            </Typography>
                        </Box>

                        {submitError && (
                            <Alert severity="error">{submitError}</Alert>
                        )}

                        <Typography variant="caption" sx={{ color: '#475569' }}>
                            Fields marked with * are required.
                        </Typography>

                        <TextField
                            label="Email *"
                            name="email"
                            type="email"
                            required
                            value={form.email}
                            onChange={onChange}
                            onBlur={onBlur}
                            error={Boolean(emailError)}
                            helperText={emailError || 'We’ll use this to reply.'}
                            fullWidth
                            inputProps={{ inputMode: 'email', autoComplete: 'email' }}
                        />
                        <TextField
                            label="Name"
                            name="name"
                            value={form.name}
                            onChange={onChange}
                            onBlur={onBlur}
                            fullWidth
                            inputProps={{ autoComplete: 'name' }}
                            helperText="Optional"
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                            <TextField
                                select
                                label="Country / code"
                                name="phoneCountry"
                                value={form.phoneCountry}
                                onChange={onChange}
                                onBlur={onBlur}
                                sx={{ width: { xs: '100%', sm: 240 } }}
                            >
                                {countryOptions.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Phone"
                                name="phone"
                                value={form.phone}
                                onChange={onChange}
                                onBlur={onBlur}
                                fullWidth
                                inputProps={{ inputMode: 'numeric', autoComplete: 'tel', pattern: '[0-9]*' }}
                                helperText="Optional (digits only, no dashes)"
                            />
                        </Stack>
                        <TextField
                            label="Message *"
                            name="message"
                            required
                            value={form.message}
                            onChange={onChange}
                            onBlur={onBlur}
                            fullWidth
                            multiline
                            minRows={4}
                            error={Boolean(messageError)}
                            helperText={messageError || 'Tell us what you need help with.'}
                        />

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                            <Button type="submit" variant="contained" color="primary" sx={{ px: 3, py: 1.25 }} disabled={submitting} fullWidth={!embedded}>
                                {submitting ? 'Sending…' : 'Send message'}
                            </Button>
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#475569' }}>
                                Prefer DM?
                            </Typography>
                            <Link
                                href="https://x.com/time2_trade"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Visit Time 2 Trade on X"
                                sx={{ display: 'inline-flex', alignItems: 'center' }}
                            >
                                <XIcon sx={{ fontSize: 22, color: theme.palette.text.primary }} />
                                <Typography variant="body2" sx={{ ml: 0.75, fontWeight: 700 }}>
                                    @time2_trade
                                </Typography>
                            </Link>
                        </Stack>

                        <Typography variant="caption" sx={{ color: '#475569' }}>
                            We only use your info to respond. No marketing.
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
    return (
        <Box
            component="main"
            sx={{
                bgcolor: '#f9fafb',
                color: '#0f172a',
                minHeight: '100vh',
                // Desktop: use a viewport-fit layout (no page scroll)
                height: { md: 'var(--t2t-vv-height, 100dvh)' },
                overflowY: { xs: 'auto', md: 'hidden' },
                display: { md: 'flex' },
                flexDirection: { md: 'column' },
            }}
        >
            <SEO {...contactMeta} />

            <Container
                maxWidth="md"
                sx={{
                    py: { xs: 4, sm: 6, md: 4 },
                    // Desktop: flex container that fits viewport height
                    height: { md: '100%' },
                    display: { md: 'flex' },
                    flexDirection: { md: 'column' },
                    minHeight: { md: 0 },
                }}
            >
                <Stack spacing={3} sx={{ flex: { md: 1 }, minHeight: { md: 0 } }}>
                    <Box>
                        <Typography variant="overline" sx={{ color: '#475569', fontWeight: 800, letterSpacing: '0.08em' }}>
                            Contact
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.15rem' }, letterSpacing: '-0.02em' }}>
                            Get in touch
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#475569', mt: 1, maxWidth: 680 }}>
                            Send a message for support, feedback, or questions. Prefer DM? Reach us on X for the fastest response.
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            // Desktop: keep the card area within viewport (internal scroll if needed)
                            flex: { md: 1 },
                            minHeight: { md: 0 },
                            display: 'flex',
                            alignItems: { md: 'center' },
                        }}
                    >
                        <ContactCard
                            paperSx={{
                                width: '100%',
                                maxHeight: { md: 'calc(var(--t2t-vv-height, 100dvh) - 280px)' },
                                overflowY: { md: 'auto' },
                            }}
                        />
                    </Box>

                    <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                        <Link href="/" underline="hover" sx={{ fontWeight: 700 }}>
                            Home
                        </Link>
                        <Link href="/calendar" underline="hover" sx={{ fontWeight: 700 }}>
                            Open Calendar
                        </Link>
                        <Link href="/privacy" underline="hover" sx={{ fontWeight: 700 }}>
                            Privacy
                        </Link>
                        <Link href="/terms" underline="hover" sx={{ fontWeight: 700 }}>
                            Terms
                        </Link>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}
