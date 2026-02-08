# Phase 6 Quick Reference Guide

**For Developers:** Copy-paste reference for using Phase 6 search in your code

---

## 1. How to Search Blog Posts

```javascript
import { searchBlogPosts } from '../services/blogSearchService';

// Simple search
const result = await searchBlogPosts({
  query: "NFP trading",
  lang: "en",
  limit: 12,
});

console.log(result.posts); // Array of matching posts, ranked by relevance
console.log(result.hasMore); // true if more results available
console.log(result.lastCursor); // Document reference for next page
```

---

## 2. Search with All Filters

```javascript
const result = await searchBlogPosts({
  query: "trading",                          // Search term (e.g., "NFP", "USD", "economic")
  lang: "en",                                // Language: "en" | "es" | "fr"
  category: "Trading",                       // Single category (or null)
  events: ["NFP", "CPI"],                    // Array of event names (or [])
  currencies: ["USD", "EUR"],                // Array of currency codes (or [])
  tags: ["forex", "employment"],             // Array of tag names (or [])
  authorIds: ["uid1", "uid2"],               // Array of author IDs (or [])
  limit: 20,                                 // Posts per page
  cursor: null,                              // For pagination (start: null)
});
```

---

## 3. Pagination (Infinite Scroll)

```javascript
// First page
const page1 = await searchBlogPosts({
  query: "trading",
  lang: "en",
  limit: 12,
  cursor: null,  // ← No cursor = first page
});

// Next page
if (page1.hasMore) {
  const page2 = await searchBlogPosts({
    query: "trading",
    lang: "en",
    limit: 12,
    cursor: page1.lastCursor,  // ← Use lastCursor from previous page
  });
}
```

---

## 4. Get Available Filters

```javascript
import { getBlogSearchFilters } from '../services/blogSearchService';

const filters = await getBlogSearchFilters("en");

console.log(filters.categories);   // ["Trading", "Economics", "Analysis"]
console.log(filters.tags);         // ["nfp", "trading", "forex", ...]
console.log(filters.authors);      // [{ id, displayName }, ...]
console.log(filters.currencies);   // ["USD", "EUR", "GBP", ...]
console.log(filters.events);       // ["NFP", "CPI", "FOMC", ...]

// Use these to populate dropdowns:
// <Select value={...} >
//   {filters.categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
// </Select>
```

---

## 5. Get Search Suggestions (Autocomplete)

```javascript
import { getBlogSearchSuggestions } from '../services/blogSearchService';

const suggestions = await getBlogSearchSuggestions("en");
// Returns: ["trading", "nfp", "forex", "economic", "employment", ...]  (top 20)

// Use in autocomplete suggestions field
```

---

## 6. Compute Tokens (For Admin Publishing)

```javascript
import { computeSearchTokens } from '../services/blogService';

const post = {
  languages: {
    en: {
      title: "NFP Report Trading Tips",
      excerpt: "How to trade USD moves...",
      tags: ["trading", "economic-events"],
      category: "Trading",
      keywords: ["employment", "forex"],
    }
  },
  currencyTags: ["USD"],
  eventTags: ["NFP"],
};

const tokens = computeSearchTokens(post, "en");
// Result: ["employment", "events", "forex", "nfp", "report", "tips", "trade", "trading", "usd"]

// ✅ automatically called by publishBlogPost() + updateBlogPost()
// You only need this if custom token computation needed
```

---

## 7. Relevance Scoring Explained

| Source | Points | Example |
|--------|--------|---------|
| Title contains token | 3 | Post title with "NFP" = 3pts |
| Events/Currencies | 2 | Event or currency tag matches = 2pts |
| Excerpt contains token | 1 | Post excerpt with "NFP" = 1pt |
| Tags/Category | 0.5 | Tag or category matches = 0.5pts |

**Example Scoring:**
```
User searches "NFP trading"  → Tokens: ["nfp", "trading"]

Post A:
- Title: "NFP Trading Strategy" → 3pts (nfp) + 3pts (trading) = 6pts
- Event tags: ["NFP"] → 2pts
- Total: 8pts ← HIGHEST RELEVANCE

Post B:
- Excerpt: "Learn about NFP trading..." → 1pt (nfp) + 1pt (trading) = 2pts
- Currency tags: ["USD"]
- Total: 2pts

→ Post A ranks first
```

---

## 8. Common Queries

### Search for Economic Events
```javascript
await searchBlogPosts({
  query: "NFP",  // User types "NFP"
  lang: "en",
  // Returns posts with "nfp" in title/tags/eventTags
});
```

### Search for Currency
```javascript
await searchBlogPosts({
  query: "USD",  // User types "USD" (BEP!)
  lang: "en",
  // Returns posts with "usd" in title/tags/currencyTags
});
```

### Combine Search + Filters
```javascript
await searchBlogPosts({
  query: "trading",         // General search
  lang: "en",
  category: "Trading",      // Only Trading category
  events: ["NFP"],          // Only NFP event posts
  currencies: ["USD"],      // Only USD-related
  // Returns: NFP posts + USD + Trading category + contain "trading"
});
```

