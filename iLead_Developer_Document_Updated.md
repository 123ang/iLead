# iLead Developer Document

## International Lead and Recruitment ROI Dashboard

**Project Name:** iLead  
**Frontend:** React + Vite  
**Backend:** Node.js + Express.js  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Deployment:** Ubuntu VPS or UUM internal server with Nginx + PM2  
**Document Version:** 2.0 refined schema and delivery scope

---

## 1. Project Overview

iLead is a web-based dashboard system for tracking UUM's international student recruitment campaigns and calculating return on investment (ROI). The system tracks the full funnel:

```text
Campaign -> Lead -> Follow-up -> Application -> Offer -> Enrolment -> Revenue -> ROI
```

The system must support international campaign complexity, including multi-country events, CIAC umbrella campaigns, multiple faculties, multiple programmes, currency conversion, scholarship-adjusted tuition revenue, and duplicate leads across events.

---

## 2. Recommended Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite | Fast SPA development. |
| Styling | Tailwind CSS | Clean dashboard UI. |
| UI Library | shadcn/ui | Professional tables, cards, forms, dialogs. |
| Charts | Recharts | Funnel, bar, line, pie, and country comparison charts. |
| State/Data Fetching | TanStack Query | API caching and dashboard refetching. |
| Forms | React Hook Form + Zod | Strong validation for identifiers and uploads. |
| Backend | Node.js + Express.js | REST API. |
| ORM | Prisma | Type-safe database access. |
| Database | PostgreSQL | Relational data and reporting. |
| Authentication | JWT access token + HTTP-only refresh cookie | Access token stored in memory only. |
| Uploads | Multer + xlsx/csv-parse | Excel/CSV templates and validation. |
| Email | Nodemailer with Zoho SMTP / Microsoft SMTP | Reminder and notification emails. |
| Jobs | node-cron or BullMQ + Redis | Metrics refresh and scheduled notifications. |
| Deployment | Nginx + PM2 | Reverse proxy and process management. |
| Optional BI | Metabase | Future advanced analytics. |
| Optional SSO | Microsoft Entra ID / UUM SSO | Recommended for production. |

---

## 3. Core Design Principles

1. Avoid free-text master data for countries, programmes, and faculties.
2. Support campaigns involving multiple faculties and programmes.
3. Store original currency and MYR equivalent for all campaign costs.
4. Use soft delete for key records.
5. Use a campaign_metrics summary table for dashboard speed.
6. Store timestamps in UTC and render in Malaysia Time (MYT / UTC+8).
7. Apply PDPA-aware access control and audit logging.
8. Treat application matching as probabilistic/manual-review when identifiers conflict.

---

## 4. User Roles

| Role | Access |
|---|---|
| SUPER_ADMIN | Full system management. |
| MANAGEMENT | Executive dashboard and reports. |
| CIAC_ADMIN | Campaign, lead, master data, and report management. |
| FACULTY_DEAN | Faculty-linked dashboard and reports. |
| PROGRAMME_COORDINATOR | Programme-level leads and follow-up. |
| STAFF | Lead capture and assigned follow-up. |
| REGISTRAR | Application, offer, and enrolment upload/verification. |
| FINANCE | Campaign cost and FX data. |

---

## 5. System Modules

### 5.1 Authentication and User Management

Required features:

- Login.
- Logout.
- Refresh token.
- Forgot password.
- Reset password.
- Change password.
- Role-based access control.
- Optional SSO integration readiness.

Recommended token strategy:

- Refresh token: HTTP-only, secure cookie.
- Access token: returned in response body and stored in frontend memory only.
- Do not store access token in localStorage.

### 5.2 Master Data Module

Required master tables:

- Country.
- Faculty.
- Programme.
- CampaignType.
- Currency.
- FXRate.
- TuitionFee.
- ScholarshipType.
- SponsorType.

This prevents spelling inconsistency such as `Indonesia`, `Indonesian Republic`, and `Republic of Indonesia` breaking dashboard aggregation.

### 5.3 Campaign Management Module

