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

  const [campaigns, leads, applications, costs, offers, enrolments] = await Promise.all([
    prisma.campaign.count({ where: cw }),
    prisma.lead.count({ where: lw }),
    prisma.application.findMany({ where: appWhere }),
    campaignIds.length
      ? prisma.campaignCost.findMany({
          where: { campaignId: { in: campaignIds } },
        })
      : Promise.resolve([]),
    prisma.offer.count({
      where: {
        application: appWhere,
      },
    }),
    prisma.enrolment.findMany({
      where: {
        OR: [
          {
            application: appWhere,
          },
          {
            manualAttributionCampaignId: { in: campaignIds },
          },
        ],
      },
    }),
  ]);

  const spend = costs.reduce((s, c) => s + Number(c.amountMyr), 0);
  const tuitionRevenue = enrolments.reduce(
    (s, enrolment) => s + Number(enrolment.netTuitionMyr || 0),
    0,
  );
  const scholarship = enrolments.reduce(
    (s, enrolment) => s + Number(enrolment.scholarshipMyr || 0),
    0,
  );
  const fullProgrammeRevenue = enrolments.reduce(
    (s, enrolment) =>
      s +
      Number(
        enrolment.revenueBasis === "FULL_PROGRAMME"
          ? enrolment.netTuitionMyr || 0
          : 0,
      ),
    0,
  );

  return {
    campaigns,
    ...calculateRoi({
      leads,
      applications: applications.length,
      offers,
      enrolments: enrolments.length,
      spend,
      tuitionRevenue,
      scholarship,
      fullProgrammeRevenue,
    }),
  };
}

export async function recruitmentFunnel(user) {
  const appWhere = applicationWhereForDashboard(user);
  const lw = scopedLeadWhere(user);

  const [leads, apps, offers, enrolments] = await Promise.all([
    prisma.lead.count({ where: lw }),
    prisma.application.findMany({ where: appWhere }),
    prisma.offer.count({ where: { application: appWhere } }),
    prisma.enrolment.count({ where: { application: appWhere } }),
  ]);

  return [
    { stage: "Leads", value: leads },
    { stage: "Applications", value: apps.length },
    { stage: "Offers", value: offers },
    { stage: "Enrolments", value: enrolments },
  ];
}
