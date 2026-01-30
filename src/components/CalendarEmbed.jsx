/**
 * src/components/CalendarEmbed.jsx
 * 
 * Purpose: Two-panel, Airbnb-inspired economic calendar surface that reuses EventsFilters3, groups events by day,
 * and stays embeddable for other pages while keeping Time 2 Trade branding and SEO-friendly copy.
 * 
 * Changelog:
 * v1.5.91 - 2026-01-29 - BEP TABLE LAYOUT STABILITY: Fixed column width layout shift on initial render. Added <colgroup> with <col> elements matching TABLE_COLUMNS widths for immediate column sizing before content paints. Changed 'name' column from implicit auto to explicit width:'auto'. Removed conflicting width:'100%' from EventRow name cell. tableLayout:fixed + colgroup ensures columns are sized correctly on first render, preventing event name from wrapping incorrectly during load. Enterprise BEP pattern: colgroup defines column contract, tableLayout:fixed enforces it.
 * v1.5.90 - 2026-01-29 - BEP HEADER BUTTON ORDERING: Reordered right-side header buttons on xs/sm/md. Add event button now appears above Next/Now buttons when stacking vertically. Improves visual hierarchy: primary CTA (Add event) gets top position, secondary status info (Next/Now) follows below. On lg+, horizontal layout unaffected. Follows enterprise pattern: primary actions before secondary information.
 * v1.5.89 - 2026-01-29 - BEP RESPONSIVE HEADER RESTRUCTURE: Reorganized header layout for mobile-first approach. (1) On xs/sm/md: Next/Now buttons now appear in right column below Add custom event button, stacking vertically. (2) Bottom row now only displays event count on xs/sm/md (Next/Now buttons removed). (3) On lg+: Next/Now buttons appear inline with Add button in horizontal layout. (4) Right side header uses responsive flexDirection: column on xs/sm/md, row on lg+. Improves vertical space usage on mobile while maintaining horizontal efficiency on desktop. Follows enterprise dashboard responsive pattern: compact mobile layout, expanded desktop layout.
 * v1.5.88 - 2026-01-29 - BEP RESPONSIVE HEADER LAYOUT: Moved "Next in" and "Events in progress" buttons to top-right corner on lg+ breakpoints, positioned next to the Add custom event button. On xs/sm/md, buttons remain below the subtitle for better mobile layout. Bottom row now uses responsive display: { xs: 'flex', sm: 'flex', md: 'flex', lg: 'none' }. Top right header area now flexes properly to accommodate both Next/Now buttons and Add button on lg+. Follows enterprise dashboard pattern: desktop shows maximum information density in header, mobile-first approach preserves readability on smaller screens.
 * v1.5.87 - 2026-01-29 - BEP CHIP PARITY: Updated "Next in" and "Events in progress" buttons in header (below Powered by Forex Factory) to match filter chip styling. Changed from colored text to theme-aware outline button style. Default state uses background.paper with subtle border. Hover state adds progressive disclosure with alpha(success/info.main, 0.08) background and colored border. Active state uses alpha(0.12). Pill shape (borderRadius: 999) with proper padding and smooth transitions. Text color now uses text.primary instead of success/info.main for better contrast. Icons remain colored for quick visual scan.
 * v1.5.86 - 2026-01-29 - BEP VIRTUAL SCROLL ENHANCEMENTS: (1) Added IntersectionObserver with 400px rootMargin to prefetch DaySections 2 days ahead. (2) Progressive event rendering - events render in batches of 5 with skeleton placeholders for remaining. (3) "No events" only shown after hasBeenVisible confirmed. (4) Skeletons shown during content-visibility paint for slow devices. Improves perceived performance on all devices.
 * v1.5.85 - 2026-01-29 - BEP PERFORMANCE: Added CSS content-visibility: auto to DaySection for browser-native virtualization. Off-screen day sections skip rendering until scrolled into view. Estimated containIntrinsicSize based on header + event rows. Improves scroll performance for large date ranges (30+ days) without complex react-window table refactoring.
 * v1.5.84 - 2026-01-28 - BEP UX: Day headers now use distinct background colors for better visual hierarchy. Light mode: grey.50 (#fafafa), dark mode: grey.900 (#212121). Both are opaque and subtly different from column headers (background.paper) for clear visual separation.
 * v1.5.83 - 2026-01-28 - BEP CASCADING STICKY: Removed boxShadow from day headers. Column headers below already have boxShadow ('0 2px 4px -2px rgba(0, 0, 0, 0.12)') for proper cascading sticky effect. This creates visual separation at the frozen column level instead of day level.
 * v1.5.82 - 2026-01-28 - BEP OPAQUE HEADER FIX: Changed non-today day header bgcolor from 'action.hover' (semi-transparent) to 'background.paper' (fully opaque). action.hover has transparency in both light and dark modes causing content bleed-through when headers are sticky. background.paper provides solid #FFFFFF (light) and #1E1E1E (dark) backgrounds that completely hide scrolling content. Today headers remain primary.main (already opaque). Fixes transparency issue in sticky headers.
 * v1.5.81 - 2026-01-28 - BEP STICKY HEADER VISIBILITY: Added boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)' to sticky day headers to prevent content from bleeding through when headers are fixed at top. Solid background alone wasn't sufficient to hide scrolling content behind sticky positioned element. Shadow provides visual separation and depth, ensuring headers remain visually distinct from scrolling content in both light and dark modes. Enterprise BEP pattern: sticky/fixed positioned elements need visual layering (shadow) to prevent bleed-through.
 * v1.5.80 - 2026-01-28 - BEP NO TRANSPARENCY: Removed transparency from day header chips. Today chips now use solid bgcolor: common.white with color: primary.main for maximum visibility. Non-today chips use solid bgcolor: action.disabled with color: text.primary. Replaces previous alpha(0.2) and alpha(0.12) transparency with opaque theme tokens. Improves visual hierarchy and accessibility in both light and dark modes.
 * v1.5.79 - 2026-01-28 - BEP THEME-AWARE DAY HEADERS: Changed day header bgcolor from hardcoded 'grey.100' to theme-aware 'action.hover' for non-today headers. Today headers remain 'primary.main' (unchanged). Day headers now adapt to light/dark theme modes: light mode shows subtle hover background, dark mode shows appropriate dark surface. Ensures consistency with theme tokens and enterprise standards.
 * v1.5.78 - 2026-01-28 - BEP THEME: Replaced hardcoded colors with theme tokens throughout component. Changed scrollbar rgba(60,77,99) colors to theme.palette.action.disabled/active, #9e9e9e gray to theme.palette.text.disabled, #fff/#1f1f1f badge text colors to theme-aware conditionals, #ffffff backgrounds to theme.palette.background.paper, checkbox blue to theme.palette.primary.main. All colors now adapt to light/dark theme modes dynamically.
 * v1.5.77 - 2026-01-29 - BEP i18n FIX: Day headers now language-aware. Changed displayDate useMemo to use Intl.DateTimeFormat(i18n.language, ...) instead of formatDate utility. Added i18n.language to dependency array so headers update immediately when user switches language via LanguageSwitcher. Day headers now show correct locale format: "Monday, January 27, 2026" → "Lunes, 27 de enero de 2026" → "Lundi 27 janvier 2026".
 * v1.5.76 - 2026-01-29 - BEP i18n FIX: Removed 'calendar:' namespace prefix from all TABLE_COLUMNS labelKey values. Keys should be 'table.headers.time' not 'calendar:table.headers.time' since useTranslation is already initialized with 'calendar' namespace. This fixes table headers displaying translation keys instead of translated text (e.g., "table.headers.time" instead of "Time").
 * v1.5.75 - 2026-01-27 - BEP i18n FIX: Changed title prop default from hardcoded 'Economic Calendar' to null. Component now uses t('calendar:title') for dynamic language switching. Title prop still supported for override if needed.
 * v1.5.74 - 2026-01-27 - BEP i18n migration: Replaced 2 remaining hardcoded aria-labels with t() calls (Events on date, close button). All tooltips were already using t() keys. 100% i18n compliant for EN/ES/FR.
 * v1.5.73 - 2026-01-24 - BEP i18n migration: Added useTranslation hook, converted 45+ hardcoded strings to t() calls for calendar namespace
 * v1.5.72 - 2026-01-23 - BEP FIX: Favorites toggle not firing. Added e.preventDefault() to click handlers, onTouchEnd handlers for mobile support, span click delegation, inline-flex span styling, and ungated diagnostic console.logs to trace click flow. Addresses issue where favorites heart click did nothing on calendar rows.
 * v1.5.71 - 2026-01-23 - BEP: Add gated favorites click diagnostics.
 * v1.5.70 - 2026-01-22 - BEP: Ensure recurring custom event edits/deletes target the series id.
 * v1.5.69 - 2026-01-22 - BEP UX: Show skeletons immediately on filter apply by setting isLoadingNewRange=true synchronously in handleApplyFiltersGuard. Prevents "No events" flash during filter transitions.
 * v1.5.68 - 2026-01-22 - BEP FIX: Pass hasCustomEvents={customEvents?.length > 0} to EventsFilters3 so CUS currency option appears when custom events exist. Added handleOpenCustomDialog to useMemo dependencies.
 * v1.5.67 - 2026-01-22 - BEP FIX: Apply currency filter to custom events. Custom events now only show when CUS is selected or no currency filter is active. Prevents N/A filter from showing custom events.
 * v1.5.64 - 2026-01-22 - BEP: Allow non-auth users to open CustomEventDialog and fill values. Auth check moved from handleOpenCustomDialog to handleSaveCustomEvent. Shows AuthModal2 when trying to save without auth.
 * v1.5.63 - 2026-01-22 - BEP: Show 'Add event' text on xs breakpoint (shorter label for mobile), 'Add custom event' on sm+. Icon+text centered with startIcon and proper flex alignment.
 * v1.5.62 - 2026-01-22 - BEP: Show 'Add custom event' button on xs/sm/md breakpoints (lg+ shows in EventsFilters3). Icon-only on xs (36px pill), icon+text on sm/md (40px pill). Responsive sizing for mobile-first UX.
 * v1.5.61 - 2026-01-22 - BEP: Show 'Add custom event' button in header top-right on md breakpoint (absolute positioned). On lg+, button appears in EventsFilters3 filter row (right-aligned). Hides on xs/sm for cleaner mobile layout. Responsive behavior optimized for each breakpoint.
 * v1.5.60 - 2026-01-22 - BEP: Move 'Add custom event' button from top-right section to EventsFilters3 component aligned right on lg+ breakpoints. Button now uses primary.main chip styling (contained variant, pill shape, icon+text). Removes button from CalendarEmbed header and passes handleOpenCustomDialog callback to EventsFilters3 via onOpenAddEvent prop. Cleaner layout, consistent button styling.
 * v1.5.59 - 2026-01-22 - BEP: Hide the Add custom event button on xs to reduce visual clutter on extra-small screens.
 * v1.5.58 - 2026-01-22 - BEP: Custom events now open in EventModal (view mode) instead of directly opening CustomEventDialog. Added Edit button in EventModal header for custom events that opens CustomEventDialog at z-index 12003. Improved view/edit flow consistency with economic events.
 * v1.5.57 - 2026-01-22 - BEP: Null/missing currency now shows CancelRoundedIcon + 'N/A' with 'Unknown' tooltip (instead of world icon + 'ALL'). Custom event tooltip changed from impact label to 'Custom event'. Improved currency badge clarity.
 * v1.5.57 - 2026-01-22 - BEP: Change "Add custom event" button to show icon-only on xs/sm and text+icon on sm+. Responsive display improves mobile UX without sacrificing clarity on desktop.
 * v1.5.56 - 2026-01-22 - BEP: Treat currency 'ALL' the same as null/missing currency - display world icon + 'ALL' text instead of plain chip.
 * v1.5.55 - 2026-01-22 - BEP: Replace settings gear icon in trading clock panel with Add icon. The Add button opens CustomEventDialog to create new reminders. Settings are still accessible via AppBar or SettingsSidebar2.
 * v1.5.54 - 2026-01-22 - GLOBAL NOTIFICATION SCOPE: Removed useCustomEventNotifications hook, NotificationCenter component, and related imports. Notifications now managed globally in App.jsx and distributed via PublicLayout to AppBar (md+) and mobile header (xs/sm). Simplifies CalendarEmbed to focus on event data display, improves notification consistency across entire app.
 * v1.5.53 - 2026-01-22 - BEP: Update "Add custom event" button borderRadius from 1.5 to 999 (pill shape) to match filter chips styling.
 * v1.5.52 - 2026-01-22 - BEP: Change "Add custom event" button variant from outlined to contained for polished appearance matching filter chips styling.
 * v1.5.51 - 2026-01-22 - BEP: Add borderRadius: 1.5 to "Add custom event" CTA button to match AppBar nav items styling.
 * v1.5.50 - 2026-01-22 - BEP: Move notification center (bell icon) to the right of "Add custom event" CTA on all breakpoints for improved visual hierarchy.
 * v1.5.49 - 2026-01-22 - BEP: Show event count and NEXT/NOW buttons row on all breakpoints (xs, sm, md+) for consistent event status visibility across mobile and desktop.
 * v1.5.48 - 2026-01-22 - BEP: Make "Add custom event" button full width on xs-sm (md-) for better mobile CTA accessibility.
 * v1.5.47 - 2026-01-22 - BEP: Move event count and NEXT/NOW buttons to same row below 'Powered by Forex Factory data' subtitle on md+ (display:none on xs-sm). Keep notification center and 'Add custom event' button in top-right. Improves information hierarchy following enterprise dashboard patterns.
 * v1.5.46 - 2026-01-22 - Use custom reminder color for custom currency chips.
 * v1.5.45 - 2026-01-22 - Align custom reminder impact chips with standard impact icons.
 * v1.5.44 - 2026-01-22 - Render custom reminder currency chips with custom icon and impact styling.
 * v1.5.43 - 2026-01-21 - Show custom reminder impact in the currency column.
 * v1.5.42 - 2026-01-21 - Respect custom reminder icon/color selections in calendar rows.
 * v1.5.41 - 2026-01-21 - Show custom reminder impact icon consistently in calendar rows.
 * v1.5.40 - 2026-01-21 - BEP: Add custom reminder events with notification center, custom event dialog, and merged calendar view.
 * v1.5.39 - 2026-01-17 - BEP PERFORMANCE PHASE 1: Use pre-computed metadata from event._displayCache instead of per-row calculations. Removes useMemo overhead for isSpeechEvent, formatMetricValue, getEventEpochMs, formatRelativeLabel. EventRow now accesses cached values computed once in useCalendarData hook during fetch. Expected impact: -50% EventRow render overhead.
 * v1.5.38 - 2026-01-16 - RESPONSIVE TIME LABEL: Reduced font size on xs/sm/md (0.65rem/0.75rem/0.875rem) with ellipsis overflow for Tentative/All Day labels. GLOBAL CURRENCY ICON: Show MUI PublicIcon for '—' or missing currency (global events) instead of '—' chip.
 * v1.5.37 - 2026-01-16 - Display all-day/tentative time labels for GPT placeholder events.
 * v1.5.36 - 2026-01-15 - TIMEZONE MODAL BACKDROP FIX: Keep backdrop behind paper and ensure modal sits above AppBar.
 * v1.5.35 - 2026-01-15 - TIMEZONE MODAL Z-INDEX: Raise the timezone selector modal above the AppBar for proper overlay priority.
 * v1.5.34 - 2026-01-15 - CLOCK MARKER FLAG ALIGNMENT: Ensure clock event marker flag badges are styled
 *   consistently on the /calendar route by importing the shared App.css marker styles for ClockEventsOverlay.
 * v1.5.33 - 2026-01-15 - EVENT COUNT CHIP CONSISTENCY: Fixed day header styling for consistent appearance.
 *   Today's entire header row now uses 'primary.main' background with 'primary.contrastText' color for emphasis.
 *   The event count chip for today uses a semi-transparent white background to stand out against the primary color.
 *   Other days maintain light grey background with dark text. All headers now display with consistent styling.
 * v1.5.32 - 2026-01-15 - STICKY COLUMN CASCADE: Restored sticky column headers
 *   and aligned their top offset with the sticky day header height + gap so the
 *   headers cascade cleanly when scrolling.
 * v1.5.31 - 2026-01-15 - COLUMN HEADER NON-STICKY: Removed sticky positioning from table column headers so
 *   only day headers remain sticky during scroll.
 * v1.5.30 - 2026-01-15 - DAY/COLUMN HEADER POLISH: Added vertical padding to day headers (with updated
 *   fixed height) and forced a visible bottom border on sticky column headers for clearer separation.
 * v1.5.29 - 2026-01-15 - DAY HEADER SOLID FILL: Replaced translucent header background with solid grey
 *   tone to remove transparency while maintaining enterprise contrast.
 * v1.5.28 - 2026-01-15 - DAY HEADER SURFACE TONE: Darkened the day header background using theme action
 *   surface to better match enterprise table header styling.
 * v1.5.27 - 2026-01-15 - DAY HEADER BACKGROUND: Set day header container background to match Paper for
 *   consistent surface color across day sections.
 * v1.5.26 - 2026-01-15 - STICKY HEADER CASCADE: Removed the sticky gap between day and column headers by
 *   eliminating header margin and zeroing the column header offset for a tight cascade.
 * v1.5.25 - 2026-01-15 - DAY HEADER CENTERING (NON-STICKY TOO): Tuned typography and chip sizing so
 *   day header content stays vertically centered in both sticky and non-sticky states.
 * v1.5.24 - 2026-01-15 - DAY HEADER VERTICAL ALIGNMENT: Removed excess vertical padding and tightened
 *   line-height so day header text and chips are truly centered within the fixed-height sticky header.
 * v1.5.23 - 2026-01-15 - HEADER SHADOW MOVE: Removed the day header shadow and applied a bottom shadow
 *   to the sticky column headers to shift visual separation to the table header row.
 * v1.5.22 - 2026-01-15 - COLUMN HEADER PADDING TUNE: Reduced non-sticky column header vertical padding for
 *   tighter, consistent top/bottom spacing in the table header row.
 * v1.5.21 - 2026-01-15 - STICKY COLUMN HEADER OFFSET: Nudged sticky table column headers down slightly
 *   below the day header to improve visual separation when both are stacked.
 * v1.5.20 - 2026-01-15 - STICKY OFFSET INIT ORDER FIX: Moved sticky header offset calculation to run after
 *   filters height state initialization to avoid temporal dead zone errors during render.
 * v1.5.19 - 2026-01-15 - STICKY HEADER OFFSET TUNING: Added responsive Paper padding offsets to the sticky
 *   day/table header top calculations so headers start below the sticky filter block and the Paper's inner
 *   padding. Ensures dynamic filter height + Paper padding are both respected for correct stacking.
 * v1.5.18 - 2026-01-15 - STICKY HEADER ROOT CAUSE FIX: Removed overflow scrolling from the calendar Paper and
 *   attached the filters measurement ref to the sticky filter container. The Paper's overflowY:'auto' created
 *   an intermediate scroll container that broke the sticky chain for day/table headers and prevented them from
 *   reacting to the rightScrollRef scroll container. Restoring overflow:'visible' ensures sticky headers anchor
 *   to the intended scroll ancestor, and the filter ref now measures height correctly for top offsets.
 * v1.5.17 - 2026-01-15 - DAY HEADER CASCADING SPACING: Added margin-bottom (mb: 1.25) to sticky day headers
 *   to create visual cascading below the filter section. Day headers now properly stack below filters with
 *   consistent gap spacing. Also adjusted day header padding (py: 0.75) for better vertical alignment of text
 *   within the fixed height container. Ensures visual hierarchy when multiple day headers are sticky-stacked
 *   and filters are frozen at top. Follows MUI spacing guidelines (1.25 = 10px) for consistent rhythm.
 * v1.5.16 - 2026-01-15 - STICKY HEADER FIX (MUI BEST PRACTICE): Changed TableContainer overflow from 'hidden'
 *   to 'visible' to enable proper sticky positioning for both day headers and column headers. Per CSS spec
 *   and MUI enterprise patterns, sticky positioning requires an unbroken chain from the sticky element to
 *   the scroll container - overflow:hidden on intermediate containers breaks this chain and prevents sticky
 *   from working. The scroll container (rightScrollRef in CalendarGridLayout) has overflowY:'auto', and all
 *   intermediate containers (Paper, TableContainer) now use overflow:'visible' to maintain the sticky chain.
 *   Sticky hierarchy: filters (top:0, z-index:1000) → day headers (top:filtersHeight, z-index:999) →
 *   column headers (top:filtersHeight+44px, z-index:998). This follows MUI Table stickyHeader patterns.
 * v1.5.15 - 2026-01-15 - STICKY TABLE COLUMN HEADERS: Made TableHead column headers (TIME, CUR, IMP, EVENT, A, F, P)
 *   sticky positioned below day headers, cascading below filters. Column headers now freeze at
 *   `calc(stickyHeaderTop + DAY_HEADER_HEIGHT_PX)` with z-index one level below day header (stickyHeaderZIndex - 1).
 *   Added boxShadow to column headers for visual separation when stuck. Follows MUI enterprise best practices
 *   for multi-level sticky header hierarchies: filters (z-index 1000) → day headers (z-index 999) →
 *   column headers (z-index 998) → table body. Improves UX by keeping column context visible when scrolling
 *   through long event lists within each day section.
 * v1.5.14 - 2026-01-15 - MOBILE SCROLLING FIX: Made calendar Paper scrollable on xs/sm breakpoints by changing
 *   overflow from 'hidden' to responsive overflowY: { xs: 'auto', md: 'hidden' } with overflowX: 'hidden'.
 *   On xs/sm (single-column), right column has no maxHeight constraint, so Paper must handle scrolling internally.
 *   On md+ (two-column), right column has maxHeight constraint, so outer container handles scrolling (Paper uses hidden).
 *   Added minimalScrollbarSx styling constant for consistent thin scrollbar appearance.
 * v1.5.13 - 2026-01-15 - COMPONENT EXTRACTION & OVERFLOW FIX (ENTERPRISE AUDIT):
 *   - Extracted ClockPanel to standalone ClockPanelPaper.jsx for separation of concerns
 *   - Added overflow: hidden and boxSizing: border-box to calendar Paper
 *   - Removed unused imports (ClockCanvas, ClockHandsOverlay, LoadingAnimation, SessionLabel, useClock, useClockVisibilitySnap, isColorDark, SettingsRoundedIcon)
 *   - Both Papers now have proper overflow containment (minWidth:0, maxWidth:100%, overflow:hidden)
 *   - Follows enterprise MUI pattern: flex children need minWidth:0 to shrink below content size
 * v1.5.12 - 2026-01-15 - LAYOUT REFACTOR (ENTERPRISE AUDIT): Switched from custom CSS Grid (CalendarEmbedLayout) to MUI Grid component (CalendarGridLayout). MUI Grid provides proper responsive behavior, simpler height/scroll management, and follows MUI best practices. Left rail (clock) is sticky on md+ with independent scroll. Right rail (calendar) scrolls independently with proper height constraints. Mobile-first: single column on xs/sm.
 * v1.5.11 - 2026-01-15 - PAPER HEIGHT FIX (ENTERPRISE AUDIT): Fixed calendar Paper overflowing its column container. Added minHeight:0 to allow Paper to shrink within flex parent. Changed flex:1 to flex:'1 1 auto' for proper flex-shrink behavior. This ensures Paper respects right column's maxHeight constraint and scrolls properly. Follows enterprise pattern: flex children need minHeight:0 to shrink below their content size.
 * v1.5.10 - 2026-01-15 - STICKY CODE CLEANUP (ENTERPRISE AUDIT): Removed unused sticky positioning code after v1.5.9 removed sticky behavior from day headers. Removed: safeStickyOffsetTop variable, stickyOffsetTop prop from DaySection, daySectionStickyOffsetTop useMemo calculation, stickyOffsetTop propType, filtersStickyHeight state, and ResizeObserver measurement effect. No functional change - only dead code removal to fix lint errors and reduce bundle size.
 * v1.5.9 - 2026-01-15 - DAY HEADER LAYOUT FIX (ENTERPRISE AUDIT): Removed sticky positioning from day header Box (was: position:'sticky', top:safeStickyOffsetTop). Day headers now flow naturally within their Paper containers following mobile-first best practices. Sticky positioning in nested scroll containers causes positioning bugs and is not recommended for complex layouts. Headers remain visually prominent with proper styling (bgcolor, border, padding) without sticky behavior. Simplifies layout and eliminates positioning conflicts.
 * v1.5.8 - 2026-01-15 - TABLE LAYOUT FIX (ENTERPRISE AUDIT): Complete table layout refactor following mobile-first enterprise best practices. (1) Changed DaySection Paper overflow from 'visible' to 'hidden' to properly constrain table content within boundaries. (2) Removed stickyHeader prop from Table - sticky headers in nested scroll contexts cause positioning bugs. (3) Changed TableContainer overflow to 'hidden' to constrain content, not allow horizontal scrolling. (4) Removed custom top offset from TableHead cells (was: top: safeStickyOffsetTop + DAY_HEADER_HEIGHT_PX) - headers now flow naturally at table top. Fixes: table headers appearing mid-table, horizontal overflow, Papers extending beyond viewport. Pattern: simple responsive table layout without complex sticky positioning.
 * v1.5.7 - 2026-01-15 - TABLE OVERFLOW FIX (ENTERPRISE AUDIT): Changed DaySection TableContainer overflow from 'visible' to overflowX:'auto'. Previously overflow:'visible' allowed table cells with fixed minWidth to push table beyond Paper boundaries causing horizontal overflow. Now TableContainer properly constrains table width within Paper bounds while allowing vertical scrolling. Follows enterprise pattern: containers constrain content, not allow escape. Fixes calendar page width issue where tables exceeded viewport constraints.
 * v1.5.6 - 2026-01-14 - STICKY FILTERS GAP FIX: Changed EventsFilters3 sticky top from 48px→0 on xs/sm so filters stick flush at container top without leaving gap when non-sticky header scrolls away. PublicLayout pt (64px) already provides mobile logo clearance, eliminating need for additional offset. Simplified daySectionStickyOffsetTop to only account for filtersStickyHeight (removed mobileLogoOffset). Follows enterprise pattern: container-relative sticky positioning with parent-level clearance.
 * v1.5.5 - 2026-01-14 - CRITICAL MOBILE LAYOUT FIX: Corrected EventsFilters3 sticky top on xs from 16px→48px to match sm breakpoint and properly clear 64px mobile logo. Removed -1px band-aid adjustment from daySectionStickyOffsetTop calculation as it's no longer needed with correct filter positioning. Fixes critical xs breakpoint overlap identified in mobile layout audit.
 * v1.5.4 - 2026-01-14 - DAY HEADER STICKY OFFSET FIX: Updated daySectionStickyOffsetTop calculation to account for PublicLayout mobile logo row (48px) on xs/sm. Added isMobileLogoPresent breakpoint check (covers xs and sm). Now day headers stick at correct position: mobileLogoOffset (48px on xs/sm) + filtersStickyHeight on xs/sm, and filtersStickyHeight alone on md+. Follows enterprise MUI dashboard pattern: sticky components respect fixed-positioned siblings via offset calculations accounting for all positioned elements in the stack.
 * v1.5.3 - 2026-01-14 - STICKY FILTER OFFSET FIX: EventsFilters3 sticky position now accounts for PublicLayout mobile logo row (48px fixed height) on xs/sm. Changed top from 0 to responsive top: { xs: '48px', sm: '48px', md: 0 }. This prevents filters from overlapping the fixed mobile logo when PublicLayout pt was reduced from 8 to 4. On md+, top reverts to 0 (logo is hidden, AppBar handles positioning). Follows MUI enterprise dashboard best practice: sticky containers respect fixed-positioned siblings via responsive top offsets.
 * v1.5.2 - 2026-01-17 - TIMEZONE MODAL REFACTOR: Extracted inline Dialog/TimezoneSelector code into standalone TimezoneModal component (src/components/TimezoneModal.jsx). CalendarEmbed now uses lazy-loaded TimezoneModal with props: open, onClose, onOpenAuth, zIndex. Improves reusability across /clock and /calendar pages, cleaner code, follows component composition BEP. TimezoneModal handles all modal UI while CalendarEmbed handles just state management.
 * v1.5.1 - 2026-01-14 - TIMEZONE MODAL AUTO-CLOSE: Pass onTimezoneChange callback to TimezoneSelector to automatically close the modal after a timezone is selected and confirmed.
 * v1.5.0 - 2026-01-13 - Removed referral banner placements; calendar layout now renders banner-free across all breakpoints.
 * v1.4.9 - 2026-01-13 - Added xs/sm top margin for the Economic Calendar paper on /calendar route to clear sticky chrome on mobile.
 * v1.4.8 - 2026-01-13 - Matched top banner background to main app background color for consistent chrome when embedded.
 * v1.4.7 - 2026-01-13 - Added banner toggle so parent layouts can own the sticky referral placement without double-rendering.
 * v1.4.6 - 2026-01-13 - Hide the Trading Clock paper on single-column layout so /calendar mobile view focuses on the calendar table.
 * v1.4.5 - 2026-01-13 - Added optional appBar slot for sticky navigation chrome integration from parent shells (e.g., /calendar).
 * v1.4.4 - 2026-01-11 - Remove the gap between sticky filters and sticky day/table headers so headers sit flush on all breakpoints (mobile-first, enterprise patterns).
 * v1.4.3 - 2026-01-11 - Deferred AdSense load until the slot is visible and scheduled via idle callback to reduce main-thread blocking (Lighthouse TBT/TTI).
 * v1.4.2 - 2026-01-11 - Lazy-loaded modal/select components to trim initial JS and main-thread work per Lighthouse guidance.
 * v1.4.1 - 2026-01-11 - Track time engine snapshots via ref to satisfy lint without increasing table tick cadence.
 * v1.4.0 - 2026-01-11 - Isolated clock rendering, throttled table time updates, deferred search, and reused fetch cache for leaner renders.
 * v1.3.117 - 2026-01-11 - Flash all NEXT event rows when using Jump to Next auto-scroll control.
 * v1.3.116 - 2026-01-11 - Refactor day sections into Papers with sticky day + column headers under sticky filters.
 * v1.3.115 - 2026-01-11 - Align Today date left and move digital clock into the same header row (right-aligned), mobile-first.
 * v1.3.114 - 2026-01-11 - Resync today date label immediately on timezone changes (TimezoneSelector integration).
 * v1.3.113 - 2026-01-11 - Show today's full date under the Trading Clock header divider on /calendar (timezone-aware, mobile-first).
 * v1.3.112 - 2026-01-11 - Add momentary row highlight when auto-scrolling from clock tooltip clicks (touch-friendly).
 * v1.3.111 - 2026-01-11 - When clicking events from clock tooltip list, only scroll to the calendar row (do not open EventModal).
 * v1.3.110 - 2026-01-11 - Replace /calendar back-to-top control with Jump to Next visibility-based control.
 * v1.3.109 - 2026-01-11 - Fix xs clock sizing/centering so canvas stays responsive and session labels remain visible.
 * v1.3.108 - 2026-01-11 - Show clock Paper on top in single-column layout (xs/sm) with mobile-first responsive design following enterprise MUI dashboard best practices.
 * v1.3.107 - 2026-01-09 - Wire About tab Contact us button to open ContactModal instead of redirecting to /contact.
 * v1.3.101 - 2026-01-08 - Remove the note icon from calendar event rows; keep favorites-only row actions.
 * v1.3.103 - 2026-01-08 - Show favorites action column on one-column (mobile-first) layout with minimal icon-only width.
 * v1.3.104 - 2026-01-08 - Shrink favorites action column to minimal width by removing extra cell/button padding.
 * v1.3.105 - 2026-01-08 - Enable the calendar two-column layout starting at the md breakpoint.
 * v1.3.106 - 2026-01-08 - Keep md event rows in the compact (xs-style) view by showing A/F/P metric columns only on lg+.
 * v1.3.100 - 2026-01-08 - Show row skeletons for all fetch-triggering filter changes (date/currency/impact/source) while avoiding skeleton flashing for non-fetch interactions.
 * v1.3.99 - 2026-01-08 - Ensure EventsFilters3 instant-apply works: forward nextFilters into applyFilters guard so currency/impact changes apply immediately.
 * v1.3.98 - 2026-01-08 - Gate filter changes for guests: block date/impact/currency tweaks and open AuthModal2.
 * v1.3.97 - 2026-01-08 - Gate event rows for guests: route clicks to AuthModal2 instead of EventModal while preserving /calendar redirect.
 * v1.3.96 - 2026-01-08 - Fixed text colors on /calendar: always use dark text/hands when backgroundBasedOnSession disabled, pass backgroundBasedOnSession to SessionLabel.
 * v1.3.95 - 2026-01-07 - Wired 336x280 single-column banner into render paths and restored overlay scheduling with clock sizing so skeletons clear correctly.
 * v1.3.94 - 2026-01-07 - On xs, use 336x280 (672x560 2x) banner below clock; retain existing banner sizing for two-column / sm+ layout.
 * v1.3.93 - 2026-01-07 - Switched top banner to 468x60 (936x120 2x) without stretching; fixed max dimensions inside dark full-width header, mobile-first.
 * v1.3.92 - 2026-01-07 - Restored full-width dark header banner, centered content per MUI dashboard patterns while keeping top ad non-scrollable.
 * v1.3.91 - 2026-01-07 - Moved top banner to CalendarEmbedLayout level as topBanner prop to ensure it's always visible and non-scrollable, following MUI dashboard best practices.
 * v1.3.90 - 2026-01-07 - Constrained top banner to max 70px height on lg+ while keeping mobile-first scaling and aspect ratio.
 * v1.3.89 - 2026-01-07 - Moved the one-column banner to bottom below the events tables (renders after the calendar Paper).
 * v1.3.88 - 2026-01-07 - Replaced the inline rectangle with 468x60 banner (936x120 2x) in both placements (below clock in two-column, above calendar in one-column).
 * v1.3.86 - 2026-01-07 - Updated banner to 728x90 leaderboard (with 1456x180 2x retina) and kept mobile-first responsive sizing.
 * v1.3.85 - 2026-01-07 - Moved the ad outside both papers and made it full column width on all breakpoints. Removed title and caption to keep the banner minimal and mobile-first.
 * v1.3.84 - 2026-01-07 - Replaced dummy banner with responsive referral banner (mobile-first, retina via srcSet) while keeping Google AdSense slot ready for activation.
 * v1.3.83 - 2026-01-07 - Fixed Forex Factory link to open detailed NewsSourceSelector modal directly instead of wrapper dialog. "Powered by Forex Factory data" now opens the full informational modal in one step.
 * v1.3.82 - 2026-01-07 - Snap clock hands on resume and throttle background ticking via shared time engine resume tokens.
 * v1.3.80 - 2026-01-07 - Keep timezone label/select button visible even when the digital clock is hidden.
 * v1.3.79 - 2026-01-07 - Temporarily hide session label display and controls while keeping logic wired for future use.
 * v1.3.78 - 2026-01-07 - Use shared time engine for clock and countdowns to align second ticks across analog/digital displays.
 * v1.3.77 - 2026-01-07 - Show LoadingAnimation only before the clock canvas renders; remove marker-dependent spinner so tables and clock appear immediately while markers stream later.
 * v1.3.76 - 2026-01-07 - Replace clock overlay loading spinner with LoadingAnimation inside the canvas while overlays stream in.
 * v1.3.75 - 2026-01-07 - Decoupled event tables from overlay marker loading; overlays now load in the background without any gating state.
 * v1.3.74 - 2026-01-07 - Hid the "Loading event markers…" copy while overlays are loading to reduce visual noise.
 * v1.3.73 - 2026-01-07 - Removed unused AdSense script attribute constant to satisfy lint.
 * v1.3.72 - 2026-01-07 - Show back-to-top button on mobile by listening to the scroll container instead of window when single-column.
 * v1.3.71 - 2026-01-07 - Added extra bottom margin on xs below the mobile stats row (# events / Next in) for clearer separation.
 * v1.3.70 - 2026-01-07 - Added top margin above the Search & Filters title for better spacing within the sticky header.
 * v1.3.69 - 2026-01-07 - Added mobile-only breathing room above/below sticky filters when frozen to follow dashboard UI spacing best practices.
 * v1.3.68 - 2026-01-07 - Removed unsupported data-adsbygoogle-script attr; track AdSense script by id to silence head tag warning.
 * v1.3.67 - 2026-01-07 - Lightened sponsored banner background and simplified styling (single Paper, no dark well) while keeping the fallback creative responsive.
 * v1.3.66 - 2026-01-07 - Temporarily replace the visible AdSense slot with a branded fallback banner while keeping AdSense logic active and fully responsive.
 * v1.3.65 - 2026-01-07 - Aligned right-column calendar paper with left rail top (removed extra top margin) for consistent column start.
 * v1.3.64 - 2026-01-07 - Rounded sticky filters' top corners to match Paper radii while keeping flat bottom edge and sticky shadow.
 * v1.3.63 - 2026-01-07 - Removed overflow-constrained root wrapper so sticky filters anchor to the window scroll container on every breakpoint; sticky now works across mobile and desktop.
 * v1.3.62 - 2026-01-07 - Simplified sticky filters to Airbnb-style approach: single filters Box with position: sticky, top: 0 inside Paper. Removed separate mobile/desktop components. Filters now freeze properly on all breakpoints using negative margins to span full Paper width with border-bottom and shadow when stuck.
 * v1.3.61 - 2026-01-07 - Fixed sticky positioning by removing overflowY from inner container that was preventing sticky behavior. Outer Box now handles all overflow control (overflowY: 'auto'), allowing sticky filters to work properly at viewport level on single-column layout.
 * v1.3.60 - 2026-01-07 - Restructured filter positioning: on single-column layout, filters now render outside Paper at page level with sticky viewport positioning (z-index 1100). On two-column layout, filters remain inside sticky Paper. Follows MUI dashboard best practices for mobile-first sticky headers.
 * v1.3.59 - 2026-01-07 - Fixed filter sticky positioning on single-column layout by ensuring filters Box stays sticky at viewport top (top: 0 on all breakpoints). Added negative horizontal margins with compensating padding to extend sticky background full-width across Paper container, following MUI dashboard best practices.
 * v1.3.58 - 2026-01-07 - Changed scrollEventIntoView to center events in viewport (block: 'center') on all breakpoints instead of positioning at top for better UX consistency.
 * v1.3.57 - 2026-01-07 - Fixed AdSense error "No slot size for availableWidth=0" by: 1) checking container width before pushing ad, 2) using ResizeObserver to wait for container to have proper dimensions, 3) adding 100ms delay after script load, 4) ensuring ad container has minWidth constraints and proper padding on xs layout. Enterprise AdSense best practices implementation.
 * v1.3.56 - 2026-01-07 - Fixed skeleton flashing during scroll by only showing skeletons when actively loading (loading && isLoadingNewRange). Added mobile-aware sticky header offset to scrollEventIntoView to prevent "Next" badge from scrolling behind sticky filters on xs breakpoint.
 * v1.3.57 - 2026-01-13 - Removed settings button from Economic Calendar header; settings now centralized in AppBar for all users (authenticated and non-authenticated). Cleaned up unused icon imports.
 * v1.3.56 - 2026-01-13 - Added always-visible settings button in Economic Calendar header (positioned absolutely top-right with responsive offset). Settings gear icon accessible to all users (auth and non-auth) with tooltip. Removed unused LockOpenIcon import.
 * v1.3.55 - 2026-01-07 - Moved event stats chips (event count, next countdown, events in progress) from header row to below filters on single-column layout (xs) using responsive display rules.
 * v1.3.54 - 2026-01-07 - Fixed skeleton display on filter updates and reload by tracking date range changes separately from loading state. 'No events' message now only appears after loading completes, following MUI enterprise loading patterns with proper state detection.
 * v1.3.53 - 2026-01-07 - Keep the Sponsored ad visible on single-column layout above the calendar surface.
 * v1.3.52 - 2026-01-07 - Hide Today's Trading Clock panel on single-column layout; show only in two-column (lg+) view.
 * v1.3.51 - 2026-01-07 - Added responsive ad Paper beneath Today's Trading Clock using Google AdSense enterprise loading pattern.
 * v1.3.50 - 2026-01-07 - Removed Trading Clock auth CTA button to keep header spacing consistent when not signed in.
 * v1.3.49 - 2026-01-07 - Added 16px top margin to Economic Calendar paper for consistent alignment in two-column layout.
 * v1.3.48 - 2026-01-07 - Added IntersectionObserver to detect when sticky filters are actually frozen. Shadow now only appears when filters are stuck, not in their original position, using isFiltersStuck state.
 * v1.3.47 - 2026-01-07 - Removed rounded corners from sticky filters (borderRadius: 0) and added bottom-only shadow (boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)') like top nav bars - visible when frozen over content.
 * v1.3.46 - 2026-01-07 - Fixed sticky filters to freeze at top: 0 (relative to Paper) instead of top: 16 (viewport offset). Prevents gap above filters when scrolling since Paper is already sticky at top: 16.
 * v1.3.45 - 2026-01-07 - Made Economic Calendar Paper sticky at top: 16px (lg) to maintain consistent top position while scrolling. Follows MUI dashboard best practices with alignSelf: flex-start.
 * v1.3.44 - 2026-01-06 - Moved 'Search & Filters' title and event stats inside sticky filters box. All freeze together at top: 0 (xs) and 16px (lg) matching Economic Calendar Paper position.
 * v1.3.43 - 2026-01-06 - Made sticky filters "invisible" in original position: removed shadow/border, matched button radius, auto-sized to content. Becomes visible only when sticky due to solid background.
 * v1.3.42 - 2026-01-06 - Refined sticky filters to be more bubble-like: removed negative margins, increased border radius, added subtle border, stays within Paper bounds with proper spacing.
 * v1.3.41 - 2026-01-06 - Made filters sticky on scroll with floating appearance. When scrolling past filters, they freeze at top of viewport with shadow and backdrop blur following MUI best practices.
 * v1.3.40 - 2026-01-06 - Replaced refresh button in footer with standard copyright notice "© 2026 Time 2 Trade. All rights reserved." following enterprise best practices.
 * v1.3.39 - 2026-01-06 - Removed duplicate "Updated" timestamp from top stats row, keeping only the one in footer for cleaner UI.
 * v1.3.38 - 2026-01-06 - Simplified event stats UI from chips to minimalistic text with icons, removing background colors for cleaner look aligned with page design.
 * v1.3.37 - 2026-01-06 - Moved 'Events table by day' section with chips above EventsFilters3 for better information hierarchy and improved UX flow.
 * v1.3.36 - 2026-01-06 - Fixed gear icon positioning in Trading Clock header to use absolute positioning, ensuring it doesn't affect vertical spacing between title and subtitle. Both headers now have identical spacing structure.
 * v1.3.35 - 2026-01-06 - Replaced NewsSourceSelector button with inline underlined link in subtitle. "Forex Factory" text is now clickable and opens informational modal.
 * v1.3.34 - 2026-01-06 - Standardized both header subtitles to body2 variant with identical styling (72% opacity). Both headers now perfectly identical in structure and appearance.
 * v1.3.33 - 2026-01-06 - Unified Trading Clock header structure to match Economic Calendar header layout. Settings gear icon now positioned exactly like Forex Factory button with same responsive behavior.
 * v1.3.32 - 2026-01-06 - Moved Forex Factory (NewsSourceSelector) button from footer to top-right corner of Economic Calendar heading. Fully responsive with mobile-first layout (stacks on xs, inline on sm+).
 * v1.3.31 - 2026-01-06 - Removed data source selection functionality. NewsSourceSelector now displays informational modal about Forex Factory data only. Backend continues fetching from all sources for future flexibility.
 * v1.3.30 - 2026-01-06 - Added timezone selector button below digital clock in Trading Clock panel that opens responsive modal with full TimezoneSelector functionality. Mobile-first design with collapsed text button that expands to searchable dropdown.
 * v1.3.29 - 2026-01-06 - Implemented proper two-column dashboard layout: Trading Clock is now truly sticky/frozen on lg+ while only Economic Calendar scrolls, following MUI dashboard best practices.
 * v1.3.28 - 2026-01-06 - FINAL FIX: Root cause was in EventsFilters3/useCalendarData calculateDateRange - endOfDay using 23:59:59.999 was bleeding into next calendar day due to timezone offset. Fixed by using (next day start - 1 second) approach.
 * v1.3.27 - 2026-01-06 - Improved buildDaySequence loop termination logic to strictly stop at endKey and added safety check to prevent infinite loops, ensuring single-day presets return exactly one day key.
 * v1.3.26 - 2026-01-06 - Fixed buildDaySequence to iterate by UTC timestamps with getDayKey formatting instead of local Date objects, preventing timezone-dependent day sequence errors that caused extra day cards.
 * v1.3.25 - 2026-01-06 - Fixed eventsByDay to only include events matching visibleDayKeys (preventing extra day cards) and added skeleton placeholder for day header dates during loading.
 * v1.3.24 - 2026-01-06 - Rewrote buildDaySequence to iterate by timezone-aware calendar days and simplified visibleDayKeys to strictly enforce single-day rendering (startKey === endKey) for Today/Tomorrow/Yesterday presets, eliminating all stray day headers.
 * v1.3.23 - 2026-01-06 - Force single-day filters to render only the selected day, preventing stray previous-day headers.
 * v1.3.22 - 2026-01-06 - Align skeleton placeholder widths with table columns for consistent loading layout.
 * v1.3.21 - 2026-01-06 - Force single-day presets to render only the selected day key, preventing stray previous-day headers when timezones shift.
 * v1.3.20 - 2026-01-06 - Align day rendering with date presets (single-day only when selected), show skeletons while loading, and remove the 'No upcoming events' chip.
 * v1.3.19 - 2026-01-06 - Center the trading clock canvas with padded max-width container so session labels stay visible without overflow.
 * v1.3.18 - 2026-01-06 - Add skeleton loaders for day rows and delay empty-state copy until events finish loading.
 * v1.3.17 - 2026-01-06 - Session-based Background now also tints the Trading Clock panel background for live preview consistency.
 * v1.3.16 - 2026-01-06 - Add settings gear on Trading Clock card header to open SettingsSidebar2 for quick access.
 * v1.3.15 - 2026-01-06 - For speech/speaks events, show dashes for A/F/P metrics instead of zero placeholders when no data exists.
 * v1.3.14 - 2026-01-06 - Gray out past-event currency flags in the table while keeping badges visible.
 * v1.3.13 - 2026-01-06 - Remove allowedEventKeys wiring (overlay handles its own fetch) and clean unused visibleEventKeys to avoid runtime and lint issues.
 * v1.3.12 - 2026-01-06 - Let the Economic Calendar paper size to its content (no viewport height clamp) so the table isn’t compressed and the page scrolls naturally.
 * v1.3.11 - 2026-01-06 - Make Trading Clock panel sticky on lg+ and confine scrolling to the Economic Calendar column for a stable two-column experience.
 * v1.3.10 - 2026-01-06 - Prevent hidden-by-filter events from rendering markers/tooltips by syncing allowedEventKeys with the table view.
 * v1.3.9 - 2026-01-06 - Add digital clock and session label to Trading Clock when enabled (defaults on) for functional parity.
 * v1.3.8 - 2026-01-06 - Smooth hand overlay interpolation and hoverable tooltips on hybrid devices; disable marker auto-scroll while keeping tooltip row click scroll.
 * v1.3.7 - 2026-01-06 - Replace Trading Clock clock with the full app implementation (sizing, overlays, badges) for visual parity.
 * v1.3.6 - 2026-01-06 - Add responsive session clock preview (canvas + overlays) to Trading Clock using app settings.
 * v1.3.5 - 2026-01-06 - Repair corrupted imports and re-wire favorites/notes props for the md+ action column.
 * v1.3.4 - 2026-01-06 - Match EventsTable mobile width behavior: auto table layout, constrained to Paper, ellipsis headers, wrap-safe event cells.
 * v1.3.3 - 2026-01-06 - Restore day headers on xs, hide notes icon on xs, and tighten xs gaps between time/currency/impact columns.
 * v1.3.2 - 2026-01-06 - Align xs view with EventsTable mobile: hide table headers on xs, tighter padding, flag-only currency on phones.
 * v1.3.1 - 2026-01-06 - Show next badge only in the page header and remove inline A/F/P caption under event names.
 * v1.3.0 - 2026-01-06 - Rebuilt day view as an enterprise MUI table with actions-first column, responsive columns, and aligned mobile layout.
 * v1.2.4 - 2026-01-06 - Match xs rows to EventsTable mobile: add actions column, inline metrics caption, tighter grid.
 * v1.2.3 - 2026-01-06 - Compact xs layout: table-style inline row (time/meta/details/metrics) instead of stacked cards.
 * v1.2.2 - 2026-01-06 - Rebuilt EventRow/helpers after merge corruption to restore lint pass and table layout behavior.
 * v1.2.1 - 2026-01-06 - Restyled event rows to table-like layout and simplified footer status (text-based updated label, removed event count chip).
 * v1.2.0 - 2026-01-06 - Added NOW/NEXT countdown chips, timezone-aware past styling, EventModal + notes actions, and primary-highlighted today headers.
 * v1.1.0 - 2026-01-06 - Moved filters to top panel and relocated hero copy into footer for the calendar page.
 * v1.0.1 - 2026-01-06 - Added PropTypes coverage and lint cleanups (React import, unused values).
 * v1.0.0 - 2026-01-06 - Initial implementation with This Week default preset, day grouping (including empty days), and embed-ready layout.
 */
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import {
    Alert,
    Button,
    Box,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Link,
    Paper,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CloseIcon from '@mui/icons-material/Close';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import EventsFilters3 from './EventsFilters3';
const NewsSourceSelector = lazy(() => import('./NewsSourceSelector'));
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import useCalendarData from '../hooks/useCalendarData';
import useCustomEvents from '../hooks/useCustomEvents';
import { useTimeEngine } from '../hooks/useTimeEngine';
import { useEventNotes } from '../hooks/useEventNotes';
import CalendarGridLayout from './CalendarGridLayout';
import ClockPanelPaper from './ClockPanelPaper';
import '../App.css';
import CustomEventDialog from './CustomEventDialog';
const EventModal = lazy(() => import('./EventModal'));
const EventNotesDialog = lazy(() => import('./EventNotesDialog'));
const TimezoneModal = lazy(() => import('./TimezoneModal'));
const SettingsSidebar2 = lazy(() => import('./SettingsSidebar2'));
import { formatTime } from '../utils/dateUtils';
import PublicIcon from '@mui/icons-material/Public';
import { getCustomEventIconComponent, resolveCustomEventColor } from '../utils/customEventStyle';
import { resolveImpactMeta, sortEventsByTime } from '../utils/newsApi';
import { getCurrencyFlag } from '../utils/currencyFlags';
import { isColorDark } from '../utils/clockUtils';
import { hasAdConsent, subscribeConsent } from '../utils/consent';
import {
    NOW_WINDOW_MS,
    computeNowNextState,
    formatCountdownHMS,
    getEventEpochMs,
    getNowEpochMs,
    isPastToday,
} from '../utils/eventTimeEngine';
const ContactModal = lazy(() => import('./ContactModal'));

const eventShape = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    eventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    EventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    EventID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Event_ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date), PropTypes.object]),
    dateTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date), PropTypes.object]),
    Date: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date), PropTypes.object]),
    time: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date), PropTypes.object]),
    timeLabel: PropTypes.string,
    name: PropTypes.string,
    Name: PropTypes.string,
    description: PropTypes.string,
    Description: PropTypes.string,
    summary: PropTypes.string,
    Summary: PropTypes.string,
    currency: PropTypes.string,
    Currency: PropTypes.string,
    title: PropTypes.string,
    isCustom: PropTypes.bool,
    timezone: PropTypes.string,
    localDate: PropTypes.string,
    localTime: PropTypes.string,
    showOnClock: PropTypes.bool,
    customColor: PropTypes.string,
    customIcon: PropTypes.string,
    reminders: PropTypes.arrayOf(PropTypes.object),
    impact: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    importance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    strength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Strength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    actual: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Actual: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    forecast: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Forecast: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    previous: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Previous: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    _displayCache: PropTypes.shape({
        isSpeech: PropTypes.bool,
        actual: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        forecast: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        previous: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        epochMs: PropTypes.number,
        strengthValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        relativeLabel: PropTypes.string,
    }),
});

