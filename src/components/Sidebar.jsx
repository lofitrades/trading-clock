// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import Switch from './Switch';
import './Sidebar.css';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import AccountModal from './AccountModal';
import UnlockModal from './UnlockModal';

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
  const { user } = useAuth();
  const [isGeneralOpen, setIsGeneralOpen] = useState(false);
  const [isKillzoneOpen, setIsKillzoneOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOtherSettingsOpen, setIsOtherSettingsOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [toggleError, setToggleError] = useState("");
  const [currentTooltip, setCurrentTooltip] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    const handleScroll = () => {
      setCurrentTooltip(null);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const handleTooltipEnter = (e) => {
    const tooltipWidth = 250;
    let tooltipX = e.clientX + 10;
    if (window.innerWidth - e.clientX < tooltipWidth + 20) {
      tooltipX = e.clientX - tooltipWidth - 10;
    }
    if (tooltipX < 0) tooltipX = 10;
    else if (tooltipX + tooltipWidth > window.innerWidth)
      tooltipX = window.innerWidth - tooltipWidth - 10;
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
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) onClose();
  };

  // Updated killzone change to require logged in user
  const handleKillzoneChange = (index, field, value) => {
    if (!user) {
      setShowUnlockModal(true);
      return;
    }
    const newKillzones = [...killzones];
    newKillzones[index][field] = value;
    onKillzonesChange(newKillzones);
  };

  const handleToggle = (toggleFunc) => {
    const success = toggleFunc();
    if (!success) {
      setToggleError("At least one of three elements should be enabled.");
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
        {user ? (
          <div style={{cursor: 'pointer'}} onClick={() => setShowAccountModal(true)}>
            Welcome, {user.displayName || user.email}!
          </div>
        ) : (
          <button className="lsu-button" onClick={() => setShowAuthModal(true)}>
            Login / Sign Up
          </button>
        )}
        <p className='free-account'>Create a free account to unlock Pro★ Features.</p>
        
        {/* About Section */}
        <div className="sidebar-section parent-section">
          <div className="sidebar-section-header parent-section-header" onClick={() => setIsAboutOpen(!isAboutOpen)}>
            <span className="sidebar-section-title">About</span>
            <span className="sidebar-section-arrow">{isAboutOpen ? '−' : '+'}</span>
          </div>
          <div className={`sidebar-section-content ${isAboutOpen ? 'open' : ''}`}>
            <div className="sidebar-control about-text">
              <h1>Time 2 Trade</h1>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="sidebar-section parent-section">
          <div className="sidebar-section-header parent-section-header" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
            <span className="sidebar-section-title">Settings</span>
            <span className="sidebar-section-arrow">{isSettingsOpen ? '−' : '+'}</span>
          </div>
          {isSettingsOpen && (
            <div className={`sidebar-section-content ${isSettingsOpen ? 'open' : ''}`}>
              {/* General Settings Sub-section */}
              <hr className='settings-divider'/>
              <div className="sidebar-subsection">
                <div className="sidebar-sub-section-header" onClick={() => setIsGeneralOpen(!isGeneralOpen)}>
                  <span className="sidebar-section-title">General Settings</span>
                  <span className="sidebar-section-arrow">{isGeneralOpen ? '−' : '+'}</span>
                </div>
                <div className={`sidebar-section-content ${isGeneralOpen ? 'open' : ''}`}>
                  <div className="sidebar-control toggle-container">
                    <span className="toggle-label sidebar-label" onClick={() => handleToggle(toggleShowHandClock)}>
                      Show Hand Clock
                    </span>
                    <Switch checked={showHandClock} onChange={() => handleToggle(toggleShowHandClock)} />
                  </div>

                  <div className="sidebar-control toggle-container">
                    <span className="toggle-label sidebar-label" onClick={() => handleToggle(toggleShowDigitalClock)}>
                      Show Digital Clock
                    </span>
                    <Switch checked={showDigitalClock} onChange={() => handleToggle(toggleShowDigitalClock)} />
                  </div>
                  <div className="sidebar-control toggle-container">
                    <span className="toggle-label sidebar-label" onClick={() => handleToggle(toggleShowKillzoneLabel)}>
                      Show Active Killzone Label
                    </span>
                    <Switch checked={showKillzoneLabel} onChange={() => handleToggle(toggleShowKillzoneLabel)} />
                  </div>
                  {toggleError && (
                    <div style={{ fontSize: '0.7rem', color: '#E69999', marginTop: '0px', marginBottom: '20px' }}>
                      {toggleError}
                    </div>
                  )}
                  <div className="sidebar-control clock-size-container">
                    <div className="label-help-container">
                      <label htmlFor="clock-size" className="sidebar-label">Clock Style:</label>
                      <span 
                        className="help-icon material-symbols-outlined"
                        data-tooltip="Select a preset clock size."
                        onMouseEnter={handleTooltipEnter}
                        onMouseLeave={() => setCurrentTooltip(null)}
                      >
                        help
                      </span>
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
                      <label htmlFor="bg-color" className="sidebar-label">Background Color:</label>
                      <span 
                        className="help-icon material-symbols-outlined"
                        data-tooltip="Pick a background color. This setting works independently unless overridden by active Killzone."
                        onMouseEnter={handleTooltipEnter}
                        onMouseLeave={() => setCurrentTooltip(null)}
                      >
                        help
                      </span>
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
                    <span className="toggle-label sidebar-label" onClick={() => handleToggle(toggleBackgroundBasedOnKillzone)}>
                      Background color based on active Killzone
                    </span>
                    <Switch checked={backgroundBasedOnKillzone} onChange={() => toggleBackgroundBasedOnKillzone()} />
                  </div>
                </div>
              </div>

              {/* Killzone Settings Sub-section (protected) */}
              <div className="sidebar-subsection">
                <div className="sidebar-sub-section-header" onClick={() => setIsKillzoneOpen(!isKillzoneOpen)}>
                  <span className="sidebar-section-title">Killzone Settings ★</span>
                  <span className="sidebar-section-arrow">{isKillzoneOpen ? '−' : '+'}</span>
                </div>
                <div className={`sidebar-section-content ${isKillzoneOpen ? 'open' : ''}`}>
                  <div className="killzone-help" style={{ marginBottom: '10px' }}>
                    <span style={{fontSize: '0.9rem' }}>What is a Killzone?</span>
                    <span 
                      className="help-icon material-symbols-outlined"
                      data-tooltip="A Killzone is a high-volatility trading period aligned with key market sessions."
                      onMouseEnter={handleTooltipEnter}
                      onMouseLeave={() => setCurrentTooltip(null)}
                    >
                      help
                    </span>
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
                      <span
                        className="toggle-label sidebar-label"
                        title="Display the time remaining until the current Killzone ends"
                        onClick={() => toggleShowTimeToEnd()}
                      >
                        Show Time to End
                      </span>
                      <Switch checked={showTimeToEnd} onChange={() => toggleShowTimeToEnd()} />
                    </div>
                    <hr className='settings-divider'/>
                    <div className="toggle-container">
                      <span
                        className="toggle-label sidebar-label"
                        title="Display the time until the next Killzone starts"
                        onClick={() => toggleShowTimeToStart()}
                      >
                        Show Time to Start
                      </span>
                      <Switch checked={showTimeToStart} onChange={() => toggleShowTimeToStart()} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Economic Events Sub-section */}
              <div className="sidebar-subsection">
                <div className="sidebar-sub-section-header" onClick={() => setIsOtherSettingsOpen(!isOtherSettingsOpen)}>
                  <span className="sidebar-section-title">Economic Events ★</span>
                  <span className="sidebar-section-arrow">{isOtherSettingsOpen ? '−' : '+'}</span>
                </div>
                <div className={`sidebar-section-content ${isOtherSettingsOpen ? 'open' : ''}`}>
                  <div className="sidebar-control">
                    <h3><strong>Coming soon!</strong></h3>
                    <p>Displays today's high impact Economic Events in the main clock.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="sidebar-footer">
          Developed by: <strong>
            <a
              className="sidebar-link"
              href="https://x.com/lofi_trades"
              target="_blank"
              rel="noopener noreferrer"
              title="Lofi Trades X Link"
            >
              @lofi_trades
            </a>
          </strong>
        </p>
      </div>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showAccountModal && <AccountModal onClose={() => setShowAccountModal(false)} user={user} />}
      {showUnlockModal && (
        <UnlockModal
          onClose={() => setShowUnlockModal(false)}
          onSignUp={() => {
            setShowUnlockModal(false);
            setShowAuthModal(true);
          }}
        />
      )}
    </div>
  );
};

export default Sidebar;
