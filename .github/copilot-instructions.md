# AI Agent Guide — Snack Cupboard

Concise, project-specific guidance to make AI agents immediately productive in this repo. Keep changes small, respect existing patterns, and reference the files noted below.

## Big Picture

- Full‑stack app to track staff snack/drink purchases.
- Frontend: React 18 + Vite (`client/`). Backend: Express + SQLite (`server/`, DB in `data/snacks.db`).
- Vite dev server proxies API calls from the client to the Express server on `/api/*`.
- Production: Express serves the built SPA from `client/dist` if it exists.

## Dev Workflows

- Install:
  - Root deps: `npm install`
  - Client deps: `cd client && npm install`
- Dev (runs server + client): `npm run dev`
  - Server: `http://localhost:3001`, Client: `http://localhost:5173` (proxy `/api` → `3001`)
- Build SPA: `cd client && npm run build`
- Prod server (serves `client/dist` if present): `npm start`
- One‑shot setup: `npm run setup`

## Architecture & Data Flow

- Entry points: client `client/src/main.jsx` → `App.jsx`; server `server/index.js`.
- Server initializes SQLite schema on start (`server/database.js::initializeDatabase`).
- Routes (mounted under `/api`):
  - Staff: `server/routes/staff.js`
  - Items: `server/routes/items.js`
  - Purchases: `server/routes/purchases.js`
  - Settings/Terms: `server/routes/settings.js`
  - Reset ops: `server/routes/reset.js`
- Client calls APIs with Axios (e.g., `App.jsx` `fetchCurrentTerm()`, checkout POST → `/api/purchases`).

## Data Model & Conventions

- Tables: `staff`, `items`, `purchases`, `settings`, `terms`.
- Soft delete pattern: records archived by setting `archived_at`; “permanent” delete endpoints verify the record is archived first.
- Settings keys: `current_term`, `current_academic_year` (defaults inserted on first run).
- Purchases store denormalized `item_name` for resilience if item is later renamed/deleted.
- Case handling:
  - Staff `initials` are uppercased server‑side; staff imports/updates normalize to uppercase.
  - Item name uniqueness is case‑insensitive.

## API Surface (selected contracts)

- Staff:
  - GET `/api/staff?search=&includeArchived=`
  - POST `/api/staff` { initials, surname, forename } (restores if archived)
  - POST `/api/staff/import?mode=replace|append` (CSV text body)
  - PUT `/api/staff/:initials` { forename, surname }
  - DELETE `/api/staff/:initials` (archive); PUT `/:initials/restore`; DELETE `/:initials/permanent`
  - Bulk: `/bulk/archive|restore|delete-permanent`
- Items:
  - GET `/api/items?search=&includeArchived=`; GET `/api/items/:id`
  - POST `/api/items` { name, price, category? } (restores if archived)
  - PUT `/api/items/:id` (prevents duplicate names)
  - DELETE `/api/items/:id` (archive); PUT `/:id/restore`; DELETE `/:id/permanent`
  - Bulk: `/bulk/archive|restore|delete-permanent`; CSV import: POST `/api/items/import-csv`
- Purchases:
  - POST `/api/purchases` { staffInitials, items: [{ id, quantity, price, name }] }
  - GET `/api/purchases` (admin list), PUT `/:id`, DELETE `/:id`, POST `/bulk/delete`
  - GET `/api/purchases/export/csv?term=&academic_year=`
  - GET `/api/purchases/summary/by-staff`
  - GET `/api/purchases/staff/:initials` (current term detail + summaries)
- Settings/Terms:
  - GET `/api/settings/current`; PUT `/api/settings/current` { term, academic_year }
  - GET `/api/settings/terms`, GET `/api/settings/all-terms`
  - POST `/api/settings/term`, DELETE `/api/settings/term?term=&academic_year=`
- Reset (admin‑only by shared password):
  - POST `/api/reset/verify-password` { password }
  - GET `/api/reset/statistics` (counts), GET `/api/reset/export-backup`
  - POST `/api/reset/execute` { password, confirmationPhrase: "DELETE" }

## Frontend Patterns

- App state lifted in `client/src/App.jsx`; child components receive props callbacks (no Redux).
- API calls via Axios to `/api/*`; Vite proxy configured in `client/vite.config.js`.
- Checkout uses a confirmation modal (`ConfirmCheckoutModal.jsx`) and transient success state before reset.
- Dark mode toggled via `data-theme` on `<html>` and localStorage key `darkMode`.
- Inactivity handling: 4‑minute inactivity triggers a 30s modal countdown, then returns to home (`InactivityModal.jsx`).

## CSV Import/Export

- Staff import CSV header: `Initials,Surname,Forename`. Modes: `replace` (archives missing) or `append`.
- Items import CSV header: `name,price,category?`; modes: `append` (default; upsert + restore archived) or `replace` (removes all existing first).
- Purchases export: see GET `/api/purchases/export/csv` with optional term/year filters.

## Admin Auth (dev‑only)

- Simple shared password check in client and server: default `admin123`.
  - Client check in `client/src/App.jsx::handlePasswordSubmit`.
  - Server verify route: `POST /api/reset/verify-password`.
  - For changes, update both sides or migrate to a real auth flow.

## Adding Server Features

- Follow existing route modules under `server/routes/*`.
- Use `runAsync`, `getAsync`, `allAsync` from `server/database.js` for SQLite access.
- Return JSON `{ message }` on success; `{ error }` on failures; preserve soft‑delete semantics where relevant.
- Add routes under `/api/<feature>` in `server/index.js` and test via the Vite‑proxied client during dev.

## Common Gotchas

- Dev 404 to `client/dist` is expected; SPA is served only after building.
- Ports: server `3001`, client `5173`; adjust in env (`PORT`) or `client/vite.config.js`.
- Database locks usually indicate multiple processes accessing `data/snacks.db`—ensure only one server process runs.