A campaign can involve multiple countries, faculties, and programmes. Campaign should not only have one faculty.

Required join tables:

- CampaignCountry.
- CampaignFaculty.
- CampaignProgramme.

### 5.4 Lead Capture Module

Lead email and phone can be nullable in the database, but the API must enforce at least one identifier.

Validation rule:

```text
A lead must have at least one of: email, phone, passportNumber, externalLeadId.
```

### 5.5 Lead Deduplication Module

Deduplication should detect leads captured at multiple events.

Suggested rule:

- Exact email match = high-confidence duplicate.
- Exact phone match = high-confidence duplicate.
- Passport match = high-confidence duplicate.
- Same name + same country + same programme = possible duplicate.

Handling options:

1. Keep primary Lead record.
2. Link multiple LeadCampaignTouch records to show the student appeared in more than one campaign.
3. Manual merge queue for uncertain matches.

### 5.6 Follow-up and Notification Module

Overdue rule:

- `nextFollowUpDate < now`, OR
- `status = NEW` and no follow-up after default SLA, e.g. 3 days.

Notification channels:

- In-app notification.
- Email reminder.
- Daily digest for staff.
- Weekly summary for CIAC admin.

### 5.7 Application and Enrolment Module

A lead can apply to multiple programmes. Therefore, `Application.leadId` must not be unique.

Use either:

- non-unique `Application.leadId`, or
- a `LeadApplication` join table.

Recommended for simplicity:

```text
Application.leadId = nullable non-unique foreign key
```

### 5.8 Campaign Outcome Module

Some outcomes may not belong to a campaign. Therefore, `MouMoa`, `MobilityRecord`, and `AcademicPeer` should allow nullable campaignId.

This supports non-campaign visits and general institutional activities.

### 5.9 ROI and Metrics Module

Revenue should support:

- first-year tuition;
- full-programme tuition;
- net revenue after scholarship;
- sponsored students;
- fee waiver or non-revenue mobility.

### 5.10 Reporting Module

Reports:

- Campaign ROI report.
- Country performance report.
- Faculty performance report.
- Programme conversion report.
- Follow-up SLA report.
- Duplicate lead report.
- Scholarship-adjusted revenue report.

---

## 6. Refined Database Schema

### 6.1 Main Tables

```text
users
faculties
countries
programmes
currencies
fx_rates
campaigns
campaign_countries
campaign_faculties
campaign_programmes
leads
lead_campaign_touches
lead_merge_candidates
follow_ups
applications
offers
enrolments
campaign_costs
tuition_fees
scholarships
sponsors
mou_moas
mobility_records
academic_peers
campaign_metrics
notifications
audit_logs
```

---

## 7. Prisma Schema Draft