const buildEventKey = (event) => {
    const epoch = getEventEpochMs(event);
    const identifier = event.id || event.Event_ID || `${event.name || event.Name || 'event'}`;
    return `${identifier}-${epoch ?? 'na'}`;
};

const areSetsEqual = (a, b) => {
    if (a === b) return true;
    if (!a || !b || a.size !== b.size) return false;
    for (const value of a) {
        if (!b.has(value)) return false;
    }
    return true;
};

const getDayKey = (value, timezone) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        return formatter.format(date);
    } catch (error) {
        console.error('[CalendarEmbed] Failed to format day key', error);
        return null;
    }
};

const buildDaySequence = (startDate, endDate, timezone) => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];

    // Get the day keys for start and end dates in the target timezone
    const startKey = getDayKey(start, timezone);
    const endKey = getDayKey(end, timezone);
    if (!startKey || !endKey) return [];

    // If it's the same day, return single key immediately (CRITICAL for single-day presets)
    if (startKey === endKey) {
        return [startKey];
    }

    // For multi-day ranges only: iterate through each day
    // Use timezone-aware formatting at each step to handle DST and offset changes
    const days = [startKey];
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    let cursor = new Date(start.getTime());

    // Keep adding days until we reach the end key
    while (days[days.length - 1] !== endKey) {
        cursor = new Date(cursor.getTime() + MS_PER_DAY);
        const key = getDayKey(cursor, timezone);
        if (!key) break;
        if (key !== days[days.length - 1]) {
            days.push(key);
        }
        if (key === endKey) break;
        // Safety check to prevent infinite loops (max 400 days)
        if (days.length > 400) break;
    }

    return days;
};

