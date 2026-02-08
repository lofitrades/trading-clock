<!--
kb/BrandGuide.md

Purpose: Brand identity specification for Time 2 Trade. Defines logo usage, color palette, and visual guidelines.
Used by: Developers, designers, and Custom GPT blog generator (for DALL-E image generation).

Changelog:
v3.1.0 - 2026-02-06 - BEP: Added finalized universal default blog thumbnail prompt with full specifications.
v3.0.0 - 2026-02-04 - BEP: Added file header, DALL-E image generation section with prompt templates and color specs for AI.
v2.0.0 - 2026-01-22 - Added UI Color Palette section, AAA accessibility compliance.
v1.0.0 - 2025-09-15 - Initial brand guide.
-->

# Brand Logo Usage Guide

This document defines the approved usage, variants, and color specifications for the brand logo and UI color palette.

---

## 🎨 Color Palette Overview (Quick Reference for AI Image Generation)

### Primary Colors for DALL-E Images
| Color | Hex | RGB | Usage in Images |
|-------|-----|-----|-----------------|
| **Dark Teal** | `#006064` | rgb(0, 96, 100) | Primary accent, dominant color |
| **Light Teal** | `#428E92` | rgb(66, 142, 146) | Secondary accent, gradients |
| **Orange Accent** | `#FFA85C` | rgb(255, 168, 92) | Warm highlight (sparingly) |
| **Deep Teal** | `#00363A` | rgb(0, 54, 58) | Dark backgrounds, depth |

### Colors to AVOID in Images
| Color | Why Avoid |
|-------|-----------|
| **Red/Green** | Implies bullish/bearish trading signals |
| **Bright neon** | Off-brand, unprofessional |
| **Pure black** | Too harsh; use deep teal instead |
| **Crypto colors** | Bitcoin orange, Ethereum purple (off-topic) |

---

## 🖼️ AI Image Generation Guidelines (DALL-E)

### Blog Cover Image Specifications
- **Dimensions:** Generate at 1792×1024 (DALL-E landscape), crop to 1200×630 for OG/social
- **Style:** Modern, abstract, professional financial visualization
- **Mood:** Clean, confident, enterprise-grade

### Prompt Template
```
Professional financial blog cover image, abstract [TOPIC THEME], 
modern minimalist style, dark teal (#006064) as primary accent color, 
light teal (#428E92) gradients, subtle geometric patterns, 
clean gradient background, corporate enterprise aesthetic, 
no text, no typography, no people, no faces, 
8k quality, editorial magazine style
```

### Topic-Specific Themes
| Topic | Visual Theme |
|-------|--------------|
| CPI/Inflation | Data visualization, flowing numbers, subtle heat/warmth elements |
| FOMC/Fed | Abstract federal architecture silhouette, financial grid overlay |
| NFP/Employment | Workforce data visualization, upward flowing abstract elements |
| GDP/Economy | Economic growth charts dissolving into geometric shapes |
| Trading Sessions | World map with glowing timezone bands, clock elements |
| General Markets | Abstract candlestick patterns morphing into geometric shapes |
| Education | Clean infographic style, knowledge/learning symbols |

### Image DO's
✅ Abstract financial/data visualization  
✅ Geometric patterns suggesting markets/time  
✅ Subtle gradients using brand teals  
✅ World maps, clock elements, chart abstractions  
✅ Clean, uncluttered compositions  
✅ Professional magazine/editorial aesthetic  

### Image DON'Ts
❌ Text or typography (inconsistent rendering)  
❌ People, faces, hands  
❌ Specific chart patterns implying trade direction  
❌ Red/green colors (bullish/bearish implication)  
❌ Stock photo aesthetic (handshakes, suits, offices)  
❌ Crypto imagery (unless specifically relevant)  
❌ Cluttered or busy compositions  
❌ Realistic trading screens or platforms  

---

## 🖼️ Universal Default Blog Thumbnail

