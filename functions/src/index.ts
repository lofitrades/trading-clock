/**
 * functions/src/index.ts
 *
 * Purpose: Cloud Functions entrypoint for Time 2 Trade economic events sync,
 * orchestrating scheduled breadth (NFS weekly) and depth (JBlanked actuals)
 * updates into the canonical economic events collection.
 *
 * Changelog:
 * v1.5.0 - 2026-01-23 - Add scheduled FCM push reminders for unified event reminders.
 * v1.4.0 - 2026-01-21 - Add callable email sender for custom reminder notifications.
 * v1.3.0 - 2026-01-21 - Add manual JBlanked Forex Factory range backfill endpoint.
 * v1.2.1 - 2026-01-16 - Enhanced uploadGptEvents: check custom claims + Firestore fallback with better error messaging.
 * v1.2.0 - 2026-01-16 - Added GPT uploader callable for canonical event seeding.
 * v1.1.0 - 2025-12-16 - Updated JBlanked actuals schedule to 11:59 AM ET daily.
 * v1.0.0 - 2025-12-11 - Initial functions entry with NFS + JBlanked sync flows.
 */

// Load environment variables from .env file (local development only)
import * as dotenv from "dotenv";
dotenv.config();

import * as admin from "firebase-admin";
import {setGlobalOptions} from "firebase-functions/v2";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onCall, onRequest, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {syncWeekFromNfs} from "./services/nfsSyncService";
import {syncTodayActualsFromJblankedAllConfigured} from "./services/jblankedActualsService";
import {syncJblankedForexFactorySince} from "./services/jblankedForexFactoryRangeService";
import {uploadGptEventsBatch} from "./services/gptUploadService";
import {sendCustomReminderEmail} from "./services/sendgridEmailService";
import {runFcmReminderScheduler} from "./services/fcmReminderScheduler";

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for cost control
// Max 10 instances per function to prevent unexpected scaling costs
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1", // Same region as Firestore
});

/**
 * Scheduled Cloud Function - NFS weekly schedule sync (breadth)
 * Runs hourly to keep the canonical schedule fresh.
 */
export const syncWeekFromNfsScheduled = onSchedule(
  {
    schedule: "every 60 minutes",
    timeZone: "America/New_York",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    await syncWeekFromNfs();
  }
);

/**
 * HTTPS Cloud Function - Manual NFS weekly sync
 * Useful for on-demand refresh from the drawer "Sync Week" action.
 */