const CurrencyBadge = ({ currency, isPast = false, isCustom = false, customColor, customIcon }) => {
    const { t } = useTranslation(['calendar', 'common']);
    const code = (currency || '').toUpperCase();
    const countryCode = getCurrencyFlag(code);
    const isUnknown = !code || code === '—';
    const isGlobal = code === 'ALL';
    const theme = useTheme();
    const badgeColor = isCustom ? resolveCustomEventColor(customColor, theme) : 'background.paper';
    const badgeTextColor = isCustom
        ? (isColorDark(badgeColor) ? theme.palette.common.white : theme.palette.text.primary)
        : 'text.primary';
    const CustomIcon = isCustom ? getCustomEventIconComponent(customIcon) : null;

    if (isCustom) {
        return (
            <Tooltip title={t('calendar:tooltip.customEvent')}>
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: badgeColor,
                        color: badgeTextColor,
                        opacity: isPast ? 0.7 : 1,
                        filter: isPast ? 'grayscale(1)' : 'none',
                    }}
                >
                    {CustomIcon ? (
                        <CustomIcon style={{ fontSize: 16, lineHeight: 1, color: badgeTextColor }} />
                    ) : (
                        <Box
                            component="span"
                            sx={{
                                width: 16,
                                height: 16,
                                borderRadius: 0.75,
                                bgcolor: badgeTextColor,
                                opacity: 0.7,
                            }}
                        />
                    )}
                    <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, lineHeight: 1, display: { xs: 'none', sm: 'inline' } }}
                    >
                        CUS
                    </Typography>
                </Box>
            </Tooltip>
        );
    }

    if (isUnknown) {
        return (
            <Tooltip title={t('calendar:tooltip.unknown')}>
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.4,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: badgeColor,
                        color: badgeTextColor,
                        opacity: isPast ? 0.7 : 1,
                        filter: isPast ? 'grayscale(1)' : 'none',
                    }}
                >
                    <CancelRoundedIcon sx={{ fontSize: 16, lineHeight: 1, color: 'text.disabled' }} />
                    <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, lineHeight: 1, display: { xs: 'none', sm: 'inline' } }}
                    >
                        N/A
                    </Typography>
                </Box>
            </Tooltip>
        );
    }

    if (isGlobal) {
        return (
            <Tooltip title={t('calendar:tooltip.global')}>
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.4,
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: badgeColor,
                        color: badgeTextColor,
                        opacity: isPast ? 0.7 : 1,
                        filter: isPast ? 'grayscale(1)' : 'none',
                    }}
                >
                    <PublicIcon sx={{ fontSize: 16, lineHeight: 1, color: badgeTextColor }} />
                    <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, lineHeight: 1, display: { xs: 'none', sm: 'inline' } }}
                    >
                        ALL
                    </Typography>
                </Box>
            </Tooltip>
        );
    }

    if (!countryCode) {
        return (
            <Chip
                label={code}
                size="small"
                sx={{
                    height: 22,
                    fontWeight: 700,
                    opacity: isPast ? 0.7 : 1,
                    bgcolor: badgeColor,
                    color: badgeTextColor,
                }}
            />
        );
    }

    return (
        <Tooltip title={code}>
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: badgeColor,
                    color: badgeTextColor,
                    opacity: isPast ? 0.7 : 1,
                    filter: isPast ? 'grayscale(1)' : 'none',
                }}
            >
                <Box component="span" className={`fi fi-${countryCode}`} sx={{ fontSize: 16, lineHeight: 1 }} />
                <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, lineHeight: 1, display: { xs: 'none', sm: 'inline' } }}
                >
                    {code}
                </Typography>
            </Box>
        </Tooltip>
    );
};

