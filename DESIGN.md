---
name: FoodBridge
description: A community coordination platform for food sharing and waste collection in Sri Lanka.
colors:
  # Dashboard system (tokens.css / --color-* properties)
  primary: "#167347"
  primary-hover: "#105b37"
  primary-soft: "#eaf5ee"
  accent: "#b54726"
  accent-soft: "#fff1e9"
  background: "#f7f9f7"
  surface: "#ffffff"
  text: "#17251c"
  muted: "#526158"
  border: "#dce4de"
  control-border: "#7c8b80"
  danger: "#b42318"
  danger-soft: "#fff0ee"
  warning: "#805514"
  warning-soft: "#fff5df"
  focus: "#167347"
  # Homepage system (home.css / --home-* properties)
  home-ink: "#163e32"
  home-muted: "#48675c"
  home-mint: "#edf5ee"
  home-yellow: "#f5de87"
  home-yellow-hover: "#ead077"
  home-heading-accent: "#3c7959"
  home-divider: "#c5d8c9"
  home-row-hover: "#dfecdf"
  home-focus: "#226c4f"
  home-inverse-muted: "#d4e3d9"
  home-pill-bg: "#f0f6f1"
  home-pill-border: "#d4e5d8"
  home-waste-tag-bg: "#fff5df"
  home-waste-tag-text: "#805514"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(52px, 5.2vw, 88px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-.035em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(32px, 3.2vw, 52px)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.025em"
  title:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  pill: "20px"
  home-action: "8px"
  home-panel: "16px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  6: "24px"
  8: "32px"
  12: "48px"
  16: "64px"
  home-section: "96px"
  home-gutter: "clamp(24px, 5vw, 128px)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.6}"
  auth-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.6}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
    height: "44px"
  badge-success:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-hover}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  badge-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  badge-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  home-explore-link:
    backgroundColor: "{colors.home-yellow}"
    textColor: "{colors.home-ink}"
    rounded: "{rounded.home-action}"
    padding: "16px 24px"
    height: "56px"
  home-directory:
    backgroundColor: "{colors.home-mint}"
    rounded: "{rounded.home-panel}"
    padding: "40px"
  home-impact-panel:
    backgroundColor: "{colors.home-ink}"
    textColor: "{colors.surface}"
    padding: "80px clamp(24px, 5vw, 128px)"
---

# Design System: FoodBridge

## Overview

**Creative North Star: "The Public Record Office"**

FoodBridge carries the visual weight of a civic institution — a place where real outcomes are filed, not implied. The design system divides cleanly into two registers: the **homepage**, which is a Manrope-set community directory with deep forest-green type on white, and the **dashboards and auth surfaces**, which are a system-ui Operate surface built for task completion with a clean green-and-white token system. Neither surface overrides the other's aesthetic choices. The brand is the same in both: forest green, restrained accent, and an absolute prohibition on invented figures.

The dashboard register is sparse and generous — white surfaces, single-weight shadows, subdued borders, and a primary action colour that earns its place because it appears only on controls and status tokens. Auth screens (Sign In and Register) share this language via centred `auth-card` surfaces using the shared `Button` and `Field` primitives. The homepage register is typographically bold with one structural panel — the dark closing bar — providing the only dramatic tonal change. Both registers are accessibility-first: 44px touch targets, 3px focus rings, and all disabled states via `opacity: .55`.

**Key Characteristics:**
- Two-register system: homepage (Manrope, editorial) and dashboards/auth (system-ui, operational).
- Forest green primary throughout both registers; accent terracotta only in dashboard nav branding and waste stream tags.
- Flat surfaces with hairline borders in the dashboard; tonal contrast and ruled rows in the homepage.
- Warm yellow marks the one explanatory action on the homepage; it never appears in dashboard UI.
- Semantic HTML throughout; accessible focus rings at `--color-focus` on all interactive elements.

## Colors

The palette is anchored by two greens: a deeper, richer ink (`#163e32`) used exclusively on the homepage for headings and the impact panel, and a slightly lighter operational green (`#167347`) used as the primary action colour in the dashboard system. They are distinct and must not be substituted for each other.

### Primary
- **Forest Operational Green** (`#167347`): The dashboard primary action colour. Buttons, links, focus rings, success badge text. Appears at full value only on interactive controls.
- **Deep Forest Ink** (`#163e32`): Homepage-only. Used for all heading text, the brand wordmark on the homepage header, and the closing impact panel background.
- **Forest Hover** (`#105b37`): Primary button hover state in dashboards. Pressed/active state.

