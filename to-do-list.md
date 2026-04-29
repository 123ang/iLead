# iLead Full-Solution TODO

> Working rule from 2026-04-29: this is no longer allowed to remain a scaffold. Every item must become working code, be tested, and be ticked only after verification. Opus will audit the code, so implementation must be clean, secure, and evidence-backed.

Legend:

- [x] Done and verified
- [ ] Not done yet
- [~] In progress / partially implemented, do not count as done

---

## 0. Project baseline and verification

- [x] Read core documents and use `iLead_Developer_Document_Final.md` as the source of truth.
- [x] Initialize git repository.
- [x] Create monorepo with `backend/` and `frontend/` workspaces.
- [x] Add root `README.md`.
- [x] Add beginner VPS deployment guide `deploy.md`.
- [x] Install npm dependencies.
- [x] Generate Prisma Client successfully.
- [x] Validate Prisma schema successfully with placeholder `DATABASE_URL`.
- [x] Build backend syntax check successfully.
- [x] Build frontend Vite production bundle successfully.
- [x] Commit baseline scaffold: `3d2b10b`.
- [x] Commit deployment guide: `d187aed`.
- [x] Commit auth/security hardening: `fe7ebb6`.
- [ ] Run against a real local PostgreSQL database.
- [ ] Run migration from a clean database.
- [ ] Run seed from a clean database.
- [ ] Run HTTP smoke test successfully against running backend.
- [ ] Run browser/E2E test against running frontend + backend.

---

## 1. Database and Prisma schema

- [x] Implement core schema for users, roles, auth tokens, password reset tokens.
- [x] Implement master data schema: countries, faculties, programmes, currencies, FX, tuition fees, scholarships, sponsors.
- [x] Implement campaign schema with multi-country, multi-faculty, multi-programme join tables.
- [x] Implement `LeadCampaignTouch` so repeated campaign appearances do not duplicate student identity.
- [x] Implement lead identifier fields: email, phone, passport number, external lead ID.
- [x] Implement follow-up schema.
- [x] Implement application schema.
- [x] Implement campaign costs and ROI metric snapshot schema.
- [x] Implement `SystemSetting` table.
- [x] Implement audit log table.
- [x] Add committed Prisma migration files.
- [x] Add `Campaign.actualSpendMyr` field; still needs automatic refresh on cost writes.
- [~] Add explicit Offer and Enrolment tables if still required by final doc after current Application-status simplification review.
- [~] Add `LeadStatusHistory` and `ApplicationStatusHistory` if still required by final doc.
- [~] Add `UploadBatch` table and upload-row audit/rollback support.
- [~] Add `ExecutiveProgrammeIncome` table.
- [~] Add manual attribution support for unmatched enrolments/campaigns.
- [~] Add database indexes for reporting performance after real query review.

---

## 2. Seed data

- [~] Seed script exists with basic fake non-PII data.
- [~] Seed exactly/spec-compliant: 8 countries.
- [~] Seed exactly/spec-compliant: 5 faculties.
- [~] Seed exactly/spec-compliant: 25 programmes.
- [~] Seed currencies and FX rates for required currencies/months.
- [~] Seed 30 tuition fees.
- [~] Seed 1 SUPER_ADMIN, 2 MANAGEMENT, 3 CIAC_ADMIN, 5 FACULTY_DEAN, 10 STAFF, 1 REGISTRAR, 1 FINANCE.
- [~] Seed 10 campaigns including 3 umbrella campaigns.
- [~] Seed 2 high-ROI campaigns, 2 low-ROI campaigns, and 1 scholarship-heavy campaign.
- [~] Seed 50–200 leads per campaign.
- [~] Seed cross-campaign touches for duplicate/repeated students.
- [~] Seed 30% lead→application, 60% application→offer, 50% offer→enrolment funnel.
- [~] Seed 20% scholarship/sponsored enrolments.
- [~] Seed 20 MoUs/MoAs, 15 mobility records, 10 academic peers, 5 executive programme incomes.
- [~] Seed all default `SystemSetting` keys.
- [~] Verify seed is idempotent or safely resettable.

---

## 3. Backend API — auth and security

- [x] Login endpoint implemented.
- [x] `/me` endpoint implemented.
- [x] Refresh endpoint implemented with HTTP-only refresh cookie.
- [x] Refresh token hashing and rotation implemented.
- [x] Logout implemented.
- [x] Forgot password scaffold implemented.
- [x] Reset password implemented.
- [x] Change password implemented.
- [x] Must-change-password flag handled by backend/frontend.
- [x] Basic RBAC middleware implemented.
- [x] CORS/trusted-origin allowlist implemented.
- [x] Global API rate limit implemented.
- [~] Auth audit logging exists partially; needs complete success/failure audit coverage.
- [ ] Add login failure rate limit exactly as final spec: 5 attempts / 5 minutes / IP.
- [ ] Add forgot-password rate limit: 3 per hour per email.
- [ ] Add double-submit CSRF token for cookie-auth mutating endpoints if using cookie auth beyond refresh.
- [ ] Add production-grade email sending for password reset / notifications.
- [ ] Add tests for auth, refresh rotation, logout, password reset, and RBAC.