### Multi-Select Tags
```javascript
await searchBlogPosts({
  query: "",
  lang: "en",
  tags: ["forex", "trading"],  // Match ANY of these tags (OR logic)
  // Returns: Posts with "forex" tag OR "trading" tag
});
```

### Author Filter
```javascript
await searchBlogPosts({
  query: "analysis",
  lang: "en",
  authorIds: ["user123", "user456"],  // Posts by these authors
});
```

---

## 9. Error Handling

```javascript
try {
  const result = await searchBlogPosts({
    query: "trading",
    lang: "en",
  });
  
  if (result.posts.length === 0) {
    console.log("No posts found");
  }
} catch (error) {
  console.error("Search error:", error.message);
  // Firestore error, network issue, etc.
}
```

---

## 10. React Hook Example

```javascript
import { useState, useEffect } from 'react';
import { searchBlogPosts } from '../services/blogSearchService';

export const MyBlogSearch = () => {
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length === 0) {
        setPosts([]);
        return;
      }
      
      setLoading(true);
      const result = await searchBlogPosts({
        query,
        lang: "en",
        limit: 12,
      });
      
      setPosts(result.posts);
      setLoading(false);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {loading && <p>Searching...</p>}
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
};
```

---

## 11. Firestore Query Optimization

**What happens under the hood:**

```javascript
// Phase 6 Query
const constraints = [
  where('status', '==', 'published'),
  where(`languages.${lang}`, '!=', null),
  orderBy('publishedAt', 'desc'),
  limit(13), // limit + 1 to detect if more exist
  startAfter(cursor), // pagination
];

// Cost: 1 read per search (reads up to 13 docs)
// Result: Posts sorted by date, then client-side re-ranked by relevance
```

**Cost Calculation:**
- 1,000,000 searches × $0.06 per 1M = $0.00006 per search
- Monthly: 100K searches × $0.06 = $6/month

---

## 12. Debugging Tips

### Check if searchTokens are populated
```javascript
// In Firestore Console
db.collection('blogPosts')
  .doc('somePostId')
  .get()
  .then(doc => {
    console.log(doc.data().languages.en.searchTokens);
    // Should show: ["token1", "token2", "token3", ...]
  });
```

### Verify search is debouncing
```javascript
// Open browser DevTools → Network tab
// Type in search field slowly
// Should see: No request for first 300ms, then ONE request

// Incorrect (too many requests):
// "t" → request
// "tr" → request
// "tra" → request
// "trad" → request

// Correct (debounced):
// "t" → (wait 300ms)
// "tr" → (wait 300ms)
// "tra" → (wait 300ms)
// "trad" → (300ms passed) → ONE REQUEST for "trad"
```

### Verify filter dropdowns load
```javascript
// In browser console:
const filters = await getBlogSearchFilters("en");
console.log(filters);
// Should show: { categories: [...], tags: [...], authors: [...], currencies: [...], events: [...] }

// If empty, means no published posts exist yet
```

---

## 13. Localization (i18n) Keys

All UI strings are translatable. Add these to your locale files:

```json
{
  "blog": {
    "listPage": {
      "searchPlaceholder": "Search insights...",
      "categoryLabel": "Category",
      "allCategories": "All Categories",
      "eventLabel": "Economic Event",
      "allEvents": "All Events",
      "currencyLabel": "Currency",
      "allCurrencies": "All Currencies",
      "tagsLabel": "Tags",
      "tagsPlaceholder": "Select tags...",
      "authorsLabel": "Authors",
      "authorsPlaceholder": "Select authors...",
      "clearFilters": "Clear All Filters",
      "noPostsSearch": "No posts found for your search"
    }
  }
}
```

---

## 14. Testing Checklist

Before shipping:
- [ ] Search works offline (service fallback)
- [ ] Debounce prevents excessive requests
- [ ] Pagination loads more posts
- [ ] Filters work individually
- [ ] Filters work combined (all active at once)
- [ ] "Clear filters" button resets all
- [ ] Mobile responsive
- [ ] No console errors
- [ ] i18n keys translated (EN/ES/FR)

---

## 15. Performance Metrics

**Target Performance:**
- Search latency: <500ms (usually <300ms)
- Debounce delay: 300ms (user types, waits, results appear)
- Pagination load: <500ms (lazy load next page)
- Filter dropdown load: <100ms (cached from Firestore)

**Monitor via:**
- Chrome DevTools → Network tab (search latency)
- Firestore Console → Database → Ops/reads (query cost)
- Firebase Analytics (user search patterns)

---

## Quick Links

- [Full Implementation Guide](./PHASE_6_COMPLETION_SUMMARY.md)
- [Next Steps & Roadmap](./PHASE_6_NEXT_STEPS.md)
- [blogSearchService.js](../../src/services/blogSearchService.js)
- [BlogListPage.jsx](../../src/pages/BlogListPage.jsx)
- [Blog Implementation Roadmap](../Blog_Implementation_Roadmap.md)

---

**Last Updated:** February 6, 2026  
**Status:** ✅ Phase 6 Complete — Production Ready
