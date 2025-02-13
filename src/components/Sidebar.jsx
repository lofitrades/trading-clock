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
  showHandClock,
  showDigitalClock,
  showKillzoneLabel,
  toggleShowHandClock,
  toggleShowDigitalClock,
  toggleShowKillzoneLabel,
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
  const [currentTooltip, setCurrentTooltip] = useState(null);

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // NEW: Hide tooltip on scroll (for mobile or any scroll)
  useEffect(() => {
    const handleScroll = () => {
      setCurrentTooltip(null);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  // Updated tooltip handler to keep the tooltip on screen.
  const handleTooltipEnter = (e) => {
    const tooltipWidth = 250; // same as max-width in CSS
    let tooltipX = e.clientX + 10;
    if (window.innerWidth - e.clientX < tooltipWidth + 20) {
      tooltipX = e.clientX - tooltipWidth - 10;
    }
    // Ensure tooltipX is not off-screen.
    if (tooltipX < 0) {
      tooltipX = 10;
    } else if (tooltipX + tooltipWidth > window.innerWidth) {
      tooltipX = window.innerWidth - tooltipWidth - 10;
    }
    setCurrentTooltip({
      text: e.target.dataset.tooltip,
      x: tooltipX,
      y: e.clientY
    });
  };

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

  const handleToggle = (toggleFunc) => {
    const success = toggleFunc();
    if (!success) {
      setToggleError("At least one of three elements should be enabled");
      setTimeout(() => setToggleError(""), 4000);
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
        {currentTooltip && (
          <div 
            className="sidebar-tooltip" 
            style={{ 
              left: currentTooltip.x,
              top: currentTooltip.y - 60,
            }}
          >
            {currentTooltip.text}
          </div>
        )}

        <span className="sidebar-close close" onClick={onClose}>&times;</span>
        <button className="add-button" onClick={() => {alert("Coming soon! \nThis functionality is under development."); }}>
          Login/Sing up
        </button>

        {/* General Settings */}
        <div className="sidebar-section">
          <div className="sidebar-section-header" onClick={() => setIsGeneralOpen(!isGeneralOpen)}>
            <span className="sidebar-section-title">General Settings</span>
            <span className="sidebar-section-arrow">{isGeneralOpen ? '▼' : '▶'}</span>
          </div>
          <div className={`sidebar-section-content ${isGeneralOpen ? 'open' : ''}`}>
            <div className="sidebar-control toggle-container">
              <div className="label-help-container">
                <span className="toggle-label sidebar-label" onClick={() => handleToggle(toggleShowHandClock)}>
                  Show Hand Clock
                </span>
                <span 
                  className="help-icon material-symbols-outlined"
                  data-tooltip="Toggle the analog clock display."
                  onMouseEnter={handleTooltipEnter}
                  onMouseLeave={() => setCurrentTooltip(null)}
                >help</span>
              </div>
              <span
                className={`toggle-icon material-symbols-outlined ${showHandClock ? 'toggle-on' : 'toggle-off'}`}
                onClick={() => handleToggle(toggleShowHandClock)}
              >
                {showHandClock ? 'toggle_on' : 'toggle_off'}
              </span>
            </div>

            <div className="sidebar-control toggle-container">
              <div className="label-help-container">
                <span className="toggle-label sidebar-label" onClick={() => handleToggle(toggleShowDigitalClock)}>
                  Show Digital Clock
                </span>
                <span 
                  className="help-icon material-symbols-outlined"
                  data-tooltip="Toggle the digital clock display."
                  onMouseEnter={handleTooltipEnter}
                  onMouseLeave={() => setCurrentTooltip(null)}
                >help</span>
              </div>
              <span
                className={`toggle-icon material-symbols-outlined ${showDigitalClock ? 'toggle-on' : 'toggle-off'}`}
                onClick={() => handleToggle(toggleShowDigitalClock)}
              >
                {showDigitalClock ? 'toggle_on' : 'toggle_off'}
              </span>
            </div>

            <div className="sidebar-control toggle-container">
              <div className="label-help-container">
                <span className="toggle-label sidebar-label" onClick={() => handleToggle(toggleShowKillzoneLabel)}>
                  Show Active Killzone Label
                </span>
                <span 
                  className="help-icon material-symbols-outlined"
                  data-tooltip="Toggle the display of the active Killzone information."
                  onMouseEnter={handleTooltipEnter}
                  onMouseLeave={() => setCurrentTooltip(null)}
                >help</span>
              </div>
              <span
                className={`toggle-icon material-symbols-outlined ${showKillzoneLabel ? 'toggle-on' : 'toggle-off'}`}
                onClick={() => handleToggle(toggleShowKillzoneLabel)}
              >
                {showKillzoneLabel ? 'toggle_on' : 'toggle_off'}
              </span>
            </div>

            {toggleError && (
              <div style={{ fontSize: '0.7rem', color: '#E69999', marginTop: '0px', marginBottom: '20px' }}>
                {toggleError}
              </div>
            )}

            <div className="sidebar-control clock-size-container">
              <div className="label-help-container">
                <label htmlFor="clock-size" className="sidebar-label">
                  Clock Style:
                </label>
                <span 
                  className="help-icon material-symbols-outlined"
                  data-tooltip="Select a preset clock size."
                  onMouseEnter={handleTooltipEnter}
                  onMouseLeave={() => setCurrentTooltip(null)}
                >help</span>
              </div>
              <select
                id="clock-size"
                className="sidebar-select"
                value={clockSize}
                onChange={e => onSizeChange(parseInt(e.target.value))}
              >
                <option value="300">Aesthetic</option>
                <option value="150">Tiny</option>
                <option value="250">Small</option>
                <option value="375">Normal</option>
                <option value="500">Big (Tablet)</option>
              </select>
            </div>

            <div className="sidebar-control background-color-container">
              <div className="label-help-container">
                <label htmlFor="bg-color" className="sidebar-label">
                  Background Color:
                </label>
                <span 
                  className="help-icon material-symbols-outlined"
                  data-tooltip="Pick a background color. This setting works independently unless overridden by active Killzone."
                  onMouseEnter={handleTooltipEnter}
                  onMouseLeave={() => setCurrentTooltip(null)}
                >help</span>
              </div>
              <input
                id="bg-color"
                type="color"
                className="sidebar-color-picker"
                value={backgroundColor}
                onChange={e => updateBackgroundColor(e.target.value)}
              />
            </div>

            <div className="sidebar-control background-based-container toggle-container">
              <div className="label-help-container">
                <span className="toggle-label sidebar-label" onClick={toggleBackgroundBasedOnKillzone}>
                  Background color based on active Killzone color
                </span>
                <span 
                  className="help-icon material-symbols-outlined"
                  data-tooltip="When enabled, the background will automatically match the active Killzone color."
                  onMouseEnter={handleTooltipEnter}
                  onMouseLeave={() => setCurrentTooltip(null)}
                >help</span>
              </div>
              <span
                className={`toggle-icon material-symbols-outlined ${backgroundBasedOnKillzone ? 'toggle-on' : 'toggle-off'}`}
                onClick={toggleBackgroundBasedOnKillzone}
              >
                {backgroundBasedOnKillzone ? 'toggle_on' : 'toggle_off'}
              </span>
            </div>
          </div>
        </div>
        {/* Killzone Settings */}
        <div className="sidebar-section">
          <div className="sidebar-section-header" onClick={() => setIsKillzoneOpen(!isKillzoneOpen)}>
            <span className="sidebar-section-title">Killzone Settings</span>
            <span className="sidebar-section-arrow">{isKillzoneOpen ? '▼' : '▶'}</span>
          </div>
          <div className={`sidebar-section-content ${isKillzoneOpen ? 'open' : ''}`}>
            <div className="killzone-help" style={{ marginBottom: '10px' }}>
              <span style={{ marginLeft: '5px', fontSize: '0.9rem' }}>Fill out the fields for each Killzone.</span>
              <span 
                className="help-icon material-symbols-outlined"
                data-tooltip="Configure each Killzone by providing a name, start/end times, and a color. These inputs determine when and how a Killzone is active."
                onMouseEnter={handleTooltipEnter}
                onMouseLeave={() => setCurrentTooltip(null)}
              >help</span>
            </div>
            <div className="killzone-inputs">
              {killzones.map((kz, index) => (
                <div key={index} className="killzone-item">
                  <label htmlFor={`kz-name-${index}`} className="sidebar-label">
                    Killzone Name {index + 1}:
                  </label>
                  <input
                    id={`kz-name-${index}`}
                    type="text"
                    className="sidebar-input killzone-name"
                    value={kz.name}
                    onChange={e => handleKillzoneChange(index, 'name', e.target.value)}
                    placeholder={`Killzone ${index + 1} Name`}
                  />
                  <div className="killzone-time-row">
                    <div className="killzone-field">
                      <label htmlFor={`kz-start-${index}`} className="sidebar-label">Start Time:</label>
                      <input
                        id={`kz-start-${index}`}
                        type="time"
                        className="sidebar-input killzone-start"
                        value={kz.startNY}
                        onChange={e => handleKillzoneChange(index, 'startNY', e.target.value)}
                      />
                    </div>
                    <div className="killzone-field">
                      <label htmlFor={`kz-end-${index}`} className="sidebar-label">End Time:</label>
                      <input
                        id={`kz-end-${index}`}
                        type="time"
                        className="sidebar-input killzone-end"
                        value={kz.endNY}
                        onChange={e => handleKillzoneChange(index, 'endNY', e.target.value)}
                      />
                    </div>
                    <div className="killzone-field">
                      <label htmlFor={`kz-color-${index}`} className="sidebar-label">Color:</label>
                      <input
                        id={`kz-color-${index}`}
                        type="color"
                        className="sidebar-input killzone-color"
                        value={kz.color}
                        onChange={e => handleKillzoneChange(index, 'color', e.target.value)}
                      />
                    </div>
                  </div>
                  <hr className="killzone-divider" />
                </div>
              ))}
            </div>
            <div className="sidebar-control killzone-toggles">
              <div className="toggle-container">
                <div className="label-help-container">
                  <span
                    className="toggle-label sidebar-label"
                    title="Display the time remaining until the current Killzone ends"
                    onClick={toggleShowTimeToEnd}
                  >
                    Show Time to End
                  </span>
                  <span 
                    className="help-icon material-symbols-outlined"
                    data-tooltip="Toggle display of the countdown until the current Killzone ends."
                    onMouseEnter={handleTooltipEnter}
                    onMouseLeave={() => setCurrentTooltip(null)}
                  >help</span>
                </div>
                <span
                  className={`toggle-icon material-symbols-outlined ${showTimeToEnd ? 'toggle-on' : 'toggle-off'}`}
                  onClick={toggleShowTimeToEnd}
                >
                  {showTimeToEnd ? 'toggle_on' : 'toggle_off'}
                </span>
              </div>
              <hr className="killzone-divider" />
              <div className="toggle-container">
                <div className="label-help-container">
                  <span
                    className="toggle-label sidebar-label"
                    title="Display the time until the next Killzone starts"
                    onClick={toggleShowTimeToStart}
                  >
                    Show Time to Start
                  </span>
                  <span 
                    className="help-icon material-symbols-outlined"
                    data-tooltip="Toggle display of the countdown until the next Killzone starts."
                    onMouseEnter={handleTooltipEnter}
                    onMouseLeave={() => setCurrentTooltip(null)}
                  >help</span>
                </div>
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
            <span className="sidebar-section-arrow">{isAboutOpen ? '▼' : '▶'}</span>
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
