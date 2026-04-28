# iLead — Pre-Development TODO

> Status as of doc v3.0 (`iLead_Developer_Document_Final.md`).  
> Items marked `[x]` are now resolved in the final developer doc.

---

## A. Schema fixes (resolved in `iLead_Developer_Document_Final.md` §7)

- [x] Decide B1: keep `LeadCampaignTouch` (LINK) — locked in §0 of final doc.
- [x] Update B2 to "at least one of email / phone / passport / externalLeadId" — Zod rule in §10.1.
- [x] Clarify C1: V1 = iLead's own REST API; SIS read-only API is V2 — locked in §0.
- [x] Add `@relation` for `Enrolment.scholarshipId`, `Enrolment.sponsorId`, `MouMoa.countryId`, `MobilityRecord.countryId`, `AcademicPeer.countryId`, `Sponsor.countryId`.
- [x] Add `Offer.programmeId` (nullable FK Programme).
- [x] Add `Enrolment.programmeId` (nullable FK Programme).
- [x] Add `@@index([applicationId])` to `Enrolment` (and `Offer`).
- [x] Add `Lead.assignedAt DateTime?`.
- [x] Add `Lead.source LeadSource?` enum.
- [x] Add `LeadStatusHistory` and `ApplicationStatusHistory` tables.
- [x] Add `RefreshToken` table for revocable sessions.
- [x] Add `PasswordResetToken` table.
- [x] Add `UploadBatch` table for CSV upload audit / rollback.
- [x] Add `SystemSetting` (key/value JSON) table — defaults seeded in §8.
- [x] `Campaign.actualSpendMyr` is **derived** (sum of `CampaignCost.amountMyr`), refreshed on cost write — documented §0 + §7.
- [x] `CampaignMetric` is a **daily snapshot** (`@@unique([campaignId, metricDate])`) — documented §0.
- [x] Add `ExecutiveProgrammeIncome` table.
- [x] Add `Enrolment.manualAttributionCampaignId` for non-auto-matched enrolments.

## B. Business rule clarifications (resolved in §10)

- [x] Per-quality SLA: HOT=1d, WARM=3d, COLD=7d as `SystemSetting` keys (§8, §10.3).
- [x] Define "overdue" exactly: calendar days, MYT, configurable to business-days-only (§10.3).
- [x] Define lead deduplication outcome: LINK via `LeadCampaignTouch` (§5.5).
- [x] Define manual attribution for unmatched enrolments (§10.8).
- [x] Define data retention: PII anonymized after `pii.retention.years` (default 5) (§10.9).
- [x] List admin-configurable flags in `SystemSetting` (§8).

## C. Auth / security details (resolved in §16)

- [x] Password reset flow + `PasswordResetToken` table (§5.1, §11.1).
- [x] CSRF strategy: SameSite=Lax + double-submit cookie pattern (§16.2).
- [x] Rate limits: login 5/5min/IP, forgot 3/hour/email; configurable via SystemSetting (§16.1).
- [x] `User.passwordHash` is nullable for future SSO; required at API for MVP (§7).

## D. Seed / sample data (planned in §18)

- [ ] Implement `prisma/seed.ts` per §18 spec:
  - 8 countries, 5 faculties, 25 programmes, 5 currencies + FX, 30 tuition fees.
  - 1 SUPER_ADMIN + 2 MANAGEMENT + 3 CIAC_ADMIN + 5 FACULTY_DEAN + 10 STAFF + 1 REGISTRAR + 1 FINANCE.
  - 10 campaigns (3 umbrella, 2 high-ROI, 2 low-ROI, 1 scholarship-heavy).
  - 50–200 leads/campaign with cross-campaign touches.
  - Funnel: 30% lead→app, 60% app→offer, 50% offer→enrol; 20% scholarship/sponsored.
  - 20 MoUs, 15 mobility, 10 academic peers, 5 exec income.
  - All `SystemSetting` defaults seeded.
- [ ] Add `npm run seed` script (`"prisma": { "seed": "ts-node prisma/seed.ts" }`).
- [ ] Use `@faker-js/faker` for realistic names/emails/phones.

## E. Branding / UX assets (still need to obtain)

