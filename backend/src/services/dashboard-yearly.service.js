import { prisma } from "../config/db.js";
import { calculateRoi } from "./roi.service.js";
import { getLeadOverdueState } from "./sla.service.js";
import { getSystemSettingsMap } from "./system-setting.service.js";
import {
  scopedApplicationWhere,
  scopedCampaignWhere,
  scopedLeadWhere,
} from "./dashboard-scope.service.js";

const ACTIVE_STATUSES = new Set(["NEW", "CONTACTED", "INTERESTED"]);

function parseYearQuery(req) {
  const currentYear = new Date().getUTCFullYear();
  const toYear = Number(req.query.toYear ?? currentYear);
  const fromYear = Number(req.query.fromYear ?? toYear - 4);

  if (!Number.isFinite(fromYear) || !Number.isFinite(toYear))
    throw new Error("Invalid fromYear/toYear");
  if (fromYear > toYear) throw new Error("fromYear must be <= toYear");

  const start = new Date(Date.UTC(fromYear, 0, 1, 0, 0, 0, 0));
  const endExclusive = new Date(Date.UTC(toYear + 1, 0, 1, 0, 0, 0, 0));
  const years = [];
  for (let y = fromYear; y <= toYear; y += 1) years.push(y);

  return { years, start, endExclusive };
}

function yearOf(date) {
  return date ? new Date(date).getUTCFullYear() : null;
}

function endOfYearUTC(year) {
  // 23:59:59.999 UTC on Dec 31
  return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
}

function clampTopN(n, fallback = 5) {
  const nn = Number(n ?? fallback);
  if (!Number.isFinite(nn) || nn < 1) return fallback;
  return Math.min(nn, 20);
}

export async function pipelineByYear({ user, req }) {
  const { years, start, endExclusive } = parseYearQuery(req);
  const lw = scopedLeadWhere(user);
  const appWhere = scopedApplicationWhere(user);
  const cw = scopedCampaignWhere(user);

  const campaignRows = await prisma.campaign.findMany({
    where: cw,
    select: { id: true },
  });
  const campaignIds = campaignRows.map((c) => c.id);

  const [leads, applications, offers, enrolments] = await Promise.all([
    prisma.lead.findMany({
      where: { ...lw, createdAt: { gte: start, lt: endExclusive } },
      select: { createdAt: true },
    }),
    prisma.application.findMany({
      where: {
        ...appWhere,
        applicationDate: { gte: start, lt: endExclusive },
      },
      select: { applicationDate: true },
    }),
    prisma.offer.findMany({
      where: {
        offerDate: { gte: start, lt: endExclusive },
        application: appWhere,
      },
      select: { offerDate: true },
    }),
    prisma.enrolment.findMany({
      where: {
        enrolmentDate: { gte: start, lt: endExclusive },
        OR: [
          { application: appWhere },
          ...(campaignIds.length ? [{ manualAttributionCampaignId: { in: campaignIds } }] : []),
        ],
      },
      select: { enrolmentDate: true },
    }),
  ]);

  const acc = Object.fromEntries(years.map((y) => [y, { year: y, leads: 0, applications: 0, offers: 0, enrolments: 0 }]));

  for (const l of leads) {
    const y = yearOf(l.createdAt);
    if (y != null) acc[y].leads += 1;
  }
  for (const a of applications) {
    const y = yearOf(a.applicationDate);
    if (y != null) acc[y].applications += 1;
  }
  for (const o of offers) {
    const y = yearOf(o.offerDate);
    if (y != null) acc[y].offers += 1;
  }
  for (const e of enrolments) {
    const y = yearOf(e.enrolmentDate);
    if (y != null) acc[y].enrolments += 1;
  }

  return years.map((y) => acc[y]);
}

