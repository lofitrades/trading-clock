/**
 * src/components/EconomicEvents3.jsx
 * 
 * Purpose: Airbnb-style economic events drawer with compact/right-drawer and full-width modes.
 * Provides filters, sync, refresh, news source selection, and timeline/table views using EventsFilters3 and EventsTimeline2/EventsTable.
 * 
 * Changelog:
 * v1.5.3 - 2025-12-17 - Added secondary About CTA alongside auth prompt with mobile-first layout.
 * v1.5.2 - 2025-12-16 - Keep drawer width consistent in table view; enable horizontal scroll for table content.
 * v1.5.1 - 2025-12-16 - Restricted sync actions to superadmin role in header controls.
 * v1.5.0 - 2025-12-15 - Added search functionality with client-side filtering (event names only), proper state management, and UX messages.
 * v1.4.1 - 2025-12-15 - Changed default date range from 'This Week' to 'Today' for refresh, background refresh, and initial load.
 * v1.4.0 - 2025-12-12 - Added synced event notes dialog with add/remove actions, badges, and auth-aware handling.
 * v1.3.2 - 2025-12-12 - Added header close icon and smooth slide animation for opening/closing the events drawer.
 * v1.3.1 - 2025-12-12 - Added favorites-only filter toggle and applied it to displayed results.
 * v1.3.0 - 2025-12-12 - Added favorites plumbing with auth-aware toggle handling for timeline/table views.
 * v1.2.10 - 2025-12-11 - Add periodic, visibility-aware stale refresh that respects cache freshness while keeping manual refresh as fallback.
 * v1.2.9 - 2025-12-11 - On sm+ show calendar icon to the left of the header title; retain xs icon row layout.
 * v1.2.8 - 2025-12-11 - Move calendar icon into the icon row on xs, left-aligned; keep title on its own row.
 * v1.2.7 - 2025-12-11 - Header on xs shows icon row first and title on its own full row for better mobile clarity.
 * v1.2.6 - 2025-12-11 - Added settings gear in header to open the settings modal from events drawer.
 * v1.2.5 - 2025-12-11 - UX: Replace expand/collapse icons with Timeline and Table icons for better clarity on view toggle.
 * v1.2.4 - 2025-12-11 - ENHANCEMENT: Added contextEvents (today + 7 days future, unfiltered) for accurate NEXT state detection regardless of user's selected date filter.
 * v1.2.3 - 2025-12-11 - CRITICAL FIX: Remove aggressive fallback to todayRange in applyFilters; only use when dates are null. Fix day rollover to preserve user-selected non-Today ranges (Yesterday, Tomorrow, etc).
 * v1.2.2 - 2025-12-11 - Revert to expand/collapse icons while keeping table/timeline toggle behavior.
 * v1.2.0 - 2025-12-11 - Show EventsTable in full-width mode while keeping timeline in compact mode for mobile-first UX.
 * v1.1.0 - 2025-12-11 - Auto-re-evaluate “Today” each day rollover and reapply filters to keep data current.
 * v1.0.0 - 2025-12-11 - Initial implementation with dual-size drawer, timeline-first UX, and integrated filters/actions.
 */

import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
	Alert,
	AlertTitle,
	Box,
	Button,
	IconButton,
	Paper,
	Slide,
	Stack,
	Tooltip,
	Typography,
	alpha,
	useTheme,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import TimelineIcon from '@mui/icons-material/Timeline';
import TableChartIcon from '@mui/icons-material/TableChart';
import CalendarViewWeekIcon from '@mui/icons-material/CalendarViewWeek';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import SettingsIcon from '@mui/icons-material/Settings';
import EventsFilters3 from './EventsFilters3';
import EventsTimeline2 from './EventsTimeline2';
import EventsTable from './EventsTable';
import NewsSourceSelector from './NewsSourceSelector';
import EventNotesDialog from './EventNotesDialog';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { useEventNotes } from '../hooks/useEventNotes';
import { getEventsByDateRange, refreshEventsCache, triggerNfsWeekSync, triggerJblankedActualsSync } from '../services/economicEventsService';
import { sortEventsByTime } from '../utils/newsApi';
import { getDatePartsInTimezone, getUtcDateForTimezone } from '../utils/dateUtils';

