-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'MANAGEMENT', 'CIAC_ADMIN', 'FACULTY_DEAN', 'PROGRAMME_COORDINATOR', 'STAFF', 'REGISTRAR', 'FINANCE');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('EDUCATION_FAIR', 'UNIVERSITY_VISIT', 'ROADSHOW', 'ACADEMIC_COLLABORATION', 'CONFERENCE', 'AGENT_EVENT', 'DIGITAL_CAMPAIGN', 'CIAC_UMBRELLA', 'OTHER');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StudyLevel" AS ENUM ('FOUNDATION', 'BACHELOR', 'MASTER', 'PHD', 'EXECUTIVE', 'MOBILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadQuality" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'APPLIED', 'OFFERED', 'ENROLLED', 'LOST', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "FollowUpType" AS ENUM ('EMAIL', 'WHATSAPP', 'CALL', 'MEETING', 'BROCHURE_SENT', 'APPLICATION_GUIDE_SENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'OFFERED', 'REJECTED', 'ACCEPTED', 'ENROLLED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('TRAVEL', 'ACCOMMODATION', 'BOOTH', 'MARKETING', 'ALLOWANCE', 'AGENCY', 'DIGITAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('EVENT_FORM', 'CSV_UPLOAD', 'QR_CODE', 'WEBSITE', 'AGENT', 'REFERRAL', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL,
    "facultyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iso2" TEXT,
    "iso3" TEXT,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "facultyId" TEXT,
    "studyLevel" "StudyLevel" NOT NULL,
    "durationYears" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FXRate" (
    "id" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "rateToMyr" DECIMAL(65,30) NOT NULL,
    "rateDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FXRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campaignType" "CampaignType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "objective" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'PLANNED',
    "approvedBudgetMyr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "actualSpendMyr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignCountry" (
    "campaignId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,

    CONSTRAINT "CampaignCountry_pkey" PRIMARY KEY ("campaignId","countryId")
);

-- CreateTable
CREATE TABLE "CampaignFaculty" (
    "campaignId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,

    CONSTRAINT "CampaignFaculty_pkey" PRIMARY KEY ("campaignId","facultyId")
);

-- CreateTable
CREATE TABLE "CampaignProgramme" (
    "campaignId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,

    CONSTRAINT "CampaignProgramme_pkey" PRIMARY KEY ("campaignId","programmeId")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passportNumber" TEXT,
    "externalLeadId" TEXT,
    "countryId" TEXT,
    "interestedProgrammeId" TEXT,
    "studyLevel" "StudyLevel",
    "leadQuality" "LeadQuality" NOT NULL DEFAULT 'WARM',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "assignedStaffId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "source" "LeadSource",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadCampaignTouch" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL DEFAULT 'EVENT_FORM',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceNote" TEXT,

    CONSTRAINT "LeadCampaignTouch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadMergeCandidate" (
    "id" TEXT NOT NULL,
    "leadAId" TEXT NOT NULL,
    "leadBId" TEXT NOT NULL,
    "confidence" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadMergeCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "followUpType" "FollowUpType" NOT NULL,
    "followUpDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextFollowUpDate" TIMESTAMP(3),
    "outcome" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "applicantName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passportNumber" TEXT,
    "countryId" TEXT,
    "programmeId" TEXT,
    "studyLevel" "StudyLevel",
    "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "applicationDate" TIMESTAMP(3),
    "offerDate" TIMESTAMP(3),
    "enrolmentDate" TIMESTAMP(3),
    "sourceCampaignId" TEXT,
    "scholarshipMyr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tuitionRevenueMyr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignCost" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "costType" "CostType" NOT NULL,
    "description" TEXT,
    "amountOriginal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fxRateToMyr" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "amountMyr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "costDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TuitionFee" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "studyLevel" "StudyLevel" NOT NULL,
    "amountMyr" DECIMAL(65,30) NOT NULL,
    "academicYear" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TuitionFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discountPercent" DECIMAL(65,30),
    "amountMyr" DECIMAL(65,30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouMoa" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "institution" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "signedDate" TIMESTAMP(3),

    CONSTRAINT "MouMoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MobilityRecord" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "institution" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "mobilityType" TEXT NOT NULL,

    CONSTRAINT "MobilityRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicPeer" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "name" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "AcademicPeer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignMetric" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "totalApplications" INTEGER NOT NULL DEFAULT 0,
    "totalOffers" INTEGER NOT NULL DEFAULT 0,
    "totalEnrolments" INTEGER NOT NULL DEFAULT 0,
    "actualSpendMyr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tuitionRevenueMyr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netRevenueMyr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "roiRatio" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "roiPercentage" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_iso2_key" ON "Country"("iso2");

-- CreateIndex
CREATE UNIQUE INDEX "Country_iso3_key" ON "Country"("iso3");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_code_key" ON "Faculty"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Programme_code_key" ON "Programme"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FXRate_currencyId_rateDate_key" ON "FXRate"("currencyId", "rateDate");

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "Lead_assignedStaffId_idx" ON "Lead"("assignedStaffId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "LeadCampaignTouch_campaignId_idx" ON "LeadCampaignTouch"("campaignId");

-- CreateIndex
CREATE INDEX "LeadCampaignTouch_leadId_idx" ON "LeadCampaignTouch"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadCampaignTouch_leadId_campaignId_key" ON "LeadCampaignTouch"("leadId", "campaignId");

-- CreateIndex
CREATE INDEX "Application_leadId_idx" ON "Application"("leadId");

-- CreateIndex
CREATE INDEX "Application_applicationStatus_idx" ON "Application"("applicationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMetric_campaignId_metricDate_key" ON "CampaignMetric"("campaignId", "metricDate");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FXRate" ADD CONSTRAINT "FXRate_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCountry" ADD CONSTRAINT "CampaignCountry_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCountry" ADD CONSTRAINT "CampaignCountry_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignFaculty" ADD CONSTRAINT "CampaignFaculty_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignFaculty" ADD CONSTRAINT "CampaignFaculty_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignProgramme" ADD CONSTRAINT "CampaignProgramme_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignProgramme" ADD CONSTRAINT "CampaignProgramme_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_interestedProgrammeId_fkey" FOREIGN KEY ("interestedProgrammeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadCampaignTouch" ADD CONSTRAINT "LeadCampaignTouch_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadCampaignTouch" ADD CONSTRAINT "LeadCampaignTouch_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_sourceCampaignId_fkey" FOREIGN KEY ("sourceCampaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCost" ADD CONSTRAINT "CampaignCost_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignCost" ADD CONSTRAINT "CampaignCost_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TuitionFee" ADD CONSTRAINT "TuitionFee_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouMoa" ADD CONSTRAINT "MouMoa_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MobilityRecord" ADD CONSTRAINT "MobilityRecord_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicPeer" ADD CONSTRAINT "AcademicPeer_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMetric" ADD CONSTRAINT "CampaignMetric_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
