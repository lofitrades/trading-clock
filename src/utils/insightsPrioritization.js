/**
 * src/utils/insightsPrioritization.js
 *
 * Purpose: Ranking and prioritization algorithm for Insights feed.
 * Combines recency, severity, engagement, and diversity to surface most relevant items.
 *
 * Scoring Formula:
 * score = recencyScore + severityBoost + engagementBoost + multiMatchBonus
 *
 * Recency: exp(-ageHours / halfLife) — exponential decay
 * Severity: +0.1 to +0.3 depending on activity type (error > warning > success > info)
 * Engagement: +0.01 per view, +0.1 per like (articles only)
 * MultiMatch: +0.15 per additional matching insightKey beyond first
 *
 * Diversity: Applies post-sorting constraints:
 * - No >2 consecutive items from same source type
 * - No >3 items from same event key in top 10
 * - At least 1 article in top 6 (when articles available)
 *
 * Changelog:
 * v1.0.0 - 2026-02-10 - Phase 3: Initial implementation
 */

/**
 * Calculate recency score using exponential decay
 * @param {number} ageHours - How many hours ago the item was created
 * @param {number} halfLife - Half-life in hours (when score = 0.5)
 * @returns {number} Recency score (0.0 to 1.0)
 */
export function calculateRecencyScore(ageHours, halfLife = 72) {
  // exp(-ageHours / halfLife) produces exponential decay
  // At halfLife hours: score = exp(-1) ≈ 0.368
  // At 2*halfLife hours: score = exp(-2) ≈ 0.135
  const score = Math.exp(-ageHours / halfLife);
  return Math.max(0, Math.min(1, score));
}

/**
 * Get severity boost for activity types
 * @param {string} severity - Severity level ('error', 'warning', 'success', 'info')
 * @returns {number} Boost amount (0.0 to 0.3)
 */
export function getSeverityBoost(severity) {
  const boosts = {
    error: 0.3,
    warning: 0.2,
    success: 0.1,
    info: 0,
  };
  return boosts[severity] || 0;
}

/**
 * Calculate engagement boost for articles
 * @param {Object} article - Article object with viewCount, likeCount
 * @returns {number} Engagement boost (capped at 4.0)
 */
export function getEngagementBoost(article = {}) {
  let boost = 0;

  if (article.viewCount) {
    // +0.01 per view, max +2
    boost += Math.min(2, article.viewCount * 0.01);
  }

  if (article.likeCount) {
    // +0.1 per like, max +2
    boost += Math.min(2, article.likeCount * 0.1);
  }

  return Math.min(4, boost);
}

/**
 * Calculate multi-match bonus
 * Rewards items that match multiple candidate keys
 * @param {number} matchCount - Number of matching insightKeys
 * @returns {number} Bonus amount (capped at 0.75 for 5+ matches)
 */
export function getMultiMatchBonus(matchCount = 1) {
  // First match = base (no bonus)
  // Additional matches: +0.15 each
  if (matchCount <= 1) return 0;
  const bonus = (matchCount - 1) * 0.15;
  return Math.min(0.75, bonus);
}

/**
 * Calculate final insight score
 * @param {Object} item - Insight item (article, activity, or note)
 * @param {Object} options - Scoring options
 * @param {string[]} options.candidateKeys - Keys being searched for (for multi-match detection)
 * @param {Date} options.now - Current time (for recency calculation)
 * @returns {number} Final score
 */
export function calculateInsightScore(item, options = {}) {
  const { candidateKeys = [], now = new Date() } = options;

  let score = 0;

  // 1. Recency score
  const ageMs = now.getTime() - (item.createdAt?.toMillis?.() || item.publishedAt?.toMillis?.() || now.getTime());
  const ageHours = ageMs / (60 * 60 * 1000);

  if (item.sourceType === 'article') {
    // Articles: 72-hour half-life
    score += calculateRecencyScore(ageHours, 72);
  } else if (item.sourceType === 'activity') {
    // Activities: 24-hour half-life (more time-sensitive)
    score += calculateRecencyScore(ageHours, 24);
  } else if (item.sourceType === 'note') {
    // Notes: 168-hour (1 week) half-life
    score += calculateRecencyScore(ageHours, 168);
  }

  // 2. Severity boost (activity logs only)
  if (item.sourceType === 'activity' && item.severity) {
    score += getSeverityBoost(item.severity);
  }

  // 3. Engagement boost (articles only)
  if (item.sourceType === 'article') {
    score += getEngagementBoost(item);
  }

  // 4. Multi-match bonus (item matches multiple candidate keys)
  if (candidateKeys.length > 0 && item.insightKeys) {
    const matchCount = item.insightKeys.filter((key) => candidateKeys.includes(key)).length;
    score += getMultiMatchBonus(matchCount);
  }

  return score;
}

/**
 * Apply diversity constraints to a ranked list
 * Reorders items to satisfy diversity requirements:
 * - No >2 consecutive from same source
 * - No >3 from same event key in top 10
 * - At least 1 article in top 6 (when available)
 * @param {Object[]} items - Pre-sorted items by score (desc)
 * @returns {Object[]} Reordered items with diversity applied
 */
