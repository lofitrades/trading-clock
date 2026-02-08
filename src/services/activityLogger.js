/**
 * src/services/activityLogger.js
 *
 * Purpose: Frontend activity logging service for admin audit trail.
 * Logs user actions (blog creation, custom events, settings, etc.) to systemActivityLog.
 * Mirrors backend activityLoggingService but uses Firestore client SDK.
 *
 * Deduplication Strategy (v1.1.0):
 * - Uses deterministic document IDs: {type}_{date}_{dedupeKey}
 * - Prevents duplicate logs from browser refreshes or retries
 * - One log per type+key per day
 *
 * Usage:
 * import { logActivity, ACTIVITY_TYPES } from '../services/activityLogger';
 * await logActivity({
 *   type: ACTIVITY_TYPES.BLOG_PUBLISHED,
 *   title: 'Blog post published',
 *   description: 'Post title published in en, es, fr',
 *   severity: 'success',
 *   metadata: { postId, postTitle, languages, authorId },
 *   dedupeKey: postId, // Optional: Ensures one log per post per day
 * });
 *
 * Changelog:
 * v1.4.0 - 2026-02-06 - Added logGptReschedules() and logGptReinstate() for logging reschedule/reinstate events detected during GPT uploads.
 * v1.3.0 - 2026-02-05 - Added admin action logging functions for CRUD operations: canonical_event_updated, event_description_created/updated/deleted, blog_author_created/updated/deleted, events_exported (Phase 8.0).
 * v1.2.0 - 2026-02-05 - Added logEventUpdated() function for custom event edits with deduplication.
 * v1.1.0 - 2026-02-05 - Added deduplication with deterministic document IDs.
 */

import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';

// Activity type constants (mirrors backend ACTIVITY_TYPES)
export const ACTIVITY_TYPES = {
  EVENT_RESCHEDULED: 'event_rescheduled',
  EVENT_CANCELLED: 'event_cancelled',
  EVENT_REINSTATED: 'event_reinstated',
  EVENT_CREATED: 'event_created',
  EVENT_DELETED: 'event_deleted',
  EVENT_UPDATED: 'event_updated',
  SYNC_COMPLETED: 'sync_completed',
  SYNC_FAILED: 'sync_failed',
  BLOG_CREATED: 'blog_created',
  BLOG_PUBLISHED: 'blog_published',
  BLOG_UPDATED: 'blog_updated',
  BLOG_DELETED: 'blog_deleted',
  USER_SIGNUP: 'user_signup',
  GPT_UPLOAD: 'gpt_upload',
  SETTINGS_CHANGED: 'settings_changed',
  CANONICAL_EVENT_UPDATED: 'canonical_event_updated',
  EVENT_DESCRIPTION_CREATED: 'event_description_created',
  EVENT_DESCRIPTION_UPDATED: 'event_description_updated',
  EVENT_DESCRIPTION_DELETED: 'event_description_deleted',
  BLOG_AUTHOR_CREATED: 'blog_author_created',
  BLOG_AUTHOR_UPDATED: 'blog_author_updated',
  BLOG_AUTHOR_DELETED: 'blog_author_deleted',
  EVENTS_EXPORTED: 'events_exported',
};

const ACTIVITY_COLLECTION = 'systemActivityLog';

/**
 * Generate a deterministic document ID for deduplication
 * Format: {type}_{date}_{dedupeKey}
 */