**File:** `/public/blog/Blog_Default_Thumbnail.png`  
**Use:** Fallback for posts without custom cover images (set automatically by uploader)

### Specifications
- **Generate:** 1792×1024 (DALL-E landscape)
- **Crop-safe for:** 1200×630 (OG/social cards) - keep key elements in center safe area
- **Style:** Clean, modern, enterprise SaaS aesthetic (premium fintech product)
- **Mood:** Minimal, calm, confident

### Full Generation Prompt
```
8k enterprise fintech blog cover background for Time 2 Trade, 
light near-white cool gradient background with ultra-subtle grid/dots and faint world map at 5-8% opacity, 
minimal negative space (70-80%), 
smooth rounded brand arcs inspired by T2T logo using accents #4E7DFF #018786 #FFA85C #FF6F91 #8B6CFF (restrained, on edges/corners), 
subtle ghosted trading motifs (session clock ring, thin price lines, tiny candlestick silhouettes at 5-10% opacity), 
clean modern vector style, 
no text, no people, no red/green signals, 
1792×1024, crop-safe for 1200×630
```

### Design Elements
| Element | Specification |
|---------|---------------|
| **Background** | Light near-white with subtle cool tint, faint grid/dotted matrix OR ghosted world map at 5-8% opacity |
| **Brand Arcs** | 2-3 large soft ribbons with rounded ends, placed on edges/corners (not center) |
| **Arc Colors** | Blue #4E7DFF, Teal #018786, Orange #FFA85C, Pink #FF6F91, Purple #8B6CFF (restrained use) |
| **Trading Motifs** | Ghost elements at 5-10% opacity: session clock ring, 2-3 candlestick silhouettes, thin price level lines, tiny data dots |
| **Negative Space** | 70-80% for repeated use without feeling noisy |

### Must Avoid (Negative Prompt)
- People, faces, hands, trading floors
- Crypto symbols, neon cyberpunk
- Realistic screenshots, busy dashboards
- Big candles, "buy/sell", signals, red/green dominance
- Harsh black backgrounds (use deep teal sparingly if needed)
- Text, logos, watermarks

---

## 🎨 Full Color Palette

### Logo Colors (Brand Identity)
The multicolor logo maintains specific brand colors for marketing and brand recognition.

### UI Colors (Product Application)
The product interface uses a refined color palette optimized for accessibility, contrast, and usability.

| Color Role | Hex | Usage |
|------------|-----|-------|
| **Primary Main** | `#006064` | Buttons, links, active states, custom event chips |
| **Primary Light** | `#428E92` | Hover states, accents, lighter backgrounds |
| **Primary Dark** | `#00363A` | Active states, depth, pressed buttons |
| **Secondary Main** | `#85b8b7` | Complementary elements, alternative actions |
| **Secondary Light** | `#a8d8b9` | Subtle accents, soft highlights |
| **Secondary Dark** | `#5a8988` | Secondary depth, muted states |

**Note:** The logo teal (`#018786`) differs from UI primary (`#006064`) by design—the UI color provides superior contrast and AAA accessibility compliance for interactive elements.

---

## 1️⃣ Brand Identity Overview

The brand has **three tiers**, ordered by priority:

1. **Primary Logo — Multicolor** (default for expressive and brand-forward contexts)
2. **Secondary Logo — Color Variations** (teal/white swaps for product UI and clarity)
3. **Other Logo — Black** (rare, accessibility or monochrome constraints only)

All variants must keep shape, spacing, and stroke proportions intact.

---

## 2️⃣ Primary Logo (Multicolor)

### Default Use Cases

* Marketing website and landing pages
* Hero sections and storytelling moments
* Presentation slides and social media
* Brand-forward UI moments (sparingly)

### Color Specification

| Arc Position | Hex                             |
| ------------ | ------------------------------- |
| Top Left     | `#4E7DFF` (Blue)                |
| Bottom Left  | `#018786` (Teal — brand anchor) |
| Right Large  | `#FFA85C` (Orange)              |
| Right Inner  | `#FF6F91` (Pink)                |
| Bottom Small | `#8B6CFF` (Purple)              |