---

## 4. Backend API — master data

- [x] Master data read endpoints exist.
- [x] Master data create endpoint restricted to admin roles.
- [ ] Implement update endpoints for country/faculty/programme/currency/FX/tuition/scholarship/sponsor.
- [ ] Implement soft-disable/isActive flows.
- [ ] Implement server-side pagination, filtering, and search.
- [ ] Implement validation schemas for each master data type.
- [ ] Add tests for master data permissions and validation.

---

## 5. Backend API — campaigns

- [x] Campaign list endpoint exists.
- [x] Campaign create endpoint exists.
- [x] Campaign detail endpoint exists.
- [x] Campaign soft delete endpoint exists.
- [x] Campaign ROI endpoint exists.
- [~] Implement campaign update endpoint including country/faculty/programme mappings.
- [~] Implement campaign cost CRUD.
- [~] Automatically refresh `Campaign.actualSpendMyr` from `CampaignCost.amountMyr` on cost write/delete.
- [ ] Implement campaign performance endpoint with funnel, costs, revenue, and recommendations.
- [ ] Implement role-specific campaign visibility completely.
- [ ] Add tests for campaign CRUD, many-to-many mapping, ROI, and permissions.

---

## 6. Backend API — leads and follow-up

- [x] Lead list endpoint exists.
- [x] Lead create endpoint exists.
- [x] Lead detail endpoint exists.
- [x] Lead status update endpoint exists.
- [x] Lead soft delete endpoint exists.
- [x] Lead create validates at least one identifier.
- [x] Follow-up list/create/overdue endpoints exist.
- [x] Implement lead update endpoint.
- [x] Implement lead assign endpoint.
- [x] Implement lead status history.
- [~] Implement robust overdue SLA calculation using HOT/WARM/COLD settings in MYT.
- [x] Implement staff-specific lead visibility and assignment rules.
- [ ] Implement in-app notifications for assignment and overdue follow-ups.
- [ ] Add tests for lead validation, assignment, SLA, status transitions, and permissions.

---

## 7. Backend API — deduplication

- [x] Duplicate queue route exists.
- [x] Implement exact duplicate detection: email.
- [x] Implement exact duplicate detection: phone.
- [x] Implement exact duplicate detection: passport.
- [x] Implement possible duplicate detection: same name + country + programme.
- [x] Implement manual merge queue actions: accept/link, reject, mark reviewed.
- [x] Ensure accepted duplicates use `LeadCampaignTouch`, not duplicate lead rows.
- [x] Add duplicate report endpoint.
- [x] Add tests for exact/fuzzy duplicate detection and merge behavior.

---

## 8. Backend API — application, offer, enrolment, matching

- [x] Application list endpoint exists.
- [x] Application create endpoint exists.
- [x] Unmatched application endpoint exists.
- [~] Upload endpoint exists but is only placeholder.
- [~] Match-leads endpoint exists but is only placeholder.
- [~] Implement application update endpoint.
- [~] Implement CSV/XLSX upload parsing.
- [~] Implement upload validation report with row-level errors.
- [~] Implement `UploadBatch` audit and rollback.
- [~] Implement lead matching priority: email, phone, passport, name+programme+country, source campaign.
- [~] Implement conflict/manual-review queue.
- [~] Implement offer/enrolment workflow or explicit tables per final schema decision.
- [~] Implement scholarship-adjusted revenue calculation.
- [ ] Add tests for upload validation, matching, conflict review, and revenue calculation.

---

## 9. Backend API — ROI, metrics, reporting, exports

- [x] ROI service with safe division exists.
- [x] Executive dashboard endpoint exists.
- [x] Recruitment funnel endpoint exists.
- [x] Per-campaign ROI filters applications by touched leads.
- [x] Implement daily `CampaignMetric` refresh service/script/manual endpoint; production cron is documented but not verified on a host.
- [ ] Implement dashboard performance targets with real indexes and query tuning.
- [x] Implement country performance report.
- [x] Implement faculty performance report.
- [x] Implement programme conversion report.
- [x] Implement follow-up SLA report.
- [x] Implement duplicate lead report.
- [x] Implement scholarship-adjusted revenue report.
- [x] Implement CSV exports for report endpoints.
- [ ] Implement PDF exports if required for V1.
- [x] Audit-log report CSV export attempts, including denied PII export attempts.
- [x] Add tests for ROI edge cases, report calculations, CSV escaping, filters, and PII export permission/audit payload behavior.

---

## 10. Frontend — auth and layout

