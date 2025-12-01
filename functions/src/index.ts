/**
 * Firebase Cloud Functions for Time 2 Trade - Economic Events Calendar
 *
 * This module contains Cloud Functions for syncing economic events data
 * from the JBlanked News Calendar API to Firestore.
 *
 * Functions:
 * - syncHistoricalEvents: One-time bulk sync (2 years back, 1 year forward) - Admin only
 * - syncRecentEventsScheduled: Daily 5 AM ET - Updates last week, this week, next week
 * - syncRecentEventsNow: Manual trigger for recent events - Admin only
 *
 * Architecture:
 * - Historical Sync: Large initial load, rarely triggered
 * - Recent Sync: Daily updates for accuracy on close-range events
 * - Manual Triggers: On-demand with source selection
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
import {
  syncEconomicEventsCalendar,
  getHistoricalDateRange,
  getRecentDateRange,
} from "./services/syncEconomicEvents";
import {SyncOptions, NewsSource} from "./types/economicEvents";

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
 * Supports multi-source sync by accepting sources array in request body
 *
 * Query Parameters:
 * - dryRun: "true" | "false" (default: false) - If true, validates without writing
 * - from: "YYYY-MM-DD" (optional) - Override start date
 * - to: "YYYY-MM-DD" (optional) - Override end date
 * 
 * Request Body (JSON):
 * - sources: string[] (optional) - Array of sources to sync (e.g., ["mql5", "forex-factory"])
 *   If not provided, syncs default source only
 *
 * Example URLs:
 * - Dry run (no Firestore writes): .../syncEconomicEventsCalendarNow?dryRun=true
 * - Production sync: .../syncEconomicEventsCalendarNow
 * - Custom date range: .../syncEconomicEventsCalendarNow?from=2025-01-01&to=2025-12-31
 * 
 * Example Request Body:
 * POST .../syncEconomicEventsCalendarNow
 * { "sources": ["mql5", "forex-factory"] }
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
      // Parse sources from request body (for multi-source sync)
      const requestBody = req.body || {};
      const selectedSources = requestBody.sources as string[] | undefined;

      // Parse base options from query parameters
      const baseOptions = {
        dryRun: req.query.dryRun === "true",
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      };

      // Validate custom date range if provided
      if ((baseOptions.from && !baseOptions.to) ||
          (!baseOptions.from && baseOptions.to)) {
        res.status(400).json({
          ok: false,
          error: "Both 'from' and 'to' parameters required for custom date range",
        });
        return;
      }

      // If sources array provided, sync multiple sources
      if (selectedSources && Array.isArray(selectedSources)) {
        logger.info(`Starting multi-source sync for ${selectedSources.length} sources`, {
          sources: selectedSources,
          ...baseOptions,
        });

        const results = [];

        // Sync each source sequentially
        for (const source of selectedSources) {
          try {
            const options: SyncOptions = {
              ...baseOptions,
              source: source as any, // Will be validated by sync function
            };

            logger.info(`Syncing source: ${source}`, options);

            const result = await syncEconomicEventsCalendar(
              options,
              "manual_sync"
            );

            results.push({
              source,
              ...result,
            });

            logger.info(`✅ Sync completed for ${source}`, result);
          } catch (error) {
            const errorMessage = error instanceof Error ?
              error.message :
              "Unknown error";

            logger.error(`❌ Sync failed for ${source}`, {error: errorMessage});

            results.push({
              source,
              success: false,
              error: errorMessage,
              recordsUpserted: 0,
              apiCallsUsed: 0,
              from: baseOptions.from || "",
              to: baseOptions.to || "",
              dryRun: baseOptions.dryRun,
            });
          }
        }

        // Return aggregated results
        const allSuccessful = results.every((r) => r.success);
        const totalRecords = results.reduce(
          (sum, r) => sum + r.recordsUpserted,
          0
        );

        res.status(allSuccessful ? 200 : 207).json({
          ok: allSuccessful,
          multiSource: true,
          totalSources: selectedSources.length,
          totalRecordsUpserted: totalRecords,
          results,
        });
      } else {
        // Single source sync (default behavior)
        const options: SyncOptions = {
          ...baseOptions,
          // No source specified, will use DEFAULT_NEWS_SOURCE
        };

        logger.info("Starting single-source sync", options);

        // Execute sync
        const result = await syncEconomicEventsCalendar(
          options,
          "manual_sync"
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

/**
 * HTTPS Cloud Function - Historical Bulk Sync (Admin Only)
 * Loads 2 years historical + 1 year forward economic events data
 * 
 * ⚠️ ADMIN ONLY - Requires superadmin role
 * 
 * Purpose: Initial data population or recovery
 * Date Range: 2 years back from Jan 1, 1 year forward to Dec 31
 * Use Case: First-time setup, data migration, disaster recovery
 * Cost: High API usage (~3 years of data)
 * 
 * Request Body (JSON):
 * - sources: string[] (optional) - Array of sources to sync
 *   Default: ["mql5"] (most reliable source)
 * - adminToken: string (required) - Firebase ID token for authentication
 * 
 * Example:
 * POST .../syncHistoricalEvents
 * {
 *   "sources": ["mql5", "forex-factory"],
 *   "adminToken": "Firebase_ID_Token_Here"
 * }
 * 
 * To deploy:
 * firebase deploy --only functions:syncHistoricalEvents
 */
