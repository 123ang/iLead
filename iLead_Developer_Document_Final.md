# iLead Developer Document (Final v3.0)

## International Lead and Recruitment ROI Dashboard

**Project Name:** iLead  
**Frontend:** React + Vite + Tailwind + shadcn/ui + Recharts  
**Backend:** Node.js + Express.js + Prisma  
**Database:** PostgreSQL  
**Deployment:** Ubuntu VPS (or UUM internal server) + Nginx + PM2  
**Document Version:** 3.0 — schema and rule fixes applied  
**Status:** Ready for `prisma migrate dev` after stakeholder sign-off (see §22).

---

## 0. Decisions Locked Into This Version

These were decided after review and are **baked into the schema below**. If any change, the schema must be updated.

| # | Decision | Resolution |
|---|---|---|
| B1 | Same student appears in many campaigns | **LINK** via `LeadCampaignTouch` (one Lead, many touches). Manual merge queue for fuzzy duplicates. |
| B2 | Mandatory lead identifier | **At least one of:** `email`, `phone`, `passportNumber`, `externalLeadId`. Enforced at Zod layer, not DB. |
| C1 | V1 API meaning | iLead's own **REST API** (in V1). SIS read-only API stays in V2. |
| D2 | Faculty Dean visibility for umbrella campaigns | **Configurable** by Super Admin via `SystemSetting`. |
| D3 | Who can export PII | **Configurable** by Super Admin via `SystemSetting`. Defaults: SUPER_ADMIN, CIAC_ADMIN. All exports audit-logged. |
| E1 | Per-quality SLA | HOT=1d, WARM=3d, COLD=7d (calendar days, MYT). Stored in `SystemSetting`. |
| Spend | `Campaign.actualSpendMyr` | **Derived** = Σ `CampaignCost.amountMyr`. Stored as cached column, refreshed on cost write. |
| Metrics | `CampaignMetric` granularity | **Daily snapshot** (one row per `campaignId` per `metricDate`). Enables trend charts. |

---

## 1. Project Overview

iLead is a web dashboard for tracking UUM's international student recruitment campaigns and calculating ROI. The system tracks the full funnel:

```text
Campaign -> Lead -> Follow-up -> Application -> Offer -> Enrolment -> Revenue -> ROI
```

It must support international campaign complexity: multi-country events, CIAC umbrella campaigns, multiple faculties, multiple programmes, currency conversion, scholarship-adjusted tuition revenue, and duplicate leads across events.

---

## 2. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite | Fast SPA development. |
| Styling | Tailwind CSS + UUM brand tokens | See §20 for branding. |
| UI Library | shadcn/ui | Tables, cards, forms, dialogs, dropdowns. |
| Charts | Recharts | Funnel, bar, line, pie. |
| Data | TanStack Query | Caching, dashboard refetch. |
| Forms | React Hook Form + Zod | Identifier validation, upload schemas. |
| Backend | Node.js 20 + Express 4 | REST API. |
| ORM | Prisma 5 | Type-safe queries. |
| Database | PostgreSQL 15+ | Relational data + reporting. |
| Auth | JWT access (memory) + HTTP-only refresh cookie | See §15. |
| Uploads | Multer + xlsx + papaparse | Excel/CSV templates. |
| Email | Nodemailer + Microsoft 365 SMTP | Reminders, password reset. |
| Jobs | BullMQ + Redis | Metrics refresh, overdue digest. |
| Deployment | Nginx + PM2 | Reverse proxy + process manager. |
| Optional V2 | Microsoft Entra SSO, Metabase | Production hardening. |

---

## 3. Core Design Principles

1. No free-text master data for country, programme, or faculty.
2. Campaigns are many-to-many with country, faculty, programme.
3. Costs always store original currency + MYR equivalent + FX rate + rate date.
4. Soft delete for `Campaign`, `Lead`, `Application`, `User`.
5. `CampaignMetric` is a daily summary table — dashboards read from it, not live joins.
6. UTC in DB. MYT (UTC+8) in UI.
7. Audit log every sensitive write with IP + UA + session.
8. Application matching is probabilistic with a manual review queue for conflicts.
9. All admin-configurable rules live in `SystemSetting` (key/value JSON). Never hardcode.

---

## 4. User Roles

| Role | Access |
|---|---|
| `SUPER_ADMIN` | Full system, master data, settings, users, exports. |
| `MANAGEMENT` | Executive dashboards, reports, no edit. |
| `CIAC_ADMIN` | Campaigns, leads, master data, follow-up, reports, uploads. |
| `FACULTY_DEAN` | Faculty-linked dashboard + reports. Umbrella campaign visibility configurable. |
| `PROGRAMME_COORDINATOR` | Programme leads, follow-ups assigned to programme. |
| `STAFF` | Capture leads, update assigned leads, record follow-ups. |
| `REGISTRAR` | Application/offer/enrolment upload + verification. |
| `FINANCE` | Campaign costs and FX data. |

---

## 5. System Modules

### 5.1 Authentication

- Login (email/password).
- Refresh token rotation (revocable via `RefreshToken` table).
- Forgot password → email link → reset (token in `PasswordResetToken`).
- Change password.
- Optional Microsoft Entra SSO in V2.

Token strategy:

- Access token: returned in JSON response body, **kept in memory only** (Zustand store, never `localStorage`).
- Refresh token: HTTP-only secure cookie, stored as a hashed row in `RefreshToken`.

### 5.2 Master Data Module

Tables: `Country`, `Faculty`, `Programme`, `Currency`, `FXRate`, `TuitionFee`, `Scholarship`, `Sponsor`, `CampaignType` (enum).

CSV bulk-import for Programme and TuitionFee on first install.

### 5.3 Campaign Management

- Create / edit / soft-delete campaign.
- Many-to-many with country, faculty, programme via join tables.
- Approved budget (MYR) entered manually.
- Actual spend (MYR) derived from `CampaignCost` rows.

### 5.4 Lead Capture

- Mobile-friendly web form.
- CSV/Excel upload via `UploadBatch`.
- Lead identifier rule: at least one of `email | phone | passportNumber | externalLeadId`.
- Lead source captured (`EVENT_FORM`, `CSV_UPLOAD`, `QR_CODE`, `WEBSITE`, `MANUAL_ENTRY`).

### 5.5 Lead Deduplication

