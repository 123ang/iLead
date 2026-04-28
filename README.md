# iLead — International Lead and Recruitment ROI Dashboard

A V1 MVP scaffold based on `iLead_Developer_Document_Final.md`.

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
# create PostgreSQL DB, then:
cd backend && npx prisma migrate dev --name init && npm run seed
cd .. && npm run dev
```

Default seeded login after DB setup: `admin@ilead.local` / `iLead2026!`.

## Source of truth

Implementation follows `iLead_Developer_Document_Final.md` v3.0:

- One student can touch many campaigns through `LeadCampaignTouch`.
- Lead API validates at least one identifier: email, phone, passport number, or external lead ID.
- Campaign actual spend is derived from `CampaignCost.amountMyr`.
- SLA defaults: HOT=1, WARM=3, COLD=7 calendar days in MYT.
- PII export and faculty dean umbrella visibility are system settings.
