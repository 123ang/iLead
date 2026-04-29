import { prisma } from "../config/db.js";
import { calculateRoi } from "./roi.service.js";
import { isGlobalDashboardRole, scopedLeadWhere } from "./dashboard-scope.service.js";

/**
 * Applications linked to this campaign via lead touches, intersected with dashboard role scope.
 */
export async function campaignRoi(campaignId, user) {
  const baseLead = user && !isGlobalDashboardRole(user.role)
    ? scopedLeadWhere(user)
    : { deletedAt: null };

  const [leadRows, apps, costs, enrolments, offers] = await Promise.all([
    prisma.lead.findMany({
      where: {
        AND: [baseLead, { touches: { some: { campaignId } } }],
      },
      select: { id: true, leadQuality: true },
    }),
    prisma.application.findMany({
      where: {
        deletedAt: null,
        lead: {
          AND: [baseLead, { touches: { some: { campaignId } } }],
        },
      },
    }),
    prisma.campaignCost.findMany({ where: { campaignId } }),
    prisma.enrolment.findMany({
      where: {
        OR: [
          {
            application: {
              lead: {
                AND: [baseLead, { touches: { some: { campaignId } } }],
              },
            },
          },
          { manualAttributionCampaignId: campaignId },
        ],
      },
    }),
    prisma.offer.count({
      where: {
        application: {
          deletedAt: null,
          lead: {
            AND: [baseLead, { touches: { some: { campaignId } } }],
          },
        },
      },
    }),
  ]);

  const spend = costs.reduce((s, c) => s + Number(c.amountMyr), 0);

  return calculateRoi({
    leads: leadRows.length,
    applications: apps.length,
    offers,
    enrolments: enrolments.length,
    spend,
    tuitionRevenue: enrolments.reduce((s, item) => s + Number(item.netTuitionMyr || 0), 0),
    fullProgrammeRevenue: enrolments.reduce(
      (s, item) =>
        s +
        Number(item.revenueBasis === "FULL_PROGRAMME" ? item.netTuitionMyr || 0 : 0),
      0,
    ),
    scholarship: enrolments.reduce((s, item) => s + Number(item.scholarshipMyr || 0), 0),
    qualifiedLeads: leadRows.filter((lead) => lead.leadQuality !== "COLD").length,
  });
}
