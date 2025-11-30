/**
 * Utility functions for economic events sync
 */

import {Timestamp} from "firebase-admin/firestore";
import * as crypto from "crypto";

/**
 * Parse JBlanked date format to JavaScript Date
 * Format: "YYYY.MM.DD HH:MM:SS"
 */
export function parseJBlankedDate(dateStr: string): Date {
  // Replace dots with dashes and space with 'T'
  const isoFormat = dateStr.replace(/\./g, "-").replace(" ", "T");
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
