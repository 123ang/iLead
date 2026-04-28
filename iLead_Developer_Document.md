# iLead Developer Document

**Project Name:** iLead  
**Full Name:** International Lead and Enrolment Analytics Dashboard  
**Purpose:** Track international student recruitment ROI from campaign to enrolment.

---

## 1. System Overview

iLead is a web-based dashboard system for managing international student recruitment campaigns and measuring campaign return on investment (ROI). The system tracks the full recruitment journey:

```text
Campaign -> Lead -> Follow-up -> Application -> Offer -> Enrolment -> Revenue -> ROI
```

The system is designed for UUM internationalisation activities, including overseas education fairs, academic collaboration visits, roadshows, agency engagement and partner-university recruitment campaigns.

---

## 2. Recommended Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite | Fast, modern, suitable for dashboard UI |
| Styling | Tailwind CSS | Clean and fast responsive design |
| UI Components | shadcn/ui | Professional components for admin dashboards |
| Charts | Recharts | Suitable for funnel, bar, line and pie charts |
| Data Fetching | TanStack Query | Good for server-state management and caching |
| Forms | React Hook Form + Zod | Clean validation and form handling |
| Backend | Node.js + Express.js | Simple and flexible REST API backend |
| Database | PostgreSQL | Strong relational database for reporting and analytics |
| ORM | Prisma | Clean schema management and type-safe queries |
| Authentication | JWT + HTTP-only refresh cookie | Suitable for web dashboard authentication |
| File Upload | Multer | CSV/Excel upload support |
| Excel Processing | xlsx | Read and parse uploaded Excel files |
| Deployment | Ubuntu VPS + Nginx + PM2 | Practical for institutional or VPS deployment |
| Email Notification | Zoho SMTP or Resend | Optional follow-up reminder emails |
| Export | ExcelJS + pdfmake | Excel/PDF report export |

**Final stack recommendation:**

```text
Frontend: React + Vite + Tailwind CSS + shadcn/ui + Recharts
Backend: Node.js + Express.js + Prisma
Database: PostgreSQL
Authentication: JWT + role-based access control
Deployment: Ubuntu VPS + Nginx + PM2
```

---

## 3. User Roles and Permissions

| Role | Permissions |
|---|---|
| SUPER_ADMIN | Full access to all settings, users, data and reports |
| MANAGEMENT | View executive dashboards and reports only |
| CIAC_ADMIN | Manage campaigns, leads, follow-ups and reports |
| FACULTY_DEAN | View faculty-level data and programme performance |
| STAFF | Add leads, update assigned leads and record follow-ups |
| REGISTRAR | Upload application, offer and enrolment data |
| FINANCE | Upload budget and actual spending data |

---

## 4. Main Modules

### 4.1 Authentication Module

Functions:

- Login
- Logout
- Refresh token
- Change password
- Role-based route protection
- User session validation

API routes:

```http
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
POST /api/auth/change-password
```

### 4.2 Campaign Management Module

Purpose: Register and manage international recruitment campaigns.

| Field | Type | Example |
|---|---|---|
| name | string | Jakarta AUN-BE Campaign 2025 |
| country | string | Indonesia |
| city | string | Jakarta |
| campaignType | enum | EDUCATION_FAIR |
| startDate | date | 2025-01-12 |
| endDate | date | 2025-01-18 |
| facultyId | FK | SOC / OYAGSB |
| objective | text | Recruit postgraduate students |
| approvedBudget | decimal | 21245.00 |
| actualSpend | decimal | 21000.00 |
| status | enum | PLANNED / ONGOING / COMPLETED |

API routes:

```http
GET    /api/campaigns
POST   /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id
GET    /api/campaigns/:id/performance
GET    /api/campaigns/:id/roi
```

### 4.3 Lead Capture Module

Purpose: Capture prospective student information during or after a campaign.

| Field | Type | Example |
|---|---|---|
| fullName | string | Ahmad Faris |
| email | string | ahmad@email.com |
| phone | string | +628xxxx |
| country | string | Indonesia |
| city | string | Bandung |
| interestedProgramme | string | PhD Management |
| studyLevel | enum | MASTER / PHD |
| campaignId | FK | Linked campaign |
| leadQuality | enum | HOT / WARM / COLD |
| status | enum | NEW / CONTACTED / INTERESTED / APPLIED / OFFERED / ENROLLED / LOST |
| assignedStaffId | FK | Staff user ID |
| notes | text | Interested in scholarship |