```prisma
model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String?
  role         Role
  facultyId    String?
  faculty      Faculty? @relation(fields: [facultyId], references: [id])
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  deletedAt    DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  assignedLeads Lead[]
  followUps     FollowUp[]
}

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
  id        String     @id @default(cuid())
  name      String
  code      String?    @unique
  facultyId String?
  faculty   Faculty?   @relation(fields: [facultyId], references: [id])
  studyLevel StudyLevel
  durationYears Decimal @default(1)
  isActive Boolean     @default(true)
  createdAt DateTime   @default(now())

  campaignProgrammes CampaignProgramme[]
  tuitionFees        TuitionFee[]
  leads              Lead[]
  applications       Application[]
}

model Currency {
  id        String   @id @default(cuid())
  code      String   @unique // MYR, USD, IDR, EUR, JPY
  name      String
  symbol    String?
  createdAt DateTime @default(now())

  fxRates      FXRate[]
  campaignCosts CampaignCost[]
}

model FXRate {
  id             String   @id @default(cuid())
  currencyId     String
  currency       Currency @relation(fields: [currencyId], references: [id])
  rateToMyr      Decimal
  rateDate       DateTime
  source         String?
  createdAt      DateTime @default(now())

  @@unique([currencyId, rateDate])
}

model Campaign {
  id              String         @id @default(cuid())
  name            String
  campaignType    CampaignType
  startDate       DateTime
  endDate         DateTime
  objective       String?
  status          CampaignStatus @default(PLANNED)
  approvedBudgetMyr Decimal      @default(0)
  actualSpendMyr    Decimal      @default(0)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?

  countries       CampaignCountry[]
  faculties       CampaignFaculty[]
  programmes      CampaignProgramme[]
  leadTouches     LeadCampaignTouch[]
  costs           CampaignCost[]
  metrics         CampaignMetric[]
  mousMoas        MouMoa[]
  mobilityRecords MobilityRecord[]
  academicPeers   AcademicPeer[]
}

model CampaignCountry {
  campaignId String
  countryId  String
  campaign   Campaign @relation(fields: [campaignId], references: [id])
  country    Country  @relation(fields: [countryId], references: [id])

  @@id([campaignId, countryId])
}

model CampaignFaculty {
  campaignId String
  facultyId  String
  campaign   Campaign @relation(fields: [campaignId], references: [id])
  faculty    Faculty  @relation(fields: [facultyId], references: [id])

  @@id([campaignId, facultyId])
}

model CampaignProgramme {
  campaignId  String
  programmeId String
  campaign    Campaign  @relation(fields: [campaignId], references: [id])
  programme   Programme @relation(fields: [programmeId], references: [id])

  @@id([campaignId, programmeId])
}

model Lead {
  id                  String      @id @default(cuid())
  fullName            String
  email               String?
  phone               String?
  passportNumber      String?
  externalLeadId      String?
  countryId           String?
  country             Country?    @relation(fields: [countryId], references: [id])
  interestedProgrammeId String?
  interestedProgramme   Programme? @relation(fields: [interestedProgrammeId], references: [id])
  studyLevel          StudyLevel?
  leadQuality         LeadQuality @default(WARM)
  status              LeadStatus  @default(NEW)
  assignedStaffId     String?
  assignedStaff       User?       @relation(fields: [assignedStaffId], references: [id])
  notes               String?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
  deletedAt           DateTime?

  touches             LeadCampaignTouch[]
  followUps           FollowUp[]
  applications        Application[]
}

model LeadCampaignTouch {
  id          String   @id @default(cuid())
  leadId      String
  lead        Lead     @relation(fields: [leadId], references: [id])
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  capturedAt  DateTime @default(now())
  sourceNote  String?

  @@unique([leadId, campaignId])
  @@index([campaignId])
  @@index([leadId])
}

model LeadMergeCandidate {
  id          String   @id @default(cuid())
  leadAId     String
  leadBId     String
  confidence  Decimal
  reason      String
  status      MergeStatus @default(PENDING)
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime @default(now())

  @@index([status])
}

model FollowUp {
  id               String       @id @default(cuid())
  leadId           String
  lead             Lead         @relation(fields: [leadId], references: [id])
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
  programme         Programme?        @relation(fields: [programmeId], references: [id])
  applicationStatus ApplicationStatus @default(APPLIED)
  applicationDate   DateTime?
  sourceCampaignId  String?
  sourceRaw         String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  deletedAt         DateTime?

  offers            Offer[]
  enrolments        Enrolment[]

  @@index([leadId])
  @@index([programmeId, applicationStatus])
}

model Offer {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  offerDate     DateTime
  status        OfferStatus @default(ISSUED)
  createdAt     DateTime @default(now())
}

model Enrolment {
  id              String   @id @default(cuid())
  applicationId   String
  application     Application @relation(fields: [applicationId], references: [id])
  enrolmentDate   DateTime
  revenueType     RevenueType @default(SELF_FUNDED)
  scholarshipId   String?
  sponsorId       String?
  grossTuitionMyr Decimal @default(0)
  scholarshipMyr  Decimal @default(0)
  netTuitionMyr   Decimal @default(0)
  revenueBasis    RevenueBasis @default(FIRST_YEAR)
  createdAt       DateTime @default(now())

  @@index([enrolmentDate])
}

model CampaignCost {
  id             String   @id @default(cuid())
  campaignId     String
  campaign       Campaign @relation(fields: [campaignId], references: [id])
  costType       String
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
  id           String     @id @default(cuid())
  programmeId  String
  programme    Programme  @relation(fields: [programmeId], references: [id])
  studyLevel   StudyLevel
  annualFeeMyr Decimal
  fullProgrammeFeeMyr Decimal
  effectiveFrom DateTime
  effectiveTo   DateTime?
  createdAt    DateTime @default(now())
}

model Scholarship {
  id        String   @id @default(cuid())
  name      String
  type      String
  valueMyr  Decimal @default(0)
  isPercent Boolean @default(false)
  createdAt DateTime @default(now())
}

model Sponsor {
  id        String   @id @default(cuid())
  name      String
  countryId String?
  createdAt DateTime @default(now())
}

model MouMoa {
  id          String   @id @default(cuid())
  campaignId  String?
  campaign    Campaign? @relation(fields: [campaignId], references: [id])
  institution String
  countryId   String?
  type        String
  status      String
  signedDate  DateTime?
  createdAt   DateTime @default(now())
}

model MobilityRecord {
  id           String   @id @default(cuid())
  campaignId   String?
  campaign     Campaign? @relation(fields: [campaignId], references: [id])
  institution  String
  countryId    String?
  studentCount Int      @default(0)
  mobilityType String
  createdAt    DateTime @default(now())
}

model AcademicPeer {
  id          String   @id @default(cuid())
  campaignId  String?
  campaign    Campaign? @relation(fields: [campaignId], references: [id])
  name        String
  institution String
  countryId   String?
  email       String?
  createdAt   DateTime @default(now())
}

model CampaignMetric {
  id                       String   @id @default(cuid())
  campaignId               String
  campaign                 Campaign @relation(fields: [campaignId], references: [id])
  metricDate               DateTime @default(now())
  totalLeads               Int      @default(0)
  qualifiedLeads           Int      @default(0)
  totalApplications        Int      @default(0)
  totalOffers              Int      @default(0)
  totalEnrolments          Int      @default(0)
  campaignSpendMyr         Decimal  @default(0)
  firstYearRevenueMyr      Decimal  @default(0)
  fullProgrammeRevenueMyr  Decimal  @default(0)
  netRevenueMyr            Decimal  @default(0)
  costPerLeadMyr           Decimal  @default(0)
  costPerEnrolledStudentMyr Decimal @default(0)
  conversionRate           Decimal  @default(0)
  roiRatio                 Decimal  @default(0)
  roiPercentage            Decimal  @default(0)
  refreshedAt              DateTime @default(now())

  @@unique([campaignId, metricDate])
  @@index([campaignId])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  message   String
  type      String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
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
}

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
```

