-- Expand scaffold schema toward the final iLead Phase 1 model.
-- This migration was prepared from the Prisma schema in-repo because the sandbox
-- environment could not provide a runnable local PostgreSQL instance for
-- `prisma migrate dev`.

BEGIN;

-- Enums
DO $$ BEGIN
  CREATE TYPE "OfferStatus" AS ENUM ('ISSUED', 'ACCEPTED', 'DECLINED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RevenueType" AS ENUM (
    'SELF_FUNDED',
    'SPONSORED',
    'PARTIAL_SCHOLARSHIP',
    'FULL_SCHOLARSHIP',
    'FEE_WAIVER',
    'NON_REVENUE_MOBILITY'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RevenueBasis" AS ENUM ('FIRST_YEAR', 'FULL_PROGRAMME');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MergeStatus" AS ENUM ('PENDING', 'MERGED', 'NOT_DUPLICATE', 'IGNORED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UploadType" AS ENUM ('LEADS', 'APPLICATIONS', 'OFFERS', 'ENROLMENTS', 'CAMPAIGN_COSTS', 'TUITION_FEES');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UploadRowStatus" AS ENUM ('PENDING', 'VALID', 'CREATED', 'MATCHED', 'FAILED', 'CONFLICT', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- LeadSource enum change
ALTER TYPE "LeadSource" RENAME TO "LeadSource_old";
CREATE TYPE "LeadSource" AS ENUM (
  'EVENT_FORM',
  'CSV_UPLOAD',
  'QR_CODE',
  'WEBSITE',
  'MANUAL_ENTRY',
  'AGENT_REFERRAL',
  'OTHER'
);
ALTER TABLE "Lead"
  ALTER COLUMN "source" TYPE "LeadSource"
  USING CASE
    WHEN "source"::text = 'AGENT' THEN 'AGENT_REFERRAL'::"LeadSource"
    WHEN "source"::text = 'REFERRAL' THEN 'OTHER'::"LeadSource"
    WHEN "source" IS NULL THEN NULL
    ELSE "source"::text::"LeadSource"
  END;
ALTER TABLE "LeadCampaignTouch"
  ALTER COLUMN "source" TYPE "LeadSource"
  USING CASE
    WHEN "source"::text = 'AGENT' THEN 'AGENT_REFERRAL'::"LeadSource"
    WHEN "source"::text = 'REFERRAL' THEN 'OTHER'::"LeadSource"
    ELSE "source"::text::"LeadSource"
  END;
DROP TYPE "LeadSource_old";

-- Auth and operational fields
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
ALTER TABLE "RefreshToken" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

-- Campaign, lead, application expansion
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "uploadBatchId" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "sourceRaw" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "uploadBatchId" TEXT;

-- Tuition / scholarship / sponsor alignment
ALTER TABLE "TuitionFee" ADD COLUMN IF NOT EXISTS "annualFeeMyr" DECIMAL(65,30);
ALTER TABLE "TuitionFee" ADD COLUMN IF NOT EXISTS "fullProgrammeFeeMyr" DECIMAL(65,30);
ALTER TABLE "TuitionFee" ADD COLUMN IF NOT EXISTS "effectiveFrom" TIMESTAMP(3);
ALTER TABLE "TuitionFee" ADD COLUMN IF NOT EXISTS "effectiveTo" TIMESTAMP(3);

ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS "valueMyr" DECIMAL(65,30);
ALTER TABLE "Scholarship" ADD COLUMN IF NOT EXISTS "isPercent" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Sponsor" ADD COLUMN IF NOT EXISTS "countryId" TEXT;
ALTER TABLE "Sponsor" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Non-recruitment outcome alignment
ALTER TABLE "MouMoa" ADD COLUMN IF NOT EXISTS "countryId" TEXT;
ALTER TABLE "MouMoa" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "MobilityRecord" ADD COLUMN IF NOT EXISTS "countryId" TEXT;
ALTER TABLE "MobilityRecord" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "AcademicPeer" ADD COLUMN IF NOT EXISTS "countryId" TEXT;
ALTER TABLE "AcademicPeer" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "MouMoa" DROP COLUMN IF EXISTS "country";
ALTER TABLE "MobilityRecord" DROP COLUMN IF EXISTS "country";
ALTER TABLE "AcademicPeer" DROP COLUMN IF EXISTS "country";

-- Campaign metrics alignment
ALTER TABLE "CampaignMetric" ADD COLUMN IF NOT EXISTS "qualifiedLeads" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CampaignMetric" ADD COLUMN IF NOT EXISTS "firstYearRevenueMyr" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "CampaignMetric" ADD COLUMN IF NOT EXISTS "fullProgrammeRevenueMyr" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "CampaignMetric" ADD COLUMN IF NOT EXISTS "costPerLeadMyr" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "CampaignMetric" ADD COLUMN IF NOT EXISTS "costPerEnrolledStudentMyr" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "CampaignMetric" ADD COLUMN IF NOT EXISTS "conversionRate" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "CampaignMetric" ADD COLUMN IF NOT EXISTS "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "CampaignMetric" SET "firstYearRevenueMyr" = COALESCE("tuitionRevenueMyr", 0);
ALTER TABLE "CampaignMetric" DROP COLUMN IF EXISTS "tuitionRevenueMyr";
ALTER TABLE "CampaignMetric" DROP COLUMN IF EXISTS "createdAt";

-- Notifications alignment
ALTER TABLE "Notification" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "link" TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "readAt";

-- Foreign key behaviour updates
ALTER TABLE "CampaignCountry" DROP CONSTRAINT IF EXISTS "CampaignCountry_campaignId_fkey";
ALTER TABLE "CampaignFaculty" DROP CONSTRAINT IF EXISTS "CampaignFaculty_campaignId_fkey";
ALTER TABLE "CampaignProgramme" DROP CONSTRAINT IF EXISTS "CampaignProgramme_campaignId_fkey";
ALTER TABLE "LeadCampaignTouch" DROP CONSTRAINT IF EXISTS "LeadCampaignTouch_leadId_fkey";
ALTER TABLE "LeadCampaignTouch" DROP CONSTRAINT IF EXISTS "LeadCampaignTouch_campaignId_fkey";
ALTER TABLE "FollowUp" DROP CONSTRAINT IF EXISTS "FollowUp_leadId_fkey";
ALTER TABLE "CampaignCost" DROP CONSTRAINT IF EXISTS "CampaignCost_campaignId_fkey";
ALTER TABLE "CampaignMetric" DROP CONSTRAINT IF EXISTS "CampaignMetric_campaignId_fkey";

ALTER TABLE "CampaignCountry" ADD CONSTRAINT "CampaignCountry_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignFaculty" ADD CONSTRAINT "CampaignFaculty_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignProgramme" ADD CONSTRAINT "CampaignProgramme_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadCampaignTouch" ADD CONSTRAINT "LeadCampaignTouch_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadCampaignTouch" ADD CONSTRAINT "LeadCampaignTouch_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignCost" ADD CONSTRAINT "CampaignCost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CampaignMetric" ADD CONSTRAINT "CampaignMetric_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- New tables
CREATE TABLE IF NOT EXISTS "LeadStatusHistory" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "fromStatus" "LeadStatus",
  "toStatus" "LeadStatus" NOT NULL,
  "changedById" TEXT,
  "reason" TEXT,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ApplicationStatusHistory" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "fromStatus" "ApplicationStatus",
  "toStatus" "ApplicationStatus" NOT NULL,
  "changedById" TEXT,
  "reason" TEXT,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Offer" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "programmeId" TEXT,
  "offerDate" TIMESTAMP(3) NOT NULL,
  "status" "OfferStatus" NOT NULL DEFAULT 'ISSUED',
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Enrolment" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "programmeId" TEXT,
  "enrolmentDate" TIMESTAMP(3) NOT NULL,
  "revenueType" "RevenueType" NOT NULL DEFAULT 'SELF_FUNDED',
  "scholarshipId" TEXT,
  "sponsorId" TEXT,
  "grossTuitionMyr" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "scholarshipMyr" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "netTuitionMyr" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "revenueBasis" "RevenueBasis" NOT NULL DEFAULT 'FIRST_YEAR',
  "manualAttributionCampaignId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Enrolment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExecutiveProgrammeIncome" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT,
  "programmeName" TEXT NOT NULL,
  "amountMyr" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "incomeDate" TIMESTAMP(3) NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExecutiveProgrammeIncome_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UploadBatch" (
  "id" TEXT NOT NULL,
  "type" "UploadType" NOT NULL,
  "fileName" TEXT NOT NULL,
  "uploadedBy" TEXT NOT NULL,
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "successRows" INTEGER NOT NULL DEFAULT 0,
  "failedRows" INTEGER NOT NULL DEFAULT 0,
  "errorLog" JSONB,
  "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UploadBatchRow" (
  "id" TEXT NOT NULL,
  "uploadBatchId" TEXT NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "rawData" JSONB NOT NULL,
  "normalizedData" JSONB,
  "status" "UploadRowStatus" NOT NULL DEFAULT 'PENDING',
  "errors" JSONB,
  "result" JSONB,
  "leadId" TEXT,
  "applicationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UploadBatchRow_pkey" PRIMARY KEY ("id")
);

-- Lead merge candidate and notification alignment
ALTER TABLE "LeadMergeCandidate" ALTER COLUMN "status" TYPE "MergeStatus" USING "status"::text::"MergeStatus";
ALTER TABLE "LeadMergeCandidate" ADD COLUMN IF NOT EXISTS "reviewedBy" TEXT;
ALTER TABLE "LeadMergeCandidate" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

-- Indices
CREATE INDEX IF NOT EXISTS "Lead_passportNumber_idx" ON "Lead"("passportNumber");
CREATE INDEX IF NOT EXISTS "FXRate_rateDate_idx" ON "FXRate"("rateDate");
CREATE INDEX IF NOT EXISTS "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX IF NOT EXISTS "Campaign_startDate_idx" ON "Campaign"("startDate");
CREATE INDEX IF NOT EXISTS "FollowUp_leadId_idx" ON "FollowUp"("leadId");
CREATE INDEX IF NOT EXISTS "FollowUp_staffId_idx" ON "FollowUp"("staffId");
CREATE INDEX IF NOT EXISTS "FollowUp_nextFollowUpDate_idx" ON "FollowUp"("nextFollowUpDate");
CREATE INDEX IF NOT EXISTS "Application_programmeId_applicationStatus_idx" ON "Application"("programmeId", "applicationStatus");
CREATE INDEX IF NOT EXISTS "Application_passportNumber_idx" ON "Application"("passportNumber");
CREATE INDEX IF NOT EXISTS "Application_email_idx" ON "Application"("email");
CREATE INDEX IF NOT EXISTS "CampaignCost_campaignId_idx" ON "CampaignCost"("campaignId");
CREATE INDEX IF NOT EXISTS "CampaignCost_costDate_idx" ON "CampaignCost"("costDate");
CREATE INDEX IF NOT EXISTS "TuitionFee_programmeId_academicYear_idx" ON "TuitionFee"("programmeId", "academicYear");
CREATE INDEX IF NOT EXISTS "CampaignMetric_campaignId_idx" ON "CampaignMetric"("campaignId");
CREATE INDEX IF NOT EXISTS "CampaignMetric_metricDate_idx" ON "CampaignMetric"("metricDate");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "LeadStatusHistory_leadId_idx" ON "LeadStatusHistory"("leadId");
CREATE INDEX IF NOT EXISTS "LeadStatusHistory_changedAt_idx" ON "LeadStatusHistory"("changedAt");
CREATE INDEX IF NOT EXISTS "ApplicationStatusHistory_applicationId_idx" ON "ApplicationStatusHistory"("applicationId");
CREATE INDEX IF NOT EXISTS "Offer_applicationId_idx" ON "Offer"("applicationId");
CREATE INDEX IF NOT EXISTS "Offer_status_idx" ON "Offer"("status");
CREATE INDEX IF NOT EXISTS "Enrolment_applicationId_idx" ON "Enrolment"("applicationId");
CREATE INDEX IF NOT EXISTS "Enrolment_enrolmentDate_idx" ON "Enrolment"("enrolmentDate");
CREATE INDEX IF NOT EXISTS "Enrolment_revenueType_idx" ON "Enrolment"("revenueType");
CREATE INDEX IF NOT EXISTS "UploadBatch_uploadedBy_idx" ON "UploadBatch"("uploadedBy");
CREATE INDEX IF NOT EXISTS "UploadBatch_status_idx" ON "UploadBatch"("status");
CREATE INDEX IF NOT EXISTS "UploadBatchRow_status_idx" ON "UploadBatchRow"("status");
CREATE INDEX IF NOT EXISTS "UploadBatchRow_leadId_idx" ON "UploadBatchRow"("leadId");
CREATE INDEX IF NOT EXISTS "UploadBatchRow_applicationId_idx" ON "UploadBatchRow"("applicationId");
CREATE UNIQUE INDEX IF NOT EXISTS "UploadBatchRow_uploadBatchId_rowNumber_key" ON "UploadBatchRow"("uploadBatchId", "rowNumber");

-- Foreign keys
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Application" ADD CONSTRAINT "Application_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sponsor" ADD CONSTRAINT "Sponsor_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MouMoa" ADD CONSTRAINT "MouMoa_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MobilityRecord" ADD CONSTRAINT "MobilityRecord_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AcademicPeer" ADD CONSTRAINT "AcademicPeer_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadStatusHistory" ADD CONSTRAINT "LeadStatusHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadStatusHistory" ADD CONSTRAINT "LeadStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_manualAttributionCampaignId_fkey" FOREIGN KEY ("manualAttributionCampaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExecutiveProgrammeIncome" ADD CONSTRAINT "ExecutiveProgrammeIncome_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UploadBatch" ADD CONSTRAINT "UploadBatch_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UploadBatchRow" ADD CONSTRAINT "UploadBatchRow_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UploadBatchRow" ADD CONSTRAINT "UploadBatchRow_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UploadBatchRow" ADD CONSTRAINT "UploadBatchRow_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadMergeCandidate" ADD CONSTRAINT "LeadMergeCandidate_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