API routes:

```http
GET    /api/leads
POST   /api/leads
GET    /api/leads/:id
PUT    /api/leads/:id
DELETE /api/leads/:id
POST   /api/leads/upload
POST   /api/leads/:id/assign
PUT    /api/leads/:id/status
```

### 4.4 Follow-Up Module

Purpose: Track staff communication with prospective students.

| Field | Type | Example |
|---|---|---|
| leadId | FK | Lead ID |
| staffId | FK | Staff user ID |
| followUpType | enum | WHATSAPP / EMAIL / CALL / MEETING |
| followUpDate | datetime | 2025-01-20 10:00 |
| nextFollowUpDate | date | 2025-01-27 |
| outcome | string | Student requested fee details |
| notes | text | Send scholarship information |

API routes:

```http
GET  /api/follow-ups
POST /api/follow-ups
GET  /api/follow-ups/overdue
GET  /api/leads/:leadId/follow-ups
```

### 4.5 Application Matching Module

Purpose: Match captured leads with applications, offers and enrolments.

Matching priority:

1. Exact email match
2. Exact phone match
3. Passport number match
4. Name + programme + country match
5. Source campaign field match
6. Manual review for uncertain matches

API routes:

```http
GET  /api/applications
POST /api/applications
POST /api/applications/upload
POST /api/applications/match-leads
GET  /api/applications/unmatched
```

### 4.6 ROI Dashboard Module

Dashboard cards:

- Total campaigns
- Total spend
- Total leads
- Total applications
- Total offers
- Total enrolments
- Cost per lead
- Cost per enrolled student
- Estimated tuition revenue
- ROI ratio
- ROI percentage

Charts:

- Recruitment funnel
- Leads by country
- Enrolments by country
- ROI by campaign
- ROI by faculty
- Cost per enrolled student by country
- Lead status breakdown
- Monthly recruitment trend

API routes:

```http
GET /api/dashboard/executive
GET /api/dashboard/faculty/:facultyId
GET /api/dashboard/staff/:staffId
GET /api/dashboard/country-performance
GET /api/dashboard/programme-performance
GET /api/dashboard/campaign-roi
GET /api/dashboard/recruitment-funnel
```

---

## 5. Metrics and Formulas

### 5.1 Recruitment Metrics

```js
totalLeads = count(leads)
totalApplications = count(applications)
totalOffers = count(applications where status == 'OFFERED')
totalEnrolments = count(applications where status == 'ENROLLED')

leadToApplicationRate = (totalApplications / totalLeads) * 100
applicationToOfferRate = (totalOffers / totalApplications) * 100
offerToEnrolmentRate = (totalEnrolments / totalOffers) * 100
overallConversionRate = (totalEnrolments / totalLeads) * 100
```

### 5.2 Financial Metrics

```js
campaignSpend = actualSpend || approvedBudget
costPerLead = campaignSpend / totalLeads
costPerApplication = campaignSpend / totalApplications
costPerOffer = campaignSpend / totalOffers
costPerEnrolledStudent = campaignSpend / totalEnrolments
estimatedTuitionRevenue = totalEnrolments * tuitionFee
netReturn = estimatedTuitionRevenue - campaignSpend
roiRatio = estimatedTuitionRevenue / campaignSpend
roiPercentage = (netReturn / campaignSpend) * 100
```

### 5.3 Safe Division Helper

```js
function safeDivide(numerator, denominator) {
  if (!denominator || denominator === 0) return 0;
  return numerator / denominator;
}
```

---

## 6. Database Design

### 6.1 Main Tables

```text
users
faculties
campaigns
campaign_targets
leads
follow_ups
applications
campaign_costs
tuition_fees
mous_moas
mobility_records
academic_peers
audit_logs
```

### 6.2 Prisma Schema Draft

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  role      Role
  facultyId String?
  faculty   Faculty? @relation(fields: [facultyId], references: [id])
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  assignedLeads Lead[]
  followUps     FollowUp[]
}

model Faculty {
  id        String   @id @default(cuid())
  name      String
  code      String   @unique
  createdAt DateTime @default(now())

  users     User[]
  campaigns Campaign[]
}

