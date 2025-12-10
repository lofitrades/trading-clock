/**
 * src/components/TimezoneSelector.jsx
 * 
 * Purpose: Asynchronous timezone selector with read-only collapsed display and dedicated search field.
 * Key responsibility: Persist user timezone selection to Firestore via SettingsContext while gating guest edits.
 * 
 * Changelog:
 * v1.2.3 - 2025-12-09 - Auto-focus and select popper search field on open
 * v1.2.2 - 2025-12-09 - Fix popper search filtering and keep dropdown open during search focus
 * v1.2.1 - 2025-12-09 - Keep dropdown open while focusing search; prevent selecting collapsed label; auto-focus search input
 * v1.2.0 - 2025-12-09 - Switched to async autocomplete with in-popper search field and read-only collapsed display
 * v1.1.0 - 2024-11-29 - Fixed timezone persistence by using updateSelectedTimezone() from SettingsContext
 * v1.0.0 - 2024-09-15 - Initial implementation
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconButton, Tooltip, Autocomplete, TextField, Box, Popper, CircularProgress } from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import UnlockModal from './UnlockModal';

// Popper with embedded search field; forwards ref so parent can inspect clicks to keep open
const SearchablePopper = React.forwardRef(({ searchQuery, onSearchChange, searchInputRef, children, ...props }, ref) => (
  <Popper
    {...props}
    ref={ref}
    placement="top"
    modifiers={[{ name: 'offset', options: { offset: [0, -6] } }]}
  >
    <Box sx={{ boxShadow: 3, borderRadius: 1.5, bgcolor: 'background.paper', width: 360, maxWidth: '90vw' }}>
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
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
));
SearchablePopper.displayName = 'SearchablePopper';

export default function TimezoneSelector({ textColor, onRequestSignUp, eventsOpen, onToggleEvents }) {
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
          let offset = '';
          try {
            const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
            const parts = fmt.formatToParts(now);
            const tzPart = parts.find((p) => p.type === 'timeZoneName');
            offset = tzPart ? tzPart.value.replace(/UTC|GMT/, '').trim() : '';
          } catch (error) {
            offset = '';
          }

          return {
            timezone: tz,
            offset,
            sortKey: parseOffset(offset),
            label: `(UTC${offset || ''}) ${tz}`,
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
      setShowUnlock(true);
      return;
    }

    if (newValue) {
      updateSelectedTimezone(newValue.timezone);
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
    const id = requestAnimationFrame(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        if (searchInputRef.current.select) {
          searchInputRef.current.select();
        }
      }
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <>
      <Box
        ref={anchorRef}
        sx={{
          position: 'fixed',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          width: '100%',
          maxWidth: 340,
          px: 2,
        }}
      >
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
              ref: popperRef,
            },
            listbox: {
              sx: {
                maxHeight: 280,
                overflow: 'auto',
                py: 0.5,
                '& .MuiAutocomplete-option': {
                  paddingY: 0.75,
                  paddingX: 1.5,
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
              backgroundColor: 'transparent',
              border: 'none',
              '& fieldset': { border: 'none' },
              '&:hover fieldset': { border: 'none' },
            },
            '& .MuiInputBase-input': {
              textAlign: 'center',
              fontSize: '0.8rem',
              color: textColor,
              padding: '6px 10px',
              cursor: 'pointer',
              userSelect: 'none',
              caretColor: 'transparent',
              '&::selection': {
                backgroundColor: 'transparent',
              },
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
      {onToggleEvents && (
        <Tooltip title="Economic Events" placement="left">
          <IconButton
            onClick={onToggleEvents}
            sx={{
              position: 'fixed',
              bottom: 10,
              right: 'max(12px, env(safe-area-inset-right, 0px))',
              color: textColor,
              zIndex: 1000,
              '&:hover': {
                backgroundColor: 'transparent',
                opacity: 0.7,
              },
            }}
            aria-label="Toggle economic events"
          >
            <EventNoteIcon sx={{ fontSize: 28 }} />
          </IconButton>
        </Tooltip>
      )}
      {showUnlock && (
        <UnlockModal
          onClose={() => setShowUnlock(false)}
          onSignUp={() => {
            setShowUnlock(false);
            onRequestSignUp && onRequestSignUp();
          }}
        />
      )}
    </>
  );
}