- On insert, system runs match-check on `email`, `phone`, `passport`.
- High-confidence (exact match) → ask user "merge or keep separate?".
- Medium-confidence (name + country + programme) → push to `LeadMergeCandidate` queue.
- A single Lead can have many `LeadCampaignTouch` rows showing every campaign they appeared in.

### 5.6 Follow-up & Notification

Overdue rule (uses per-quality SLA from `SystemSetting`):

```text
A lead is OVERDUE if:
  status IN (NEW, CONTACTED, INTERESTED) AND
  (
    (followUps is empty AND now() - assignedAt > SLA_DAYS[leadQuality])
    OR (latestFollowUp.nextFollowUpDate < now())
  )
```

`SLA_DAYS = { HOT: 1, WARM: 3, COLD: 7 }` (calendar days, MYT).

Notifications:

- In-app (`Notification` table).
- Email digest for overdue (daily, sent 09:00 MYT).
- Weekly summary for CIAC admin (Mondays 09:00 MYT).

### 5.7 Application & Enrolment

- A lead can apply to multiple programmes → `Application.leadId` non-unique.
- `Application` has `programmeApplied` (programme they applied for).
- `Offer.programmeId` may differ (offered different programme).
- `Enrolment.programmeId` may differ again (final enrolled programme).
- Status transitions are tracked in `ApplicationStatusHistory` and `LeadStatusHistory`.
- `Enrolment.manualAttributionCampaignId` allows admin to attribute enrolments not auto-matched.

### 5.8 Campaign Outcomes (non-recruitment KPIs)

`MouMoa`, `MobilityRecord`, `AcademicPeer`, `ExecutiveProgrammeIncome` all have **nullable** `campaignId` to support non-campaign activities.

### 5.9 ROI Engine

Stored in `roi.service.js`. Single source of truth for formulas. See §10.

### 5.10 Reporting

Reports (CSV/Excel/PDF):

- Campaign ROI report.
- Country performance.
- Faculty performance.
- Programme conversion.
- SLA compliance.
- Duplicate lead report.
- Scholarship-adjusted revenue.

---

## 6. Database Tables

```text
users
refresh_tokens
password_reset_tokens
faculties
countries
programmes
currencies
fx_rates
campaign_types          (enum, no table)
campaigns
campaign_countries
campaign_faculties
campaign_programmes
leads
lead_campaign_touches
lead_merge_candidates
lead_status_history
follow_ups
applications
application_status_history
offers
enrolments
campaign_costs
tuition_fees
scholarships
sponsors
mou_moas
mobility_records
academic_peers
executive_programme_income
campaign_metrics
notifications
upload_batches
audit_logs
system_settings
```

---

## 7. Prisma Schema (Final)