export async function roiByYear({ user, req }) {
  const { years, start, endExclusive } = parseYearQuery(req);
  const pipeline = await pipelineByYear({ user, req });

  const cw = scopedCampaignWhere(user);
  const campaignRows = await prisma.campaign.findMany({
    where: cw,
    select: { id: true },
  });
  const campaignIds = campaignRows.map((c) => c.id);

  const [costs, enrolmentsForRevenue] = await Promise.all([
    prisma.campaignCost.findMany({
      where: {
        campaignId: campaignIds.length ? { in: campaignIds } : { equals: "__none__" },
        costDate: { gte: start, lt: endExclusive },
      },
      select: { costDate: true, amountMyr: true },
    }),
    prisma.enrolment.findMany({
      where: {
        enrolmentDate: { gte: start, lt: endExclusive },
        OR: [
          { application: scopedApplicationWhere(user) },
          ...(campaignIds.length ? [{ manualAttributionCampaignId: { in: campaignIds } }] : []),
        ],
      },
      select: {
        enrolmentDate: true,
        netTuitionMyr: true,
        scholarshipMyr: true,
        revenueBasis: true,
      },
    }),
  ]);

  const spendByYear = Object.fromEntries(years.map((y) => [y, 0]));
  const scholarshipByYear = Object.fromEntries(years.map((y) => [y, 0]));
  const tuitionByYear = Object.fromEntries(years.map((y) => [y, 0]));
  const fullProgrammeRevenueByYear = Object.fromEntries(years.map((y) => [y, 0]));

  for (const c of costs) {
    const y = yearOf(c.costDate);
    if (y == null) continue;
    if (spendByYear[y] != null) spendByYear[y] += Number(c.amountMyr || 0);
  }

  for (const e of enrolmentsForRevenue) {
    const y = yearOf(e.enrolmentDate);
    if (y == null) continue;
    if (tuitionByYear[y] != null) {
      tuitionByYear[y] += Number(e.netTuitionMyr || 0);
      scholarshipByYear[y] += Number(e.scholarshipMyr || 0);
      if (e.revenueBasis === "FULL_PROGRAMME") {
        fullProgrammeRevenueByYear[y] += Number(e.netTuitionMyr || 0);
      }
    }
  }

  return pipeline.map((row) => {
    const year = row.year;
    const spendMyr = spendByYear[year] ?? 0;
    const tuitionRevenueMyr = tuitionByYear[year] ?? 0;
    const scholarshipMyr = scholarshipByYear[year] ?? 0;
    const fullProgrammeRevenueMyr = fullProgrammeRevenueByYear[year] ?? 0;

    const roi = calculateRoi({
      leads: row.leads,
      applications: row.applications,
      offers: row.offers,
      enrolments: row.enrolments,
      spend: spendMyr,
      tuitionRevenue: tuitionRevenueMyr,
      scholarship: scholarshipMyr,
      fullProgrammeRevenue: fullProgrammeRevenueMyr,
    });

    return {
      year,
      ...roi,
      spendMyr,
      tuitionRevenueMyr,
      scholarshipMyr,
      netRevenueMyr: roi.netRevenue,
    };
  });
}

export async function overdueSlaByYear({ user, req }) {
  const { years } = parseYearQuery(req);
  const settings = await getSystemSettingsMap();
  const lw = scopedLeadWhere(user);

  const leads = await prisma.lead.findMany({
    where: lw,
    select: {
      status: true,
      leadQuality: true,
      assignedAt: true,
      followUps: {
        orderBy: { followUpDate: "desc" },
        take: 1,
        select: { nextFollowUpDate: true },
      },
    },
  });

  const result = years.map((year) => {
    const now = endOfYearUTC(year);
    let overdueTotal = 0;
    let withinSlaTotal = 0;
    const overdueByQuality = { HOT: 0, WARM: 0, COLD: 0 };

    for (const lead of leads) {
      if (!ACTIVE_STATUSES.has(lead.status)) continue;
      const latestFollowUp = lead.followUps?.[0] ?? null;

      const state = getLeadOverdueState({
        lead,
        latestFollowUp,
        settings,
        now,
      });

      if (state.overdue) {
        overdueTotal += 1;
        const q = String(lead.leadQuality || "").toUpperCase();
        if (q in overdueByQuality) overdueByQuality[q] += 1;
      } else {
        withinSlaTotal += 1;
      }
    }

    const total = overdueTotal + withinSlaTotal;
    const overdueRate =
      total > 0 ? Math.round((overdueTotal / total) * 10000) / 100 : 0;

    return {
      year,
      overdueTotal,
      withinSlaTotal,
      overdueRate,
      overdueByQuality,
    };
  });

  return result;
}

export async function enrolmentsByYear({ user, req }) {
  const { years, start, endExclusive } = parseYearQuery(req);
  const appWhere = scopedApplicationWhere(user);
  const cw = scopedCampaignWhere(user);

  const campaignRows = await prisma.campaign.findMany({
    where: cw,
    select: { id: true },
  });
  const campaignIds = campaignRows.map((c) => c.id);

  const enrolments = await prisma.enrolment.findMany({
    where: {
      enrolmentDate: { gte: start, lt: endExclusive },
      OR: [
        { application: appWhere },
        ...(campaignIds.length ? [{ manualAttributionCampaignId: { in: campaignIds } }] : []),
      ],
    },
    select: { enrolmentDate: true },
  });

  const counts = Object.fromEntries(years.map((y) => [y, 0]));
  for (const e of enrolments) {
    const y = yearOf(e.enrolmentDate);
    if (y != null && counts[y] != null) counts[y] += 1;
  }

  return years.map((y) => ({ year: y, enrolments: counts[y] ?? 0 }));
}

