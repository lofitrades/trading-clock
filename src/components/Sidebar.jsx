import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = ({
  open,
  onClose,
  clockSize,
  killzones,
  onSizeChange,
  onKillzonesChange,
  showTimeToEnd,
  showTimeToStart,
  toggleShowTimeToEnd,
  toggleShowTimeToStart,
  backgroundColor,
  updateBackgroundColor,
  backgroundBasedOnKillzone,
  toggleBackgroundBasedOnKillzone
}) => {
  // Collapsible section states (initially closed)
  const [isGeneralOpen, setIsGeneralOpen] = useState(false);
  const [isKillzoneOpen, setIsKillzoneOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

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

  return (
    <div className={`sidebar ${open ? 'open' : ''}`} onClick={onClose}>
      <div 
        className="sidebar-content" 
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <span className="sidebar-close close" onClick={onClose}>&times;</span>
        <button className="add-button" onClick={() => {alert(" Coming soon! \n This functionallity is under development."); }}>
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
                <option value="600">Big</option>
                <option value="1200">Huge</option>
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
          </div>
        </div>
        {/* Killzone Settings */}
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
            <h1><strong>Time to Trade</strong></h1>
            <p>Time to Trade is a straightforward, powerful tool for futures and forex day traders at every level. Whether you’re just starting out or have years of experience, this app helps you keep track of the market’s key moments by turning time into clear, visual insights.</p>

            <h2><strong>About the App</strong></h2>
            <p>Trading is often seen as a solitary and abstract pursuit. With Time to Trade, you can actually see when the most important parts of your trading day are taking place. The app uses a dynamic clock display where “killzones”—vibrant colored arcs—mark crucial market periods. In this design, the inner circle represents AM hours, while the outer circle shows PM hours, giving you a quick overview of the day’s sessions.</p>

            <h3><strong>Key Features</strong></h3>
            <ul>
            <li><strong>Dynamic Killzones Visualization:</strong><br />The clock displays your defined trading sessions as colored arcs. Customize the start and end times as well as the colors for each killzone, so you can easily tell when key market moments are active.<br /><br /></li>
            <li><strong>Customizable Clock Settings:</strong><br />Choose from a variety of clock sizes—from a compact “Tiny” version to a bold “Huge” display. An intuitive sidebar makes it simple to adjust both the clock’s appearance and your killzone settings.<br /><br /></li>
            <li><strong>Automatic Timezone Support:</strong><br />The clock automatically adjusts to your selected timezone, ensuring that your trading sessions and market events are accurately reflected no matter where you are.<br /><br /></li>
            <li><strong>Easy-to-Use Interface:</strong><br />The design emphasizes clarity and ease of use. With straightforward controls, you can focus on understanding the market rather than wrestling with complicated settings.<br /><br /></li>
            </ul>

            <h2><strong>What’s Coming Soon</strong></h2>
            <ul>
            <li><strong>Alerts & Push Notifications:</strong><br />Stay informed with real-time updates so you never miss an important market moment.<br /><br /></li>
            <li><strong>Personal Diary & Trading Journal:</strong><br />Log and review the significant moments of your trading day.<br /><br /></li>
            <li><strong>Trading Buddy Chatbot:</strong><br />A custom chatbot that helps you organize ideas, identify areas for improvement, and keep your motivation high.<br /><br /></li>
            <li><strong>High-Impact Events Visualization:</strong><br />See exactly when high-impact market events occur right on your clock.<br /><br /></li>
            <li><strong>Integrated Music Player:</strong><br />Enjoy a built-in music player featuring curated instrumental tracks (like lofi, chill house, and synth-wave) to help you maintain focus during your sessions.<br /><br /></li>
            </ul>

            <h2><strong>About the Developer</strong></h2>
            <p>I’m Lofi Trades—a futures trader with a passion for music and technology. I built Time to Trade because I believe that trading tools should add real value back to the community. Rather than letting trading feel empty, I wanted to create a tool that makes time itself a source of insight.</p>

            <h3><strong>Get in Touch</strong></h3>
            <p>If you have any questions, feedback, or suggestions, feel free to reach out:</p><br />

            <strong></strong> <a href="https://x.com/lofi_trades" className="sidebar-link" target="_blank">Follow me on X</a><br /><br />
            <strong></strong> <a href="mailto:lofitradesx@gmail.com" className="sidebar-link">Send me an email</a><br /><br />


            <h2><strong>Support the Project</strong></h2>
            <p>If you find value in Time to Trade and want to support its development, please consider offering your support:</p>

            <a href="https://www.buymeacoffee.com/lofitrades" className="sidebar-link" target="_blank"><br />☕ Buy me a coffee</a><br /><br />
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
