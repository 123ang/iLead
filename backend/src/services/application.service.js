import { prisma } from "../config/db.js";
import { createAuditLog } from "../utils/audit.js";

const applicationInclude = {
  lead: true,
  programme: true,
  country: true,
  offers: true,
  enrolments: true,
};

export const listApplications = async () =>
  prisma.application.findMany({
    where: { deletedAt: null },
    include: applicationInclude,
    orderBy: { createdAt: "desc" },
  });

export const uploadApplicationsScaffold = async (payload, userId, auditContext) => {
  const batch = await prisma.uploadBatch.create({
    data: {
      type: "APPLICATIONS",
      fileName: payload.fileName || "manual-upload.csv",
      uploadedBy: userId,
      totalRows: payload.rows?.length || 0,
      successRows: 0,
      failedRows: 0,
      status: "PROCESSING",
    },
  });

  const created = [];
  for (const row of payload.rows || []) {
    const record = await prisma.application.create({
      data: {
        applicantName: row.applicantName,
        email: row.email || null,
        phone: row.phone || null,
        passportNumber: row.passportNumber || null,
        countryId: row.countryId || null,
        programmeId: row.programmeId || null,
        applicationStatus: row.applicationStatus || "APPLIED",
        applicationDate: row.applicationDate ? new Date(row.applicationDate) : null,
        sourceCampaignId: row.sourceCampaignId || null,
        sourceRaw: row.sourceRaw || null,
        uploadBatchId: batch.id,
      },
    });
    created.push(record);
  }

  await prisma.uploadBatch.update({
    where: { id: batch.id },
    data: {
      successRows: created.length,
      failedRows: 0,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  await createAuditLog({
    userId,
    action: "APPLICATION_UPLOAD",
    entity: "UploadBatch",
    entityId: batch.id,
    newValue: { totalRows: payload.rows?.length || 0 },
    ...auditContext,
  });

  return { batchId: batch.id, createdCount: created.length };
};

export const listUnmatchedApplications = async () =>
  prisma.application.findMany({
    where: { leadId: null, deletedAt: null },
    include: applicationInclude,
  });

export const listMatchConflicts = async () => [];

export const matchApplicationsToLeads = async () => {
  const applications = await prisma.application.findMany({
    where: { leadId: null, deletedAt: null },
  });

  let matched = 0;
  for (const application of applications) {
    const lead = await prisma.lead.findFirst({
      where: {
        deletedAt: null,
        OR: [
          application.passportNumber ? { passportNumber: application.passportNumber } : undefined,
          application.email ? { email: application.email.toLowerCase() } : undefined,
          application.phone ? { phone: application.phone } : undefined,
        ].filter(Boolean),
      },
    });

    if (lead) {
      await prisma.application.update({
        where: { id: application.id },
        data: { leadId: lead.id },
      });
      matched += 1;
    }
  }

  return { scanned: applications.length, matched };
};

export const uploadOffersScaffold = async (payload) => payload;
export const uploadEnrolmentsScaffold = async (payload) => payload;

export const manualAttribution = async (enrolmentId, campaignId) =>
  prisma.enrolment.update({
    where: { id: enrolmentId },
    data: { manualAttributionCampaignId: campaignId },
  });