export async function enrolmentsByYearProgramme({ user, req }) {
  const topN = clampTopN(req.query.topN, 6);
  const { years, start, endExclusive } = parseYearQuery(req);
  const appWhere = scopedApplicationWhere(user);
  const cw = scopedCampaignWhere(user);

  const campaignRows = await prisma.campaign.findMany({
    where: cw,
    select: { id: true },
  });
  const campaignIds = campaignRows.map((c) => c.id);

  const enrolments = await prisma.enrolment.findMany({
    where: {
      enrolmentDate: { gte: start, lt: endExclusive },
      OR: [
        { application: appWhere },
        ...(campaignIds.length ? [{ manualAttributionCampaignId: { in: campaignIds } }] : []),
      ],
    },
    select: {
      enrolmentDate: true,
      programmeId: true,
      programme: { select: { name: true } },
    },
  });

  // Total enrolments per programme to pick Top-N
  const totals = new Map();
  for (const e of enrolments) {
    const key = String(e.programmeId || "unknown");
    const name = e.programme?.name || "Unknown";
    totals.set(key, { programmeId: key, name, total: (totals.get(key)?.total || 0) + 1 });
  }

  const top = Array.from(totals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, topN);
  const topKeys = new Set(top.map((t) => t.programmeId));

  const valuesByKey = Object.fromEntries(top.map((t) => [t.programmeId, years.map(() => 0)]));
  const otherValues = years.map(() => 0);

  const idxByYear = Object.fromEntries(years.map((y, i) => [y, i]));

  for (const e of enrolments) {
    const y = yearOf(e.enrolmentDate);
    if (y == null) continue;
    const idx = idxByYear[y];
    const key = String(e.programmeId || "unknown");
    if (topKeys.has(key)) valuesByKey[key][idx] += 1;
    else otherValues[idx] += 1;
  }

  return {
    years,
    programmes: top.map((p) => ({
      programmeId: p.programmeId,
      name: p.name,
      values: valuesByKey[p.programmeId] || years.map(() => 0),
    })),
    otherValues,
  };
}

export async function enrolmentsByYearCountry({ user, req }) {
  const topN = clampTopN(req.query.topN, 5);
  const { years, start, endExclusive } = parseYearQuery(req);
  const appWhere = scopedApplicationWhere(user);
  const cw = scopedCampaignWhere(user);

  const campaignRows = await prisma.campaign.findMany({
    where: cw,
    select: { id: true },
  });
  const campaignIds = campaignRows.map((c) => c.id);

  const enrolments = await prisma.enrolment.findMany({
    where: {
      enrolmentDate: { gte: start, lt: endExclusive },
      OR: [
        { application: appWhere },
        ...(campaignIds.length ? [{ manualAttributionCampaignId: { in: campaignIds } }] : []),
      ],
    },
    select: {
      enrolmentDate: true,
      application: {
        select: {
          countryId: true,
          country: { select: { name: true, iso2: true } },
        },
      },
    },
  });

  const totals = new Map();
  for (const e of enrolments) {
    const c = e.application?.country;
    const key = String(e.application?.countryId || "unknown");
    const name = c?.name || "Unknown";
    const iso2 = c?.iso2 || "";
    totals.set(key, {
      countryId: key,
      name,
      iso2,
      total: (totals.get(key)?.total || 0) + 1,
    });
  }

  const top = Array.from(totals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, topN);
  const topKeys = new Set(top.map((t) => t.countryId));

  const idxByYear = Object.fromEntries(years.map((y, i) => [y, i]));
  const valuesByKey = Object.fromEntries(top.map((t) => [t.countryId, years.map(() => 0)]));
  const otherValues = years.map(() => 0);

  for (const e of enrolments) {
    const y = yearOf(e.enrolmentDate);
    if (y == null) continue;
    const idx = idxByYear[y];
    const key = String(e.application?.countryId || "unknown");
    if (topKeys.has(key)) valuesByKey[key][idx] += 1;
    else otherValues[idx] += 1;
  }

  return {
    years,
    countries: top.map((c) => ({
      countryId: c.countryId,
      name: c.name,
      iso2: c.iso2,
      values: valuesByKey[c.countryId] || years.map(() => 0),
    })),
    otherValues,
  };
}

export async function costBreakdownByYear({ user, req }) {
  const topN = clampTopN(req.query.topN, 5);
  const { years, start, endExclusive } = parseYearQuery(req);
  const cw = scopedCampaignWhere(user);

  const campaignRows = await prisma.campaign.findMany({
    where: cw,
    select: { id: true },
  });
  const campaignIds = campaignRows.map((c) => c.id);

  const costs = await prisma.campaignCost.findMany({
    where: {
      campaignId: campaignIds.length ? { in: campaignIds } : { equals: "__none__" },
      costDate: { gte: start, lt: endExclusive },
    },
    select: {
      costDate: true,
      costType: true,
      amountMyr: true,
    },
  });

  const totals = new Map();
  for (const c of costs) {
    const key = String(c.costType || "UNKNOWN");
    const total = (totals.get(key) || 0) + Number(c.amountMyr || 0);
    totals.set(key, total);
  }

  const top = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([costType]) => costType);
  const topSet = new Set(top);

  const idxByYear = Object.fromEntries(years.map((y, i) => [y, i]));
  const valuesByKey = Object.fromEntries(top.map((k) => [k, years.map(() => 0)]));
  const otherValues = years.map(() => 0);

  for (const c of costs) {
    const y = yearOf(c.costDate);
    if (y == null) continue;
    const idx = idxByYear[y];
    const key = String(c.costType || "UNKNOWN");
    const amt = Number(c.amountMyr || 0);
    if (topSet.has(key)) valuesByKey[key][idx] += amt;
    else otherValues[idx] += amt;
  }

  return {
    years,
    costTypes: top,
    valuesByCostType: valuesByKey,
    otherValues,
  };
}