- [x] Vite React app created.
- [x] Tailwind configured.
- [x] Login page implemented.
- [x] In-memory access token store implemented.
- [x] Refresh interceptor implemented.
- [x] Protected routes implemented.
- [x] Must-change-password page implemented.
- [x] Sidebar layout implemented.
- [x] Role-filtered nav partially implemented.
- [ ] Add forgot password page.
- [ ] Add reset password page.
- [~] Add logout button and session expiry UX.
- [ ] Add user profile/change password UX in main layout.
- [ ] Add loading/error/toast system.
- [ ] Add frontend auth tests.

---

## 11. Frontend — functional modules

- [x] Dashboard page exists with stat cards and funnel chart.
- [x] Generic list page exists.
- [~] Campaign list uses backend API but lacks real actions/forms.
- [~] Lead list uses backend API but lacks real actions/forms.
- [~] Settings/users/audit pages use generic list views only.
- [ ] Implement Campaign list filters/search/pagination.
- [~] Implement Campaign create/edit form with multi-country/faculty/programme selection.
- [~] Implement Campaign detail page with funnel, costs, ROI, leads, applications.
- [~] Implement Campaign cost form.
- [ ] Implement Lead list filters/search/pagination.
- [~] Implement Lead create/edit form.
- [~] Implement Lead detail page with campaign touches, follow-ups, applications.
- [ ] Implement Follow-up create/edit UI and overdue queue.
- [~] Implement Duplicate Leads page with merge/reject actions.
- [~] Implement Application upload page with file upload, column mapping, validation preview.
- [ ] Implement Match Conflicts page.
- [x] Implement Reports page with URL-backed filters, report tables, CSV export buttons, and metric refresh action.
- [ ] Implement Master Data CRUD pages.
- [ ] Implement User Management CRUD page.
- [ ] Implement Settings edit page.
- [ ] Implement Audit Logs filtering page.
- [ ] Add responsive/mobile-friendly UI polish.
- [ ] Add frontend component/integration tests.

---

## 12. Jobs, notifications, retention, integrations

- [~] Set up Redis/BullMQ or a documented simpler MVP cron alternative; documented PM2/cron-compatible script exists, host cron not verified.
- [x] Implement metrics refresh job service and CLI script.
- [ ] Implement overdue digest job.
- [ ] Implement weekly campaign summary job.
- [ ] Implement PII retention/anonymization job.
- [ ] Implement in-app notification read/unread endpoints.
- [ ] Implement email templates and SMTP sending.
- [ ] Keep SIS direct API, WhatsApp, SSO, AI scoring, BI as V2 unless user promotes scope.

---

## 13. Testing and audit readiness

- [x] Backend syntax check passes.
- [x] Frontend production build passes.
- [x] Prisma schema validation passes.
- [~] Smoke test script exists but still needs real DB runtime execution.
- [x] Add automated unit test framework.
- [x] Unit tests: ROI formulas.
- [x] Unit tests: SLA overdue calculation.
- [ ] Unit tests: currency FX conversion and frozen MYR amounts.
- [ ] Integration tests: auth and RBAC.
- [ ] Integration tests: lead validation and dedupe.
- [ ] Integration tests: upload validation and matching.
- [ ] Integration tests: dashboard metrics accuracy.
- [ ] E2E test: login → create campaign → create/upload leads → follow up → upload applications → match → see ROI.
- [x] Security test: PII export permission and audit payload behavior. Route-level audit persistence still needs DB integration smoke.
- [ ] Soft delete tests.
- [ ] Timezone rendering/storage tests.
- [ ] Performance test with large seeded data.
- [x] Produce `TEST_REPORT.md` before claiming full completion.

---

## 14. Deployment readiness

- [x] Beginner VPS guide exists.
- [x] Deployment guide updated to use `prisma migrate deploy`.
- [x] Add PM2 ecosystem config.
- [x] Add production Nginx config template in repo.
- [x] Add backup scripts.
- [x] Add restore drill documentation.
- [x] Add GitHub Actions CI.
- [x] Add production `.env` checklist.
- [x] Add monitoring/uptime checklist.
- [ ] Run production-like deploy smoke test before launch.

---

## 15. External dependencies / user-side blockers

These require real stakeholder or infrastructure input and cannot be honestly ticked by code alone:

- [ ] UUM brand pack: logo SVG, official colours, fonts.
- [ ] Domain/DNS decision: e.g. `ilead.uum.edu.my` or temporary VPS domain.
- [ ] SMTP credentials for real email sending.
- [ ] 2–3 real sample CSV/XLSX campaign/lead/application files for upload mapping.
- [ ] Hosting decision and PDPA review.
- [ ] Stakeholder sign-off from CIAC, Registrar, Finance, Deans, DVC, IT, DPO.

---

## Immediate next build order

1. Make local PostgreSQL runtime pass: migrate, seed, backend start, smoke test.
2. Complete missing database tables/features required by final doc.
3. Replace frontend placeholders with real CRUD for Campaign + Lead + Follow-up.
4. Implement upload + matching + dedupe.
5. Implement reports/exports/jobs.
6. Add tests and produce `TEST_REPORT.md`.
