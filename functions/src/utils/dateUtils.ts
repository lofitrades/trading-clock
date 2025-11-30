/**
 * Utility functions for economic events sync
 */

import {Timestamp} from "firebase-admin/firestore";
import * as crypto from "crypto";

/**
 * Parse JBlanked date format to JavaScript Date
 * Format: "YYYY.MM.DD HH:MM:SS"
 * 
 * CRITICAL: Based on JBlanked API documentation, dates are returned in GMT (UTC).
 * The API uses offset notation: offset=0 (GMT-3), offset=3 (GMT/UTC), offset=7 (EST), offset=10 (PST)
 * When using the default API (no offset parameter), times are in GMT (UTC).
 * 
 * We parse the date string and explicitly interpret it as UTC by adding 'Z' suffix.
 * The client-side will then convert to the user's selected timezone for display.
 * 
 * Reference: 
 * - JBlanked API: https://www.jblanked.com/news/api/docs/calendar/
 * - API offset notation: jb.offset = 0 (GMT-3), 3 (GMT), 7 (EST), 10 (PST)
 * - Default behavior: Returns GMT/UTC timestamps
 */
export function parseJBlankedDate(dateStr: string): Date {
  // Parse: "2024.02.08 15:30:00" -> ISO format
  // Replace dots with dashes and add 'T' separator, then add 'Z' for UTC
  const isoFormat = dateStr.replace(/\./g, "-").replace(" ", "T") + "Z";
  
  // Parse as UTC - the 'Z' suffix tells Date() to interpret as UTC
  // This preserves the exact time from the API which is already in GMT/UTC
  return new Date(isoFormat);
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
