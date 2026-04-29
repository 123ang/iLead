import { prisma } from "../config/db.js";
import { calculateRoi } from "./roi.service.js";

function dayStart(value = new Date()) {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + Number(row?.[key] || 0), 0);
}

export async function buildCampaignMetricSnapshot(campaignId, tx = prisma) {
  const [leads, applications, costs, enrolments, offers] = await Promise.all([
    tx.lead.findMany({
      where: { deletedAt: null, touches: { some: { campaignId } } },
      select: { id: true, leadQuality: true },
    }),
    tx.application.findMany({
      where: {
        deletedAt: null,
        lead: { deletedAt: null, touches: { some: { campaignId } } },
      },
      select: { id: true },
    }),
    tx.campaignCost.findMany({ where: { campaignId } }),
    tx.enrolment.findMany({
      where: {
        OR: [
          {
            application: {
              deletedAt: null,
              lead: { deletedAt: null, touches: { some: { campaignId } } },
            },
          },
          { manualAttributionCampaignId: campaignId },
        ],
      },
    }),
    tx.offer.count({
      where: {
        application: {
          deletedAt: null,
          lead: { deletedAt: null, touches: { some: { campaignId } } },
        },
      },
    }),
  ]);

  const spend = sum(costs, "amountMyr");
  const firstYearRevenue = enrolments.reduce(
    (total, item) =>
      total +
      Number(item.revenueBasis === "FIRST_YEAR" ? item.netTuitionMyr || 0 : 0),
    0,
  );
  const fullProgrammeRevenue = enrolments.reduce(
    (total, item) =>
      total +
      Number(item.revenueBasis === "FULL_PROGRAMME" ? item.netTuitionMyr || 0 : 0),
    0,
  );
  const netRevenue = sum(enrolments, "netTuitionMyr");
  const roi = calculateRoi({
    leads: leads.length,
    applications: applications.length,
    offers,
    enrolments: enrolments.length,
    spend,
    tuitionRevenue: netRevenue,
    scholarship: 0,
    fullProgrammeRevenue,
  });

  return {
    totalLeads: leads.length,
    qualifiedLeads: leads.filter((lead) => lead.leadQuality !== "COLD").length,
    totalApplications: applications.length,
    totalOffers: offers,
    totalEnrolments: enrolments.length,
    actualSpendMyr: spend,
    firstYearRevenueMyr: firstYearRevenue,
    fullProgrammeRevenueMyr: fullProgrammeRevenue,
    netRevenueMyr: netRevenue,
    costPerLeadMyr: roi.costPerLead,
    costPerEnrolledStudentMyr: roi.costPerEnrolledStudent,
    conversionRate: roi.overallConversionRate,
    roiRatio: roi.roiRatio || 0,
    roiPercentage: roi.roiPercentage || 0,
  };
}

export async function refreshCampaignMetricSnapshots({
  metricDate = new Date(),
  campaignId = null,
} = {}) {
  const date = dayStart(metricDate);
  const campaigns = await prisma.campaign.findMany({
    where: { deletedAt: null, ...(campaignId ? { id: campaignId } : {}) },
    select: { id: true },
  });

  const results = [];
  for (const campaign of campaigns) {
    const snapshot = await buildCampaignMetricSnapshot(campaign.id);
    const saved = await prisma.campaignMetric.upsert({
      where: {
        campaignId_metricDate: {
          campaignId: campaign.id,
          metricDate: date,
        },
      },
      create: {
        campaignId: campaign.id,
        metricDate: date,
        ...snapshot,
        refreshedAt: new Date(),
      },
      update: {
        ...snapshot,
        refreshedAt: new Date(),
      },
    });
    results.push(saved);
  }

  return { metricDate: date, count: results.length, items: results };
}
