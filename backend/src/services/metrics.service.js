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

  const [touches, apps, costs] = await Promise.all([
    prisma.leadCampaignTouch.count({ where: { campaignId } }),
    prisma.application.findMany({
      where: {
        deletedAt: null,
        lead: {
          AND: [baseLead, { touches: { some: { campaignId } } }],
        },
      },
    }),
    prisma.campaignCost.findMany({ where: { campaignId } }),
  ]);

  const spend = costs.reduce((s, c) => s + Number(c.amountMyr), 0);
  const offers = apps.filter((a) =>
    ["OFFERED", "ACCEPTED", "ENROLLED"].includes(a.applicationStatus),
  ).length;
  const enrolments = apps.filter((a) => a.applicationStatus === "ENROLLED").length;

  return calculateRoi({
    leads: touches,
    applications: apps.length,
    offers,
    enrolments,
    spend,
    tuitionRevenue: apps.reduce((s, a) => s + Number(a.tuitionRevenueMyr || 0), 0),
    scholarship: apps.reduce((s, a) => s + Number(a.scholarshipMyr || 0), 0),
  });
}
