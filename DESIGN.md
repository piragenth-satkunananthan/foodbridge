---
name: FoodBridge homepage
description: Spacious editorial homepage with a split hero and role directory
colors:
  ink: "#233d32"
  surface: "#f8f6ef"
  white: "#ffffff"
  muted: "#596958"
  accent: "#a84c2d"
typography:
  display:
    fontFamily: "Inter Tight, sans-serif"
    fontSize: "clamp(60px, 5.7vw, 96px)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Inter Tight, sans-serif"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.65
spacing:
  gutter: "clamp(24px, 5vw, 128px)"
  section: "112px"
  mobile-section: "64px"
---

## Homepage direction

The user requested a redesign from scratch after rejecting the previous compositions. This replaces their layout and palette. Dashboards and other routes retain the existing design system.

Warm paper and deep green create a calm, open canvas. Self-hosted Inter Tight carries headings and body copy; Georgia italic provides selective editorial emphasis. No shadows, enclosing cards, invented metrics or decorative icons.

The full-width layout has a shared fluid gutter. A split hero pairs the introduction and role anchor with a square image, focused on the receiving person. Its caption discloses the AI-generated illustration. The white role section pairs an introduction with five equal, ruled rows containing role names, explanations and links. A three-step workflow follows on paper. A dark green impact section closes the narrative.

At 1100px role descriptions wrap beneath names. At 759px the hero, role introduction, workflow and impact content stack, with 64px section spacing. The image becomes 1.2:1. Headlines remain readable without squeezing their tracking.

Role links preserve registration preselection, admin sign-in and authenticated dashboard routing. Recipient and recycler limitations remain visible. Keyboard focus uses a rust outline; hover feedback is limited to role rows and actions, with reduced-motion support.
