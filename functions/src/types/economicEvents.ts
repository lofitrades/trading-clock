/**
 * Type definitions for Economic Events Calendar
 * Based on JBlanked News Calendar API
 * Documentation: https://www.jblanked.com/news/api/docs/calendar/
 */

/**
 * Supported news source providers
 * Each source corresponds to a JBlanked API endpoint and Firestore subcollection
 * 
 * Firestore structure: /economicEvents/{source}/events/{eventDocId}
 */
export type NewsSource = 'mql5' | 'forex-factory' | 'fxstreet';

/**
 * Default news source for new users and scheduled sync
 */
export const DEFAULT_NEWS_SOURCE: NewsSource = 'mql5';

/**
 * Raw event data from JBlanked Calendar API
 * API date format: "YYYY.MM.DD HH:MM:SS"
 * 
 * Note: Not all sources provide all fields
 * - MQL5: Provides all fields including Category, Projection, Event_ID
 * - Forex Factory: Missing Category, Projection, Event_ID
 * - FXStreet: Missing Category, Projection, Event_ID (limited data ~10 events)
 */
export interface JBlankedCalendarEvent {
  Name: string;
  Currency: string;
  Category?: string; // MQL5 only
  Date: string; // Format: "YYYY.MM.DD HH:MM:SS"
  Actual: number | null;
  Forecast: number | null;
  Previous: number | null;
  Outcome: string | null;
  Projection?: number | null; // MQL5 only
  Strength: string | null; // Impact: low, medium, high
  Quality: string | null; // Trend
  Event_ID?: string; // MQL5 only
}

/**
 * Normalized event data for Firestore storage
 * Stored in: /economicEvents/{source}/events/{eventDocId}
 * 
 * Fields are nullable to support multiple data sources with varying schemas
 */
export interface EconomicEventDocument {
  name: string;
  currency: string;
  category: string | null; // MQL5 only, null for other sources
  date: FirebaseFirestore.Timestamp;
  actual: number | null;
  forecast: number | null;
  previous: number | null;
  outcome: string | null;
  projection: number | null; // MQL5 only, null for other sources
  strength: string | null; // Impact level
  quality: string | null; // Trend direction
  source: NewsSource; // Origin source (mql5, forex-factory, fxstreet)
  lastSyncedAt: FirebaseFirestore.Timestamp;
}

/**
 * Sync status tracking document
 */
export interface SyncStatusDocument {
  lastRunAt: FirebaseFirestore.Timestamp;
  lastRunStatus: 'success' | 'error';
  lastRunError: string | null;
  lastFetchedFrom: string; // YYYY-MM-DD
  lastFetchedTo: string; // YYYY-MM-DD
  recordsUpserted: number;
  apiCallsUsed: number; // Track credit consumption
}

/**
 * Options for sync function
 */
export interface SyncOptions {
  source?: NewsSource; // News source to sync from (default: DEFAULT_NEWS_SOURCE)
  dryRun?: boolean; // If true, don't write to Firestore
  from?: string; // Override start date (YYYY-MM-DD)
  to?: string; // Override end date (YYYY-MM-DD)
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  recordsUpserted: number;
  apiCallsUsed: number;
  from: string;
  to: string;
  error?: string;
  dryRun: boolean;
}
