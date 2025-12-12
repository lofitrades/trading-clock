/**
 * Firebase Cloud Functions for Time 2 Trade - Economic Events Calendar
 *
 * This module contains Cloud Functions for syncing economic events data
 * to the canonical collection (/economicEvents/events/events).
 *
 * Current Functions:
 * - syncWeekFromNfsScheduled: Hourly sync from NFS for weekly schedule (breadth)
 * - syncWeekFromNfsNow: Manual NFS weekly sync trigger
 * - syncTodayActualsFromJblanked: Daily sync from JBlanked for actual values (depth)
 * - syncTodayActualsFromJblankedNow: Manual JBlanked actuals sync trigger
 *
 * Architecture:
 * - NFS provides weekly schedule breadth (refreshed hourly)
 * - JBlanked provides actual values depth (daily after major releases)
 * - Both write to unified canonical collection
 *
 * @see https://nfs.faireconomy.media/
 * @see https://www.jblanked.com/news/api/docs/calendar/
 */

// Load environment variables from .env file (local development only)
import * as dotenv from "dotenv";
dotenv.config();

import * as admin from "firebase-admin";
import {setGlobalOptions} from "firebase-functions/v2";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {syncWeekFromNfs} from "./services/nfsSyncService";
import {syncTodayActualsFromJblankedAllConfigured} from "./services/jblankedActualsService";

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
 * Runs daily after major US releases to capture actual values.
 */
export const syncTodayActualsFromJblanked = onSchedule(
  {
    schedule: "0 22 * * *",
    timeZone: "America/New_York",
    timeoutSeconds: 300,
    memory: "256MiB",
  },
  async () => {
    await syncTodayActualsFromJblankedAllConfigured();
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
