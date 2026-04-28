import { prisma } from "../config/db.js";
import { calculateRoi } from "./roi.service.js";
import {
  isGlobalDashboardRole,
  scopedCampaignWhere,
  scopedLeadWhere,
} from "./dashboard-scope.service.js";

function applicationWhereForDashboard(user) {
  if (!user || isGlobalDashboardRole(user.role)) {
    return { deletedAt: null };
  }
  const lw = scopedLeadWhere(user);
  return scopedApplicationWhere(user, lw);
}

export async function executiveDashboard(user) {
  const lw = scopedLeadWhere(user);
  const cw = scopedCampaignWhere(user);
  const appWhere = applicationWhereForDashboard(user);

  const campaignRows = await prisma.campaign.findMany({
    where: cw,
    select: { id: true },
  });
  const campaignIds = campaignRows.map((c) => c.id);

  const [campaigns, leads, applications, costs] = await Promise.all([
    prisma.campaign.count({ where: cw }),
    prisma.lead.count({ where: lw }),
    prisma.application.findMany({ where: appWhere }),
    campaignIds.length
      ? prisma.campaignCost.findMany({
          where: { campaignId: { in: campaignIds } },
        })
      : Promise.resolve([]),
  ]);

  const spend = costs.reduce((s, c) => s + Number(c.amountMyr), 0);
  const offers = applications.filter((a) =>
    ["OFFERED", "ACCEPTED", "ENROLLED"].includes(a.applicationStatus),
  ).length;
  const enrolments = applications.filter(
    (a) => a.applicationStatus === "ENROLLED",
  ).length;
  const tuitionRevenue = applications.reduce(
    (s, a) => s + Number(a.tuitionRevenueMyr || 0),
    0,
  );
  const scholarship = applications.reduce(
    (s, a) => s + Number(a.scholarshipMyr || 0),
    0,
  );

  return {
    campaigns,
    ...calculateRoi({
      leads,
      applications: applications.length,
      offers,
      enrolments,
      spend,
      tuitionRevenue,
      scholarship,
    }),
  };
}

export async function recruitmentFunnel(user) {
  const appWhere = applicationWhereForDashboard(user);
  const lw = scopedLeadWhere(user);

  const [leads, apps] = await Promise.all([
    prisma.lead.count({ where: lw }),
    prisma.application.findMany({ where: appWhere }),
  ]);

  return [
    { stage: "Leads", value: leads },
    { stage: "Applications", value: apps.length },
    {
      stage: "Offers",
      value: apps.filter((a) =>
        ["OFFERED", "ACCEPTED", "ENROLLED"].includes(a.applicationStatus),
      ).length,
    },
    {
      stage: "Enrolments",
      value: apps.filter((a) => a.applicationStatus === "ENROLLED").length,
    },
  ];
}