---

## 8. Indexing and Performance Plan

Important indexes:

```text
Lead.status
Lead.assignedStaffId
LeadCampaignTouch.campaignId
Application.leadId
Application.programmeId + applicationStatus
FollowUp.nextFollowUpDate
CampaignMetric.campaignId
AuditLog.entity + entityId
```

Dashboard should not calculate everything live from raw joins for every request. Use `campaign_metrics` as a summary table.

Refresh strategy:

- Refresh after upload.
- Refresh after enrolment update.
- Nightly scheduled refresh.
- Manual refresh button for admin.

---

## 9. Business Logic Rules

### 9.1 Lead Identifier Rule

At API/Zod level:

```typescript
email || phone || passportNumber || externalLeadId must be present
```

### 9.2 Application Matching Rule

Priority:

1. Passport number exact match.
2. Email exact match.
3. Phone exact match.
4. Name + country + programme fuzzy match.
5. Source campaign attribution.

If `Application.sourceCampaignId` conflicts with the linked lead campaign, mark as `MATCH_CONFLICT` for admin review.

### 9.3 Overdue Follow-up Rule

A lead is overdue if:

```text
nextFollowUpDate < now
OR
status = NEW and createdAt is older than SLA_DAYS, e.g. 3 days
```

### 9.4 ROI Rule

