/* src/components/Sidebar.jsx */
import React, { useState, useEffect, useRef } from 'react';
import Switch from './Switch';
import './Sidebar.css';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import AccountModal from './AccountModal';
import UnlockModal from './UnlockModal';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useSettings } from '../hooks/useSettings';

export default function Sidebar({
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
}) {
  const { user } = useAuth();
  const { resetSettings } = useSettings();
  const [activeParent, setActiveParent] = useState(null);
  const [activeSubsection, setActiveSubsection] = useState(null);
  const [toggleError, setToggleError] = useState("");
  const [currentTooltip, setCurrentTooltip] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    if (activeParent !== 'settings') setActiveSubsection(null);
  }, [activeParent]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuRef]);

  const handleTooltipEnter = (e) => {
    const tooltipWidth = 250;
    let tooltipX = e.clientX + 10;
    if (window.innerWidth - e.clientX < tooltipWidth + 20) tooltipX = e.clientX - tooltipWidth - 10;
    if (tooltipX < 0) tooltipX = 10;
    else if (tooltipX + tooltipWidth > window.innerWidth) tooltipX = window.innerWidth - tooltipWidth - 10;
    setCurrentTooltip({ text: e.target.dataset.tooltip, x: tooltipX, y: e.clientY });
  };

  const handleKillzoneChange = (index, field, value) => {
    if (!user) { setShowUnlockModal(true); return; }
    const newKillzones = [...killzones];
    newKillzones[index][field] = value;
    onKillzonesChange(newKillzones);
  };

  const handleToggle = (toggleFunc) => {
    const success = toggleFunc();
    if (!success) {
      setToggleError("At least one of the main clock elements must be enabled.");
      setTimeout(() => setToggleError(""), 4000);
    } else {
      setToggleError("");
    }
  };

  const handleToggleShowTimeToEnd = () => {
    if (!user) { setShowUnlockModal(true); return; }
    toggleShowTimeToEnd();
  };

  const handleToggleShowTimeToStart = () => {
    if (!user) { setShowUnlockModal(true); return; }
    toggleShowTimeToStart();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      resetSettings();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`sidebar ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="sidebar-content" onClick={(e) => e.stopPropagation()}>
        {currentTooltip && (
          <div className="sidebar-tooltip" style={{ left: currentTooltip.x, top: currentTooltip.y - 60 }} dangerouslySetInnerHTML={{ __html: currentTooltip.text }} />
        )}
        <span className="sidebar-close close" onClick={onClose}>&times;</span>
        <div className="sidebar-user-section" ref={menuRef}>
          {user ? (
            <div className="user-menu-container">
              <div className="user-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="user-menu-avatar" />
                ) : (
                  <span className="material-symbols-outlined user-menu-avatar">account_circle</span>
                )}
                <span className="user-menu-name">{user.displayName || user.email}</span>
                <span className="material-symbols-outlined user-menu-arrow">arrow_drop_down</span>
              </div>
              {menuOpen && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-item" onClick={() => { setShowAccountModal(true); setMenuOpen(false); }}>
                    My Account
                  </div>
                  <div className="user-menu-item" onClick={handleLogout}>
                    Log out
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="lsu-button" onClick={() => setShowAuthModal(true)}>
              Login / Sign Up
            </button>
          )}
        </div>
        <p className="free-account">Create a free account to unlock Pro★ Features.</p>
        <div className="sidebar-section parent-section">
          <div className="sidebar-section-header parent-section-header" onClick={() => setActiveParent(prev => prev === 'about' ? null : 'about')}>
            <span className="sidebar-section-title">About</span>
            <span className="sidebar-section-arrow">{activeParent === 'about' ? '−' : '+'}</span>
          </div>
          <div className={`sidebar-section-content ${activeParent === 'about' ? 'open' : ''}`}>
            <div className="sidebar-control about-text">
              <h1>Time 2 Trade</h1>
            </div>
          </div>
        </div>
        <div className="sidebar-section parent-section">
          <div className="sidebar-section-header parent-section-header" onClick={() => setActiveParent(prev => prev === 'settings' ? null : 'settings')}>
            <span className="sidebar-section-title">Settings</span>
            <span className="sidebar-section-arrow">{activeParent === 'settings' ? '−' : '+'}</span>
          </div>
          <div className={`sidebar-section-content ${activeParent === 'settings' ? 'open' : ''}`}>
            <div className="sidebar-subsection">
              <div className="sidebar-sub-section-header" onClick={() => setActiveSubsection(prev => prev === 'general' ? null : 'general')}>
                <span className="sidebar-section-title">General Settings</span>
                <span className="sidebar-section-arrow">{activeSubsection === 'general' ? '−' : '+'}</span>
              </div>
              <div className={`sidebar-section-content ${activeSubsection === 'general' ? 'open' : ''}`}>
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
                    <span className="help-icon material-symbols-outlined" data-tooltip="Select a clock style:<br /><br />- Aesthetic*: Optimized for visual appeal.<br />- Tiny: Compact display.<br />- Small: Intermediate size.<br />- Normal: Standard display.<br />- Big (Tablet): Enhanced view for tablets." onMouseEnter={handleTooltipEnter} onMouseLeave={() => setCurrentTooltip(null)}>
                      help
                    </span>
                  </div>
                  <select id="clock-size" className="sidebar-select" value={clockSize} onChange={(e) => onSizeChange(parseInt(e.target.value))}>
                    <option value="300">Aesthetic*</option>
                    <option value="150">Tiny</option>
                    <option value="250">Small</option>
                    <option value="375">Normal</option>
                    <option value="500">Big (Tablet)</option>
                  </select>
                </div>
                <div className="sidebar-control background-color-container">
                  <div className="label-help-container">
                    <label htmlFor="bg-color" className="sidebar-label">Background Color:</label>
                    <span className="help-icon material-symbols-outlined" data-tooltip="Pick a background color. This setting works independently unless overridden by active Killzone." onMouseEnter={handleTooltipEnter} onMouseLeave={() => setCurrentTooltip(null)}>
                      help
                    </span>
                  </div>
                  <input id="bg-color" type="color" className="sidebar-color-picker" value={backgroundColor} onChange={(e) => updateBackgroundColor(e.target.value)} />
                </div>
                <div className="sidebar-control background-based-container toggle-container">
                  <span className="toggle-label sidebar-label" onClick={() => handleToggle(toggleBackgroundBasedOnKillzone)}>
                    Background color based on active Killzone
                  </span>
                  <Switch checked={backgroundBasedOnKillzone} onChange={() => toggleBackgroundBasedOnKillzone()} />
                </div>
              </div>
            </div>
            <div className="sidebar-subsection">
              <div className="sidebar-sub-section-header" onClick={() => setActiveSubsection(prev => prev === 'killzone' ? null : 'killzone')}>
                <span className="sidebar-section-title">Killzone Settings ★</span>
                <span className="sidebar-section-arrow">{activeSubsection === 'killzone' ? '−' : '+'}</span>
              </div>
              <div className={`sidebar-section-content ${activeSubsection === 'killzone' ? 'open' : ''}`}>
                <div className="killzone-help" style={{ marginBottom: '10px' }}>
                  <span style={{fontSize: '0.9rem' }}>What is a Killzone?</span>
                  <span className="help-icon material-symbols-outlined" data-tooltip="A Killzone is a high-volatility trading period aligned with key market sessions." onMouseEnter={handleTooltipEnter} onMouseLeave={() => setCurrentTooltip(null)}>
                    help
                  </span>
                </div>
                <div className="killzone-inputs">
                  {killzones.map((kz, index) => (
                    <div key={index} className="killzone-item">
                      <label htmlFor={`kz-name-${index}`} className="sidebar-label">
                        Killzone {index + 1} Name:
                      </label>
                      <input
                        id={`kz-name-${index}`}
                        type="text"
                        className="sidebar-input killzone-name"
                        value={kz.name}
                        onChange={(e) => handleKillzoneChange(index, 'name', e.target.value)}
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
                            onChange={(e) => handleKillzoneChange(index, 'startNY', e.target.value)}
                          />
                        </div>
                        <div className="killzone-field">
                          <label htmlFor={`kz-end-${index}`} className="sidebar-label">End Time:</label>
                          <input
                            id={`kz-end-${index}`}
                            type="time"
                            className="sidebar-input killzone-end"
                            value={kz.endNY}
                            onChange={(e) => handleKillzoneChange(index, 'endNY', e.target.value)}
                          />
                        </div>
                        <div className="killzone-field">
                          <label htmlFor={`kz-color-${index}`} className="sidebar-label">Color:</label>
                          <input
                            id={`kz-color-${index}`}
                            type="color"
                            className="sidebar-input killzone-color"
                            value={kz.color}
                            onChange={(e) => handleKillzoneChange(index, 'color', e.target.value)}
                          />
                        </div>
                      </div>
                      <hr className="killzone-divider" />
                    </div>
                  ))}
                </div>
                <div className="sidebar-control killzone-toggles">
                  <div className="toggle-container">
                    <span className="toggle-label sidebar-label" onClick={handleToggleShowTimeToEnd}>
                      Show Time to End
                    </span>
                    <Switch checked={showTimeToEnd} onChange={handleToggleShowTimeToEnd} />
                  </div>
                  <hr className="settings-divider"/>
                  <div className="toggle-container">
                    <span className="toggle-label sidebar-label" onClick={handleToggleShowTimeToStart}>
                      Show Time to Start
                    </span>
                    <Switch checked={showTimeToStart} onChange={handleToggleShowTimeToStart} />
                  </div>
                </div>
              </div>
            </div>
            <div className="sidebar-subsection">
              <div className="sidebar-sub-section-header" onClick={() => setActiveSubsection(prev => prev === 'economic' ? null : 'economic')}>
                <span className="sidebar-section-title">Economic Events ★</span>
                <span className="sidebar-section-arrow">{activeSubsection === 'economic' ? '−' : '+'}</span>
              </div>
              <div className={`sidebar-section-content ${activeSubsection === 'economic' ? 'open' : ''}`}>
                <div className="sidebar-control">
                  <h3><strong>Coming soon!</strong></h3>
                  <p>Displays today's high impact Economic Events in the main clock.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="sidebar-footer">
          Developed by: <strong>
            <a className="sidebar-link" href="https://x.com/lofi_trades" target="_blank" rel="noopener noreferrer" title="Lofi Trades X Link">
              @lofi_trades
            </a>
          </strong>
        </p>
      </div>
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showAccountModal && <AccountModal onClose={() => setShowAccountModal(false)} user={user} resetSettings={resetSettings} />}
      {showUnlockModal && (
        <UnlockModal
          onClose={() => setShowUnlockModal(false)}
          onSignUp={() => { setShowUnlockModal(false); setShowAuthModal(true); }}
        />
      )}
    </div>
  );
}
