/**
 * src/components/TimeStatus.jsx
 * 
 * Purpose: Lightweight status indicator for session countdowns.
 * Displays time-to-end or next session timing based on active session state.
 * 
 * Changelog:
 * v1.1.0 - 2026-01-29 - BEP i18n: Added translations for status labels and tooltips.
 * v1.0.0 - 2025-11-30 - Initial implementation
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../utils/clockUtils';

const TimeStatus = ({ activeSession, timeToEnd, nextSession, timeToStart, showTimeToEnd, showTimeToStart }) => {
  const { t } = useTranslation(['tooltips']);

  if (activeSession && showTimeToEnd && timeToEnd != null) {
    const formattedTime = formatTime(timeToEnd);
    return (
      <div
        className="time-status"
        title={t('tooltips:timeToEndWithValue', { time: formattedTime })}
        style={{ textAlign: 'center', marginTop: '5px' }}
      >
        {t('tooltips:timeToEndWithValue', { time: formattedTime })}
      </div>
    );
  } else if (!activeSession && nextSession && showTimeToStart && timeToStart != null) {
    const formattedTime = formatTime(timeToStart);
    return (
      <div
        className="time-status"
        title={t('tooltips:timeToStartWithValue', { time: formattedTime })}
        style={{ textAlign: 'center', marginTop: '5px' }}
      >
        {t('tooltips:nextSessionWithTime', { session: nextSession.name, time: formattedTime })}
      </div>
    );
  } else {
    return null;
  }
};

export default TimeStatus;