const MAX_DATE_RANGE_DAYS = 365;
const PERIODIC_REFRESH_MS = 5 * 60 * 1000; // 5 minutes
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

const buildTodayRange = (timezone) => {
	const { year, month, day } = getDatePartsInTimezone(timezone);
	const startDate = getUtcDateForTimezone(timezone, year, month, day);
	const endDate = getUtcDateForTimezone(timezone, year, month, day, { endOfDay: true });
	return { startDate, endDate };
};

const ensureDate = (value) => {
	if (!value) return null;
	return value instanceof Date ? value : new Date(value);
};

export default function EconomicEvents3({ open, onClose, autoScrollRequest = null, onOpenAuth, onOpenSettings }) {
	const theme = useTheme();
	const { user, hasRole } = useAuth();
	const isSuperAdmin = hasRole ? hasRole('superadmin') : false;
	const { selectedTimezone, eventFilters, newsSource, updateNewsSource, updateEventFilters } = useSettings();
	const { favoritesLoading, isFavorite, toggleFavorite, isFavoritePending } = useFavorites();
	const {
		notesError,
		hasNotes,
		getNotesForEvent,
		ensureNotesStream,
		stopNotesStream,
		addNote,
		removeNote,
		isEventNotesLoading,
	} = useEventNotes();

	const [filters, setFilters] = useState(() => ({
		startDate: ensureDate(eventFilters.startDate),
		endDate: ensureDate(eventFilters.endDate),
		impacts: eventFilters.impacts || [],
		currencies: eventFilters.currencies || [],
		favoritesOnly: eventFilters.favoritesOnly || false,
		searchQuery: eventFilters.searchQuery || '',
	}));
	const [events, setEvents] = useState([]);
	const [contextEvents, setContextEvents] = useState([]); // Today + future for NEXT detection
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [noteTarget, setNoteTarget] = useState(null);
	const [syncingWeek, setSyncingWeek] = useState(false);
	const [syncingActuals, setSyncingActuals] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [expanded, setExpanded] = useState(false);
	const [syncSuccess, setSyncSuccess] = useState(null);
	const [visibleCount, setVisibleCount] = useState(0);
	const [lastUpdated, setLastUpdated] = useState(null);
	const [autoScrollToken, setAutoScrollToken] = useState(0);
	const filtersRef = useRef(filters);
	const backgroundRefreshRef = useRef(false);

	const handleToggleFavorite = useCallback(async (event) => {
		const result = await toggleFavorite(event);
		if (result?.requiresAuth && onOpenAuth) {
			onOpenAuth();
		}
	}, [toggleFavorite, onOpenAuth]);

	const handleOpenNotes = useCallback((event) => {
		const { key, requiresAuth } = ensureNotesStream(event);
		if (requiresAuth && onOpenAuth) {
			onClose();
			onOpenAuth();
			return;
		}
		if (key) {
			setNoteTarget({ event, key });
		}
	}, [ensureNotesStream, onClose, onOpenAuth]);

	const handleCloseNotes = useCallback(() => {
		if (noteTarget?.event) {
			stopNotesStream(noteTarget.event);
		}
		setNoteTarget(null);
	}, [noteTarget, stopNotesStream]);

	const handleAddNote = useCallback(async (noteText) => {
		if (!noteTarget?.event) return { success: false };
		const result = await addNote(noteTarget.event, noteText);
		if (result?.requiresAuth && onOpenAuth) {
			onClose();
			onOpenAuth();
		}
		return result;
	}, [addNote, noteTarget, onClose, onOpenAuth]);

	const handleRemoveNote = useCallback(async (noteId) => {
		if (!noteTarget?.event) return { success: false };
		const result = await removeNote(noteTarget.event, noteId);
		if (result?.requiresAuth && onOpenAuth) {
			onClose();
			onOpenAuth();
		}
		return result;
	}, [noteTarget, onClose, onOpenAuth, removeNote]);

	const timelineKeyRef = useRef(0);

	const todayRange = useMemo(() => buildTodayRange(selectedTimezone), [selectedTimezone]);

	const effectiveFilters = useMemo(() => {
		const startDate = ensureDate(filters.startDate);
		const endDate = ensureDate(filters.endDate);
		return {
			...filters,
			startDate,
			endDate,
		};
	}, [filters]);

	const displayedEvents = useMemo(() => {
		let filtered = events;
		
		// Apply search filter (event name, currency, and notes)
		if (filters.searchQuery && filters.searchQuery.trim()) {
			const query = filters.searchQuery.toLowerCase().trim();
			filtered = filtered.filter((event) => {
				const name = (event.name || event.Name || event.title || event.Title || '').toLowerCase();
				if (name.includes(query)) return true;
				
				const currency = (event.currency || event.Currency || '').toLowerCase();
				if (currency.includes(query)) return true;
				
				const description = (event.description || event.Description || event.summary || event.Summary || '').toLowerCase();
				if (description.includes(query)) return true;
				
				return false;
			});
		}
		
		// Apply favorites filter
		if (filters.favoritesOnly) {
			filtered = filtered.filter((event) => isFavorite(event));
		}
		
		return filtered;
	}, [events, filters.favoritesOnly, filters.searchQuery, isFavorite]);

	const fetchEvents = useCallback(async (incomingFilters = null) => {
		const active = incomingFilters ? { ...incomingFilters } : { ...effectiveFilters };
		const startDate = ensureDate(active.startDate);
		const endDate = ensureDate(active.endDate);
		const searchQuery = active.searchQuery || '';

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
				const sorted = sortEventsByTime(result.data);
				setEvents(sorted);
				setLastUpdated(new Date());
				
				// Calculate visible count (will be computed by displayedEvents memo)
				let filtered = sorted;
				if (searchQuery && searchQuery.trim()) {
					const query = searchQuery.toLowerCase().trim();
					filtered = filtered.filter((event) => {
						const name = (event.name || event.Name || event.title || event.Title || '').toLowerCase();
						if (name.includes(query)) return true;
						
						const currency = (event.currency || event.Currency || '').toLowerCase();
						if (currency.includes(query)) return true;
						
						const description = (event.description || event.Description || event.summary || event.Summary || '').toLowerCase();
						if (description.includes(query)) return true;
						
						return false;
					});
				}
				if (active.favoritesOnly) {
					filtered = filtered.filter((event) => isFavorite(event));
				}
				setVisibleCount(filtered.length);
			} else {
				setEvents([]);
				setError(result.error || 'Failed to load events.');
			}
		} catch (_error) {
			setEvents([]);
			setError(_error.message || 'Unexpected error while loading events.');
		} finally {
			setLoading(false);
		}
	}, [effectiveFilters, isFavorite, newsSource]);

	const fetchContextEvents = useCallback(async () => {
		// Always fetch today + 7 days future for accurate NEXT detection
		// regardless of user's selected date filter
		const { year, month, day } = getDatePartsInTimezone(selectedTimezone);
		const contextStart = getUtcDateForTimezone(selectedTimezone, year, month, day);
		const contextEnd = getUtcDateForTimezone(selectedTimezone, year, month, day + 7, { endOfDay: true });

		try {
			const result = await getEventsByDateRange(contextStart, contextEnd, {
				source: newsSource,
				impacts: [], // No impact filter for context (all events)
				currencies: [], // No currency filter for context
			});

			if (result.success) {
				const sorted = sortEventsByTime(result.data);
				setContextEvents(sorted);
			} else {
				console.warn('[EconomicEvents3] Failed to fetch context events:', result.error);
			}
		} catch (err) {
			console.warn('[EconomicEvents3] Failed to fetch context events for NEXT detection:', err);
		}
	}, [newsSource, selectedTimezone]);

	useEffect(() => {
		if (filters.favoritesOnly) {
			setVisibleCount(displayedEvents.length);
		}
	}, [displayedEvents, filters.favoritesOnly]);

	useEffect(() => {
		if (!user && noteTarget) {
			setNoteTarget(null);
		}
	}, [noteTarget, user]);

	const applyFilters = useCallback((nextFilters) => {
		const current = filtersRef.current || filters;

		const merged = {
			...current,
			...nextFilters,
			searchQuery: nextFilters.searchQuery !== undefined ? nextFilters.searchQuery : current.searchQuery || '',
		};

		// Only fallback to todayRange if BOTH dates are completely missing
		// Do NOT override user-selected date ranges when changing other filters
		const startDate = ensureDate(merged.startDate) || ensureDate(current?.startDate);
		const endDate = ensureDate(merged.endDate) || ensureDate(current?.endDate);

		// If still no dates (initial load), use today
		const finalStartDate = startDate || todayRange.startDate;
		const finalEndDate = endDate || todayRange.endDate;

		const resolved = { ...merged, startDate: finalStartDate, endDate: finalEndDate };

		filtersRef.current = resolved;
		setFilters(resolved);
		updateEventFilters(resolved);
		fetchEvents(resolved);
		fetchContextEvents(); // Always fetch context for NEXT detection
	}, [fetchContextEvents, fetchEvents, filters, todayRange.endDate, todayRange.startDate, updateEventFilters]);

	const handleFiltersChange = useCallback((nextFilters) => {
		setFilters((prev) => ({ ...prev, ...nextFilters }));
	}, []);

	const handleFiltersApply = useCallback((nextFilters) => {
		applyFilters(nextFilters);
		setAutoScrollToken((prev) => prev + 1);
	}, [applyFilters]);

	useEffect(() => {
		filtersRef.current = filters;
	}, [filters]);

	useEffect(() => {
		const dayKeyRef = { current: null };

		const checkDay = () => {
			const { year, month, day } = getDatePartsInTimezone(selectedTimezone);
			const key = `${year}-${month}-${day}`;
			if (dayKeyRef.current === key) return;
			dayKeyRef.current = key;
			
			const range = buildTodayRange(selectedTimezone);
			const current = filtersRef.current || {};
			
			// Only update if the current range WAS yesterday's "today" (meaning user had "Today" selected)
			// Don't override if user selected a different preset like "Yesterday" or "Tomorrow"
			const wasToday = current.startDate && current.endDate &&
				Math.abs(new Date(current.endDate).getTime() - new Date(current.startDate).getTime()) < 86400000; // ~1 day
			
			if (!wasToday) return; // User selected a multi-day or future range, preserve it
			
			// Check if already showing today
			const sameStart = current.startDate && range.startDate && new Date(current.startDate).getTime() === new Date(range.startDate).getTime();
			const sameEnd = current.endDate && range.endDate && new Date(current.endDate).getTime() === new Date(range.endDate).getTime();
			if (sameStart && sameEnd) return;
			
			// Roll forward to new "today"
			applyFilters({ ...current, startDate: range.startDate, endDate: range.endDate });
			setAutoScrollToken((prev) => prev + 1);
		};

		checkDay();
		const intervalId = setInterval(checkDay, 60_000);
		return () => clearInterval(intervalId);
	}, [applyFilters, selectedTimezone]);


	const handleRefresh = useCallback(async () => {
		if (refreshing || backgroundRefreshRef.current) return;
		setRefreshing(true);
		setSyncSuccess(null);
		try {
			await refreshEventsCache(newsSource);
			// Clear all filters and reset to today
			const resetFilters = {
				...todayRange,
				impacts: [],
				currencies: [],
				favoritesOnly: false,
				searchQuery: '',
			};
			applyFilters(resetFilters);
			setSyncSuccess(`Events refreshed from ${newsSource}.`);
			setTimeout(() => setSyncSuccess(null), 3000);
		} catch {
			setSyncSuccess('Failed to refresh events.');
		} finally {
			setRefreshing(false);
		}
	}, [applyFilters, newsSource, refreshing, todayRange]);

	const performBackgroundRefresh = useCallback(async () => {
		if (refreshing || backgroundRefreshRef.current) return;
		backgroundRefreshRef.current = true;
		try {
			await refreshEventsCache(newsSource);
			applyFilters({ ...(filtersRef.current || filters), ...todayRange });
		} catch {
			// Silent failure for background refresh; manual refresh remains available.
		} finally {
			backgroundRefreshRef.current = false;
		}
	}, [applyFilters, filters, newsSource, refreshing, todayRange]);

	useEffect(() => {
		if (!open) return undefined;
		const intervalId = setInterval(() => {
			const last = lastUpdated ? new Date(lastUpdated).getTime() : 0;
			const now = Date.now();
			const isStale = !last || now - last >= STALE_THRESHOLD_MS;
			const isVisible = typeof document === 'undefined' ? true : !document.hidden;
			if (isVisible && isStale) {
				performBackgroundRefresh();
			}
		}, PERIODIC_REFRESH_MS);
		return () => clearInterval(intervalId);
	}, [lastUpdated, open, performBackgroundRefresh]);

	useEffect(() => {
		if (typeof document === 'undefined') return undefined;
		const handleVisibility = () => {
			if (document.hidden || !open) return;
			const last = lastUpdated ? new Date(lastUpdated).getTime() : 0;
			const now = Date.now();
			const isStale = !last || now - last >= STALE_THRESHOLD_MS;
			if (isStale) {
				performBackgroundRefresh();
			}
		};
		document.addEventListener('visibilitychange', handleVisibility);
		return () => document.removeEventListener('visibilitychange', handleVisibility);
	}, [lastUpdated, open, performBackgroundRefresh]);

	const handleSyncWeek = useCallback(async () => {
		if (syncingWeek) return;
		const confirmed = window.confirm('Sync this week from NFS now? This may take a few seconds.');
		if (!confirmed) return;
		setSyncingWeek(true);
		setSyncSuccess(null);
		try {
			const result = await triggerNfsWeekSync();
			if (result.success) {
				setSyncSuccess('Synced NFS weekly schedule.');
				fetchEvents();
				fetchContextEvents(); // Refresh context events
			} else {
				setSyncSuccess(result.error || 'Failed to sync NFS week.');
			}
		} catch {
			setSyncSuccess('Failed to sync NFS week.');
		} finally {
			setTimeout(() => setSyncSuccess(null), 4000);
			setSyncingWeek(false);
		}
	}, [fetchContextEvents, fetchEvents, syncingWeek]);

	const handleSyncActuals = useCallback(async () => {
		if (syncingActuals) return;
		const confirmed = window.confirm('Sync today\'s actuals from JBlanked (all sources)? This may take a few seconds.');
		if (!confirmed) return;
		setSyncingActuals(true);
		setSyncSuccess(null);
		try {
			const result = await triggerJblankedActualsSync();
			if (result.success) {
				setSyncSuccess('Synced today\'s actuals from JBlanked.');
				fetchEvents();
				fetchContextEvents(); // Refresh context events
			} else {
				setSyncSuccess(result.error || 'Failed to sync actuals.');
			}
		} catch {
			setSyncSuccess('Failed to sync actuals.');
		} finally {
			setTimeout(() => setSyncSuccess(null), 4000);
			setSyncingActuals(false);
		}
	}, [fetchEvents, fetchContextEvents, syncingActuals]);

	const handleNewsSourceChange = useCallback((newSource) => {
		updateNewsSource(newSource);
		setSyncSuccess(`Switched to ${newSource.toUpperCase()}.`);
		fetchEvents();
		fetchContextEvents(); // Refresh context events
		setTimeout(() => setSyncSuccess(null), 2500);
	}, [fetchContextEvents, fetchEvents, updateNewsSource]);

	useEffect(() => {
		if (!filters.startDate || !filters.endDate) {
			const seeded = { ...filters, ...todayRange };
			setFilters(seeded);
			updateEventFilters(seeded);
			fetchEvents(seeded);
			fetchContextEvents();
		} else {
			fetchEvents();
			fetchContextEvents();
		}
	}, [fetchContextEvents, fetchEvents, filters, newsSource, selectedTimezone, todayRange, updateEventFilters]);

	useEffect(() => {
		if (open && user) {
			timelineKeyRef.current += 1;
			setAutoScrollToken((prev) => prev + 1);
		}
	}, [open, user]);

	useEffect(() => {
		if (autoScrollRequest) {
			setAutoScrollToken((prev) => prev + 1);
		}
	}, [autoScrollRequest]);

	const shellBg = expanded ? 'background.default' : 'background.paper';
	const headerFg = expanded ? 'text.primary' : 'text.primary';
	const headerLabel = expanded ? 'Events Table' : 'Events Timeline';
	const contentLabel = expanded ? 'Table' : 'Timeline';

	const handleOpenSettings = useCallback(() => {
		onClose(); // Close events drawer when opening settings
		if (onOpenSettings) onOpenSettings();
	}, [onClose, onOpenSettings]);

	const transitionEasing = {
		enter: theme.transitions.easing.easeOut,
		exit: theme.transitions.easing.sharp,
	};

	return (
		<Slide
			in={open}
			direction="left"
			timeout={{ enter: 320, exit: 260 }}
			easing={transitionEasing}
			mountOnEnter
			unmountOnExit
		>
			<Paper
				elevation={8}
				sx={{
					position: 'fixed',
					right: 0,
					top: 0,
					left: 'auto',
					height: 'var(--t2t-vv-height, 100dvh)',
					width: { xs: '100%', sm: '100%', md: 520, lg: 560 },
					display: 'flex',
					flexDirection: 'column',
					zIndex: 1300,
					overflow: 'hidden',
					bgcolor: shellBg,
					color: headerFg,
					borderRadius: { xs: 0, sm: '16px 0 0 16px' },
					transition: theme.transitions.create(['transform', 'opacity'], {
						duration: 260,
						easing: transitionEasing.enter,
					}),
				}}
			>
			<Box
				sx={{
					px: { xs: 1.5, sm: 1.75 },
					pb: { xs: 1.5, sm: 1.75 },
					pt: (theme) => `calc(${theme.spacing(1.5)} + var(--t2t-safe-top, 0px))`,
					borderBottom: '1px solid',
					borderColor: 'primary.dark',
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 1,
					bgcolor: 'primary.main',
					position: expanded ? 'sticky' : 'relative',
					top: 0,
					zIndex: 1400,
				}}
			>
				{/* Left: Logo and Title */}
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1,
						minWidth: 0,
						flex: 1,
					}}
				>
					<IconButton
						onClick={onClose}
						sx={{
							width: { xs: 44, md: 48 },
							height: { xs: 44, md: 48 },
							mx: 0.5,
							p: 0,
							borderRadius: 1,
						}}
					>
						<img
							src={`${import.meta.env.BASE_URL}Time2Trade_Logo_White.svg`}
							alt="Time 2 Trade"
							style={{
								width: '100%',
								height: '100%',
								objectFit: 'contain',
							}}
						/>
					</IconButton>
					<Box>
						<Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: alpha(theme.palette.primary.contrastText, 0.8) }}>
							Time 2 Trade
						</Typography>
						<Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.contrastText' }}>
							{headerLabel}
						</Typography>
					</Box>
				</Box>

				{/* Right: Action Icons */}
				<Stack
					direction="row"
					spacing={0.75}
					alignItems="center"
					sx={{
						flexShrink: 0,
					}}
				>

					{user && (
						<Tooltip title={expanded ? 'Switch to Timeline view' : 'Switch to Table view'}>
							<span>
								<IconButton onClick={() => setExpanded((prev) => !prev)} sx={{ color: 'primary.contrastText' }} size="small">
									{expanded ? <TimelineIcon /> : <TableChartIcon />}
								</IconButton>
							</span>
						</Tooltip>
					)}
					{isSuperAdmin && (
						<Tooltip title="Sync week (NFS)">
							<span>
								<IconButton onClick={handleSyncWeek} disabled={syncingWeek} sx={{ color: 'primary.contrastText' }} size="small">
									<CalendarViewWeekIcon
										sx={{
											animation: syncingWeek ? 'spin 1s linear infinite' : 'none',
											'@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
										}}
									/>
								</IconButton>
							</span>
						</Tooltip>
					)}
					{isSuperAdmin && (
						<Tooltip title="Sync today's actuals (JBlanked)">
							<span>
								<IconButton onClick={handleSyncActuals} disabled={syncingActuals} sx={{ color: 'primary.contrastText' }} size="small">
									<FactCheckIcon
										sx={{
											animation: syncingActuals ? 'spin 1s linear infinite' : 'none',
											'@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
										}}
									/>
								</IconButton>
							</span>
						</Tooltip>
					)}
					{user && (
						<Tooltip title="Refresh events">
							<span>
								<IconButton onClick={handleRefresh} disabled={refreshing} sx={{ color: 'primary.contrastText' }} size="small">
									<RefreshIcon
										sx={{
											animation: refreshing ? 'spin 1s linear infinite' : 'none',
											'@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
										}}
									/>
								</IconButton>
							</span>
						</Tooltip>
					)}
					<Tooltip title="Open settings">
						<span>
							<IconButton onClick={handleOpenSettings} sx={{ color: 'primary.contrastText' }} size="small">
								<SettingsIcon />
							</IconButton>
						</span>
					</Tooltip>
					<Tooltip title="Close events">
						<span>
							<IconButton onClick={onClose} sx={{ color: 'primary.contrastText' }} size="small">
								<CloseIcon />
							</IconButton>
						</span>
					</Tooltip>
				</Stack>
			</Box>

			{user && syncSuccess && (
				<Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1, bgcolor: 'background.paper' }}>
					<Alert severity={syncSuccess.includes('Failed') ? 'error' : 'success'} sx={{ py: 0.5 }}>
						{syncSuccess}
					</Alert>
				</Box>
			)}

			<Box
				sx={{
					flex: 1,
					overflow: 'hidden',
					display: 'flex',
					flexDirection: 'column',
					bgcolor: 'background.default',
				}}
			>
				{!user && (
					<Box sx={{ p: { xs: 2.5, sm: 3 }, overflow: 'auto' }}>
						<Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
							<AlertTitle sx={{ fontWeight: 800, fontSize: '1.05rem' }}>🔒 Authentication Required</AlertTitle>
							<Typography variant="body1" sx={{ mb: 1.5 }}>
								Login or create a free account to unlock the live economic calendar.
							</Typography>
							<Typography variant="body2" color="text.secondary">
								- Real-time economic events
							</Typography>
							<Typography variant="body2" color="text.secondary">
								- Impact and currency filters
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
								- Cloud sync across devices
							</Typography>
							<Stack
								direction={{ xs: 'column', sm: 'row' }}
								spacing={{ xs: 1.25, sm: 1 }}
								alignItems={{ xs: 'stretch', sm: 'center' }}
							>
								<Button
									variant="contained"
									onClick={() => {
										onClose();
										if (onOpenAuth) onOpenAuth();
									}}
									fullWidth
									sx={{ textTransform: 'none', fontWeight: 700 }}
								>
									Log In / Sign Up
								</Button>
								<Button
									variant="outlined"
									color="primary"
									component={RouterLink}
									to="/about"
									onClick={onClose}
									fullWidth
									sx={{
										textTransform: 'none',
										fontWeight: 700,
										borderWidth: 2,
										'&:hover': { borderWidth: 2 },
									}}
								>
									About Time 2 Trade
								</Button>
							</Stack>
						</Alert>
					</Box>
				)}

				{user && (
					<Box
						sx={{
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							gap: 1.25,
							overflow: 'hidden',
							p: expanded ? { xs: 1.5, sm: 2 } : { xs: 1.25, sm: 1.75 },
						}}
					>
						<Paper
							elevation={expanded ? 0 : 0}
							sx={{
								border: expanded ? '1px solid' : '1px solid',
								borderColor: 'divider',
								bgcolor: 'background.paper',
								color: 'text.primary',
								borderRadius: expanded ? 2 : 2,
								flexShrink: 0,
								overflow: 'hidden',
							}}
						>
							<EventsFilters3
								filters={effectiveFilters}
								onFiltersChange={handleFiltersChange}
								onApply={handleFiltersApply}
								loading={loading}
								timezone={selectedTimezone}
								newsSource={newsSource}
								actionOffset={0}
							/>
						</Paper>
						<Paper
							elevation={0}
							sx={{
								border: '1px solid',
								borderColor: 'divider',
								bgcolor: 'background.paper',
								color: 'text.primary',
								flex: 1,
								display: 'flex',
								flexDirection: 'column',
								overflow: 'hidden',
								borderRadius: expanded ? 2 : 2,
								boxShadow: expanded ? 'none' : undefined,
							}}
						>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									px: { xs: 1.5, sm: 2 },
									py: 1,
									borderBottom: '1px solid',
									borderColor: 'divider',
									gap: 1,
									flexWrap: 'wrap',
								}}
							>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
									<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
										{contentLabel}
									</Typography>
									<Typography variant="caption" sx={{ color: 'text.secondary' }}>
										{visibleCount.toLocaleString()} events • Updated {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
									</Typography>
								</Box>
								<Stack direction="row" spacing={1} alignItems="center">
									<NewsSourceSelector value={newsSource} onChange={handleNewsSourceChange} />
								</Stack>
							</Box>

						<Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
							{expanded ? (
								<EventsTable
									events={displayedEvents}
								isExpanded={expanded}
									loading={loading}
									error={error}
									timezone={selectedTimezone}
									onRefresh={handleRefresh}
									autoScrollToNextKey={autoScrollRequest || autoScrollToken}
									isFavoriteEvent={isFavorite}
									onToggleFavorite={handleToggleFavorite}
									isFavoritePending={isFavoritePending}
									favoritesLoading={favoritesLoading}
									hasEventNotes={hasNotes}
									onOpenNotes={handleOpenNotes}
									isEventNotesLoading={isEventNotesLoading}
								/>
							) : (
								<EventsTimeline2
									events={displayedEvents}
									contextEvents={contextEvents}
									loading={loading}
									timezone={selectedTimezone}
									onVisibleCountChange={setVisibleCount}
									autoScrollToNextKey={autoScrollRequest || autoScrollToken}
									searchQuery={filters.searchQuery}
									isFavoriteEvent={isFavorite}
									onToggleFavorite={handleToggleFavorite}
									isFavoritePending={isFavoritePending}
									favoritesLoading={favoritesLoading}
									hasEventNotes={hasNotes}
									onOpenNotes={handleOpenNotes}
									isEventNotesLoading={isEventNotesLoading}
								/>
							)}
						</Box>

						{!expanded && error && (
							<Box sx={{ borderTop: '1px solid', borderColor: alpha('#1e293b', 0.6), px: 1.5, py: 1 }}>
								<Alert severity="error" sx={{ my: 0 }}>
									{error}
								</Alert>
							</Box>
						)}
					</Paper>
				</Box>
			)}
		</Box>

		<EventNotesDialog
			open={Boolean(noteTarget)}
			onClose={handleCloseNotes}
			event={noteTarget?.event || null}
			timezone={selectedTimezone}
			notes={noteTarget ? getNotesForEvent(noteTarget.event) : []}
			loading={noteTarget ? isEventNotesLoading(noteTarget.event) : false}
			onAddNote={handleAddNote}
			onRemoveNote={handleRemoveNote}
			error={notesError}
		/>

		{/* Footer removed in compact (non-expanded) mode to maximize vertical space */}
	</Paper>
	</Slide>
);
}

EconomicEvents3.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	autoScrollRequest: PropTypes.oneOfType([
		PropTypes.object,
		PropTypes.number,
	]),
	onOpenAuth: PropTypes.func,
	onOpenSettings: PropTypes.func,
};
