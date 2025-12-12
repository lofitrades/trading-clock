/**
 * functions/src/utils/dateUtils.ts
 *
 * Purpose: Utility helpers for economic event sync: date parsing, ranges, and IDs.
 * Ensures backend stores UTC-normalized timestamps for consistent timezone handling.
 *
 * Changelog:
 * v1.8.0 - 2025-12-11 - Added canonical helpers for NFS ISO timestamps and JBlanked timestamp conversion.
 * v1.7.1 - 2025-12-09 - Removed unused apiDate variable and added file header for lint compliance.
 * v1.7.0 - 2025-12-01 - Verified GMT+2 to UTC conversion for JBlanked Forex Factory data.
 * v1.0.0 - 2024-XX-XX - Initial implementation.
 */

import {Timestamp} from "firebase-admin/firestore";
import * as crypto from "crypto";

/**
 * Parse JBlanked date format to JavaScript Date
 * Format: "YYYY.MM.DD HH:MM:SS"
 * 
 * ENTERPRISE BEST PRACTICE: Store in UTC, display in user's selected timezone
 * 
 * JBlanked API Behavior (Forex Factory source):
 * - API returns times in a GMT+2 reference format
 * - Must subtract 2 hours to get proper UTC timestamp
 * - Frontend then converts UTC to user's selected timezone
 * 
 * Verified Example:
 * - Event: "Final Manufacturing PMI" USD (Dec 1, 2025)
 * - Forex Factory displays: 09:45 EST (verified from website)
 * - API returns: "2025.12.01 16:45:00" (verified from actual API call)
 * - Backend: 16:45 - 2 hours = 14:45 UTC
 * - Frontend (EST): 14:45 UTC - 5 hours = 09:45 EST ✅ CORRECT
 * - Frontend (GMT): 14:45 UTC + 0 hours = 14:45 GMT ✅
 * - Frontend (JST): 14:45 UTC + 9 hours = 23:45 JST ✅
 * 
 * This follows enterprise best practices:
 * 1. Store all times in UTC (timezone-agnostic)
 * 2. Frontend converts to user's selected timezone
 * 3. Timezone selector dynamically updates all displayed times
 * 4. No data duplication or timezone-specific fields needed
 * 
 * Multi-source support:
 * - Forex Factory: Verified with actual API data (GMT+2 offset)
 * - MQL5: Assumed same GMT+2 offset (verify if used)
 * - FXStreet: Assumed same GMT+2 offset (verify if used)
 * 
 * Reference:
 * - JBlanked API: https://www.jblanked.com/news/api/docs/
 * - Forex Factory: https://www.forexfactory.com/calendar
 * - Python library: jb.offset = 7 for EST
 * 
 * Changelog:
 * v1.7.0 - 2025-12-01 - CORRECT: Subtract 2 hours (GMT+2 → UTC) - verified with actual API call
 * v1.6.0 - 2025-12-01 - WRONG: Subtract 7 hours (assumed GMT+7, was incorrect)
 * v1.5.0 - 2025-12-01 - Investigation: No conversion
 * v1.4.0 - 2025-12-01 - FAILED: Added 5 hours
 * v1.3.0 - 2025-12-01 - Close but not verified: Subtracted 7 hours
 * v1.0.0 - 2024-XX-XX - Initial implementation
 */
export function parseJBlankedDate(dateStr: string): Date {
  // Parse: "2025.12.01 21:45:00" -> "2025-12-01T21:45:00"
  const isoFormat = dateStr.replace(/\./g, "-").replace(" ", "T");
  
  // Parse as naive datetime (no timezone)
  const parts = isoFormat.split(/[-T:]/);
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Month is 0-indexed in JavaScript
  const day = parseInt(parts[2]);
  const hour = parseInt(parts[3]);
  const minute = parseInt(parts[4]);
  const second = parseInt(parts[5]);
  
  // ENTERPRISE BEST PRACTICE: Store times in UTC for proper timezone conversion
  // 
  // Analysis of JBlanked API for Forex Factory source:
  // - Example event "Final Manufacturing PMI" shows 09:45 EST on Forex Factory (verified)
  // - API returns time in GMT+2 format (needs 2 hour subtraction)
  // - Formula: UTC = API_TIME - 2 hours
  // 
  // Verification:
  // - API returns: "2025.12.01 16:45:00" (GMT+2 reference time)
  // - Subtract 2 hours: 16:45 - 2 = 14:45 UTC
  // - Display in EST (UTC-5): 14:45 - 5 = 09:45 EST ✅ MATCHES Forex Factory
  
  const JBLANKED_OFFSET_HOURS = 2; // GMT+2 offset (verified with actual API data Dec 1, 2025)
  const apiTime = Date.UTC(year, month, day, hour, minute, second);
  const utcTimestamp = apiTime - (JBLANKED_OFFSET_HOURS * 60 * 60 * 1000);

  const utcDate = new Date(utcTimestamp);
  
  // Validate the parsed date
  if (isNaN(utcDate.getTime())) {
    console.error(`   ❌ INVALID DATE: "${dateStr}"`);
    throw new Error(`Invalid date format: ${dateStr}`);
  }
  return utcDate;
}

