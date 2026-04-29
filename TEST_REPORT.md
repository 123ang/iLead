# TEST_REPORT

Date: 2026-04-29
Workspace: `/Users/123ang/Desktop/Websites/iLead`

## Commands run

Passed:

```bash
npm run prisma:generate
npm run prisma:validate
npm test --workspace backend
npm run build
```

Latest local runtime verification on 2026-04-29:

```bash
npm run db:up
npm run db:migrate
npm run db:seed
API_BASE=http://127.0.0.1:3103 ORIGIN=http://127.0.0.1:5174 npm run test:smoke --workspace backend
E2E_BASE_URL=http://127.0.0.1:5174 npm run test:e2e --workspace frontend
```

Result: PASS with local PostgreSQL on port 55432, controlled backend on port 3103, and controlled frontend on port 5174.

Required verification gate passed on 2026-04-29 after executive portal CRUD redesign:

```bash
npm run prisma:generate
npm run prisma:validate
npm test --workspace backend
npm run build
```

Re-run by main agent before local redesign commit on 2026-04-29 14:56 MYT:

```bash
npm run prisma:generate
npm run prisma:validate
npm test --workspace backend
npm run build
```

Re-run after completing frontend CRUD management workflows on 2026-04-29:

```bash
npm run prisma:generate
npm run prisma:validate
npm test --workspace backend
npm run build
```

Blocked / failed due environment:

```bash
npm run db:up
git add backend/package.json backend/src/app.js backend/src/services/dashboard-scope.service.js backend/src/services/dashboard.service.js backend/src/services/metrics.service.js backend/src/services/roi.service.js backend/scripts/refresh-campaign-metrics.mjs backend/src/routes/report.routes.js backend/src/services/campaign-metric-refresh.service.js backend/src/services/report-calculations.service.js backend/src/services/reports.service.js backend/test/campaign-metric-refresh.test.js backend/test/reports.test.js frontend/src/main.jsx frontend/src/pages/ReportsPage.jsx README.md && git commit -m "Implement reports and campaign metric refresh"
openclaw message send --channel telegram --target 'telegram:8535666700' --account default --message '<summary>'
```

Failure observed:

- The local PostgreSQL fallback reached `initdb`, but PostgreSQL shared memory creation is blocked inside this sandbox. It aborted with:
  `FATAL: could not create shared memory segment: Operation not permitted`
- Git local commit is blocked because `.git/index.lock` cannot be created:
  `fatal: Unable to create '/Users/123ang/Desktop/Websites/iLead/.git/index.lock': Operation not permitted`
- OpenClaw notification is blocked by sandbox/runtime dependency staging. A writable-home retry started with:
  `HOME=/Users/123ang/.openclaw/tmp openclaw message send --channel telegram --target 'telegram:8535666700' --account default --reply-to 315 ...`
  but it remained stuck staging bundled runtime dependencies for unavailable plugins and did not reach message send before the session had to be abandoned.

Not run because database runtime could not be brought up in this environment:

```bash
npm run db:migrate
npm run db:seed
npm run test:smoke
```

## Results

- Prisma client generation: PASS on 2026-04-29 after frontend CRUD redesign.
- Prisma schema validation: PASS on 2026-04-29 after frontend CRUD redesign.
- Backend syntax/build check: PASS on 2026-04-29 after frontend CRUD redesign via `npm run build`.
- Backend unit tests: PASS on 2026-04-29 after frontend CRUD redesign, 28 tests passing.
- Frontend production build: PASS on 2026-04-29 after frontend CRUD redesign via `npm run build`.
- Prisma client generation: PASS on 2026-04-29 after CRUD workflow completion.
- Prisma schema validation: PASS on 2026-04-29 after CRUD workflow completion.
- Backend unit tests: PASS on 2026-04-29 after CRUD workflow completion, 28 tests passing.
- Full backend/frontend build: PASS on 2026-04-29 after CRUD workflow completion. Vite still reports the existing chunk-size warning.
- Local PostgreSQL runtime: PASS on 2026-04-29 via `npm run db:up` local PostgreSQL fallback.
- Migration against local database: PASS on 2026-04-29 via `npm run db:migrate`.
- Seed against local database: PASS on 2026-04-29 via `npm run db:seed`.
- HTTP smoke test: PASS on 2026-04-29 against controlled backend with local PostgreSQL.
- Basic browser E2E upload flow: PASS on 2026-04-29 against controlled frontend/backend.
- Route-level audit-log persistence for CSV exports: NOT VERIFIED against a live DB

## Frontend redesign verification notes

- Added University Executive Portal shell with deep navy sidebar, gold accents, executive topbar, and shared button/table/card styling.
- Added reusable UI components: `PageHeader`, `Toolbar`, `DataTable`, `SlideOver`, `ConfirmDialog`, `EmptyState`, `LoadingState`, `ErrorState`, `Badge`, and `StatusPill`.
- Campaigns page now has client-side search/status/type filters, create/edit drawer, and delete confirmation before API call.
- Leads page now has client-side search/status/quality filters, create/edit drawer, frontend identifier validation, assignment/status controls, and delete confirmation before API call.
- Lead detail now exposes follow-up creation through a drawer using the existing `/follow-ups` endpoint.
- Campaign detail now confirms campaign-cost deletion before calling the API.
- Master Data now supports backend-backed read/create/edit for countries, faculties, programmes, currencies, FX rates, tuition fees, scholarships, and sponsors. Disable/delete is exposed only where safe: `isActive` resources are disabled, FX rates can be deleted, and currency disable remains marked unsupported.
- Users page now supports `SUPER_ADMIN` create/edit/deactivate via SlideOver and ConfirmDialog. Temporary passwords are supplied by the admin, hashed server-side, and require password change on login; password hashes are never returned.
- Audit Logs now use server-side filters for action, entity, user ID, search, date range, and take.
- Follow-ups now include an overdue queue plus edit and audited complete actions for the latest follow-up record.
- Settings page supports backend-backed setting edits for `SUPER_ADMIN`.
- Reports, Duplicates, Application Upload, Dashboard, and detail pages were restyled to match the shared portal components.

## Automated tests added

- `backend/test/roi.test.js`
- `backend/test/lead-identity.test.js`
- `backend/test/sla.test.js`
- `backend/test/upload.test.js`
- `backend/test/application-matching.test.js`
- `backend/test/dashboard-scope.test.js`
- `backend/test/duplicate-lead.test.js`
- `backend/test/reports.test.js`
- `backend/test/campaign-metric-refresh.test.js`

Additional coverage added on 2026-04-29:

- Report conversion and masking helpers.
- CSV escaping.
- Report table/filter payload handling.
- PII export role permission behavior.
- Export audit payload for successful and denied CSV exports.
- Campaign metric refresh snapshot aggregation.

## Remaining blockers

- Production cron/PM2 execution of the metric refresh script was documented but not verified on a host.
- The currently running developer API on port 3003 may need restart if it was launched before the local DATABASE_URL script defaults were added; controlled backend verification on port 3103 passed.
- Route-level audit-log persistence for CSV exports still needs a dedicated live-DB assertion.
- Earlier sandboxed worker commit was blocked by `.git/index.lock`; the main agent can create local commits from the primary session.
- Completion notification from the worker was blocked by OpenClaw runtime dependency staging; user-visible progress was handled in the main session instead.
