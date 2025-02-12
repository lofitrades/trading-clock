import { useEffect, useState } from 'react';

export default function TimezoneSelector({ selectedTimezone, setSelectedTimezone }) {
  const [timezones, setTimezones] = useState([]);

  useEffect(() => {
    // Get all available timezones and calculate their UTC offsets
    const allTimezones = Intl.supportedValuesOf('timeZone');
    
    const timezonesWithOffsets = allTimezones.map(timezone => {
      const offset = getUTCOffset(timezone);
      return {
        timezone,
        offset,
        sortKey: parseOffset(offset)
      };
    });

    // Sort timezones by UTC offset
    timezonesWithOffsets.sort((a, b) => a.sortKey - b.sortKey);
    
    setTimezones(timezonesWithOffsets);
  }, []);

  // Helper function to get UTC offset
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

  // Helper function to convert offset to minutes
  const parseOffset = (offset) => {
    const [hours, minutes] = offset.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  return (
    <div className="timezone-selector">
      <select 
        value={selectedTimezone} 
        onChange={(e) => setSelectedTimezone(e.target.value)}
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