export function applyDiversityConstraints(items) {
  if (!items.length) return items;

  const result = [];
  const sourceSequence = [];
  const eventKeyCounts = {};
  let articleInTopSix = false;

  // Helper to get event key from insightKeys
  function getEventKey(item) {
    if (!item.insightKeys) return null;
    const match = item.insightKeys.find((k) => k.startsWith('event:'));
    return match?.replace('event:', '') || null;
  }

  // Helper to check if we can add item
  function canAdd(item, position) {
    const { sourceType } = item;
    const eventKey = getEventKey(item);

    // Constraint 1: No >2 consecutive from same source
    const recentSources = sourceSequence.slice(-2);
    if (recentSources.length === 2 && recentSources.every((s) => s === sourceType)) {
      return false;
    }

    // Constraint 2: No >3 from same event key in top 10
    if (position < 10 && eventKey) {
      if ((eventKeyCounts[eventKey] || 0) >= 3) {
        return false;
      }
    }

    // Constraint 3: At least 1 article in top 6
    if (position < 6 && !articleInTopSix && sourceType !== 'article') {
      // Only enforce if we haven't placed an article yet AND there are articles in the remaining pool
      const hasArticles = items.slice(result.length).some((i) => i.sourceType === 'article');
      if (hasArticles) {
        return false;
      }
    }

    return true;
  }

  // Build result respecting constraints
  const remaining = [...items];

  while (remaining.length > 0) {
    let placed = false;

    // Try to place highest-scoring remaining item that satisfies constraints
    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];
      if (canAdd(item, result.length)) {
        result.push(item);
        remaining.splice(i, 1);
        sourceSequence.push(item.sourceType);
        const eventKey = getEventKey(item);
        if (eventKey) {
          eventKeyCounts[eventKey] = (eventKeyCounts[eventKey] || 0) + 1;
        }
        if (item.sourceType === 'article' && result.length <= 6) {
          articleInTopSix = true;
        }
        placed = true;
        break;
      }
    }

    // If we can't place any items respecting all constraints, relax to just no >2 consecutive
    if (!placed && remaining.length > 0) {
      const item = remaining[0];
      result.push(item);
      remaining.splice(0, 1);
      sourceSequence.push(item.sourceType);
      const eventKey = getEventKey(item);
      if (eventKey) {
        eventKeyCounts[eventKey] = (eventKeyCounts[eventKey] || 0) + 1;
      }
    }
  }

  return result;
}

/**
 * Rank and reorder insights
 * @param {Object[]} items - Raw items from queries
 * @param {Object} options - Ranking options
 * @param {string[]} options.candidateKeys - Keys being searched for (for scoring)
 * @param {boolean} options.applyDiversity - Apply diversity constraints (default: true)
 * @returns {Object[]} Ranked items with scores
 */
export function rankInsights(items, options = {}) {
  const { candidateKeys = [], applyDiversity = true } = options;
  const now = new Date();

  // 1. Score each item
  const scored = items.map((item) => ({
    ...item,
    _score: calculateInsightScore(item, { candidateKeys, now }),
  }));

  // 2. Sort by score descending
  const sorted = scored.sort((a, b) => b._score - a._score);

  // 3. Apply diversity if requested
  const diversified = applyDiversity ? applyDiversityConstraints(sorted) : sorted;

  return diversified;
}

/**
 * Aggregate trending keys from a collection of items
 * MVP fallback: When insightsIndex not available, calculate top keys from recent items
 * @param {Object[]} items - Array of items (usually last N activity logs)
 * @param {number} topK - Number of top keys to return (default: 6)
 * @returns {string[]} Top K keys by frequency
 */
export function aggregateTrendingKeys(items, topK = 6) {
  const keyCounts = {};

  // Count frequency of each key across all items
  items.forEach((item) => {
    if (item.insightKeys && Array.isArray(item.insightKeys)) {
      item.insightKeys.forEach((key) => {
        keyCounts[key] = (keyCounts[key] || 0) + 1;
      });
    }
  });

  // Sort by frequency and return top K
  const sorted = Object.entries(keyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([key]) => key);

  return sorted;
}

/**
 * Deduplicate items by sourceId
 * Prevents showing same item from multiple sources
 * @param {Object[]} items - Array of items with sourceType and sourceId
 * @returns {Object[]} Deduplicated items
 */
export function deduplicateItems(items) {
  const seen = new Map();

  return items.filter((item) => {
    const id = `${item.sourceType}:${item.sourceId}`;
    if (seen.has(id)) return false;
    seen.set(id, true);
    return true;
  });
}

export default {
  calculateRecencyScore,
  getSeverityBoost,
  getEngagementBoost,
  getMultiMatchBonus,
  calculateInsightScore,
  applyDiversityConstraints,
  rankInsights,
  aggregateTrendingKeys,
  deduplicateItems,
};