### Secondary
- **Terracotta Accent** (`#b54726`): Brand dot in the wordmark (`FoodBridge·`), waste principle indicator, and rare decorative accent in navigation. Never used on operational controls in the dashboard.
- **Warm Yellow** (`#f5de87`): Homepage-only. The "See how it works" action link background. Signals explanatory affordance. Never used in dashboard UI.
- **Yellow Hover** (`#ead077`): Homepage yellow on hover.

### Tertiary
- **Heading Accent** (`#3c7959`): The `<span>` colour inside the h1 hero headline ("possibility.") and numeric step indicators ("01", "02", "03").
- **Forest Focus Ring** (`#226c4f`): Homepage-specific 3px focus outline, slightly darker than dashboard focus for legibility over white.

### Neutral
- **Page Background** (`#f7f9f7`): Dashboard and auth page background — a barely-tinted off-white that reads as white on most screens.
- **Surface White** (`#ffffff`): Cards, modals, inputs, homepage background.
- **Deep Text** (`#17251c`): Dashboard body text. Near-black with a forest hue.
- **Muted Text — Dashboard** (`#526158`): Secondary descriptions, helper text, placeholder labels.
- **Muted Text — Homepage** (`#48675c`): Role descriptions, body copy under hero headings.
- **Border** (`#dce4de`): Card and modal borders, table separators.
- **Control Border** (`#7c8b80`): Input stroke, secondary button border.
- **Row Divider — Homepage** (`#c5d8c9`): Between role-picker rows and section dividers.
- **Row Hover — Homepage** (`#dfecdf`): Role-picker row hover background.
- **Mint Panel** (`#edf5ee`): Homepage directory card and standards section background.
- **Inverse Muted** (`#d4e3d9`): Body copy inside the dark closing panel.
- **Danger** (`#b42318`): Error state text and border. Soft: `#fff0ee`.
- **Warning** (`#805514`): Warning state text. Soft: `#fff5df`.

### Named Rules
**The Two-Green Rule.** `#163e32` (homepage ink) and `#167347` (dashboard primary) are not interchangeable. Homepage elements use the ink; dashboard controls use the primary. Mixing them into the same surface is a system error.

**The Yellow Fence Rule.** Warm yellow (`#f5de87`) lives only on the public homepage, only on the explanatory "See how it works" action. It is not a brand highlight, a CTA colour, or a notification colour for dashboards.

## Typography

**Display Font:** Manrope (variable font, served locally at `/fonts/manrope-variable.ttf`, weight range 200–800, `font-display: swap`) — homepage only.
**Body Font:** system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif — dashboards, auth screens, and all shared UI primitives.

**Character:** The pairing is intentional: Manrope brings editorial weight and geometric warmth to the public-facing surfaces; the system stack brings zero-latency familiarity and legibility to task-completion dashboards. They never appear on the same screen.

### Hierarchy
- **Display** (weight 700, `clamp(52px, 5.2vw, 88px)`, line-height 1.1, tracking −0.035em): Homepage h1 hero headline only. Max 37ch.
- **Headline** (weight 650, `clamp(32px, 3.2vw, 52px)`, line-height 1.2, tracking −0.025em): Homepage section headings (h2 in workflow, streams, standards, faq, and outcomes sections). Manrope.
- **Title** (weight 700, 21–26px, line-height 1.35–1.4): Role-picker names and workflow step headings on homepage. Dashboard section titles use system-ui at `1.25rem` / weight 600.
- **Body** (weight 400, 16–20px, line-height 1.6–1.8): Dashboard task copy at 1rem/1.6; homepage lead copy at 20px/1.75, capped at 37–45ch.
- **Label** (weight 600, 0.875rem, line-height 1.5): Buttons, input labels, table headers, badge text, secondary nav links in dashboards.

### Named Rules
**The Two-Stack Rule.** Manrope and system-ui do not share a screen. If a surface needs to transition between homepage and dashboard styling, it transitions completely — not partially.

## Layout

The dashboard surfaces use a 1240px max-width content container with 32px padding. Dashboard content is not grid-based at the page level; individual sections use flexbox and CSS Grid for internal arrangement. Auth screens centre a single `auth-card` container (width `min(480px, 100%)`) with `48px` vertical spacing.

