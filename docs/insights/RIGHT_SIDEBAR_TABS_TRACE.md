# Right-Column Tabs — Architecture Trace

**Created:** 2026-02-09  
**Purpose:** Document the existing right-column tabbed panel system so any new tab (Insights, etc.) can be added without layout regressions.

---

## 1. Key Files

| File | Role |
|------|------|
| `src/components/layouts/MainLayout.jsx` (v2.0.0) | Two-column grid: `left` (2fr) + right (1fr). Accepts `right` (plain Paper) **or** `rightTabs` (tabbed panel). Lazy-imports `TabbedStickyPanel`. |
| `src/components/layouts/TabbedStickyPanel.jsx` (v1.0.0) | Chrome-like tab bar + Paper content area. Handles tab switching, session persistence (per-route via `Map`), sticky positioning, vertical scroll inside Paper. |
| `src/pages/Calendar2Page.jsx` | **First consumer** of `rightTabs`. Passes `[{ key:'clock', label, icon, content }, { key:'tab2', label, icon, content }]` to `MainLayout`. |
| `src/pages/BlogPostPage.jsx` | Uses `right=` prop (plain Paper mode). **Candidate for upgrade** to `rightTabs` when Insights tab is added. |

---

## 2. Component Contract

### MainLayout

```jsx
<MainLayout
  left={<LeftContent />}
  // Mode A: Plain (single Paper)
  right={<SidebarContent />}
  // Mode B: Tabbed (Chrome tabs)
  rightTabs={[
    { key: 'related', label: 'Related', icon: <Icon />, content: <RelatedPosts /> },
    { key: 'insights', label: 'Insights', icon: <Icon />, content: <InsightsPanel /> },
  ]}
  gap={3}
  stickyTop={16}    // 0 on Calendar (flush), 16 on BlogPost
  sx={{}}
/>
```

**Rules:**
- Use `right` **or** `rightTabs`, never both.
- `rightTabs` must be `Array<{ key?: string, label: string, icon?: ReactNode, content: ReactNode }>`.
- `label` should use `t()` for i18n.
- `content` is wrapped in `<Suspense>` internally (safe for lazy components).

### TabbedStickyPanel

```jsx
<TabbedStickyPanel tabs={[...]} stickyTop={16} />
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `Array<{ key?, label, icon?, content }>` | Required | Tab definitions |
| `stickyTop` | `number` | `16` | Distance from viewport top for sticky (md+) |

---

## 3. How to Add a Tab (Step-by-Step)

### On a page already using `rightTabs` (e.g., Calendar2Page)

1. Define the tab content as a variable:
   ```jsx
   const insightsContent = (
     <InsightsPanel context={{ ... }} />
   );
   ```

2. Add to the `rightTabs` array:
   ```jsx
   const rightTabs = [
     { key: 'clock', label: t('calendar:tabs.clock'), icon: <AccessTimeIcon />, content: clockTabContent },
     { key: 'insights', label: t('insights:title'), icon: <InsightsIcon />, content: insightsContent },
   ];
   ```

3. TabbedStickyPanel handles everything else (tab switching, persistence, scroll, ARIA).

### On a page using `right=` prop (e.g., BlogPostPage) — Upgrade to tabs

1. Convert `right={<SidebarContent />}` to `rightTabs`:
   ```jsx
   // Before:
   <MainLayout left={leftContent} right={sidebarContent} stickyTop={16} />
   
   // After:
   <MainLayout
     left={leftContent}
     rightTabs={[
       { key: 'related', label: t('blog:postPage.relatedArticles'), content: sidebarContent },
       { key: 'insights', label: t('insights:title'), icon: <InsightsIcon />, content: <InsightsPanel context={{ postId, eventTags, currencyTags }} /> },
     ]}
     stickyTop={16}
   />
   ```

2. Remove the `right=` prop entirely (mutually exclusive with `rightTabs`).

---

## 4. Layout Constraints

### Sticky Behavior (md+)

- **Outer wrapper** (Grid cell): Must stretch to full row height (`alignItems: stretch` — grid default). No `alignSelf: flex-start` — breaks sticky.
- **TabbedStickyPanel root**: `position: sticky`, `top: stickyTop`, `maxHeight: calc(100vh - stickyTop - 16px)`.
- **Paper**: `flex: 1`, `minHeight: 0`, `overflowY: auto` — scrolls content internally.

### Height Calculation

```
maxHeight = 100vh - stickyTop - 16px (breathing room)
```

- Calendar: `stickyTop=0` → maxHeight = `calc(100vh - 16px)`
- BlogPost: `stickyTop=16` → maxHeight = `calc(100vh - 32px)`

### Mobile (xs/sm)

- `position: static` — stacks below left column.
- No sticky, no maxHeight cap.
- Bottom padding: `pb: { xs: 1.5, sm: 1.5, md: 0 }` — gap above fixed bottom AppBar.

### Tab Bar

- Chrome-style rounded top corners (`borderRadius: '10px 10px 0 0'`).
- Active tab merges with Paper via `borderBottom: none` + `mb: -1px`.
- Inactive tabs unmounted for performance.
- Session-level persistence via `Map` keyed by `pathname` (resets on full reload).

### Z-Index

- No special z-index needed for tabs or Paper.
- TabbedStickyPanel sits inside the grid cell — no stacking context conflicts.

### Tab Content Sizing

- Content fills Paper via flex layout.
- **DO NOT** set fixed heights on tab content — let Paper's `overflowY: auto` handle scroll.
- If content needs its own scroll (e.g., timeline), use `overflowY: auto` on a child with `flex: 1` + `minHeight: 0`.

---

## 5. Accessibility

- Tab bar: `role="tablist"`
- Each tab: `role="tab"`, `aria-selected`, `aria-controls`
- Panel: `role="tabpanel"`, `aria-labelledby`
- Tab switching is instant (no animation delay).

---

## 6. Existing Consumers

| Page | Mode | stickyTop | Tabs |
|------|------|-----------|------|
| Calendar2Page | `rightTabs` | `0` | Clock, Tab2 (placeholder) |
| BlogPostPage | `right=` (plain) | `16` | N/A — upgrade needed for Insights |

---

## 7. Integration Checklist for Insights

- [ ] Create `InsightsPanel` component (accepts `context` + `filters` props)
- [ ] Add `insights` i18n namespace (EN/ES/FR)
- [ ] Add `insights` to `ns:` preload list in `src/i18n/config.js`
- [ ] BlogPostPage: Convert `right=` → `rightTabs` with Related + Insights tabs
- [ ] Calendar2Page: Replace placeholder Tab2 with Insights tab
- [ ] Verify no layout regressions on mobile (xs), tablet (sm), desktop (md+)
- [ ] Verify sticky scroll works with Insights content of varying heights
- [ ] Test tab persistence: switch tabs, navigate away, come back → same tab remembered
