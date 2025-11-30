/**
 * Firestore Document Structure Reference
 * Collection: economicEventsCalendar
 * 
 * This document describes the actual structure of economic event documents
 * stored in Firestore after syncing from JBlanked/MQL5 API.
 * 
 * IMPORTANT: All field names are LOWERCASE (not PascalCase)
 * 
 * Last Updated: 2025-11-29
 */

/**
 * Sample Document from Firestore
 */
const sampleEvent = {
  // Numeric value (actual reading of the indicator)
  actual: 3.3,                    // number | null
  
  // Event classification
  category: "Interest Rate Report",  // string - MQL5 category
  
  // Currency code (ISO 4217)
  currency: "EUR",                // string (3 letters)
  
  // Event timestamp
  date: Timestamp,                // Firestore Timestamp object
  
  // Expected/forecasted value
  forecast: 3.4,                  // number | null
  
  // Last sync timestamp
  lastSyncedAt: Timestamp,        // Firestore Timestamp object
  
  // Event name/title
  name: "ECB Deposit Facility Rate Decision",  // string
  
  // Comparison result between actual/forecast/previous
  outcome: "Actual < Forecast = Previous",     // string
  
  // Previous period's value
  previous: 3.4,                  // number | null
  
  // Future projection (if available)
  projection: 3.6,                // number | null
  
  // Data quality assessment
  quality: "Bad Data",            // string: "Bad Data" | "Good Data" | etc.
  
  // Data source identifier
  source: "mql5",                 // string: "mql5" | "forex-factory"
  
  // Impact/importance level
  strength: "Strong Data"         // string: see values below
};

/**
 * Strength Field Values (Impact Levels)
 * 
 * These are the ACTUAL values from MQL5 API, not "High", "Medium", "Low"
 */
const strengthValues = {
  HIGH: "Strong Data",        // High-impact events (e.g., NFP, Fed decisions)
  MEDIUM: "Moderate Data",    // Medium-impact events
  LOW: "Weak Data",           // Low-impact events
  FUTURE: "Data Not Loaded",  // Future events (impact not determined yet)
  NONE: "Non-Economic",       // Non-economic events
  EMPTY: null                 // No strength assigned
};

/**
 * Category Field Values (Event Types)
 * 
 * These come from MQL5 Economic Calendar categories
 */
const categoryExamples = [
  "Interest Rate Report",
  "Job Report",
  "Consumer Inflation Report",
  "Producer Inflation Report",
  "Core Economy Report",
  "Economy Report",
  "Production Report",
  "Commodity Report",
  "Survey Report",
  "Monetary Policy Report",
  "Housing Report"
];

/**
 * Currency Field Values
 * 
 * ISO 4217 currency codes (3 letters)
 */
const currencyExamples = [
  "USD", "EUR", "GBP", "JPY", "AUD", 
  "CAD", "CHF", "NZD", "CNY"
];

/**
 * Filter Mapping
 * 
 * When filtering events, use these field names:
 */
const filterMapping = {
  // Date range filter
  dateRange: {
    field: 'date',
    type: 'Timestamp',
    operators: ['>=', '<=']
  },
  
  // Impact level filter
  impact: {
    field: 'strength',          // NOT 'Strength' or 'impact'
    type: 'string',
    values: [
      'Strong Data',           // NOT 'High'
      'Moderate Data',         // NOT 'Medium'
      'Weak Data',             // NOT 'Low'
      'Non-Economic',
      null
    ]
  },
  
  // Event type filter
  eventType: {
    field: 'category',          // NOT 'Category'
    type: 'string',
    values: categoryExamples    // Dynamic from Firestore
  },
  
  // Currency filter
  currency: {
    field: 'currency',          // NOT 'Currency'
    type: 'string',
    values: currencyExamples    // Dynamic from Firestore
  }
};

/**
 * Code Examples
 */

// ✅ CORRECT - Lowercase field names
const correctQuery = {
  strength: 'Strong Data',
  category: 'Job Report',
  currency: 'USD'
};

// ❌ WRONG - Uppercase/PascalCase field names
const wrongQuery = {
  Strength: 'High',           // Field doesn't exist
  Category: 'Job Report',     // Field doesn't exist
  Currency: 'USD'             // Field doesn't exist
};

/**
 * Firestore Query Example
 */
/*
const eventsRef = collection(db, 'economicEventsCalendar');
const q = query(
  eventsRef,
  where('date', '>=', startTimestamp),
  where('date', '<=', endTimestamp),
  orderBy('date', 'asc')
);

const snapshot = await getDocs(q);
const events = snapshot.docs.map(doc => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,              // lowercase
    currency: data.currency,      // lowercase
    category: data.category,      // lowercase
    strength: data.strength,      // lowercase
    actual: data.actual,          // lowercase
    forecast: data.forecast,      // lowercase
    previous: data.previous,      // lowercase
    date: data.date.toDate(),     // Convert Timestamp to Date
    outcome: data.outcome,        // lowercase
  };
});

// Client-side filtering
const highImpactEvents = events.filter(e => 
  e.strength === 'Strong Data'  // Use actual API value
);
*/

module.exports = {
  sampleEvent,
  strengthValues,
  categoryExamples,
  currencyExamples,
  filterMapping
};
