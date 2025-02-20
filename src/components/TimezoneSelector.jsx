/* src/components/TimezoneSelector.jsx */
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import UnlockModal from './UnlockModal';

export default function TimezoneSelector({ selectedTimezone, setSelectedTimezone, textColor, onRequestSignUp }) {
  const [timezones, setTimezones] = useState([]);
  const { user } = useAuth();
  const [showUnlock, setShowUnlock] = useState(false);

  useEffect(() => {
    const allTimezones = Intl.supportedValuesOf('timeZone');
    const timezonesWithOffsets = allTimezones.map((tz) => {
      const offset = getUTCOffset(tz);
      return {
        timezone: tz,
        offset,
        sortKey: parseOffset(offset),
      };
    });
    timezonesWithOffsets.sort((a, b) => a.sortKey - b.sortKey);
    setTimezones(timezonesWithOffsets);
  }, []);

  const getUTCOffset = (tz) => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offset = parts.find((part) => part.type === 'timeZoneName').value;
    return offset.replace(/UTC|GMT/, '').trim();
  };

  const parseOffset = (offset) => {
    const [hours, minutes] = offset.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  const handleChange = (e) => {
    if (!user) {
      setShowUnlock(true);
    } else {
      setSelectedTimezone(e.target.value);
    }
  };

  return (
    <div className="timezone-selector">
      <select value={selectedTimezone} onChange={handleChange} style={{ color: textColor }}>
        {timezones.map(({ timezone, offset }) => (
          <option key={timezone} value={timezone}>
            {`(UTC${offset}) ${timezone}`}
          </option>
        ))}
      </select>
      {showUnlock && (
        <UnlockModal
          onClose={() => setShowUnlock(false)}
          onSignUp={() => {
            setShowUnlock(false);
            onRequestSignUp && onRequestSignUp();
          }}
        />
      )}
    </div>
  );
}
