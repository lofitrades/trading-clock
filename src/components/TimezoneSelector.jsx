/**
 * src/components/TimezoneSelector.jsx
 * 
 * Purpose: Asynchronous timezone selector with read-only collapsed display and dedicated search field.
 * Key responsibility: Persist user timezone selection to Firestore via SettingsContext while gating guest edits.
 * 
 * v1.4.3 - 2026-01-22 - BEP: Raised timezone popper z-index from 2000 to 12100 so dropdown renders above modals (Dialog z-index 12000) following enterprise stacking context best practices. Ensures dropdown is always visible when timezone selector is used inside modals like on landing page.
 * v1.4.2 - 2026-01-15 - Raise timezone popper z-index above AppBar for guaranteed overlay priority.
 * v1.4.1 - 2026-01-14 - Auth handoff: invoke parent onRequestSignUp to close settings and open AuthModal2 when guests try to edit; fallback modal keeps z-index above AppBar.
 * Changelog:
 * v1.4.0 - 2026-01-14 - Added onTimezoneChange callback prop to notify parent when timezone is selected; enables auto-close of containing modals after selection.
 * v1.3.9 - 2026-01-14 - RAISED Z-INDEX: Changed dropdown popper z-index from 1500 to 1700 so timezone selector dropdown renders above SettingsSidebar2 (z-index 1600) following enterprise modal stacking best practices.
 * v1.3.8 - 2025-12-16 - Added optional children slot to render related timezone settings inside the same card.
 * v1.3.7 - 2025-12-11 - Enter in search forwards to Autocomplete to select highlighted option
 * v1.3.6 - 2025-12-11 - Forward arrow keys for keyboard navigation through results
 * v1.3.5 - 2025-12-11 - Allow Enter key to select highlighted option from search
 * v1.3.4 - 2025-12-11 - Replace spacebar with underscore in search input
 * v1.3.3 - 2025-12-11 - Normalized timezone labels with spaces for readability
 * v1.3.2 - 2025-12-11 - Strengthened auto-focus/select for search on open
 * v1.3.1 - 2025-12-11 - Raised popper z-index to sit above settings drawer
 * v1.3.0 - 2025-12-11 - Converted to settings-panel card and removed floating button; fully responsive mobile-first layout
 * v1.2.3 - 2025-12-09 - Auto-focus and select popper search field on open
 * v1.2.2 - 2025-12-09 - Fix popper search filtering and keep dropdown open during search focus
 * v1.2.1 - 2025-12-09 - Keep dropdown open while focusing search; prevent selecting collapsed label; auto-focus search input
 * v1.2.0 - 2025-12-09 - Switched to async autocomplete with in-popper search field and read-only collapsed display
 * v1.1.0 - 2024-11-29 - Fixed timezone persistence by using updateSelectedTimezone() from SettingsContext
 * v1.0.0 - 2024-09-15 - Initial implementation
 */

import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, TextField, Box, Popper, CircularProgress, Paper, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import AuthModal2 from './AuthModal2';

// Popper with embedded search field; forwards ref so parent can inspect clicks to keep open
const SearchablePopper = React.forwardRef(
  ({ searchQuery, onSearchChange, searchInputRef, mainInputRef, children, placement = 'bottom-start', ...props }, ref) => (
    <Popper
      {...props}
      ref={ref}
      placement={placement}
      modifiers={[
        { name: 'offset', options: { offset: [0, 6] } },
        { name: 'flip', enabled: true },
        { name: 'preventOverflow', options: { padding: 8 } },
      ]}
    >
      <Box sx={{ boxShadow: 3, borderRadius: 1.5, bgcolor: 'background.paper', width: 360, maxWidth: '90vw' }}>
        <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault();
                onSearchChange((prev) => `${prev}_`);
                return;
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                if (mainInputRef?.current) {
                  const event = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                  });
                  mainInputRef.current.dispatchEvent(event);
                }
                return;
              }
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (mainInputRef?.current) {
                  const event = new KeyboardEvent('keydown', { key: e.key, code: e.key, bubbles: true });
                  mainInputRef.current.dispatchEvent(event);
                }
              }
            }}
            size="small"
            fullWidth
            placeholder="Search timezones"
            autoFocus
            inputRef={searchInputRef}
            inputProps={{ 'aria-label': 'Search timezones' }}
          />
        </Box>
        {children}
      </Box>
    </Popper>
  )
);
SearchablePopper.displayName = 'SearchablePopper';

SearchablePopper.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  searchInputRef: PropTypes.shape({ current: PropTypes.any }),
  mainInputRef: PropTypes.shape({ current: PropTypes.any }),
  children: PropTypes.node,
  placement: PropTypes.string,
  props: PropTypes.object,
  ref: PropTypes.any,
};

