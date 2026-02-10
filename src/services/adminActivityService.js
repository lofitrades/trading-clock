/**
 * src/services/adminActivityService.js
 *
 * Purpose: Service for logging and fetching admin activity feed.
 * Persists system events (reschedules, cancellations, syncs) to Firestore
 * and queries existing data for dashboard insights.
 *
 * Changelog:
 * v1.0.1 - 2026-02-08 - BEP FIX: Fixed Firestore collection path for economicEvents (use doc() → collection()
 *                       pattern). Added missing ACTIVITY_TYPES (BLOG_CREATED, BLOG_DELETED, EVENT_CREATED,
 *                       EVENT_DELETED, EVENT_UPDATED) exported by AdminDashboardPage. Resolves undefined
 *                       reference errors when navigating to /admin from UserAvatar.
 * v1.0.0 - 2026-02-05 - Initial implementation with activity logging and stats fetching.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  getCountFromServer,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';

// Activity types for the system log
export const ACTIVITY_TYPES = {
  EVENT_RESCHEDULED: 'event_rescheduled',
  EVENT_CANCELLED: 'event_cancelled',
  EVENT_REINSTATED: 'event_reinstated',
  EVENT_CREATED: 'event_created',
  EVENT_DELETED: 'event_deleted',
  EVENT_UPDATED: 'event_updated',
  SYNC_COMPLETED: 'sync_completed',
  SYNC_FAILED: 'sync_failed',
  BLOG_PUBLISHED: 'blog_published',
  BLOG_UPDATED: 'blog_updated',
  BLOG_CREATED: 'blog_created',
  BLOG_DELETED: 'blog_deleted',
  USER_SIGNUP: 'user_signup',
  GPT_UPLOAD: 'gpt_upload',
};

const ACTIVITY_COLLECTION = 'systemActivityLog';

/**
 * Log a system activity event
 */
export async function logActivity({
  type,
  title,
  description,
  metadata = {},
  severity = 'info', // 'info' | 'warning' | 'error' | 'success'
}) {
  try {
    await addDoc(collection(db, ACTIVITY_COLLECTION), {
      type,
      title,
      description,
      metadata,
      severity,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

/**
 * Fetch recent activity feed
 */
export async function fetchRecentActivity(limitCount = 20) {
  try {
    const q = query(
      collection(db, ACTIVITY_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    return [];
  }
}

/**
 * Get date range boundaries
 */
function getDateRange(period) {
  const now = new Date();
  let startDate;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
    default:
      startDate = new Date(0); // Beginning of time
      break;
  }

  return {
    start: Timestamp.fromDate(startDate),
    end: Timestamp.fromDate(now),
  };
}

/**
 * Fetch blog post statistics
 */
export async function fetchBlogStats(period = '30d') {
  try {
    const postsCollection = collection(db, 'blogPosts');
    const { start } = getDateRange(period);

    // Total posts
    const totalSnapshot = await getCountFromServer(postsCollection);
    const total = totalSnapshot.data().count;

    // Published posts
    const publishedQuery = query(postsCollection, where('status', '==', 'published'));
    const publishedSnapshot = await getCountFromServer(publishedQuery);
    const published = publishedSnapshot.data().count;

    // Draft posts
    const draftQuery = query(postsCollection, where('status', '==', 'draft'));
    const draftSnapshot = await getCountFromServer(draftQuery);
    const drafts = draftSnapshot.data().count;

    // Scheduled posts
    const scheduledQuery = query(postsCollection, where('status', '==', 'scheduled'));
    const scheduledSnapshot = await getCountFromServer(scheduledQuery);
    const scheduled = scheduledSnapshot.data().count;

    // Recent posts (in period)
    const recentQuery = query(
      postsCollection,
      where('createdAt', '>=', start),
      orderBy('createdAt', 'desc')
    );
    const recentSnapshot = await getDocs(recentQuery);
    const recentCount = recentSnapshot.size;

    return {
      total,
      published,
      drafts,
      scheduled,
      recentCount,
    };
  } catch (error) {
    console.error('Failed to fetch blog stats:', error);
    return { total: 0, published: 0, drafts: 0, scheduled: 0, recentCount: 0 };
  }
}

/**
 * Fetch economic events statistics
 */
export async function fetchEventStats(period = '30d') {
  try {
    // Correct path: /economicEvents/events/events (doc → collection)
    const rootDoc = doc(collection(db, 'economicEvents'), 'events');
    const eventsCollection = collection(rootDoc, 'events');

    // Total events
    const totalSnapshot = await getCountFromServer(eventsCollection);
    const total = totalSnapshot.data().count;

    // Cancelled events
    const cancelledQuery = query(eventsCollection, where('status', '==', 'cancelled'));
    const cancelledSnapshot = await getCountFromServer(cancelledQuery);
    const cancelled = cancelledSnapshot.data().count;

    // Events with reschedule data (have rescheduledFrom field)
    // Note: Firestore doesn't support "field exists" queries well, so we query where rescheduledFrom != null
    // This is a workaround - in production you might want to add an explicit "wasRescheduled" boolean field
    const rescheduledQuery = query(
      eventsCollection,
      where('rescheduledFrom', '!=', null),
      limit(500)
    );
    const rescheduledSnapshot = await getDocs(rescheduledQuery);
    const rescheduled = rescheduledSnapshot.size;

    // This week's events
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const thisWeekQuery = query(
      eventsCollection,
      where('datetimeUtc', '>=', Timestamp.fromDate(weekStart)),
      where('datetimeUtc', '<', Timestamp.fromDate(weekEnd))
    );
    const thisWeekSnapshot = await getDocs(thisWeekQuery);
    const thisWeek = thisWeekSnapshot.size;

    return {
      total,
      cancelled,
      rescheduled,
      thisWeek,
    };
  } catch (error) {
    console.error('Failed to fetch event stats:', error);
    return { total: 0, cancelled: 0, rescheduled: 0, thisWeek: 0 };
  }
}

/**
 * Fetch user statistics
 */
export async function fetchUserStats(period = '30d') {
  try {
    const usersCollection = collection(db, 'users');
    const { start } = getDateRange(period);

    // Total users
    const totalSnapshot = await getCountFromServer(usersCollection);
    const total = totalSnapshot.data().count;

    // New users in period
    const newUsersQuery = query(
      usersCollection,
      where('createdAt', '>=', start),
      orderBy('createdAt', 'desc')
    );
    const newUsersSnapshot = await getDocs(newUsersQuery);
    const newUsers = newUsersSnapshot.size;

    // Users with settings (engaged users)
    const engagedQuery = query(usersCollection, where('settings', '!=', null), limit(1000));
    const engagedSnapshot = await getDocs(engagedQuery);
    const engaged = engagedSnapshot.size;

    return {
      total,
      newUsers,
      engaged,
    };
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    return { total: 0, newUsers: 0, engaged: 0 };
  }
}

/**
 * Fetch all dashboard stats at once
 */
export async function fetchDashboardStats(period = '30d') {
  const [blogStats, eventStats, userStats] = await Promise.all([
    fetchBlogStats(period),
    fetchEventStats(period),
    fetchUserStats(period),
  ]);

  return {
    blog: blogStats,
    events: eventStats,
    users: userStats,
  };
}

/**
 * Fetch activity filtered by type
 */
export async function fetchActivityByType(type, limitCount = 10) {
  try {
    const q = query(
      collection(db, ACTIVITY_COLLECTION),
      where('type', '==', type),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    }));
  } catch (error) {
    console.error('Failed to fetch activity by type:', error);
    return [];
  }
}
