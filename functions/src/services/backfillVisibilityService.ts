/**
 * functions/src/services/backfillVisibilityService.ts
 *
 * Purpose: One-time backfill service to add visibility field to existing systemActivityLog documents.
 * Used by Phase 7 superadmin tool to migrate existing logs without rewriting all backend services.
 *
 * Strategy:
 * - Batch query existing systemActivityLog documents
 * - Compute visibility per activity type using determineActivityVisibility()
 * - Batch update with new visibility field
 * - Idempotent: skips documents that already have visibility field
 *
 * Changelog:
 * v1.1.0 - 2026-02-10 - BEP audit fix: forEach → for..of, await batch.commit, create new batch after commit
 * v1.0.0 - 2026-02-09 - Phase 7: Initial backfill service
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { determineActivityVisibility } from "../utils/insightKeysUtils";

export interface BackfillResult {
  collection: string;
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

const ACTIVITY_COLLECTION = "systemActivityLog";
const BATCH_LIMIT = 400; // Firestore batch limit is 500

/**
 * Backfill visibility field on existing systemActivityLog documents
 */
export async function backfillActivityLogVisibility(): Promise<BackfillResult> {
  const result: BackfillResult = {
    collection: ACTIVITY_COLLECTION,
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    const db = admin.firestore();
    const snapshot = await db.collection(ACTIVITY_COLLECTION).get();
    
    logger.info(`[BackfillVisibility] Found ${snapshot.size} activity logs`);
    result.total = snapshot.size;

    if (snapshot.empty) {
      logger.info("[BackfillVisibility] No documents to backfill");
      return result;
    }

    let batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const activityType = data.type as string;

      // Skip if already has visibility field
      if (data.visibility) {
        result.skipped++;
        continue;
      }

      // Compute visibility for this activity type
      const visibility = determineActivityVisibility(activityType);

      // Queue update
      batch.update(doc.ref, { visibility });
      batchCount++;
      result.updated++;

      // Commit batch when limit reached and create new batch
      if (batchCount >= BATCH_LIMIT) {
        logger.info(`[BackfillVisibility] Committing batch of ${batchCount} updates`);
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    // Commit remaining updates
    if (batchCount > 0) {
      logger.info(`[BackfillVisibility] Committing final batch of ${batchCount} updates`);
      await batch.commit();
    }

    logger.info("[BackfillVisibility] Complete", {
      total: result.total,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
    });

    return result;
  } catch (error) {
    logger.error("[BackfillVisibility] Error during backfill", error);
    result.errors++;
    throw error;
  }
}

/**
 * Wrapper for calling backfillActivityLogVisibility
 */
export async function backfillAllVisibility(): Promise<{
  activityLog: BackfillResult;
}> {
  const activityLogResult = await backfillActivityLogVisibility();

  return {
    activityLog: activityLogResult,
  };
}