```prisma
// =====================================================
// Generators
// =====================================================
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =====================================================
// Auth
// =====================================================

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String?  // nullable for future SSO users
  role         Role
  facultyId    String?
  faculty      Faculty? @relation(fields: [facultyId], references: [id])
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  deletedAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  assignedLeads        Lead[]                    @relation("AssignedStaff")
  followUps            FollowUp[]
  refreshTokens        RefreshToken[]
  passwordResetTokens  PasswordResetToken[]
  uploadBatches        UploadBatch[]
  notifications        Notification[]
  leadStatusChanges    LeadStatusHistory[]       @relation("ChangedByUser")
  appStatusChanges     ApplicationStatusHistory[] @relation("AppChangedByUser")
  mergeReviews         LeadMergeCandidate[]      @relation("MergeReviewer")
  auditLogs            AuditLog[]                @relation("AuditUser")
}

model RefreshToken {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash   String   @unique
  expiresAt   DateTime
  revokedAt   DateTime?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([userId])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([userId])
}

// =====================================================
// Master Data
// =====================================================

model Country {
  id        String   @id @default(cuid())
  name      String   @unique
  iso2      String?  @unique
  iso3      String?  @unique
  region    String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  campaignCountries CampaignCountry[]
  leads             Lead[]
  applications      Application[]
  mouMoas           MouMoa[]
  mobilityRecords   MobilityRecord[]
  academicPeers     AcademicPeer[]
  sponsors          Sponsor[]
}

model Faculty {
  id        String   @id @default(cuid())
  name      String
  code      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  users             User[]
  campaignFaculties CampaignFaculty[]
  programmes        Programme[]
}

model Programme {
  id            String     @id @default(cuid())
  name          String
  code          String?    @unique
  facultyId     String?
  faculty       Faculty?   @relation(fields: [facultyId], references: [id])
  studyLevel    StudyLevel
  durationYears Decimal    @default(1)
  isActive      Boolean    @default(true)
  createdAt     DateTime   @default(now())

  campaignProgrammes CampaignProgramme[]
  tuitionFees        TuitionFee[]
  leads              Lead[]
  applications       Application[]    @relation("ApplicationProgramme")
  offers             Offer[]          @relation("OfferProgramme")
  enrolments         Enrolment[]      @relation("EnrolmentProgramme")
}

model Currency {
  id        String   @id @default(cuid())
  code      String   @unique // MYR, USD, IDR, EUR, JPY, ...
  name      String
  symbol    String?
  createdAt DateTime @default(now())

  fxRates       FXRate[]
  campaignCosts CampaignCost[]
}

model FXRate {
  id         String   @id @default(cuid())
  currencyId String
  currency   Currency @relation(fields: [currencyId], references: [id])
  rateToMyr  Decimal
  rateDate   DateTime
  source     String?
  createdAt  DateTime @default(now())

  @@unique([currencyId, rateDate])
  @@index([rateDate])
}

// =====================================================
// Campaign
// =====================================================

model Campaign {
  id                String         @id @default(cuid())
  name              String
  campaignType      CampaignType
  startDate         DateTime
  endDate           DateTime
  objective         String?
  status            CampaignStatus @default(PLANNED)
  approvedBudgetMyr Decimal        @default(0)
  actualSpendMyr    Decimal        @default(0) // DERIVED: Σ campaignCosts.amountMyr (refreshed on cost write)
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  deletedAt         DateTime?

  countries        CampaignCountry[]
  faculties        CampaignFaculty[]
  programmes       CampaignProgramme[]
  leadTouches      LeadCampaignTouch[]
  costs            CampaignCost[]
  metrics          CampaignMetric[]
  mousMoas         MouMoa[]
  mobilityRecords  MobilityRecord[]
  academicPeers    AcademicPeer[]
  manualEnrolments Enrolment[]      @relation("ManualAttribution")
  execIncome       ExecutiveProgrammeIncome[]

  @@index([status])
  @@index([startDate])
}

model CampaignCountry {
  campaignId String
  countryId  String
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  country    Country  @relation(fields: [countryId], references: [id])

  @@id([campaignId, countryId])
}

model CampaignFaculty {
  campaignId String
  facultyId  String
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  faculty    Faculty  @relation(fields: [facultyId], references: [id])

  @@id([campaignId, facultyId])
}

model CampaignProgramme {
  campaignId  String
  programmeId String
  campaign    Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  programme   Programme @relation(fields: [programmeId], references: [id])

  @@id([campaignId, programmeId])
}

// =====================================================
// Lead
// =====================================================

model Lead {
  id                    String      @id @default(cuid())
  fullName              String
  email                 String?
  phone                 String?
  passportNumber        String?
  externalLeadId        String?
  countryId             String?
  country               Country?    @relation(fields: [countryId], references: [id])
  interestedProgrammeId String?
  interestedProgramme   Programme?  @relation(fields: [interestedProgrammeId], references: [id])
  studyLevel            StudyLevel?
  leadQuality           LeadQuality @default(WARM)
  status                LeadStatus  @default(NEW)
  source                LeadSource? // EVENT_FORM, CSV_UPLOAD, QR_CODE, WEBSITE, MANUAL_ENTRY
  assignedStaffId       String?
  assignedStaff         User?       @relation("AssignedStaff", fields: [assignedStaffId], references: [id])
  assignedAt            DateTime?
  notes                 String?
  uploadBatchId         String?
  uploadBatch           UploadBatch? @relation(fields: [uploadBatchId], references: [id])
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt
  deletedAt             DateTime?

  touches       LeadCampaignTouch[]
  followUps     FollowUp[]
  applications  Application[]
  statusHistory LeadStatusHistory[]
  mergeAsA      LeadMergeCandidate[] @relation("MergeLeadA")
  mergeAsB      LeadMergeCandidate[] @relation("MergeLeadB")

  @@index([status])
  @@index([assignedStaffId])
  @@index([email])
  @@index([phone])
  @@index([passportNumber])
}

model LeadCampaignTouch {
  id         String   @id @default(cuid())
  leadId     String
  lead       Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  campaignId String
  campaign   Campaign @relation(fields: [campaignId], references: [id])
  capturedAt DateTime @default(now())
  sourceNote String?

  @@unique([leadId, campaignId])
  @@index([campaignId])
  @@index([leadId])
}

model LeadMergeCandidate {
  id         String      @id @default(cuid())
  leadAId    String
  leadA      Lead        @relation("MergeLeadA", fields: [leadAId], references: [id])
  leadBId    String
  leadB      Lead        @relation("MergeLeadB", fields: [leadBId], references: [id])
  confidence Decimal     // 0.00 – 1.00
  reason     String      // "exact_email", "exact_phone", "name+country+programme"
  status     MergeStatus @default(PENDING)
  reviewedBy String?
  reviewer   User?       @relation("MergeReviewer", fields: [reviewedBy], references: [id])
  reviewedAt DateTime?
  createdAt  DateTime    @default(now())

  @@index([status])
  @@index([leadAId])
  @@index([leadBId])
}

model LeadStatusHistory {
  id          String     @id @default(cuid())
  leadId      String
  lead        Lead       @relation(fields: [leadId], references: [id], onDelete: Cascade)
  fromStatus  LeadStatus?
  toStatus    LeadStatus
  changedById String?
  changedBy   User?      @relation("ChangedByUser", fields: [changedById], references: [id])
  reason      String?
  changedAt   DateTime   @default(now())

  @@index([leadId])
  @@index([changedAt])
}

// =====================================================
// Follow-up
// =====================================================

model FollowUp {
  id               String       @id @default(cuid())
  leadId           String
  lead             Lead         @relation(fields: [leadId], references: [id], onDelete: Cascade)
  staffId          String
  staff            User         @relation(fields: [staffId], references: [id])
  followUpType     FollowUpType
  followUpDate     DateTime     @default(now())
  nextFollowUpDate DateTime?
  outcome          String?
  notes            String?
  createdAt        DateTime     @default(now())

  @@index([leadId])
  @@index([staffId])
  @@index([nextFollowUpDate])
}

// =====================================================
// Application / Offer / Enrolment
// =====================================================

model Application {
  id                String            @id @default(cuid())
  leadId            String?
  lead              Lead?             @relation(fields: [leadId], references: [id])
  applicantName     String
  email             String?
  phone             String?
  passportNumber    String?
  countryId         String?
  country           Country?          @relation(fields: [countryId], references: [id])
  programmeId       String?
  programme         Programme?        @relation("ApplicationProgramme", fields: [programmeId], references: [id])
  applicationStatus ApplicationStatus @default(APPLIED)
  applicationDate   DateTime?
  sourceCampaignId  String?  // raw attribution from external system
  sourceRaw         String?  // raw text from CSV
  uploadBatchId     String?
  uploadBatch       UploadBatch?      @relation(fields: [uploadBatchId], references: [id])
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  deletedAt         DateTime?

  offers        Offer[]
  enrolments    Enrolment[]
  statusHistory ApplicationStatusHistory[]

  @@index([leadId])
  @@index([programmeId, applicationStatus])
  @@index([passportNumber])
  @@index([email])
}

model ApplicationStatusHistory {
  id            String             @id @default(cuid())
  applicationId String
  application   Application        @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  fromStatus    ApplicationStatus?
  toStatus      ApplicationStatus
  changedById   String?
  changedBy     User?              @relation("AppChangedByUser", fields: [changedById], references: [id])
  reason        String?
  changedAt     DateTime           @default(now())

  @@index([applicationId])
}

model Offer {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  programmeId   String?     // may differ from Application.programmeId
  programme     Programme?  @relation("OfferProgramme", fields: [programmeId], references: [id])
  offerDate     DateTime
  status        OfferStatus @default(ISSUED)
  expiresAt     DateTime?
  createdAt     DateTime    @default(now())

  @@index([applicationId])
  @@index([status])
}

model Enrolment {
  id                          String       @id @default(cuid())
  applicationId               String
  application                 Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  programmeId                 String?      // may differ from Application/Offer programme
  programme                   Programme?   @relation("EnrolmentProgramme", fields: [programmeId], references: [id])
  enrolmentDate               DateTime
  revenueType                 RevenueType  @default(SELF_FUNDED)
  scholarshipId               String?
  scholarship                 Scholarship? @relation(fields: [scholarshipId], references: [id])
  sponsorId                   String?
  sponsor                     Sponsor?     @relation(fields: [sponsorId], references: [id])
  grossTuitionMyr             Decimal      @default(0)
  scholarshipMyr              Decimal      @default(0)
  netTuitionMyr               Decimal      @default(0)
  revenueBasis                RevenueBasis @default(FIRST_YEAR)
  manualAttributionCampaignId String?
  manualAttributionCampaign   Campaign?    @relation("ManualAttribution", fields: [manualAttributionCampaignId], references: [id])
  createdAt                   DateTime     @default(now())

  @@index([applicationId])
  @@index([enrolmentDate])
  @@index([revenueType])
}

// =====================================================
// Finance / Tuition / Scholarship / Sponsor
// =====================================================

model CampaignCost {
  id             String   @id @default(cuid())
  campaignId     String
  campaign       Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  costType       String   // TRAVEL, ACCOMMODATION, BOOTH_FEE, MARKETING, ...
  description    String?
  originalAmount Decimal  @default(0)
  currencyId     String
  currency       Currency @relation(fields: [currencyId], references: [id])
  fxRateToMyr    Decimal  @default(1)
  amountMyr      Decimal  @default(0)
  costDate       DateTime?
  createdAt      DateTime @default(now())

  @@index([campaignId])
}

model TuitionFee {
  id                  String     @id @default(cuid())
  programmeId         String
  programme           Programme  @relation(fields: [programmeId], references: [id])
  studyLevel          StudyLevel
  annualFeeMyr        Decimal
  fullProgrammeFeeMyr Decimal
  effectiveFrom       DateTime
  effectiveTo         DateTime?
  createdAt           DateTime   @default(now())

  @@index([programmeId, effectiveFrom])
}

model Scholarship {
  id        String   @id @default(cuid())
  name      String
  type      String   // PARTIAL, FULL, FEE_WAIVER
  valueMyr  Decimal  @default(0)
  isPercent Boolean  @default(false)
  createdAt DateTime @default(now())

  enrolments Enrolment[]
}

model Sponsor {
  id        String   @id @default(cuid())
  name      String
  countryId String?
  country   Country? @relation(fields: [countryId], references: [id])
  createdAt DateTime @default(now())

  enrolments Enrolment[]
}

// =====================================================
// Strategic / Non-recruitment outcomes
// =====================================================

model MouMoa {
  id          String    @id @default(cuid())
  campaignId  String?
  campaign    Campaign? @relation(fields: [campaignId], references: [id])
  institution String
  countryId   String?
  country     Country?  @relation(fields: [countryId], references: [id])
  type        String
  status      String
  signedDate  DateTime?
  createdAt   DateTime  @default(now())
}

model MobilityRecord {
  id           String    @id @default(cuid())
  campaignId   String?
  campaign     Campaign? @relation(fields: [campaignId], references: [id])
  institution  String
  countryId    String?
  country      Country?  @relation(fields: [countryId], references: [id])
  studentCount Int       @default(0)
  mobilityType String    // INBOUND, OUTBOUND
  createdAt    DateTime  @default(now())
}

model AcademicPeer {
  id          String    @id @default(cuid())
  campaignId  String?
  campaign    Campaign? @relation(fields: [campaignId], references: [id])
  name        String
  institution String
  countryId   String?
  country     Country?  @relation(fields: [countryId], references: [id])
  email       String?
  createdAt   DateTime  @default(now())
}

model ExecutiveProgrammeIncome {
  id           String    @id @default(cuid())
  campaignId   String?
  campaign     Campaign? @relation(fields: [campaignId], references: [id])
  programmeName String
  amountMyr    Decimal   @default(0)
  incomeDate   DateTime
  description  String?
  createdAt    DateTime  @default(now())
}

// =====================================================
// Metrics / Notifications / Operations
// =====================================================

model CampaignMetric {
  id                        String   @id @default(cuid())
  campaignId                String
  campaign                  Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  metricDate                DateTime @default(now())
  totalLeads                Int      @default(0)
  qualifiedLeads            Int      @default(0)
  totalApplications         Int      @default(0)
  totalOffers               Int      @default(0)
  totalEnrolments           Int      @default(0)
  campaignSpendMyr          Decimal  @default(0)
  firstYearRevenueMyr       Decimal  @default(0)
  fullProgrammeRevenueMyr   Decimal  @default(0)
  netRevenueMyr             Decimal  @default(0)
  costPerLeadMyr            Decimal  @default(0)
  costPerEnrolledStudentMyr Decimal  @default(0)
  conversionRate            Decimal  @default(0)
  roiRatio                  Decimal  @default(0)
  roiPercentage             Decimal  @default(0)
  refreshedAt               DateTime @default(now())

  @@unique([campaignId, metricDate])
  @@index([campaignId])
  @@index([metricDate])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  message   String
  type      String   // LEAD_ASSIGNED, OVERDUE_FOLLOWUP, WEEKLY_SUMMARY, ...
  link      String?  // optional in-app link
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId, isRead])
  @@index([createdAt])
}

model UploadBatch {
  id          String      @id @default(cuid())
  type        UploadType
  fileName    String
  uploadedBy  String
  uploader    User        @relation(fields: [uploadedBy], references: [id])
  totalRows   Int         @default(0)
  successRows Int         @default(0)
  failedRows  Int         @default(0)
  errorLog    Json?
  status      UploadStatus @default(PENDING)
  createdAt   DateTime    @default(now())
  completedAt DateTime?

  leads        Lead[]
  applications Application[]

  @@index([uploadedBy])
  @@index([status])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation("AuditUser", fields: [userId], references: [id])
  action    String   // USER_LOGIN, LEAD_CREATE, CAMPAIGN_DELETE, PII_EXPORT, ...
  entity    String
  entityId  String?
  oldValue  Json?
  newValue  Json?
  ipAddress String?
  userAgent String?
  sessionId String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([entity, entityId])
  @@index([action])
  @@index([createdAt])
}

model SystemSetting {
  key       String   @id          // e.g. "sla.hot.days", "pii.export.roles"
  value     Json
  updatedBy String?
  updatedAt DateTime @updatedAt
  createdAt DateTime @default(now())
}

// =====================================================
// Enums
// =====================================================

enum Role {
  SUPER_ADMIN
  MANAGEMENT
  CIAC_ADMIN
  FACULTY_DEAN
  PROGRAMME_COORDINATOR
  STAFF
  REGISTRAR
  FINANCE
}

enum CampaignType {
  EDUCATION_FAIR
  UNIVERSITY_VISIT
  ROADSHOW
  ACADEMIC_COLLABORATION
  CONFERENCE
  AGENT_EVENT
  OTHER
}

enum CampaignStatus {
  PLANNED
  ONGOING
  COMPLETED
  CANCELLED
}

enum StudyLevel {
  BACHELOR
  MASTER
  PHD
  EXECUTIVE
  MOBILITY
}

enum LeadQuality {
  HOT
  WARM
  COLD
}

enum LeadStatus {
  NEW
  CONTACTED
  INTERESTED
  APPLIED
  OFFERED
  ENROLLED
  LOST
}

enum LeadSource {
  EVENT_FORM
  CSV_UPLOAD
  QR_CODE
  WEBSITE
  MANUAL_ENTRY
  AGENT_REFERRAL
  OTHER
}

enum FollowUpType {
  EMAIL
  WHATSAPP
  CALL
  MEETING
  BROCHURE_SENT
  APPLICATION_GUIDE_SENT
  OTHER
}

enum ApplicationStatus {
  APPLIED
  OFFERED
  REJECTED
  ENROLLED
  WITHDRAWN
}

enum OfferStatus {
  ISSUED
  ACCEPTED
  DECLINED
  EXPIRED
}

enum RevenueType {
  SELF_FUNDED
  SPONSORED
  PARTIAL_SCHOLARSHIP
  FULL_SCHOLARSHIP
  FEE_WAIVER
  NON_REVENUE_MOBILITY
}

enum RevenueBasis {
  FIRST_YEAR
  FULL_PROGRAMME
}

enum MergeStatus {
  PENDING
  MERGED
  NOT_DUPLICATE
  IGNORED
}

enum UploadType {
  LEADS
  APPLICATIONS
  OFFERS
  ENROLMENTS
  CAMPAIGN_COSTS
  TUITION_FEES
}

enum UploadStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## 8. SystemSetting — Default Keys

Seeded on first migration. Editable only by `SUPER_ADMIN`.

| Key | Default Value | Purpose |
|---|---|---|
| `sla.hot.days` | `1` | SLA for HOT leads (calendar days, MYT). |
| `sla.warm.days` | `3` | SLA for WARM leads. |
| `sla.cold.days` | `7` | SLA for COLD leads. |
| `sla.businessDaysOnly` | `false` | If true, weekends excluded. |
| `faculty_dean.umbrella_visibility` | `"linked_only"` | `"linked_only"` (only campaigns where faculty is in `CampaignFaculty`) or `"all_umbrella"` (also CIAC-only campaigns). |
| `pii.export.allowed_roles` | `["SUPER_ADMIN","CIAC_ADMIN"]` | Roles allowed to export passport/email/phone in CSV. |
| `pii.retention.years` | `5` | Auto-anonymize lead PII after N years of inactivity. |
| `notifications.daily_digest_time_myt` | `"09:00"` | Daily overdue digest send time. |
| `notifications.weekly_summary_day` | `"MONDAY"` | Day of week for weekly summary. |
| `roi.default_basis` | `"FIRST_YEAR"` | Default revenue basis for dashboards. |
| `auth.access_token_minutes` | `15` | JWT access token lifetime. |
| `auth.refresh_token_days` | `7` | Refresh token lifetime. |
| `auth.login_rate_limit` | `{"attempts":5,"windowMinutes":5}` | Per-IP login rate limit. |
| `metrics.refresh_cron` | `"0 2 * * *"` | Nightly campaign metric refresh (02:00 MYT). |

---

## 9. Indexing & Performance

Critical indexes (also see schema):

```text
Lead.status
Lead.assignedStaffId
Lead.email, Lead.phone, Lead.passportNumber  (for matching)
LeadCampaignTouch.campaignId
Application.leadId
Application.programmeId + applicationStatus
FollowUp.nextFollowUpDate
CampaignMetric.campaignId, metricDate
AuditLog.entity + entityId, AuditLog.createdAt
```

Dashboards read from `CampaignMetric`, never from raw joins:

- Refresh trigger 1: after CSV/Excel upload completes.
- Refresh trigger 2: after enrolment / cost write.
- Refresh trigger 3: nightly cron (02:00 MYT) — full recompute for last 90 days.
- Refresh trigger 4: manual "Refresh metrics" button (CIAC_ADMIN+).

---

## 10. Business Logic Rules

### 10.1 Lead Identifier Rule (Zod)

```typescript
const leadSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  passportNumber: z.string().optional(),
  externalLeadId: z.string().optional(),
  // ...
}).refine(
  d => !!(d.email || d.phone || d.passportNumber || d.externalLeadId),
  { message: "Lead must have at least one of: email, phone, passport, externalLeadId." }
);
```

### 10.2 Application Matching Priority

1. Passport number exact match.
2. Email exact match (lowercased, trimmed).
3. Phone exact match (E.164 normalized).
4. `(name + countryId + programmeId)` fuzzy match (Postgres `pg_trgm`, similarity ≥ 0.85).
5. `Application.sourceCampaignId` attribution (last-resort).

If passport and email point to **different** leads → mark application `MATCH_CONFLICT` (status field on `UploadBatch.errorLog`) for admin review. Never auto-merge.

### 10.3 Overdue Follow-up Rule

```text
Read SLA_DAYS from SystemSetting:
  sla.hot.days, sla.warm.days, sla.cold.days