Default management report should show:

- Net first-year revenue ROI.
- Net full-programme revenue ROI.

Formula:

```text
Net Revenue = Gross Tuition - Scholarship / Fee Waiver
Net Return = Net Revenue - Campaign Spend MYR
ROI Ratio = Net Revenue / Campaign Spend MYR
ROI Percentage = Net Return / Campaign Spend MYR x 100
```

---

## 10. API Design

### 10.1 Auth API

```text
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

### 10.2 Master Data API

```text
GET /api/countries
POST /api/countries
GET /api/faculties
POST /api/faculties
GET /api/programmes
POST /api/programmes
GET /api/currencies
POST /api/fx-rates
GET /api/tuition-fees
POST /api/tuition-fees
```

### 10.3 Campaign API

```text
GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id        // soft delete
POST   /api/campaigns/:id/countries
POST   /api/campaigns/:id/faculties
POST   /api/campaigns/:id/programmes
GET    /api/campaigns/:id/performance
POST   /api/campaigns/:id/refresh-metrics
```

### 10.4 Lead API

```text
GET    /api/leads
POST   /api/leads
GET    /api/leads/:id
PUT    /api/leads/:id
DELETE /api/leads/:id            // soft delete
POST   /api/leads/upload
POST   /api/leads/:id/assign
PUT    /api/leads/:id/status
GET    /api/leads/duplicates
POST   /api/leads/merge
```

### 10.5 Follow-up API

```text
GET  /api/follow-ups
POST /api/follow-ups
GET  /api/follow-ups/overdue
GET  /api/leads/:leadId/follow-ups
```

### 10.6 Application and Enrolment API

```text
GET  /api/applications
POST /api/applications/upload
POST /api/applications/match-leads
GET  /api/applications/unmatched
POST /api/offers/upload
POST /api/enrolments/upload
```

### 10.7 Dashboard API

```text
GET /api/dashboard/executive
GET /api/dashboard/faculty/:facultyId
GET /api/dashboard/staff/:staffId
GET /api/dashboard/country-performance
GET /api/dashboard/programme-performance
GET /api/dashboard/campaign-roi
GET /api/dashboard/recruitment-funnel
```

---

## 11. CSV / Excel Upload Strategy

Recommended approach:

1. Provide fixed templates for leads, applications, offers, enrolments, campaign costs, and tuition fees.
2. Also support column mapping for different fair formats.
3. Validate every row before import.
4. Show preview before confirmation.
5. Store upload batch ID for audit and rollback.

Template examples:

```text
lead_template.xlsx
application_template.xlsx
offer_template.xlsx
enrolment_template.xlsx
campaign_cost_template.xlsx
```

---

## 12. Notifications

Channels:

- In-app notification.
- Email notification.

Frequency:

- Immediate when a lead is assigned.
- Daily digest for overdue follow-ups.
- Weekly campaign performance summary for CIAC admin.

Email templates should be stored in code for MVP. A template manager can be added in Version 2.

---

## 13. Frontend Structure

```text
frontend/src
  components/
    layout/
    dashboard/
    forms/
    tables/
    upload/
  pages/
    LoginPage.jsx
    ForgotPasswordPage.jsx
    DashboardPage.jsx
    CampaignListPage.jsx
    CampaignDetailPage.jsx
    LeadListPage.jsx
    LeadDetailPage.jsx
    DuplicateLeadsPage.jsx
    ApplicationUploadPage.jsx
    ReportsPage.jsx
    MasterDataPage.jsx
    UserManagementPage.jsx
    SettingsPage.jsx
  services/
    api.js
    authService.js
    campaignService.js
    leadService.js
    dashboardService.js
    uploadService.js
  hooks/
    useAuth.js
    useCampaigns.js
    useDashboard.js
  utils/
    formatCurrency.js
    formatDateMYT.js
    calculateROI.js
    permissions.js