### Files (preferred)

* Multicolor (opaque): Time2Trade_Logo_Main_Multicolor_1080.png / .svg
* Multicolor (transparent): Time2Trade_Logo_Main_Multicolor_Transparent_1080.png / .svg

### Rules

* Do not change shape
* Do not modify spacing
* Do not thin or thicken strokes (unless purpose-built for tiny icons)
* Do not recolor arbitrarily

---

## 3️⃣ Secondary Logo (Color Variations)

### Default Use Cases

* In-app UI (default)
* Navigation bars and system UI
* Formal/enterprise contexts
* Corporate documents and data-heavy screens

### Rules

* Colors must remain consistent
* Do not desaturate
* Do not pastelize
* Do not change the order of colors
* Do not randomize colors in different contexts

### Variants + Files

* Teal on white (default product): Time2Trade_Logo_Secondary_TealOnWhite_1080.png / .svg
* Teal transparent: Time2Trade_Logo_Secondary_Teal_Transparent_1080.png / .svg
* White on teal (inverse): Time2Trade_Logo_Secondary_WhiteOnTeal_1080.png / .svg
* White transparent: Time2Trade_Logo_Secondary_White_Transparent_1080.png / .svg

---

## 4️⃣ Other Logo (Very Occasional Use)

### Default Use Cases

* Monochrome-only environments
* Legacy or accessibility-driven constraints where teal/white fail contrast
* Watermarks that must stay grayscale

### File

* Black transparent: Time2Trade_Logo_Other_Black_Transparent_1080.png / .svg

Use only when Primary or Secondary options are unsuitable.

---

## 5️⃣ Favicon & Small Icon Usage

For extremely small usage sizes:

* Prefer teal-based secondary variants for clarity
* White-on-teal is acceptable when dark backgrounds are required
* Favicon set: android-chrome-192x192.png, android-chrome-512x512.png, apple-touch-icon.png, favicon-16x16.png, favicon-32x32.png, favicon.ico

---

## 6️⃣ Background & Contrast Rules

### Light Mode

* White background
* Teal logo (preferred)
* Or multicolor logo when intentionally branding

### Dark / Inverse Mode

* Teal background
* White arcs

---

## 7️⃣ Brand Integrity Rules

To protect the identity:

❌ Do not stretch
❌ Do not rotate
❌ Do not distort
❌ Do not apply shadows or gradients
❌ Do not outline
❌ Do not modify arc proportions

✔ Maintain spacing
✔ Maintain silhouette
✔ Maintain consistent stroke width
✔ Maintain exact colors

---

## 8️⃣ Decision Guidance

If unsure which logo to use:

* If it lives **inside the product → Mono Teal**
* If it communicates **brand emotion or story → Multicolor**
* When absolute clarity or professionalism is required → Mono Teal
* When creativity and friendliness matter → Multicolor

---

## 🔄 Changelog

**v3.0.0 - 2026-02-04**
- BEP: Added file header with purpose and GPT usage note
- Added comprehensive DALL-E image generation section with prompt templates
- Added topic-specific visual themes for blog covers
- Added explicit DO's and DON'Ts for AI image generation
- Added RGB values for easier AI color interpretation

**v2.0.0 - 2026-01-22**
- Added UI Color Palette section distinguishing product colors from logo brand colors
- Documented primary palette update: UI uses `#006064` (dark teal) for superior AAA accessibility
- Clarified that logo teal (`#018786`) remains intact for brand identity
- Primary light adjusted to `#428E92`, primary dark to `#00363A` for cohesive UI system

**v1.0.0 - 2025-09-15**
- Initial brand guide with logo variants, usage rules, and brand integrity guidelines

---

## 9️⃣ Official Status

All logos above are approved within the stated hierarchy: Primary (Multicolor) → Secondary (Color Variations) → Other (Black, rare).