A lead is OVERDUE if:
  status IN (NEW, CONTACTED, INTERESTED) AND
  (
    (no follow-up exists AND now() − assignedAt > SLA_DAYS[leadQuality])
    OR
    (latestFollowUp.nextFollowUpDate IS NOT NULL AND latestFollowUp.nextFollowUpDate < now())
  )

Days are calendar days in MYT (UTC+8) unless sla.businessDaysOnly = true.
```

### 10.4 ROI Formulas

Single source of truth: `backend/src/services/roi.service.js`.

```text
// Revenue (per enrolment)
grossTuitionMyr   = enrolment.grossTuitionMyr           (already MYR)
scholarshipMyr    = enrolment.scholarshipMyr
netTuitionMyr     = grossTuitionMyr - scholarshipMyr

// Aggregations (per campaign)
firstYearRevenueMyr     = Σ (netTuitionMyr where revenueBasis = FIRST_YEAR)
fullProgrammeRevenueMyr = Σ (netTuitionMyr where revenueBasis = FULL_PROGRAMME)

// Spend
campaignSpendMyr = Σ campaignCosts.amountMyr

// Funnel
costPerLeadMyr            = safeDiv(campaignSpendMyr, totalLeads)
costPerEnrolledStudentMyr = safeDiv(campaignSpendMyr, totalEnrolments)
conversionRate            = safeDiv(totalEnrolments, totalLeads) × 100

