/**
 * src/components/SettingsSidebar2.jsx
 * 
 * Purpose: Live-preview friendly settings drawer that keeps the canvas visible while users tweak general, session, and account preferences.
 * Inspired by modern app shells (Airbnb/ChatGPT) with quick toggles, sectional pills, and responsive cards that mirror existing settings logic.
 *
 * Changelog:
 * v2.2.0 - 2026-02-13 - BEP AUDIT: Re-enabled Session Label toggle inside Analog Hand Clock Visibility group
 *                       (was hidden since v1.3.1 via sessionLabelControlsVisible=false). Session Label and its
 *                       children (Countdown to Start/End) now render as child toggles of Analog Hand Clock,
 *                       matching the nesting pattern of Events on Canvas, Session Names, etc. All hardcoded
 *                       English strings replaced with i18n keys from settings namespace. Removed
 *                       sessionLabelControlsVisible flag and legacy standalone section after Digital Clock.
 * v2.1.6 - 2026-02-09 - BEP SUPERADMIN: Added BackfillProgressModal with real-time progress tracking showing 3-phase stepper (blogPosts → activityLog → eventNotes) and final results table with summary counts. Modal displays total, updated, skipped, and error counts per collection. Integrated into handleBackfillInsightKeys with phase timing for visual feedback. Temporary implementation (no i18n translations) for superadmin backfill operations.
 * v2.1.5 - 2026-02-09 - BEP SUPERADMIN: Added backfillInsightKeys icon button to header for superadmins. Calls Cloud Function to backfill insightKeys/visibility across blogPosts, systemActivityLog, and eventNotes. Uses BuildIcon with rotating animation during sync. Displays success/error message and count of updated documents. Follows same pattern as NFS/JBlanked sync buttons with confirmation dialog and debouncing.
 * v2.1.4 - 2026-01-30 - BEP i18n: Updated unlock button copy from generic 'unlockAllFeatures' to context-specific 'settings:drawer.unlockButton' (Create free account to unlock all settings). Added i18n key to all 6 locale files (public/locales and src/i18n/locales for EN/ES/FR).
 * v2.1.3 - 2026-01-30 - BEP HEADER REFINEMENT: Reduced header padding from xs: 2, sm: 2.5 to xs: 1.5, sm: 2 for compact height following BEP standards. Added top border-radius (borderTopLeftRadius: md: 20) for rounded corners matching app's consistent design. Added conditional subtitle for non-auth users only (settings:drawer.subtitle key) inviting them to unlock features. Removed header box-shadow for cleaner look. Changed header flex layout to vertical stack with flex: 1 on title container.
 * v2.1.2 - 2026-01-29 - HOTFIX: Removed stale showAccountModal reference from Drawer open condition that caused ReferenceError in production. Variable was removed in v2.1.1 but reference in open prop was missed.
 * v2.1.1 - 2026-01-29 - BEP UX SIMPLIFICATION: Removed account dropdown accordion (collapsible Account/Logout menu) for authenticated users.
 *                       Hid the entire user profile card for auth users; non-auth users continue to see the "Unlock All Features" button.
 *                       Removed related state: showAccountModal, userMenuAnchor; removed imports: Avatar, AccountCircleIcon, ArrowDropDownIcon, AccountModal.
 *                       Simplified header to conditionally show unlock button only when user is not authenticated.
 * v2.1.0 - 2026-01-29 - BEP i18n: Removed remaining hardcoded account, footer, and confirm modal copy.
 * v2.0.9 - 2026-01-28 - REACT HOOK BEP FIX: Updated useEffect dependency array to include [themeMode, setThemeMode] instead of empty array. Fixes ESLint warning about missing dependencies and ensures proper hook behavior.
 * v2.0.8 - 2026-01-28 - BEP UX CONSISTENCY: Set header background color to 'background.paper' explicitly, matching the rest of the sidebar. Ensures Settings header has uniform appearance with the content area in both light and dark themes.
 * v2.0.7 - 2026-01-28 - BEP UX POLISH: Increased border radius of theme toggle buttons from default to borderRadius: 2 for all three buttons (light/dark/system). Matches app's rounded aesthetic for better visual consistency and modern look.
 * v2.0.3 - 2026-01-28 - BEP UX: Added Typography overline title to Language & Timezone section matching Appearance section styling (fontWeight: 700, letterSpacing: 0.4, text.secondary color, mb: 2.5). Uses existing i18n key settings:general.languageAndTimezone.title.
 * v2.0.2 - 2026-01-27 - CRITICAL BEP i18n REFACTOR: Converted ALL About tab content to i18n translation keys.
 *                       renderContentBlock() now uses t() to translate paragraphs, headings, and lists via aboutContent keys.
 *                       renderAboutSection now translates title/subtitle/section titles from i18n.
 *                       Matches AboutPage.jsx pattern for consistent multi-language support (EN/ES/FR).
 *                       Removed all hardcoded About content strings; now fully i18n compliant with LanguageSwitcher.jsx BEP standards.
 * v2.0.1 - 2026-01-27 - BEP: Unified Language & Timezone section with merged UI - both components now share one SectionCard with responsive flexbox layout (stacked mobile, side-by-side desktop); updated LanguageSwitcher button styling (borderRadius 1.5, compact px/py) for better visual integration; all i18n keys consolidated into languageAndTimezone namespace (EN/ES/FR).
 * v1.3.11 - 2026-01-22 - BEP: Improve settings dialog UI with rounded drawer corners, refined shadow, and elevated header styling.
 * v1.3.10 - 2026-01-21 - Removed fullscreen toggle control from settings header.
 * v1.3.9 - 2026-01-21 - Add manual JBlanked Forex Factory range sync button for superadmins.
 * v1.3.8 - 2026-01-13 - Updated footer: removed auth-gated copy 'Create a free account' and replaced with always-visible 'Have questions? Contact us' link that opens ContactModal for both authenticated and non-authenticated users.
 * v1.3.7 - 2026-01-13 - Add NFS and JBlanked sync buttons to header for superadmin users; visible left of fullscreen toggle.
 * v1.3.4 - 2026-01-09 - Add Contact us button in About tab for quick support access.
 * v1.3.5 - 2026-01-09 - Wire Contact us button to open ContactModal when handler is provided.
 * v1.3.6 - 2026-01-12 - Raise settings drawer z-index above top chrome (banner + app bar).
 * v1.3.3 - 2026-01-08 - Updated "Clock Hands" toggle label to "Seconds Hand" to clarify that only the seconds hand is toggled; hour and minute hands always visible (enterprise best practice).
 * v1.3.2 - 2026-01-08 - Allow guest/local toggling of gray past sessions and session name visibility; no auth gate for these canvas appearance toggles.
 * v1.3.2 - 2026-02-11 - BEP PERFORMANCE: Lazy-loaded AuthModal2 (conditionally rendered for
 *                        guest unlock flow). Wrapped in Suspense to defer Firebase Auth SDK.
 * v1.3.1 - 2026-01-07 - Temporarily hide session label toggles while keeping underlying setting wiring intact for future use.
 * v1.3.0 - 2026-01-06 - Remove timezone visibility toggle; timezone label is always shown.
 * v1.2.9 - 2025-12-17 - Refactored About tab to use shared aboutContent module and added "Read Full About Page" link for SEO route.
 * v1.2.8 - 2025-12-17 - Added Show Numbers and Show Clock Hands child settings under Analog Hand Clock for granular canvas customization.
 * v1.2.7 - 2025-12-17 - Replaced hardcoded About content with dynamic loading from AboutContent.txt for SEO-rich enterprise copywriting.
 * v1.2.6 - 2025-12-16 - Hide settings drawer when reset confirmation is open so the modal always sits on top.
 * v1.2.5 - 2025-12-16 - Moved Show timezone label toggle into Visibility between Digital Clock and Session Label.
 * v1.2.4 - 2025-12-16 - Removed trailing double border in Visibility by aligning child dividers with outer card.
 * v1.2.3 - 2025-12-16 - Moved dividers to sit below child rows for nested settings groups in Visibility.
 * v1.2.2 - 2025-12-16 - Moved "Session names on canvas" under Hand Clock with consistent child-row UI and removed the Labels & timing card from Sessions.
 * v1.2.1 - 2025-12-16 - Nested "Show events on clock" under Hand Clock and removed the standalone Economic calendar card.
 * v1.2.0 - 2025-12-16 - Removed Clock Style and Canvas Size controls; appearance is now fixed to normal at 100%.
 * v1.1.4 - 2025-12-16 - Added PropTypes for helper components and main sidebar props; no behavior changes.
 * v1.1.3 - 2025-12-16 - Moved Show timezone label toggle inside the timezone card for a single cohesive section.
 * v1.1.2 - 2025-12-16 - Added Show timezone label toggle under the timezone selector.
 * v1.1.1 - 2025-12-11 - Added per-session clear action with confirmation in Sessions tab
 * v1.1.0 - 2025-12-11 - Added timezone selector to General tab and aligned spacing for live-preview controls
 * v1.0.1 - 2025-12-11 - Refined layout with pill toggles and sub-sections to reduce line wrapping and improve readability
 * v1.0.0 - 2025-12-11 - Added refreshed settings drawer with preserved behaviors and modernized UI layout
 */

