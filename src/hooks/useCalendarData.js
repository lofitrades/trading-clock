/**
 * src/hooks/useCalendarData.js
 * 
 * Purpose: Headless calendar data hook that reuses EventsFilters3 logic with a configurable default preset,
 * fetches economic events, and exposes grouped, filter-aware state for embeddable calendar surfaces.
 * 
 * Changelog:
 * v1.0.1 - 2026-01-06 - Fixed calculateDateRange to use timezone-safe end-of-day calculation (next day start - 1 second) preventing single-day presets from bleeding into the next calendar day.
 * v1.0.0 - 2026-01-06 - Introduced calendar data hook with This Week default, persistence via SettingsContext, and refresh support.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from './useFavorites';
import { getEventsByDateRange, refreshEventsCache } from '../services/economicEventsService';
import { sortEventsByTime } from '../utils/newsApi';
import { getDatePartsInTimezone, getUtcDateForTimezone } from '../utils/dateUtils';

const MAX_DATE_RANGE_DAYS = 365;

const calculateDateRange = (preset, timezone) => {
  const { year, month, day, dayOfWeek } = getDatePartsInTimezone(timezone);
  const createDate = (y, m, d, endOfDay = false) => {
    if (endOfDay) {
      // Create start of NEXT day, then subtract 1 second to stay within the target day
      // This ensures we don't bleed into the next calendar day in the target timezone
      const nextDayStart = getUtcDateForTimezone(timezone, y, m, d + 1, { hour: 0, minute: 0, second: 0, millisecond: 0 });
      return new Date(nextDayStart.getTime() - 1000); // End at 23:59:59 of target day
    }
    return getUtcDateForTimezone(timezone, y, m, d, { endOfDay: false });
  };

  switch (preset) {
    case 'today':
      return { startDate: createDate(year, month, day), endDate: createDate(year, month, day, true) };
    case 'yesterday':
      return { startDate: createDate(year, month, day - 1), endDate: createDate(year, month, day - 1, true) };
    case 'tomorrow':
      return { startDate: createDate(year, month, day + 1), endDate: createDate(year, month, day + 1, true) };
    case 'thisWeek': {
      const startDay = day - dayOfWeek;
      const endDay = day + (6 - dayOfWeek);
      return { startDate: createDate(year, month, startDay), endDate: createDate(year, month, endDay, true) };
    }
    default:
      return null;
  }
};

const ensureDate = (value) => {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
};

export function useCalendarData({ defaultPreset = 'thisWeek' } = {}) {
  const { user } = useAuth();
  const { selectedTimezone, eventFilters, newsSource, updateEventFilters, updateNewsSource } = useSettings();
  const { isFavorite, toggleFavorite, favoritesLoading, isFavoritePending } = useFavorites();

  const defaultRange = useMemo(
    () => calculateDateRange(defaultPreset, selectedTimezone),
    [defaultPreset, selectedTimezone],
  );

  const [filters, setFilters] = useState(() => {
    const startDate = ensureDate(eventFilters.startDate) || defaultRange?.startDate || null;
    const endDate = ensureDate(eventFilters.endDate) || defaultRange?.endDate || null;
    return {
      startDate,
      endDate,
      impacts: eventFilters.impacts || [],
      currencies: eventFilters.currencies || [],
      favoritesOnly: eventFilters.favoritesOnly || false,
      searchQuery: eventFilters.searchQuery || '',
    };
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const persistFilters = useCallback(
    (nextFilters) => {
      updateEventFilters(nextFilters);
    },
    [updateEventFilters],
  );

  const fetchEvents = useCallback(
    async (incomingFilters = null) => {
      const active = incomingFilters ? { ...incomingFilters } : { ...filtersRef.current };
      const startDate = ensureDate(active.startDate) || defaultRange?.startDate;
      const endDate = ensureDate(active.endDate) || defaultRange?.endDate;

      if (!startDate || !endDate) {
        setError('Please select a date range to view events.');
        return;
      }

      const diffDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      if (diffDays > MAX_DATE_RANGE_DAYS) {
        setError(`Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days.`);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getEventsByDateRange(startDate, endDate, {
          source: newsSource,
          impacts: active.impacts || [],
          currencies: active.currencies || [],
        });

        if (result.success) {
          setEvents(sortEventsByTime(result.data));
          setLastUpdated(new Date());
        } else {
          setEvents([]);
          setError(result.error || 'Failed to load events.');
        }
      } catch (err) {
        setEvents([]);
        setError(err.message || 'Unexpected error while loading events.');
      } finally {
        setLoading(false);
      }
    },
    [defaultRange, newsSource],
  );

  const applyFilters = useCallback(
    (nextFilters) => {
      const merged = {
        ...filtersRef.current,
        ...nextFilters,
      };

      const startDate = ensureDate(merged.startDate) || defaultRange?.startDate;
      const endDate = ensureDate(merged.endDate) || defaultRange?.endDate;

      const resolved = {
        ...merged,
        startDate,
        endDate,
        searchQuery: merged.searchQuery || '',
      };

      filtersRef.current = resolved;
      setFilters(resolved);
      persistFilters(resolved);
      fetchEvents(resolved);
    },
    [defaultRange, fetchEvents, persistFilters],
  );

  const handleFiltersChange = useCallback((nextFilters) => {
    setFilters((prev) => ({ ...prev, ...nextFilters }));
  }, []);

  useEffect(() => {
    const hasDates = Boolean(filters.startDate && filters.endDate);

    if (!hasDates && defaultRange?.startDate && defaultRange?.endDate) {
      const seeded = { ...filters, ...defaultRange };
      filtersRef.current = seeded;
      setFilters(seeded);
      persistFilters(seeded);
      fetchEvents(seeded);
      return;
    }

    if (hasDates) {
      fetchEvents(filters);
    }
  }, [defaultRange, fetchEvents, filters, persistFilters]);

  const displayedEvents = useMemo(() => {
    let filtered = events;

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter((event) => {
        const name = (event.name || event.Name || '').toLowerCase();
        const currency = (event.currency || event.Currency || '').toLowerCase();
        const description = (event.description || event.Description || event.summary || event.Summary || '').toLowerCase();

        return (
          name.includes(query) ||
          currency.includes(query) ||
          description.includes(query)
        );
      });
    }

    if (filters.favoritesOnly) {
      filtered = filtered.filter((event) => isFavorite(event));
    }

    return filtered;
  }, [events, filters.favoritesOnly, filters.searchQuery, isFavorite]);

  const visibleCount = displayedEvents.length;

  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshEventsCache(newsSource);
      await fetchEvents(filtersRef.current);
    } catch (err) {
      setError(err.message || 'Failed to refresh events.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchEvents, newsSource, refreshing]);

  const handleNewsSourceChange = useCallback(
    (nextSource) => {
      updateNewsSource(nextSource);
      fetchEvents(filtersRef.current);
    },
    [fetchEvents, updateNewsSource],
  );

  return {
    filters,
    handleFiltersChange,
    applyFilters,
    events: displayedEvents,
    rawEvents: events,
    loading,
    error,
    lastUpdated,
    visibleCount,
    timezone: selectedTimezone,
    newsSource,
    handleNewsSourceChange,
    refresh,
    refreshing,
    isFavorite,
    toggleFavorite,
    isFavoritePending,
    favoritesLoading,
    defaultRange,
    user,
  };
}

export default useCalendarData;
