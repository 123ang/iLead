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

- File upload and matching endpoints are scaffolds, not full workflows.
- Frontend CRUD forms are not complete yet.

---

## 2026-04-29 — Security + scope hardening (consolidated scaffold)

### Backend

- Single active route tree under `app.js`; removed duplicate `controllers/`, plural `*.routes.js`, and unused services/middleware.
- **Auth:** Opaque refresh tokens stored as SHA-256 in `RefreshToken`, rotation on refresh, login excludes `deletedAt` users, HTTP-only cookie `ilead_refresh` (no refresh token in JSON body), `secure` in production, forgot/reset/change password flows, `assertTrustedOrigin` on cookie auth routes.
- **RBAC:** Campaign create/delete limited to `SUPER_ADMIN` / `MANAGEMENT` / `CIAC_ADMIN`; master-data POST to `SUPER_ADMIN` / `CIAC_ADMIN`; `/users` returns no `passwordHash`.
- **Dashboard / ROI:** Executive + funnel + per-campaign ROI scoped by role/faculty/staff; campaign ROI filters applications by leads touched in that campaign; `roiRatio` null when spend is zero.
- **Validation:** Zod on applications, follow-ups, campaign enums; error handler supports `AppError` and JWT errors.
- **Infra:** Global `/api` rate limit, CORS allow-list via `TRUSTED_ORIGINS` / `FRONTEND_URL`, audit log uses `req.user.id`.

### Prisma

- Migration `20260428223137_auth_scope_roles`: `PasswordResetToken`, unique `RefreshToken.tokenHash`, `Lead` indexes + `assignedAt`/`source`, `Application.sourceCampaignId` FK, `Campaign.actualSpendMyr`, `StudyLevel.MOBILITY`.

### Frontend

- Refresh interceptor uses a bare `axios` client to avoid infinite loops; logout on failed refresh.
- **Password gate:** `mustChangePassword` → `/change-password` before main app.
- **Nav:** Links filtered by role (e.g. Users for `SUPER_ADMIN` only).
- Dashboard shows `n/a` when ROI ratio is null.

### Repo

- Stopped ignoring `backend/prisma/migrations` in `.gitignore` so migrations can be committed.