export const syncHistoricalEvents = onRequest(
  {
    cors: true,
    timeoutSeconds: 540, // 9 minutes for large dataset
    memory: "1GiB", // Larger memory for bulk sync
  },
  async (req, res) => {
    logger.info("🏛️ Historical sync triggered", {
      method: req.method,
      ip: req.ip,
    });

    try {
      // TODO: Verify admin role from Firebase ID token
      // const adminToken = req.body?.adminToken;
      // if (!adminToken || !(await verifyAdmin(adminToken))) {
      //   res.status(403).json({ ok: false, error: "Admin access required" });
      //   return;
      // }

      // Parse sources from request body
      const requestBody = req.body || {};
      const selectedSources = (requestBody.sources as string[]) || ["mql5"];

      // Get historical date range (2 years back, 1 year forward)
      const dateRange = getHistoricalDateRange();

      logger.info(`Starting historical sync for ${selectedSources.length} sources`, {
        sources: selectedSources,
        from: dateRange.from,
        to: dateRange.to,
      });

      const results = [];

      // Sync each source sequentially
      for (const source of selectedSources) {
        try {
          const options: SyncOptions = {
            dryRun: false,
            from: dateRange.from,
            to: dateRange.to,
            source: source as NewsSource,
          };

          logger.info(`Historical sync for ${source}`, options);

          const result = await syncEconomicEventsCalendar(
            options,
            "historical_bulk_sync"
          );

          results.push({
            source,
            ...result,
          });

          logger.info(`✅ Historical sync completed for ${source}`, result);
        } catch (error) {
          const errorMessage = error instanceof Error ?
            error.message :
            "Unknown error";

          logger.error(`❌ Historical sync failed for ${source}`, {
            error: errorMessage,
          });

          results.push({
            source,
            success: false,
            error: errorMessage,
            recordsUpserted: 0,
            apiCallsUsed: 0,
            from: dateRange.from,
            to: dateRange.to,
            dryRun: false,
          });
        }
      }

      // Return aggregated results
      const allSuccessful = results.every((r) => r.success);
      const totalRecords = results.reduce(
        (sum, r) => sum + r.recordsUpserted,
        0
      );

      logger.info("🏛️ Historical sync results", {
        allSuccessful,
        totalRecords,
        sources: selectedSources.length,
      });

      res.status(allSuccessful ? 200 : 207).json({
        ok: allSuccessful,
        type: "historical_bulk_sync",
        dateRange,
        totalSources: selectedSources.length,
        totalRecordsUpserted: totalRecords,
        results,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ?
        error.message :
        "Unknown error";

      logger.error("❌ Historical sync error", {error: errorMessage});

      res.status(500).json({
        ok: false,
        error: errorMessage,
        success: false,
      });
    }
  }
);

/**
 * Scheduled Cloud Function - Recent Events Update (Daily at 5 AM ET)
 * Updates recent events with comprehensive lookback and realistic forward window
 * 
 * Purpose: Maintain accurate near-term data with actual values
 * Date Range: 30 days back, 14 days forward (44 days total, includes today)
 * Schedule: Daily at 5:00 AM Eastern Time
 * Use Case: Daily maintenance, update actuals, keep forward data fresh
 * Cost: Low API usage (~44 days of data)
 * 
 * This function addresses forward data limitations by syncing frequently
 * with a shorter window. Economic event sources typically publish events
 * 1-2 weeks ahead, so daily syncs with 2-week lookahead maintain accuracy.
 * 
 * To deploy:
 * firebase deploy --only functions:syncRecentEventsScheduled
 */
export const syncRecentEventsScheduled = onSchedule(
  {
    schedule: "0 5 * * *", // Cron: 5:00 AM daily
    timeZone: "America/New_York", // US/Eastern
    timeoutSeconds: 300, // 5 minutes (smaller dataset)
    memory: "512MiB",
  },
  async (event) => {
    logger.info("🔄 Recent events scheduled sync triggered", {
      scheduleTime: event.scheduleTime,
      jobName: event.jobName,
    });

    try {
      // Get recent date range (30 days back, 14 days forward)
      const dateRange = getRecentDateRange();

      // Sync primary source (MQL5 is most reliable)
      const result = await syncEconomicEventsCalendar(
        {
          dryRun: false,
          from: dateRange.from,
          to: dateRange.to,
          source: "mql5" as NewsSource, // Primary source for daily updates
        },
        "recent_scheduled_sync"
      );

      logger.info("✅ Recent events scheduled sync completed", {
        ...result,
        dateRange,
      });
    } catch (error) {
      logger.error("❌ Recent events scheduled sync failed", error);
      throw error; // Re-throw to mark function as failed in logs
    }
  }
);

/**
 * HTTPS Cloud Function - Recent Events Manual Trigger (Admin Only)
 * Updates recent events with comprehensive lookback and realistic forward window
 * 
 * ⚠️ ADMIN ONLY - Requires superadmin role
 * 
 * Purpose: On-demand recent data updates
 * Date Range: 30 days back, 14 days forward (44 days total, includes today)
 * Use Case: Immediate updates after major events, testing
 * Cost: Low API usage (~44 days of data)
 * 
 * Request Body (JSON):
 * - sources: string[] (optional) - Array of sources to sync
 *   Default: ["mql5"] (most reliable source)
 * - adminToken: string (required) - Firebase ID token for authentication
 * 
 * Example:
 * POST .../syncRecentEventsNow
 * {
 *   "sources": ["mql5"],
 *   "adminToken": "Firebase_ID_Token_Here"
 * }
 * 
 * To deploy:
 * firebase deploy --only functions:syncRecentEventsNow
 */
export const syncRecentEventsNow = onRequest(
  {
    cors: true,
    timeoutSeconds: 300, // 5 minutes
    memory: "512MiB",
  },
  async (req, res) => {
    logger.info("🔄 Recent events manual sync triggered", {
      method: req.method,
      ip: req.ip,
    });

    try {
      // TODO: Verify admin role from Firebase ID token
      // const adminToken = req.body?.adminToken;
      // if (!adminToken || !(await verifyAdmin(adminToken))) {
      //   res.status(403).json({ ok: false, error: "Admin access required" });
      //   return;
      // }

      // Parse sources from request body
      const requestBody = req.body || {};
      const selectedSources = (requestBody.sources as string[]) || ["mql5"];

      // Get recent date range (30 days back, 14 days forward)
      const dateRange = getRecentDateRange();

      logger.info(`Starting recent sync for ${selectedSources.length} sources`, {
        sources: selectedSources,
        from: dateRange.from,
        to: dateRange.to,
      });

      const results = [];

      // Sync each source sequentially
      for (const source of selectedSources) {
        try {
          const options: SyncOptions = {
            dryRun: false,
            from: dateRange.from,
            to: dateRange.to,
            source: source as NewsSource,
          };

          logger.info(`Recent sync for ${source}`, options);

          const result = await syncEconomicEventsCalendar(
            options,
            "recent_manual_sync"
          );

          results.push({
            source,
            ...result,
          });

          logger.info(`✅ Recent sync completed for ${source}`, result);
        } catch (error) {
          const errorMessage = error instanceof Error ?
            error.message :
            "Unknown error";

          logger.error(`❌ Recent sync failed for ${source}`, {
            error: errorMessage,
          });

          results.push({
            source,
            success: false,
            error: errorMessage,
            recordsUpserted: 0,
            apiCallsUsed: 0,
            from: dateRange.from,
            to: dateRange.to,
            dryRun: false,
          });
        }
      }

      // Return aggregated results
      const allSuccessful = results.every((r) => r.success);
      const totalRecords = results.reduce(
        (sum, r) => sum + r.recordsUpserted,
        0
      );

      logger.info("🔄 Recent sync results", {
        allSuccessful,
        totalRecords,
        sources: selectedSources.length,
      });

      res.status(allSuccessful ? 200 : 207).json({
        ok: allSuccessful,
        type: "recent_manual_sync",
        dateRange,
        totalSources: selectedSources.length,
        totalRecordsUpserted: totalRecords,
        results,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ?
        error.message :
        "Unknown error";

      logger.error("❌ Recent sync error", {error: errorMessage});

      res.status(500).json({
        ok: false,
        error: errorMessage,
        success: false,
      });
    }
  }
);