- [ ] Get UUM brand pack from UUM Comms: logo (SVG), primary/secondary colours (hex), font name.
- [ ] Confirm domain `ilead.uum.edu.my` with UUM IT (DNS + SSL).
- [ ] Confirm SMTP credentials for `no-reply@uum.edu.my` (Microsoft 365 or Zoho).
- [ ] Get 2–3 sample real campaign / lead Excel files from CIAC for template mapping.
- [ ] Prepare default placeholder branding in `frontend/src/assets/` until brand pack arrives (see §20 of final doc).

## F. Stakeholder sign-off (must complete before `prisma migrate dev`)

Send `iLead_Stakeholder_SignOff.md` (companion file) to:

- [ ] CIAC — confirm campaign workflow + dedup decision + SLA per quality.
- [ ] Registrar / Admission — confirm CSV upload templates + matching priority.
- [ ] Finance — confirm currency / FX rule + cost categories.
- [ ] Faculty Deans — confirm visibility rule for umbrella campaigns.
- [ ] DVC / Top Management — confirm ROI revenue basis defaults (first-year + full-programme both shown).
- [ ] UUM IT — confirm hosting (internal vs external VPS), PDPA review, backup destination, SSO timeline.
- [ ] UUM Legal / DPO — confirm data retention period (5 years default) + PII export rules.

## G. Project setup tasks (week 1)

- [ ] Init repo: `frontend/` (React + Vite + Tailwind + shadcn) and `backend/` (Node + Express + Prisma).
- [ ] PostgreSQL DB created locally; `.env` files created (do NOT commit).
- [ ] Copy `prisma/schema.prisma` from `iLead_Developer_Document_Final.md` §7.
- [ ] Run `npx prisma migrate dev --name init`.
- [ ] Run `npm run seed`.
- [ ] Set up shadcn/ui + Recharts on frontend.
- [ ] Set up auth scaffolding (login, refresh, /me, forgot-password).
- [ ] Set up Redis + BullMQ for jobs.
- [ ] Set up GitHub Actions CI (lint + typecheck + tests).
- [ ] Set up Pino logger + request-id middleware on backend.
- [ ] Set up Sentry (or self-hosted equivalent) for error tracking.

## H. Risk register (track during build)

- [ ] Solo dev + 14 weeks: scope creep is risk #1. Freeze V1 scope at end of week 2.
- [ ] PDPA compliance review before deploying to production (week 12).
- [ ] Backup restore drill (week 13).
- [ ] UAT with at least 1 CIAC user, 1 Dean, 1 Registrar, 1 Finance, 1 Staff (week 13).
- [ ] If SIS data is unavailable, V1 ships with CSV-only — communicate this risk to stakeholders week 1.
- [ ] If brand pack delayed beyond week 4, ship with placeholder branding and skin later.

## I. Deployment readiness (week 13–14)

- [ ] VPS provisioned (Ubuntu 22.04 LTS, 4 vCPU, 8 GB RAM, 100 GB SSD minimum).
- [ ] PostgreSQL 15+ installed + tuned (shared_buffers, work_mem).
- [ ] Redis installed.
- [ ] Nginx config: HTTPS only, HSTS, gzip, rate limiting at proxy level.
- [ ] SSL via Let's Encrypt (auto-renew via certbot).
- [ ] PM2 ecosystem file with cluster mode for backend.
- [ ] Daily pg_dump cron + off-site sync (e.g. rclone to S3-compatible storage).
- [ ] Monthly backup retention via separate cron.
- [ ] Monitoring: uptime check + disk/CPU alert (e.g. UptimeRobot + Netdata).
- [ ] Run end-to-end smoke test on production DNS before announcing.
- [ ] Train CIAC + 1 staff user; record session for future onboarding.

---

## Quick reference

| File | Purpose |
|---|---|
| `iLead_Business_Proposal_Updated.md` | Business case for management / grant. |
| `iLead_Developer_Document_Final.md` | **Implementation source of truth** (schema, rules, APIs, security). |
| `iLead_Stakeholder_SignOff.md` | One-page sign-off form for CIAC / Registrar / Finance / IT. |
| `to-do-list.md` | This file — track build progress. |

**Next action:** complete §F (stakeholder sign-off) → §E (brand pack + domain) → §G (week 1 setup) → §D (seed) → start Phase 2 of §21 in final doc.
