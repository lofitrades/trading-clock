/**
 * src/components/EventNotesDialog.jsx
 * 
 * Purpose: Reusable dialog for viewing and editing per-event notes with real-time updates.
 * Provides mobile-first full-screen mode, note creation, and deletion with timezone-aware timestamps.
 * 
 * Changelog:
 * v1.0.3 - 2026-01-23 - BEP FIX: Increase dialog z-index to 12006 to ensure it renders above all AppBar shadows, popovers, and other overlays.
 * v1.0.2 - 2026-01-21 - Raise notes dialog z-index above EventModal.
 * v1.0.1 - 2026-01-16 - Prefer event time labels for all-day/tentative GPT placeholders.
 * v1.0.0 - 2025-12-12 - Initial implementation with responsive dialog, add/remove controls, and timestamp formatting.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
	Alert,
	AppBar,
	Box,
	Button,
	Dialog,
	DialogContent,
	Divider,
	IconButton,
	List,
	ListItem,
	ListItemText,
	Stack,
	TextField,
	Toolbar,
	Typography,
	useMediaQuery,
	useTheme,
} from '@mui/material';
import { BACKDROP_OVERLAY_SX } from '../constants/overlayStyles';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from '@mui/material/CircularProgress';
import { formatTime } from '../utils/dateUtils';

const formatDateTime = (value, timezone) => {
	if (!value) return 'Unknown time';
	const date = value.toDate ? value.toDate() : new Date(value);
	if (Number.isNaN(date.getTime())) return 'Unknown time';
	return date.toLocaleString(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: timezone,
	});
};

export default function EventNotesDialog({
	open,
	onClose,
	event,
	timezone,
	notes = [],
	loading = false,
	onAddNote,
	onRemoveNote,
	error = null,
}) {
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
	const [noteText, setNoteText] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [deletingId, setDeletingId] = useState(null);
	const [confirmNoteId, setConfirmNoteId] = useState(null);

	const eventName = event?.name || event?.Name || 'Selected Event';
	const eventCurrency = event?.currency || event?.Currency || null;
	const eventTimeLabel = useMemo(() => {
		if (!event) return '—';
		return event.timeLabel || formatTime(event.time || event.date, timezone);
	}, [event, timezone]);

	useEffect(() => {
		if (open) {
			setNoteText('');
			setDeletingId(null);
			setConfirmNoteId(null);
		}
	}, [event, open]);

	const handleSubmit = async () => {
		if (!noteText.trim() || !onAddNote || submitting) return;
		setSubmitting(true);
		const result = await onAddNote(noteText.trim());
		if (result?.success) {
			setNoteText('');
		}
		setSubmitting(false);
	};

	const handleRemove = async (noteId) => {
		if (!onRemoveNote || deletingId) return;
		if (confirmNoteId !== noteId) {
			setConfirmNoteId(noteId);
			return;
		}
		setDeletingId(noteId);
		await onRemoveNote(noteId);
		setDeletingId(null);
		setConfirmNoteId(null);
	};

	return (
		<Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth sx={{ zIndex: 12006 }} slotProps={{ backdrop: { sx: BACKDROP_OVERLAY_SX } }}>
			{fullScreen ? (
				<AppBar sx={{ position: 'relative' }} color="primary">
					<Toolbar>
						<IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
							<CloseIcon />
						</IconButton>
						<Typography sx={{ ml: 2, flex: 1, fontWeight: 800 }} variant="h6" component="div">
							Event Notes
						</Typography>
					</Toolbar>
				</AppBar>
			) : (
				<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 3 }}>
					<Stack direction="row" spacing={1} alignItems="center">
						<NoteAltIcon color="primary" />
						<Box>
							<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
								Event Notes
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{eventTimeLabel} {eventCurrency ? `• ${eventCurrency}` : ''}
							</Typography>
						</Box>
					</Stack>
					<IconButton onClick={onClose}>
						<CloseIcon />
					</IconButton>
				</Box>
			)}
			<DialogContent sx={{ pt: fullScreen ? 2 : 1, pb: { xs: 3, sm: 3 } }}>
				<Stack spacing={2.5}>
					<Box>
						<Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
							{eventName}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{eventTimeLabel} {eventCurrency ? `• ${eventCurrency}` : ''}
						</Typography>
					</Box>

					{error ? <Alert severity="error">{error}</Alert> : null}

					<Stack spacing={1.25}>
						<TextField
							label="Add a note"
							placeholder="What do you want to remember for this event?"
							fullWidth
							multiline
							minRows={3}
							value={noteText}
							onChange={(e) => setNoteText(e.target.value)}
							disabled={submitting}
						/>
						<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
							<Button
								variant="contained"
								endIcon={submitting ? <CircularProgress size={16} thickness={5} color="inherit" /> : <SendIcon />}
								onClick={handleSubmit}
								disabled={submitting || !noteText.trim()}
								sx={{ textTransform: 'none', fontWeight: 700 }}
							>
								Save Note
							</Button>
						</Box>
					</Stack>

					<Divider />

					<Box>
						<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
							<NoteAltIcon fontSize="small" />
							<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
								Notes ({notes.length})
							</Typography>
						</Stack>
						{loading ? (
							<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
								<CircularProgress size={32} thickness={5} />
							</Box>
						) : notes.length === 0 ? (
							<Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
								<Typography variant="body2" color="text.secondary">
									No notes yet. Start by adding one above.
								</Typography>
							</Box>
						) : (
							<List dense disablePadding>
								{notes.map((note) => (
									<React.Fragment key={note.id}>
										<ListItem
											alignItems="flex-start"
											secondaryAction={
												<Stack direction="row" spacing={0.75} alignItems="center">
													{confirmNoteId === note.id && (
														<Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>
															Confirm
														</Typography>
													)}
													{confirmNoteId === note.id && (
														<IconButton
															edge="end"
															aria-label="cancel delete"
															onClick={() => setConfirmNoteId(null)}
															size="small"
														>
															<CloseIcon fontSize="small" />
														</IconButton>
													)}
													<IconButton
														edge="end"
														aria-label="delete"
														onClick={() => handleRemove(note.id)}
														disabled={deletingId === note.id}
														sx={{ color: confirmNoteId === note.id ? 'error.main' : 'inherit' }}
													>
														{deletingId === note.id ? <CircularProgress size={18} thickness={5} /> : <DeleteIcon />}
													</IconButton>
												</Stack>
											}
										>
											<ListItemText
												primary={
													<Typography variant="body2" sx={{ fontWeight: 700 }}>
														{formatDateTime(note.createdAt, timezone)}
													</Typography>
												}
												secondary={
													<Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
														{note.content}
													</Typography>
												}
											/>
										</ListItem>
										<Divider component="li" />
									</React.Fragment>
								))}
							</List>
						)}
					</Box>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
