/**
 * src/components/TimeSettings.jsx
 * 
 * Purpose: Simple settings panel for time countdown visibility toggles.
 * Provides quick access to show/hide time-to-end and time-to-start indicators.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-29 - BEP i18n: Added translations for labels and tooltips.
 * v1.0.0 - 2025-11-30 - Initial implementation
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

const TimeSettings = ({ showTimeToEnd, showTimeToStart, toggleShowTimeToEnd, toggleShowTimeToStart }) => {
  const { t } = useTranslation(['settings', 'tooltips']);

  return (
    <div className="time-settings" style={{ marginTop: '20px' }}>
      <h4>
        {t('settings:general.timeDisplay.title')}
        <span
          title={t('tooltips:timeSettings')}
          style={{ marginLeft: '5px', cursor: 'help' }}
        >
          ?
        </span>
      </h4>
      <div className="setting-item" style={{ marginBottom: '10px' }}>
        <input
          type="checkbox"
          id="showTimeToEnd"
          checked={showTimeToEnd}
          onChange={toggleShowTimeToEnd}
        />
        <label
          htmlFor="showTimeToEnd"
          title={t('tooltips:timeToEnd')}
          style={{ marginLeft: '5px' }}
        >
          {t('settings:general.timeDisplay.showTimeToEnd')}
        </label>
      </div>
      <div className="setting-item">
        <input
          type="checkbox"
          id="showTimeToStart"
          checked={showTimeToStart}
          onChange={toggleShowTimeToStart}
        />
        <label
          htmlFor="showTimeToStart"
          title={t('tooltips:timeToStart')}
          style={{ marginLeft: '5px' }}
        >
          {t('settings:general.timeDisplay.showTimeToStart')}
        </label>
      </div>
    </div>
  );
};

export default TimeSettings;