export default function TimezoneSelector({ textColor = 'inherit', onTimezoneChange, onRequestSignUp, children }) {
  const { user } = useAuth();
  const { selectedTimezone, updateSelectedTimezone } = useSettings();
  const [showUnlock, setShowUnlock] = useState(false);
  const [timezones, setTimezones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const popperRef = useRef(null);
  const anchorRef = useRef(null);
  const searchInputRef = useRef(null);
  const mainInputRef = useRef(null);

  // Load timezones asynchronously so the autocomplete is non-blocking.
  useEffect(() => {
    let active = true;
    const loadTimezones = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const supported = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [];

        const parseOffset = (offset) => {
          if (!offset) return 0;
          const sign = offset.startsWith('-') ? -1 : 1;
          const abs = offset.replace(/^[-+]/, '');
          const [h, m] = abs.split(':').map(Number);
          return sign * ((h || 0) * 60 + (m || 0));
        };

        const list = supported.map((tz) => {
          const readableTz = tz.replace(/_/g, ' ');
          let offset = '';
          try {
            const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
            const parts = fmt.formatToParts(now);
            const tzPart = parts.find((p) => p.type === 'timeZoneName');
            offset = tzPart ? tzPart.value.replace(/UTC|GMT/, '').trim() : '';
          } catch {
            offset = '';
          }

          return {
            timezone: tz,
            offset,
            sortKey: parseOffset(offset),
            label: `(UTC${offset || ''}) ${readableTz}`,
          };
        });

        list.sort((a, b) => a.sortKey - b.sortKey || a.timezone.localeCompare(b.timezone));
        if (active) {
          setTimezones(list);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTimezones();
    return () => {
      active = false;
    };
  }, []);

  const filterOptions = useCallback(
    (opts) => {
      if (!searchQuery) return opts;
      const q = searchQuery.toLowerCase();
      return opts.filter((opt) => opt.label.toLowerCase().includes(q) || opt.timezone.toLowerCase().includes(q));
    },
    [searchQuery]
  );

  const selectedTimezoneObj = useMemo(() => {
    return timezones.find((t) => t.timezone === selectedTimezone) || null;
  }, [timezones, selectedTimezone]);

  const handleChange = (event, newValue) => {
    if (!user) {
      if (onRequestSignUp) {
        onRequestSignUp();
      } else {
        setShowUnlock(true);
      }
      setOpen(false);
      return;
    }

    if (newValue) {
      updateSelectedTimezone(newValue.timezone);
      if (onTimezoneChange) {
        onTimezoneChange(newValue.timezone);
      }
    }
    setOpen(false);
  };

  const handleOpen = () => {
    setSearchQuery('');
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === 'selectOption' || reason === 'escape') {
      setOpen(false);
    }
    // Ignore blur/toggleInput; click-away handled separately
  };

  useEffect(() => {
    if (!open) return undefined;

    const handleClickAway = (event) => {
      const target = event.target;
      if (anchorRef.current && anchorRef.current.contains(target)) return;
      if (popperRef.current && popperRef.current.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', handleClickAway);
    document.addEventListener('touchstart', handleClickAway);

    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      document.removeEventListener('touchstart', handleClickAway);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const rafId = requestAnimationFrame(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        if (searchInputRef.current.select) {
          searchInputRef.current.select();
        }
      }
    });
    const timeoutId = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        if (searchInputRef.current.select) {
          searchInputRef.current.select();
        }
      }
    }, 60);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [open]);

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 1.75, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Timezone
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Switch sessions to your local time instantly.
          </Typography>
        </Box>
        <Box sx={{ p: { xs: 1.25, sm: 1.5 } }} ref={anchorRef}>
          <Autocomplete
            value={selectedTimezoneObj}
            onChange={handleChange}
            open={open}
            onOpen={handleOpen}
            onClose={handleClose}
            openOnFocus
            options={timezones}
            filterOptions={filterOptions}
            getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
            isOptionEqualToValue={(option, value) => {
              if (!option || !value) return false;
              return option.timezone === (value.timezone || value);
            }}
            size="small"
            disableClearable
            clearOnBlur={false}
            freeSolo={false}
            loading={loading}
            popupIcon={null}
            slots={{ popper: SearchablePopper }}
            slotProps={{
              popper: {
                searchQuery,
                onSearchChange: setSearchQuery,
                searchInputRef,
                mainInputRef,
                ref: popperRef,
                placement: 'bottom-start',
                sx: { zIndex: 12100 },
              },
              listbox: {
                sx: {
                  maxHeight: 280,
                  overflow: 'auto',
                  py: 0.5,
                  '& .MuiAutocomplete-option': {
                    paddingY: 0.75,
                    paddingX: 1.25,
                  },
                },
              },
              paper: {
                elevation: 0,
                square: true,
                sx: { boxShadow: 'none', borderRadius: 0 },
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
              },
              '& .MuiInputBase-input': {
                fontSize: '0.9rem',
                color: textColor,
                padding: '10px 12px',
                cursor: 'pointer',
                userSelect: 'none',
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={loading ? 'Loading timezones...' : 'Select timezone'}
                InputProps={{
                  ...params.InputProps,
                  readOnly: true,
                  endAdornment: (
                    <>
                      {loading ? <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                inputRef={mainInputRef}
                inputProps={{
                  ...params.inputProps,
                  readOnly: true,
                  'aria-label': 'Select timezone',
                  onSelect: (e) => e.preventDefault(),
                }}
              />
            )}
          />
        </Box>

        {children ? (
          <Box
            sx={{
              p: { xs: 1.25, sm: 1.5 },
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            {children}
          </Box>
        ) : null}
      </Paper>

      {showUnlock && (
        <AuthModal2
          open={showUnlock}
          onClose={() => setShowUnlock(false)}
        />
      )}
    </>
  );
}

TimezoneSelector.propTypes = {
  textColor: PropTypes.string,
  onTimezoneChange: PropTypes.func,
  onRequestSignUp: PropTypes.func,
  children: PropTypes.node,
};