/**
 * Parse ISO date string with timezone offset (e.g., 2025-12-09T10:00:00-05:00)
 * Used for NFS weekly feed which already includes offset information.
 */
export function parseNfsIsoDate(dateStr: string): Date {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid NFS date format: ${dateStr}`);
  }
  return parsed;
}

/**
 * Convert NFS ISO string to Firestore Timestamp (UTC normalized)
 */
export function parseNfsDateToTimestamp(dateStr: string): Timestamp {
  return Timestamp.fromDate(parseNfsIsoDate(dateStr));
}

/**
 * Convert JavaScript Date to Firestore Timestamp
 */
export function toFirestoreTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Convert JBlanked date string directly to Firestore Timestamp.
 * Keeps centralized offset handling in parseJBlankedDate.
 */
export function parseJblankedDateToTimestamp(dateStr: string): Timestamp {
  return Timestamp.fromDate(parseJBlankedDate(dateStr));
}

/**
 * Generate stable document ID from event data
 * Uses name + date to create a deterministic ID
 */
export function generateEventDocId(
  name: string,
  dateStr: string
): string {
  const normalized = `${name}_${dateStr}`.toLowerCase()
    .replace(/[^a-z0-9_]/g, "_");
  // Hash to keep ID length reasonable
  const hash = crypto.createHash("md5")
    .update(normalized)
    .digest("hex")
    .substring(0, 16);
  return `${hash}_${dateStr.split(" ")[0].replace(/\./g, "")}`;
}

/**
 * Get date range for 3-year window
 * Returns previous year, current year, and next year
 */
export function getThreeYearDateRange(): { from: string; to: string } {
  const now = new Date();
  const currentYear = now.getUTCFullYear();

  const from = `${currentYear - 1}-01-01`;
  const to = `${currentYear + 1}-12-31`;

  return {from, to};
}

/**
 * Get date range for historical bulk sync
 * Returns 2 years back to TODAY ONLY (no future)
 * 
 * Use case: Initial historical data population
 * Note: /calendar/range/ endpoint is optimized for historical data,
 * not future events. Use getRecentDateRange() for future events.
 */
export function getHistoricalDateRange(): { from: string; to: string } {
  const now = new Date();
  
  // 2 years back
  const fromDate = new Date(now);
  fromDate.setFullYear(now.getFullYear() - 2);
  fromDate.setMonth(0, 1); // January 1st
  
  // Up to today only (no future - range endpoint limitation)
  const toDate = new Date(now);
  
  return {
    from: formatDateISO(fromDate),
    to: formatDateISO(toDate),
  };
}

/**
 * Get date range for recent events sync
 * Returns 30 days back and 14 days forward (balanced coverage)
 * 
 * Use case: Daily/scheduled updates for near-term events
 * Enterprise best practice: Wider historical window for accurate actuals,
 * realistic forward window based on typical source availability:
 * - Forex Factory: ~1-7 days forward
 * - MQL5: ~7-14 days forward  
 * - FXStreet: ~1-7 days forward
 * 
 * Includes 30 days back to capture recent actuals, revisions, and updates.
 * Daily sync at 5 AM EST keeps data fresh despite limited forward availability.
 */
export function getRecentDateRange(): { from: string; to: string } {
  const now = new Date();
  
  // 30 days back (includes today) - comprehensive recent history
  const fromDate = new Date(now);
  fromDate.setDate(now.getDate() - 30);
  
  // 14 days forward - realistic based on source capabilities
  const toDate = new Date(now);
  toDate.setDate(now.getDate() + 14);
  
  return {
    from: formatDateISO(fromDate),
    to: formatDateISO(toDate),
  };
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function isValidDateFormat(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Create a slug from text (lowercase, replace spaces with dashes)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