model Campaign {
  id             String         @id @default(cuid())
  name           String
  country        String
  city           String?
  campaignType   CampaignType
  startDate      DateTime
  endDate        DateTime
  facultyId      String?
  faculty        Faculty?       @relation(fields: [facultyId], references: [id])
  objective      String?
  approvedBudget Decimal        @default(0)
  actualSpend    Decimal        @default(0)
  status         CampaignStatus @default(PLANNED)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  targets        CampaignTarget?
  leads          Lead[]
  costs          CampaignCost[]
  mousMoas       MouMoa[]
  mobilityRecords MobilityRecord[]
  academicPeers  AcademicPeer[]
}

model CampaignTarget {
  id                  String   @id @default(cuid())
  campaignId          String   @unique
  campaign            Campaign @relation(fields: [campaignId], references: [id])
  targetLeads         Int      @default(0)
  targetApplications  Int      @default(0)
  targetOffers        Int      @default(0)
  targetEnrolments    Int      @default(0)
  targetMouMoa        Int      @default(0)
  targetMobility      Int      @default(0)
  targetAcademicPeers Int      @default(0)
}

model Lead {
  id                  String      @id @default(cuid())
  campaignId          String
  campaign            Campaign    @relation(fields: [campaignId], references: [id])
  fullName            String
  email               String?
  phone               String?
  country             String
  city                String?
  interestedProgramme String?
  studyLevel          StudyLevel?
  leadQuality         LeadQuality @default(WARM)
  status              LeadStatus  @default(NEW)
  assignedStaffId     String?
  assignedStaff       User?       @relation(fields: [assignedStaffId], references: [id])
  notes               String?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  followUps           FollowUp[]
  application         Application?
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
}

model Application {
  id                String            @id @default(cuid())
  leadId            String?           @unique
  lead              Lead?             @relation(fields: [leadId], references: [id])
  applicantName     String
  email             String?
  phone             String?
  passportNumber    String?
  programmeApplied  String
  studyLevel        StudyLevel?
  applicationStatus ApplicationStatus @default(APPLIED)
  applicationDate   DateTime?
  offerDate         DateTime?
  enrolmentDate     DateTime?
  sourceCampaign    String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}

model CampaignCost {
  id          String   @id @default(cuid())
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  costType    String
  description String?
  amount      Decimal  @default(0)
  createdAt   DateTime @default(now())
}

model TuitionFee {
  id         String     @id @default(cuid())
  programme  String
  studyLevel StudyLevel
  amount     Decimal
  currency   String     @default("MYR")
  createdAt  DateTime   @default(now())
}

model MouMoa {
  id          String   @id @default(cuid())
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  institution String
  country     String
  type        String
  status      String
  signedDate  DateTime?
}

model MobilityRecord {
  id           String   @id @default(cuid())
  campaignId   String
  campaign     Campaign @relation(fields: [campaignId], references: [id])
  institution  String
  country      String
  studentCount Int      @default(0)
  mobilityType String
}

model AcademicPeer {
  id          String   @id @default(cuid())
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  name        String
  institution String
  country     String
  email       String?
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  entity    String
  entityId  String?
  oldValue  Json?
  newValue  Json?
  createdAt DateTime @default(now())
}

enum Role {
  SUPER_ADMIN
  MANAGEMENT
  CIAC_ADMIN
  FACULTY_DEAN
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
}
```

---

## 7. Frontend Structure

```text
frontend/
  src/
    components/
      layout/
        Sidebar.jsx
        Header.jsx
        ProtectedRoute.jsx
      dashboard/
        StatCard.jsx
        FunnelChart.jsx
        RoiChart.jsx
        CountryChart.jsx
        ProgrammeChart.jsx
      forms/
        CampaignForm.jsx
        LeadForm.jsx
        FollowUpForm.jsx
        UploadForm.jsx
    pages/
      LoginPage.jsx
      DashboardPage.jsx
      CampaignListPage.jsx
      CampaignDetailPage.jsx
      LeadListPage.jsx
      LeadDetailPage.jsx
      FollowUpPage.jsx
      ApplicationUploadPage.jsx
      ReportsPage.jsx
      UserManagementPage.jsx
      SettingsPage.jsx
    services/
      api.js
      authService.js
      campaignService.js
      leadService.js
      dashboardService.js
    hooks/
      useAuth.js
      useCampaigns.js
      useDashboard.js
    utils/
      formatCurrency.js
      calculateROI.js
      permissions.js
    App.jsx
    main.jsx