```

---

## 14. Backend Structure

```text
backend/src
  config/
  controllers/
  middleware/
  routes/
  services/
    auth.service.js
    campaign.service.js
    lead.service.js
    dedupe.service.js
    matching.service.js
    roi.service.js
    metrics.service.js
    upload.service.js
    notification.service.js
  jobs/
    refreshMetrics.job.js
    overdueNotification.job.js
  validators/
    lead.schema.js
    campaign.schema.js
    upload.schema.js
  utils/
    time.js
    currency.js
    audit.js
  app.js
  server.js
```

---

## 15. Security and Governance

Required:

- HTTPS only.
- Password hashing with bcrypt or Argon2.
- Refresh token in HTTP-only secure cookie.
- Access token in memory only.
- CSRF protection if using cookies for protected routes.
- Rate limiting on auth endpoints.
- Zod validation.
- File upload type and size limits.
- Audit log with IP address, user agent, and session ID.
- Soft delete for Campaign, Lead, and Application.
- PDPA-aware privacy notice and restricted access to student PII.
- Daily backup and restore drill.

Backup policy:

```text
Daily backup retained for 30 days.
Monthly backup retained for 12 months.
Restore drill before production launch and every 6 months.
```

Time zone:

```text
Store all timestamps in UTC.
Render all UI dates in Malaysia Time (MYT / UTC+8).
```

---

## 16. Environment Variables

### Backend

```env
DATABASE_URL="postgresql://ilead_user:password@localhost:5432/ilead_db"
PORT=3003
NODE_ENV="production"
JWT_ACCESS_SECRET="change_me"
JWT_REFRESH_SECRET="change_me"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"
FRONTEND_URL="https://ilead.uum.edu.my"
SMTP_HOST="smtp.office365.com"
SMTP_PORT=587
SMTP_USER="no-reply@uum.edu.my"
SMTP_PASS="app_password"
DEFAULT_FOLLOWUP_SLA_DAYS=3
TIMEZONE="Asia/Kuala_Lumpur"
```

### Frontend

```env
VITE_API_BASE_URL="https://ilead.uum.edu.my/api"
VITE_APP_TIMEZONE="Asia/Kuala_Lumpur"
```

---

## 17. Delivery Scope

### Version 1 MVP

Must include:

- Login and user roles.
- Master data for country, faculty, programme, currency, tuition fee.
- Campaign management with many-to-many faculty and programme mapping.
- Lead capture and upload.
- Lead deduplication and merge queue.
- Follow-up tracking and overdue alerts.
- Application, offer, and enrolment upload.
- Campaign costs with currency and MYR equivalent.
- ROI calculation with scholarship-adjusted revenue.
- Campaign metrics summary table.
- Executive, faculty, and operational dashboards.
- Export reports.
- Audit log and soft delete.

### Version 2

- UUM SSO / Microsoft Entra ID.
- SIS direct integration.
- WhatsApp integration.
- Email template manager.
- AI lead scoring.
- Metabase / Power BI integration.
- Mobile app or PWA offline mode.

---

## 18. Delivery Risk Note

A 14-week timeline with RM30,000 is tight if the project includes all modules, dashboards, reports, matching, uploads, user roles, UAT, and deployment hardening. It is realistic only if:

1. One full-time developer is assigned.
2. Requirements are frozen early.
3. SIS integration is replaced by CSV upload for MVP.
4. SSO is moved to Version 2.
5. Advanced notification and AI features are moved to Version 2.

Recommended production timeline is 16 to 18 weeks.

---

## 19. Testing Checklist

- Unit tests for ROI formulas.
- Upload validation tests.
- Deduplication tests.
- Lead-to-application matching tests.
- Role permission tests.
- Dashboard metric accuracy tests.
- Time zone rendering tests.
- Soft delete tests.
- Audit log tests.
- Backup and restore test.

---

## 20. Final Recommendation

Build iLead in two stages:

```text
Stage 1: Research MVP
Campaign + Lead + Follow-up + Upload + Matching + ROI Dashboard

Stage 2: Production Hardening
SSO + SIS Integration + Advanced Reports + Automation + Governance Enhancements
```

This approach keeps the project achievable while still solving the main business problem.
