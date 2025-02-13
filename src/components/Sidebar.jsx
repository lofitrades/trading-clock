// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = ({
  open,
  onClose,
  clockSize,
  killzones,
  onSizeChange,
  onKillzonesChange,
  backgroundColor,
  updateBackgroundColor,
  backgroundBasedOnKillzone,
  toggleBackgroundBasedOnKillzone,
  // New props for main element toggles
  showHandClock,
  showDigitalClock,
  showKillzoneLabel,
  toggleShowHandClock,
  toggleShowDigitalClock,
  toggleShowKillzoneLabel,
  // Existing killzone toggles (unchanged)
  showTimeToEnd,
  showTimeToStart,
  toggleShowTimeToEnd,
  toggleShowTimeToStart,
}) => {
  const [isGeneralOpen, setIsGeneralOpen] = useState(false);
  const [isKillzoneOpen, setIsKillzoneOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [toggleError, setToggleError] = useState("");

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
      onClose();
    }
  };

  const handleKillzoneChange = (index, field, value) => {
    const newKillzones = [...killzones];
    newKillzones[index][field] = value;
    onKillzonesChange(newKillzones);
  };

  // Helper to handle main element toggles with error handling
  const handleToggle = (toggleFunc) => {
    const success = toggleFunc();
    if (!success) {
      setToggleError("At least one of three elements should be enabled");
      // Clear the error after 3 seconds
      setTimeout(() => setToggleError(""), 3000);
    } else {
      setToggleError("");
    }
  };

  return (
    <div className={`sidebar ${open ? 'open' : ''}`} onClick={onClose}>
      <div 
        className="sidebar-content" 
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <span className="sidebar-close close" onClick={onClose}>&times;</span>
        <button className="add-button" onClick={() => {alert(" Coming soon! \n This functionality is under development."); }}>
          Add new time log
        </button>
        {/* General Settings */}
        <div className="sidebar-section">
          <div className="sidebar-section-header" onClick={() => setIsGeneralOpen(!isGeneralOpen)}>
            <span className="sidebar-section-title">General Settings</span>
            <span className="sidebar-section-arrow">{isGeneralOpen ? '▼' : '►'}</span>
          </div>
          <div className={`sidebar-section-content ${isGeneralOpen ? 'open' : ''}`}>
            <div className="sidebar-control clock-size-container">
              <label className="sidebar-label">Clock Size:</label>
              <select
                className="sidebar-select"
                value={clockSize}
                onChange={e => onSizeChange(parseInt(e.target.value))}
              >
                <option value="300">Aesthetic</option>
                <option value="150">Tiny</option>
                <option value="250">Small</option>
                <option value="375">Normal</option>
                {/* Removed Big and Huge options */}
              </select>
            </div>
            <div className="sidebar-control background-color-container">
              <label className="sidebar-label">Background Color:</label>
              <input
                type="color"
                className="sidebar-color-picker"
                value={backgroundColor}
                onChange={e => updateBackgroundColor(e.target.value)}
              />
            </div>
            <div className="sidebar-control background-based-container toggle-container">
              <span className="toggle-label sidebar-label" onClick={toggleBackgroundBasedOnKillzone}>
                Background based on active Killzone
              </span>
              <span
                className={`toggle-icon material-symbols-outlined ${backgroundBasedOnKillzone ? 'toggle-on' : 'toggle-off'}`}
                onClick={toggleBackgroundBasedOnKillzone}
              >
                {backgroundBasedOnKillzone ? 'toggle_on' : 'toggle_off'}
              </span>
            </div>
            {/* New toggles for main clock elements */}
            <div className="sidebar-control toggle-container">
              <span className="toggle-label sidebar-label" onClick={() => handleToggle(toggleShowHandClock)}>
                Show Hand Clock
              </span>
              <span
                className={`toggle-icon material-symbols-outlined ${showHandClock ? 'toggle-on' : 'toggle-off'}`}
                onClick={() => handleToggle(toggleShowHandClock)}
              >
                {showHandClock ? 'toggle_on' : 'toggle_off'}
              </span>
            </div>
            <div className="sidebar-control toggle-container">
              <span className="toggle-label sidebar-label" onClick={() => handleToggle(toggleShowDigitalClock)}>
                Show Digital Clock
              </span>
              <span
                className={`toggle-icon material-symbols-outlined ${showDigitalClock ? 'toggle-on' : 'toggle-off'}`}
                onClick={() => handleToggle(toggleShowDigitalClock)}
              >
                {showDigitalClock ? 'toggle_on' : 'toggle_off'}
              </span>
            </div>
            <div className="sidebar-control toggle-container">
              <span className="toggle-label sidebar-label" onClick={() => handleToggle(toggleShowKillzoneLabel)}>
                Show Active Killzone Label
              </span>
              <span
                className={`toggle-icon material-symbols-outlined ${showKillzoneLabel ? 'toggle-on' : 'toggle-off'}`}
                onClick={() => handleToggle(toggleShowKillzoneLabel)}
              >
                {showKillzoneLabel ? 'toggle_on' : 'toggle_off'}
              </span>
            </div>
            {toggleError && (
              <div style={{ fontSize: '0.7rem', color: '#E69999', marginTop: '5px' }}>
                {toggleError}
              </div>
            )}
          </div>
        </div>
        {/* Killzone Settings (unchanged) */}
        <div className="sidebar-section">
          <div className="sidebar-section-header" onClick={() => setIsKillzoneOpen(!isKillzoneOpen)}>
            <span className="sidebar-section-title">Killzone Settings</span>
            <span className="sidebar-section-arrow">{isKillzoneOpen ? '▼' : '►'}</span>
          </div>
          <div className={`sidebar-section-content ${isKillzoneOpen ? 'open' : ''}`}>
            <div className="killzone-inputs">
              {killzones.map((kz, index) => (
                <div key={index} className="killzone-item">
                  <input
                    type="text"
                    className="sidebar-input killzone-name"
                    value={kz.name}
                    onChange={e => handleKillzoneChange(index, 'name', e.target.value)}
                    placeholder={`Killzone ${index + 1} Name`}
                  />
                  <div className="killzone-time-row">
                    <input
                      type="time"
                      className="sidebar-input killzone-start"
                      value={kz.startNY}
                      onChange={e => handleKillzoneChange(index, 'startNY', e.target.value)}
                    />
                    <input
                      type="time"
                      className="sidebar-input killzone-end"
                      value={kz.endNY}
                      onChange={e => handleKillzoneChange(index, 'endNY', e.target.value)}
                    />
                    <input
                      type="color"
                      className="sidebar-input killzone-color"
                      value={kz.color}
                      onChange={e => handleKillzoneChange(index, 'color', e.target.value)}
                    />
                  </div>
                  <hr className="killzone-divider" />
                </div>
              ))}
            </div>
            <div className="sidebar-control killzone-toggles">
              <div className="toggle-container">
                <span
                  className="toggle-label sidebar-label"
                  title="Display the time remaining until the current killzone ends"
                  onClick={toggleShowTimeToEnd}
                >
                  Show Time to End
                </span>
                <span
                  className={`toggle-icon material-symbols-outlined ${showTimeToEnd ? 'toggle-on' : 'toggle-off'}`}
                  onClick={toggleShowTimeToEnd}
                >
                  {showTimeToEnd ? 'toggle_on' : 'toggle_off'}
                </span>
              </div>
              <hr className="killzone-divider" />
              <div className="toggle-container">
                <span
                  className="toggle-label sidebar-label"
                  title="Display the time until the next killzone starts"
                  onClick={toggleShowTimeToStart}
                >
                  Show Time to Start
                </span>
                <span
                  className={`toggle-icon material-symbols-outlined ${showTimeToStart ? 'toggle-on' : 'toggle-off'}`}
                  onClick={toggleShowTimeToStart}
                >
                  {showTimeToStart ? 'toggle_on' : 'toggle_off'}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* About Section */}
        <div className="sidebar-section">
          <div className="sidebar-section-header" onClick={() => setIsAboutOpen(!isAboutOpen)}>
            <span className="sidebar-section-title">About</span>
            <span className="sidebar-section-arrow">{isAboutOpen ? '▼' : '►'}</span>
          </div>
          <div className={`sidebar-section-content ${isAboutOpen ? 'open' : ''}`}>
            <div className="sidebar-control about-text">
              <h1><strong>Time 2 Trade</strong></h1>
              <p>About content...</p>
            </div>
          </div>
        </div>
        <p className="sidebar-footer">
          Developed by: <strong>
            <a
              className="sidebar-link"
              href="https://x.com/lofi_trades"
              target="_blank"
              rel="noopener noreferrer"
            >
              @lofi_trades
            </a>
          </strong>
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
