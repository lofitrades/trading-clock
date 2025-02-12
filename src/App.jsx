import { useState, useMemo } from 'react';
import { useSettings } from './hooks/useSettings';
import { useClock } from './hooks/useClock';
import ClockCanvas from './components/ClockCanvas';
import DigitalClock from './components/DigitalClock';
import KillzoneLabel from './components/KillzoneLabel';
import TimezoneSelector from './components/TimezoneSelector';
import Sidebar from './components/Sidebar';

export default function App() {
  const { clockSize, killzones, selectedTimezone, updateClockSize, updateKillzones, setSelectedTimezone } = useSettings();
  const { currentTime, activeKillzone } = useClock(selectedTimezone, killzones);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const memoizedTimezoneSelector = useMemo(() => (
    <TimezoneSelector
      selectedTimezone={selectedTimezone}
      setSelectedTimezone={setSelectedTimezone}
    />
  ), [selectedTimezone]);

  return (
    <div className="app-container" style={{ maxWidth: clockSize + 200 }}>
      <button 
        className="settings-button material-symbols-outlined"
        onClick={() => setSidebarOpen(true)}
      >
        menu
      </button>

      <ClockCanvas size={clockSize} time={currentTime} killzones={killzones} />
      <DigitalClock time={currentTime} />
      {memoizedTimezoneSelector}
      <KillzoneLabel activeKillzone={activeKillzone} />

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        clockSize={clockSize}
        killzones={killzones}
        onSizeChange={updateClockSize}
        onKillzonesChange={updateKillzones}
      />
    </div>
  );
}