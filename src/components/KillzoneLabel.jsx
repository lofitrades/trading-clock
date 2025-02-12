// src/components/KillzoneLabel.jsx
import { isColorDark } from '../utils/clockUtils';

export default function KillzoneLabel({ activeKillzone }) {
  return (
    <div className="killzone-label"
      style={{
        backgroundColor: activeKillzone?.color || '#ffffff',
        color: activeKillzone 
          ? (isColorDark(activeKillzone.color) ? '#fff' : '#000')
          : '#4B4B4B',
        padding: '8px 16px',
        borderRadius: '4px',
        margin: '10px 0',
        textAlign: 'center',
        transition: 'background-color 0.3s, color 0.3s'
      }}
    >
      {activeKillzone 
        ? `Active Killzone: ${activeKillzone.name}`
        : 'No Active Killzone'}
    </div>
  );
}