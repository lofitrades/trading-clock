/* src/components/TimezoneSelector.jsx */
/* src/components/TimezoneSelector.jsx */
import { useState, useMemo } from 'react';
import { IconButton, Tooltip, Autocomplete, TextField, Box } from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import UnlockModal from './UnlockModal';

/**
 * TimezoneSelector - Timezone dropdown with Firestore persistence
 * v1.1.0 - Fixed timezone persistence by using updateSelectedTimezone() from SettingsContext
 */
export default function TimezoneSelector({ textColor, onRequestSignUp, eventsOpen, onToggleEvents }) {
  const { user } = useAuth();
  const { selectedTimezone, updateSelectedTimezone } = useSettings();
  const [showUnlock, setShowUnlock] = useState(false);

  // Build the timezone list once. We keep label and a numeric sort key for ordering.
  const timezones = useMemo(() => {
    try {
      const allTimezones = Intl.supportedValuesOf('timeZone');
      const now = new Date();
      const list = allTimezones.map((tz) => {
        // Attempt to determine offset using Intl. Fallback to empty string if unavailable.
        let offset = '';
        try {
          const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
          const parts = fmt.formatToParts(now);
          const tzPart = parts.find((p) => p.type === 'timeZoneName');
          offset = tzPart ? tzPart.value.replace(/UTC|GMT/, '').trim() : '';
        } catch (e) {
          offset = '';
        }

        const parseOffset = (o) => {
          if (!o) return 0;
          const sign = o.startsWith('-') ? -1 : 1;
          const abs = o.replace(/^[-+]/, '');
          const [h, m] = (abs.split(':').map(Number));
          return sign * ((h || 0) * 60 + (m || 0));
        };

        return {
          timezone: tz,
          offset,
          sortKey: parseOffset(offset),
          label: `(UTC${offset || ''}) ${tz}`,
        };
      });

      list.sort((a, b) => a.sortKey - b.sortKey || a.timezone.localeCompare(b.timezone));
      return list;
    } catch (e) {
      return [];
    }
  }, []);

  const selectedTimezoneObj = useMemo(() => {
    return timezones.find((t) => t.timezone === selectedTimezone) || null;
  }, [timezones, selectedTimezone]);

  // When a user attempts to change the timezone, guests see the unlock modal.
  const handleChange = (event, newValue) => {
    if (!user) {
      // Show unlock modal for guest users attempting to change settings.
      setShowUnlock(true);
      return;
    }

    if (newValue) {
      // CRITICAL: Use updateSelectedTimezone() to persist to Firestore
      updateSelectedTimezone(newValue.timezone);
    }
  };

  // Custom filter so typing matches anywhere in the label (not just from start).
  const filterOptions = (options, { inputValue }) => {
    const q = (inputValue || '').toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q) || opt.timezone.toLowerCase().includes(q));
  };

  return (
    <>
      <Box
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
          options={timezones}
          getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
          isOptionEqualToValue={(option, value) => {
            if (!option || !value) return false;
            return option.timezone === (value.timezone || value);
          }}
          size="small"
          filterOptions={filterOptions}
          disableClearable={false}
          clearOnBlur={false}
          freeSolo={false}
          popupIcon={null}
          slotProps={{
            listbox: {
              sx: {
                maxHeight: 280,
                overflow: 'auto',
                // Improve touch target spacing
                '& .MuiAutocomplete-option': {
                  paddingY: 0.75,
                  paddingX: 1.5,
                },
              },
            },
            paper: {
              sx: {
                backgroundColor: 'background.paper',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                borderRadius: 1,
                // Remove any extra padding so only the list scrolls
                p: 0,
              },
            },
            popper: {
              style: { zIndex: 1400 },
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
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select timezone (type to search)"
              inputProps={{
                ...params.inputProps,
                'aria-label': 'Select timezone',
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
              right: 10,
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
