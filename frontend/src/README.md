# Frontend source

React 18 + Vite + Tailwind v4, lucide-react icons. All business rules and authorisation live in the API; the UI only renders and calls it.

- `styles.css` — the whole design system: tokens (light + dark via `prefers-color-scheme`), self-hosted Manrope, component classes (`.btn`, `.card`, `.badge`, `.table`, `.modal`, `.shell`…). Tailwind utilities are used only for layout.
- `components/ui.jsx` — primitives: `Button`, `Card`, `Badge`/`StatusBadge`, `Stat`, `PageHead`, `Field`, `Tabs`, `Empty`, `ErrorState`, `Loading`, `Modal` (native `<dialog>`), `Pipeline`, `Timeline`.
- `components/AppShell.jsx` — role sidebar, mobile drawer, notifications popover (polls every 60 s).
- `components/OrgProfile.jsx` — recipient/recycler onboarding and verification banner; `Claims.jsx` — shared claim list with release and receipt/processing confirmation; `Support.jsx` — user complaints; `ProcessingRecord.jsx` — confirmed waste outcome record.
- `lib/format.js` — districts, labels, status → badge mapping, date/number formatting, OSM route links. `lib/useAsync.js` — load/reload hook.
- `api/client.js` — every API call; a 401 (or suspended 403) clears the session and fires `foodbridge:logout`.
- `pages/` — public landing (live `/api/impact` figures, never invented), login, registration.
- `modules/<role>/` — one routed dashboard per role (`/donor`, `/recipient`, `/volunteer`, `/recycler`, `/admin`), each with nested routes and a `support` page.
