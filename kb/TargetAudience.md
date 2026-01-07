# TargetAudience.md
Time 2 Trade (Trading Clock + Economic Events)

## 0) Purpose of this document
This file is for **developers and product builders** working on Time 2 Trade. It defines:
- **Who** the app is for (and not for)
- **What problems** those users are trying to solve
- **How the current product logic maps** to real workflows
- **Implications** for UX, feature gating, and future roadmap decisions

This is **not marketing copy**. It is an internal, implementation-oriented audience spec.

---

## 1) Product reality (what exists in the code today)
Time 2 Trade is a **visual intraday timing workspace**:
- A **session clock UI** (canvas-based) displaying sessions and overlaps across a 24h day.
- A **market events experience**:
  - Timeline/table rendering
  - Filters (impact/currency/search)
  - Event details / modal patterns
  - Personalization (favorites/notes)
- **Guest vs signed-in** behavior:
  - Guest: can use the clock and basic UI; preferences persist in localStorage.
  - Signed-in: unlocks calendar UI routes/views (auth-gated), and settings persist via Firestore sync.
- Optional PWA install behavior.

This is a **timing and awareness tool**, not a trading terminal and not a signal generator.

---

## 2) Audience overview (core statement)
### Primary audience
**Futures + forex day traders** who trade primarily around:
- Global market sessions (NY / London / Asia)
- Session overlaps
- High-impact economic releases (CPI, NFP, FOMC, rates, key speeches)

They want **immediate context** before executing trades.

### Secondary audience
**Anyone who checks an economic calendar regularly** and needs:
- Fast “what’s coming next?” awareness
- Clear timezone handling (especially New York time)

### Community-fit audience (explicit targets)
- **ICT-style traders/students** and similar session-based methodologies (killzones, timing windows)
- **TTrades / TheMarketLens** students/traders (process-oriented intraday execution)
- **Funded / prop traders** needing disciplined event-avoidance and consistent daily routines

---

## 3) Audience segments (more granular)
### Segment A — Futures day trader (index futures focus)
- Instruments: ES/MES, NQ/MNQ, YM/MYM, RTY/M2K
- “Market day” anchored to New York time
- Checks: session opens, lunch lull, power hour, news windows
- Needs:
  - Clear “what session are we in?”
  - Countdown to session transitions
  - Avoid trading into CPI/NFP/FOMC volatility windows

### Segment B — Forex day trader / scalper
- Instruments: major FX pairs (EURUSD, GBPUSD, USDJPY, etc.)
- Highly sensitive to:
  - London open + NY overlap
  - Economic calendar volatility, especially USD events
- Needs:
  - Overlap visibility and session context
  - Quick filtering by currency (e.g., USD only)
  - Fast “event incoming” check without extra tabs

### Segment C — Intraday trader who “only cares about a few events”
- Strategy: mostly avoids specific catalysts (CPI/NFP/FOMC) and trades normal days
- Needs:
  - Minimalist UI that surfaces only major events
  - Persisted filters (impact high only, USD only)
  - “Is there a big event soon?” at a glance

### Segment D — Funded / prop trader (evaluation + payout)
- Constraint-driven:
  - daily loss limits, trailing drawdown rules, news restrictions
- Needs:
  - Consistent routine: same view every day
  - Pre-trade checks: sessions + events
  - Reduced cognitive overhead; fast open; mobile-friendly

### Segment E — Students (ICT / TTrades / TheMarketLens)
- Learning environment; wants a “training wheels” UI:
  - killzone windows
  - session ranges
  - discipline around timing and event avoidance
- Needs:
  - Clarity and consistency
  - Simple terminology
  - Reliable timezone handling

---

## 4) Personas (dev-friendly)
### Persona 1 — “NY Session Executor”
- Goal: only trade during defined session windows
- Behaviors:
  - Opens tool right before session open
  - Uses countdown to align entries
- Success criteria:
  - Never surprised by session transitions
  - Always knows “where we are in the day”

### Persona 2 — “News Avoider”
- Goal: avoid high-impact volatility windows
- Behaviors:
  - Checks upcoming events 1–3 times per session
  - Filters to impact + currency
