# Homepage

Target: `frontend/src/pages/HomePage.jsx`
Related: `frontend/src/styles/home.css`, `frontend/src/styles/navigation.css`, homepage Header and Footer variants.
Scope: homepage only; dashboards retain their existing design.
Mode: Persuade. Orient visitors and help them choose how to participate.

## Direction contract

THESIS: A community directory led by generous typography and five equally weighted role links.

OWN-WORLD: White canvas, deep green type, one mint directory, warm yellow workflow action, quiet dividers and rounded containers. Manrope carries both display and supporting text.

STORY: Understand food sharing and separate waste collection, find a role, understand the practical workflow, then explore recorded impact.

FIRST VIEWPORT: Large multiline headline and explanatory link on the left; the five-role directory on the right. On mobile, the message precedes the complete directory. No role is promoted over another.

FORM: Code-first implementation; no approved comp. Direction exploration ran with seed:26b05d8691167f4d. User delegated the new build; the implemented direction is the typography-led community directory.

FINISH: Independent reviewer returned ship after the impact-link focus outline was corrected and keyboard-verified. No raster assets are shipped.

## Content and interaction

All five role rows are visible: Donor, Recipient, Recycler, Volunteer and Admin. Anonymous non-admin links preselect the registration role; Admin links to sign-in. Authenticated users are routed to their own role dashboard, and the directory heading explicitly explains that every role link opens their existing dashboard. The workflow anchor scrolls to three steps, followed by a dark closing section linking to community impact.

Recipient and recycler browsing and claims remain unavailable; the directory states this limitation. Food deliveries and waste collection are reported separately. No fabricated statistics or photography are included.

## Validation

Documentation extracted from current JSX and CSS. Actual tokens and responsive behavior are recorded in DESIGN.md and the schemaVersion 2 sidecar. The parent implementation workflow reported a completed review and a passing browser Tab/outline check after changing impact-link focus to yellow. This documenter inspected the resulting source but did not independently run browser checks. Other automated validation evidence belongs to the parent workflow.
