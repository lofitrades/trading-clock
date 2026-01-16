# Mobile Layout Height Calculations & Positioning Issues - Comprehensive Audit

**Date:** January 14, 2026  
**Scope:** `/calendar` page responsive layout on xs/sm breakpoints  
**Status:** Audit Complete - No fixes implemented

---

## Executive Summary

This audit reveals **critical conflicts** in the responsive height calculation system affecting xs/sm breakpoints. The root cause is a **mismatch between three layers** of the positioning stack:

1. **PublicLayout** changed `pt` from 8 (64px) to 4 (32px) on xs/sm without updating downstream calculations
2. **EventsFilters3** sticky `top` offset **incorrectly set to `16px` on xs** (should be `48px` like sm)
3. **CalendarEmbedLayout** `pb` formula adds 48px for logo offset but doesn't account for reduced PublicLayout `pt`
4. **DaySection** sticky headers calculate offset correctly but inherit broken filter offset values

**Net Result:** On xs breakpoint specifically, filters stick at wrong position (16px instead of 48px), causing overlap with mobile logo. Day headers compound this error. Layout is visibly broken on xs, partially broken on sm.

---

## Architecture Stack Measurement

### Bottom-to-Top Positioning Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│ PublicLayout (100dvh viewport container)                        │
│ - Root Box: minHeight/height = 100dvh                          │
│ - bgcolor: #F9F9F9                                             │
│ - overflow: hidden                                             │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Mobile Logo (fixed, xs/sm only)                          │  │
│ │ - position: fixed                                        │  │
│ │ - top: 0                                                 │  │
│ │ - height: 32px (image)                                   │  │
│ │ - py: 2 (16px top + 16px bottom)                         │  │
│ │ - mb: 4 (32px, but fixed so doesn't affect flow)        │  │
│ │ - z-index: 100                                           │  │
│ │ **TOTAL VISUAL HEIGHT: 32px + 16px + 16px = 64px**      │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ AppBar (sticky, xs/sm/md)                                │  │
│ │ - position: sticky                                       │  │
│ │ - top: 0                                                 │  │
│ │ - z-index: 1400                                          │  │
│ │ - mb: { xs: 0, md: 2 }                                   │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Main Content Box                                         │  │
│ │ - flex: 1                                                │  │
│ │ - overflow: hidden                                       │  │
│ │ - pt: { xs: 4, sm: 4, md: 0 }  ← **CRITICAL**           │  │
│ │   **xs/sm: 4 * 8px = 32px**                              │  │
│ │ - maxHeight: {                                           │  │
│ │     xs: 'calc(100vh - 64px)',  ← bottom nav             │  │
│ │     sm: 'calc(100vh - 64px)',                            │  │
│ │     md: '100%'                                           │  │
│ │   }                                                      │  │
│ │                                                          │  │
│ │   ┌────────────────────────────────────────────────┐    │  │
│ │   │ CalendarEmbedLayout (wrapper)                  │    │  │
│ │   │ - pt: 2 (16px)                                 │    │  │
│ │   │ - pb: {                                        │    │  │
│ │   │     xs: 'calc(10 * 8px + 48px)',  = 128px      │    │  │
│ │   │     sm: 'calc(10 * 8px + 48px)',  = 128px      │    │  │
│ │   │     md: 12                        = 96px       │    │  │
│ │   │   }                                            │    │  │
│ │   │ - minHeight/height: 100dvh  ← **CONFLICT**    │    │  │
│ │   │                                                │    │  │
│ │   │   ┌──────────────────────────────────────┐    │    │  │
│ │   │   │ CalendarEmbed (Paper)                │    │    │  │
│ │   │   │                                      │    │    │  │
│ │   │   │ EventsFilters3 (sticky)              │    │    │  │
│ │   │   │ - position: sticky                   │    │    │  │
│ │   │   │ - top: {                             │    │    │  │
│ │   │   │     xs: '16px',  ← **WRONG!**        │    │    │  │
│ │   │   │     sm: '48px',  ← Correct           │    │    │  │
│ │   │   │     md: 0        ← Correct           │    │    │  │
│ │   │   │   }                                  │    │    │  │
│ │   │   │ - z-index: 1000                      │    │    │  │
│ │   │   │                                      │    │    │  │
│ │   │   │ DaySection[] (Papers)                │    │    │  │
│ │   │   │ - Day Header (sticky)                │    │    │  │
│ │   │   │   - position: sticky                 │    │    │  │
│ │   │   │   - top: daySectionStickyOffsetTop   │    │    │  │
│ │   │   │   - z-index: 900                     │    │    │  │
│ │   │   │                                      │    │    │  │
│ │   │   │ - Column Headers (sticky)            │    │    │  │
│ │   │   │   - top: offset + 44px               │    │    │  │
│ │   │   │   - z-index: 899                     │    │    │  │
│ │   │   └──────────────────────────────────────┘    │    │  │
│ │   └────────────────────────────────────────────────┘    │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ Bottom Nav (fixed, xs/sm only)                                │
│ - height: var(--t2t-bottom-nav-height, 64px)                  │
│ - z-index: 1400                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Critical Finding #1: xs Breakpoint Filters Sticky Top Incorrect

### Location
**File:** [src/components/CalendarEmbed.jsx](src/components/CalendarEmbed.jsx#L2177)  
**Line:** 2177

### Current Code
```jsx
<Box
    ref={filtersBoxRef}
    sx={{
        position: 'sticky',
        top: { xs: '16px', sm: '48px', md: 0 },  // ← xs value is WRONG
        zIndex: 1000,
        // ... rest of styling
    }}
>
```

### Problem
- **xs breakpoint:** `top: '16px'` 
- **Mobile logo visual height:** 64px total (32px img + 16px py top + 16px py bottom)
- **Mobile logo IS fixed at top 0**, but has **padding that extends to 64px**
- **Expected xs value:** Should be `'48px'` to match sm breakpoint

### Why This Is Wrong
The mobile logo Box has:
```jsx
py: { xs: 2, sm: 2, md: 'unset' }  // 2 * 8px = 16px top + 16px bottom
height: 32  // image itself
// Total occupied space: 16 + 32 + 16 = 64px
```

But wait - let me check the actual visual calculation more carefully:

Looking at the PublicLayout mobile logo:
```jsx
py: { xs: 2, sm: 2, md: 'unset' }     // padding top + bottom = 16px + 16px = 32px
mb: 4                                   // margin-bottom = 32px (but fixed, so doesn't affect flow)
height: 32                              // image height
```

**ACTUAL calculation:**
- Logo image: 32px
- Padding top: 16px
- Padding bottom: 16px  
- **Total height of fixed Box: 64px**

But the code comment says "48px mobile logo row". Let me trace where 48px comes from:

In CalendarEmbedLayout pb formula:
```jsx
pb: { xs: 'calc(10 * 8px + 48px)', sm: 'calc(10 * 8px + 48px)', md: 12 }
// Comment: "32px logo + 16px pb = 48px additional"
```

So the **intended mobile logo accounting is 48px**, not 64px.

Looking again at mobile logo:
- The logo itself is 32px height
- But it has `py: 2` which is padding
- The fixed Box visual space is: padding-top (16px) + image (32px) + padding-bottom (16px) = **64px total**
- But `mb: 4` (32px) is margin-bottom, which doesn't matter since it's fixed

Wait - let me re-read the changelog comment in CalendarEmbed:
```
v1.5.3 - STICKY FILTER OFFSET FIX: EventsFilters3 sticky position now accounts 
for PublicLayout mobile logo row (48px fixed height) on xs/sm.
```

And the daySectionStickyOffsetTop:
```jsx
const mobileLogoOffset = isMobileLogoPresent ? 48 : 0;
```

**So the system is designed for 48px logo offset, not 64px.**

But in CalendarEmbedLayout changelog:
```
v1.0.18 - MOBILE LOGO SCROLL FIX: Increased pb from 10 units (80px) to account 
for PublicLayout mobile logo row height (32px logo + 16px padding-bottom = 48px additional).
```

**Aha!** The calculation is:
- Logo image: 32px
- Padding-bottom only: 16px
- **Total: 48px** (ignoring padding-top since the logo is fixed at top: 0)

So **48px is correct** for sm. But **why is xs set to 16px?**

### Measurement Table

| Breakpoint | Filters `top` Value | Mobile Logo Height | Gap Between Logo and Filters | Correct? |
|------------|--------------------|--------------------|------------------------------|----------|
| xs         | 16px               | 48px               | **-32px (OVERLAP)**          | ❌ **WRONG** |
| sm         | 48px               | 48px               | 0px (flush)                  | ✅ Correct |
| md         | 0                  | N/A (hidden)       | N/A                          | ✅ Correct |

### Impact
- **xs users see filters overlapping mobile logo by 32px**
- Filters stick too early during scroll
- Day headers inherit this broken offset via `daySectionStickyOffsetTop`

### Root Cause Analysis
Looking at the changelog:
```
v1.5.3 - 2026-01-14 - STICKY FILTER OFFSET FIX: EventsFilters3 sticky position 
now accounts for PublicLayout mobile logo row (48px fixed height) on xs/sm. 
Changed top from 0 to responsive top: { xs: '48px', sm: '48px', md: 0 }.
```

But the actual code shows:
```jsx
top: { xs: '16px', sm: '48px', md: 0 }
```

**Conclusion:** The fix mentioned in v1.5.3 changelog **was not fully applied to xs**. The xs value remains at 16px instead of being updated to 48px.

---

## Critical Finding #2: PublicLayout pt Reduction Not Cascaded

### Location
**File:** [src/components/PublicLayout.jsx](src/components/PublicLayout.jsx#L157)  
**Line:** 157

### Current Code
```jsx
<Box
    component="main"
    sx={{
        flex: 1,
        pt: { xs: 4, sm: 4, md: 0 },  // Changed from pt: { xs: 8, sm: 8, md: 0 }
        // Comment says: "Mobile-first: account for fixed top logo on xs/sm"
    }}
>
```

### Changelog Entry
```
v1.0.32 - 2026-01-14 - REMOVE DOUBLE SPACING GAP: Fixed excessive gap between 
AppBar and content on md+ by removing main content pt on desktop. Changed 
pt: { xs: 8, md: 2 } → pt: { xs: 8, sm: 8, md: 0 }. Mobile (xs/sm) keeps 
pt: 8 (64px) to account for fixed brand logo (48px + 16px gap).

v1.0.31 - 2026-01-14 - RESPONSIVE TOP PADDING: Made main content pt responsive: 
pt: { xs: 8, md: 2 }. Changed pt: { xs: 8, md: 2 } (wait, this is confusing)
```

Wait, the changelog is contradictory. Let me trace:
- v1.0.31 says `pt: { xs: 8, md: 2 }`
- v1.0.32 says changed FROM `pt: { xs: 8, md: 2 }` TO `pt: { xs: 8, sm: 8, md: 0 }`
- But ACTUAL CODE shows: `pt: { xs: 4, sm: 4, md: 0 }`

**Discrepancy:** The code shows `pt: 4` but changelog says `pt: 8`.

Let me check if there was another change after v1.0.32... Reading the full changelog again:

I don't see any version after v1.0.32 that changes pt. So there's a **documentation/code mismatch**.

### Actual vs Expected Values

| Breakpoint | Current `pt` | Previous `pt` | Changelog Claims | Logo Height | Total Needed |
|------------|--------------|---------------|------------------|-------------|--------------|
| xs         | 4 (32px)     | 8 (64px)      | 8 (64px)         | 48px        | ~48-64px     |
| sm         | 4 (32px)     | 8 (64px)      | 8 (64px)         | 48px        | ~48-64px     |
| md         | 0            | 0             | 0                | N/A (hidden)| N/A          |

### Problem Analysis

**What the padding should account for:**
1. Mobile logo: 48px (32px img + 16px bottom padding)
2. Gap below logo: Some breathing room

**Current padding (32px) is insufficient** if we need 48px for logo + additional gap.

**But wait** - the logo is **fixed**, not in the document flow. So the padding's job is to **prevent content from going UNDER the fixed logo**.

Let me think about this differently:

- Logo is `position: fixed, top: 0`
- Logo height: 32px + py: 2 (16px top + 16px bottom) = 64px total
- Content needs to start BELOW this, so we need at least 64px top padding
- Current: 32px padding ❌
- Expected: 64px padding ✅

**But the changelog says logo is 48px, not 64px.**

Let me re-examine the logo Box:
```jsx
<Box
    component={RouterLink}
    to="/"
    sx={{
        position: { xs: 'fixed', sm: 'fixed', md: 'relative' },
        py: { xs: 2, sm: 2, md: 'unset' },    // 16px top + 16px bottom
        mb: 4,                                // 32px margin-bottom
    }}
>
    <Box component="img" sx={{ height: 32 }} />  // 32px image
</Box>
```

Total visual space occupied by fixed logo:
- Top padding: 16px
- Image: 32px  
- Bottom padding: 16px
- **Total: 64px**

The `mb: 4` (32px) doesn't matter since the logo is fixed and removed from flow.

**So why does the code comment say "48px + 16px gap"?**

Looking at the v1.0.32 changelog again:
```
Mobile (xs/sm) keeps pt: 8 (64px) to account for fixed brand logo (48px + 16px gap).
```

**Interpretation:** 48px logo + 16px gap = 64px total = pt: 8 (8 * 8px = 64px)

But the actual code shows `pt: 4` (32px). **This is half of what's needed.**

### Conclusion
**PublicLayout main Box `pt` should be 8 (64px) on xs/sm, but it's currently 4 (32px).**

This causes:
1. Content (CalendarEmbedLayout) starts 32px below where it should
2. Only 32px clearance for 64px fixed logo = **32px overlap**
3. Downstream sticky calculations are based on wrong reference point

---

## Critical Finding #3: CalendarEmbedLayout Height Constraint Conflict

### Location
**File:** [src/components/CalendarEmbedLayout.jsx](src/components/CalendarEmbedLayout.jsx#L103-L105)  
**Lines:** 103-105

### Current Code
```jsx
<Box
    sx={{
        backgroundColor: 'inherit',
        color: 'inherit',
        pt: 2,  // 16px
        pb: { xs: 'calc(10 * 8px + 48px)', sm: 'calc(10 * 8px + 48px)', md: 12 },
        // xs/sm: 80px + 48px = 128px
        // md: 12 * 8px = 96px
        minHeight: '100dvh',
        height: '100dvh',  // ← Forces full viewport height
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    }}
>
```

### Problem: Nested Height Constraints

**Parent (PublicLayout main Box):**
```jsx
maxHeight: {
    xs: 'calc(100vh - var(--t2t-bottom-nav-height, 64px))',  // = 100vh - 64px
    sm: 'calc(100vh - var(--t2t-bottom-nav-height, 64px))',  // = 100vh - 64px
    md: '100%',
}
```

**Child (CalendarEmbedLayout root Box):**
```jsx
minHeight: '100dvh',
height: '100dvh',  // = full viewport height
```

### Conflict Analysis

**On xs/sm breakpoints:**

1. **PublicLayout constrains content to:** `100vh - 64px` = **936px** (assuming 1000px viewport)
2. **CalendarEmbedLayout tries to be:** `100dvh` = **1000px**
3. **Winner:** Parent `maxHeight` wins, child is clipped to 936px
4. **But child thinks it's 1000px tall** for internal calculations

**Impact:**
- CalendarEmbedLayout believes it has 1000px height
- Actually gets 936px (clipped by parent)
- **64px of content is hidden/inaccessible**
- Scrolling behavior may be broken

### pb Formula Analysis

```jsx
pb: { xs: 'calc(10 * 8px + 48px)', sm: 'calc(10 * 8px + 48px)', md: 12 }
```

**Breaking down the xs/sm formula:**
- `10 * 8px` = 80px (standard bottom padding)
- `+ 48px` = additional space for mobile logo

**But wait - why add 48px for logo at the BOTTOM?**

The changelog says:
```
v1.0.18 - MOBILE LOGO SCROLL FIX: Increased pb from 10 units (80px) to account 
for PublicLayout mobile logo row height (32px logo + 16px pb = 48px additional). 
New formula: calc(10 * 8px + 48px) for xs/sm ensures calendar content can scroll 
all the way to bottom without being hidden by reserved space for bottom nav.
```

**Interpretation:** The extra 48px is NOT for the logo (which is at top), but for the **bottom navigation** (64px).

But `10 * 8px = 80px` is already more than the bottom nav (64px). So why add another 48px?

**Possible intent:**
- Standard bottom padding: 80px
- Bottom nav: 64px (already accounted for by PublicLayout maxHeight)
- Mobile logo offset: 48px (but this is at top, not bottom?)

**This formula seems confused.** It's adding padding for both bottom nav AND mobile logo, when:
- Bottom nav is handled by PublicLayout `maxHeight: calc(100vh - 64px)`
- Mobile logo is handled by PublicLayout `pt: 4` (though insufficient)

### Measurement Table

| Container | Intended Height | Actual Height | Difference | Notes |
|-----------|----------------|---------------|------------|-------|
| PublicLayout root | 100dvh (1000px) | 100dvh (1000px) | 0 | Correct |
| PublicLayout main | 100% | calc(100vh - 64px) = 936px | -64px | Constrained for bottom nav |
| CalendarEmbedLayout | 100dvh (1000px) | 936px (clipped by parent) | -64px | **Conflict** |
| Available scroll space | Should be ~800px | Actually ~680px | -120px | pb + clipping reduces space |

---

## Critical Finding #4: DaySection Sticky Offset Inheritance

### Location
**File:** [src/components/CalendarEmbed.jsx](src/components/CalendarEmbed.jsx#L1552-L1560)  
**Lines:** 1552-1560

### Current Code
```jsx
const daySectionStickyOffsetTop = useMemo(
    () => {
        // On xs/sm, filters stick at 48px (mobile logo height).
        // Day headers should account for this base offset plus filter height.
        // On md+, no mobile logo offset needed.
        const mobileLogoOffset = isMobileLogoPresent ? 48 : 0;
        return Math.max(0, mobileLogoOffset + filtersStickyHeight - (isXs ? 1 : 0));
    },
    [filtersStickyHeight, isXs, isMobileLogoPresent],
);
```

### Calculation Breakdown

**Inputs:**
- `isMobileLogoPresent`: `useMediaQuery(theme.breakpoints.down('sm'))` 
  - Returns `true` for xs AND sm
- `filtersStickyHeight`: Measured from DOM via ResizeObserver
  - Example: ~200px (varies with filter state)
- `isXs`: `useMediaQuery(theme.breakpoints.only('xs'))`
  - Returns `true` only for xs

**Calculation:**

| Breakpoint | isMobileLogoPresent | mobileLogoOffset | filtersStickyHeight | isXs? | -1px? | Result |
|------------|---------------------|------------------|---------------------|-------|-------|--------|
| xs         | true                | 48               | 200                 | true  | -1    | **247px** |
| sm         | true                | 48               | 200                 | false | 0     | **248px** |
| md         | false               | 0                | 200                 | false | 0     | **200px** |

### Problem Analysis

**The calculation ASSUMES filters stick at 48px on xs/sm.**

But from Finding #1, we know:
- **xs:** Filters actually stick at 16px (not 48px)
- **sm:** Filters correctly stick at 48px

**So on xs breakpoint:**

**Intended:**
```
DayHeader top = 48px (logo) + 200px (filters) - 1px = 247px
```

**Actual reality:**
```
Filters stick at 16px (not 48px)
DayHeader calculates 247px but should be:
  16px (actual filter top) + 200px (filters height) = 216px
  
Difference: 247px - 216px = 31px GAP between filters and day headers
```

**Result:** Day headers have a **31px gap** above them where they should be flush with filters.

### The "-1px Adjustment" Mystery

```jsx
- (isXs ? 1 : 0)
```

**Why subtract 1px only on xs?**

Looking at the comment in the code:
```jsx
return Math.max(0, mobileLogoOffset + filtersStickyHeight - (isXs ? 1 : 0));
```

No comment explaining the `-1px`. Likely added to fix a visual overlap bug, but:
- **Root cause not addressed** (filters at wrong top position)
- **Band-aid solution** that creates confusion

### Measurement When Scrolling

Assuming `filtersStickyHeight = 200px`:

**xs breakpoint:**
- Filters should be at top: 48px
- Filters actually at top: 16px (❌ Finding #1)
- Day header calculates: 247px
- Day header should be: 16px + 200px = 216px
- **Visual result:** 31px gap between filters and day headers

**sm breakpoint:**
- Filters at top: 48px (✅ correct)
- Day header calculates: 248px
- Day header should be: 48px + 200px = 248px
- **Visual result:** Correct, no gap

**md breakpoint:**
- No mobile logo
- Filters at top: 0px (✅ correct)
- Day header calculates: 200px
- Day header should be: 0px + 200px = 200px
- **Visual result:** Correct, no gap

---

## Critical Finding #5: filtersStickyHeight Measurement Timing

### Location
**File:** [src/components/CalendarEmbed.jsx](src/components/CalendarEmbed.jsx#L1529-L1548)  
**Lines:** 1529-1548

### Current Code
```jsx
useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const el = filtersBoxRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;

    const measure = () => {
        const rect = el.getBoundingClientRect();
        const next = Math.max(0, Math.round(rect.height));
        setFiltersStickyHeight((prev) => (prev === next ? prev : next));
    };

    measure();  // Initial measurement
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener('resize', measure);

    return () => {
        ro.disconnect();
        window.removeEventListener('resize', measure);
    };
}, []);
```

### Analysis

**What it measures:**
- `getBoundingClientRect().height` of the `filtersBoxRef` Box

**When it measures:**
1. Initial mount (synchronously)
2. On element resize (ResizeObserver)
3. On window resize

**Question: Does it measure visual height or DOM height?**

```jsx
const rect = el.getBoundingClientRect();
```

`getBoundingClientRect()` returns the **visual bounding box**, including:
- Content
- Padding
- Border
- **But NOT margin**

**The filters Box has:**
```jsx
<Box
    ref={filtersBoxRef}
    sx={{
        position: 'sticky',
        top: { xs: '16px', sm: '48px', md: 0 },
        mx: { xs: -1, sm: -1.25, md: -1.5 },  // Negative margin to extend full-width
        px: { xs: 1, sm: 1.25, md: 1.5 },     // Compensating padding
        pt: { xs: isMobileFiltersStuck ? 1 : 0, sm: isMobileFiltersStuck ? 1 : 0.25, md: 0 },
        pb: { xs: isMobileFiltersStuck ? 1 : 0, sm: isMobileFiltersStuck ? 1 : 0.25, md: 0 },
        borderBottom: '1px solid',
    }}
>
```

**Height changes when:**
- Filters expand/collapse
- `isMobileFiltersStuck` changes (affects pt/pb)
- Window resize changes text wrapping

### Potential Issues

1. **Timing lag:** ResizeObserver fires **asynchronously** after layout
2. **Measurement during stick transition:** When filters transition from unstuck to stuck, pt/pb change, triggering ResizeObserver, which updates `filtersStickyHeight`, which re-renders day headers
3. **Circular dependency:** Day header positions depend on filter height, but filter height depends on stuck state

### Does This Cause Visual Jank?

**Scenario:**
1. User scrolls down
2. Filters reach sticky threshold
3. `isMobileFiltersStuck` changes to `true`
4. Filters pt/pb increase (adding padding)
5. Filters height increases
6. ResizeObserver fires (asynchronous)
7. `setFiltersStickyHeight` updates state
8. Day headers recalculate `daySectionStickyOffsetTop`
9. Day headers re-render with new offset

**Result:** Potential for **1-2 frame delay** where day headers are at old position before jumping to new position.

**Severity:** Low (only noticeable on slow devices or during rapid scrolling)

---

## Z-Index Hierarchy Validation

### Current Z-Index Stack

| Element | Z-Index | Position | Breakpoint | Notes |
|---------|---------|----------|------------|-------|
| Mobile Logo | 100 | fixed | xs/sm | Should be below nav |
| EventsFilters3 | 1000 | sticky | all | Above day headers |
| DaySection header | 900 | sticky | all | Below filters |
| Table column headers | 899 | sticky | all | Below day headers |
| AppBar (top/bottom nav) | 1400 | sticky/fixed | all | Above everything |

### Stacking Context Analysis

**PublicLayout creates root stacking context:**
```jsx
<Box sx={{ position: relative (implicit), zIndex: auto }}>
  <Box mobile logo sx={{ position: fixed, zIndex: 100 }} />
  <Box AppBar sx={{ position: sticky, zIndex: 1400 }} />
  <Box main sx={{ position: relative (implicit) }}>
    <CalendarEmbedLayout>
      <CalendarEmbed>
        <Box filters sx={{ position: sticky, zIndex: 1000 }} />
        <DaySection>
          <Box header sx={{ position: sticky, zIndex: 900 }} />
          <TableHead>
            <TableCell sx={{ position: sticky, zIndex: 899 }} />
```

### Potential Conflicts

1. **Mobile logo (z-index: 100) vs AppBar (z-index: 1400)**
   - ✅ Correct: AppBar should be above logo
   - But mobile logo is `position: fixed` at `top: 0`
   - AppBar is `position: sticky` at `top: 0`
   - **When both are at top, AppBar wins** ✅

2. **Filters (z-index: 1000) vs AppBar (z-index: 1400)**
   - ✅ Correct: AppBar should be above filters
   - Filters stick at `top: 48px` (xs/sm, supposed to be)
   - AppBar sticks at `top: 0`
   - **They don't overlap** ✅

3. **Day headers (z-index: 900) vs Filters (z-index: 1000)**
   - ✅ Correct: Filters should be above day headers
   - Day headers stick at `top: 247px` (below filters)
   - **Headers scroll UNDER filters** ✅

4. **Column headers (z-index: 899) vs Day headers (z-index: 900)**
   - ✅ Correct: Day headers should be above column headers
   - **Column headers scroll UNDER day headers** ✅

### Unexpected Behavior

**On xs breakpoint, with filters at wrong offset (16px instead of 48px):**

```
Mobile Logo: fixed at 0, height 64px, z-index 100
AppBar: sticky at 0, z-index 1400
Filters: sticky at 16px (WRONG), z-index 1000
```

**Overlap zone:**
- Logo occupies 0-64px
- Filters stick at 16px
- **Filters overlap logo by 48px** (16px to 64px)

**Which wins?**
- Logo is `position: fixed, z-index: 100`
- Filters are `position: sticky, z-index: 1000`
- **Filters win** (higher z-index)

**Visual result:**
- Filters render ON TOP of logo ❌
- Logo text is partially obscured ❌

### Z-Index Hierarchy Verdict

**If filters were at correct position (48px on xs), z-index hierarchy would be correct.**

**Current state (filters at 16px on xs): z-index order is correct but positioning is wrong, causing unintended overlap.**

---

## Responsive Breakpoint Alignment

### MUI Breakpoints

```jsx
theme.breakpoints = {
    xs: 0,      // 0px and up
    sm: 600,    // 600px and up
    md: 900,    // 900px and up
    lg: 1200,   // 1200px and up
    xl: 1536    // 1536px and up
}
```

### useMediaQuery vs sx Props Timing

**Issue:** Do `useMediaQuery` hooks sync with `sx` prop breakpoint changes?

**Test case:**
```jsx
const isXs = useMediaQuery(theme.breakpoints.only('xs'));
const isMobileLogoPresent = useMediaQuery(theme.breakpoints.down('sm'));

// Used in calculations:
const daySectionStickyOffsetTop = useMemo(() => {
    const mobileLogoOffset = isMobileLogoPresent ? 48 : 0;
    return Math.max(0, mobileLogoOffset + filtersStickyHeight - (isXs ? 1 : 0));
}, [filtersStickyHeight, isXs, isMobileLogoPresent]);

// Applied to sx:
<Box sx={{
    top: { xs: '16px', sm: '48px', md: 0 }  // Responsive sx prop
}} />
```

**Potential race condition:**
1. Window resizes from 599px → 600px (xs → sm)
2. `useMediaQuery` triggers re-render (asynchronous)
3. `sx` prop changes (synchronous, applied immediately by MUI)
4. For 1-2 frames, `isMobileLogoPresent` may still be `true` while `sx` has already changed to sm

**Severity:** Low (1-2 frame mismatch during resize, negligible)

### Breakpoint Value Consistency

**Checking all responsive values:**

| Component | xs Value | sm Value | md Value | Consistent? |
|-----------|----------|----------|----------|-------------|
| PublicLayout pt | 4 (32px) | 4 (32px) | 0 | ✅ xs=sm |
| CalendarEmbedLayout pb | calc(80+48) | calc(80+48) | 12 (96px) | ✅ xs=sm |
| Filters top | 16px | 48px | 0 | ❌ **xs≠sm** |
| daySectionStickyOffsetTop | 48+fh-1 | 48+fh | 0+fh | ❌ **xs≠sm** (-1px diff) |

**Finding:** Filters `top` is the ONLY place where xs and sm diverge incorrectly.

---

## Mobile-First Design Compliance

### Best Practices Check

✅ **Do:** Start with xs, progressively enhance for larger breakpoints  
✅ **Do:** Use responsive sx props: `{ xs: value, md: value }`  
✅ **Do:** Account for fixed/sticky elements in viewport calculations  
✅ **Do:** Consistent spacing units (multiples of 8px)  
❌ **Don't:** Mix px strings and numeric units in responsive objects  
❌ **Don't:** Have xs≠sm when both are mobile breakpoints  

### Current Implementation Issues

1. **PublicLayout pt: { xs: 4, sm: 4 }**
   - ✅ Mobile-first (xs and sm are same)
   - ❌ Value too small (32px vs 64px needed)

2. **Filters top: { xs: '16px', sm: '48px', md: 0 }**
   - ❌ NOT mobile-first (xs≠sm without justification)
   - ❌ xs value incorrect
   - ⚠️ Mixing string px with numeric 0

3. **CalendarEmbedLayout height: '100dvh'**
   - ⚠️ Not responsive (same on all breakpoints)
   - ❌ Conflicts with parent maxHeight constraint

4. **daySectionStickyOffsetTop: isXs ? -1 : 0**
   - ❌ Magic number without documentation
   - ❌ Suggests xs is "broken" and needs band-aid

### Mobile-First Recommendations

**Pattern: Progressive enhancement**
```jsx
// ✅ Good: Same for xs/sm (mobile), different for md+ (desktop)
pt: { xs: 8, md: 0 }

// ❌ Bad: xs different from sm for no reason
top: { xs: '16px', sm: '48px', md: 0 }

// ✅ Good: Consistent units
pb: { xs: 12, md: 16 }

// ⚠️ Acceptable: String for calc, but prefer numeric when possible
pb: { xs: 'calc(10 * 8px + 48px)', md: 12 }
```

---

## Measurement Comparison: Actual vs Expected

### On xs Breakpoint (Phone Portrait: 375px × 667px)

| Element | Expected Height/Position | Actual Height/Position | Difference | Visual Impact |
|---------|-------------------------|------------------------|------------|---------------|
| Mobile Logo (fixed at top) | 0-64px (py: 2 + height: 32) | 0-64px | 0 | ✅ Correct |
| PublicLayout pt (clearance) | 64px | 32px | **-32px** | ❌ Insufficient |
| Content start position | 64px from top | 32px from top | **-32px** | ❌ Overlaps logo |
| Filters sticky top | 48px | 16px | **-32px** | ❌ Wrong position |
| Filters visible at | 48-248px | 16-216px | **-32px** | ❌ Overlaps logo |
| Day header sticky top | 248px (48+200) | 247px (calculated) but actually at ~216px (16+200) | **-32px** | ❌ Gap above header |
| Available scroll height | ~550px (667 - 64 logo - 53 AppBar) | ~518px (less due to overlap) | **-32px** | ❌ Less space |

### On sm Breakpoint (Tablet Portrait: 768px × 1024px)

| Element | Expected Height/Position | Actual Height/Position | Difference | Visual Impact |
|---------|-------------------------|------------------------|------------|---------------|
| Mobile Logo (fixed at top) | 0-64px | 0-64px | 0 | ✅ Correct |
| PublicLayout pt (clearance) | 64px | 32px | **-32px** | ⚠️ Insufficient but less noticeable |
| Content start position | 64px from top | 32px from top | **-32px** | ⚠️ Slight overlap |
| Filters sticky top | 48px | 48px | 0 | ✅ Correct |
| Filters visible at | 48-248px | 48-248px | 0 | ✅ Correct |
| Day header sticky top | 248px (48+200) | 248px | 0 | ✅ Correct |
| Available scroll height | ~907px (1024 - 64 logo - 53 AppBar) | ~875px | **-32px** | ⚠️ Slightly less space |

### On md Breakpoint (Desktop: 1440px × 900px)

| Element | Expected Height/Position | Actual Height/Position | Difference | Visual Impact |
|---------|-------------------------|------------------------|------------|---------------|
| Mobile Logo | N/A (hidden) | N/A | 0 | ✅ Correct |
| PublicLayout pt | 0 | 0 | 0 | ✅ Correct |
| AppBar sticky top | 0 | 0 | 0 | ✅ Correct |
| Filters sticky top | 0 | 0 | 0 | ✅ Correct |
| Day header sticky top | 200px (0+200) | 200px | 0 | ✅ Correct |
| Available scroll height | ~800px (900 - 100 chrome) | ~800px | 0 | ✅ Correct |

---

## Conflict Matrix

| Issue | PublicLayout | CalendarEmbedLayout | CalendarEmbed | Impact Level |
|-------|--------------|---------------------|---------------|--------------|
| **Logo clearance insufficient** | pt: 4 (32px) should be 8 (64px) | Assumes 64px clearance | Filters offset wrong | 🔴 **Critical** (xs) |
| **Filters xs top wrong** | N/A | N/A | top: 16px should be 48px | 🔴 **Critical** (xs) |
| **Height constraint conflict** | maxHeight: 100vh-64px | height: 100dvh | Clipped content | 🟡 Medium (xs/sm) |
| **pb formula unclear** | N/A | pb: calc(80+48) confusing | Excessive bottom padding | 🟡 Medium (xs/sm) |
| **Day header -1px band-aid** | N/A | N/A | isXs ? -1 : 0 unexplained | 🟢 Low (cosmetic) |
| **Measurement timing** | N/A | N/A | ResizeObserver async lag | 🟢 Low (1-2 frames) |

### Root Cause Chain

```
1. PublicLayout pt reduced from 8 → 4 (v1.0.32 intent not fully implemented)
   ↓
2. Filters top not updated on xs (remained 16px instead of 48px)
   ↓
3. DaySection calculates based on wrong filters position
   ↓
4. Visual layout breaks on xs: overlaps, gaps, incorrect sticking
```

---

## Formula Breakdown: Demystifying Calculations

### PublicLayout: Main Content Top Padding

**Current:**
```jsx
pt: { xs: 4, sm: 4, md: 0 }
// xs/sm: 4 * 8px = 32px
// md: 0px
```

**What it should account for:**
- Fixed mobile logo: 64px (32px img + 16px py-top + 16px py-bottom)
- Gap below logo: 16px (optional breathing room)
- **Total needed: 64-80px** → **pt: 8 to 10**

**Recommended:**
```jsx
pt: { xs: 8, sm: 8, md: 0 }
// xs/sm: 8 * 8px = 64px (matches logo height)
// md: 0px (no logo)
```

---

### CalendarEmbedLayout: Bottom Padding Formula

**Current:**
```jsx
pb: { xs: 'calc(10 * 8px + 48px)', sm: 'calc(10 * 8px + 48px)', md: 12 }
// xs/sm: 80px + 48px = 128px
// md: 12 * 8px = 96px
```

**Breaking down the intent:**
- `10 * 8px` = 80px (standard bottom padding for scrollable content)
- `+ 48px` = extra space (claimed to be for logo, but logo is at TOP)

**What it actually needs to account for:**
- Bottom navigation bar: 64px (handled by PublicLayout maxHeight)
- Standard padding: 80px (breathing room at bottom of scroll)
- **Total: ~80-96px** (not 128px)

**Recommended:**
```jsx
pb: { xs: 10, sm: 10, md: 12 }
// xs/sm: 10 * 8px = 80px (bottom nav is handled by parent maxHeight)
// md: 12 * 8px = 96px (slightly more for desktop)
```

**Reasoning:** The bottom nav constraint is already handled by PublicLayout `maxHeight: calc(100vh - 64px)`, so adding an extra 48px for "logo" at the bottom makes no sense.

---

### EventsFilters3: Sticky Top Offset

**Current:**
```jsx
top: { xs: '16px', sm: '48px', md: 0 }
```

**What it should account for:**

| Breakpoint | Fixed Elements Above | Required Offset |
|------------|---------------------|-----------------|
| xs         | Mobile logo (64px visual, but use 48px for consistency) | **48px** |
| sm         | Mobile logo (same) | **48px** |
| md         | None (logo hidden) | **0** |

**Recommended:**
```jsx
top: { xs: '48px', sm: '48px', md: 0 }
// Or for consistency:
top: { xs: 6, sm: 6, md: 0 }  // 6 * 8px = 48px
```

**Rationale:** Despite logo being 64px tall, the codebase consistently uses 48px as the "mobile logo offset" (see CalendarEmbedLayout pb formula, daySectionStickyOffsetTop). Stick with 48px for consistency, or change all to 64px for accuracy.

---

### DaySection: Sticky Offset Top Calculation

**Current:**
```jsx
const mobileLogoOffset = isMobileLogoPresent ? 48 : 0;
return Math.max(0, mobileLogoOffset + filtersStickyHeight - (isXs ? 1 : 0));
```

**Breaking down:**

| Breakpoint | isMobileLogoPresent | mobileLogoOffset | filtersStickyHeight | isXs ? -1 : 0 | Result |
|------------|---------------------|------------------|---------------------|---------------|--------|
| xs         | true                | 48               | 200 (example)       | -1            | **247px** |
| sm         | true                | 48               | 200                 | 0             | **248px** |
| md         | false               | 0                | 200                 | 0             | **200px** |

**What it should be (if filters were at correct position):**

```
DayHeader top = Filters top + Filters height
```

| Breakpoint | Filters top | Filters height | Correct DayHeader top |
|------------|-------------|----------------|-----------------------|
| xs         | 48px        | 200px          | **248px**             |
| sm         | 48px        | 200px          | **248px**             |
| md         | 0           | 200px          | **200px**             |

**Recommended (remove -1px band-aid):**
```jsx
const mobileLogoOffset = isMobileLogoPresent ? 48 : 0;
return Math.max(0, mobileLogoOffset + filtersStickyHeight);
// Removed the (isXs ? 1 : 0) adjustment - it's a symptom, not a fix
```

**Why remove -1px:** It's trying to compensate for the wrong filters top on xs (16px instead of 48px). Once filters are fixed, this band-aid is unnecessary.

---

## Summary of Root Causes

### 1. PublicLayout pt Insufficient (v1.0.32 Implementation Error)

**Changelog claims:**
```
v1.0.32 - Mobile (xs/sm) keeps pt: 8 (64px) to account for fixed brand logo (48px + 16px gap).
```

**Actual code:**
```jsx
pt: { xs: 4, sm: 4, md: 0 }  // 32px, not 64px
```

**Impact:** All downstream calculations are based on wrong baseline. Content starts 32px too high, overlapping mobile logo.

---

### 2. EventsFilters3 xs top Not Updated (v1.5.3 Incomplete Fix)

**Changelog claims:**
```
v1.5.3 - Changed top from 0 to responsive top: { xs: '48px', sm: '48px', md: 0 }.
```

**Actual code:**
```jsx
top: { xs: '16px', sm: '48px', md: 0 }  // xs is 16px, not 48px
```

**Impact:** Filters on xs breakpoint stick 32px too high, overlapping mobile logo. Day headers inherit this wrong offset.

---

### 3. CalendarEmbedLayout pb Formula Confusion

**Formula:**
```jsx
pb: { xs: 'calc(10 * 8px + 48px)', sm: 'calc(10 * 8px + 48px)', md: 12 }
// 128px on xs/sm
```

**Unclear intent:** Why add 48px for "mobile logo" at the BOTTOM of the layout? Logo is at TOP.

**Impact:** Excessive bottom padding (128px) reduces usable scroll space. May be trying to compensate for missing top padding.

---

### 4. Height Constraint Conflict

**Parent:** `maxHeight: calc(100vh - 64px)` (936px on 1000px viewport)  
**Child:** `height: 100dvh` (1000px)  
**Conflict:** Child is clipped by parent, but internal calculations assume full height.

**Impact:** Content may be hidden or scroll behavior broken.

---

### 5. Magic -1px Adjustment

**Code:**
```jsx
return Math.max(0, mobileLogoOffset + filtersStickyHeight - (isXs ? 1 : 0));
```

**Purpose:** Undocumented band-aid to fix visual overlap on xs.

**Impact:** Symptom of root cause (wrong filters top), not a fix. Creates confusion.

---

## Recommendations for Fix Implementation

### Priority 1: Fix xs Filters Top (Critical)

**File:** [src/components/CalendarEmbed.jsx](src/components/CalendarEmbed.jsx#L2177)

**Change:**
```jsx
// Current:
top: { xs: '16px', sm: '48px', md: 0 }

// Fix to:
top: { xs: '48px', sm: '48px', md: 0 }
// Or for consistency with MUI unit system:
top: { xs: 6, sm: 6, md: 0 }  // 6 * 8px = 48px
```

**Impact:** Immediately fixes xs overlap issue.

---

### Priority 2: Fix PublicLayout pt (Critical)

**File:** [src/components/PublicLayout.jsx](src/components/PublicLayout.jsx#L157)

**Change:**
```jsx
// Current:
pt: { xs: 4, sm: 4, md: 0 }

// Fix to:
pt: { xs: 8, sm: 8, md: 0 }  // 8 * 8px = 64px to match logo height
```

**Update changelog to match actual code:**
```
v1.0.33 - 2026-01-14 - MOBILE CLEARANCE FIX: Restored pt: { xs: 8, sm: 8, md: 0 } 
to properly account for 64px fixed mobile logo (32px img + 32px py). Previous 
reduction to pt: 4 caused content to overlap logo on xs/sm breakpoints.
```

---

### Priority 3: Remove -1px Band-Aid (Low)

**File:** [src/components/CalendarEmbed.jsx](src/components/CalendarEmbed.jsx#L1558)

**Change:**
```jsx
// Current:
return Math.max(0, mobileLogoOffset + filtersStickyHeight - (isXs ? 1 : 0));

// Fix to:
return Math.max(0, mobileLogoOffset + filtersStickyHeight);
```

**Reasoning:** Once filters top is fixed, the -1px is unnecessary.

---

### Priority 4: Simplify CalendarEmbedLayout pb (Medium)

**File:** [src/components/CalendarEmbedLayout.jsx](src/components/CalendarEmbedLayout.jsx#L104)

**Change:**
```jsx
// Current:
pb: { xs: 'calc(10 * 8px + 48px)', sm: 'calc(10 * 8px + 48px)', md: 12 }

// Fix to:
pb: { xs: 10, sm: 10, md: 12 }  // Standard bottom padding only
```

**Reasoning:** Bottom nav is handled by PublicLayout maxHeight. Extra 48px is redundant and confusing.

---

### Priority 5: Resolve Height Conflict (Medium)

**File:** [src/components/CalendarEmbedLayout.jsx](src/components/CalendarEmbedLayout.jsx#L105-L106)

**Option A: Remove child height constraint**
```jsx
// Current:
minHeight: '100dvh',
height: '100dvh',

// Fix to:
minHeight: 0,  // Let parent control height
height: 'auto',
```

**Option B: Make it responsive**
```jsx
// Fix to:
minHeight: { xs: 'calc(100dvh - 64px)', sm: 'calc(100dvh - 64px)', md: '100dvh' },
height: { xs: 'calc(100dvh - 64px)', sm: 'calc(100dvh - 64px)', md: '100dvh' },
```

**Recommendation:** Option A (simpler, follows flex-child best practices)

---

### Priority 6: Align Changelog with Code (Documentation)

**File:** [src/components/PublicLayout.jsx](src/components/PublicLayout.jsx#L6-L7)

**Issue:** Changelog says `pt: 8` but code shows `pt: 4`

**Action:** After fixing code to `pt: 8`, verify changelog matches.

---

## Testing Checklist

After implementing fixes, verify:

### xs Breakpoint (375px × 667px)
- [ ] Mobile logo visible at top (0-64px)
- [ ] Content starts at 64px (no overlap with logo)
- [ ] Filters stick at 48px when scrolling
- [ ] No gap between filters and day headers
- [ ] Day headers scroll behind filters (not above)
- [ ] Bottom content not cut off by bottom nav
- [ ] Total scrollable height is ~550px

### sm Breakpoint (768px × 1024px)
- [ ] Mobile logo visible at top
- [ ] Content starts at 64px
- [ ] Filters stick at 48px
- [ ] Day headers flush with filters
- [ ] Smooth scrolling behavior
- [ ] Bottom content visible

### md Breakpoint (1440px × 900px)
- [ ] No mobile logo (hidden)
- [ ] AppBar sticky at top
- [ ] Filters stick at top: 0
- [ ] Day headers stick below filters
- [ ] No unexpected gaps or overlaps

### Transition Tests
- [ ] Resize from xs → sm: No layout jump
- [ ] Resize from sm → md: Logo disappears smoothly
- [ ] Resize from md → sm: Logo appears smoothly

---

## Detailed Diagram: Current vs Fixed State

### Current State (Broken on xs)

```
Viewport: 375px × 667px (iPhone portrait)

0px   ┌─────────────────────────────────────┐
      │ Mobile Logo (fixed, z:100)          │
      │ Height: 64px (32 img + 32 py)       │
      │                                     │
64px  └─────────────────────────────────────┘
      │ ← PublicLayout pt: 4 (32px)         │ ← TOO SMALL
      │    Content should start here ↓      │
96px  │                                     │
      │                                     │
      ├─────────────────────────────────────┤
      │ EventsFilters3 (sticky, z:1000)     │ ← WRONG POSITION
      │ Sticks at top: 16px                 │ ← SHOULD BE 48px
      │ Height: ~200px                      │
      │ OVERLAPS LOGO BY 48px!              │
      └─────────────────────────────────────┘
      ┌─────────────────────────────────────┐
      │ DaySection Header (sticky, z:900)   │
      │ Sticks at calculated 247px          │
      │ 31px GAP here (visual break)        │
      └─────────────────────────────────────┘
      │ Event rows...                       │
      │                                     │
603px │                                     │ ← maxHeight constraint
      └─────────────────────────────────────┘
      (Bottom nav occupies 603-667px)
```

### Fixed State (Correct)

```
Viewport: 375px × 667px (iPhone portrait)

0px   ┌─────────────────────────────────────┐
      │ Mobile Logo (fixed, z:100)          │
      │ Height: 64px                        │
      │                                     │
64px  └─────────────────────────────────────┘
      │ ← PublicLayout pt: 8 (64px) ✅      │
      │    Content starts clear of logo     │
      │                                     │
      │                                     │
      ┌─────────────────────────────────────┐
      │ EventsFilters3 (sticky, z:1000)     │ ✅ CORRECT
      │ Sticks at top: 48px                 │ ✅ Below logo
      │ Height: ~200px                      │
      │ NO OVERLAP                          │
      └─────────────────────────────────────┘
      ┌─────────────────────────────────────┐
      │ DaySection Header (sticky, z:900)   │ ✅ FLUSH
      │ Sticks at 248px (48 + 200)          │
      │ NO GAP                              │
      └─────────────────────────────────────┘
      │ Event rows...                       │
      │                                     │
603px │                                     │ ← maxHeight constraint
      └─────────────────────────────────────┘
      (Bottom nav occupies 603-667px)
```

---

## Files Requiring Changes (Summary)

1. **[src/components/CalendarEmbed.jsx](src/components/CalendarEmbed.jsx)**
   - Line 2177: Change `top: { xs: '16px', ...}` → `top: { xs: '48px', ...}`
   - Line 1558: Remove `- (isXs ? 1 : 0)` from calculation
   - Update changelog (v1.5.5)

2. **[src/components/PublicLayout.jsx](src/components/PublicLayout.jsx)**
   - Line 157: Change `pt: { xs: 4, ...}` → `pt: { xs: 8, ...}`
   - Line 6-7: Update changelog to match code (v1.0.33)

3. **[src/components/CalendarEmbedLayout.jsx](src/components/CalendarEmbedLayout.jsx)**
   - Line 104: Simplify `pb` formula (remove + 48px)
   - Line 105-106: Remove or adjust `height: 100dvh` constraint
   - Update changelog (v1.0.21)

---

## Conclusion

This audit reveals a **cascade of positioning errors** originating from two incomplete changelog implementations:

1. **v1.0.32 (PublicLayout):** Changelog claims `pt: 8` but code has `pt: 4`
2. **v1.5.3 (CalendarEmbed):** Changelog claims `top: { xs: '48px' }` but code has `top: { xs: '16px' }`

These errors compound to create:
- **32px overlap** between mobile logo and content on xs/sm
- **32px misalignment** of sticky filters on xs
- **31px gap** between filters and day headers on xs
- **Reduced scrollable area** due to excessive padding

**All issues are fixable with 3-5 line changes** to responsive sx props. No architectural refactoring required.

**Critical path:** Fix CalendarEmbed filters top (xs: 16px → 48px) first for immediate visual improvement. Then fix PublicLayout pt for correct baseline.

---

**Audit completed:** January 14, 2026  
**Next steps:** Implement Priority 1 & 2 fixes, test on real devices, update documentation.
