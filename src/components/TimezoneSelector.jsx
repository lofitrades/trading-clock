// src/components/TimezoneSelector.jsx
import { useEffect, useState } from 'react';

export default function TimezoneSelector({ selectedTimezone, setSelectedTimezone, textColor }) {
  const [timezones, setTimezones] = useState([]);

  useEffect(() => {
    const allTimezones = Intl.supportedValuesOf('timeZone');
    const timezonesWithOffsets = allTimezones.map(timezone => {
      const offset = getUTCOffset(timezone);
      return {
        timezone,
        offset,
        sortKey: parseOffset(offset)
      };
    });
    timezonesWithOffsets.sort((a, b) => a.sortKey - b.sortKey);
    setTimezones(timezonesWithOffsets);
  }, []);

  const getUTCOffset = (timezone) => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(now);
    const offset = parts.find(part => part.type === 'timeZoneName').value;
    return offset.replace(/UTC|GMT/, '').trim();
  };

  const parseOffset = (offset) => {
    const [hours, minutes] = offset.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  return (
    <div className="timezone-selector">
      <select 
        value={selectedTimezone} 
        onChange={(e) => setSelectedTimezone(e.target.value)}
        style={{ color: textColor }}
      >
        {timezones.map(({ timezone, offset }) => (
          <option key={timezone} value={timezone}>
            {`(UTC${offset}) ${timezone}`}
          </option>
        ))}
      </select>
    </div>
  );
}