- Success criteria:
  - No trades taken immediately before major releases

### Persona 3 — “Prop Account Operator”
- Goal: keep rules compliance + consistency
- Behaviors:
  - Uses same workflow every day
  - Wants settings synced across devices
- Success criteria:
  - Predictable routine, low friction, fast launch

### Persona 4 — “Student / Framework Follower”
- Goal: learn timing patterns; build discipline
- Behaviors:
  - Watches sessions/killzones
  - Studies event days vs normal days
- Success criteria:
  - Clear reference view; repeatable mental model

---

## 5) Jobs To Be Done (JTBD)
### JTBD-1: “Know what’s open now”
- Trigger: I’m about to trade / I’m checking if conditions match my plan
- Desired outcome: instantly know current session and time remaining

### JTBD-2: “Avoid scheduled volatility”
- Trigger: I’m about to enter a trade
- Desired outcome: quickly confirm whether a high-impact event is near

### JTBD-3: “Reduce timezone friction”
- Trigger: I learned/trade in NY time but live elsewhere
- Desired outcome: view remains consistent; timezone conversions are reliable and understandable

### JTBD-4: “Build a consistent daily routine”
- Trigger: I want repeatable execution (especially in a funded account)
- Desired outcome: open app → see sessions + events → trade or stand down

---

## 6) Pain points (what users hate today)
- “What time is London open in my timezone?”
- “I forgot CPI was today.”
- “My calendar shows one timezone, my chart is another.”
- “I’m flipping between 3–5 tabs just to check timing.”
- “I want a clean view, not a cluttered calendar UI.”

---

## 7) How product features map to audiences
### Session Clock (core)
Best for:
- Futures/forex day traders
- Students following session-based strategies
- Prop traders needing routine

Key requirements:
- Session definitions must be correct and consistent
- Overlap visuals must be readable on mobile
- “Active session” logic must handle midnight crossing reliably

### Economic Events (auth-gated in current product)
Best for:
- News avoiders
- Forex traders filtering by currency
- Prop traders

Key requirements:
- Fast filter UX (impact/currency/search)
- Time formatting that matches the user’s selected timezone policy
- Clear “upcoming” ordering
- Stable event IDs for favorites/notes

### Persistence model
Guest (localStorage) supports:
- Low friction “try it now”
Signed-in (Firestore) supports:
- Multi-device settings
- Personal notes/favorites
- Calendar access

Implication:
- Any feature critical to “first value” should be usable as guest.
- Any feature that’s “power user / retention” can be gated behind auth.

---

## 8) Non-goals (explicitly out of scope)
The app is **not**:
- A broker integration, trading terminal, or execution platform
- A signal generator (“buy/sell here”)
- A portfolio tracker
- Orderflow tooling (DOM, footprint, heatmaps)
- A full macro research platform

If new features drift into these areas, they should be treated as separate products or integrations.

---

## 9) Terminology guidelines (for UI + future copy)
Use terms day traders actually use:
- “Sessions” (NY / London / Asia)
- “Overlap”
- “High-impact events”
- “New York time” (prefer explicit naming over “EST/EDT” unless necessary)

Avoid jargon without definition:
- “Killzone” is acceptable if we also provide a neutral explanation like “timing window”
- Avoid “workflow” unless defined in-app

Always avoid implying advice:
- “Awareness” and “context” > “signals” and “edge”

---

## 10) Timezone policy (audience-critical)
Reality:
- Intraday education and many strategies reference **New York time**.
- Users may live in different regions but still want NY anchored behavior.

Dev implications:
- Be explicit in UI when “NY time” is the reference.
- If allowing timezone switching:
  - Avoid ambiguity; show the selected timezone clearly
  - Ensure event times and session arcs reflect the same policy
- Avoid mixed-timezone displays (chart ≠ app ≠ calendar).

---

## 11) Trust and reliability expectations
Users will judge the product by:
- Correct session boundaries
- Correct event time conversions
- Consistent “upcoming event” ordering
- Stability (no glitches around midnight / DST / month-end)
- Fast performance (especially on mobile)

If we claim reliability, we must:
- Handle DST transitions cleanly
- Validate session schedule logic wit
