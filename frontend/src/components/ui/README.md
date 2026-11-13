# UI Primitives

## Overview
Reusable presentational primitives shared by all pages and module dashboards. Every component here is a pure render function of its props — no data fetching, no global state reads. Styling is class-based (`fb-*`) and driven by the pruned CSS layer (`frontend/src/styles`, `design.css`), which is out of contract scope.

## Interface
- `Button` (default export, `forwardRef`) [components/ui/Button.jsx:Button] — renders a react-router `Link` when `to` is set and `disabled` is falsy, otherwise a native `<button>`; `variant` prop drives the `fb-button--{variant}` class.
- `Card` (default export) [components/ui/Card.jsx:Card] — polymorphic wrapper; `as` prop selects the element (default `div`), always applies `fb-card`.
- `Modal` (default export) [components/ui/Modal.jsx:Modal] — native `<dialog>` driven by `showModal()`/`close()`; props `open`, `onClose`, `title`, `children`; Escape (`onCancel`) is intercepted and routed to `onClose`.
- `Field` (default export, `forwardRef`) [components/ui/Field.jsx:Field] — labelled form control; `as` selects input/select/textarea, auto-generates an id via `useId`, wires `aria-describedby` (hint/error) and `aria-invalid`, renders `role="alert"` error text.
- `EmptyState` (default export) [components/ui/EmptyState.jsx:EmptyState] — `title`/`description`/`action` placeholder block.
- `Skeleton` (default export) [components/ui/Skeleton.jsx:Skeleton] — `role="status"` loading placeholder rendering `lines` (default 3) shimmer lines with an sr-only `label`.
- `StatusBadge` (default export) [components/ui/StatusBadge.jsx:StatusBadge] — maps a `status` key through the local `statuses` table to `[text, tone]`; `label` prop overrides the text.

## Invariants
- `statuses` table in [components/ui/StatusBadge.jsx:statuses] enumerates exactly: posted, matched, claimed, pickup_scheduled, picked_up, delivered, completed, recycled, pending, verified, rejected, cancelled, expired; any unknown status falls back to the raw status string with underscores replaced by spaces and tone `neutral` [components/ui/StatusBadge.jsx:11].
- `Button` never renders a `Link` when `disabled` is true — it falls back to a disabled `<button>` [components/ui/Button.jsx:6].
- `Modal` only calls `dialog.showModal()` when `open` is true, and its effect cleanup always calls `dialog.close()`, restores `document.body.style.overflow`, and refocuses the previously active element [components/ui/Modal.jsx:7-19].
- `Field` marks the control `aria-invalid` only when `error` is truthy, and required fields get an `aria-hidden` asterisk [components/ui/Field.jsx:9-12].

## Side Effects
- `Modal` mutates DOM globals: `document.body.style.overflow = 'hidden'` while open and restores it on cleanup; calls `dialog.showModal()`/`dialog.close()` and `previousFocus?.focus()` [components/ui/Modal.jsx:12-17].
- All other components are side-effect free (pure render; no network, storage, or timers).

## Verification
- Run: `cd frontend && npm test && npm run build`