// ROI (default management report shows BOTH)
roiRatio_firstYear      = safeDiv(firstYearRevenueMyr, campaignSpendMyr)
roiPercent_firstYear    = safeDiv(firstYearRevenueMyr - campaignSpendMyr, campaignSpendMyr) × 100
roiRatio_fullProgramme  = safeDiv(fullProgrammeRevenueMyr, campaignSpendMyr)
roiPercent_fullProgramme= safeDiv(fullProgrammeRevenueMyr - campaignSpendMyr, campaignSpendMyr) × 100

safeDiv(a, b) = (b == 0) ? 0 : a / b
```

### 10.5 Currency / FX Rule

Every `CampaignCost` row stores:

- `originalAmount` + `currencyId` (e.g. 30,000,000 IDR)
- `fxRateToMyr` (e.g. 0.000287)
- `amountMyr` = `originalAmount × fxRateToMyr` (computed at write time, frozen)

On display:

- Reports always sum `amountMyr` (frozen historical value).
- Detailed view shows original + rate + date.

If `currency = MYR`, FX rate = 1 and `amountMyr = originalAmount`.

### 10.6 Soft-Delete Rule

`Campaign`, `Lead`, `Application`, `User` use `deletedAt`. All Prisma queries must filter `deletedAt: null` by default. Use a Prisma middleware to enforce this globally; bypass requires an explicit `includeDeleted: true` flag (admin reports only).

### 10.7 PII Export Rule

```text
Allowed roles read from SystemSetting key `pii.export.allowed_roles`.
Every PII export creates an AuditLog with action="PII_EXPORT" and the exported entityIds in newValue.
```

### 10.8 Manual Attribution Rule

When auto-matching fails, an admin can mark an enrolment as belonging to a campaign by setting `Enrolment.manualAttributionCampaignId`. ROI dashboards include both `LeadCampaignTouch`-attributed and manually-attributed enrolments.

### 10.9 Data Retention Rule

Cron job runs monthly:

```text
For each Lead where (now() - latestActivity) > pii.retention.years:
  UPDATE leads SET
    fullName = 'REDACTED',
    email = NULL,
    phone = NULL,
    passportNumber = NULL,
    notes = NULL,
    deletedAt = now()
  WHERE id = ...
