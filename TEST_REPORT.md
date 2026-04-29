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

Re-run before final commit/push on 2026-04-29 10:41 MYT:

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
- OpenClaw notification is blocked by sandbox/runtime dependency permissions. The default-home run failed creating `/Users/123ang/.openclaw/plugin-runtime-deps/.../.openclaw-runtime-deps.lock`; a writable-home retry began staging plugin runtime dependencies but could not complete in the restricted environment.

Not run because database runtime could not be brought up in this environment:

```bash
npm run db:migrate
npm run db:seed
npm run test:smoke
```

## Results

- Prisma client generation: PASS
- Prisma schema validation: PASS
- Backend syntax/build check: PASS
- Backend unit tests: PASS
- Frontend production build: PASS
- Local PostgreSQL runtime: BLOCKED BY SANDBOX
- Migration against clean database: NOT VERIFIED
- Seed against clean database: NOT VERIFIED
- HTTP smoke test: NOT VERIFIED
- Route-level audit-log persistence for CSV exports: NOT VERIFIED against a live DB

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

- Real database verification requires one of:
  - Docker available for `docker compose up`
  - A host environment where PostgreSQL can allocate shared memory normally
- Production cron/PM2 execution of the metric refresh script was documented but not verified on a host.
- Earlier sandboxed local commit attempt could not create `.git/index.lock`; this was resolved by committing from the main agent session after the verification gate passed.
- Completion notification requires OpenClaw runtime dependency installation or a preloaded runtime outside this sandbox.
