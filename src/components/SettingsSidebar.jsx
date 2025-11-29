/* src/components/SettingsSidebar.jsx */
import React, { useState, useRef } from 'react';
import {
  Drawer,
  Box,
  Tabs,
  Tab,
  Typography,
  IconButton,
  Switch,
  Select,
  MenuItem,
  TextField,
  Button,
  Divider,
  Avatar,
  Menu,
  MenuItem as MenuItemComponent,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Stack,
  Paper,
  Collapse,
  Slider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import AuthModal from './AuthModal';
import AccountModal from './AccountModal';
import UnlockModal from './UnlockModal';
import ConfirmModal from './ConfirmModal';
import SwitchComponent from './Switch';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      sx={{ 
        minHeight: 0,
        display: value === index ? 'block' : 'none',
      }}
      {...other}
    >
      {value === index && (
        <Box sx={{ 
          p: { xs: 2.5, sm: 3 },
          pb: { xs: 3, sm: 3 },
        }}>
          {children}
        </Box>
      )}
    </Box>
  );
}

// Setting Row Component
function SettingRow({ label, description, children, helperText }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          gap: 2,
          mb: 0.5,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            {label}
          </Typography>
          {description && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.5 }}
            >
              {description}
            </Typography>
          )}
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          {children}
        </Box>
      </Box>
      {helperText && (
        <Alert severity="info" sx={{ mt: 1, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
          {helperText}
        </Alert>
      )}
    </Box>
  );
}

