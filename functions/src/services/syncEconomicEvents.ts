/**
 * Core sync function for Economic Events Calendar
 * Fetches data from JBlanked News Calendar API and syncs to Firestore
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  JBlankedCalendarEvent,
  EconomicEventDocument,
  SyncOptions,
  SyncResult,
} from "../types/economicEvents";
import {
  parseJBlankedDate,
  toFirestoreTimestamp,
  generateEventDocId,
  getThreeYearDateRange,
} from "../utils/dateUtils";

// Import mock data for testing
import mockCalendarData from "../fixtures/mockCalendarData.json";

// Firestore collection names
const EVENTS_COLLECTION = "economicEventsCalendar";
const STATUS_COLLECTION = "systemJobs";
const STATUS_DOC_ID = "economicEventsCalendarSync";

/**
 * Fetch calendar data from JBlanked API
 */
async function fetchCalendarData(
  from: string,
  to: string,
  apiKey: string,
  useMock: boolean = false
): Promise<JBlankedCalendarEvent[]> {
  if (useMock) {
    logger.info("Using mock calendar data for testing");
    return mockCalendarData.events as JBlankedCalendarEvent[];
  }

  const url = `https://www.jblanked.com/news/api/mql5/calendar/range/?from=${from}&to=${to}`;

  logger.info(`Fetching calendar data: ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Api-Key ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();

  // API returns object with 'value' array and 'Count' property
  // Reference: https://www.jblanked.com/news/api/docs/calendar/
  if (!data || typeof data !== 'object') {
    const errorMsg = `Unexpected API response format: expected object, got ${typeof data}`;
    logger.error("❌ API Response Error:", errorMsg);
    logger.error("Response data:", data);
    throw new Error(errorMsg);
  }

  // Check if response is already an array (direct format)
  if (Array.isArray(data)) {
    logger.info(`✅ API returned ${data.length} events (direct array format)`);
    return data as JBlankedCalendarEvent[];
  }

  // Check for value property (wrapped format)
  if (!data.value) {
    const errorMsg = "Unexpected API response format: missing 'value' property";
    logger.error("❌ API Response Error:", errorMsg);
    logger.error("Response keys:", Object.keys(data));
    logger.error("Response data:", JSON.stringify(data).substring(0, 500));
    throw new Error(errorMsg);
  }

  if (!Array.isArray(data.value)) {
    const errorMsg = `Unexpected API response format: 'value' property should be an array, got ${typeof data.value}`;
    logger.error("❌ API Response Error:", errorMsg);
    logger.error("data.value type:", typeof data.value);
    logger.error("data.value:", data.value);
    throw new Error(errorMsg);
  }

  logger.info(`✅ API returned ${data.Count || data.value.length} total events`);
  return data.value as JBlankedCalendarEvent[];
}

/**
 * Normalize API event to Firestore document
 */
function normalizeEvent(
  event: JBlankedCalendarEvent
): EconomicEventDocument {
  const date = parseJBlankedDate(event.Date);

  return {
    name: event.Name,
    currency: event.Currency,
    category: event.Category,
    date: toFirestoreTimestamp(date),
    actual: event.Actual,
    forecast: event.Forecast,
    previous: event.Previous,
    outcome: event.Outcome,
    projection: event.Projection,
    strength: event.Strength,
    quality: event.Quality,
    source: "mql5",
    lastSyncedAt: admin.firestore.Timestamp.now(),
  };
}

/**
 * Main sync function
 * Fetches 3-year window of economic events and syncs to Firestore
 */
export async function syncEconomicEventsCalendar(
  options: SyncOptions = {},
  source: "scheduled_function" | "manual_sync" = "manual_sync"
): Promise<SyncResult> {
  const startTime = Date.now();
  const db = admin.firestore();

  // Extract options
  const {dryRun = false} = options;

  // Get API key from environment
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey && !dryRun) {
    throw new Error("NEWS_API_KEY environment variable not set");
  }

  // Get date range (3-year window)
  let {from, to} = options.from && options.to ?
    {from: options.from, to: options.to} :
    getThreeYearDateRange();

  logger.info(`Starting calendar sync: ${from} to ${to}`, {
    dryRun,
    from,
    to,
  });

  try {
    // Fetch data from API (or use mock data in dry run)
    const events = await fetchCalendarData(
      from,
      to,
      apiKey || "",
      dryRun
    );

    logger.info(`Fetched ${events.length} events from API`);

    let recordsUpserted = 0;

    // Process events in batches (Firestore batch limit is 500)
    const batchSize = 500;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = db.batch();
      const batchEvents = events.slice(i, i + batchSize);

      for (const event of batchEvents) {
        try {
          // Generate stable document ID
          const docId = generateEventDocId(event.Name, event.Date);

          // Normalize event data
          const normalizedEvent = normalizeEvent(event);

          if (!dryRun) {
            // Upsert to Firestore
            const docRef = db.collection(EVENTS_COLLECTION).doc(docId);
            batch.set(docRef, normalizedEvent, {merge: true});
            recordsUpserted++;
          } else {
            // Dry run: just log
            logger.debug(`[DRY RUN] Would upsert event: ${event.Name}`, {
              docId,
              event: normalizedEvent,
            });
            recordsUpserted++;
          }
        } catch (error) {
          logger.error(`Error processing event: ${event.Name}`, error);
          // Continue processing other events
        }
      }

      // Commit batch
      if (!dryRun && batchEvents.length > 0) {
        await batch.commit();
        logger.info(
          `Committed batch ${Math.floor(i / batchSize) + 1} (${batchEvents.length} events)`
        );
      }
    }

    // Update sync status
    if (!dryRun) {
      await db.collection(STATUS_COLLECTION).doc(STATUS_DOC_ID).set({
        lastRunAt: admin.firestore.Timestamp.now(),
        lastRunStatus: "success",
        lastRunError: null,
        lastFetchedFrom: from,
        lastFetchedTo: to,
        recordsUpserted,
        apiCallsUsed: 1, // Calendar range endpoint = 1 call
        source, // Track source of sync: 'scheduled_function' or 'manual_sync'
      }, {merge: true});
    }

    const duration = Date.now() - startTime;
    logger.info(`Sync completed successfully in ${duration}ms`, {
      recordsUpserted,
      dryRun,
      duration,
    });

    return {
      success: true,
      recordsUpserted,
      apiCallsUsed: 1,
      from,
      to,
      dryRun,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ?
      error.message :
      "Unknown error";
    logger.error("Sync failed", {error: errorMessage});

    // Update sync status with error
    if (!dryRun) {
      try {
        await db.collection(STATUS_COLLECTION).doc(STATUS_DOC_ID).set({
          lastRunAt: admin.firestore.Timestamp.now(),
          lastRunStatus: "error",
          lastRunError: errorMessage,
          lastFetchedFrom: from,
          lastFetchedTo: to,
          recordsUpserted: 0,
          apiCallsUsed: 1,
          source, // Track source of sync even on error
        }, {merge: true});
      } catch (statusError) {
        logger.error("Failed to update error status", statusError);
      }
    }

    return {
      success: false,
      recordsUpserted: 0,
      apiCallsUsed: 1,
      from,
      to,
      error: errorMessage,
      dryRun,
    };
  }
}
