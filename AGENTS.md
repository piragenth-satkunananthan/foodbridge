# Repository Guidelines

## Project Structure & Module Organization
FoodBridge is a MERN application. `backend/` contains Express routes, controllers, Mongoose models, middleware, services, and utilities. Backend checks live in `backend/test-module*.js`. `frontend/src/modules/` groups the donor, recipient, recycler, volunteer, and admin dashboards. Shared pages, components, API helpers, context, and styles live under `frontend/src/`. `frontend/dist/` is generated build output. The root proposal PDF describes intended requirements; some proposed modules remain incomplete. The Module 2 patch is not active application code.

## Build, Test, and Development Commands
Run `npm ci` separately in `backend/` and `frontend/`.
- Backend: `npm run dev` starts Node's built-in watcher; `npm start` runs the API on port 5000.
- Frontend: `npm run dev` starts Vite on port 5173 and proxies `/api` to the backend.
- Frontend: `npm run build` creates the production bundle; `npm run preview` serves it locally.
- Backend: `npm test`, `npm run test:module1`, and `npm run test:module4` run existing module checks.
- Root: `docker compose up --build` launches the configured deployment stack, including Caddy. Review domain and environment settings first.

## Coding Style & Naming Conventions
Use two-space indentation and semicolons, matching surrounding code. Backend JavaScript uses CommonJS; frontend components use ES modules and JSX. Use PascalCase for components and models, camelCase for functions, and descriptive controller/route filenames. No formatter or linter is configured. Keep business rules and authorisation in the API.

## Testing Guidelines
`npm test` runs Node unit/schema checks; `npm run test:api` exercises HTTP workflows using a disposable Docker MongoDB replica set. `npm run test:all` is the combined backend gate. There is no enforced coverage threshold. Add regression checks for changed business rules and verify affected interfaces with a production build. Use an isolated database for database-writing tests. Never run `npm run seed` against shared data: it deletes existing collections.

## Commit & Pull Request Guidelines
History uses messages such as `feat(module-4): ...`, `fix(server): ...`, and `ci: ...`. Keep commits focused. PR descriptions should explain resulting behaviour, validation, and remaining limitations; link relevant issues and include screenshots for interface changes. Main/production pushes can trigger EC2 deployment.

## Configuration & Reporting
Keep secrets in environment variables and out of commits. Use example environment files for setup. Distinguish recorded outcomes, estimates, and demonstration data; never substitute invented figures when requests fail.
