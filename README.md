# iLead — International Lead and Recruitment ROI Dashboard

A working Phase 1 implementation based on `iLead_Developer_Document_Final.md`, with real Prisma schema expansion, CRUD-heavy backend routes, deterministic seed data, smoke-test scripts, and minimal functional frontend modules for campaigns, leads, duplicates, and application upload.

## Stack

- Frontend: React + Vite + Tailwind + TanStack Query + Recharts
- Backend: Node.js + Express + Prisma
- Database: PostgreSQL

## Quick start

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run prisma:generate
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Default seeded login after DB setup: `admin@ilead.local` / `iLead2026!`.

## Runtime scripts

```bash
npm run db:up         # prefer docker compose; fallback to local postgres binaries if available
npm run db:down
npm run db:migrate
npm run db:seed
npm run prisma:generate
npm run prisma:validate
npm run test
npm run test:smoke    # requires running backend + reachable database
npm run build
```

Notes:

- `docker-compose.yml` exposes PostgreSQL on `localhost:55432`.
- If Docker is unavailable, `db:up` attempts a local PostgreSQL bootstrap via `initdb`/`pg_ctl`.
- In the current Codex sandbox, Docker is unavailable and the local fallback is blocked by shared-memory restrictions, so database runtime verification has to be done outside this sandbox.

## Source of truth

Implementation follows `iLead_Developer_Document_Final.md` v3.0:

- One student can touch many campaigns through `LeadCampaignTouch`.
- Lead API validates at least one identifier: email, phone, passport number, or external lead ID.
- Campaign actual spend is derived from `CampaignCost.amountMyr`.
- SLA defaults: HOT=1, WARM=3, COLD=7 calendar days in MYT.
- PII export and faculty dean umbrella visibility are system settings.