import PropTypes from 'prop-types';
import { Suspense, lazy, useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Alert,
	Box,
	Button,
	Divider,
	Drawer,
	IconButton,
	Paper,
	TextField,
	Tooltip,
	Typography,
	ToggleButton,
	ToggleButtonGroup,
} from '@mui/material';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import HistoryIcon from '@mui/icons-material/History';
import BuildIcon from '@mui/icons-material/Build';
import LightModeIcon from '@mui/icons-material/LightModeRounded';
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightnessRounded';
import { signOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';
import { useSettings } from '../contexts/SettingsContext';
import { useThemeMode } from '../contexts/themeContextUtils';
import { useAuth } from '../contexts/AuthContext';
import { triggerNfsWeekSync, triggerJblankedActualsSync, triggerJblankedForexFactorySinceSync } from '../services/economicEventsService';
const AuthModal2 = lazy(() => import('./AuthModal2'));
import ConfirmModal from './ConfirmModal';
import BackfillProgressModal from './BackfillProgressModal';
import SwitchComponent from './Switch';
import TimezoneSelector from './TimezoneSelector';
import LanguageSwitcher from './LanguageSwitcher';
import { aboutContent } from '../content/aboutContent';

function SectionCard({ title, subtitle, children, dense }) {
	return (
		<Paper
			elevation={0}
			sx={{
				p: dense ? 2 : { xs: 2.25, sm: 3 },
				borderRadius: 3,
				border: 1,
				borderColor: 'divider',
				bgcolor: 'background.paper',
				mb: { xs: 2, sm: 3 },
			}}
		>
			{(title || subtitle) && (
				<Box sx={{ mb: subtitle ? 1.25 : 1 }}>
					{title && (
						<Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.05rem' } }}>
							{title}
						</Typography>
					)}
					{subtitle && (
						<Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
							{subtitle}
						</Typography>
					)}
				</Box>
			)}
			{children}
		</Paper>
	);
}

function SettingRow({ label, description, children, helperText, dense }) {
	return (
		<Box sx={{ py: dense ? 1 : 1.5, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
			<Box sx={{ flex: 1, minWidth: 0 }}>
				<Typography variant="body1" sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1rem' } }}>
					{label}
				</Typography>
				{description && (
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 0.25, fontSize: { xs: '0.85rem', sm: '0.9rem' }, lineHeight: 1.6 }}
					>
						{description}
					</Typography>
				)}
				{helperText && (
					<Alert
						severity="info"
						sx={{ mt: 1, fontSize: { xs: '0.8rem', sm: '0.85rem' }, py: 1 }}
					>
						{helperText}
					</Alert>
				)}
			</Box>
			<Box sx={{ flexShrink: 0 }}>{children}</Box>
		</Box>
	);
}

export default function SettingsSidebar2({ open, onClose, onOpenAuth, onOpenContact }) {
	const { t } = useTranslation(['settings', 'common', 'actions', 'tooltips', 'a11y']);
	const { t: tAbout, ready: aboutReady } = useTranslation('about', { useSuspense: false });

	const navItems = useMemo(() => [
		{ key: 'general', label: t('settings:navigation.general'), icon: <SettingsRoundedIcon fontSize="small" /> },
		{ key: 'session', label: t('settings:navigation.sessions'), icon: <AccessTimeRoundedIcon fontSize="small" /> },
		{ key: 'about', label: t('settings:navigation.about'), icon: <InfoRoundedIcon fontSize="small" /> },
	], [t]);

	const { user, hasRole } = useAuth();
	const {
		sessions,
		updateSessions,
		backgroundBasedOnSession,
		toggleBackgroundBasedOnSession,
		showHandClock,
		showDigitalClock,
		showSessionLabel,
		toggleShowHandClock,
		toggleShowDigitalClock,
		toggleShowSessionLabel,
		showTimeToEnd,
		showTimeToStart,
		toggleShowTimeToEnd,
		toggleShowTimeToStart,
		showSessionNamesInCanvas,
		toggleShowSessionNamesInCanvas,
		showPastSessionsGray,
		toggleShowPastSessionsGray,
		showEventsOnCanvas,
		toggleShowEventsOnCanvas,
		showClockNumbers,
		toggleShowClockNumbers,
		showClockHands,
		toggleShowClockHands,
		updateThemeMode,
		resetSettings,
	} = useSettings();

	const { themeMode, setThemeMode } = useThemeMode();

	const [activeSection, setActiveSection] = useState('general');
	const [showUnlockModal, setShowUnlockModal] = useState(false);
	const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
	const [showClearSessionConfirm, setShowClearSessionConfirm] = useState(false);
	const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
	const [clearSessionIndex, setClearSessionIndex] = useState(null);
	const [toggleError, setToggleError] = useState('');
	const [syncingWeek, setSyncingWeek] = useState(false);
	const [syncingActuals, setSyncingActuals] = useState(false);
	const [syncingForexFactoryRange, setSyncingForexFactoryRange] = useState(false);
	const [syncingBackfill, setSyncingBackfill] = useState(false);
	const [syncSuccess, setSyncSuccess] = useState(null);
	const [showBackfillModal, setShowBackfillModal] = useState(false);
	const [backfillPhase, setBackfillPhase] = useState(null);
	const [backfillResults, setBackfillResults] = useState(null);
	const [backfillError, setBackfillError] = useState(null);

	// Sync saved themeMode from SettingsContext to ThemeContext on mount
	useEffect(() => {
		if (themeMode && setThemeMode) {
			// This ensures the theme is properly set from saved preferences
			setThemeMode(themeMode);
		}
	}, [themeMode, setThemeMode]); // Include dependencies to avoid stale closures

	const handleSyncWeek = useCallback(async () => {
		if (syncingWeek) return;
		const confirmed = window.confirm('Sync this week from NFS now? This may take a few seconds.');
		if (!confirmed) return;
		setSyncingWeek(true);
		setSyncSuccess(null);
		try {
			const result = await triggerNfsWeekSync();
			if (result.success) {
				setSyncSuccess('Synced NFS weekly schedule.');
			} else {
				setSyncSuccess(result.error || 'Failed to sync NFS week.');
			}
		} catch {
			setSyncSuccess('Failed to sync NFS week.');
		} finally {
			setTimeout(() => setSyncSuccess(null), 4000);
			setSyncingWeek(false);
		}
	}, [syncingWeek]);

	const handleSyncActuals = useCallback(async () => {
		if (syncingActuals) return;
		const confirmed = window.confirm('Sync today\'s actuals from JBlanked (all sources)? This may take a few seconds.');
		if (!confirmed) return;
		setSyncingActuals(true);
		setSyncSuccess(null);
		try {
			const result = await triggerJblankedActualsSync();
			if (result.success) {
				setSyncSuccess('Synced JBlanked actuals.');
			} else {
				setSyncSuccess(result.error || 'Failed to sync JBlanked actuals.');
			}
		} catch {
			setSyncSuccess('Failed to sync JBlanked actuals.');
		} finally {
			setTimeout(() => setSyncSuccess(null), 4000);
			setSyncingActuals(false);
		}
	}, [syncingActuals]);

	const handleSyncForexFactoryRange = useCallback(async () => {
		if (syncingForexFactoryRange) return;
		const confirmed = window.confirm('Backfill Forex Factory events since 01/01/26? This may take several minutes.');
		if (!confirmed) return;
		setSyncingForexFactoryRange(true);
		setSyncSuccess(null);
		try {
			const result = await triggerJblankedForexFactorySinceSync();
			if (result.success) {
				setSyncSuccess('Backfilled Forex Factory events since 01/01/26.');
			} else {
				setSyncSuccess(result.error || 'Failed to backfill Forex Factory events.');
			}
		} catch {
			setSyncSuccess('Failed to backfill Forex Factory events.');
		} finally {
			setTimeout(() => setSyncSuccess(null), 4000);
			setSyncingForexFactoryRange(false);
		}
	}, [syncingForexFactoryRange]);

	const handleBackfillInsightKeys = useCallback(async () => {
		if (syncingBackfill) return;
		const confirmed = window.confirm('Backfill insightKeys for all documents (blogPosts, activity logs, event notes)? This may take several minutes.');
		if (!confirmed) return;

		setSyncingBackfill(true);
		setShowBackfillModal(true);
		setBackfillPhase('blogPosts');
		setBackfillResults(null);
		setBackfillError(null);
		setSyncSuccess(null);

		try {
			const backfill = httpsCallable(functions, 'backfillInsightKeys');

			// Simulate phase transitions for UX feedback (Cloud Function runs all phases)
			const phaseTimings = {
				blogPosts: 0,
				activityLog: 5000,
				eventNotes: 10000,
			};

			// Update UI phase based on time elapsed
			const phaseTimer = setInterval(() => {
				const now = Date.now();
				const elapsed = now - startTime;

				if (elapsed < phaseTimings.activityLog) {
					setBackfillPhase('blogPosts');
				} else if (elapsed < phaseTimings.eventNotes) {
					setBackfillPhase('activityLog');
				} else {
					setBackfillPhase('eventNotes');
				}
			}, 500);

			const startTime = Date.now();
			const result = await backfill({});
			clearInterval(phaseTimer);

			if (result.data) {
				const { blogPosts, activityLog, eventNotes } = result.data;
				setBackfillResults({ blogPosts, activityLog, eventNotes });
				setBackfillPhase(null);

				const totalUpdated = (blogPosts?.updated || 0) + (activityLog?.updated || 0) + (eventNotes?.updated || 0);
				setSyncSuccess(`✓ Backfilled insightKeys: ${totalUpdated} docs updated.`);
			} else {
				setBackfillError('Backfill completed but no response data.');
				setSyncSuccess('Backfill completed but no response data.');
			}
		} catch (error) {
			setBackfillError(error.message || 'Unknown error');
			setSyncSuccess(`✗ Failed to backfill: ${error.message || 'Unknown error'}`);
		} finally {
			setTimeout(() => setSyncSuccess(null), 5000);
			setSyncingBackfill(false);
		}
	}, [syncingBackfill]);

	const handleLogout = async () => {
		try {
			await signOut(auth);
			resetSettings();
			onClose();
			setShowLogoutConfirmModal(false);
		} catch (error) {
			console.error(error);
		}
	};

	const handleToggle = (toggleFunc) => {
		const success = toggleFunc();
		if (!success) {
			setToggleError('At least one of the main clock elements must be enabled.');
			setTimeout(() => setToggleError(''), 4000);
		} else {
			setToggleError('');
		}
	};

	const handleSessionChange = (index, field, value) => {
		if (!user) {
			setShowUnlockModal(true);
			return;
		}
		const updated = [...sessions];
		updated[index][field] = value;
		updateSessions(updated);
	};

	const handleToggleShowTimeToEnd = () => {
		if (!user) {
			setShowUnlockModal(true);
			return;
		}
		toggleShowTimeToEnd();
	};

	const handleToggleShowTimeToStart = () => {
		if (!user) {
			setShowUnlockModal(true);
			return;
		}
		toggleShowTimeToStart();
	};

	const handleToggleShowSessionNamesInCanvas = () => {
		// Canvas appearance should work for guests; persistence handled by useSettings
		toggleShowSessionNamesInCanvas();
	};

	const handleToggleShowPastSessionsGray = () => {
		// Allow guests to control gray-out locally; Firestore persistence handled when authenticated
		toggleShowPastSessionsGray();
	};

	const handleRequestClearSession = (index) => {
		if (!user) {
			setShowUnlockModal(true);
			return;
		};
		setClearSessionIndex(index);
		setShowClearSessionConfirm(true);
	};

	const handleConfirmClearSession = () => {
		if (clearSessionIndex === null) {
			setShowClearSessionConfirm(false);
			return;
		}
		const updated = [...sessions];
		updated[clearSessionIndex] = { ...updated[clearSessionIndex], name: '', startNY: '', endNY: '', color: '' };
		updateSessions(updated);
		setClearSessionIndex(null);
		setShowClearSessionConfirm(false);
	};
	const handleCancelClearSession = () => {
		setClearSessionIndex(null);
		setShowClearSessionConfirm(false);
	};

	const handleResetSettings = () => {
		resetSettings();
		setShowResetConfirmModal(false);
	};

	const navContent = useMemo(
		() => (
			<Box
				role="tablist"
				aria-label={t('a11y:settings.sections')}
				sx={{
					display: 'flex',
					gap: 1,
					p: { xs: 1, sm: 1.5 },
					border: 1,
					borderColor: 'divider',
					borderRadius: 2,
					bgcolor: 'background.paper',
				}}
			>
				{navItems.map((item) => {
					const isActive = activeSection === item.key;
					return (
						<Button
							key={item.key}
							onClick={() => setActiveSection(item.key)}
							startIcon={item.icon}
							variant={isActive ? 'contained' : 'text'}
							color={isActive ? 'primary' : 'inherit'}
							sx={{
								flex: 1,
								textTransform: 'none',
								borderRadius: 2,
								fontWeight: 600,
								bgcolor: isActive ? 'primary.main' : 'transparent',
								color: isActive ? 'primary.contrastText' : 'text.primary',
								boxShadow: isActive ? 2 : 'none',
							}}
							aria-current={isActive ? 'page' : undefined}
						>
							{item.label}
						</Button>
					);
				})}
			</Box>
		),
		[activeSection, navItems, t]
	);

	const quickToggles = (
		<SectionCard dense>
			<Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 0.4, color: 'text.secondary' }}>
				{t('settings:general.visibility.title')}
			</Typography>
			<Paper
				elevation={0}
				sx={{
					mt: 1,
					borderRadius: 3,
					border: 1,
					borderColor: 'divider',
					overflow: 'hidden',
				}}
			>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1.5,
						px: 1.75,
						py: 1.25,
						bgcolor: 'background.paper',
						borderColor: 'divider',
					}}
				>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
							{t('settings:general.visibility.analogClock.label')}
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
							{t('settings:general.visibility.analogClock.description')}
						</Typography>
					</Box>
					<SwitchComponent checked={showHandClock} onChange={() => handleToggle(toggleShowHandClock)} />
				</Box>

				{showHandClock && (
					<Divider sx={{ width: '93%', mx: 'auto', borderColor: 'divider' }} />
				)}

				{showHandClock && (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							gap: 1,
							px: 1.75,
							py: 1.25,
							bgcolor: 'background.paper',
							borderColor: 'divider',
							borderBottom: '1px solid',
							borderBottomColor: 'divider',
						}}
					>
						<Box
							sx={{
								display: 'flex',
								gap: 1.5,
								alignItems: 'center',
								borderLeft: '1px solid',
								borderColor: 'divider',
								pl: 1.5,
								minHeight: 44,
								flexWrap: 'wrap',
							}}
						>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{t('settings:general.visibility.eventsOnCanvas.label')}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
									{t('settings:general.visibility.eventsOnCanvas.description')}
								</Typography>
							</Box>
							<SwitchComponent
								checked={showEventsOnCanvas}
								onChange={toggleShowEventsOnCanvas}
							/>
						</Box>

						<Box
							sx={{
								display: 'flex',
								gap: 1.5,
								alignItems: 'center',
								borderLeft: '1px solid',
								borderColor: 'divider',
								pl: 1.5,
								minHeight: 44,
								flexWrap: 'wrap',
							}}
						>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{t('settings:general.visibility.sessionNames.label')}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
									{t('settings:general.visibility.sessionNames.description')}
								</Typography>
							</Box>
							<SwitchComponent
								checked={showSessionNamesInCanvas}
								onChange={handleToggleShowSessionNamesInCanvas}
							/>
						</Box>

						<Box
							sx={{
								display: 'flex',
								gap: 1.5,
								alignItems: 'center',
								borderLeft: '1px solid',
								borderColor: 'divider',
								pl: 1.5,
								minHeight: 44,
								flexWrap: 'wrap',
							}}
						>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{t('settings:general.visibility.pastSessionsGray.label')}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
									{t('settings:general.visibility.pastSessionsGray.description')}
								</Typography>
							</Box>
							<SwitchComponent
								checked={showPastSessionsGray}
								onChange={handleToggleShowPastSessionsGray}
							/>
						</Box>

						<Box
							sx={{
								display: 'flex',
								gap: 1.5,
								alignItems: 'center',
								borderLeft: '1px solid',
								borderColor: 'divider',
								pl: 1.5,
								minHeight: 44,
								flexWrap: 'wrap',
							}}
						>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{t('settings:general.visibility.clockNumbers.label')}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
									{t('settings:general.visibility.clockNumbers.description')}
								</Typography>
							</Box>
							<SwitchComponent
								checked={showClockNumbers}
								onChange={toggleShowClockNumbers}
							/>
						</Box>

						<Box
							sx={{
								display: 'flex',
								gap: 1.5,
								alignItems: 'center',
								borderLeft: '1px solid',
								borderColor: 'divider',
								pl: 1.5,
								minHeight: 44,
								flexWrap: 'wrap',
							}}
						>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{t('settings:general.visibility.secondsHand.label')}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
									{t('settings:general.visibility.secondsHand.description')}
								</Typography>
							</Box>
							<SwitchComponent
								checked={showClockHands}
								onChange={toggleShowClockHands}
							/>
						</Box>

						{/* Session Label toggle — child of Analog Hand Clock */}
						<Box
							sx={{
								display: 'flex',
								gap: 1.5,
								alignItems: 'center',
								borderLeft: '1px solid',
								borderColor: 'divider',
								pl: 1.5,
								minHeight: 44,
								flexWrap: 'wrap',
							}}
						>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{t('settings:general.visibility.sessionLabel.label')}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
									{t('settings:general.visibility.sessionLabel.description')}
								</Typography>
							</Box>
							<SwitchComponent
								checked={showSessionLabel}
								onChange={() => handleToggle(toggleShowSessionLabel)}
							/>
						</Box>

						{/* Session Label children: Countdown to Start / End */}
						{showSessionLabel && (
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: 0.75,
									pl: 3,
									borderLeft: '1px solid',
									borderColor: 'divider',
									ml: 1.5,
								}}
							>
								<Box
									sx={{
										display: 'flex',
										gap: 1.5,
										alignItems: 'center',
										minHeight: 40,
										flexWrap: 'wrap',
									}}
								>
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
											{t('settings:general.visibility.timeToStart.label')}
										</Typography>
										<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
											{t('settings:general.visibility.timeToStart.description')}
										</Typography>
									</Box>
									<SwitchComponent checked={showTimeToStart} onChange={handleToggleShowTimeToStart} />
								</Box>

								<Box
									sx={{
										display: 'flex',
										gap: 1.5,
										alignItems: 'center',
										minHeight: 40,
										flexWrap: 'wrap',
									}}
								>
									<Box sx={{ flex: 1, minWidth: 0 }}>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
											{t('settings:general.visibility.timeToEnd.label')}
										</Typography>
										<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
											{t('settings:general.visibility.timeToEnd.description')}
										</Typography>
									</Box>
									<SwitchComponent checked={showTimeToEnd} onChange={handleToggleShowTimeToEnd} />
								</Box>
							</Box>
						)}
					</Box>
				)}

				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1.5,
						px: 1.75,
						py: 1.25,
						bgcolor: 'background.paper',
						borderColor: 'divider',
					}}
				>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
							{t('settings:general.visibility.digitalClock.label')}
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
							{t('settings:general.visibility.digitalClock.description')}
						</Typography>
					</Box>
					<SwitchComponent checked={showDigitalClock} onChange={() => handleToggle(toggleShowDigitalClock)} />
				</Box>
			</Paper>
			{toggleError && (
				<Alert severity="error" sx={{ mt: 1.25 }}>
					{toggleError}
				</Alert>
			)}
		</SectionCard>
	);

	const renderGeneralSection = (
		<>
			{/* Appearance Section */}
			<SectionCard>
				<Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 0.4, color: 'text.secondary', display: 'block', mb: 1.5 }}>
					{t('settings:general.appearance.title')}
				</Typography>
				<Box sx={{ mb: 0.75 }}>
					<Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
						{t('settings:general.appearance.themeMode')}
					</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
						{t('settings:general.appearance.systemDescription')}
					</Typography>
					<ToggleButtonGroup
						value={themeMode}
						exclusive
						onChange={(e, newMode) => {
							if (newMode) {
								setThemeMode(newMode);
								updateThemeMode(newMode); // Persist to Firestore/localStorage
							}
						}}
						size="small"
						fullWidth
						sx={{
							display: 'flex',
							gap: 0.75,
							'& .MuiToggleButton-root': {
								flex: 1,
								minWidth: 0,
								'&.Mui-selected': {
									bgcolor: 'primary.main',
									color: 'primary.contrastText',
									borderColor: 'primary.main',
									'&:hover': {
										bgcolor: 'primary.dark',
									},
								},
								'&:hover': {
									bgcolor: 'action.hover',
								},
							},
						}}
					>
						<ToggleButton value="light" aria-label={t('settings:general.appearance.light')} sx={{ flex: 1, borderRadius: 2 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
								<LightModeIcon sx={{ fontSize: '1.1rem' }} />
								{t('settings:general.appearance.light')}
							</Box>
						</ToggleButton>
						<ToggleButton value="dark" aria-label={t('settings:general.appearance.dark')} sx={{ flex: 1, borderRadius: 2 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
								<DarkModeIcon sx={{ fontSize: '1.1rem' }} />
								{t('settings:general.appearance.dark')}
							</Box>
						</ToggleButton>
						<ToggleButton value="system" aria-label={t('settings:general.appearance.system')} sx={{ flex: 1, borderRadius: 2 }}>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
								<SettingsBrightnessIcon sx={{ fontSize: '1.1rem' }} />
								{t('settings:general.appearance.system')}
							</Box>
						</ToggleButton>
					</ToggleButtonGroup>
				</Box>
			</SectionCard>

			{/* Language & Timezone Section */}
			<SectionCard>
				<Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 0.4, color: 'text.secondary', display: 'block', mb: 2.5 }}>
					{t('settings:general.languageAndTimezone.title')}
				</Typography>
				<Paper
					elevation={0}
					sx={{
						border: 1,
						borderColor: 'divider',
						borderRadius: 3,
						overflow: 'hidden',
					}}
				>
					{/* Language Selector */}
					<Box
						sx={{
							display: 'flex',
							flexDirection: { xs: 'column', sm: 'row' },
							gap: 0,
							p: { xs: 1.5, sm: 2 },
							borderBottom: 1,
							borderColor: 'divider',
							alignItems: { xs: 'stretch', sm: 'center' },
							justifyContent: 'space-between',
						}}
					>
						<Box sx={{ flex: 1, mb: { xs: 1.5, sm: 0 } }}>
							<Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
								{t('settings:general.languageAndTimezone.language.label')}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{t('settings:general.languageAndTimezone.language.description')}
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
							<LanguageSwitcher />
						</Box>
					</Box>

					{/* Timezone Selector */}
					<Box
						sx={{
							p: { xs: 1.5, sm: 2 },
							display: 'flex',
							flexDirection: 'column',
							gap: { xs: 1.5, sm: 2 },
							alignItems: 'stretch',
						}}
					>
						<Box>
							<Typography variant="body2" sx={{ fontWeight: 700, mb: 0.25 }}>
								{t('settings:general.languageAndTimezone.timezone.label')}
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
								{t('settings:general.languageAndTimezone.timezone.description')}
							</Typography>
						</Box>
						<Box sx={{ width: '100%' }}>
							<TimezoneSelector onRequestSignUp={onOpenAuth} compact />
						</Box>
					</Box>
				</Paper>
			</SectionCard>

			{quickToggles}

			<SectionCard>
				<Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 0.4, color: 'text.secondary', display: 'block', mb: 1 }}>
					{t('settings:general.background.title')}
				</Typography>
				<Paper
					elevation={0}
					sx={{
						border: 1,
						borderColor: 'divider',
						borderRadius: 3,
						overflow: 'hidden',
					}}
				>
					<Box sx={{ px: 1.75, py: 1.25 }}>
						<SettingRow
							label={t('settings:general.background.sessionBased.label')}
							description={t('settings:general.background.sessionBased.description')}
						>
							<SwitchComponent
								checked={backgroundBasedOnSession}
								onChange={toggleBackgroundBasedOnSession}
							/>
						</SettingRow>
					</Box>
				</Paper>
			</SectionCard>

			<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
				<Button
					variant="outlined"
					color="error"
					onClick={() => setShowResetConfirmModal(true)}
					sx={{ textTransform: 'none', borderRadius: 2, px: 3, py: 1.25 }}
				>
					{t('settings:general.resetButton')}
				</Button>
			</Box>
		</>
	);

	const renderSessionSection = (
		<>
			<SectionCard
				title={t('settings:sessions.title')}
				subtitle={t('settings:sessions.subtitle')}
			>
				<Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 0.4, color: 'text.secondary', display: 'block', mb: 1 }}>
					{t('settings:sessions.sectionLabel')}
				</Typography>
				<Paper
					elevation={0}
					sx={{
						border: 1,
						borderColor: 'divider',
						borderRadius: 3,
						overflow: 'hidden',
						mb: 2,
					}}
				>
					{sessions.map((session, index) => (
						<Box
							key={index}
							sx={{
								p: { xs: 1.75, sm: 2 },
								borderBottom: index === sessions.length - 1 ? 'none' : '1px solid',
								borderColor: 'divider',
							}}
						>
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25, gap: 1 }}>
								<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
									{t('settings:sessions.sessionLabel', { number: index + 1 })}
								</Typography>
								<IconButton
									size="small"
									onClick={() => handleRequestClearSession(index)}
									sx={{ color: 'text.secondary' }}
									aria-label={t('a11y:settings.clearSession', { number: index + 1 })}
								>
									<DeleteOutlineIcon fontSize="small" />
								</IconButton>
							</Box>

							<TextField
								label={t('settings:sessions.form.nameLabel')}
								size="small"
								fullWidth
								value={session.name}
								onChange={(event) => handleSessionChange(index, 'name', event.target.value)}
								placeholder={t('settings:sessions.form.namePlaceholder', { number: index + 1 })}
								sx={{ mb: 1.5 }}
							/>

							<Box
								sx={{
									display: 'grid',
									gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 90px' },
									gap: { xs: 1.25, sm: 1.5 },
								}}
							>
								<TextField
									label={t('settings:sessions.form.startTimeLabel')}
									type="time"
									size="small"
									value={session.startNY}
									onChange={(event) => handleSessionChange(index, 'startNY', event.target.value)}
									InputLabelProps={{ shrink: true }}
								/>
								<TextField
									label={t('settings:sessions.form.endTimeLabel')}
									type="time"
									size="small"
									value={session.endNY}
									onChange={(event) => handleSessionChange(index, 'endNY', event.target.value)}
									InputLabelProps={{ shrink: true }}
								/>
								<TextField
									label={t('settings:sessions.form.colorLabel')}
									type="color"
									size="small"
									value={session.color}
									onChange={(event) => handleSessionChange(index, 'color', event.target.value)}
									sx={{ width: { xs: '100%', sm: '100%' } }}
									inputProps={{ style: { padding: 0, height: 38 } }}
								/>
							</Box>
						</Box>
					))}
				</Paper>

			</SectionCard>
		</>
	);

	// Helper to render content blocks from shared content module
	// BEP: All text comes from i18n translation keys, not hardcoded strings
	const renderContentBlock = (block, index) => {
		if (block.type === 'paragraph') {
			const text = tAbout(block.key, '');
			if (!text) return null;

			return (
				<Typography
					key={index}
					variant="body1"
					sx={{
						fontSize: { xs: '0.95rem', sm: '1rem' },
						lineHeight: 1.7,
						mb: 2,
						color: 'text.primary',
						'& strong': { fontWeight: 700 },
						'& a': {
							color: 'primary.main',
							textDecoration: 'none',
							'&:hover': { textDecoration: 'underline' }
						}
					}}
					dangerouslySetInnerHTML={{ __html: text }}
				/>
			);
		}

		if (block.type === 'heading') {
			const text = tAbout(block.key, '');
			if (!text) return null;

			return (
				<Typography
					key={index}
					variant="h3"
					sx={{
						fontSize: { xs: '1.1rem', sm: '1.25rem' },
						fontWeight: 700,
						mb: 1.5,
						mt: 2,
						color: 'text.primary',
					}}
				>
					{text}
				</Typography>
			);
		}

		if (block.type === 'list') {
			return (
				<Box key={index} component="ul" sx={{ pl: 3, mb: 2 }}>
					{block.items.map((item, itemIndex) => {
						const label = tAbout(item.labelKey, '');
						const text = tAbout(item.textKey, '');
						if (!label || !text) return null;

						return (
							<Box key={itemIndex} component="li" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' }, lineHeight: 1.7, mb: 1 }}>
								<strong>{label}:</strong> {text}
							</Box>
						);
					})}
				</Box>
			);
		}

		return null;
	};

	const renderAboutSection = (
		<SectionCard>
			{!aboutReady ? (
				<Box sx={{ textAlign: 'center', py: 4 }}>
					<Typography color="text.secondary">
						{t('common:loading')}
					</Typography>
				</Box>
			) : (
				<>
					<Typography
						variant="h2"
						sx={{
							fontSize: { xs: '1.5rem', sm: '1.75rem' },
							fontWeight: 700,
							mb: 1,
							mt: 0,
						}}
					>
						{tAbout(aboutContent.title)}
					</Typography>
					<Typography
						variant="subtitle1"
						sx={{
							fontSize: { xs: '0.95rem', sm: '1rem' },
							color: 'text.secondary',
							mb: 3,
						}}
					>
						{tAbout(aboutContent.subtitle)}
					</Typography>
					{aboutContent.sections.map((section, sectionIndex) => (
						<Box key={sectionIndex} sx={{ mb: sectionIndex < aboutContent.sections.length - 1 ? 3 : 0 }}>
							{section.title && (
								<Typography
									variant="h3"
									sx={{
										fontSize: { xs: '1.1rem', sm: '1.25rem' },
										fontWeight: 700,
										mb: 1.5,
										mt: sectionIndex > 0 ? 3 : 0,
									}}
								>
									{tAbout(section.title)}
								</Typography>
							)}
							{section.content.map((block, blockIndex) => renderContentBlock(block, blockIndex))}
						</Box>
					))}
					<Box sx={{ mt: 3, pt: 3, borderTop: 1, borderColor: 'divider' }}>
						<Button
							variant="outlined"
							fullWidth
							href="/about"
							target="_blank"
							rel="noopener noreferrer"
							sx={{
								textTransform: 'none',
								borderRadius: 2,
								py: 1.25,
							}}
						>
							{t('settings:about.readFullAbout')}
						</Button>
						<Button
							variant="contained"
							fullWidth
							{...(onOpenContact ? { onClick: onOpenContact } : { href: '/contact' })}
							sx={{
								textTransform: 'none',
								borderRadius: 2,
								py: 1.25,
								mt: 1.5,
							}}
						>
							{t('settings:about.contactButton')}
						</Button>
					</Box>
				</>
			)}
		</SectionCard>
	);

	const renderContent = () => {
		if (activeSection === 'session') return renderSessionSection;
		if (activeSection === 'about') return renderAboutSection;
		return renderGeneralSection;
	};

	return (
		<>
			<Drawer
				anchor="right"
				open={open && !showUnlockModal && !showResetConfirmModal && !showLogoutConfirmModal}
				onClose={onClose}
				variant="temporary"
				ModalProps={{ keepMounted: true }}
				sx={{ zIndex: 1600, '& .MuiDrawer-paper': { boxSizing: 'border-box' } }}
				slotProps={{
					backdrop: { sx: BACKDROP_OVERLAY_SX },
				}}
				PaperProps={{
					sx: {
						width: { xs: '100%', sm: '100%', md: 520, lg: 560 },
						maxWidth: '100vw',
						height: '100vh',
						display: 'flex',
						flexDirection: 'column',
						bgcolor: 'background.paper',
						boxShadow: '-24px 0 48px rgba(15,23,42,0.12)',
						borderLeft: 1,
						borderColor: 'divider',
						borderTopLeftRadius: { xs: 0, md: 20 },
						borderBottomLeftRadius: { xs: 0, md: 20 },
					},
				}}
			>
				<Box
					sx={{
						p: { xs: 1.5, sm: 2 },
						borderBottom: 1,
						borderColor: 'divider',
						borderTopLeftRadius: { xs: 0, md: 20 },
						borderTopRightRadius: { xs: 0, md: 0 },
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 1.5,
						flexShrink: 0,
						bgcolor: 'background.paper',
					}}
				>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
							{t('settings:drawer.title')}
						</Typography>
						{!user && (
							<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
								{t('settings:drawer.subtitle')}
							</Typography>
						)}
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						{user && hasRole && hasRole('superadmin') && (
							<>
								<Tooltip title={t('tooltips:admin.syncWeek')} arrow>
									<span>
										<IconButton
											size="small"
											onClick={handleSyncWeek}
											disabled={syncingWeek}
											sx={{ '&:hover': { bgcolor: 'action.hover' } }}
											aria-label={t('a11y:settings.syncWeek')}
										>
											<CalendarViewWeekIcon
												sx={{
													animation: syncingWeek ? 'spin 1s linear infinite' : 'none',
													'@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
												}}
											/>
										</IconButton>
									</span>
								</Tooltip>
								<Tooltip title={t('tooltips:admin.syncActuals')} arrow>
									<span>
										<IconButton
											size="small"
											onClick={handleSyncActuals}
											disabled={syncingActuals}
											sx={{ '&:hover': { bgcolor: 'action.hover' } }}
											aria-label={t('a11y:settings.syncActuals')}
										>
											<FactCheckIcon
												sx={{
													animation: syncingActuals ? 'spin 1s linear infinite' : 'none',
													'@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
												}}
											/>
										</IconButton>
									</span>
								</Tooltip>
								<Tooltip title={t('tooltips:admin.syncForexFactory')} arrow>
									<span>
										<IconButton
											size="small"
											onClick={handleSyncForexFactoryRange}
											disabled={syncingForexFactoryRange}
											sx={{ '&:hover': { bgcolor: 'action.hover' } }}
											aria-label={t('a11y:settings.syncForexFactory')}
										>
											<HistoryIcon
												sx={{
													animation: syncingForexFactoryRange ? 'spin 1s linear infinite' : 'none',
													'@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
												}}
											/>
										</IconButton>
									</span>
								</Tooltip>
								<Tooltip title={t('tooltips:admin.backfillInsightKeys')} arrow>
									<span>
										<IconButton
											size="small"
											onClick={handleBackfillInsightKeys}
											disabled={syncingBackfill}
											sx={{ '&:hover': { bgcolor: 'action.hover' } }}
											aria-label={t('a11y:settings.backfillInsightKeys')}
										>
											<BuildIcon
												sx={{
													animation: syncingBackfill ? 'spin 1s linear infinite' : 'none',
													'@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
												}}
											/>
										</IconButton>
									</span>
								</Tooltip>
							</>
						)}
						<IconButton
							size="small"
							onClick={onClose}
							sx={{ '&:hover': { bgcolor: 'action.hover' } }}
							aria-label={t('a11y:settings.closeDrawer')}
						>
							<CloseIcon />
						</IconButton>
					</Box>
				</Box>

				{syncSuccess && (
					<Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1, bgcolor: 'background.paper' }}>
						<Alert severity={syncSuccess.includes('Failed') ? 'error' : 'success'} sx={{ py: 0.5 }}>
							{syncSuccess}
						</Alert>
					</Box>
				)}

				<Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
					{!user && (
						<Button
							variant="contained"
							color="primary"
							fullWidth
							startIcon={<LockOpenIcon />}
							onClick={onOpenAuth}
							sx={{
								textTransform: 'none',
								fontWeight: 700,
								fontSize: { xs: '0.875rem', sm: '0.9375rem' },
								py: 1.25,
								borderRadius: 2,
								boxShadow: '0 2px 8px rgba(15, 111, 236, 0.2)',
								'&:hover': {
									boxShadow: '0 4px 12px rgba(15, 111, 236, 0.3)',
								},
							}}
						>
							{t('settings:drawer.unlockButton')}
						</Button>
					)}
				</Box>

				<Box sx={{ p: { xs: 2, sm: 2.5 }, flexShrink: 0 }}>{navContent}</Box>

				<Box
					sx={{
						flex: 1,
						overflowY: 'auto',
						px: { xs: 2, sm: 2.5 },
						pb: { xs: 2, sm: 3 },
						backgroundImage: 'linear-gradient(to bottom right, rgba(0,0,0,0.01), transparent)',
					}}
				>
					{renderContent()}
				</Box>

				{!user && (
					<Box
						sx={{
							p: { xs: 2, sm: 2.5 },
							borderTop: 1,
							borderColor: 'divider',
							flexShrink: 0,
							bgcolor: 'background.paper',
						}}
					>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ textAlign: 'center', display: 'block' }}
						>
							{t('settings:footer.contactPrompt')}{' '}
							<Button
								component="button"
								onClick={onOpenContact}
								sx={{
									p: 0,
									minWidth: 'auto',
									textTransform: 'none',
									fontSize: 'inherit',
									fontWeight: 600,
									color: 'primary.main',
									textDecoration: 'underline',
									textDecorationColor: 'rgba(25, 118, 210, 0.4)',
									'&:hover': {
										textDecorationColor: 'primary.main',
										bgcolor: 'transparent',
									},
								}}
							>
								{t('settings:footer.contactLinkText')}
							</Button>
						</Typography>
					</Box>
				)}

				{user && (
					<Box
						sx={{
							p: { xs: 2, sm: 2.5 },
							borderTop: 1,
							borderColor: 'divider',
							flexShrink: 0,
							bgcolor: 'background.paper',
						}}
					>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ textAlign: 'center', display: 'block' }}
						>
							{t('settings:footer.contactPrompt')}{' '}
							<Button
								component="button"
								onClick={onOpenContact}
								sx={{
									p: 0,
									minWidth: 'auto',
									textTransform: 'none',
									fontSize: 'inherit',
									fontWeight: 600,
									color: 'primary.main',
									textDecoration: 'underline',
									textDecorationColor: 'rgba(25, 118, 210, 0.4)',
									'&:hover': {
										textDecorationColor: 'primary.main',
										bgcolor: 'transparent',
									},
								}}
							>
								{t('settings:footer.contactLinkText')}
							</Button>
						</Typography>
					</Box>
				)}
			</Drawer>

			{showUnlockModal && (
				<Suspense fallback={null}>
					<AuthModal2
						open={showUnlockModal}
						onClose={() => setShowUnlockModal(false)}
					/>
				</Suspense>
			)}
			{showResetConfirmModal && (
				<ConfirmModal
					open={showResetConfirmModal}
					onClose={() => setShowResetConfirmModal(false)}
					onConfirm={handleResetSettings}
					title={t('settings:modals.confirmReset')}
					message={t('settings:modals.resetSettingsInfo')}
					confirmText={t('settings:modals.resetSettingsConfirmButton')}
					cancelText={t('actions:cancel')}
				/>
			)}
			{showClearSessionConfirm && (
				<ConfirmModal
					open={showClearSessionConfirm}
					onClose={handleCancelClearSession}
					onConfirm={handleConfirmClearSession}
					title={t('settings:modals.clearSession')}
					message={t('settings:modals.clearSessionInfo', { number: clearSessionIndex + 1 })}
					confirmText={t('settings:modals.clearSessionConfirmButton')}
					cancelText={t('actions:cancel')}
				/>
			)}
			{showLogoutConfirmModal && (
				<ConfirmModal
					open={showLogoutConfirmModal}
					onClose={() => setShowLogoutConfirmModal(false)}
					onConfirm={handleLogout}
					title={t('settings:account.logoutConfirm')}
					message={t('settings:modals.logoutConfirmMessage')}
					confirmText={t('settings:modals.logoutConfirmButton')}
					cancelText={t('actions:cancel')}
					slotProps={{ backdrop: { sx: { zIndex: 1699 } } }}
				/>
			)}

			<BackfillProgressModal
				open={showBackfillModal}
				onClose={() => {
					setShowBackfillModal(false);
					setBackfillPhase(null);
					setBackfillResults(null);
					setBackfillError(null);
				}}
				currentPhase={backfillPhase}
				results={backfillResults}
				error={backfillError}
				isLoading={syncingBackfill}
			/>
		</>
	);
}

SettingRow.propTypes = {
	label: PropTypes.string.isRequired,
	description: PropTypes.string,
	children: PropTypes.node.isRequired,
	helperText: PropTypes.string,
	dense: PropTypes.bool,
};

SectionCard.propTypes = {
	title: PropTypes.string,
	subtitle: PropTypes.string,
	children: PropTypes.node.isRequired,
	dense: PropTypes.bool,
};

SettingsSidebar2.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onOpenAuth: PropTypes.func,
	onOpenContact: PropTypes.func,
};
