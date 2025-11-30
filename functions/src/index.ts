/**
 * Firebase Cloud Functions for Time 2 Trade - Economic Events Calendar
 *
 * This module contains Cloud Functions for syncing economic events data
 * from the JBlanked News Calendar API to Firestore.
 *
 * Functions:
 * - syncEconomicEventsCalendarScheduled: Runs daily at 5 AM US/Eastern
 * - syncEconomicEventsCalendarNow: Manual trigger via HTTPS
 *
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
import {syncEconomicEventsCalendar} from "./services/syncEconomicEvents";
import {SyncOptions} from "./types/economicEvents";

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for cost control
// Max 10 instances per function to prevent unexpected scaling costs
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1", // Same region as Firestore
});

/**
 * Scheduled Cloud Function - Runs daily at 5:00 AM US/Eastern
 * Syncs 3-year window of economic events from JBlanked API to Firestore
 *
 * Schedule: Every day at 5:00 AM Eastern Time
 * Cost: ~1 API credit per day = ~365 credits per year
 *
 * To deploy:
 * firebase deploy --only functions:syncEconomicEventsCalendarScheduled
 */
export const syncEconomicEventsCalendarScheduled = onSchedule(
  {
    schedule: "0 5 * * *", // Cron: 5:00 AM
    timeZone: "America/New_York", // US/Eastern
    timeoutSeconds: 540, // 9 minutes (max for gen 1 is 540s)
    memory: "512MiB",
  },
  async (event) => {
    logger.info("🕐 Scheduled sync triggered", {
      scheduleTime: event.scheduleTime,
      jobName: event.jobName,
    });

    try {
      const result = await syncEconomicEventsCalendar(
        {
          dryRun: false, // Production run
        },
        "scheduled_function" // Track that this is an automated sync
      );

      logger.info("✅ Scheduled sync completed", result);
    } catch (error) {
      logger.error("❌ Scheduled sync failed", error);
      throw error; // Re-throw to mark function as failed in logs
    }
  }
);

/**
 * HTTPS Cloud Function - Manual trigger for testing and on-demand sync
 * Can be called from the UI or via HTTP request
 *
 * Query Parameters:
 * - dryRun: "true" | "false" (default: false) - If true, validates without writing
 * - from: "YYYY-MM-DD" (optional) - Override start date
 * - to: "YYYY-MM-DD" (optional) - Override end date
 *
 * Example URLs:
 * - Dry run (no Firestore writes): .../syncEconomicEventsCalendarNow?dryRun=true
 * - Production sync: .../syncEconomicEventsCalendarNow
 * - Custom date range: .../syncEconomicEventsCalendarNow?from=2025-01-01&to=2025-12-31
 *
 * To deploy:
 * firebase deploy --only functions:syncEconomicEventsCalendarNow
 */
export const syncEconomicEventsCalendarNow = onRequest(
  {
    cors: true, // Allow CORS for browser requests
    timeoutSeconds: 540, // 9 minutes
    memory: "512MiB",
  },
  async (req, res) => {
    logger.info("📡 Manual sync triggered", {
      method: req.method,
      query: req.query,
      ip: req.ip,
    });

    try {
      // Parse options from query parameters
      const options: SyncOptions = {
        dryRun: req.query.dryRun === "true",
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      };

      // Validate custom date range if provided
      if ((options.from && !options.to) || (!options.from && options.to)) {
        res.status(400).json({
          ok: false,
          error: "Both 'from' and 'to' parameters required for custom date range",
        });
        return;
      }

      logger.info("Starting manual sync", options);

      // Execute sync
      const result = await syncEconomicEventsCalendar(
        options,
        "manual_sync" // Track that this is a manual UI-triggered sync
      );

      // Return result
      if (result.success) {
        logger.info("✅ Manual sync completed", result);
        res.status(200).json({
          ok: true,
          ...result,
        });
      } else {
        logger.error("❌ Manual sync failed", result);
        res.status(500).json({
          ok: false,
          ...result,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ?
        error.message :
        "Unknown error";

      logger.error("❌ Manual sync error", {error: errorMessage});

      res.status(500).json({
        ok: false,
        error: errorMessage,
        success: false,
      });
    }
  }
);
