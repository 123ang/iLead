import { prisma } from "../config/db.js";
import { createAuditLog } from "../utils/audit.js";
import { AppError } from "../utils/http.js";

const leadInclude = {
  country: true,
  interestedProgramme: true,
  assignedStaff: { select: { id: true, name: true, email: true } },
  touches: { include: { campaign: true } },
  followUps: { orderBy: { createdAt: "desc" } },
  applications: true,
};

const buildIdentifierWhere = (payload) => {
  const filters = [];
  if (payload.email) filters.push({ email: payload.email.toLowerCase() });
  if (payload.phone) filters.push({ phone: payload.phone });
  if (payload.passportNumber) filters.push({ passportNumber: payload.passportNumber });
  return filters;
};

export const listLeads = () =>
  prisma.lead.findMany({
    where: { deletedAt: null },
    include: leadInclude,
    orderBy: { createdAt: "desc" },
  });

export const getLead = async (id) => {
  const lead = await prisma.lead.findFirst({
    where: { id, deletedAt: null },
    include: leadInclude,
  });
  if (!lead) {
    throw new AppError(404, "Lead not found");
  }
  return lead;
};

export const listDuplicateLeads = async () =>
  prisma.leadMergeCandidate.findMany({
    include: {
      leadA: true,
      leadB: true,
      reviewer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

export const createLead = async (payload, userId, auditContext) => {
  const duplicateWhere = buildIdentifierWhere(payload);
  const exactMatches = duplicateWhere.length
    ? await prisma.lead.findMany({
        where: {
          OR: duplicateWhere,
          deletedAt: null,
        },
      })
    : [];

  const lead = await prisma.lead.create({
    data: {
      ...payload,
      email: payload.email || null,
      phone: payload.phone || null,
      passportNumber: payload.passportNumber || null,
      externalLeadId: payload.externalLeadId || null,
      countryId: payload.countryId || null,
      interestedProgrammeId: payload.interestedProgrammeId || null,
      assignedStaffId: payload.assignedStaffId || null,
      assignedAt: payload.assignedStaffId ? new Date(payload.assignedAt || Date.now()) : null,
      touches: {
        create: payload.campaignIds.map((campaignId) => ({ campaignId })),
      },
      statusHistory: {
        create: { toStatus: payload.status, changedById: userId, reason: "Lead created" },
      },
    },
    include: leadInclude,
  });

  for (const match of exactMatches) {
    await prisma.leadMergeCandidate.create({
      data: {
        leadAId: match.id,
        leadBId: lead.id,
        confidence: 1,
        reason: match.email === lead.email ? "exact_email" : match.phone === lead.phone ? "exact_phone" : "exact_passport",
      },
    });
  }

  await createAuditLog({
    userId,
    action: "LEAD_CREATE",
    entity: "Lead",
    entityId: lead.id,
    newValue: payload,
    ...auditContext,
  });

  return lead;
};

export const updateLead = async (id, payload, userId, auditContext) => {
  const existing = await getLead(id);
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...payload,
      email: payload.email || null,
      phone: payload.phone || null,
      passportNumber: payload.passportNumber || null,
      externalLeadId: payload.externalLeadId || null,
      countryId: payload.countryId || null,
      interestedProgrammeId: payload.interestedProgrammeId || null,
      assignedStaffId: payload.assignedStaffId || null,
    },
    include: leadInclude,
  });

  await createAuditLog({
    userId,
    action: "LEAD_UPDATE",
    entity: "Lead",
    entityId: id,
    oldValue: existing,
    newValue: payload,
    ...auditContext,
  });

  return lead;
};

export const deleteLead = async (id, userId, auditContext) => {
  await getLead(id);
  const lead = await prisma.lead.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId,
    action: "LEAD_DELETE",
    entity: "Lead",
    entityId: id,
    ...auditContext,
  });

  return lead;
};

export const assignLead = async (id, assignedStaffId, userId, auditContext) => {
  const lead = await prisma.lead.update({
    where: { id },
    data: { assignedStaffId, assignedAt: new Date() },
    include: leadInclude,
  });

  await createAuditLog({
    userId,
    action: "LEAD_ASSIGN",
    entity: "Lead",
    entityId: id,
    newValue: { assignedStaffId },
    ...auditContext,
  });

  return lead;
};

export const updateLeadStatus = async (id, status, reason, userId, auditContext) => {
  const existing = await getLead(id);
  const lead = await prisma.lead.update({
    where: { id },
    data: {
      status,
      statusHistory: {
        create: {
          fromStatus: existing.status,
          toStatus: status,
          reason,
          changedById: userId,
        },
      },
    },
    include: leadInclude,
  });

  await createAuditLog({
    userId,
    action: "LEAD_STATUS_UPDATE",
    entity: "Lead",
    entityId: id,
    oldValue: { status: existing.status },
    newValue: { status, reason },
    ...auditContext,
  });

  return lead;
};