The homepage fills full viewport width with fluid gutters (`clamp(24px, 5vw, 128px)`).
- **Welcome section:** 2-column asymmetric grid (`1fr 1.3fr`) giving visual prominence to the five-role directory.
- **Workflow section:** 3-column equal grid for steps 01, 02, 03.
- **Dual Streams section:** 2-column comparative grid (`1fr 1fr`) separating edible food from recyclable waste.
- **Standards section:** 3-column grid on mint background (`#edf5ee`) articulating temperature, verification, and two-party handover.
- **FAQ section:** Single-column list of accessible native `<details>`/`<summary>` accordions.
- **Outcomes section:** Full-width dark panel (`#163e32`) linking to `/impact`.

**Breakpoints:**
- ≤1100px: welcome and section-heading grids collapse to equal 1fr/1fr columns; display type scales down.
- ≤759px: all homepage sections stack to single column; role-picker, workflow steps, streams, standards, and impact panel reflow vertically.
- ≥760px: site header nav switches from hamburger to inline horizontal row.
- 760px–900px: homepage nav gap tightens to 12px.

**Density:** Dashboard surfaces are medium density — 32px section padding, 24px card padding, 44px minimum interactive height. Homepage is generous — 96px section vertical padding (`64px` on mobile).

## Elevation & Depth

The dashboard system uses two shadows, both carrying a tinted green-black rather than neutral gray, keeping them in the palette:
- **Ambient card shadow** (`0 2px 8px rgb(23 37 28 / 5%)`): Applied to cards, auth panels, and toasts at rest. Soft, nearly invisible lift.
- **Dialog shadow** (`0 16px 48px rgb(23 37 28 / 15%)`): Applied to modals. Provides visual interruption of the content beneath.

The homepage uses zero shadows. Depth is created entirely through tonal contrast: white vs. mint panel, white vs. dark closing panel. The ruled dividers (`1px solid #c5d8c9`) between role-picker rows provide hierarchy without elevation.

**The Flat Homepage Rule.** No `box-shadow` appears on the public homepage. If a new homepage component needs to feel elevated, use a tinted background (mint or yellow) rather than a shadow.

## Shapes

The dashboard uses three radius values:
- **8px (sm):** Buttons, inputs, badges, skeleton lines — all interactive controls and inline UI.
- **10px (md):** Toast notifications, empty-state containers — mid-weight containers.
- **12px (lg):** Cards, auth panels, and modals — the primary container element.

The homepage uses four radius values:
- **8px (action):** The "See how it works" yellow link and role-picker hover backgrounds.
- **16px (panel):** The mint directory container (`border: 1px solid #cce0d2`).
- **20px (pill):** Principle status badges (`.fb-home-principle > span`).
- **4px (tag):** Stream category indicator tags (`.fb-stream-tag`).

Role-picker rows and workflow step dividers are flat and ruled — no radius. The closing impact panel has no radius; it spans full width flush to the page edges.

**The No-Card-Per-Row Rule.** Individual role-picker rows and workflow steps are not wrapped in cards. They use ruled borders and background-colour hover states. Wrapping each row in a card is the wrong shape language for this system.

## Components

### Buttons

Three variants, all sharing 44px minimum height, 10px/20px padding, weight-600 label text at 0.875rem, and `border-radius: 8px`.

- **Primary:** Forest green background (`#167347`) with white text. Hover darkens to `#105b37`. `transition: background-color 150ms`. Focus ring: 3px solid `#167347`, offset 3px.
- **Secondary:** White background, text at `#17251c`, border `1px solid #7c8b80`. Hover: mint background (`#eaf5ee`).
- **Ghost:** Transparent background, text at `#167347`. Hover: mint background. Used for destructive-flow recoveries (Sign out) and in-nav links.
- **Disabled (all):** `opacity: 0.55`, `cursor: not-allowed`. No separate disabled colour.

### Cards & Auth Surfaces

White background (`#ffffff`), `border: 1px solid #dce4de`, `border-radius: 12px`, `padding: 24px`, `box-shadow: 0 2px 8px rgb(23 37 28 / 5%)`. Used for KPI stats, detail panels, and content groups in dashboards. Auth screens use the same card container (`auth-card`) constrained to `min(480px, 100%)`.

### Inputs & Fields

Wrapped in the `<Field>` primitive. White background, `border: 1px solid #7c8b80`, `border-radius: 8px`, `min-height: 44px`, `padding: 10px 12px`. Focus: border shifts to `--color-primary` (`#167347`) with no additional glow. Error state: border `#b42318`, with an `aria-invalid="true"` attribute hook and role="alert" message below the control. Field labels are weight-600 at 0.875rem with optional hint text.

### Badges / Status Tags

