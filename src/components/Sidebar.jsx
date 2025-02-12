// src/components/Sidebar.jsx
import React, { useEffect } from 'react';

const Sidebar = ({ open, onClose, clockSize, killzones, onSizeChange, onKillzonesChange }) => {
  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleKillzoneChange = (index, field, value) => {
    const newKillzones = [...killzones];
    newKillzones[index][field] = value;
    onKillzonesChange(newKillzones);
  };

  return (
    <div className={`sidebar ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="sidebar-content" onClick={e => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Trading Clock</h2>

        <div className="clock-size-container">
          <label>Clock Size:</label>
          <select value={clockSize} onChange={e => onSizeChange(parseInt(e.target.value))}>
            <option value="300">Aesthetic</option>
            <option value="150">Tiny</option>
            <option value="250">Small</option>
            <option value="375">Normal</option>
            <option value="600">Big</option>
            <option value="1200">Huge</option>
          </select>
        </div>

        <h4>Killzone Settings</h4>
        <div className="killzone-inputs">
          <div className="killzone-headers">
            <span>Name</span>
            <span>Start</span>
            <span>End</span>
            <span>Color</span>
          </div>
          {killzones.map((kz, index) => (
            <div key={index} className="killzone-input">
              <input
                type="text"
                value={kz.name}
                onChange={e => handleKillzoneChange(index, 'name', e.target.value)}
                placeholder="Name"
              />
              <input
                type="time"
                value={kz.startNY}
                onChange={e => handleKillzoneChange(index, 'startNY', e.target.value)}
              />
              <input
                type="time"
                value={kz.endNY}
                onChange={e => handleKillzoneChange(index, 'endNY', e.target.value)}
              />
              <input
                type="color"
                value={kz.color}
                onChange={e => handleKillzoneChange(index, 'color', e.target.value)}
              />
            </div>
          ))}
        </div>

        <p>Developed by: <strong>
          <a href="https://instagram.com/juandiegocr" target="_blank" rel="noopener noreferrer">
            @juandiegocr
          </a>
        </strong></p>
      </div>
    </div>
  );
};

export default Sidebar;