```

Aggregate counts and conversion data remain. Audit log records every redaction.

---

## 11. API Design

### 11.1 Auth

```text
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/change-password
GET  /api/auth/me
```

### 11.2 Master Data

```text
GET    /api/countries              POST /api/countries          PATCH /api/countries/:id
GET    /api/faculties              POST /api/faculties          PATCH /api/faculties/:id
GET    /api/programmes             POST /api/programmes         PATCH /api/programmes/:id
GET    /api/currencies             POST /api/currencies
GET    /api/fx-rates               POST /api/fx-rates
GET    /api/tuition-fees           POST /api/tuition-fees       PATCH /api/tuition-fees/:id
GET    /api/scholarships           POST /api/scholarships
GET    /api/sponsors               POST /api/sponsors
```

### 11.3 Campaign

```text
GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/:id
PATCH  /api/campaigns/:id
DELETE /api/campaigns/:id          // soft delete
POST   /api/campaigns/:id/countries
POST   /api/campaigns/:id/faculties
POST   /api/campaigns/:id/programmes
GET    /api/campaigns/:id/performance
GET    /api/campaigns/:id/metrics?from=&to=
POST   /api/campaigns/:id/refresh-metrics
GET    /api/campaigns/:id/costs
POST   /api/campaigns/:id/costs
```

### 11.4 Lead

```text
GET    /api/leads
POST   /api/leads
GET    /api/leads/:id
PATCH  /api/leads/:id
DELETE /api/leads/:id              // soft delete
POST   /api/leads/upload           // CSV/Excel
POST   /api/leads/:id/assign
PATCH  /api/leads/:id/status
GET    /api/leads/:id/history
GET    /api/leads/duplicates
POST   /api/leads/merge
GET    /api/leads/export           // PII export, role-checked, audit-logged
```

### 11.5 Follow-up

```text
GET  /api/follow-ups
POST /api/follow-ups
GET  /api/follow-ups/overdue
GET  /api/leads/:leadId/follow-ups
```

### 11.6 Application / Offer / Enrolment

```text
GET  /api/applications
POST /api/applications/upload
POST /api/applications/match-leads
GET  /api/applications/unmatched
GET  /api/applications/match-conflicts
PATCH /api/applications/:id/resolve-conflict
POST /api/offers/upload
POST /api/enrolments/upload
PATCH /api/enrolments/:id/manual-attribution
```

### 11.7 Dashboard

```text
GET /api/dashboard/executive?from=&to=&country=&faculty=
GET /api/dashboard/faculty/:facultyId
GET /api/dashboard/staff/:staffId
GET /api/dashboard/country-performance
GET /api/dashboard/programme-performance
GET /api/dashboard/campaign-roi
GET /api/dashboard/recruitment-funnel
```

### 11.8 Settings & Audit

```text
GET   /api/settings
PATCH /api/settings/:key            // SUPER_ADMIN only
GET   /api/audit-logs?entity=&action=&from=&to=
GET   /api/upload-batches
GET   /api/upload-batches/:id
```

---

## 12. CSV / Excel Upload Strategy

1. Provide fixed templates on download:
   ```text
   /templates/lead_template.xlsx
   /templates/application_template.xlsx
   /templates/offer_template.xlsx
   /templates/enrolment_template.xlsx
   /templates/campaign_cost_template.xlsx
   ```
2. Also support manual column mapping for non-standard files (UI step before import).
3. Every upload creates an `UploadBatch` row → preview → confirm → import.
4. Validate every row with Zod; failed rows go into `UploadBatch.errorLog`.
5. Refresh `CampaignMetric` after import success.

---

## 13. Notifications

| Event | Channel | Frequency |
|---|---|---|
| Lead assigned to me | In-app | Immediate |
| Lead overdue | In-app + email digest | Daily 09:00 MYT |
| Weekly campaign summary | Email | Monday 09:00 MYT |
| Match conflict detected | In-app | Immediate (CIAC_ADMIN) |
| Upload batch completed | In-app | Immediate (uploader) |
| Password reset | Email | On request |

Email templates stored in `backend/src/templates/email/*.hbs`. Template manager UI is V2.

---

## 14. Frontend Structure

```text
frontend/src/
  components/
    layout/        Sidebar, Header, ProtectedRoute, BrandLogo
    dashboard/     StatCard, FunnelChart, RoiChart, CountryChart
    forms/         CampaignForm, LeadForm, FollowUpForm, UploadForm
    tables/        LeadTable, CampaignTable, AuditTable
    upload/        UploadDropzone, ColumnMapper, BatchPreview
  pages/
    LoginPage.jsx
    ForgotPasswordPage.jsx
    ResetPasswordPage.jsx
    DashboardPage.jsx
    CampaignListPage.jsx
    CampaignDetailPage.jsx
    LeadListPage.jsx
    LeadDetailPage.jsx
    DuplicateLeadsPage.jsx
    MatchConflictsPage.jsx
    ApplicationUploadPage.jsx
    ReportsPage.jsx
    MasterDataPage.jsx
    UserManagementPage.jsx
    SettingsPage.jsx
    AuditLogPage.jsx
  services/
    api.js            // axios + token refresh interceptor
    authService.js
    campaignService.js
    leadService.js
    dashboardService.js
    uploadService.js
  hooks/
    useAuth.js
    useCampaigns.js
    useDashboard.js
    usePermissions.js
  utils/
    formatCurrency.js
    formatDateMYT.js
    calculateROI.js
    permissions.js
  store/
    auth.store.js     // Zustand, access token in memory
```

---

## 15. Backend Structure

```text
backend/src/
  config/           db.js, env.js, redis.js
  controllers/      one per resource
  middleware/       auth, role, error, rateLimit, audit, csrf
  routes/           one per resource
  services/
    auth.service.js
    campaign.service.js
    lead.service.js
    dedupe.service.js
    matching.service.js
    roi.service.js          // single source of truth for ROI math
    metrics.service.js
    upload.service.js
    notification.service.js
    setting.service.js
    retention.service.js
  jobs/
    refreshMetrics.job.js   // BullMQ, cron 02:00 MYT
    overdueDigest.job.js    // BullMQ, cron 09:00 MYT
    weeklySummary.job.js    // BullMQ, Mondays 09:00 MYT
    piiRetention.job.js     // BullMQ, monthly
  validators/         lead.schema, campaign.schema, upload.schema
  utils/              time.js, currency.js, audit.js, password.js, token.js
  templates/email/    overdue.hbs, weeklySummary.hbs, passwordReset.hbs, leadAssigned.hbs
  prisma/             schema.prisma, seed.ts, migrations/
  app.js
  server.js
```

---

## 16. Security & Governance

### 16.1 Auth security

- bcrypt (12 rounds) or Argon2id for `passwordHash`.
- Access token: JWT, 15 min, in memory only.
- Refresh token: 7 days, hashed in DB (`RefreshToken.tokenHash`), HTTP-only secure cookie.
- Refresh rotation: every refresh issues a new token and invalidates the old one.
- Logout-everywhere: revoke all `RefreshToken` rows for that user.
- Login rate limit: **5 attempts per 5 minutes per IP** (configurable in `SystemSetting`).
- Forgot-password rate limit: 3 per hour per email.

### 16.2 CSRF

- Refresh token cookie has `SameSite=Lax`.
- For mutating endpoints called via cookie auth, use **double-submit cookie pattern**: server sets a `X-CSRF-Token` cookie + frontend echoes it as a header.
- Pure JWT-bearer endpoints (access token in `Authorization` header) don't need CSRF.

### 16.3 Validation & uploads

- All request bodies validated via Zod.
- File upload limits: `.xlsx` and `.csv` only, max 10 MB.
- Virus scan (ClamAV) optional for V1, recommended for V2.

### 16.4 Audit

- Every write to `User`, `Campaign`, `Lead`, `Application`, `SystemSetting`, every `PII_EXPORT`, every login (success + failure) → `AuditLog`.
- Includes IP, user agent, session id.

### 16.5 PDPA / privacy

- Privacy notice at lead capture form ("By submitting, you agree...").
- PII access restricted via `pii.export.allowed_roles`.
- Auto-redaction after `pii.retention.years` (default 5).

### 16.6 Backup & restore

```text
Daily backup retained 30 days.
Monthly backup retained 12 months.
Restore drill before production launch + every 6 months.
Backups stored in encrypted off-site storage.
```

### 16.7 Time zone

```text
All DB timestamps: UTC.
All UI rendering: MYT (UTC+8) using formatDateMYT util.
All cron schedules: defined in MYT, converted to server TZ at runtime.
```

---

## 17. Environment Variables

### Backend `.env`

```env
# Database
DATABASE_URL="postgresql://ilead_user:password@localhost:5432/ilead_db"

# Server
PORT=4016
NODE_ENV="production"
FRONTEND_URL="https://ilead.uum.edu.my"
TIMEZONE="Asia/Kuala_Lumpur"

# Auth
JWT_ACCESS_SECRET="change_me_64_random_chars"
JWT_REFRESH_SECRET="change_me_64_random_chars"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Email
SMTP_HOST="smtp.office365.com"
SMTP_PORT=587
SMTP_USER="no-reply@uum.edu.my"
SMTP_PASS="app_password"
EMAIL_FROM="iLead <no-reply@uum.edu.my>"

# Redis (for BullMQ jobs)
REDIS_URL="redis://localhost:6379/0"

# Defaults (overridden by SystemSetting)
DEFAULT_FOLLOWUP_SLA_DAYS=3
```

### Frontend `.env`

```env
VITE_API_BASE_URL="https://ilead.uum.edu.my/api"
VITE_APP_TIMEZONE="Asia/Kuala_Lumpur"
VITE_APP_NAME="iLead"
```

---

## 18. Seed Strategy (`prisma/seed.ts`)

Generates realistic fake data for solo development without real student PII.

```text
Master data:
  - 8 countries (Indonesia, China, Vietnam, Bangladesh, Thailand, Pakistan, Nigeria, India)
  - 5 faculties (SOC, OYAGSB, COB, COLGIS, SBM)
  - 25 programmes across faculties
  - Currencies: MYR, USD, IDR, CNY, EUR
  - FX rates for last 12 months
  - 30 tuition fees
  - 5 scholarships, 5 sponsors

Users:
  - 1 SUPER_ADMIN
  - 2 MANAGEMENT
  - 3 CIAC_ADMIN
  - 5 FACULTY_DEAN (one per faculty)
  - 10 STAFF
  - 1 REGISTRAR, 1 FINANCE
  Default password: "iLead2026!" (forced reset on first login)

Campaigns:
  - 10 campaigns over the past 18 months
  - 3 multi-faculty umbrella campaigns
  - 2 high-ROI campaigns (positive)
  - 2 low-ROI campaigns (negative)
  - 1 scholarship-heavy campaign
  - Costs in mixed currencies

Leads:
  - 50–200 per campaign
  - Some leads appear in 2+ campaigns (LeadCampaignTouch)
  - Mix of HOT/WARM/COLD
  - Sources varied (EVENT_FORM, CSV_UPLOAD, QR_CODE, ...)

Funnel:
  - 30% leads → application
  - 60% applications → offer
  - 50% offers → enrolment
  - 20% of enrolments are scholarship/sponsored

Outcomes:
  - 20 MoUs/MoAs
  - 15 mobility records
  - 10 academic peers
  - 5 executive programme income entries

Settings: all default SystemSetting keys seeded.
```

Run via `npm run seed` → `prisma db seed`.

---

## 19. Indexing Performance Targets

| Operation | Target |
|---|---|
| Dashboard load (executive) | < 800 ms |
| Lead list (50 rows, paginated) | < 300 ms |
| CSV upload validation (1000 rows) | < 5 s |
| Campaign metric refresh (1 campaign) | < 2 s |
| Match-leads job (1000 applications) | < 30 s |

Use server-side pagination everywhere (default page size 50).

---

## 20. Branding (UUM)

To be confirmed by UUM Comms. Defaults if not provided:

| Token | Value (placeholder) |
|---|---|
| Primary | `#005A9C` (UUM blue placeholder) |
| Secondary | `#F4A300` (UUM amber placeholder) |
| Background | `#F8FAFC` |
| Heading font | `"Poppins", system-ui, sans-serif` |
| Body font | `"Inter", system-ui, sans-serif` |
| Logo | `frontend/src/assets/uum-logo.svg` |
| Favicon | `frontend/public/favicon.svg` |

> ACTION: Get the UUM brand pack (logo SVG, hex codes, fonts) from UUM Comms before week 2.

---

## 21. Delivery Plan

### Stage 1 — V1 MVP (14 weeks)

| Phase | Weeks | Output |
|---|---|---|
| 1. Setup | 1–2 | Repo, Prisma init, schema migrate, seed, auth scaffolding. |
| 2. Master data + campaigns | 3–4 | Country/Faculty/Programme/Currency CRUD; Campaign + join tables. |
| 3. Leads + follow-up | 5–6 | Lead CRUD, upload, dedup, follow-up, SLA, in-app notifications. |
| 4. Applications + matching | 7–8 | Application/Offer/Enrolment upload; matching engine; conflict review. |
| 5. ROI + metrics | 9–10 | `roi.service`, `CampaignMetric` refresh, daily snapshot job. |
| 6. Dashboards + reports | 11–12 | Executive, faculty, operational dashboards + exports. |
| 7. Hardening | 13 | UAT, bug fixes, audit log, retention job. |
| 8. Deploy | 14 | Nginx + PM2 + SSL on `ilead.uum.edu.my`; restore drill; training. |

### Stage 2 — V2 (post-V1)

- UUM Microsoft Entra SSO.
- SIS read-only API integration.
- WhatsApp follow-up integration.
- Email template manager UI.
- AI lead-quality scoring.
- Metabase / Power BI add-on.
- PWA offline.

---

## 22. Pre-Migration Checklist (BEFORE `prisma migrate dev`)

- [ ] Stakeholders sign off on the 7 locked decisions in §0.
- [ ] UUM Comms provides brand pack (logo, hex, font).
- [ ] UUM IT confirms `ilead.uum.edu.my` DNS + SMTP credentials.
- [ ] CIAC provides 2–3 sample real campaign Excel files (for template mapping).
- [ ] Hosting decision confirmed (UUM internal vs external VPS) + PDPA review signed.
- [ ] `.env` secrets generated and stored in password manager.
- [ ] Backup destination provisioned + restore drill runbook drafted.

Once the above is green, run:

```bash
npx prisma migrate dev --name init
npm run seed
npm run dev
```

---

## 23. Testing Checklist

- [ ] Unit: ROI formulas (positive, negative, zero-spend, scholarship).
- [ ] Unit: SLA overdue calculation per quality.
- [ ] Unit: Currency FX conversion + frozen `amountMyr`.
- [ ] Integration: CSV upload with valid/invalid rows.
- [ ] Integration: Lead deduplication (exact + fuzzy + manual merge).
- [ ] Integration: Application matching (exact, fuzzy, conflict).
- [ ] E2E: Login → create campaign → upload leads → assign → follow up → upload applications → match → see ROI.
- [ ] Security: role permissions enforced for every endpoint.
- [ ] Security: PII export creates audit log.
- [ ] Performance: dashboard < 800 ms with 10k leads.
- [ ] Time zone: dates render in MYT, stored in UTC.
- [ ] Soft delete: deleted records hidden by default.
- [ ] Backup restore drill passes.

---

## 24. Final Recommendation

Build iLead in two stages:

```text
Stage 1 — V1 MVP:
  Master data → Campaign → Lead → Follow-up → Upload → Match → ROI → Dashboard

Stage 2 — V2 Production hardening:
  SSO → SIS API → WhatsApp → AI scoring → Advanced reporting
```

This keeps V1 achievable for a solo developer in 14 weeks while still solving the core business problem. Stage 2 work can be sequenced based on what UUM IT and CIAC ask for after V1 is live.
