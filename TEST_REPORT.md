# TEST_REPORT

Date: 2026-04-29
Workspace: `/Users/123ang/Desktop/Websites/iLead`

## Commands run

Passed:

```bash
npm run prisma:generate
npm run prisma:validate
npm run build --workspace backend
npm test --workspace backend
npm run build
```

Blocked / failed due environment:

```bash
npm run db:up
```

Failure observed:

- Docker path could not run because `docker` is not installed in this sandbox.
- Local PostgreSQL fallback also failed inside the sandbox. `initdb` aborted with:
  `FATAL: could not create shared memory segment: Operation not permitted`

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

## Automated tests added

- `backend/test/roi.test.js`
- `backend/test/lead-identity.test.js`
- `backend/test/sla.test.js`
- `backend/test/upload.test.js`

## Remaining blockers

- Real database verification requires one of:
  - Docker available for `docker compose up`
  - A host environment where PostgreSQL can allocate shared memory normally
- Git commit creation was also blocked in this sandbox because writing `.git/index.lock` was not permitted, so logical checkpoint commits could not be created here.