Inline inline-flex tags at `padding: 4px 10px`, `border-radius: 8px`, weight 600 at 0.875rem. Three semantic variants:
- **Success:** Mint background `#eaf5ee`, forest text `#105b37`.
- **Warning:** Amber soft `#fff5df`, amber text `#805514`.
- **Danger:** Red soft `#fff0ee`, red text `#b42318`.
- **Neutral:** Page background `#f7f9f7`, muted text `#526158`.

### Civic Principle Tags (Homepage)

Pill badges (`border-radius: 20px`, `background: #f0f6f1`, `border: 1px solid #d4e5d8`, `padding: 6px 14px`) with a 7px live indicator dot (`#167347` for food sharing, `#b54726` for separate waste recovery).

### Role Picker (Homepage Signature Component)

Five equal `<a>` rows inside a `<nav>`. Each row: `display: flex; justify-content: space-between; align-items: center; padding: 22px 16px; margin: 0 -16px; border-radius: 8px`. Divided by `1px solid #c5d8c9`. Role name at 21px/700; description at 14px/muted. Trailing `ArrowUpRight` icon from Lucide. Hover: row transitions to `#dfecdf` and shifts by `translateX(2px)`, while the arrow animates diagonally (`translate(3px, -3px)`) over `180ms cubic-bezier(0.16, 1, 0.3, 1)`. Focus: 3px outline, `#226c4f`, offset 5px.

### FAQ Accordion (Homepage)

Native HTML `<details>` and `<summary>` components with custom indicator (+ / −) rotating smoothly. When open, the item receives a soft `#f7faf7` background highlight with `border-radius: 8px` for clear reading boundaries.

### Modals

Native `<dialog>` element. `width: min(560px, calc(100% - 32px))`, `max-height: calc(100dvh - 32px)`, centred with `margin: auto`. `border-radius: 12px`, `padding: 24px`, dialog shadow. Backdrop: `rgb(23 37 28 / 45%)` — tinted forest, not neutral black. Heading row: flex with space-between, close button 44px target.

### Navigation — Dashboard

Hidden (`display: none`) below 760px; exposed via `.is-open` class toggled by a 44px hamburger button. At ≥760px: horizontal flex row, `gap: 12px`, links at 0.875rem muted green, active/hover underlined at `--color-primary`.

### Navigation — Homepage

Same toggle mechanic, but inherits homepage styles (`fb-header--home`): Manrope font, deep ink colour (`#163e32`), borderless header, full-bleed padding matching the homepage gutter. At ≥760px: `gap: 24px`. Brand wordmark at 28px / weight-700 / tracking -0.04em.

### Skeleton / Loading States

Animated placeholder blocks at `height: 20px`, `border-radius: 8px`, `background: #dce4de`. Keyframe alternates to `opacity: 0.45` over 1.5s ease-in-out. Last skeleton child is 65% width. Animation removed on `prefers-reduced-motion: reduce`.

## Do's and Don'ts

### Do:
- **Do** use `#167347` (dashboard primary) for all interactive controls in dashboard and auth surfaces. It is the only green that belongs on buttons, links, and status indicators inside the app.
- **Do** use `#163e32` (homepage ink) exclusively for homepage headings, the closing panel, and the homepage wordmark.
- **Do** keep all interactive elements at 44px minimum height or width. This applies to buttons, inputs, close icons, hamburger toggles, and nav links.
- **Do** write `aria-label` on icon-only buttons and nav links whose text alone is ambiguous (e.g. "Open your dashboard" rather than just "Dashboard").
- **Do** label skeleton states with `role="status"` on the loading container.
- **Do** distinguish food-sharing outcomes from waste-collection quantities in copy and in dashboard KPIs. They are separate streams.
- **Do** mark estimated values (meal equivalents, distance) as estimates in copy.

### Don't:
- **Don't** use Manrope on dashboard or auth surfaces, or system-ui on the homepage. The two stacks do not share a screen.
- **Don't** use warm yellow (`#f5de87`) anywhere in the dashboard system. It is a homepage-only explanatory colour.
- **Don't** apply `box-shadow` to homepage elements. Depth on the homepage comes from tonal contrast alone.
- **Don't** wrap individual role-picker rows or workflow steps in card components. Use ruled borders and hover backgrounds instead.
- **Don't** invent impact figures, availability claims, or registration status. The UI reflects recorded outcomes only.
- **Don't** mix `#163e32` and `#167347` on the same surface as equivalent primary colours. They are distinct tokens for distinct registers.
- **Don't** use the terracotta accent (`#b54726`) on operational controls, notifications, or status indicators. It is a brand decoration and waste stream tag token only.
