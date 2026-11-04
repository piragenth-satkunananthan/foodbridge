---
name: FoodBridge homepage
description: A spacious community directory for food sharing and separate waste collection.
colors:
  ink: "#163e32"
  muted: "#48675c"
  white: "#ffffff"
  mint: "#edf5ee"
  yellow: "#f5de87"
  yellow-hover: "#ead077"
  heading-accent: "#3c7959"
  divider: "#c5d8c9"
  row-hover: "#dfecdf"
  focus: "#226c4f"
  inverse-muted: "#d4e3d9"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(52px, 5.2vw, 88px)"
    fontWeight: 650
    lineHeight: 1.13
    letterSpacing: "-.035em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(32px, 3.2vw, 52px)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-.025em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.8
rounded:
  action: "8px"
  panel: "16px"
spacing:
  small: "16px"
  medium: "24px"
  large: "32px"
  section: "96px"
  gutter: "clamp(24px, 5vw, 128px)"
components:
  explore-link:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "16px 24px"
  explore-link-hover:
    backgroundColor: "{colors.yellow-hover}"
  directory:
    backgroundColor: "{colors.mint}"
    rounded: "{rounded.panel}"
    padding: "40px"
  role-row:
    textColor: "{colors.ink}"
    padding: "24px 0"
  impact-panel:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    padding: "80px clamp(24px, 5vw, 128px)"
---

# Design System: FoodBridge homepage

## Overview

**Creative North Star: "The community directory"**

Typography, whitespace and clear rows make participation approachable. This records the implemented homepage and its homepage-specific navigation treatments; it does not redefine dashboard styling. The direction was delegated and implemented in code, without an approved visual comp.

**Key Characteristics:**

- Spacious, typography-led composition.
- Flat white and mint surfaces with deep green text.
- Warm yellow for the explanatory action.

## Colors

Deep green anchors text and the closing impact panel. Mint groups related choices; warm yellow marks the workflow link. Muted green supports descriptions, and pale dividers separate rows. The closing panel uses white headings and softer inverse text.

## Typography

Manrope is served locally as a variable font with a sans-serif fallback and swap loading. Display and section headings use weight 650; role and workflow titles use 700. Supporting copy uses generous line height. Hero copy is limited to 37ch; workflow descriptions to 38ch. All roles share the same title and description hierarchy.

## Layout

The homepage fills available width with fluid gutters. Desktop welcome and section headings use a 1.1fr/1fr grid. Workflow steps form three equal columns; the closing panel places copy and its link side by side.

At 1100px and below, the welcome grid becomes equal columns, gaps reduce to 40px, the directory padding becomes 28px, and display type uses clamp(44px, 5.3vw, 60px). At 759px and below, sections stack, directory padding becomes 24px, section vertical spacing becomes 64px, and the display uses clamp(43px, 8.6vw, 64px). Navigation switches from a toggle-controlled vertical menu to a horizontal row at 760px. Its horizontal gap reduces between 760px and 900px.

## Elevation & Depth

Homepage sections use tonal contrast and fine rules rather than shadows. The dark closing panel provides the strongest change in visual weight.

## Shapes

The directory is softly rounded; the yellow action has tighter corners. Role rows and workflow dividers stay flat and straight. Avoid turning every content group into a separate card.

## Components

The directory contains five equally weighted linked rows, with a trailing decorative arrow. Rows change background over 160ms ease-out; reduced-motion preference removes this transition. Homepage links have a 3px focus outline offset by 5px; the dark impact section uses yellow for contrast. The yellow workflow link has a minimum height of 56px. Header actions retain a 44px minimum height.

The closing impact link is underlined with a thin rule and becomes yellow on hover. Homepage header and footer use the same fluid gutters as the main content.

## Do's and Don'ts

- Do preserve equal role visibility and clear keyboard focus.
- Do keep food sharing and waste collection visually and verbally understandable as separate activities.
- Don't apply this homepage scope to dashboards without a separate design decision.
- Don't invent availability, approval status or impact figures.
