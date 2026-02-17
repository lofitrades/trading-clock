/**
 * functions/src/services/backfillInsightKeysService.ts
 *
 * Purpose: One-time backfill service to add insightKeys + visibility to existing
 * Firestore documents (blogPosts, systemActivityLog, users/{uid}/eventNotes).
 * Designed for idempotent execution — safe to re-run without duplicating data.
 *
 * Changelog:
 * v1.0.0 - 2026-02-09 - Phase 2: Initial backfill implementation
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  computeBlogInsightKeys,
  computeActivityInsightKeys,
  computeNoteInsightKeys,
  determineActivityVisibility,
} from "../utils/insightKeysUtils";

const BATCH_LIMIT = 400; // Firestore batch limit is 500, leave margin

interface BackfillResult {
  collection: string;
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Backfill insightKeys for all blogPosts
 */
export async function backfillBlogPostsInsightKeys(): Promise<BackfillResult> {
  const db = admin.firestore();
  const result: BackfillResult = {
    collection: "blogPosts",
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const snapshot = await db.collection("blogPosts").get();
  result.total = snapshot.size;
  logger.info(`[BackfillBlog] Found ${result.total} blog posts to process`);

  let batch = db.batch();
  let batchCount = 0;

  for (const docSnap of snapshot.docs) {
    try {
      const data = docSnap.data();

      // Compute insightKeys
      const insightKeys = computeBlogInsightKeys({
        id: docSnap.id,
        eventTags: data.eventTags || [],
        currencyTags: data.currencyTags || [],
      });

      // Skip if already has identical insightKeys (idempotent)
      const existing = data.insightKeys || [];
      if (
        existing.length === insightKeys.length &&
        existing.every((k: string) => insightKeys.includes(k))
      ) {
        result.skipped++;
        continue;
      }

      batch.update(docSnap.ref, {insightKeys});
      batchCount++;
      result.updated++;

      // Commit batch when approaching limit
      if (batchCount >= BATCH_LIMIT) {
        await batch.commit();
        logger.info(`[BackfillBlog] Committed batch of ${batchCount}`);
        batch = db.batch();
        batchCount = 0;
      }
    } catch (error) {
      result.errors++;
      logger.error(`[BackfillBlog] Error processing ${docSnap.id}:`, error);
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    logger.info(`[BackfillBlog] Committed final batch of ${batchCount}`);
  }

  logger.info("[BackfillBlog] Complete:", result);
  return result;
}

/**
 * Backfill insightKeys + visibility for all systemActivityLog entries
 */
export async function backfillActivityLogInsightKeys(): Promise<BackfillResult> {
  const db = admin.firestore();
  const result: BackfillResult = {
    collection: "systemActivityLog",
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const snapshot = await db.collection("systemActivityLog").get();
  result.total = snapshot.size;
  logger.info(`[BackfillActivity] Found ${result.total} activity logs to process`);

  let batch = db.batch();
  let batchCount = 0;

  for (const docSnap of snapshot.docs) {
    try {
      const data = docSnap.data();
      const type = data.type || "";
      const metadata = data.metadata || {};

      // Compute insightKeys and visibility
      const insightKeys = computeActivityInsightKeys(type, metadata);
      const visibility = determineActivityVisibility(type);

      // Skip if already has identical fields (idempotent)
      const existingKeys = data.insightKeys || [];
      const existingVis = data.visibility;
      if (
        existingVis === visibility &&
        existingKeys.length === insightKeys.length &&
        existingKeys.every((k: string) => insightKeys.includes(k))
      ) {
        result.skipped++;
        continue;
      }

      batch.update(docSnap.ref, {insightKeys, visibility});
      batchCount++;
      result.updated++;

      if (batchCount >= BATCH_LIMIT) {
        await batch.commit();
        logger.info(`[BackfillActivity] Committed batch of ${batchCount}`);
        batch = db.batch();
        batchCount = 0;
      }
    } catch (error) {
      result.errors++;
      logger.error(`[BackfillActivity] Error processing ${docSnap.id}:`, error);
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    logger.info(`[BackfillActivity] Committed final batch of ${batchCount}`);
  }

  logger.info("[BackfillActivity] Complete:", result);
  return result;
}

/**
 * Backfill insightKeys for all users' eventNotes
 * Iterates users → eventNotes subcollection
 */
export async function backfillEventNotesInsightKeys(): Promise<BackfillResult> {
  const db = admin.firestore();
  const result: BackfillResult = {
    collection: "users/*/eventNotes",
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  // Get all users who have eventNotes
  const usersSnapshot = await db.collection("users").get();
  logger.info(`[BackfillNotes] Scanning ${usersSnapshot.size} users for eventNotes`);

  for (const userDoc of usersSnapshot.docs) {
    const notesSnapshot = await db
      .collection("users")
      .doc(userDoc.id)
      .collection("eventNotes")
      .get();

    if (notesSnapshot.empty) continue;

    let batch = db.batch();
    let batchCount = 0;

    for (const noteDoc of notesSnapshot.docs) {
      try {
        result.total++;
        const data = noteDoc.data();

        // Compute insightKeys from note summary fields
        const insightKeys = computeNoteInsightKeys({
          primaryNameKey: data.nameKey || null,
          currencyKey: data.currencyKey || null,
          dateKey: data.dateKey || null,
        });

        // Skip if already has identical insightKeys (idempotent)
        const existing = data.insightKeys || [];
        if (
          existing.length === insightKeys.length &&
          existing.every((k: string) => insightKeys.includes(k))
        ) {
          result.skipped++;
          continue;
        }

        batch.update(noteDoc.ref, {insightKeys});
        batchCount++;
        result.updated++;

        if (batchCount >= BATCH_LIMIT) {
          await batch.commit();
          logger.info(`[BackfillNotes] Committed batch of ${batchCount} for user ${userDoc.id}`);
          batch = db.batch();
          batchCount = 0;
        }
      } catch (error) {
        result.errors++;
        logger.error(`[BackfillNotes] Error processing ${noteDoc.id} for user ${userDoc.id}:`, error);
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
  }

  logger.info("[BackfillNotes] Complete:", result);
  return result;
}

/**
 * Run all backfill operations in sequence
 */
export async function backfillAllInsightKeys(): Promise<{
  blogPosts: BackfillResult;
  activityLog: BackfillResult;
  eventNotes: BackfillResult;
}> {
  logger.info("[BackfillAll] Starting full insightKeys backfill...");

  const blogPosts = await backfillBlogPostsInsightKeys();
  const activityLog = await backfillActivityLogInsightKeys();
  const eventNotes = await backfillEventNotesInsightKeys();

  logger.info("[BackfillAll] All backfills complete", {
    blogPosts,
    activityLog,
    eventNotes,
  });

  return {blogPosts, activityLog, eventNotes};
}