CurrencyBadge.propTypes = {
    currency: PropTypes.string,
    isPast: PropTypes.bool,
    isCustom: PropTypes.bool,
    customColor: PropTypes.string,
    impact: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    customIcon: PropTypes.string,
};

const ImpactBadge = ({ strength, isPast = false }) => {
    const meta = resolveImpactMeta(strength || 'unknown');
    const theme = useTheme();
    const baseColor = isPast ? theme.palette.text.disabled : meta.color;
    const iconColor = theme.palette.common.white;

    return (
        <Tooltip title={meta.label}>
            <Chip
                label={meta.icon}
                size="small"
                sx={{
                    minWidth: 38,
                    height: 22,
                    bgcolor: baseColor,
                    color: iconColor,
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                }}
            />
        </Tooltip>
    );
};

ImpactBadge.propTypes = {
    strength: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isPast: PropTypes.bool,
};

const TABLE_COLUMNS = [
    { id: 'action', labelKey: '', align: 'center', width: { xs: 36, sm: 40 } },
    { id: 'time', labelKey: 'table.headers.time', align: 'center', width: { xs: 52, sm: 68 } },
    { id: 'currency', labelKey: 'table.headers.currency', align: 'center', width: { xs: 52, sm: 68 } },
    { id: 'impact', labelKey: 'table.headers.impact', align: 'center', width: { xs: 52, sm: 68 } },
    // Event name column: auto width (fills remaining space with tableLayout: fixed)
    { id: 'name', labelKey: 'table.headers.event', align: 'left', width: 'auto' },
    { id: 'actual', labelKey: 'table.headers.actual', align: 'center', width: 64, hideBelow: 'lg' },
    { id: 'forecast', labelKey: 'table.headers.forecast', align: 'center', width: 64, hideBelow: 'lg' },
    { id: 'previous', labelKey: 'table.headers.previous', align: 'center', width: 64, hideBelow: 'lg' },
];

const metricCellDisplay = { xs: 'none', lg: 'table-cell' };

const ADS_CLIENT_ID = 'ca-pub-3984565509623618';

const shouldDebugFavorites = () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage?.getItem('t2t_debug_favorites') === '1';
};

const logFavoriteDebug = (...args) => {
    if (!shouldDebugFavorites()) return;
    console.info('[favorites][CalendarEmbed]', ...args);
};

const EventRow = memo(({
    event,
    timezone,
    onToggleFavorite,
    isFavorite,
    isFavoritePending,
    onOpenEvent,
    isNow = false,
    isNext = false,
    nextCountdownLabel,
    isPast = false,
}) => {
    const { t } = useTranslation(['calendar', 'common']);
    const theme = useTheme();
    const name = event.name || event.Name || t('calendar:event.unnamed');
    const description = event.description || event.Description || event.summary || event.Summary || '';

    // BEP: Use pre-computed metadata from _displayCache to avoid per-row calculations
    const { actual: actualValue, forecast, previous, epochMs: eventEpochMs, strengthValue, relativeLabel } = event._displayCache || {};

    const nextTooltip = eventEpochMs ? relativeLabel : t('calendar:event.upcoming');
    const favorite = isFavorite ? isFavorite(event) : false;
    const favoritePending = isFavoritePending ? isFavoritePending(event) : false;

    logFavoriteDebug('row:render', {
        eventName: event?.name || event?.Name,
        hasOnToggleFavorite: typeof onToggleFavorite === 'function',
        isCustom: event?.isCustom,
        favoritePending,
        wouldRenderButton: Boolean(onToggleFavorite && !event.isCustom),
    });

    const handleOpenEvent = () => {
        if (onOpenEvent) onOpenEvent(event);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpenEvent();
        }
    };

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        logFavoriteDebug('row:click', {
            id: event?.id,
            eventId: event?.eventId || event?.EventId || event?.EventID || event?.Event_ID,
            name: event?.name || event?.Name,
            currency: event?.currency || event?.Currency,
            time: event?.time || event?.date || event?.Date,
        });
        if (onToggleFavorite) onToggleFavorite(event);
    };

    return (
        <TableRow
            hover
            tabIndex={0}
            onClick={handleOpenEvent}
            onKeyDown={handleKeyDown}
            data-t2t-event-row-key={buildEventKey(event)}
            data-t2t-now-event-row={isNow ? 'true' : undefined}
            data-t2t-next-event-row={isNext ? 'true' : undefined}
            sx={{
                cursor: 'pointer',
                backgroundColor: (theme) => {
                    if (isNow) return alpha(theme.palette.info.main, 0.08);
                    if (isNext) return alpha(theme.palette.success.main, 0.06);
                    return 'transparent';
                },
                opacity: isPast && !isNow && !isNext ? 0.72 : 1,
                borderLeft: (theme) => {
                    if (isNow) return `3px solid ${theme.palette.info.main}`;
                    if (isNext) return `3px solid ${theme.palette.success.main}`;
                    return 'none';
                },
                '&[data-t2t-scroll-flash="true"]': {
                    position: 'relative',
                    animation: 't2tScrollFlash 1400ms ease-out',
                },
                '@keyframes t2tScrollFlash': {
                    '0%': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.16),
                        boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.0)}`,
                    },
                    '20%': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.20),
                        boxShadow: `0 0 0 6px ${alpha(theme.palette.primary.main, 0.18)}`,
                    },
                    '100%': {
                        backgroundColor: 'transparent',
                        boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.0)}`,
                    },
                },
                '@media (prefers-reduced-motion: reduce)': {
                    '&[data-t2t-scroll-flash="true"]': {
                        animation: 'none',
                        backgroundColor: alpha(theme.palette.primary.main, 0.14),
                    },
                },
                '&:focus-visible': {
                    outline: '2px solid',
                    outlineColor: 'primary.main',
                    outlineOffset: 2,
                },
            }}
        >

            <TableCell
                align="center"
                sx={{
                    borderColor: 'divider',
                    width: { xs: 36, sm: 40 },
                    minWidth: { xs: 36, sm: 40 },
                    px: 0,
                }}
                padding="none"
            >
                <Stack direction="row" spacing={0} alignItems="center" justifyContent="center" sx={{ minWidth: 0, flexWrap: 'nowrap' }}>
                    {onToggleFavorite && !event.isCustom ? (
                        <Tooltip title={favorite ? t('calendar:tooltip.removeFavorite') : t('calendar:tooltip.addToFavorites')}>
                            <span
                                style={{ display: 'inline-flex', cursor: favoritePending ? 'not-allowed' : 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFavoriteClick(e);
                                }}
                            >
                                <IconButton
                                    size="small"
                                    onClick={handleFavoriteClick}
                                    onTouchEnd={(e) => {
                                        e.preventDefault();
                                        handleFavoriteClick(e);
                                    }}
                                    disabled={favoritePending}
                                    sx={{ p: 0.25, m: 0 }}
                                >
                                    {favorite ? <FavoriteIcon color="error" fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                                </IconButton>
                            </span>
                        </Tooltip>
                    ) : null}
                </Stack>
            </TableCell>

            <TableCell
                align="center"
                sx={{
                    borderColor: 'divider',
                    width: { xs: 52, sm: 68 },
                    minWidth: { xs: 52, sm: 64 },
                    px: { xs: 0, sm: 0.85 },
                    whiteSpace: { xs: 'normal', sm: 'nowrap' },
                }}
            >
                <Typography
                    variant="body2"
                    fontWeight={800}
                    sx={{
                        fontFamily: 'monospace',
                        textAlign: 'center',
                        width: '100%',
                        fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                    }}
                >
                    {event.timeLabel || formatTime(event.time || event.date || event.Date, timezone)}
                </Typography>
            </TableCell>

            <TableCell align="center" sx={{ borderColor: 'divider', width: { xs: 52, sm: 68 }, minWidth: { xs: 52, sm: 64 }, px: { xs: 0, sm: 0.85 } }}>
                <CurrencyBadge
                    currency={event.currency || event.Currency}
                    isPast={isPast && !isNow && !isNext}
                    isCustom={event.isCustom}
                    customColor={event.customColor}
                    impact={event.impact || event.strength || event.Strength}
                    customIcon={event.customIcon}
                />
            </TableCell>

            <TableCell align="center" sx={{ borderColor: 'divider', width: { xs: 52, sm: 68 }, minWidth: { xs: 52, sm: 64 }, px: { xs: 0, sm: 0.85 } }}>
                <ImpactBadge
                    strength={strengthValue}
                    isPast={isPast && !isNow && !isNext}
                />
            </TableCell>

            {/* BEP: Name column - tableLayout:fixed + colgroup auto width handles sizing, no explicit width needed */}
            <TableCell sx={{ borderColor: 'divider', px: { xs: 0.6, sm: 1 }, overflow: 'hidden' }}>
                <Stack direction="row" spacing={{ xs: 0.5, sm: 0.75 }} alignItems="center" sx={{ minWidth: 0, maxWidth: '100%' }}>
                    <Box sx={{ flex: '1 1 auto', minWidth: 0, maxWidth: '100%' }}>
                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, flexWrap: 'wrap' }}>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 700,
                                    color: isPast ? 'text.secondary' : 'text.primary',
                                    // Prefer wrapping the event name (mobile-style) before requiring horizontal scroll.
                                    overflow: 'hidden',
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                    minWidth: 0,
                                    maxWidth: '100%',
                                }}
                                title={name}
                            >
                                {name}
                            </Typography>
                        </Stack>
                        {description ? (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word', maxWidth: '100%' }}
                            >
                                {description}
                            </Typography>
                        ) : null}
                    </Box>
                    {isNow ? (
                        <Tooltip title={t('calendar:badges.eventInProgress')}>
                            <Chip
                                label={t('calendar:badges.now')}
                                size="small"
                                sx={{
                                    bgcolor: (theme) => alpha(theme.palette.info.main, 0.12),
                                    color: 'info.main',
                                    fontWeight: 800,
                                    height: 20,
                                    fontSize: '0.65rem',
                                    minWidth: { xs: 42, sm: 48 },
                                    flex: '0 0 auto',
                                    '& .MuiChip-label': {
                                        px: { xs: 0.5, sm: 0.75 },
                                    },
                                }}
                            />
                        </Tooltip>
                    ) : null}
                    {isNext ? (
                        <Tooltip title={t('calendar:badges.nextCountdown', { time: nextCountdownLabel || nextTooltip })}>
                            <Chip
                                label={t('calendar:badges.next')}
                                size="small"
                                sx={{
                                    bgcolor: (theme) => alpha(theme.palette.success.main, 0.12),
                                    color: 'success.main',
                                    fontWeight: 800,
                                    height: 20,
                                    fontSize: '0.65rem',
                                    minWidth: { xs: 42, sm: 48 },
                                    flex: '0 0 auto',
                                    '& .MuiChip-label': {
                                        px: { xs: 0.5, sm: 0.75 },
                                    },
                                }}
                            />
                        </Tooltip>
                    ) : null}
                </Stack>
            </TableCell>

            <TableCell align="center" sx={{ borderColor: 'divider', display: metricCellDisplay, minWidth: 64, maxWidth: 64, px: { xs: 0.25, sm: 0.5 } }}>
                <Typography
                    variant="caption"
                    fontWeight={600}
                    color={actualValue !== '—' ? 'primary.main' : 'text.secondary'}
                    sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                >
                    {actualValue}
                </Typography>
            </TableCell>
            <TableCell align="center" sx={{ borderColor: 'divider', display: metricCellDisplay, minWidth: 64, maxWidth: 64, px: { xs: 0.25, sm: 0.5 } }}>
                <Typography variant="caption" fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {forecast}
                </Typography>
            </TableCell>
            <TableCell align="center" sx={{ borderColor: 'divider', display: metricCellDisplay, minWidth: 64, maxWidth: 64, px: { xs: 0.25, sm: 0.5 } }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {previous}
                </Typography>
            </TableCell>
        </TableRow>
    );
});

