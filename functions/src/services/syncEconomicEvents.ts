/**
 * Core sync function for Economic Events Calendar
 * Fetches data from JBlanked News Calendar API and syncs to Firestore
 * 
 * Supports multiple news sources (mql5, forex-factory, fxstreet)
 * Firestore structure: /economicEvents/{source}/events/{eventDocId}
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  JBlankedCalendarEvent,
  EconomicEventDocument,
  SyncOptions,
  SyncResult,
  NewsSource,
  DEFAULT_NEWS_SOURCE,
} from "../types/economicEvents";
import {
  parseJBlankedDate,
  toFirestoreTimestamp,
  generateEventDocId,
  getThreeYearDateRange,
  getHistoricalDateRange,
  getRecentDateRange,
} from "../utils/dateUtils";

// Re-export date range functions for use in index.ts
export {getHistoricalDateRange, getRecentDateRange};

// Import mock data for testing
import mockCalendarData from "../fixtures/mockCalendarData.json";

// Firestore collection names
const EVENTS_COLLECTION_ROOT = "economicEvents"; // Root collection
const STATUS_COLLECTION = "systemJobs";
const STATUS_DOC_ID = "economicEventsCalendarSync";

/**
 * Get Firestore subcollection reference for a specific news source (admin SDK)
 * Firestore structure: /economicEvents/{source}/events/{eventDocId}
 * 
 * @param source - News source identifier
 * @returns CollectionReference for the source's events subcollection
 */
export function getEconomicEventsCollectionAdminRef(source: NewsSource) {
  const db = admin.firestore();
  const sourceDocRef = db.collection(EVENTS_COLLECTION_ROOT).doc(source);
  return sourceDocRef.collection('events');
}

/**
 * Map NewsSource to JBlanked API calendar path
 * 
 * JBlanked API structure:
 * - MQL5: /news/api/mql5/calendar/range/
 * - Forex Factory: /news/api/forex-factory/calendar/range/
 * - FXStreet: /news/api/fxstreet/calendar/range/
 * 
 * @param source - News source identifier
 * @returns API path segment for the source
 */
function getCalendarPathForSource(source: NewsSource): string {
  switch (source) {
    case 'forex-factory':
      return 'forex-factory/calendar/range';
    case 'fxstreet':
      return 'fxstreet/calendar/range';
    case 'mql5':
    default:
      return 'mql5/calendar/range';
  }
}

/**
 * Fetch calendar data from JBlanked API
 * 
 * @param source - News source to fetch from
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @param apiKey - JBlanked API key
 * @param useMock - If true, return mock data for testing
 */
async function fetchCalendarData(
  source: NewsSource,
  from: string,
  to: string,
  apiKey: string,
  useMock: boolean = false
): Promise<JBlankedCalendarEvent[]> {
  if (useMock) {
    logger.info("Using mock calendar data for testing");
    return mockCalendarData.events as JBlankedCalendarEvent[];
  }

  const path = getCalendarPathForSource(source);
  const url = `https://www.jblanked.com/news/api/${path}/?from=${from}&to=${to}`;

  logger.info(`Fetching calendar data from ${source}: ${url}`);

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
 * 
 * @param event - Raw event from JBlanked API
 * @param source - News source identifier
 */
function normalizeEvent(
  event: JBlankedCalendarEvent,
  source: NewsSource
): EconomicEventDocument {
  const date = parseJBlankedDate(event.Date);

  return {
    name: event.Name,
    currency: event.Currency,
    // Category is MQL5-specific, use null for sources that don't provide it
    category: event.Category || null,
    date: toFirestoreTimestamp(date),
    actual: event.Actual ?? null,
    forecast: event.Forecast ?? null,
    previous: event.Previous ?? null,
    outcome: event.Outcome || null,
    // Projection is MQL5-specific
    projection: event.Projection ?? null,
    strength: event.Strength || null,
    quality: event.Quality || null,
    source: source, // Store the origin source
    lastSyncedAt: admin.firestore.Timestamp.now(),
  };
}

/**
 * Main sync function
 * Fetches 3-year window of economic events and syncs to Firestore
 */
export async function syncEconomicEventsCalendar(
  options: SyncOptions = {},
  syncType:
    | "scheduled_function"
    | "manual_sync"
    | "historical_bulk_sync"
    | "recent_scheduled_sync"
    | "recent_manual_sync" = "manual_sync"
): Promise<SyncResult> {
  const startTime = Date.now();
  const db = admin.firestore();

  // Extract options with defaults
  const {
    source = DEFAULT_NEWS_SOURCE as NewsSource,
    dryRun = false,
  } = options;

  // Get API key from environment
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey && !dryRun) {
    throw new Error("NEWS_API_KEY environment variable not set");
  }

  // Get date range (3-year window)
  let {from, to} = options.from && options.to ?
    {from: options.from, to: options.to} :
    getThreeYearDateRange();

  logger.info(`Starting calendar sync from ${source}: ${from} to ${to}`, {
    source,
    dryRun,
    from,
    to,
    syncType,
  });

  try {
    // Fetch data from API (or use mock data in dry run)
    const events = await fetchCalendarData(
      source,
      from,
      to,
      apiKey || "",
      dryRun
    );

    logger.info(`Fetched ${events.length} events from ${source} API`);

    let recordsUpserted = 0;

    // Get the Firestore subcollection reference for this source
    // Structure: /economicEvents/{source}/events/{docId}
    const eventsCollection = getEconomicEventsCollectionAdminRef(source);

    // Process events in batches (Firestore batch limit is 500)
    const batchSize = 500;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = db.batch();
      const batchEvents = events.slice(i, i + batchSize);

      for (const event of batchEvents) {
        try {
          // Generate stable document ID
          const docId = generateEventDocId(event.Name, event.Date);

          // Normalize event data with source
          const normalizedEvent = normalizeEvent(event, source);

          if (!dryRun) {
            // Upsert to Firestore subcollection: /economicEvents/{source}/events/{docId}
            const docRef = eventsCollection.doc(docId);
            batch.set(docRef, normalizedEvent, {merge: true});
            recordsUpserted++;
          } else {
            // Dry run: just log
            logger.debug(`[DRY RUN] Would upsert event: ${event.Name}`, {
              docId,
              source,
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
