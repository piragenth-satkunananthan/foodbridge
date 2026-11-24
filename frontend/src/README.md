# Frontend source

React 18 + Vite + Tailwind v4, lucide-react icons. All business rules and authorisation live in the API; the UI only renders and calls it.

- Original look, restored from `production`: `index.css`, `design.css`, `styles/*` (tokens, ui, home, navigation), `components/Header.jsx`, `Footer.jsx`, `pages/HomePage.jsx`, `LandingPage.jsx` (`/` and `/impact`), `LoginPage.jsx`, `RegisterPage.jsx`, `components/ui/*`.
- `portal.css` — the dashboard skin in that same look (emerald + slate, Plus Jakarta Sans / Inter, rounded cards, pill tabs and buttons), scoped under `.portal` so it does not alter the public pages.
- `components/ui.jsx` — primitives: `Button`, `Card`, `Badge`/`StatusBadge`, `Stat`, `PageHead`, `Field`, `Tabs`, `Empty`, `ErrorState`, `Loading`, `Modal` (native `<dialog>`), `Pipeline`, `Timeline`.
- `components/AppShell.jsx` — `.portal` wrapper with pill section tabs; exports `Notifications` (bell in the header for every role, polls every 60 s).
- `components/OrgProfile.jsx` — recipient/recycler onboarding and verification banner; `Claims.jsx` — shared claim list with release and receipt/processing confirmation; `Support.jsx` — user complaints; `ProcessingRecord.jsx` — confirmed waste outcome record.
- `lib/format.js` — districts, labels, status → badge mapping, date/number formatting, OSM route links. `lib/useAsync.js` — load/reload hook.
- `api/client.js` — every API call; a 401 (or suspended 403) clears the session and fires `foodbridge:logout`.

- `modules/<role>/` — one routed dashboard per role (`/donor`, `/recipient`, `/volunteer`, `/recycler`, `/admin`), each with nested routes and a `support` page.