export default function SettingsSidebar({ open, onClose }) {
  const { user } = useAuth();
  const { resetSettings } = useSettings();
  const [currentTab, setCurrentTab] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [toggleError, setToggleError] = useState('');
  const [aboutExpanded, setAboutExpanded] = useState(false);

  // Get all settings from parent component via props
  // We'll need to pass these as props or use context
  // For now, using useSettings hook
  const {
    clockStyle,
    canvasSize,
    clockSize,
    sessions,
    updateClockStyle,
    updateCanvasSize,
    updateClockSize,
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
  } = useSettings();

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

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
    } catch (err) {
      console.error(err);
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
    const newSessions = [...sessions];
    newSessions[index][field] = value;
    updateSessions(newSessions);
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
    // Toggle session names visibility in canvas
    toggleShowSessionNamesInCanvas();
  };

  const handleResetSettings = () => {
    resetSettings();
    setShowResetConfirmModal(false);
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        variant="temporary"
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: '420px', md: '460px' },
            maxWidth: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            m: 0,
            maxHeight: '100vh',
            overflow: 'hidden',
          },
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: { xs: 2, sm: 2.5 },
            borderBottom: 1,
            borderColor: 'divider',
            flexShrink: 0,
            minHeight: 64,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            Settings
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{ 
              ml: 2,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* User Section */}
        <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
          {user ? (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  cursor: 'pointer',
                  p: { xs: 1, sm: 1.5 },
                  borderRadius: 2,
                  transition: 'background-color 0.2s',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={handleUserMenuOpen}
              >
                {user.photoURL ? (
                  <Avatar 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'}
                    sx={{ width: 32, height: 32, flexShrink: 0 }}
                    imgProps={{
                      referrerPolicy: "no-referrer",
                      crossOrigin: "anonymous"
                    }}
                  />
                ) : (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', flexShrink: 0 }}>
                    <AccountCircleIcon />
                  </Avatar>
                )}
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <Typography 
                    variant="body2" 
                    noWrap 
                    sx={{ 
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.displayName || 'User'}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    noWrap
                    sx={{ 
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.email}
                  </Typography>
                </Box>
                <ArrowDropDownIcon fontSize="small" sx={{ flexShrink: 0 }} />
              </Box>
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
              >
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
            </>
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={() => setShowAuthModal(true)}
              sx={{ textTransform: 'none' }}
            >
              Login / Sign Up
            </Button>
          )}
        </Box>

        {/* Navigation Tabs */}
        <Tabs
          value={currentTab === false ? 0 : currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            flexShrink: 0,
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: 48,
            '& .MuiTab-root': {
              textTransform: 'none',
              minHeight: 48,
              fontSize: { xs: '0.875rem', sm: '0.9rem' },
              fontWeight: 500,
              minWidth: 0,
              flex: 1,
              py: { xs: 1.5, sm: 1.5 },
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
            },
          }}
        >
          <Tab label="General" />
          <Tab label="Session" />
          <Tab label="About" />
        </Tabs>

        {/* Content Area */}
        <Box 
          sx={{ 
            flex: 1,
            overflow: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'action.hover',
              borderRadius: '4px',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            },
          }}
        >
            {/* General Settings Tab */}
            <TabPanel value={currentTab} index={0}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                General Settings
              </Typography>

              <SettingRow
                label="Hand Clock"
                description="Display the analog clock with hands"
              >
                <SwitchComponent
                  checked={showHandClock}
                  onChange={() => handleToggle(toggleShowHandClock)}
                />
              </SettingRow>

              <SettingRow
                label="Digital Clock"
                description="Display the time in digital format"
              >
                <SwitchComponent
                  checked={showDigitalClock}
                  onChange={() => handleToggle(toggleShowDigitalClock)}
                />
              </SettingRow>

              <SettingRow
                label="Active Session Label"
                description="Display the name of the current active session"
              >
                <SwitchComponent
                  checked={showSessionLabel}
                  onChange={() => handleToggle(toggleShowSessionLabel)}
                />
              </SettingRow>

              {toggleError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {toggleError}
                </Alert>
              )}

              <Divider sx={{ my: 3 }} />

              <SettingRow
                label="Clock Style"
                description="Choose the visual style of your clock"
              >
                <Select
                  value={clockStyle}
                  onChange={(e) => updateClockStyle(e.target.value)}
                  size="small"
                  sx={{ 
                    minWidth: { xs: 120, sm: 150 },
                    fontSize: { xs: '0.85rem', sm: '0.9rem' },
                  }}
                >
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="aesthetic">Aesthetic</MenuItem>
                  <MenuItem value="minimalistic">Minimalistic</MenuItem>
                </Select>
              </SettingRow>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  Canvas Size
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.5, mb: 2 }}
                >
                  Adjust the size of the clock canvas relative to viewport
                </Typography>
                <Box sx={{ px: 1 }}>
                  <Slider
                    value={canvasSize}
                    onChange={(e, newValue) => updateCanvasSize(newValue)}
                    min={25}
                    max={100}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>
              </Box>

              <SettingRow
                label="Background Color"
                description="Choose a custom background color"
              >
                <TextField
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => updateBackgroundColor(e.target.value)}
                  size="small"
                  sx={{ width: 80 }}
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
            </TabPanel>

            {/* Session Settings Tab */}
            <TabPanel value={currentTab} index={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Session Settings ★
                </Typography>
                <Tooltip title="A Session is a high-volatility trading period aligned with key market sessions">
                  <InfoOutlinedIcon fontSize="small" color="action" />
                </Tooltip>
              </Box>

              {sessions.map((kz, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    mb: 2.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: 1,
                    },
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 600, 
                      fontSize: { xs: '0.9rem', sm: '0.95rem' },
                      color: 'text.primary',
                    }}
                  >
                    Session {index + 1}
                  </Typography>

                  <Stack spacing={{ xs: 2, sm: 2.5 }}>
                    <TextField
                      label="Name"
                      size="small"
                      fullWidth
                      value={kz.name}
                      onChange={(e) => handleSessionChange(index, 'name', e.target.value)}
                      placeholder={`Session ${index + 1} Name`}
                      sx={{
                        '& .MuiInputBase-root': {
                          minHeight: { xs: 44, sm: 40 },
                        },
                      }}
                    />

                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 2, sm: 1.5 },
                      }}
                    >
                      <TextField
                        label="Start Time"
                        type="time"
                        size="small"
                        value={kz.startNY}
                        onChange={(e) => handleSessionChange(index, 'startNY', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ 
                          flex: 1,
                          '& .MuiInputBase-root': {
                            minHeight: { xs: 44, sm: 40 },
                          },
                        }}
                      />
                      <TextField
                        label="End Time"
                        type="time"
                        size="small"
                        value={kz.endNY}
                        onChange={(e) => handleSessionChange(index, 'endNY', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ 
                          flex: 1,
                          '& .MuiInputBase-root': {
                            minHeight: { xs: 44, sm: 40 },
                          },
                        }}
                      />
                      <TextField
                        label="Color"
                        type="color"
                        size="small"
                        value={kz.color}
                        onChange={(e) => handleSessionChange(index, 'color', e.target.value)}
                        sx={{ 
                          width: { xs: '100%', sm: 80 },
                          '& .MuiInputBase-root': {
                            minHeight: { xs: 44, sm: 40 },
                          },
                        }}
                      />
                    </Box>
                  </Stack>
                </Paper>
              ))}

              <Divider sx={{ my: 3 }} />

              <SettingRow
                label="Show Time to End"
                description="Display remaining time until active session ends"
              >
                <SwitchComponent
                  checked={showTimeToEnd}
                  onChange={handleToggleShowTimeToEnd}
                />
              </SettingRow>

              <SettingRow
                label="Show Time to Start"
                description="Display time until next session begins"
              >
                <SwitchComponent
                  checked={showTimeToStart}
                  onChange={handleToggleShowTimeToStart}
                />
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

              <Divider sx={{ my: 3 }} />

              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Economic Events ★
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Coming soon! Displays today's high impact Economic Events in the main clock.
                </Typography>
              </Paper>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setShowResetConfirmModal(true)}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                  }}
                >
                  Reset to Default Settings
                </Button>
              </Box>
            </TabPanel>

            {/* About Tab */}
            <TabPanel value={currentTab} index={2}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                About Time 2 Trade
              </Typography>

              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Time 2 Trade</strong> is a web application for futures and forex day traders
                that visualizes key market trading sessions using an innovative dual-circle analog clock design.
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                The app helps traders track active market sessions and manage their trading schedule
                across multiple timezones.
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
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

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Version
              </Typography>
              <Typography variant="body2" color="text.secondary">
                1.0.0-beta
              </Typography>
            </TabPanel>
          </Box>

        {/* Footer - Pro Features Notice */}
        <Box 
          sx={{ 
            p: { xs: 2.5, sm: 2 },
            pb: { xs: 'max(20px, env(safe-area-inset-bottom))', sm: 2 },
            borderTop: 1, 
            borderColor: 'divider',
            flexShrink: 0,
            bgcolor: 'background.paper',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              display: 'block', 
              lineHeight: 1.5,
              fontSize: { xs: '0.75rem', sm: '0.75rem' },
              textAlign: 'center',
            }}
          >
            Create a free account to unlock Pro★ Features.
          </Typography>
        </Box>
      </Drawer>

      {/* Modals */}
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
