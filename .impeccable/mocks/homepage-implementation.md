# Homepage implementation evidence

The V2-2 homepage is implemented in React with the approved photographic asset, self-hosted Inter Tight, five equal role links, homepage-specific navigation, and responsive layouts. Signed-in visitors continue to their own dashboard. Signed-out admins sign in; other roles use preselected registration routes. The organisation feature disclosure remains visible.

Validation: frontend production build and both existing frontend tests pass. Headless Chrome checks pass at 1536x1024, 768x1024, 390x844 and 320x800: no horizontal overflow, five correct role routes, minimum 44px link heights, mobile menu and Escape behavior. Recipient navigation selects the recipient registration role. No browser JavaScript errors were observed.

Remaining acceptance: the Impeccable hero gate reports 74 percent similarity with unresolved header, brand and control differences. It has not passed; final visual acceptance and downstream workflow phases remain open. The disposition is recapture, not ship. Latest local captures are under `.impeccable/review/`. No backend workflow tests or deployment were performed. Vite reports a JavaScript chunk above 500 kB.

Fonts: Inter Tight 400, 600 and 700 from the Google Fonts distribution; license is preserved at `frontend/public/fonts/OFL.txt`. The hero is AI-generated illustrative imagery with provenance recorded separately.

## Compression correction

Removed negative headline tracking, increased supporting type width, widened the role label, and reduced homepage header height by 22px. A new photographic asset is composed for the panoramic crop, preserving visible hair and separation from the subtitle; its exact generation prompt is recorded in `homepage-handover-wide.provenance.json`. Mobile uses a shorter proportional crop.

Revalidated the production build, both frontend tests, and headless browser role links, touch targets, navigation, overflow and recipient registration selection at desktop, tablet, mobile and narrow widths. Additional checks pass at 1440, 1024 and 901px. Independent screenshot review confirms the identified compression issues improve with no material regression. A minor lower-hand crop remains on desktop. The earlier full comp workflow is still uncompleted; these targeted fixes do not assert a full fidelity-gate pass or deployment.

## Full-width redesign

The user subsequently replaced the V2-2 reproduction goal with a full-width breathable redesign and delegated all decisions. Introductory copy now sits above the photograph, all primary homepage sections use the available viewport with consistent fluid gutters, roles have their own open section, and vertical spacing intentionally supports scrolling. The new homepage authority is DESIGN.md and the updated surface brief. Earlier mock-comparison failures describe a superseded composition.

Production build, both frontend tests, layout detector and browser checks pass. Checked 320, 390, 768, 901, 1440, 1536, 1920 and 2560px widths for role routes, touch targets, overflow and applicable menu behavior. Independent review of the new composition found no material visual issues and additionally checked intermediate breakpoints. No publication or backend validation was performed.

## Scratch redesign - 2026-11-04

User requested replacement of the previous composition. Implemented warm paper/deep green split hero, descriptive equal-weight role rows, open workflow and dark impact closing section. Reused the existing disclosed illustration with right-aligned subject framing. Updated homepage-only navigation styling and design records.

Validation: production build passes (existing >500 kB chunk warning); both frontend tests pass; Playwright checks at 320, 390, 768, 901, 1440, 1536, 1920 and 2560px pass role routing, touch targets, overflow, registration preselection and page-error checks. Mobile Menu/Escape checked. Independent visual reviewer returned Ship for desktop/mobile/wide and checked 760/1101px boundaries. Layout detector returned no findings; git diff whitespace check passes.

Finish disposition: implemented and locally verified. Earlier V2-2 fidelity target is superseded by the user's scratch redesign request. No deployment or backend workflow validation performed.

## Selected direction A

User selected Fresh & bold: white, vivid green, oversized sans-serif headline, panoramic hero and five equal role columns. Implemented with equal rows below 901px, preserving content, limitations and role routing. Independent visual review returned Ship; improved panorama framing from 2.4:1 to 2.2:1 following its minor crop feedback.

Finish: locally implemented. Eight-width browser checks and production build pass after final crop change; both frontend tests pass. Layout detector found no issues. Existing bundle-size warning remains. No deployment or backend workflow checks performed.

## Alignment refinement with ui-ux-pro-max

Kept direction A and all content. Aligned section introductions to a common 3:2 grid; standardized fluid section spacing, grid gaps and internal spacing; removed compounded header link margins. Changes are homepage-only CSS.

Validation: production build passes with the existing chunk-size warning. Existing eight-width browser smoke checks pass. Additional checks at 375px, landscape 812px, 760px, 1100px and 1536px pass shared-column alignment, desktop role-arrow alignment and text-spacing reflow with reduced motion. Desktop/mobile captures inspected. Backend checks omitted for CSS-only work; no deployment.
