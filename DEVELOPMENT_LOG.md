# iLead Development Log

## 2026-04-29 — Initial full-system scaffold

### Documents read

- `iLead_Developer_Document_Final.md` — source of truth for V1
- `to-do-list.md` — confirms schema/business clarifications are resolved
- `iLead_Business_Proposal_Updated.md`
- `iLead_Stakeholder_SignOff.md`
- Earlier proposal/developer drafts checked for context only

### Built in this pass

Root:
- Git repository initialized.
- Monorepo `package.json` with workspaces.
- `.gitignore`.
- `README.md` with setup and source-of-truth notes.

Backend:
- `backend/` Node + Express + Prisma scaffold.
- Prisma schema covering core v3.0 domain:
  - users, refresh tokens, countries, faculties, programmes, currencies, FX rates
  - campaigns + campaign countries/faculties/programmes
  - leads + `LeadCampaignTouch`
  - duplicate queue, follow-ups, applications
  - campaign costs, tuition, scholarships, sponsors
  - MoU/MoA, mobility, academic peers
  - campaign metrics, notifications, audit logs, system settings
- Auth scaffold: login, refresh, logout, me.
- RBAC middleware.
- Lead Zod validation enforcing at least one identifier.
- Campaign Zod validation.
- ROI service with safe division and conversion/cost/ROI formulas.
- Dashboard service and endpoints.
- Core routes for master data, campaigns, leads, follow-ups, applications, settings, users, audit logs.
- Seed script with fake non-PII development data and default settings.

Frontend:
- `frontend/` React + Vite + Tailwind scaffold.
- Axios API client with in-memory bearer token and refresh interceptor.
- Zustand auth store.
- Protected layout with sidebar navigation.
- Login page.
- Dashboard page with stat cards and Recharts funnel chart.
- Generic list pages wired to backend APIs.
- Placeholder pages for detail/forms/uploads/reports pending deeper implementation.

### Verification

Completed:

```bash
npm install
npm run prisma:generate
DATABASE_URL='postgresql://ilead_user:password@localhost:5432/ilead_db' npx prisma validate --schema backend/prisma/schema.prisma
npm run build
```

Result: Prisma schema validation passed with placeholder DATABASE_URL. Prisma Client generation passed. Backend JS syntax check passed. Frontend Vite production build passed. Backend runtime still requires PostgreSQL and `.env`.

### Next development tasks

1. Create PostgreSQL database and run initial migration.
2. Run seed script.
3. Replace placeholder pages with real CRUD forms:
   - Campaign form with multi-country/faculty/programme mapping.
   - Lead capture form and upload flow.
   - Follow-up form and overdue SLA UI.
   - Application upload/matching review.
4. Implement dedupe service exact/fuzzy matching.
5. Implement upload parser and validation reports for CSV/XLSX.
6. Implement role-specific dashboard filters.
7. Add tests for ROI, lead validation, SLA, matching and permissions.

### Known limitations of this initial scaffold

- No database migration has been run yet.
- File upload and matching endpoints are scaffolds, not full workflows.
- Frontend CRUD forms are not complete yet.
- Auth refresh token persistence is simplified; production needs hashed refresh-token rotation using `RefreshToken` records.