EventRow.propTypes = {
    event: eventShape.isRequired,
    timezone: PropTypes.string.isRequired,
    onToggleFavorite: PropTypes.func,
    isFavorite: PropTypes.func,
    isFavoritePending: PropTypes.func,
    onOpenEvent: PropTypes.func,
    isNow: PropTypes.bool,
    isNext: PropTypes.bool,
    nextCountdownLabel: PropTypes.string,
    isPast: PropTypes.bool,
    nowEpochMs: PropTypes.number.isRequired,
};
EventRow.displayName = 'EventRow';

// BEP: Prefetch margin for IntersectionObserver (2 days ahead ≈ 400px buffer)
const PREFETCH_ROOT_MARGIN = '400px 0px 400px 0px';
// BEP: Minimum skeleton rows to show during initial render
const MIN_SKELETON_ROWS = 3;

const DaySection = memo(({
    dayKey,
    timezone,
    events,
    nowEventIds,
    nextEventIds,
    nextCountdownLabel,
    nowEpochMs,
    onToggleFavorite,
    isFavorite,
    isFavoritePending,
    onOpenEvent,
    isToday,
    isLoading = false,
    stickyHeaderZIndex = 999,
    stickyHeaderTop = 0,
}) => {
    const { t, i18n } = useTranslation(['calendar', 'common']);
    const theme = useTheme();
    const sectionRef = useRef(null);
    // BEP: Track if section has been visible (for prefetch) - once visible, always render
    const [hasBeenVisible, setHasBeenVisible] = useState(false);
    // BEP: Track loaded events count for progressive rendering feedback
    const [renderedCount, setRenderedCount] = useState(0);

    const DAY_HEADER_HEIGHT_PX = 36;
    const DAY_HEADER_GAP_PX = 8;

    // BEP: IntersectionObserver to detect when section is approaching viewport (2 days ahead)
    useEffect(() => {
        if (hasBeenVisible) return; // Already visible, no need to observe
        const el = sectionRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            setHasBeenVisible(true); // Fallback: render immediately if no IO support
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasBeenVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin: PREFETCH_ROOT_MARGIN, // 400px buffer = ~2 days ahead
                threshold: 0,
            }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasBeenVisible]);

    // BEP: Progressive rendering - increment rendered count to show events one-by-one
    useEffect(() => {
        if (!hasBeenVisible || isLoading) {
            setRenderedCount(0);
            return;
        }
        if (events.length === 0) {
            setRenderedCount(0);
            return;
        }
        // Already fully rendered
        if (renderedCount >= events.length) return;

        // Progressive reveal: batch 5 events at a time for performance
        const BATCH_SIZE = 5;
        const nextBatch = Math.min(renderedCount + BATCH_SIZE, events.length);
        const timer = setTimeout(() => setRenderedCount(nextBatch), 16); // ~1 frame
        return () => clearTimeout(timer);
    }, [hasBeenVisible, isLoading, events.length, renderedCount]);

    const displayDate = useMemo(() => {
        const parts = dayKey.split('-');
        const date = parts.length === 3 ? new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00Z`) : null;
        if (!date) return '—';
        // BEP: Use i18n.language for locale-aware formatting (language-responsive day headers)
        return new Intl.DateTimeFormat(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date);
    }, [dayKey, i18n.language]);

    // BEP: Show skeleton in header until visible AND loaded
    const showHeaderSkeleton = isLoading || !hasBeenVisible;
    const displayDateElement = useMemo(() => {
        if (showHeaderSkeleton) {
            return <Skeleton variant="text" width="60%" sx={{ bgcolor: isToday ? alpha(theme.palette.common.white, 0.25) : undefined }} />;
        }
        return displayDate;
    }, [displayDate, showHeaderSkeleton, isToday, theme]);

    // BEP: Header chip logic - show loading until data confirmed
    const headerChipLabel = useMemo(() => {
        if (isLoading || !hasBeenVisible) return t('calendar:labels.loading');
        if (events.length > 0) return t('calendar:labels.events', { count: events.length });
        return t('calendar:labels.noEvents');
    }, [isLoading, hasBeenVisible, events.length, t]);

    // BEP: Determine what to show in table body
    // Priority: skeleton (not visible or loading) > events (progressive) > empty (confirmed)
    const showSkeletonRows = isLoading || !hasBeenVisible;
    // Only show empty state when: not loading, has been visible, AND events array is empty
    const showEmptyState = !isLoading && hasBeenVisible && events.length === 0;
    // Events to render (progressive: only up to renderedCount)
    const eventsToRender = useMemo(() => {
        if (showSkeletonRows || showEmptyState) return [];
        return events.slice(0, renderedCount);
    }, [showSkeletonRows, showEmptyState, events, renderedCount]);
    // Show skeleton placeholders for events not yet rendered (progressive loading feedback)
    const remainingSkeletonCount = hasBeenVisible && !isLoading && events.length > 0
        ? Math.max(0, events.length - renderedCount)
        : 0;

    // BEP: Estimate height for content-visibility containment (header + event rows)
    // Use MIN_SKELETON_ROWS as minimum to prevent layout shift
    const estimatedHeight = DAY_HEADER_HEIGHT_PX + DAY_HEADER_GAP_PX + Math.max(events.length, MIN_SKELETON_ROWS) * 64;

    return (
        <Paper
            ref={sectionRef}
            data-t2t-day-section={dayKey}
            variant="outlined"
            sx={{
                borderRadius: 2,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                width: '100%',
                maxWidth: '100%',
                overflow: 'visible',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                flexShrink: 0,
                // BEP: Native browser virtualization - skip rendering for off-screen sections
                contentVisibility: 'auto',
                containIntrinsicSize: `auto ${estimatedHeight}px`,
            }}
        >
            <Box
                sx={{
                    position: 'sticky',
                    top: stickyHeaderTop,
                    zIndex: stickyHeaderZIndex,
                    borderTopLeftRadius: 7,
                    borderTopRightRadius: 7,
                    bgcolor: isToday ? 'primary.main' : (theme.palette.mode === 'light' ? 'grey.50' : 'grey.900'),
                    color: isToday ? 'primary.contrastText' : 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    px: 1.25,
                    py: 2,
                    height: DAY_HEADER_HEIGHT_PX,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    mb: `${DAY_HEADER_GAP_PX}px`,
                }}
            >
                <Stack
                    direction="row"
                    spacing={{ xs: 0.75, sm: 1.25 }}
                    alignItems="center"
                    justifyContent="space-between"
                    flexWrap="nowrap"
                    sx={{ width: '100%', minWidth: 0 }}
                >
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 800,
                            lineHeight: 1,
                            flex: '1 1 auto',
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {displayDateElement}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ ml: 'auto', flex: '0 0 auto', flexShrink: 0 }}>
                        <Chip
                            label={headerChipLabel}
                            size="small"
                            sx={{
                                fontWeight: 800,
                                height: 20,
                                bgcolor: isToday ? theme.palette.common.white : theme.palette.action.disabled,
                                color: isToday ? 'primary.main' : 'text.primary',
                                '& .MuiChip-label': {
                                    px: 0.75,
                                    lineHeight: 1,
                                },
                            }}
                        />
                    </Stack>
                </Stack>
            </Box>

            <TableContainer sx={{ overflow: 'visible', flex: 1, minHeight: 0 }}>
                <Table
                    size="small"
                    aria-label={t('calendar:aria.eventsOn', { date: displayDate })}
                    sx={{
                        width: '100%',
                        tableLayout: 'fixed',
                        '& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root': {
                            borderBottom: 0,
                        },
                    }}
                >
                    {/* BEP: colgroup defines column widths BEFORE content renders to prevent layout shift */}
                    <Box
                        component="colgroup"
                        sx={{
                            '& col': {
                                // Default for auto columns (name column fills remaining space)
                            },
                        }}
                    >
                        {TABLE_COLUMNS.map((column) => (
                            <Box
                                component="col"
                                key={column.id}
                                sx={{
                                    width: column.width === 'auto' ? 'auto' : column.width,
                                    display: column.hideBelow ? { xs: 'none', [column.hideBelow]: 'table-column' } : 'table-column',
                                }}
                            />
                        ))}
                    </Box>
                    <TableHead>
                        {!showEmptyState && (
                            <TableRow>
                                {TABLE_COLUMNS.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.align}
                                        sx={{
                                            position: 'sticky',
                                            top: `calc(${stickyHeaderTop} + ${DAY_HEADER_HEIGHT_PX}px)`,
                                            zIndex: stickyHeaderZIndex - 1,
                                            borderColor: 'divider',
                                            width: column.width,
                                            minWidth: column.minWidth ?? column.width,
                                            display: column.hideBelow ? { xs: 'none', [column.hideBelow]: 'table-cell' } : 'table-cell',
                                            fontWeight: 800,
                                            fontSize: '0.7rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.2,
                                            bgcolor: 'background.paper',
                                            boxShadow: '0 2px 4px -2px rgba(0, 0, 0, 0.12)',
                                            py: 0,
                                            px: { xs: 0, lg: 1 },
                                        }}
                                    >
                                        {column.labelKey ? t(column.labelKey) : column.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        )}
                    </TableHead>
                    <TableBody>
                        {showSkeletonRows ? (
                            Array.from({ length: MIN_SKELETON_ROWS }).map((_, idx) => (
                                <TableRow key={`skeleton-${idx}`}>
                                    <TableCell colSpan={TABLE_COLUMNS.length} sx={{ borderColor: 'divider', py: 1.5 }}>
                                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', width: { xs: 36, sm: 40 }, justifyContent: 'center' }}>
                                                <Skeleton variant="circular" width={20} height={20} />
                                            </Box>
                                            <Skeleton variant="rounded" width={{ xs: 52, sm: 68 }} height={18} />
                                            <Skeleton variant="rounded" width={{ xs: 52, sm: 68 }} height={18} />
                                            <Skeleton variant="rounded" width={{ xs: 52, sm: 68 }} height={18} />
                                            <Stack spacing={0.4} sx={{ flex: 1, minWidth: 0 }}>
                                                <Skeleton variant="text" width="72%" />
                                                <Skeleton variant="text" width="54%" />
                                            </Stack>
                                            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.75 }}>
                                                <Skeleton variant="text" width={64} />
                                                <Skeleton variant="text" width={64} />
                                                <Skeleton variant="text" width={64} />
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : showEmptyState ? (
                            <TableRow>
                                <TableCell colSpan={TABLE_COLUMNS.length} sx={{ borderColor: 'divider', py: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        {t('calendar:labels.noEventsForDay')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {/* BEP: Progressive rendering - show events as they load */}
                                {eventsToRender.map((event) => {
                                    const eventKey = buildEventKey(event);
                                    const eventEpochMs = getEventEpochMs(event);
                                    const pastToday = isPastToday({ eventEpochMs, nowEpochMs, timezone });
                                    const activeNow = nowEventIds.has(eventKey);
                                    const activeNext = nextEventIds.has(eventKey);
                                    return (
                                        <EventRow
                                            key={event.id || `${event.name}-${event.date}`}
                                            event={event}
                                            timezone={timezone}
                                            onToggleFavorite={onToggleFavorite}
                                            isFavorite={isFavorite}
                                            isFavoritePending={isFavoritePending}
                                            onOpenEvent={onOpenEvent}
                                            isNow={activeNow}
                                            isNext={activeNext}
                                            nextCountdownLabel={activeNext ? nextCountdownLabel : null}
                                            isPast={pastToday}
                                            nowEpochMs={nowEpochMs}
                                        />
                                    );
                                })}
                                {/* BEP: Show skeleton rows for events not yet rendered (progressive loading) */}
                                {remainingSkeletonCount > 0 && Array.from({ length: Math.min(remainingSkeletonCount, 3) }).map((_, idx) => (
                                    <TableRow key={`remaining-skeleton-${idx}`}>
                                        <TableCell colSpan={TABLE_COLUMNS.length} sx={{ borderColor: 'divider', py: 1.5 }}>
                                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', width: { xs: 36, sm: 40 }, justifyContent: 'center' }}>
                                                    <Skeleton variant="circular" width={20} height={20} />
                                                </Box>
                                                <Skeleton variant="rounded" width={{ xs: 52, sm: 68 }} height={18} />
                                                <Skeleton variant="rounded" width={{ xs: 52, sm: 68 }} height={18} />
                                                <Skeleton variant="rounded" width={{ xs: 52, sm: 68 }} height={18} />
                                                <Stack spacing={0.4} sx={{ flex: 1, minWidth: 0 }}>
                                                    <Skeleton variant="text" width="72%" />
                                                    <Skeleton variant="text" width="54%" />
                                                </Stack>
                                                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.75 }}>
                                                    <Skeleton variant="text" width={64} />
                                                    <Skeleton variant="text" width={64} />
                                                    <Skeleton variant="text" width={64} />
                                                </Box>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
});

DaySection.propTypes = {
    dayKey: PropTypes.string.isRequired,
    timezone: PropTypes.string.isRequired,
    events: PropTypes.arrayOf(eventShape).isRequired,
    nowEventIds: PropTypes.instanceOf(Set).isRequired,
    nextEventIds: PropTypes.instanceOf(Set).isRequired,
    nextCountdownLabel: PropTypes.string,
    nowEpochMs: PropTypes.number.isRequired,
    onToggleFavorite: PropTypes.func,
    isFavorite: PropTypes.func,
    isFavoritePending: PropTypes.func,
    onOpenEvent: PropTypes.func,
    isToday: PropTypes.bool,
    isLoading: PropTypes.bool,
    stickyHeaderZIndex: PropTypes.number,
    stickyHeaderTop: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};
DaySection.displayName = 'DaySection';

// ClockPanel component extracted to ClockPanelPaper.jsx for separation of concerns (v1.5.13)

export default function CalendarEmbed({
    title = null,
    onOpenAuth = null,
    showSeoCopy = true,
    appBar = null,
}) {
    const { t } = useTranslation(['calendar', 'common']);
    const theme = useTheme();
    const isTwoColumn = useMediaQuery(theme.breakpoints.up('md'));
    const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
    const { user } = useAuth();
    const {
        filters,
        handleFiltersChange,
        applyFilters,
        events: economicEvents,
        rawEvents,
        loading,
        error,
        lastUpdated,
        timezone,
        newsSource,
        isFavorite,
        toggleFavorite,
        isFavoritePending,
        favoritesLoading,
    } = useCalendarData({ defaultPreset: 'thisWeek' });

    const {
        events: customEvents,
        loading: customLoading,
        error: customError,
        createEvent,
        saveEvent,
        removeEvent,
    } = useCustomEvents({ startDate: filters.startDate, endDate: filters.endDate });

    const {
        sessions,
        selectedTimezone,
        clockStyle,
        showSessionNamesInCanvas,
        showPastSessionsGray,
        showClockNumbers,
        showClockHands,
        showHandClock,
        showDigitalClock,
        showSessionLabel,
        showTimeToEnd,
        showTimeToStart,
        showEventsOnCanvas,
        eventFilters: settingsEventFilters,
        newsSource: settingsNewsSource,
        backgroundBasedOnSession,
    } = useSettings();

    const clockTimezone = selectedTimezone || timezone;
    const timeEngine = useTimeEngine(clockTimezone);
    const adRef = useRef(null);
    const adInitializedRef = useRef(false);
    const [prevDateRangeKey, setPrevDateRangeKey] = useState(null);
    const [isLoadingNewRange, setIsLoadingNewRange] = useState(false);
    const [tableNowEpochMs, setTableNowEpochMs] = useState(() => timeEngine?.nowEpochMs ?? getNowEpochMs(clockTimezone));
    const tableNowRef = useRef(tableNowEpochMs);
    const timeEngineNowRef = useRef(timeEngine?.nowEpochMs ?? null);

    useEffect(() => {
        timeEngineNowRef.current = timeEngine?.nowEpochMs ?? null;
    }, [timeEngine?.nowEpochMs]);

    useEffect(() => {
        const next = timeEngineNowRef.current ?? getNowEpochMs(clockTimezone);
        tableNowRef.current = next;
        setTableNowEpochMs(next);
    }, [clockTimezone, timeEngine?.resumeToken]);

    useEffect(() => {
        let cancelled = false;
        let timerId = null;

        const tick = () => {
            const next = timeEngineNowRef.current ?? getNowEpochMs(clockTimezone);
            if (Math.abs(next - tableNowRef.current) >= 900) {
                tableNowRef.current = next;
                setTableNowEpochMs(next);
            }
            if (!cancelled) {
                timerId = window.setTimeout(tick, 1500);
            }
        };

        timerId = window.setTimeout(tick, 1500);

        return () => {
            cancelled = true;
            if (timerId) {
                window.clearTimeout(timerId);
            }
        };
    }, [clockTimezone, timeEngine?.resumeToken]);

    // Detect fetch-triggering filter changes (NOT local-only filters like search/favorites)
    const fetchKey = useMemo(() => {
        const startEpoch = filters.startDate ? new Date(filters.startDate).getTime() : 'na';
        const endEpoch = filters.endDate ? new Date(filters.endDate).getTime() : 'na';
        const impactsKey = (filters.impacts || []).slice().sort().join('|');
        const currenciesKey = (filters.currencies || []).slice().sort().join('|');
        const sourceKey = newsSource || 'auto';
        return `${sourceKey}-${startEpoch}-${endEpoch}-${impactsKey}-${currenciesKey}`;
    }, [filters.currencies, filters.endDate, filters.impacts, filters.startDate, newsSource]);

    const dateRangeChanged = prevDateRangeKey !== fetchKey;

    // When fetch-triggering filters change, flag that we're loading a new dataset
    useEffect(() => {
        if (dateRangeChanged) {
            setIsLoadingNewRange(true);
            setPrevDateRangeKey(fetchKey);
        }
    }, [dateRangeChanged, fetchKey]);

    // Once loading completes after a range change, stop showing skeletons
    useEffect(() => {
        if (isLoadingNewRange && !loading && !customLoading) {
            setIsLoadingNewRange(false);
        }
    }, [customLoading, isLoadingNewRange, loading]);

    const combinedLoading = loading || customLoading;
    const combinedError = error || customError;

    // Show skeletons ONLY when actively loading, not during scroll or re-renders
    const showSkeletons = combinedLoading && isLoadingNewRange;

    const {
        notesError,
        hasNotes,
        getNotesForEvent,
        ensureNotesStream,
        stopNotesStream,
        addNote,
        removeNote,
        isEventNotesLoading,
    } = useEventNotes();

    // Notifications now managed globally in App.jsx and passed via PublicLayout

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [noteTarget, setNoteTarget] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [timezoneModalOpen, setTimezoneModalOpen] = useState(false);
    const [newsSourceModalOpen, setNewsSourceModalOpen] = useState(false);
    const [forexFactoryModalOpen, setForexFactoryModalOpen] = useState(false);
    const [customDialogOpen, setCustomDialogOpen] = useState(false);
    const [customEditingEvent, setCustomEditingEvent] = useState(null);
    const [customActionError, setCustomActionError] = useState('');
    const [isFiltersStuck, setIsFiltersStuck] = useState(false);
    // isMobileFiltersStuck removed - filters now at layout level
    const overlayEventFilters = useMemo(() => filters || settingsEventFilters, [filters, settingsEventFilters]);
    const overlayNewsSource = newsSource || settingsNewsSource;

    const filteredCustomEvents = useMemo(() => {
        if (!customEvents || customEvents.length === 0) return [];

        // BEP: Apply currency filter to custom events
        // Custom events should only show when:
        // 1. No currency filter is applied (show all)
        // 2. CUS is explicitly selected in the currency filter
        const currencyFilters = filters?.currencies || [];
        if (currencyFilters.length > 0) {
            const normalizedFilters = currencyFilters.map((c) => String(c).toUpperCase().trim());
            const hasCusFilter = normalizedFilters.includes('CUS');
            // If currency filter is active but CUS is not selected, hide all custom events
            if (!hasCusFilter) return [];
        }

        if (filters?.favoritesOnly) return customEvents;

        const query = (filters?.searchQuery || '').toLowerCase().trim();
        if (!query) return customEvents;

        return customEvents.filter((evt) => {
            const name = (evt.title || evt.name || '').toLowerCase();
            const description = (evt.description || '').toLowerCase();
            return name.includes(query) || description.includes(query);
        });
    }, [customEvents, filters?.currencies, filters?.favoritesOnly, filters?.searchQuery]);

    const mergedEvents = useMemo(
        () => sortEventsByTime([...(economicEvents || []), ...filteredCustomEvents]),
        [economicEvents, filteredCustomEvents]
    );

    const visibleCount = mergedEvents.length;

    const permissionError = useMemo(() => {
        const message = combinedError || customActionError || '';
        return /permission/i.test(message);
    }, [combinedError, customActionError]);

    const dayKeys = useMemo(
        () => buildDaySequence(filters.startDate, filters.endDate, timezone),
        [filters.endDate, filters.startDate, timezone],
    );

    const startDayKey = useMemo(() => getDayKey(filters.startDate, timezone), [filters.startDate, timezone]);
    const endDayKey = useMemo(() => getDayKey(filters.endDate, timezone), [filters.endDate, timezone]);
    const isSingleDayRange = useMemo(() => Boolean(startDayKey && endDayKey && startDayKey === endDayKey), [endDayKey, startDayKey]);

    // Theme-aware scrollbar styling
    const scrollbarSx = useMemo(() => ({
        scrollbarWidth: 'thin',
        scrollbarColor: `${alpha(theme.palette.text.primary, 0.32)} transparent`,
        '&::-webkit-scrollbar': {
            width: 6,
        },
        '&::-webkit-scrollbar-track': {
            background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.text.primary, 0.32),
            borderRadius: 999,
        },
        '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: alpha(theme.palette.text.primary, 0.45),
        },
    }), [theme.palette.text.primary]);

    const visibleDayKeys = useMemo(() => {
        // For single-day ranges (Today/Tomorrow/Yesterday), show ONLY that day
        if (isSingleDayRange && startDayKey) {
            return [startDayKey];
        }
        // For multi-day ranges (This Week), show all days from buildDaySequence
        return dayKeys;
    }, [dayKeys, isSingleDayRange, startDayKey]);

    const eventsByDay = useMemo(() => {
        const grouped = new Map();
        visibleDayKeys.forEach((key) => grouped.set(key, []));

        mergedEvents.forEach((event) => {
            const bucket = getDayKey(event.date || event.Date || event.time, timezone);
            if (!bucket) return;
            // Only add to grouped map if this day key is in visibleDayKeys
            if (grouped.has(bucket)) {
                grouped.get(bucket).push(event);
            }
        });

        return grouped;
    }, [mergedEvents, timezone, visibleDayKeys]);

    const todayKey = useMemo(() => getDayKey(new Date(), timezone), [timezone]);

    // Compute now/next state from FILTERED events (what user sees)
    const nowNextState = useMemo(
        () => computeNowNextState({ events: mergedEvents, nowEpochMs: tableNowEpochMs, nowWindowMs: NOW_WINDOW_MS, buildKey: buildEventKey }),
        [mergedEvents, tableNowEpochMs],
    );

    // Compute now/next state from ALL events (before filters) to detect hidden events
    const globalNowNextState = useMemo(
        () => computeNowNextState({ events: rawEvents || [], nowEpochMs: tableNowEpochMs, nowWindowMs: NOW_WINDOW_MS, buildKey: buildEventKey }),
        [rawEvents, tableNowEpochMs],
    );

    // Check if next/now events exist globally but are hidden by filters
    const isNextEventHiddenByFilters = useMemo(() => {
        const hasGlobalNext = globalNowNextState.nextEventIds?.size > 0;
        const hasFilteredNext = nowNextState.nextEventIds?.size > 0;
        return hasGlobalNext && !hasFilteredNext;
    }, [globalNowNextState.nextEventIds, nowNextState.nextEventIds]);

    const isNowEventHiddenByFilters = useMemo(() => {
        const hasGlobalNow = globalNowNextState.nowEventIds?.size > 0;
        const hasFilteredNow = nowNextState.nowEventIds?.size > 0;
        return hasGlobalNow && !hasFilteredNow;
    }, [globalNowNextState.nowEventIds, nowNextState.nowEventIds]);

    const prevNowEventIdsRef = useRef(new Set());
    const prevNextEventIdsRef = useRef(new Set());
    const filtersBoxRef = useRef(null);
    const rightScrollRef = useRef(null);
    const leftScrollRef = useRef(null);
    const [showJumpToNext, setShowJumpToNext] = useState(false);
    const [showJumpToNow, setShowJumpToNow] = useState(false);
    const [jumpToNextDirection, setJumpToNextDirection] = useState('down');
    const [jumpToNowDirection, setJumpToNowDirection] = useState('down');
    const [filtersHeight, setFiltersHeight] = useState(0);

    const paperPaddingTopPx = useMemo(() => {
        if (isTwoColumn) return theme.spacing(0);
        if (isSmUp) return theme.spacing(0);
        return theme.spacing(0);
    }, [isTwoColumn, isSmUp, theme]);

    const stickyDayHeaderTop = useMemo(
        () => `calc(${filtersHeight}px + ${paperPaddingTopPx})`,
        [filtersHeight, paperPaddingTopPx],
    );

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsFiltersStuck(entry.intersectionRatio < 1);
            },
            { threshold: [1], rootMargin: '-1px 0px 0px 0px' }
        );

        const currentRef = filtersBoxRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    // Measure filters height for day header sticky positioning
    // Day headers should stick just below the filters box
    useLayoutEffect(() => {
        const measureHeight = () => {
            if (filtersBoxRef.current) {
                const height = filtersBoxRef.current.getBoundingClientRect().height;
                setFiltersHeight(height);
            }
        };

        // Measure on mount
        measureHeight();

        // Remeasure on resize
        const resizeObserver = new ResizeObserver(() => {
            measureHeight();
        });

        if (filtersBoxRef.current) {
            resizeObserver.observe(filtersBoxRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const adSlot = adRef.current;
        if (!adSlot) return undefined;

        let cleanupScript;
        let resizeObserver;
        let visibilityObserver;
        let idleHandle;

        const schedule = (cb) => {
            if (typeof window.requestIdleCallback === 'function') {
                return window.requestIdleCallback(cb, { timeout: 1800 });
            }
            return window.setTimeout(cb, 1200);
        };

        const cancelSchedule = (handle) => {
            if (!handle) return;
            if (typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(handle);
            } else {
                window.clearTimeout(handle);
            }
        };

        const pushAd = () => {
            if (!adRef.current || adInitializedRef.current) return;

            const container = adRef.current.parentElement;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const width = rect.width || container.offsetWidth;

            if (width <= 0) {
                if (!resizeObserver) {
                    resizeObserver = new ResizeObserver((entries) => {
                        for (const entry of entries) {
                            const entryWidth = entry.contentRect.width || entry.target.offsetWidth;
                            if (entryWidth > 0 && !adInitializedRef.current) {
                                pushAd();
                                if (resizeObserver) {
                                    resizeObserver.disconnect();
                                    resizeObserver = null;
                                }
                            }
                        }
                    });
                    resizeObserver.observe(container);
                }
                return;
            }

            adInitializedRef.current = true;
            try {
                window.adsbygoogle = window.adsbygoogle || [];
                window.adsbygoogle.requestNonPersonalizedAds = hasAdConsent() ? 0 : 1;
                window.adsbygoogle.push({});
            } catch {
                adInitializedRef.current = false;
            }
        };

        const loadScriptAndPush = () => {
            if (adInitializedRef.current) return;
            let script = document.querySelector('script#t2t-adsense');

            const handleScriptLoad = () => {
                if (script) {
                    script.setAttribute('data-loaded', 'true');
                }
                window.setTimeout(pushAd, 120);
            };

            if (!script) {
                script = document.createElement('script');
                script.id = 't2t-adsense';
                script.async = true;
                script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT_ID}`;
                script.crossOrigin = 'anonymous';
                script.addEventListener('load', handleScriptLoad);
                document.head.appendChild(script);
                cleanupScript = () => {
                    script.removeEventListener('load', handleScriptLoad);
                };
            } else if (script.getAttribute('data-loaded') === 'true' || script.readyState === 'complete') {
                window.setTimeout(pushAd, 120);
            } else {
                script.addEventListener('load', handleScriptLoad);
                cleanupScript = () => script.removeEventListener('load', handleScriptLoad);
            }
        };

        const triggerLoad = () => {
            if (adInitializedRef.current) return;
            cancelSchedule(idleHandle);
            idleHandle = schedule(loadScriptAndPush);
        };

        visibilityObserver = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    triggerLoad();
                    if (visibilityObserver) {
                        visibilityObserver.disconnect();
                        visibilityObserver = null;
                    }
                }
            },
            { rootMargin: '128px' },
        );

        visibilityObserver.observe(adSlot);

        const unsubscribe = subscribeConsent(() => {
            adInitializedRef.current = false;
            cancelSchedule(idleHandle);
            if (resizeObserver) {
                resizeObserver.disconnect();
                resizeObserver = null;
            }
            triggerLoad();
        });

        return () => {
            cancelSchedule(idleHandle);
            if (cleanupScript) cleanupScript();
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            if (visibilityObserver) {
                visibilityObserver.disconnect();
            }
            unsubscribe();
        };
    }, []);

    const nowEventIds = useMemo(() => {
        const nextSet = nowNextState.nowEventIds || new Set();
        if (areSetsEqual(prevNowEventIdsRef.current, nextSet)) return prevNowEventIdsRef.current;
        prevNowEventIdsRef.current = nextSet;
        return nextSet;
    }, [nowNextState.nowEventIds]);

    const nextEventIds = useMemo(() => {
        const nextSet = nowNextState.nextEventIds || new Set();
        if (areSetsEqual(prevNextEventIdsRef.current, nextSet)) return prevNextEventIdsRef.current;
        prevNextEventIdsRef.current = nextSet;
        return nextSet;
    }, [nowNextState.nextEventIds]);

    const nextEventEpochMs = nowNextState.nextEventEpochMs;
    const globalNextEventEpochMs = globalNowNextState.nextEventEpochMs;

    const nextCountdownLabel = useMemo(
        () => (nextEventEpochMs ? formatCountdownHMS(Math.max(0, nextEventEpochMs - tableNowEpochMs)) : null),
        [nextEventEpochMs, tableNowEpochMs],
    );

    // Show countdown for hidden next event (when filtered out)
    const hiddenNextCountdownLabel = useMemo(
        () => (isNextEventHiddenByFilters && globalNextEventEpochMs ? formatCountdownHMS(Math.max(0, globalNextEventEpochMs - tableNowEpochMs)) : null),
        [isNextEventHiddenByFilters, globalNextEventEpochMs, tableNowEpochMs],
    );

    const scrollFlashRef = useRef({ timerId: null, els: new Set() });

    // BEP: Memory leak prevention - cleanup scrollFlashRef on unmount
    useEffect(() => {
        // Capture ref value at effect creation time per React docs
        const flashState = scrollFlashRef.current;
        return () => {
            if (flashState.timerId) {
                window.clearTimeout(flashState.timerId);
            }
            flashState.els.clear();
        };
    }, []);

    // BEP: Ref for magic scroll retry cleanup
    const scrollRetryRef = useRef(null);

    // BEP: Memory leak prevention - cleanup scrollRetryRef on unmount
    useEffect(() => {
        return () => {
            if (scrollRetryRef.current) {
                clearTimeout(scrollRetryRef.current);
            }
        };
    }, []);

    const clearScrollFlash = useCallback(() => {
        if (typeof window === 'undefined') return;
        if (scrollFlashRef.current.timerId) {
            window.clearTimeout(scrollFlashRef.current.timerId);
            scrollFlashRef.current.timerId = null;
        }

        if (scrollFlashRef.current.els?.size) {
            for (const el of scrollFlashRef.current.els) {
                el.removeAttribute('data-t2t-scroll-flash');
            }
            scrollFlashRef.current.els.clear();
        }
    }, []);

    const flashAllNextRows = useCallback(() => {
        if (typeof document === 'undefined') return;

        const scrollRoot = rightScrollRef.current
            || document.querySelector('[data-t2t-calendar-scroll-root="true"]')
            || document;

        const nextRows = scrollRoot.querySelectorAll('[data-t2t-next-event-row="true"]');
        if (!nextRows.length) return;

        clearScrollFlash();

        nextRows.forEach((row) => {
            row.setAttribute('data-t2t-scroll-flash', 'true');
            scrollFlashRef.current.els.add(row);
        });

        scrollFlashRef.current.timerId = window.setTimeout(() => {
            clearScrollFlash();
        }, 1500);
    }, [clearScrollFlash]);

    const flashAllNowRows = useCallback(() => {
        if (typeof document === 'undefined') return;

        const scrollRoot = rightScrollRef.current
            || document.querySelector('[data-t2t-calendar-scroll-root="true"]')
            || document;

        const nowRows = scrollRoot.querySelectorAll('[data-t2t-now-event-row="true"]');
        if (!nowRows.length) return;

        clearScrollFlash();

        nowRows.forEach((row) => {
            row.setAttribute('data-t2t-scroll-flash', 'true');
            scrollFlashRef.current.els.add(row);
        });

        scrollFlashRef.current.timerId = window.setTimeout(() => {
            clearScrollFlash();
        }, 1500);
    }, [clearScrollFlash]);

    const scrollEventIntoView = useCallback((event, options = {}) => {
        if (!event || typeof document === 'undefined') return;
        const eventKey = buildEventKey(event);
        if (!eventKey) return;

        // Clear any pending retry
        if (scrollRetryRef.current) {
            clearTimeout(scrollRetryRef.current);
            scrollRetryRef.current = null;
        }

        const escapedKey = typeof window !== 'undefined' && window.CSS?.escape ? window.CSS.escape(eventKey) : eventKey.replace(/[^a-zA-Z0-9_-]/g, '_');
        const target = document.querySelector(`[data-t2t-event-row-key="${escapedKey}"]`);

        if (target) {
            // Center the event in the viewport on all breakpoints
            target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

            if (options.flash) {
                clearScrollFlash();
                target.setAttribute('data-t2t-scroll-flash', 'true');
                scrollFlashRef.current.els.add(target);

                scrollFlashRef.current.timerId = window.setTimeout(() => {
                    clearScrollFlash();
                }, 1500);
            }
        } else if (options.retryCount === undefined || options.retryCount < 10) {
            // BEP: Magic scroll - element not rendered yet, scroll towards it and retry
            // Find the day section that should contain this event
            const eventDate = event.date || event.startTime;
            if (eventDate) {
                const dayKey = getDayKey(new Date(eventDate), timezone);
                const daySection = document.querySelector(`[data-t2t-day-section="${dayKey}"]`);
                if (daySection) {
                    // Scroll to day section to trigger IntersectionObserver
                    daySection.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                }
            }
            // Retry after a short delay to allow magic scroll to render the element
            scrollRetryRef.current = setTimeout(() => {
                scrollEventIntoView(event, { ...options, retryCount: (options.retryCount || 0) + 1 });
            }, 200);
        }
    }, [clearScrollFlash, timezone]);

    const scrollToNextEvent = useCallback(() => {
        if (nextEventIds.size === 0 || mergedEvents.length === 0) return;

        // Find the first next event in the events array
        const firstNextEvent = mergedEvents.find((event) => {
            const eventKey = buildEventKey(event);
            return nextEventIds.has(eventKey);
        });

        if (firstNextEvent) {
            // When the user explicitly jumps back to the NEXT event, highlight all NEXT rows
            // so it's easy to spot additional upcoming items in the same window.
            flashAllNextRows();
            scrollEventIntoView(firstNextEvent);
        }
    }, [mergedEvents, flashAllNextRows, nextEventIds, scrollEventIntoView]);

    const scrollToNowEvent = useCallback(() => {
        if (nowEventIds.size === 0 || mergedEvents.length === 0) return;

        // Find the first NOW event in the events array
        const firstNowEvent = mergedEvents.find((event) => {
            const eventKey = buildEventKey(event);
            return nowEventIds.has(eventKey);
        });

        if (firstNowEvent) {
            // When the user explicitly jumps to a NOW event, highlight all NOW rows
            // so it's easy to spot all in-progress events.
            flashAllNowRows();
            scrollEventIntoView(firstNowEvent);
        }
    }, [mergedEvents, flashAllNowRows, nowEventIds, scrollEventIntoView]);

    const nowEventKey = useMemo(() => {
        if (nowEventIds.size === 0 || mergedEvents.length === 0) return null;

        const firstNowEvent = mergedEvents.find((event) => {
            const eventKey = buildEventKey(event);
            return nowEventIds.has(eventKey);
        });

        return firstNowEvent ? buildEventKey(firstNowEvent) : null;
    }, [mergedEvents, nowEventIds]);

    const nextEventKey = useMemo(() => {
        if (nextEventIds.size === 0 || mergedEvents.length === 0) return null;

        const firstNextEvent = mergedEvents.find((event) => {
            const eventKey = buildEventKey(event);
            return nextEventIds.has(eventKey);
        });

        return firstNextEvent ? buildEventKey(firstNextEvent) : null;
    }, [mergedEvents, nextEventIds]);

    useEffect(() => {
        if (typeof document === 'undefined') return undefined;
        if (!nextEventKey) {
            setShowJumpToNext(false);
            setJumpToNextDirection('down');
            return undefined;
        }

        const scrollRoot = rightScrollRef.current || document.querySelector('[data-t2t-calendar-scroll-root="true"]');
        if (!scrollRoot) {
            setShowJumpToNext(false);
            return undefined;
        }

        const escapedKey = typeof window !== 'undefined' && window.CSS?.escape
            ? window.CSS.escape(nextEventKey)
            : nextEventKey.replace(/[^a-zA-Z0-9_-]/g, '_');

        const nextRow = scrollRoot.querySelector(`[data-t2t-event-row-key="${escapedKey}"]`);
        if (!nextRow) {
            setShowJumpToNext(false);
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Show the CTA only when a NEXT event exists but is not currently visible.
                const shouldShow = !entry.isIntersecting;
                setShowJumpToNext(shouldShow);

                if (!shouldShow) return;

                const rootBounds = entry.rootBounds;
                const itemRect = entry.boundingClientRect;

                if (rootBounds) {
                    // If the top of the NEXT row is above the viewport, it's "above".
                    setJumpToNextDirection(itemRect.top < rootBounds.top ? 'up' : 'down');
                    return;
                }

                // Fallback for environments without rootBounds.
                const rootRect = scrollRoot.getBoundingClientRect?.();
                if (rootRect) {
                    setJumpToNextDirection(itemRect.top < rootRect.top ? 'up' : 'down');
                } else {
                    setJumpToNextDirection('down');
                }
            },
            {
                root: scrollRoot,
                threshold: 0.15,
            }
        );

        observer.observe(nextRow);

        return () => {
            observer.disconnect();
        };
    }, [nextEventKey, visibleDayKeys.length, showSkeletons, isTwoColumn]);

    // NOW event visibility detection - NOW takes priority over NEXT for the jump button
    useEffect(() => {
        if (typeof document === 'undefined') return undefined;
        if (!nowEventKey) {
            setShowJumpToNow(false);
            setJumpToNowDirection('down');
            return undefined;
        }

        const scrollRoot = rightScrollRef.current || document.querySelector('[data-t2t-calendar-scroll-root="true"]');
        if (!scrollRoot) {
            setShowJumpToNow(false);
            return undefined;
        }

        const escapedKey = typeof window !== 'undefined' && window.CSS?.escape
            ? window.CSS.escape(nowEventKey)
            : nowEventKey.replace(/[^a-zA-Z0-9_-]/g, '_');

        // Retry finding the DOM element if not immediately available (DOM might not be ready yet)
        let nowRow = scrollRoot.querySelector(`[data-t2t-event-row-key="${escapedKey}"]`);
        let retryCount = 0;
        const maxRetries = 3;

        const trySetupObserver = () => {
            if (!nowRow && retryCount < maxRetries) {
                retryCount += 1;
                setTimeout(() => {
                    nowRow = scrollRoot.querySelector(`[data-t2t-event-row-key="${escapedKey}"]`);
                    trySetupObserver();
                }, 50 * retryCount);
                return;
            }

            if (!nowRow) {
                setShowJumpToNow(false);
                return;
            }

            const observer = new IntersectionObserver(
                ([entry]) => {
                    // Show the CTA only when a NOW event exists but is not currently visible.
                    const shouldShow = !entry.isIntersecting;
                    setShowJumpToNow(shouldShow);

                    if (!shouldShow) return;

                    const rootBounds = entry.rootBounds;
                    const itemRect = entry.boundingClientRect;

                    if (rootBounds) {
                        // If the top of the NOW row is above the viewport, it's "above".
                        setJumpToNowDirection(itemRect.top < rootBounds.top ? 'up' : 'down');
                        return;
                    }

                    // Fallback for environments without rootBounds.
                    const rootRect = scrollRoot.getBoundingClientRect?.();
                    if (rootRect) {
                        setJumpToNowDirection(itemRect.top < rootRect.top ? 'up' : 'down');
                    } else {
                        setJumpToNowDirection('down');
                    }
                },
                {
                    root: scrollRoot,
                    threshold: 0.15,
                }
            );

            observer.observe(nowRow);

            return () => {
                observer.disconnect();
            };
        };

        return trySetupObserver();
    }, [nowEventKey, nowEventIds, mergedEvents, visibleDayKeys.length, showSkeletons, isTwoColumn]);

    const handleToggleFavorite = useCallback(async (event) => {
        logFavoriteDebug('toggle:start', {
            id: event?.id,
            eventId: event?.eventId || event?.EventId || event?.EventID || event?.Event_ID,
            name: event?.name || event?.Name,
            currency: event?.currency || event?.Currency,
            time: event?.time || event?.date || event?.Date,
        });
        const result = await toggleFavorite(event);
        logFavoriteDebug('toggle:result', result);
        if (result?.requiresAuth && onOpenAuth) {
            onOpenAuth();
        }
    }, [toggleFavorite, onOpenAuth]);

    const handleFiltersChangeGuard = useCallback((nextFilters, meta) => {
        if (!user) {
            if (onOpenAuth) {
                onOpenAuth();
            }
            return;
        }
        handleFiltersChange(nextFilters, meta);
    }, [handleFiltersChange, onOpenAuth, user]);

    const handleApplyFiltersGuard = useCallback((nextFilters) => {
        if (!user) {
            if (onOpenAuth) {
                onOpenAuth();
            }
            return;
        }
        // BEP: Set loading state synchronously to show skeletons immediately on filter apply
        setIsLoadingNewRange(true);
        applyFilters(nextFilters);
    }, [applyFilters, onOpenAuth, user]);

    const handleOpenEvent = useCallback((event, meta) => {
        if (!user) {
            if (onOpenAuth) {
                onOpenAuth();
            }
            setSelectedEvent(null);
            return;
        }

        if (meta?.source === 'canvas-tooltip') {
            // Clock tooltip rows should scroll to the corresponding table row only.
            // EventModal must only open from the Economic Calendar table click path.
            setSelectedEvent(null);
            scrollEventIntoView(event, { flash: true });
            return;
        }

        if (event?.isCustom) {
            // Open EventModal for custom events (to view)
            setSelectedEvent(event);
            return;
        }
        setSelectedEvent(event);
    }, [onOpenAuth, scrollEventIntoView, user]);

    const handleCloseEvent = useCallback(() => {
        setSelectedEvent(null);
    }, []);

    const handleOpenCustomDialog = useCallback((eventToEdit = null) => {
        // BEP: Allow non-auth users to open the dialog and fill values
        // Auth check happens on save (handleSaveCustomEvent)
        setCustomActionError('');
        setCustomEditingEvent(eventToEdit);
        setCustomDialogOpen(true);
    }, []);

    const handleEditCustomEvent = useCallback((event) => {
        setSelectedEvent(null); // Close EventModal
        setCustomEditingEvent(event);
        setCustomDialogOpen(true); // Open CustomEventDialog for editing
    }, []);

    const handleCloseCustomDialog = useCallback(() => {
        setCustomDialogOpen(false);
        setCustomEditingEvent(null);
        setCustomActionError('');
    }, []);

    const handleSaveCustomEvent = useCallback(async (payload) => {
        setCustomActionError('');
        if (!user) {
            if (onOpenAuth) {
                onOpenAuth();
            }
            return;
        }

        const eventId = customEditingEvent?.seriesId || customEditingEvent?.id;
        const result = eventId
            ? await saveEvent(eventId, payload)
            : await createEvent(payload);

        if (result?.requiresAuth) {
            if (onOpenAuth) {
                onOpenAuth();
            }
            return;
        }

        if (!result?.success) {
            setCustomActionError(result?.error || 'Unable to save reminder.');
            return;
        }

        setCustomDialogOpen(false);
        setCustomEditingEvent(null);
    }, [createEvent, customEditingEvent, onOpenAuth, saveEvent, user]);

    const handleDeleteCustomEvent = useCallback(async (eventToDelete) => {
        const eventId = eventToDelete?.seriesId || eventToDelete?.id;
        if (!eventId) return;
        const confirmed = window.confirm('Delete this reminder?');
        if (!confirmed) return;

        setCustomActionError('');
        const result = await removeEvent(eventId);

        if (result?.requiresAuth) {
            if (onOpenAuth) {
                onOpenAuth();
            }
            return;
        }

        if (!result?.success) {
            setCustomActionError(result?.error || 'Unable to delete reminder.');
            return;
        }

        setCustomDialogOpen(false);
        setCustomEditingEvent(null);
    }, [onOpenAuth, removeEvent]);

    const handleOpenNotes = useCallback((event) => {
        const { key, requiresAuth } = ensureNotesStream(event);
        if (requiresAuth && onOpenAuth) {
            onOpenAuth();
            return;
        }
        if (key) {
            setNoteTarget({ event, key });
        }
    }, [ensureNotesStream, onOpenAuth]);

    const handleCloseNotes = useCallback(() => {
        if (noteTarget?.event) {
            stopNotesStream(noteTarget.event);
        }
        setNoteTarget(null);
    }, [noteTarget, stopNotesStream]);

    const handleAddNote = useCallback(async (noteText) => {
        if (!noteTarget?.event) return { success: false };
        const result = await addNote(noteTarget.event, noteText);
        if (result?.requiresAuth && onOpenAuth) {
            onOpenAuth();
        }
        return result;
    }, [addNote, noteTarget, onOpenAuth]);

    const handleRemoveNote = useCallback(async (noteId) => {
        if (!noteTarget?.event) return { success: false };
        const result = await removeNote(noteTarget.event, noteId);
        if (result?.requiresAuth && onOpenAuth) {
            onOpenAuth();
        }
        return result;
    }, [noteTarget, onOpenAuth, removeNote]);

    const lastUpdatedLabel = useMemo(() => (lastUpdated ? lastUpdated.toLocaleTimeString() : null), [lastUpdated]);

    const clockPanel = (
        <ClockPanelPaper
            timeEngine={timeEngine}
            clockTimezone={clockTimezone}
            sessions={sessions}
            clockStyle={clockStyle}
            showSessionNamesInCanvas={showSessionNamesInCanvas}
            showPastSessionsGray={showPastSessionsGray}
            showClockNumbers={showClockNumbers}
            showClockHands={showClockHands}
            showHandClock={showHandClock}
            showDigitalClock={showDigitalClock}
            showSessionLabel={showSessionLabel}
            showTimeToEnd={showTimeToEnd}
            showTimeToStart={showTimeToStart}
            showEventsOnCanvas={showEventsOnCanvas}
            eventFilters={overlayEventFilters}
            newsSource={overlayNewsSource}
            backgroundBasedOnSession={backgroundBasedOnSession}
            selectedTimezone={selectedTimezone}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenTimezone={() => setTimezoneModalOpen(true)}
            onOpenEvent={handleOpenEvent}
            onOpenAddEvent={() => handleOpenCustomDialog()}
        />
    );

    const leftRailContent = isTwoColumn ? clockPanel : null;

    // Sticky filters at layout level - prevents content from pushing them
    // Memoized to avoid unnecessary re-renders during table updates
    const stickyFiltersNode = useMemo(
        () => (
            <Box ref={filtersBoxRef} sx={{ px: { xs: 1, sm: 1.25, md: 1.5 }, py: { xs: 1, sm: 1, md: 1 } }}>
                {/* Desktop: filters and stats on same row */}
                <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    spacing={{ xs: 1, lg: 1.5 }}
                    alignItems={{ xs: 'flex-start', lg: 'flex-start' }}
                    justifyContent="space-between"
                    sx={{
                        width: '100%',
                        flexWrap: 'nowrap',
                        overflowX: 'auto',
                        minWidth: 0,
                    }}
                >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <EventsFilters3
                            filters={filters}
                            onFiltersChange={handleFiltersChangeGuard}
                            onApply={handleApplyFiltersGuard}
                            loading={combinedLoading}
                            timezone={timezone}
                            newsSource={newsSource}
                            actionOffset={0}
                            defaultPreset="thisWeek"
                            stickyZIndex={1000}
                            stickyTop={0}
                            onOpenAddEvent={() => handleOpenCustomDialog()}
                            hasCustomEvents={customEvents?.length > 0}
                        />
                    </Box>
                </Stack>
            </Box >
        ),
        [filters, combinedLoading, timezone, newsSource, handleFiltersChangeGuard, handleApplyFiltersGuard, customEvents, handleOpenCustomDialog],
    );

    const calendarContent = (
        <>
            <Paper
                elevation={0}
                sx={{
                    flex: '1 1 auto',
                    position: 'relative',
                    mt: 0,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.text.primary, 0.12),
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    p: { xs: 1.25, sm: 1.5, md: 1.75 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isFiltersStuck ? 0 : 1.25,
                    width: '100%',
                    minWidth: 0,
                    maxWidth: '100%',
                    minHeight: 0,
                    overflow: 'visible',
                    boxSizing: 'border-box',
                    ...scrollbarSx,
                }}
            >
                {showSeoCopy && (
                    <Stack spacing={{ xs: 1.25, sm: 1.5, md: 1.75 }} sx={{ mb: 0, width: '100%' }}>
                        {/* Header: Title/Subtitle on left, Buttons on right */}
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={{ xs: 1.5, sm: 2, md: 2.5, lg: 3 }}
                            alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
                            justifyContent="space-between"
                            sx={{ width: '100%' }}
                        >
                            {/* Left: Title and subtitle */}
                            <Stack spacing={{ xs: 0.5, sm: 0.75 }} sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2, fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                                    {title || t('calendar:title')}
                                </Typography>
                                <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.72), lineHeight: 1.4, fontSize: { xs: '0.8125rem', sm: '0.875rem' }, display: 'flex', alignItems: 'center', gap: 0.3, flexWrap: 'wrap' }}>
                                    {t('calendar:headers.poweredBy')}
                                    <Link
                                        component="button"
                                        onClick={() => setForexFactoryModalOpen(true)}
                                        sx={{
                                            display: 'inline',
                                            color: 'inherit',
                                            textDecorationLine: 'underline',
                                            textDecorationColor: alpha(theme.palette.text.primary, 0.4),
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            lineHeight: 'inherit',
                                            verticalAlign: 'baseline',
                                            '&:hover': {
                                                textDecorationColor: 'inherit',
                                            },
                                        }}
                                    >
                                        {t('calendar:headers.forexFactory')}
                                    </Link>
                                </Typography>
                                {/* Event count - show on sm/md below subtitle */}
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.8125rem' }, lineHeight: 1.4, display: { xs: 'none', sm: 'block', lg: 'none' }, mt: 0.25 }}>
                                    {showSkeletons ? t('calendar:stats.loadingEvents') : t('calendar:stats.eventsCount', { count: visibleCount.toLocaleString() })}
                                </Typography>
                            </Stack>

                            {/* Right: Action buttons - Add button on xs, stacked on sm/md, inline on lg+ */}
                            <Stack
                                direction={{ xs: 'column', lg: 'row' }}
                                spacing={{ xs: 0.75, sm: 1, lg: 1.25 }}
                                alignItems={{ xs: 'flex-end', sm: 'flex-end', md: 'flex-end', lg: 'center' }}
                                sx={{
                                    flexShrink: 0,
                                    width: { xs: 'auto', sm: 'auto' },
                                    minWidth: 0,
                                    position: { xs: 'absolute', sm: 'relative' },
                                    top: { xs: 0, sm: 'auto' },
                                    right: { xs: 0, sm: 'auto' },
                                    pr: { xs: 2, sm: 0 },
                                }}
                            >
                                {/* Add custom event button - hide on lg+ (shown in EventsFilters3) */}
                                <Tooltip title={t('calendar:actions.addCustomEvent')}>
                                    <Button
                                        onClick={() => handleOpenCustomDialog()}
                                        variant="outlined"
                                        color="default"
                                        size="small"
                                        startIcon={<AddRoundedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                                        sx={{
                                            display: { xs: 'flex', lg: 'none' },
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            borderRadius: 999,
                                            height: { xs: 36, sm: 40 },
                                            px: { xs: 1.5, sm: 2 },
                                            whiteSpace: 'nowrap',
                                            boxShadow: 'none',
                                            bgcolor: theme.palette.background.paper,
                                            color: 'text.primary',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                                            {t('calendar:actions.addEventShort')}
                                        </Box>
                                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                                            {t('calendar:actions.addCustomEvent')}
                                        </Box>
                                    </Button>
                                </Tooltip>

                                {/* Next/Now buttons - show active, disabled (hidden by filters), or nothing */}
                                {(nextCountdownLabel || hiddenNextCountdownLabel || nowEventIds.size > 0 || isNowEventHiddenByFilters) && (
                                    <>
                                        {/* Next event button - active or disabled by filters */}
                                        {(nextCountdownLabel || hiddenNextCountdownLabel) && (
                                            <Tooltip title={isNextEventHiddenByFilters ? t('calendar:stats.nextEventHiddenByFilters') : t('tooltips:jumpToNext')}>
                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    alignItems="center"
                                                    onClick={isNextEventHiddenByFilters ? undefined : scrollToNextEvent}
                                                    sx={{
                                                        cursor: isNextEventHiddenByFilters ? 'not-allowed' : 'pointer',
                                                        px: { xs: 1.25, sm: 1.5 },
                                                        py: { xs: 0.625, sm: 0.75 },
                                                        borderRadius: 999,
                                                        border: '1px solid',
                                                        bgcolor: theme.palette.background.paper,
                                                        borderColor: alpha(theme.palette.text.primary, 0.23),
                                                        transition: 'all 0.2s ease',
                                                        opacity: isNextEventHiddenByFilters ? 0.5 : 1,
                                                        ...(!isNextEventHiddenByFilters && {
                                                            '&:hover': {
                                                                bgcolor: alpha(theme.palette.success.main, 0.08),
                                                                borderColor: alpha(theme.palette.success.main, 0.5),
                                                            },
                                                            '&:active': {
                                                                bgcolor: alpha(theme.palette.success.main, 0.12),
                                                            },
                                                        }),
                                                    }}
                                                >
                                                    <AccessTimeIcon sx={{ fontSize: { xs: 13, sm: 14 }, color: isNextEventHiddenByFilters ? 'text.disabled' : 'success.main' }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: isNextEventHiddenByFilters ? 'text.disabled' : 'text.primary', fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}>
                                                        {t('calendar:stats.nextIn', { time: nextCountdownLabel || hiddenNextCountdownLabel })}
                                                    </Typography>
                                                </Stack>
                                            </Tooltip>
                                        )}
                                        {/* Now event button - active or disabled by filters (only show if no next button) */}
                                        {!nextCountdownLabel && !hiddenNextCountdownLabel && (nowEventIds.size > 0 || isNowEventHiddenByFilters) && (
                                            <Tooltip title={isNowEventHiddenByFilters ? t('calendar:stats.nowEventHiddenByFilters') : t('tooltips:jumpToNow')}>
                                                <Stack
                                                    direction="row"
                                                    spacing={0.5}
                                                    alignItems="center"
                                                    onClick={isNowEventHiddenByFilters ? undefined : scrollToNowEvent}
                                                    sx={{
                                                        cursor: isNowEventHiddenByFilters ? 'not-allowed' : 'pointer',
                                                        px: { xs: 1.25, sm: 1.5 },
                                                        py: { xs: 0.625, sm: 0.75 },
                                                        borderRadius: 999,
                                                        border: '1px solid',
                                                        bgcolor: theme.palette.background.paper,
                                                        borderColor: alpha(theme.palette.text.primary, 0.23),
                                                        transition: 'all 0.2s ease',
                                                        opacity: isNowEventHiddenByFilters ? 0.5 : 1,
                                                        ...(!isNowEventHiddenByFilters && {
                                                            '&:hover': {
                                                                bgcolor: alpha(theme.palette.info.main, 0.08),
                                                                borderColor: alpha(theme.palette.info.main, 0.5),
                                                            },
                                                            '&:active': {
                                                                bgcolor: alpha(theme.palette.info.main, 0.12),
                                                            },
                                                        }),
                                                    }}
                                                >
                                                    <AccessTimeIcon sx={{ fontSize: { xs: 13, sm: 14 }, color: isNowEventHiddenByFilters ? 'text.disabled' : 'info.main' }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: isNowEventHiddenByFilters ? 'text.disabled' : 'text.primary', fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}>
                                                        {t('calendar:stats.eventsInProgress')}
                                                    </Typography>
                                                </Stack>
                                            </Tooltip>
                                        )}
                                    </>
                                )}
                            </Stack>
                        </Stack>

                        {/* Event count - show on xs only (sm/md show in subtitle, lg+ in filters) */}
                        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.75rem', lineHeight: 1.4 }}>
                                {showSkeletons ? t('calendar:stats.loadingEvents') : t('calendar:stats.eventsCount', { count: visibleCount.toLocaleString() })}
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: alpha(theme.palette.text.primary, 0.12) }} />
                    </Stack>
                )}

                {combinedError || customActionError ? (
                    <Alert
                        severity="error"
                        sx={{ borderRadius: 2 }}
                        action={permissionError && onOpenAuth && !user ? (
                            <Button color="inherit" size="small" onClick={onOpenAuth}>
                                {t('common:auth.signIn')}
                            </Button>
                        ) : null}
                    >
                        {combinedError || customActionError}
                    </Alert>
                ) : null}

                {notesError ? (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {notesError}
                    </Alert>
                ) : null}

                <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0 }}>
                    {visibleDayKeys.length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                {t('calendar:empty.selectDateRange')}
                            </Typography>
                        </Paper>
                    ) : (
                        visibleDayKeys.map((dayKey) => (
                            <DaySection
                                key={dayKey}
                                dayKey={dayKey}
                                timezone={timezone}
                                events={eventsByDay.get(dayKey) || []}
                                nowEventIds={nowEventIds}
                                nextEventIds={nextEventIds}
                                nextCountdownLabel={nextCountdownLabel}
                                nowEpochMs={tableNowEpochMs}
                                onToggleFavorite={handleToggleFavorite}
                                isFavorite={isFavorite}
                                isFavoritePending={isFavoritePending}
                                onOpenEvent={handleOpenEvent}
                                isLoading={showSkeletons}
                                isToday={dayKey === todayKey}
                                stickyHeaderZIndex={999}
                                stickyHeaderTop={stickyDayHeaderTop}
                            />
                        ))
                    )}
                </Stack>

                <Divider sx={{ borderColor: alpha(theme.palette.text.primary, 0.12), mt: 1, mb: 0.5 }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                        }}
                    >
                        © {new Date().getFullYear()} {t('common:copyright')}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 600,
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                        }}
                    >
                        {lastUpdatedLabel ? t('calendar:sync.updated', { time: lastUpdatedLabel }) : t('calendar:sync.awaitingSync')}
                    </Typography>
                </Stack>
            </Paper>
        </>
    );

    return (
        <>
            <CalendarGridLayout
                isTwoColumn={isTwoColumn}
                leftContent={leftRailContent}
                rightContent={calendarContent}
                leftScrollRef={leftScrollRef}
                rightScrollRef={rightScrollRef}
                showJumpToNext={showJumpToNext && !showJumpToNow}
                onJumpToNext={scrollToNextEvent}
                jumpToNextDirection={jumpToNextDirection}
                showJumpToNow={showJumpToNow}
                onJumpToNow={scrollToNowEvent}
                jumpToNowDirection={jumpToNowDirection}
                isNextEventHiddenByFilters={isNextEventHiddenByFilters}
                isNowEventHiddenByFilters={isNowEventHiddenByFilters}
                nextCountdownLabel={nextCountdownLabel}
                hiddenNextCountdownLabel={hiddenNextCountdownLabel}
                appBar={appBar}
                stickyFiltersNode={stickyFiltersNode}
            />

            <CustomEventDialog
                open={customDialogOpen}
                onClose={handleCloseCustomDialog}
                onSave={handleSaveCustomEvent}
                onDelete={handleDeleteCustomEvent}
                event={customEditingEvent}
                defaultTimezone={clockTimezone}
                zIndexOverride={customEditingEvent ? 12003 : undefined}
            />

            <Suspense fallback={null}>
                <EventModal
                    open={Boolean(selectedEvent)}
                    onClose={handleCloseEvent}
                    event={selectedEvent}
                    timezone={timezone}
                    isFavoriteEvent={isFavorite}
                    onToggleFavorite={handleToggleFavorite}
                    isFavoritePending={isFavoritePending}
                    favoritesLoading={favoritesLoading}
                    hasEventNotes={hasNotes}
                    onOpenNotes={handleOpenNotes}
                    isEventNotesLoading={isEventNotesLoading}
                    onEditCustomEvent={handleEditCustomEvent}
                />
            </Suspense>

            <Suspense fallback={null}>
                <SettingsSidebar2
                    open={settingsOpen}
                    onClose={() => setSettingsOpen(false)}
                    onOpenAuth={onOpenAuth}
                    onOpenContact={() => {
                        setSettingsOpen(false);
                        setContactModalOpen(true);
                    }}
                />
            </Suspense>

            {contactModalOpen ? (
                <Suspense fallback={null}>
                    <ContactModal open={contactModalOpen} onClose={() => setContactModalOpen(false)} />
                </Suspense>
            ) : null}

            <Suspense fallback={null}>
                <EventNotesDialog
                    open={Boolean(noteTarget)}
                    onClose={handleCloseNotes}
                    event={noteTarget?.event || null}
                    timezone={timezone}
                    notes={noteTarget ? getNotesForEvent(noteTarget.event) : []}
                    loading={noteTarget ? isEventNotesLoading(noteTarget.event) : false}
                    onAddNote={handleAddNote}
                    onRemoveNote={handleRemoveNote}
                    error={notesError}
                />
            </Suspense>

            {/* Timezone Modal */}
            <Suspense fallback={null}>
                <TimezoneModal
                    open={timezoneModalOpen}
                    onClose={() => setTimezoneModalOpen(false)}
                    onOpenAuth={onOpenAuth}
                    zIndex={1701}
                />
            </Suspense>

            <Dialog
                open={newsSourceModalOpen}
                onClose={() => setNewsSourceModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: { xs: 0, sm: 3 },
                        m: { xs: 0, sm: 2 },
                        maxHeight: { xs: '100vh', sm: 'calc(100vh - 64px)' },
                    },
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        pb: 1,
                    }}
                >
                    <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                        Data Source Information
                    </Typography>
                    <IconButton
                        edge="end"
                        onClick={() => setNewsSourceModalOpen(false)}
                        aria-label={t('calendar:aria.close')}
                        sx={{ ml: 1 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 1, pb: 3 }}>
                    <Suspense fallback={null}>
                        <NewsSourceSelector />
                    </Suspense>
                </DialogContent>
            </Dialog>

            {/* Forex Factory Detailed Modal - Controlled NewsSourceSelector */}
            <Suspense fallback={null}>
                <NewsSourceSelector
                    open={forexFactoryModalOpen}
                    onOpenChange={setForexFactoryModalOpen}
                    showButton={false}
                />
            </Suspense>
        </>
    );
}

CalendarEmbed.propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    onOpenAuth: PropTypes.func,
    showSeoCopy: PropTypes.bool,
    appBar: PropTypes.node,
    isCalendarRoute: PropTypes.bool,
};