```

---

## 8. Backend Structure

```text
backend/
  prisma/
    schema.prisma
    seed.js
  src/
    config/
      db.js
      env.js
    controllers/
      auth.controller.js
      user.controller.js
      campaign.controller.js
      lead.controller.js
      followup.controller.js
      application.controller.js
      dashboard.controller.js
    middleware/
      auth.middleware.js
      role.middleware.js
      error.middleware.js
    routes/
      auth.routes.js
      user.routes.js
      campaign.routes.js
      lead.routes.js
      followup.routes.js
      application.routes.js
      dashboard.routes.js
    services/
      auth.service.js
      campaign.service.js
      lead.service.js
      matching.service.js
      roi.service.js
      upload.service.js
    utils/
      password.js
      token.js
      response.js
    app.js
    server.js
```

---

## 9. Environment Variables

### Backend `.env`

```env
DATABASE_URL="postgresql://ilead_user:password@localhost:5432/ilead_db"
JWT_SECRET="replace_with_secure_secret"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="replace_with_refresh_secret"
REFRESH_TOKEN_EXPIRES_IN="7d"
PORT=3003
FRONTEND_URL="https://yourdomain.com"
SMTP_HOST="smtp.zoho.com"
SMTP_PORT=465
SMTP_USER="your_email@domain.com"
SMTP_PASS="your_app_password"
```

### Frontend `.env`

```env
VITE_API_BASE_URL="https://yourdomain.com/api"
```

---

## 10. Security Requirements

- Use bcrypt for password hashing.
- Store JWT refresh token in HTTP-only cookie.
- Apply role-based access control for all protected routes.
- Validate all API inputs using Zod.
- Validate file type and size for Excel/CSV uploads.
- Use Prisma to reduce SQL injection risk.
- Enable HTTPS with SSL certificate.
- Use audit logs for sensitive changes.
- Restrict student personal data based on user role.
- Back up PostgreSQL database daily.

---

## 11. MVP Scope

### Version 1.0

- Login and role-based access
- Campaign management
- Lead capture form
- Excel/CSV lead upload
- Lead assignment
- Follow-up tracking
- Application/enrolment upload
- Basic lead matching
- ROI calculation engine
- Executive dashboard
- Campaign performance report

### Version 2.0

- SIS integration
- Email reminder automation
- WhatsApp integration
- QR code lead capture
- AI-based lead quality prediction
- Enrolment forecasting
- PDF report generation
- Advanced Power BI / Metabase integration

---

## 12. Development Timeline

| Phase | Duration | Main Tasks |
|---|---:|---|
| Phase 1 | Week 1-2 | Requirement confirmation, database design, UI wireframe |
| Phase 2 | Week 3-4 | Backend setup, authentication and roles |
| Phase 3 | Week 5-6 | Campaign and lead modules |
| Phase 4 | Week 7-8 | Follow-up and upload modules |
| Phase 5 | Week 9-10 | Application matching and ROI engine |
| Phase 6 | Week 11-12 | Dashboard charts and report pages |
| Phase 7 | Week 13 | Testing, bug fixing and validation |
| Phase 8 | Week 14 | Deployment, training and documentation |

---

## 13. Developer Notes

- Build the MVP using manual CSV/Excel upload before attempting SIS integration.
- Use TanStack Query for all data-fetching and cache invalidation.
- Keep ROI formulas in a backend service to ensure one source of truth.
- Add indexes on `campaignId`, `email`, `phone`, `country`, `facultyId` and `applicationStatus`.
- Use server-side pagination for lead and application lists.
- All dashboard numbers should support filters by date range, country, faculty, programme and campaign type.
- Avoid deleting important records. Prefer soft delete with `deletedAt` for campaigns and leads.

---

## 14. First Build Priority

Start with this minimum flow:

```text
Create Campaign -> Add Leads -> Assign Staff -> Add Follow-up -> Upload Applications -> Match Leads -> Calculate ROI -> Show Dashboard
```

This flow is enough to prove the system value before expanding into advanced integrations.