export const syncWeekFromNfsNow = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async (req, res) => {
    logger.info("🔄 Manual NFS week sync triggered", {
      method: req.method,
      ip: req.ip,
    });

    try {
      await syncWeekFromNfs();
      res.status(200).json({
        ok: true,
        source: "nfs",
        scope: "current_week",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("❌ Manual NFS week sync failed", {error: errorMessage});
      res.status(500).json({
        ok: false,
        error: errorMessage,
      });
    }
  }
);

/**
 * Scheduled Cloud Function - JBlanked actuals patcher (depth)
 * Runs daily at 11:59 AM America/New_York to capture actual values.
 */
export const syncTodayActualsFromJblanked = onSchedule(
  {
    schedule: "59 11 * * *",
    timeZone: "America/New_York",
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async () => {
    await syncTodayActualsFromJblankedAllConfigured();
  }
);

/**
 * Scheduled Cloud Function - FCM push reminders
 * Runs every 5 minutes to deliver reminder notifications.
 */
export const sendFcmRemindersScheduled = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "America/New_York",
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async () => {
    await runFcmReminderScheduler();
  }
);

/**
 * HTTPS Cloud Function - Manual JBlanked actuals sync
 * Fetches today's actual values from all configured JBlanked sources
 * (ForexFactory, MQL5/MT, FXStreet)
 */
export const syncTodayActualsFromJblankedNow = onRequest(
  {
    cors: true,
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async (req, res) => {
    logger.info("🔄 Manual JBlanked actuals sync triggered", {
      method: req.method,
      ip: req.ip,
    });

    try {
      await syncTodayActualsFromJblankedAllConfigured();
      res.status(200).json({
        ok: true,
        source: "jblanked",
        scope: "today_actuals",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("❌ Manual JBlanked actuals sync failed", {error: errorMessage});
      res.status(500).json({
        ok: false,
        error: errorMessage,
      });
    }
  }
);

/**
 * HTTPS Cloud Function - Manual JBlanked Forex Factory range backfill
 * Fetches all events since 2026-01-01 and merges into canonical collection,
 * creating new events when no NFS match exists.
 */
export const syncForexFactorySince2026Now = onRequest(
  {
    cors: true,
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async (req, res) => {
    logger.info("🔄 Manual JBlanked FF range sync triggered", {
      method: req.method,
      ip: req.ip,
    });

    try {
      await syncJblankedForexFactorySince();
      res.status(200).json({
        ok: true,
        source: "jblanked-ff",
        scope: "since_2026_01_01",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("❌ Manual JBlanked FF range sync failed", {error: errorMessage});
      res.status(500).json({
        ok: false,
        error: errorMessage,
      });
    }
  }
);

/**
 * HTTPS Callable - GPT fallback event uploader (superadmin only)
 * Accepts JSON array of GPT events and merges into canonical collection.
 * Checks both Firebase custom claims (primary) and Firestore (fallback).
 */
export const uploadGptEvents = onCall(
  {
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const token = auth.token || {};
    const uid = auth.uid;
    let userData: any = null;
    
    // Check custom claims (primary - from ID token)
    let isSuperadmin = token.role === "superadmin" || token.superadmin === true;
    
    // Fallback: Check Firestore if custom claims not present
    if (!isSuperadmin) {
      try {
        const userDoc = await admin.firestore().collection('users').doc(uid).get();
        userData = userDoc.data();
        isSuperadmin = userData?.role === 'superadmin';
      } catch (error) {
        logger.warn("Failed to check Firestore role", { uid, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    if (!isSuperadmin) {
      const userRole = token.role || userData?.role || 'user';
      throw new HttpsError(
        "permission-denied", 
        `Superadmin role required. Current role: ${userRole}. User must sign out and back in after role update.`
      );
    }

    const events = request.data?.events;
    if (!Array.isArray(events)) {
      throw new HttpsError("invalid-argument", "events must be an array");
    }

    if (events.length > 1000) {
      throw new HttpsError("invalid-argument", "Batch too large (max 1000)");
    }

    const result = await uploadGptEventsBatch(events);
    logger.info("✅ GPT upload batch complete", result);
    return result;
  }
);

/**
 * HTTPS Callable - Send custom reminder email to the authenticated user.
 * Sends a transactional email via SendGrid using the user's verified email.
 */
export const sendCustomReminderEmailNow = onCall(
  {
    timeoutSeconds: 30,
    memory: "256MiB",
  },
  async (request) => {
    const auth = request.auth;
    if (!auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }

    const uid = auth.uid;
    const tokenEmail = auth.token?.email;

    let email = tokenEmail || null;
    if (!email) {
      try {
        const userRecord = await admin.auth().getUser(uid);
        email = userRecord.email || null;
      } catch (error) {
        logger.warn("Failed to resolve user email", { uid, error: error instanceof Error ? error.message : String(error) });
      }
    }

    if (!email) {
      throw new HttpsError("failed-precondition", "User email not available");
    }

    const data = request.data || {};
    const title = typeof data.title === "string" ? data.title.trim() : "";
    if (!title) {
      throw new HttpsError("invalid-argument", "title is required");
    }

    try {
      await sendCustomReminderEmail({
        to: email,
        title,
        description: typeof data.description === "string" ? data.description.trim() : undefined,
        localDate: typeof data.localDate === "string" ? data.localDate : undefined,
        localTime: typeof data.localTime === "string" ? data.localTime : undefined,
        timezone: typeof data.timezone === "string" ? data.timezone : undefined,
        minutesBefore: Number.isFinite(Number(data.minutesBefore)) ? Number(data.minutesBefore) : undefined,
      });
      return { ok: true };
    } catch (error) {
      logger.error("Failed to send reminder email", { uid, error: error instanceof Error ? error.message : String(error) });
      throw new HttpsError("internal", "Failed to send reminder email");
    }
  }
);

