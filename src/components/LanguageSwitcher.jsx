/**
 * src/components/LanguageSwitcher.jsx
 * 
 * Purpose: Renders language selection dropdown with flag icons
 * Allows users to switch between EN, ES, FR with instant UI re-render
 * Persists selection to localStorage + Firestore (when authenticated)
 * Uses same flag-icons library as event markers for visual consistency
 * 
 * Changelog:
 * v1.3.0 - 2026-02-04 - BEP SEO CRITICAL: Migrated from query params to subpath URL navigation (/es/, /fr/). When user switches language, navigates to subpath URL (e.g., /clock → /es/clock) to match Firebase hosting rewrites and SEO structure. Maintains current route while changing language prefix. Eliminates duplicate URLs and improves crawlability.
 * v1.2.0 - 2026-01-27 - BEP UX: Enhanced loading state with "Changing..." text label + smaller spinner (16px) during language switch. Provides clear visual feedback for async operation. Updated translation key to common:language.selectLanguage for proper namespace organization.
 * v1.1.0 - 2026-01-27 - BEP PERFORMANCE: Updated for lazy-loaded i18n backend. Language switching now waits for new language resources to load (preload common+pages namespaces) before updating UI. Improved loading state with disabled menu items during switch. Ensures smooth UX with no translation flicker.
 * v1.0.3 - 2026-01-27 - BEP DESIGN: Updated Button styling for merged Language & Timezone section - changed borderRadius from 999 to 1.5, adjusted px/py to { xs: 1.5, sm: 2 } and 0.75 respectively, changed display to 'inline-flex' for better inline behavior; component now visually integrates seamlessly within SettingsSidebar2 unified section.
 * v1.0.2 - 2026-01-27 - BEP UI CONSISTENCY: Updated to use flag-icons CSS library (same as ClockEventsOverlay markers) and match AppBar nav item font colors (text.primary for default state). Button now renders flag using `fi fi-{countryCode}` class for consistency with event marker flags.
 * v1.0.1 - 2026-01-27 - BEP RESPONSIVE FIX: Added display:flex and flexShrink:0 to Button sx prop. Ensures component is always visible on all breakpoints and pages (/clock, /calendar, /landing, /about, etc). Prevents Button from being squeezed or hidden due to flex layout constraints in AppBar right-stack.
 * v1.0.0 - 2026-01-27 - Initial implementation (Phase 4)
 */

import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem, ListItemIcon, CircularProgress } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const LANGUAGES = [
    { code: 'en', label: 'English', countryCode: 'us' },
    { code: 'es', label: 'Español', countryCode: 'es' },
    { code: 'fr', label: 'Français', countryCode: 'fr' },
];

export default function LanguageSwitcher() {
    const { i18n, t } = useTranslation();
    const { user } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const currentLanguage = LANGUAGES.find(l => l.code === i18n.language);
    const open = Boolean(anchorEl);

    const handleClick = (e) => {
        setAnchorEl(e.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    /**
     * BEP SEO: Handle language change with subpath URL navigation
     * - Navigates to language-specific subpath (/es/, /fr/) or removes prefix for EN
     * - Preloads critical namespaces (common, pages) before switching
     * - Ensures no translation flicker on language change
     * - Persist to localStorage + Firestore for all sessions
     * - Matches Firebase hosting rewrites and SEO structure
     */
    const handleLanguageChange = async (code) => {
        try {
            setIsLoading(true);

            // BEP: Preload critical namespaces for instant UX (prevents flicker)
            // HTTP backend will fetch these if not already loaded
            await Promise.all([
                i18n.loadNamespaces(['common', 'pages']),
            ]);

            // Change language (triggers re-render with new translations)
            await i18n.changeLanguage(code);

            // Save to localStorage (works for all users)
            localStorage.setItem('preferredLanguage', code);

            // Save to Firestore if authenticated
            if (user?.uid) {
                await setDoc(
                    doc(db, 'users', user.uid),
                    { preferredLanguage: code },
                    { merge: true }
                );
            }

            // BEP SEO: Navigate to subpath URL based on language
            const currentPath = window.location.pathname;
            const pathParts = currentPath.split('/').filter(Boolean);

            // Remove existing language prefix if present
            const supportedLangs = ['es', 'fr'];
            if (supportedLangs.includes(pathParts[0])) {
                pathParts.shift();
            }

            // Build new path with language prefix (except for English)
            let newPath;
            if (code === 'en') {
                // English uses root paths
                newPath = '/' + pathParts.join('/');
            } else {
                // Other languages use subpath prefix
                newPath = `/${code}/` + pathParts.join('/');
            }

            // Preserve query params and hash if present
            const search = window.location.search;
            const hash = window.location.hash;

            // Navigate to new URL
            window.location.href = newPath + search + hash;

            handleClose();
        } catch (error) {
            console.error('Failed to change language:', error);
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button
                size="small"
                startIcon={<LanguageIcon />}
                onClick={handleClick}
                disabled={isLoading}
                sx={{
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    px: { xs: 1.5, sm: 2 },
                    py: 0.75,
                    display: 'inline-flex',
                    flexShrink: 0,
                    color: 'text.primary',
                    backgroundColor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    '&:hover': {
                        backgroundColor: 'action.hover',
                    },
                }}
                title={t('common:language.selectLanguage', 'Select Language')}
            >
                {isLoading ? (
                    <>
                        <CircularProgress size={16} sx={{ mr: 0.5 }} />
                        {t('common:language.changingLanguage', 'Changing...')}
                    </>
                ) : (
                    <>
                        <span
                            className={`fi fi-${currentLanguage?.countryCode}`}
                            style={{ marginRight: 4, display: 'inline-block', width: '1em', height: '1em' }}
                        />
                        {currentLanguage?.code.toUpperCase()}
                    </>
                )}
            </Button>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                sx={{ zIndex: 1700 }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            borderRadius: 2,
                            boxShadow: 2,
                        },
                    },
                }}
            >
                {LANGUAGES.map((lang) => (
                    <MenuItem
                        key={lang.code}
                        selected={lang.code === i18n.language}
                        onClick={() => handleLanguageChange(lang.code)}
                        disabled={isLoading}
                        sx={{
                            py: 1,
                            px: 2,
                            '&.Mui-selected': {
                                backgroundColor: 'action.selected',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                },
                            },
                        }}
                    >
                        <ListItemIcon sx={{ mr: 2, minWidth: 'auto' }}>
                            <span
                                className={`fi fi-${lang.countryCode}`}
                                style={{ display: 'inline-block', width: '1.5em', height: '1.5em' }}
                            />
                        </ListItemIcon>
                        {lang.label}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
