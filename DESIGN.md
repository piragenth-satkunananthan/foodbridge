---
name: FoodBridge
description: Community dispatch ledger — a print-inspired, light-only interface for food rescue and waste routing in Sri Lanka.
colors:
  paper: "#f4efe4"        # page background
  sheet: "#fffcf5"        # cards, masthead, modals
  sheet-2: "#efe8da"      # subtle fills, modal footers
  ink: "#1e1b16"          # text and strong rules
  muted: "#5c5346"        # secondary text (≥7:1 on sheet)
  rule: "#d9cebb"         # hairlines
  control: "#8c806e"      # input borders
  leaf: "#2f5d3a"         # primary / food pathway
  terra: "#a4471b"        # waste pathway, unread markers
  indigo: "#2b4a7a"       # in transit / informational
  danger: "#a3261b"
  warning: "#7a5300"
typography:
  display: "Fraunces (serif, optical size) — headings, figures"
  body: "Public Sans — UI and body text, 15px base"
  data: "IBM Plex Mono — labels, dates, references, status stamps"
---

# Design principles

- Print, not app chrome: ruled lines instead of shadows, 3px corners, a masthead with dateline and desk name instead of a sidebar.
- Food is green, waste is terracotta, transit is indigo — used consistently in icons, steps and tags.
- Status is a stamp: uppercase mono tag with a 1px border.
- Figures are a ledger: serif numerals in ruled cells, always labelled with their basis (confirmed, estimated, declared).
- Light theme only. Contrast ≥4.5:1 for text; visible focus outline in leaf green; targets ≥30px for inline links.
- Tables stack into blocks under 720px; masthead navigation scrolls horizontally on phones.
- Never show invented figures; empty states say what will appear and when.

Source of truth: `frontend/src/styles.css`.