function generateActivityId(type, dedupeKey) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  if (dedupeKey) {
    // Sanitize dedupeKey to be a valid Firestore document ID
    const sanitizedKey = String(dedupeKey).replace(/[/\s.#$[\]]/g, '_').substring(0, 50);
    return `${type}_${today}_${sanitizedKey}`;
  }
  // Default: one activity per type per day
  return `${type}_${today}`;
}

/**
 * Log a user activity to Firestore
 * @param {Object} options
 * @param {string} options.type - Activity type (from ACTIVITY_TYPES)
 * @param {string} options.title - Human-readable title
 * @param {string} options.description - Detailed description
 * @param {string} [options.severity='info'] - 'info' | 'warning' | 'error' | 'success'
 * @param {Object} [options.metadata={}] - Additional context data
 * @param {string} [options.dedupeKey] - Optional key for deduplication (e.g., postId, eventId)
 * @returns {Promise<string|null>} - Document ID if successful, null if failed
 */
export async function logActivity({
  type,
  title,
  description,
  severity = 'info',
  metadata = {},
  dedupeKey,
}) {
  try {
    const user = auth.currentUser;
    const userContext = user ? {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Unknown',
    } : {
      uid: 'anonymous',
      email: 'anonymous',
      displayName: 'Anonymous',
    };

    const activityData = {
      type,
      title,
      description,
      severity,
      metadata,
      source: 'frontend', // Distinguish from backend logs
      user: userContext,
      createdAt: serverTimestamp(),
    };

    // Use deterministic ID to prevent duplicates
    const docId = generateActivityId(type, dedupeKey);
    await setDoc(doc(db, ACTIVITY_COLLECTION, docId), activityData);
    console.log(`✅ Activity logged: ${type}`, { title, severity, docId });
    return docId;
  } catch (error) {
    console.error('❌ Failed to log activity:', error);
    // Silently fail - don't break main functionality
    return null;
  }
}

/**
 * Log custom event creation
 * Dedupe by eventName + currency
 */
export async function logEventCreated(
  eventName,
  currency,
  scheduledFor,
  userId
) {
  await logActivity({
    type: ACTIVITY_TYPES.EVENT_CREATED,
    title: `Custom event created: ${eventName}`,
    description: `User created custom event "${eventName}" (${currency}) scheduled for ${scheduledFor}`,
    severity: 'info',
    metadata: { eventName, currency, scheduledFor, userId },
    dedupeKey: `${eventName}_${currency}`,
  });
}

/**
 * Log custom event deletion
 * Dedupe by eventName + currency
 */
export async function logEventDeleted(
  eventName,
  currency,
  userId
) {
  await logActivity({
    type: ACTIVITY_TYPES.EVENT_DELETED,
    title: `Custom event deleted: ${eventName}`,
    description: `User deleted custom event "${eventName}" (${currency})`,
    severity: 'warning',
    metadata: { eventName, currency, userId },
    dedupeKey: `${eventName}_${currency}`,
  });
}

/**
 * Log custom event update
 * Dedupe by eventName + currency
 */
export async function logEventUpdated(
  eventName,
  currency,
  userId
) {
  await logActivity({
    type: ACTIVITY_TYPES.EVENT_UPDATED,
    title: `Custom event updated: ${eventName}`,
    description: `User updated custom event "${eventName}" (${currency})`,
    severity: 'info',
    metadata: { eventName, currency, userId },
    dedupeKey: `${eventName}_${currency}`,
  });
}

/**
 * Log blog post creation
 * Dedupe by postId
 */
export async function logBlogCreated(
  postTitle,
  postId,
  authorId,
  languages = []
) {
  await logActivity({
    type: ACTIVITY_TYPES.BLOG_CREATED,
    title: 'Blog post created',
    description: `New draft created: "${postTitle}"`,
    severity: 'info',
    metadata: { postId, postTitle, authorId, languages },
    dedupeKey: postId,
  });
}

/**
 * Log blog post publication
 * Dedupe by postId
 */
export async function logBlogPublished(
  postTitle,
  postId,
  authorId,
  languages = []
) {
  await logActivity({
    type: ACTIVITY_TYPES.BLOG_PUBLISHED,
    title: 'Blog post published',
    description: `"${postTitle}" published in ${languages.length > 0 ? languages.join(', ') : 'default language'}`,
    severity: 'success',
    metadata: { postId, postTitle, authorId, languages },
    dedupeKey: postId,
  });
}

/**
 * Log blog post update
 * Dedupe by postId
 */
export async function logBlogUpdated(
  postTitle,
  postId,
  authorId,
  languages = []
) {
  await logActivity({
    type: ACTIVITY_TYPES.BLOG_UPDATED,
    title: 'Blog post updated',
    description: `"${postTitle}" updated`,
    severity: 'info',
    metadata: { postId, postTitle, authorId, languages },
    dedupeKey: postId,
  });
}

/**
 * Log blog post deletion
 * Dedupe by postId
 */
export async function logBlogDeleted(
  postTitle,
  postId,
  authorId
) {
  await logActivity({
    type: ACTIVITY_TYPES.BLOG_DELETED,
    title: 'Blog post deleted',
    description: `"${postTitle}" was permanently deleted`,
    severity: 'warning',
    metadata: { postId, postTitle, authorId },
    dedupeKey: postId,
  });
}

/**
 * Log GPT event upload
 * Dedupe by source (one upload per source per day)
 */
export async function logGptUpload(
  eventNames,
  eventCount,
  source = 'GPT'
) {
  await logActivity({
    type: ACTIVITY_TYPES.GPT_UPLOAD,
    title: `${eventCount} events uploaded via ${source}`,
    description: `Uploaded events: ${Array.isArray(eventNames) ? eventNames.slice(0, 3).join(', ') : eventNames}${eventCount > 3 ? '...' : ''}`,
    severity: 'success',
    metadata: { eventNames: Array.isArray(eventNames) ? eventNames : [eventNames], eventCount, source },
    dedupeKey: source,
  });
}

/**
 * Log settings change
 * Dedupe by setting name
 */
export async function logSettingsChanged(
  setting,
  oldValue,
  newValue,
  category = 'general'
) {
  await logActivity({
    type: ACTIVITY_TYPES.SETTINGS_CHANGED,
    title: `Settings updated: ${setting}`,
    description: `${category} setting "${setting}" changed`,
    severity: 'info',
    metadata: { setting, category, oldValue, newValue },
    dedupeKey: `${category}_${setting}`,
  });
}

/**
 * Log user signup (called from frontend when user registers)
 * Dedupe by userId
 */
export async function logUserSignup(
  userId,
  email,
  source = 'magic_link'
) {
  await logActivity({
    type: ACTIVITY_TYPES.USER_SIGNUP,
    title: 'New user registered',
    description: `User registered via ${source}`,
    severity: 'success',
    metadata: { userId, email, source },
    dedupeKey: userId,
  });
}

/**
 * Log canonical event update (admin edits event)
 * Dedupe by eventId
 */
export async function logCanonicalEventUpdated(
  eventId,
  eventName,
  fieldsChanged,
  userId
) {
  const fieldList = Array.isArray(fieldsChanged) ? fieldsChanged.join(', ') : fieldsChanged;
  await logActivity({
    type: ACTIVITY_TYPES.CANONICAL_EVENT_UPDATED,
    title: `Event updated: ${eventName}`,
    description: `Admin updated fields: ${fieldList}`,
    severity: 'info',
    metadata: { eventId, eventName, fieldsChanged: Array.isArray(fieldsChanged) ? fieldsChanged : [fieldsChanged], userId },
    dedupeKey: eventId,
  });
}

/**
 * Log event description created
 * Dedupe by descriptionId
 */
export async function logEventDescriptionCreated(
  descriptionId,
  eventName,
  userId
) {
  await logActivity({
    type: ACTIVITY_TYPES.EVENT_DESCRIPTION_CREATED,
    title: `Description created: ${eventName}`,
    description: `Admin created event description for "${eventName}"`,
    severity: 'success',
    metadata: { descriptionId, eventName, userId },
    dedupeKey: descriptionId,
  });
}

/**
 * Log event description update
 * Dedupe by descriptionId
 */
export async function logEventDescriptionUpdated(
  descriptionId,
  eventName,
  fieldsChanged,
  userId
) {
  const fieldList = Array.isArray(fieldsChanged) ? fieldsChanged.join(', ') : fieldsChanged;
  await logActivity({
    type: ACTIVITY_TYPES.EVENT_DESCRIPTION_UPDATED,
    title: `Description updated: ${eventName}`,
    description: `Admin updated fields: ${fieldList}`,
    severity: 'info',
    metadata: { descriptionId, eventName, fieldsChanged: Array.isArray(fieldsChanged) ? fieldsChanged : [fieldsChanged], userId },
    dedupeKey: descriptionId,
  });
}

/**
 * Log event description deletion
 * Dedupe by eventName
 */
export async function logEventDescriptionDeleted(
  descriptionId,
  eventName,
  userId
) {
  await logActivity({
    type: ACTIVITY_TYPES.EVENT_DESCRIPTION_DELETED,
    title: `Description deleted: ${eventName}`,
    description: `Admin deleted event description for "${eventName}"`,
    severity: 'warning',
    metadata: { descriptionId, eventName, userId },
    dedupeKey: eventName,
  });
}

/**
 * Log blog author creation
 * Dedupe by authorId
 */
export async function logBlogAuthorCreated(
  authorId,
  displayName,
  userId
) {
  await logActivity({
    type: ACTIVITY_TYPES.BLOG_AUTHOR_CREATED,
    title: `Author created: ${displayName}`,
    description: `Admin created author profile for "${displayName}"`,
    severity: 'success',
    metadata: { authorId, displayName, userId },
    dedupeKey: authorId,
  });
}

/**
 * Log blog author update
 * Dedupe by authorId
 */
export async function logBlogAuthorUpdated(
  authorId,
  displayName,
  fieldsChanged,
  userId
) {
  const fieldList = Array.isArray(fieldsChanged) ? fieldsChanged.join(', ') : fieldsChanged;
  await logActivity({
    type: ACTIVITY_TYPES.BLOG_AUTHOR_UPDATED,
    title: `Author updated: ${displayName}`,
    description: `Admin updated fields: ${fieldList}`,
    severity: 'info',
    metadata: { authorId, displayName, fieldsChanged: Array.isArray(fieldsChanged) ? fieldsChanged : [fieldsChanged], userId },
    dedupeKey: authorId,
  });
}

/**
 * Log blog author deletion
 * Dedupe by displayName
 */
export async function logBlogAuthorDeleted(
  authorId,
  displayName,
  userId
) {
  await logActivity({
    type: ACTIVITY_TYPES.BLOG_AUTHOR_DELETED,
    title: `Author deleted: ${displayName}`,
    description: `Admin deleted author profile for "${displayName}"`,
    severity: 'warning',
    metadata: { authorId, displayName, userId },
    dedupeKey: displayName,
  });
}

/**
 * Log events export
 * Dedupe by export date
 */
export async function logEventsExported(
  eventCount,
  userId
) {
  await logActivity({
    type: ACTIVITY_TYPES.EVENTS_EXPORTED,
    title: `Events exported: ${eventCount} events`,
    description: `Superadmin exported ${eventCount} canonical events to JSON`,
    severity: 'success',
    metadata: { eventCount, userId },
    dedupeKey: 'events_export',
  });
}

/**
 * Log GPT reschedule events detected
 * Tracks when GPT upload detects rescheduled events
 */
export async function logGptReschedules(
  count,
  eventNames = []
) {
  if (count === 0) return;
  await logActivity({
    type: ACTIVITY_TYPES.EVENT_RESCHEDULED,
    title: `${count} event(s) rescheduled via GPT upload`,
    description: `Rescheduled events: ${eventNames.slice(0, 3).join(', ')}${count > 3 ? '...' : ''}`,
    severity: 'info',
    metadata: { count, eventNames, source: 'GPT' },
    dedupeKey: 'gpt_reschedule',
  });
}

/**
 * Log GPT reinstate events detected
 * Tracks when GPT upload reinstates cancelled events
 */
export async function logGptReinstate(
  count,
  eventNames = []
) {
  if (count === 0) return;
  await logActivity({
    type: ACTIVITY_TYPES.EVENT_REINSTATED,
    title: `${count} cancelled event(s) reinstated via GPT upload`,
    description: `Reinstated events: ${eventNames.slice(0, 3).join(', ')}${count > 3 ? '...' : ''}`,
    severity: 'success',
    metadata: { count, eventNames, source: 'GPT' },
    dedupeKey: 'gpt_reinstate',
  });
}

