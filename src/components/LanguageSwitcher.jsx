/**
 * src/components/LanguageSwitcher.jsx
 * 
 * Purpose: Renders language selection dropdown with flag icons
 * Allows users to switch between EN, ES, FR with instant UI re-render
 * Persists selection to localStorage + Firestore (when authenticated)
 * 
 * Changelog:
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
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
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

  const handleLanguageChange = async (code) => {
    try {
      setIsLoading(true);
      
      // Change language immediately (optimistic update)
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
      
      handleClose();
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
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
          px: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        title={t('common:selectLanguage', 'Select Language')}
      >
        {isLoading ? (
          <CircularProgress size={20} sx={{ ml: 0.5 }} />
        ) : (
          <>
            <span style={{ marginRight: 4 }}>{currentLanguage?.flag}</span>
            {currentLanguage?.code.toUpperCase()}
          </>
        )}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
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
              {lang.flag}
            </ListItemIcon>
            {lang.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
