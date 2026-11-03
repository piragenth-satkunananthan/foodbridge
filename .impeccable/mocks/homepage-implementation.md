# Homepage implementation evidence

The V2-2 homepage is implemented in React with the approved photographic asset, self-hosted Inter Tight, five equal role links, homepage-specific navigation, and responsive layouts. Signed-in visitors continue to their own dashboard. Signed-out admins sign in; other roles use preselected registration routes. The organisation feature disclosure remains visible.

Validation: frontend production build and both existing frontend tests pass. Headless Chrome checks pass at 1536x1024, 768x1024, 390x844 and 320x800: no horizontal overflow, five correct role routes, minimum 44px link heights, mobile menu and Escape behavior. Recipient navigation selects the recipient registration role. No browser JavaScript errors were observed.

Remaining acceptance: the Impeccable hero gate reports 74 percent similarity with unresolved header, brand and control differences. It has not passed; final visual acceptance and downstream workflow phases remain open. The disposition is recapture, not ship. Latest local captures are under `.impeccable/review/`. No backend workflow tests or deployment were performed. Vite reports a JavaScript chunk above 500 kB.

Fonts: Inter Tight 400, 600 and 700 from the Google Fonts distribution; license is preserved at `frontend/public/fonts/OFL.txt`. The hero is AI-generated illustrative imagery with provenance recorded separately.
