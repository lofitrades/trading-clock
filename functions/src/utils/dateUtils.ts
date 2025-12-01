/**
 * Utility functions for economic events sync
 */

import {Timestamp} from "firebase-admin/firestore";
import * as crypto from "crypto";

/**
 * Parse JBlanked date format to JavaScript Date
 * Format: "YYYY.MM.DD HH:MM:SS"
 * 
 * CRITICAL FIX v1.1.0: Forex Factory times are in Eastern Time (ET), NOT UTC!
 * 
 * Root Cause: Despite API documentation suggesting GMT/UTC, testing confirms:
 * - API returns: "2024.01.15 10:30:00"
 * - Forex Factory displays: "10:30 AM ET" (Eastern Time)
 * - Previous code added 'Z' suffix → treated as UTC → wrong by 5 hours (EST) or 4 hours (EDT)
 * 
 * Solution: Parse as Eastern Time, convert to proper UTC for Firestore storage.
 * This ensures accurate timezone conversion on frontend regardless of user's selected timezone.
 * 
 * Example (Winter - EST):
 * Input:  "2024.01.15 10:30:00" (10:30 AM ET during EST period)
 * Output: Date representing 2024-01-15T15:30:00.000Z (3:30 PM UTC, which is 10:30 AM EST)
 * 
 * Example (Summer - EDT):
 * Input:  "2024.07.15 10:30:00" (10:30 AM ET during EDT period)
 * Output: Date representing 2024-07-15T14:30:00.000Z (2:30 PM UTC, which is 10:30 AM EDT)
 * 
 * Reference: 
 * - JBlanked API: https://www.jblanked.com/news/api/docs/calendar/
 * - Verified against Forex Factory times (always displayed in ET)
 * 
 * Changelog:
 * v1.1.0 - 2025-01-XX - Fixed timezone: Parse as ET, not UTC
 * v1.0.0 - 2024-XX-XX - Initial implementation (incorrect UTC assumption)
 */
export function parseJBlankedDate(dateStr: string): Date {
  // Parse: "2024.02.08 15:30:00" -> "2024-02-08T15:30:00"
  const isoFormat = dateStr.replace(/\./g, "-").replace(" ", "T");
  
  // Parse components
  const parts = isoFormat.split(/[-T:]/);
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Month is 0-indexed in JavaScript
  const day = parseInt(parts[2]);
  const hour = parseInt(parts[3]);
  const minute = parseInt(parts[4]);
  const second = parseInt(parts[5]);
  
  // Determine if this date is in EST (winter) or EDT (summer)
  // Create a test date to check timezone offset
  const testDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
  const formatted = formatter.format(testDate);
  const isEST = formatted.includes("EST"); // True in winter (UTC-5), false in summer (UTC-4)
  const etOffsetHours = isEST ? 5 : 4;
  
  // Convert ET time to UTC: Add the ET offset to get UTC timestamp
  // Example: 10:30 AM EST (UTC-5) = 3:30 PM UTC → UTC time = ET time + 5 hours
  const utcTimestamp = Date.UTC(year, month, day, hour, minute, second) + (etOffsetHours * 60 * 60 * 1000);
  
  return new Date(utcTimestamp);
}

/**
 * Convert JavaScript Date to Firestore Timestamp
 */
export function toFirestoreTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
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
