import { prisma } from "../config/db.js";
import { createAuditLog } from "../utils/audit.js";
import { AppError } from "../utils/http.js";
import { refreshCampaignActualSpend } from "./metrics.service.js";

const campaignInclude = {
  countries: { include: { country: true } },
  faculties: { include: { faculty: true } },
  programmes: { include: { programme: true } },
  costs: { include: { currency: true } },
  metrics: { orderBy: { metricDate: "desc" }, take: 30 },
};

export const listCampaigns = () =>
  prisma.campaign.findMany({
    where: { deletedAt: null },
    include: {
      countries: { include: { country: true } },
      faculties: { include: { faculty: true } },
      programmes: { include: { programme: true } },
    },
    orderBy: { startDate: "desc" },
  });

export const getCampaign = async (id) => {
  const campaign = await prisma.campaign.findFirst({
    where: { id, deletedAt: null },
    include: campaignInclude,
  });
  if (!campaign) {
    throw new AppError(404, "Campaign not found");
  }
  return campaign;
};

export const createCampaign = async (payload, userId, auditContext) => {
  const campaign = await prisma.campaign.create({
    data: {
      name: payload.name,
      campaignType: payload.campaignType,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
      objective: payload.objective,
      status: payload.status,
      approvedBudgetMyr: payload.approvedBudgetMyr,
      countries: {
        create: payload.countryIds.map((countryId) => ({ countryId })),
      },
      faculties: {
        create: payload.facultyIds.map((facultyId) => ({ facultyId })),
      },
      programmes: {
        create: payload.programmeIds.map((programmeId) => ({ programmeId })),
      },
    },
    include: campaignInclude,
  });

  await createAuditLog({
    userId,
    action: "CAMPAIGN_CREATE",
    entity: "Campaign",
    entityId: campaign.id,
    newValue: payload,
    ...auditContext,
  });

  return campaign;
};

export const updateCampaign = async (id, payload, userId, auditContext) => {
  const existing = await getCampaign(id);

  const campaign = await prisma.$transaction(async (tx) => {
    await tx.campaignCountry.deleteMany({ where: { campaignId: id } });
    await tx.campaignFaculty.deleteMany({ where: { campaignId: id } });
    await tx.campaignProgramme.deleteMany({ where: { campaignId: id } });

    return tx.campaign.update({
      where: { id },
      data: {
        name: payload.name,
        campaignType: payload.campaignType,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        objective: payload.objective,
        status: payload.status,
        approvedBudgetMyr: payload.approvedBudgetMyr,
        countries: { create: payload.countryIds.map((countryId) => ({ countryId })) },
        faculties: { create: payload.facultyIds.map((facultyId) => ({ facultyId })) },
        programmes: { create: payload.programmeIds.map((programmeId) => ({ programmeId })) },
      },
      include: campaignInclude,
    });
  });

  await createAuditLog({
    userId,
    action: "CAMPAIGN_UPDATE",
    entity: "Campaign",
    entityId: id,
    oldValue: existing,
    newValue: payload,
    ...auditContext,
  });

  return campaign;
};

export const deleteCampaign = async (id, userId, auditContext) => {
  await getCampaign(id);
  const campaign = await prisma.campaign.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await createAuditLog({
    userId,
    action: "CAMPAIGN_DELETE",
    entity: "Campaign",
    entityId: id,
    ...auditContext,
  });

  return campaign;
};

export const addCampaignCost = async (campaignId, payload, userId, auditContext) => {
  const amountMyr = Number(payload.originalAmount) * Number(payload.fxRateToMyr);

  const cost = await prisma.campaignCost.create({
    data: {
      campaignId,
      costType: payload.costType,
      description: payload.description,
      originalAmount: payload.originalAmount,
      currencyId: payload.currencyId,
      fxRateToMyr: payload.fxRateToMyr,
      amountMyr,
      costDate: payload.costDate ? new Date(payload.costDate) : null,
    },
    include: { currency: true },
  });

  await refreshCampaignActualSpend(campaignId);

  await createAuditLog({
    userId,
    action: "CAMPAIGN_COST_CREATE",
    entity: "CampaignCost",
    entityId: cost.id,
    newValue: payload,
    ...auditContext,
  });

  return cost;
};
