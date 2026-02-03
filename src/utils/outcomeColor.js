/**
 * src/utils/outcomeColor.js
 * 
 * Purpose: Determine actual value outcome sentiment (positive/neutral/negative)
 * based on available event data. Only returns a sentiment when 100% confident.
 * 
 * Key Principles (BEP):
 * - Only use explicit outcome data from API sources (JBlanked/MQL5)
 * - Never guess based on value comparisons alone (different indicators have
 *   different polarity - unemployment lower is better, jobs higher is better)
 * - Return 'unknown' when confidence is not 100%
 * - Theme-aware color mapping for positive (green), negative (red), neutral (text)
 * 
 * Changelog:
 * v1.0.0 - 2026-01-29 - Initial BEP implementation with source-based outcome detection
 */

/**
 * Outcome sentiment enum
 * @readonly
 * @enum {string}
 */
export const OutcomeSentiment = {
  POSITIVE: 'positive',   // Better than expected (green)
  NEGATIVE: 'negative',   // Worse than expected (red)
  NEUTRAL: 'neutral',     // As expected
  UNKNOWN: 'unknown',     // Cannot determine with confidence
};

/**
 * Patterns to detect positive outcomes from API outcome strings
 * These are explicit signals from the data source indicating better-than-expected results
 */
const POSITIVE_PATTERNS = [
  /better/i,
  /\bpositive\b/i,
  /\bbullish\b/i,
  /good\s*data/i,
  /actual\s*>\s*forecast/i,
  /above\s*expect/i,
  /beat/i,
  /strong/i,
];

/**
 * Patterns to detect negative outcomes from API outcome strings
 * These are explicit signals from the data source indicating worse-than-expected results
 */
const NEGATIVE_PATTERNS = [
  /worse/i,
  /\bnegative\b/i,
  /\bbearish\b/i,
  /bad\s*data/i,
  /actual\s*<\s*forecast/i,
  /below\s*expect/i,
  /miss/i,
  /weak/i,
];

/**
 * Patterns to detect neutral/as-expected outcomes
 */
const NEUTRAL_PATTERNS = [
  /as\s*expected/i,
  /inline/i,
  /in\s*line/i,
  /actual\s*=\s*forecast/i,
  /meets?\s*expect/i,
  /unchanged/i,
];

/**
 * Determine outcome sentiment from event's outcome field
 * Only returns definitive sentiment when outcome field explicitly indicates it
 * 
 * @param {string|null|undefined} outcome - The outcome field from API (e.g., "better", "Actual > Forecast", "bullish")
 * @returns {OutcomeSentiment} The determined sentiment
 */
export const getOutcomeSentiment = (outcome) => {
  if (!outcome || typeof outcome !== 'string') {
    return OutcomeSentiment.UNKNOWN;
  }

  const trimmed = outcome.trim();
  if (!trimmed) {
    return OutcomeSentiment.UNKNOWN;
  }

  // Check for neutral first (most specific match)
  if (NEUTRAL_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return OutcomeSentiment.NEUTRAL;
  }

  // Check for positive indicators
  if (POSITIVE_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return OutcomeSentiment.POSITIVE;
  }

  // Check for negative indicators
  if (NEGATIVE_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return OutcomeSentiment.NEGATIVE;
  }

  return OutcomeSentiment.UNKNOWN;
};

/**
 * Get the appropriate color for the actual value based on outcome sentiment
 * Returns theme-aware color tokens (not hex values)
 * 
 * @param {Object} event - Event object with outcome field
 * @param {Object} options - Options for color resolution
 * @param {boolean} [options.hasValue=true] - Whether actual has a displayable value
 * @param {boolean} [options.isPast=false] - Whether event is in the past (for context, not used currently)
 * @returns {string} MUI theme color token (e.g., 'success.main', 'error.main', 'primary.main', 'text.disabled')
 */
export const getActualValueColor = (event, options = {}) => {
  const { hasValue = true } = options;

  // No value = disabled color
  if (!hasValue) {
    return 'text.disabled';
  }

  // Get outcome from event (support both field cases)
  const outcome = event?.outcome || event?.Outcome;
  const sentiment = getOutcomeSentiment(outcome);

  switch (sentiment) {
    case OutcomeSentiment.POSITIVE:
      return 'success.main';
    case OutcomeSentiment.NEGATIVE:
      return 'error.main';
    case OutcomeSentiment.NEUTRAL:
      return 'text.primary';
    case OutcomeSentiment.UNKNOWN:
    default:
      // Fallback to primary for unknown but valid value (maintains current behavior)
      return 'primary.main';
  }
};

/**
 * Get sentiment with additional metadata for tooltips/display
 * 
 * @param {Object} event - Event object
 * @returns {Object} Sentiment info with color and label
 */
export const getOutcomeInfo = (event) => {
  const outcome = event?.outcome || event?.Outcome;
  const sentiment = getOutcomeSentiment(outcome);

  return {
    sentiment,
    color: getActualValueColor(event, { hasValue: true }),
    label: getSentimentLabel(sentiment),
    hasExplicitOutcome: sentiment !== OutcomeSentiment.UNKNOWN,
  };
};

/**
 * Get human-readable label for sentiment
 * @param {OutcomeSentiment} sentiment
 * @returns {string}
 */
const getSentimentLabel = (sentiment) => {
  switch (sentiment) {
    case OutcomeSentiment.POSITIVE:
      return 'Better than expected';
    case OutcomeSentiment.NEGATIVE:
      return 'Worse than expected';
    case OutcomeSentiment.NEUTRAL:
      return 'As expected';
    case OutcomeSentiment.UNKNOWN:
    default:
      return '';
  }
};

export default {
  OutcomeSentiment,
  getOutcomeSentiment,
  getActualValueColor,
  getOutcomeInfo,
};
