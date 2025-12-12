/**
 * src/components/SettingsModal.jsx
 * 
 * Purpose: ChatGPT-style settings modal consolidating general, session, and about controls in a responsive layout.
 * Mirrors SettingsSidebar functionality with left navigation, account actions, and fullscreen toggle optimized for mobile.
 * 
 * Changelog:
 * v1.0.0 - 2025-12-11 - Replace drawer with ChatGPT-inspired modal while preserving all settings behaviors
 */

import React, { useMemo, useState } from 'react';
import {
	Dialog,
	Box,
	Typography,
	IconButton,
	Button,
	Avatar,
	Menu,
	MenuItem as MenuItemComponent,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Divider,
	Paper,
	TextField,
	Slider,
	Alert,
	Tooltip,
	useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import InfoIcon from '@mui/icons-material/Info';
import { useTheme } from '@mui/material/styles';
import { signOut } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { auth } from '../firebase';
import SwitchComponent from './Switch';
import AuthModal from './AuthModal';
import AccountModal from './AccountModal';
import UnlockModal from './UnlockModal';
import ConfirmModal from './ConfirmModal';
import useFullscreen from '../hooks/useFullscreen';

const navItems = [
	{ key: 'general', label: 'General', icon: <SettingsRoundedIcon fontSize="small" /> },
	{ key: 'session', label: 'Sessions', icon: <AccessTimeRoundedIcon fontSize="small" /> },
	{ key: 'about', label: 'About', icon: <InfoOutlinedIcon fontSize="small" /> },
];

function SectionCard({ title, subtitle, children }) {
	return (
		<Paper
			elevation={0}
			sx={{
				p: { xs: 2, sm: 3 },
				borderRadius: 3,
				border: 1,
				borderColor: 'divider',
				mb: { xs: 2, sm: 3 },
				bgcolor: 'background.paper',
			}}
		>
			{(title || subtitle) && (
				<Box sx={{ mb: title || subtitle ? 2 : 0 }}>
					{title && (
						<Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
							{title}
						</Typography>
					)}
					{subtitle && (
						<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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

export default function SettingsModal({ open, onClose }) {
	const { user } = useAuth();
	const {
		clockStyle,
		canvasSize,
		sessions,
		updateClockStyle,
		updateCanvasSize,
		updateSessions,
		backgroundColor,
		updateBackgroundColor,
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
		showEventsOnCanvas,
		toggleShowEventsOnCanvas,
		resetSettings,
	} = useSettings();

	const [activeSection, setActiveSection] = useState('general');
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [showAccountModal, setShowAccountModal] = useState(false);
	const [showUnlockModal, setShowUnlockModal] = useState(false);
	const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
	const [userMenuAnchor, setUserMenuAnchor] = useState(null);
	const [toggleError, setToggleError] = useState('');

	const { isFullscreen, canFullscreen, toggleFullscreen } = useFullscreen();
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

	const handleUserMenuOpen = (event) => {
		setUserMenuAnchor(event.currentTarget);
	};

	const handleUserMenuClose = () => {
		setUserMenuAnchor(null);
	};

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

	const handleResetSettings = () => {
		resetSettings();
		setShowResetConfirmModal(false);
	};

	const navContent = useMemo(
		() => (
			<List sx={{ width: '100%' }}>
				{navItems.map((item) => (
					<ListItemButton
						key={item.key}
						selected={activeSection === item.key}
						onClick={() => setActiveSection(item.key)}
						sx={{
							borderRadius: { xs: 2, md: 1.5 },
							mx: { xs: 1, md: 0.75 },
							mb: { xs: 0.5, md: 0.25 },
							'&.Mui-selected': {
								bgcolor: 'action.selected',
								'&:hover': { bgcolor: 'action.selected' },
							},
						}}
					>
						<ListItemIcon sx={{ minWidth: 36, color: 'text.primary' }}>{item.icon}</ListItemIcon>
						<ListItemText
							primary={item.label}
							primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
						/>
					</ListItemButton>
				))}
			</List>
		),
		[activeSection]
	);

	const renderGeneralSection = () => (
		<SectionCard title="General" subtitle="Clock visibility, style, and background preferences.">
			<SettingRow label="Hand Clock" description="Display the analog clock with hands">
				<SwitchComponent checked={showHandClock} onChange={() => handleToggle(toggleShowHandClock)} />
			</SettingRow>

			{showHandClock && (
				<Box
					sx={{
						pl: 2,
						borderLeft: 1,
						borderColor: 'divider',
						my: 1,
					}}
				>
					<SettingRow
						label="Show Events on Clock"
						description="Display economic event markers on the analog clock face"
						dense
					>
						<SwitchComponent checked={showEventsOnCanvas} onChange={toggleShowEventsOnCanvas} />
					</SettingRow>
				</Box>
			)}

			<Divider sx={{ my: 2 }} />

			<SettingRow label="Digital Clock" description="Display the time in digital format">
				<SwitchComponent checked={showDigitalClock} onChange={() => handleToggle(toggleShowDigitalClock)} />
			</SettingRow>

			<SettingRow label="Active Session Label" description="Display the name of the current active session">
				<SwitchComponent checked={showSessionLabel} onChange={() => handleToggle(toggleShowSessionLabel)} />
			</SettingRow>

			{toggleError && (
				<Alert severity="error" sx={{ mt: 1.5 }}>
					{toggleError}
				</Alert>
			)}

			<Divider sx={{ my: 2 }} />

			<SettingRow label="Clock Style" description="Choose the visual style of your clock">
				<TextField
					select
					value={clockStyle}
					onChange={(event) => updateClockStyle(event.target.value)}
					size="small"
					sx={{ minWidth: 160 }}
				>
					<MenuItemComponent value="normal">Normal</MenuItemComponent>
					<MenuItemComponent value="aesthetic">Aesthetic</MenuItemComponent>
					<MenuItemComponent value="minimalistic">Minimalistic</MenuItemComponent>
				</TextField>
			</SettingRow>

			<Box sx={{ my: 2 }}>
				<Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
					Canvas Size
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
					Adjust the size of the clock canvas relative to viewport
				</Typography>
				<Slider
					value={canvasSize}
					onChange={(event, value) => updateCanvasSize(value)}
					min={25}
					max={100}
					valueLabelDisplay="auto"
					valueLabelFormat={(value) => `${value}%`}
				/>
			</Box>

			<SettingRow label="Background Color" description="Choose a custom background color">
				<TextField
					type="color"
					value={backgroundColor}
					onChange={(event) => updateBackgroundColor(event.target.value)}
					size="small"
					sx={{ width: 90 }}
				/>
			</SettingRow>

			<SettingRow
				label="Background based on active Session"
				description="Automatically change background color to match the active session"
			>
				<SwitchComponent
					checked={backgroundBasedOnSession}
					onChange={toggleBackgroundBasedOnSession}
				/>
			</SettingRow>
		</SectionCard>
	);

	const renderSessionSection = () => (
		<SectionCard
			title="Sessions"
			subtitle="Edit trading sessions, timings, and visibility preferences."
		>
			{sessions.map((session, index) => (
				<Paper
					key={index}
					elevation={0}
					sx={{
						p: { xs: 1.5, sm: 2 },
						border: 1,
						borderColor: 'divider',
						borderRadius: 2,
						mb: 2,
					}}
				>
					<Typography
						variant="subtitle2"
						sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}
					>
						Session {index + 1}
					</Typography>

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
							gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 120px' },
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
							inputProps={{ style: { padding: 0, height: 38 } }}
						/>
					</Box>
				</Paper>
			))}

			<Divider sx={{ my: 2 }} />

			<SettingRow label="Show Time to End" description="Display remaining time until active session ends">
				<SwitchComponent checked={showTimeToEnd} onChange={handleToggleShowTimeToEnd} />
			</SettingRow>

			<SettingRow label="Show Time to Start" description="Display time until next session begins">
				<SwitchComponent checked={showTimeToStart} onChange={handleToggleShowTimeToStart} />
			</SettingRow>

			<SettingRow
				label="Show Session Names in Canvas"
				description="Display session names curved along the session donuts"
			>
				<SwitchComponent
					checked={showSessionNamesInCanvas}
					onChange={handleToggleShowSessionNamesInCanvas}
				/>
			</SettingRow>

			<Divider sx={{ my: 2 }} />

			<Paper
				elevation={0}
				sx={{
					p: 2,
					bgcolor: 'action.hover',
					borderRadius: 2,
					border: 1,
					borderColor: 'divider',
				}}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<InfoIcon fontSize="small" color="action" />
					<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
						Economic Events ★
					</Typography>
				</Box>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
					Coming soon! Displays today's high impact Economic Events in the main clock.
				</Typography>
			</Paper>

			<Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
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
	);

	const renderAboutSection = () => (
		<SectionCard title="About" subtitle="Learn more about Time 2 Trade.">
			<Typography variant="body1" sx={{ mb: 1.5 }}>
				<strong>Time 2 Trade</strong> is a web application for futures and forex day traders
				that visualizes key market trading sessions using an innovative dual-circle analog clock design.
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
				The app helps traders track active market sessions and manage their trading schedule across multiple timezones.
			</Typography>

			<Divider sx={{ my: 2 }} />

			<Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
				Developer
			</Typography>
			<Typography variant="body2" sx={{ mb: 2 }}>
				Developed by: <strong>
					<a
						href="https://x.com/lofi_trades"
						target="_blank"
						rel="noopener noreferrer"
						style={{ color: 'inherit', textDecoration: 'none' }}
					>
						@lofi_trades
					</a>
				</strong>
			</Typography>

			<Divider sx={{ my: 2 }} />

			<Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
				Version
			</Typography>
			<Typography variant="body2" color="text.secondary">
				1.0.0-beta
			</Typography>
		</SectionCard>
	);

	const renderContent = useMemo(() => {
		if (activeSection === 'session') return renderSessionSection();
		if (activeSection === 'about') return renderAboutSection();
		return renderGeneralSection();
	}, [activeSection, backgroundBasedOnSession, backgroundColor, canvasSize, clockStyle, sessions, showDigitalClock, showEventsOnCanvas, showHandClock, showSessionLabel, showSessionNamesInCanvas, showTimeToEnd, showTimeToStart, toggleError]);

	return (
		<>
			<Dialog
				open={open}
				onClose={onClose}
				fullWidth
				maxWidth="lg"
				fullScreen={fullScreen}
				aria-labelledby="settings-modal-title"
				PaperProps={{
					sx: {
						borderRadius: fullScreen ? 0 : 3,
						overflow: 'hidden',
					},
				}}
			>
				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						minHeight: fullScreen ? '100vh' : 620,
						maxHeight: fullScreen ? '100vh' : '85vh',
						bgcolor: 'background.default',
					}}
				>
					<Box
						component="nav"
						sx={{
							width: { xs: '100%', md: 260 },
							flexShrink: 0,
							borderRight: { md: 1, xs: 0 },
							borderBottom: { xs: 1, md: 0 },
							borderColor: 'divider',
							bgcolor: 'background.paper',
						}}
					>
						<Box sx={{ p: 2.25, borderBottom: 1, borderColor: 'divider' }}>
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
								<Typography id="settings-modal-title" variant="h6" sx={{ fontWeight: 700 }}>
									Settings
								</Typography>
								<Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0.5 }}>
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
												{isFullscreen ? (
													<FullscreenExitRoundedIcon fontSize="medium" />
												) : (
													<FullscreenRoundedIcon fontSize="medium" />
												)}
											</IconButton>
										</span>
									</Tooltip>
									<Tooltip title="Close settings" arrow>
										<IconButton
											size="small"
											onClick={onClose}
											sx={{ '&:hover': { bgcolor: 'action.hover' } }}
											aria-label="Close settings"
										>
											<CloseIcon fontSize="medium" />
										</IconButton>
									</Tooltip>
								</Box>
							</Box>

							<Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.25 }}>
								{user ? (
									<Avatar
										src={user.photoURL || undefined}
										alt={user.displayName || 'User'}
										sx={{ width: 40, height: 40 }}
										onClick={handleUserMenuOpen}
										imgProps={{ referrerPolicy: 'no-referrer', crossOrigin: 'anonymous' }}
									/>
								) : (
									<Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
										<AccountCircleIcon />
									</Avatar>
								)}
								<Box sx={{ flex: 1, minWidth: 0 }}>
									<Typography
										variant="subtitle2"
										sx={{ fontWeight: 700, lineHeight: 1.2 }}
										noWrap
									>
										{user ? user.displayName || 'User' : 'Guest user'}
									</Typography>
									<Typography variant="caption" color="text.secondary" noWrap>
										{user ? user.email : 'Sign in to sync settings'}
									</Typography>
								</Box>
								<IconButton size="small" onClick={user ? handleUserMenuOpen : () => setShowAuthModal(true)}>
									<ArrowDropDownIcon />
								</IconButton>
							</Box>

							<Menu anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={handleUserMenuClose}>
								<MenuItemComponent
									onClick={() => {
										setShowAccountModal(true);
										handleUserMenuClose();
									}}
								>
									My Account
								</MenuItemComponent>
								<MenuItemComponent onClick={handleLogout}>Log out</MenuItemComponent>
							</Menu>

							{!user && (
								<Button
									variant="contained"
									fullWidth
									onClick={() => setShowAuthModal(true)}
									sx={{ mt: 2, textTransform: 'none' }}
								>
									Login / Sign Up
								</Button>
							)}
						</Box>

						{navContent}
					</Box>

					<Box
						sx={{
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							bgcolor: 'background.default',
						}}
					>
						<Box
							sx={{
								display: { xs: 'none', md: 'flex' },
								justifyContent: 'flex-end',
								alignItems: 'center',
								p: 1.5,
								borderBottom: 1,
								borderColor: 'divider',
							}}
						>
							<IconButton onClick={onClose} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
								<CloseIcon />
							</IconButton>
						</Box>

						<Box
							sx={{
								flex: 1,
								overflowY: 'auto',
								p: { xs: 2, sm: 3 },
								backgroundImage: 'linear-gradient(to bottom right, rgba(0,0,0,0.02), transparent)',
							}}
						>
							{renderContent}
						</Box>

						<Box
							sx={{
								p: { xs: 2, sm: 2.5 },
								borderTop: 1,
								borderColor: 'divider',
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
					</Box>
				</Box>
			</Dialog>

			{showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
			{showAccountModal && (
				<AccountModal
					onClose={() => setShowAccountModal(false)}
					user={user}
					resetSettings={resetSettings}
				/>
			)}
			{showUnlockModal && (
				<UnlockModal
					onClose={() => setShowUnlockModal(false)}
					onSignUp={() => {
						setShowUnlockModal(false);
						setShowAuthModal(true);
					}}
				/>
			)}
			{showResetConfirmModal && (
				<ConfirmModal
					open={showResetConfirmModal}
					onClose={() => setShowResetConfirmModal(false)}
					onConfirm={handleResetSettings}
					title="Reset to Default Settings?"
					message="This will reset all settings including clock style, sessions, colors, and preferences to their default values. This action cannot be undone."
					confirmText="Reset Settings"
					cancelText="Cancel"
				/>
			)}
		</>
	);
}
