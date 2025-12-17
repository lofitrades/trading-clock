/**
 * src/components/SettingsSidebar2.jsx
 * 
 * Purpose: Live-preview friendly settings drawer that keeps the canvas visible while users tweak general, session, and account preferences.
 * Inspired by modern app shells (Airbnb/ChatGPT) with quick toggles, sectional pills, and responsive cards that mirror existing settings logic.
 * 
 * Changelog:
 * v1.2.8 - 2025-12-17 - Added Hide Numbers and Hide Clock Hands child settings under Analog Hand Clock for granular canvas customization.
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
import { useMemo, useState, useEffect } from 'react';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Divider,
	Drawer,
	IconButton,
	Paper,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import AccountModal from './AccountModal';
import UnlockModal from './UnlockModal';
import ConfirmModal from './ConfirmModal';
import SwitchComponent from './Switch';
import useFullscreen from '../hooks/useFullscreen';
import TimezoneSelector from './TimezoneSelector';

const navItems = [
	{ key: 'general', label: 'General', icon: <SettingsRoundedIcon fontSize="small" /> },
	{ key: 'session', label: 'Sessions', icon: <AccessTimeRoundedIcon fontSize="small" /> },
	{ key: 'about', label: 'About', icon: <InfoRoundedIcon fontSize="small" /> },
];

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

export default function SettingsSidebar2({ open, onClose, onOpenAuth }) {
	const { user } = useAuth();
	const {
		sessions,
		updateSessions,
		backgroundColor,
		updateBackgroundColor,
		backgroundBasedOnSession,
		toggleBackgroundBasedOnSession,
		showHandClock,
		showDigitalClock,
		showSessionLabel,
		showTimezoneLabel,
		toggleShowHandClock,
		toggleShowDigitalClock,
		toggleShowSessionLabel,
		toggleShowTimezoneLabel,
		showTimeToEnd,
		showTimeToStart,
		toggleShowTimeToEnd,
		toggleShowTimeToStart,
		showSessionNamesInCanvas,
		toggleShowSessionNamesInCanvas,
		showEventsOnCanvas,
		toggleShowEventsOnCanvas,
		hideClockNumbers,
		toggleHideClockNumbers,
		hideClockHands,
		toggleHideClockHands,
		resetSettings,
	} = useSettings();

	const [activeSection, setActiveSection] = useState('general');
	const [showAccountModal, setShowAccountModal] = useState(false);
	const [showUnlockModal, setShowUnlockModal] = useState(false);
	const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
	const [showClearSessionConfirm, setShowClearSessionConfirm] = useState(false);
	const [clearSessionIndex, setClearSessionIndex] = useState(null);
	const [userMenuAnchor, setUserMenuAnchor] = useState(null);
	const [toggleError, setToggleError] = useState('');
	const [aboutContent, setAboutContent] = useState('');

	const { isFullscreen, canFullscreen, toggleFullscreen } = useFullscreen();

	useEffect(() => {
		fetch('/AboutContent.txt')
			.then((response) => response.text())
			.then((text) => setAboutContent(text))
			.catch((error) => console.error('Failed to load About content:', error));
	}, []);

	const handleUserMenuClose = () => setUserMenuAnchor(null);

	const handleLogout = async () => {
		try {
			await signOut(auth);
			resetSettings();
			handleUserMenuClose();
			onClose();
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
		if (!user) {
			setShowUnlockModal(true);
			return;
		}
		toggleShowSessionNamesInCanvas();
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
				aria-label="Settings sections"
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
		[activeSection]
	);

	const quickToggles = (
		<SectionCard dense>
			<Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 0.4, color: 'text.secondary' }}>
				Visibility
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
							Analog Hand Clock
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
							Analog with sessions
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
									Events on canvas
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
									Display economic event markers on the analog face
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
									Session names
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
									Display session names curved along the session donuts
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
									Hide Numbers
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
									Hide 1-12 clock numbers from the analog face
								</Typography>
							</Box>
							<SwitchComponent
								checked={hideClockNumbers}
								onChange={toggleHideClockNumbers}
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
									Hide Clock Hands
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
									Hide hour, minute, and second hands from the clock
								</Typography>
							</Box>
							<SwitchComponent
								checked={hideClockHands}
								onChange={toggleHideClockHands}
							/>
						</Box>
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
						borderBottom: '1px solid',
						borderColor: 'divider',
					}}
				>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
							Digital Clock
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
							Readable digits
						</Typography>
					</Box>
					<SwitchComponent checked={showDigitalClock} onChange={() => handleToggle(toggleShowDigitalClock)} />
				</Box>

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
							Timezone
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
							Display the selected timezone.
						</Typography>
					</Box>
					<SwitchComponent checked={showTimezoneLabel} onChange={toggleShowTimezoneLabel} />
				</Box>

				<Divider sx={{ width: '100%', mx: 'auto', borderColor: 'divider' }} />

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
							Session Label
						</Typography>
						<Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
							Current session tag
						</Typography>
					</Box>
					<SwitchComponent checked={showSessionLabel} onChange={() => handleToggle(toggleShowSessionLabel)} />
				</Box>

				{showSessionLabel && (
					<Divider sx={{ width: '93%', mx: 'auto', borderColor: 'divider' }} />
				)}

				{showSessionLabel && (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							gap: 1,
							px: 1.75,
							py: 1.25,
							bgcolor: 'background.paper',
							borderColor: 'divider',
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
									Countdown to Start
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
									Display time until next session begins
								</Typography>
							</Box>
							<SwitchComponent checked={showTimeToStart} onChange={handleToggleShowTimeToStart} />
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
									Countdown to End
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
									Display remaining time until active session ends
								</Typography>
							</Box>
							<SwitchComponent checked={showTimeToEnd} onChange={handleToggleShowTimeToEnd} />
						</Box>
					</Box>
				)}
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
			<Box sx={{ mb: { xs: 2, sm: 3 } }}>
				<TimezoneSelector onRequestSignUp={onOpenAuth} />
			</Box>

			{quickToggles}

			<SectionCard>
				<Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 0.4, color: 'text.secondary', display: 'block', mb: 1 }}>
					Background
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
					<Box sx={{ px: 1.75, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
						<SettingRow label="Background Color" description="Pick a custom background to match your workspace">
							<TextField
								type="color"
								value={backgroundColor}
								onChange={(event) => updateBackgroundColor(event.target.value)}
								size="small"
								sx={{ width: { xs: '100%', sm: 90 } }}
							/>
						</SettingRow>
					</Box>
					<Box sx={{ px: 1.75, py: 1.25 }}>
						<SettingRow
							label="Session-based Background"
							description="Automatically shift background color to match the active session"
						>
							<SwitchComponent
								checked={backgroundBasedOnSession}
								onChange={toggleBackgroundBasedOnSession}
							/>
						</SettingRow>
					</Box>
				</Paper>

				<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
					<Button
						variant="outlined"
						color="error"
						onClick={() => setShowResetConfirmModal(true)}
						sx={{ textTransform: 'none', borderRadius: 2, px: 2.5, py: 1 }}
					>
						Reset to Default Settings
					</Button>
				</Box>
			</SectionCard>
		</>
	);

	const renderSessionSection = (
		<>
			<SectionCard
				title="Session schedule"
				subtitle="Edit your trading sessions. Auth is required to sync changes."
			>
				<Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 0.4, color: 'text.secondary', display: 'block', mb: 1 }}>
					Sessions
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
									Session {index + 1}
								</Typography>
								<IconButton
									size="small"
									onClick={() => handleRequestClearSession(index)}
									sx={{ color: 'text.secondary' }}
									aria-label={`Clear session ${index + 1}`}
								>
									<DeleteOutlineIcon fontSize="small" />
								</IconButton>
							</Box>

							<TextField
								label="Name"
								size="small"
								fullWidth
								value={session.name}
								onChange={(event) => handleSessionChange(index, 'name', event.target.value)}
								placeholder={`Session ${index + 1} Name`}
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
									label="Start Time"
									type="time"
									size="small"
									value={session.startNY}
									onChange={(event) => handleSessionChange(index, 'startNY', event.target.value)}
									InputLabelProps={{ shrink: true }}
								/>
								<TextField
									label="End Time"
									type="time"
									size="small"
									value={session.endNY}
									onChange={(event) => handleSessionChange(index, 'endNY', event.target.value)}
									InputLabelProps={{ shrink: true }}
								/>
								<TextField
									label="Color"
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

	const renderAboutSection = (
		<SectionCard>
			<Box
				dangerouslySetInnerHTML={{ __html: aboutContent }}
				sx={{
					'& h2': {
						fontSize: { xs: '1.5rem', sm: '1.75rem' },
						fontWeight: 700,
						mb: 2,
						mt: 0,
					},
					'& h3': {
						fontSize: { xs: '1.1rem', sm: '1.25rem' },
						fontWeight: 700,
						mb: 1.5,
						mt: 3,
					},
					'& p': {
						fontSize: { xs: '0.95rem', sm: '1rem' },
						lineHeight: 1.7,
						mb: 2,
						color: 'text.primary',
					},
					'& ul': {
						pl: 3,
						mb: 2,
					},
					'& li': {
						fontSize: { xs: '0.95rem', sm: '1rem' },
						lineHeight: 1.7,
						mb: 1,
					},
					'& strong': {
						fontWeight: 700,
					},
					'& a': {
						color: 'primary.main',
						textDecoration: 'none',
						'&:hover': {
							textDecoration: 'underline',
						},
					},
				}}
			/>
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
				open={open && !showUnlockModal && !showAccountModal && !showResetConfirmModal}
				onClose={onClose}
				variant="temporary"
				ModalProps={{ keepMounted: true }}
				sx={{ zIndex: 1355, '& .MuiDrawer-paper': { boxSizing: 'border-box' } }}
				PaperProps={{
					sx: {
						width: { xs: '100%', sm: '100%', md: 520, lg: 560 },
						maxWidth: '100vw',
						height: '100vh',
						display: 'flex',
						flexDirection: 'column',
						boxShadow: '-20px 0 40px rgba(0,0,0,0.12)',
						borderLeft: 1,
						borderColor: 'divider',
					},
				}}
			>
				<Box
					sx={{
						p: { xs: 2, sm: 2.5 },
						borderBottom: 1,
						borderColor: 'divider',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 1.5,
						flexShrink: 0,
						backgroundImage: 'linear-gradient(120deg, rgba(0,0,0,0.02), transparent)',
					}}
				>
					<Box>
						<Typography variant="h6" sx={{ fontWeight: 700 }}>
							Settings
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Live-preview updates on the canvas
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} arrow>
							<span>
								<IconButton
									size="small"
									onClick={toggleFullscreen}
									disabled={!canFullscreen}
									sx={{ '&:hover': { bgcolor: 'action.hover' } }}
									aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
									aria-pressed={isFullscreen}
								>
									{isFullscreen ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />}
								</IconButton>
							</span>
						</Tooltip>
						<IconButton
							size="small"
							onClick={onClose}
							sx={{ '&:hover': { bgcolor: 'action.hover' } }}
							aria-label="Close settings"
						>
							<CloseIcon />
						</IconButton>
					</Box>
				</Box>

				<Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
					{user ? (
						<>
							<Paper
								elevation={0}
								sx={{
									border: 1,
									borderColor: 'divider',
									borderRadius: 2,
									overflow: 'hidden',
								}}
							>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 1.25,
										p: 1.25,
										cursor: 'pointer',
										bgcolor: 'action.hover',
									}}
								onClick={() => {
									// If collapsing (menu is open), just close it
									if (userMenuAnchor) {
										setUserMenuAnchor(false);
									}
									// If expanding and no displayName, open account modal directly
									else if (!user.displayName) {
										setShowAccountModal(true);
									}
									// Otherwise toggle the menu normally
									else {
										setUserMenuAnchor(true);
									}
								}}
								>
									{user.photoURL ? (
										<Avatar
											src={user.photoURL}
										alt={user.displayName || user.email || 'User'}
										sx={{ width: 40, height: 40 }}
										imgProps={{ referrerPolicy: 'no-referrer', crossOrigin: 'anonymous' }}
									/>
								) : (
									<Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
										<AccountCircleIcon />
									</Avatar>
								)}
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
										{user.displayName || user.email}
									</Typography>
									<Typography variant="caption" color="text.secondary" noWrap>
										{user.displayName ? user.email : 'Click to add your name'}
										</Typography>
									</Box>
									<ArrowDropDownIcon fontSize="small" sx={{ transform: userMenuAnchor ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
								</Box>
								{userMenuAnchor && (
									<Box sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
										<Button
											fullWidth
											onClick={() => {
												setShowAccountModal(true);
												setUserMenuAnchor(false);
											}}
											sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.25, px: 1.5 }}
										>
											My Account
										</Button>
										<Button
											fullWidth
											onClick={() => {
												handleLogout();
												setUserMenuAnchor(false);
											}}
											sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.25, px: 1.5 }}
										>
											Log out
										</Button>
									</Box>
								)}
							</Paper>
						</>
					) : (
						<Button
							variant="contained"
							fullWidth
							onClick={onOpenAuth}
							sx={{ textTransform: 'none', py: 1 }}
						>
							Login / Sign Up
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
							Create a free account to unlock Pro★ Features.
						</Typography>
					</Box>
				)}
			</Drawer>

			{showAccountModal && (
				<AccountModal
					open={showAccountModal}
					onClose={() => setShowAccountModal(false)}
					user={user}
				/>
			)}
			{showUnlockModal && (
				<UnlockModal
					onClose={() => setShowUnlockModal(false)}
					onSignUp={() => {
						setShowUnlockModal(false);
						if (onOpenAuth) onOpenAuth();
					}}
				/>
			)}
			{showResetConfirmModal && (
				<ConfirmModal
					open={showResetConfirmModal}
					onClose={() => setShowResetConfirmModal(false)}
					onConfirm={handleResetSettings}
					title="Reset to Default Settings?"
					message="This will reset all settings including sessions, colors, and preferences to their default values. This action cannot be undone."
					confirmText="Reset Settings"
					cancelText="Cancel"
				/>
			)}
			{showClearSessionConfirm && (
				<ConfirmModal
					open={showClearSessionConfirm}
					onClose={handleCancelClearSession}
					onConfirm={handleConfirmClearSession}
					title="Clear this session?"
					message="This will clear the name, start, end, and color fields for this session. Continue?"
					confirmText="Clear session"
					cancelText="Cancel"
				/>
			)}
		</>
	);
}

SectionCard.propTypes = {
	title: PropTypes.string,
	subtitle: PropTypes.string,
	children: PropTypes.node,
	dense: PropTypes.bool,
};

SettingRow.propTypes = {
	label: PropTypes.string.isRequired,
	description: PropTypes.string,
	children: PropTypes.node.isRequired,
	helperText: PropTypes.string,
	dense: PropTypes.bool,
};

SettingsSidebar2.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onOpenAuth: PropTypes.func,
};
