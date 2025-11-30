/**
 * Type definitions for Economic Events Calendar
 * Based on JBlanked News Calendar API
 * Documentation: https://www.jblanked.com/news/api/docs/calendar/
 */

/**
 * Raw event data from JBlanked Calendar API
 * API date format: "YYYY.MM.DD HH:MM:SS"
 */
export interface JBlankedCalendarEvent {
  Name: string;
  Currency: string;
  Category: string;
  Date: string; // Format: "YYYY.MM.DD HH:MM:SS"
  Actual: number | null;
  Forecast: number | null;
  Previous: number | null;
  Outcome: string | null;
  Projection: number | null;
  Strength: string | null; // Impact: low, medium, high
  Quality: string | null; // Trend
  Event_ID?: string; // May not be present in Calendar endpoint
}

/**
 * Normalized event data for Firestore storage
 */
export interface EconomicEventDocument {
  name: string;
  currency: string;
  category: string;
  date: FirebaseFirestore.Timestamp;
  actual: number | null;
  forecast: number | null;
  previous: number | null;
  outcome: string | null;
  projection: number | null;
  strength: string | null; // Impact level
  quality: string | null; // Trend direction
  source: 'mql5'; // API source
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
