import { prisma } from "../config/db.js";
import { getLeadOverdueState } from "./sla.service.js";
import { getSystemSettingsMap } from "./system-setting.service.js";
import {
  conversionRates,
  duplicateLeadRow,
  round,
  sumNumbers,
} from "./report-calculations.service.js";
import {
  scopedApplicationWhere,
  scopedCampaignWhere,
  scopedLeadWhere,
} from "./dashboard-scope.service.js";

function emptyBucket(name, id = null) {
  return {
    id,
    name,
    leads: 0,
    applications: 0,
    offers: 0,
    enrolments: 0,
    grossRevenueMyr: 0,
    scholarshipMyr: 0,
    netRevenueMyr: 0,
    spendMyr: 0,
  };
}

function finaliseBucket(row) {
  return {
    ...row,
    grossRevenueMyr: round(row.grossRevenueMyr),
    scholarshipMyr: round(row.scholarshipMyr),
    netRevenueMyr: round(row.netRevenueMyr),
    spendMyr: round(row.spendMyr),
    costPerEnrolmentMyr: round(row.enrolments ? row.spendMyr / row.enrolments : 0),
    ...conversionRates(row),
  };
}

function incrementApplication(bucket, app) {
  bucket.applications += 1;
  bucket.offers += app.offers?.length || 0;
  bucket.enrolments += app.enrolments?.length || 0;
  bucket.grossRevenueMyr += sumNumbers(app.enrolments || [], "grossTuitionMyr");
  bucket.scholarshipMyr += sumNumbers(app.enrolments || [], "scholarshipMyr");
  bucket.netRevenueMyr += sumNumbers(app.enrolments || [], "netTuitionMyr");
}

export async function countryPerformanceReport(user) {
  const [countries, leads, applications] = await Promise.all([
    prisma.country.findMany({ orderBy: { name: "asc" } }),
    prisma.lead.findMany({
      where: scopedLeadWhere(user),
      select: { id: true, countryId: true },
    }),
    prisma.application.findMany({
      where: scopedApplicationWhere(user),
      include: { offers: true, enrolments: true },
    }),
  ]);

  const byId = new Map(countries.map((c) => [c.id, emptyBucket(c.name, c.id)]));
  const unknown = emptyBucket("Unknown");
  for (const lead of leads) (byId.get(lead.countryId) || unknown).leads += 1;
  for (const app of applications) {
    incrementApplication(byId.get(app.countryId) || unknown, app);
  }

  return [...byId.values(), unknown]
    .filter((row) => row.leads || row.applications || row.enrolments)
    .map(finaliseBucket)
    .sort((a, b) => b.netRevenueMyr - a.netRevenueMyr || b.leads - a.leads);
}

export async function facultyPerformanceReport(user) {
  const [faculties, leads, applications, campaigns] = await Promise.all([
    prisma.faculty.findMany({ include: { programmes: true }, orderBy: { name: "asc" } }),
    prisma.lead.findMany({
      where: scopedLeadWhere(user),
      include: { interestedProgramme: true },
    }),
    prisma.application.findMany({
      where: scopedApplicationWhere(user),
      include: { programme: true, offers: true, enrolments: true },
    }),
    prisma.campaign.findMany({
      where: scopedCampaignWhere(user),
      include: { faculties: true, costs: true },
    }),
  ]);

  const byId = new Map(faculties.map((f) => [f.id, emptyBucket(f.name, f.id)]));
  const unknown = emptyBucket("Unknown");
  for (const lead of leads) {
    (byId.get(lead.interestedProgramme?.facultyId) || unknown).leads += 1;
  }
  for (const app of applications) {
    incrementApplication(byId.get(app.programme?.facultyId) || unknown, app);
  }
  for (const campaign of campaigns) {
    const spend = sumNumbers(campaign.costs || [], "amountMyr");
    const linked = campaign.faculties.length ? campaign.faculties : [{ facultyId: null }];
    const share = spend / linked.length;
    for (const faculty of linked) {
      (byId.get(faculty.facultyId) || unknown).spendMyr += share;
    }
  }

  return [...byId.values(), unknown]
    .filter((row) => row.leads || row.applications || row.enrolments || row.spendMyr)
    .map(finaliseBucket)
    .sort((a, b) => b.netRevenueMyr - a.netRevenueMyr || b.enrolments - a.enrolments);
}

export async function programmeConversionReport(user) {
  const [programmes, leads, applications] = await Promise.all([
    prisma.programme.findMany({ include: { faculty: true }, orderBy: { name: "asc" } }),
    prisma.lead.findMany({
      where: scopedLeadWhere(user),
      select: { interestedProgrammeId: true },
    }),
    prisma.application.findMany({
      where: scopedApplicationWhere(user),
      include: { programme: { include: { faculty: true } }, offers: true, enrolments: true },
    }),
  ]);

  const byId = new Map(
    programmes.map((p) => [
      p.id,
      { ...emptyBucket(p.name, p.id), faculty: p.faculty?.name || "" },
    ]),
  );
  const unknown = { ...emptyBucket("Unknown"), faculty: "" };
  for (const lead of leads) (byId.get(lead.interestedProgrammeId) || unknown).leads += 1;
  for (const app of applications) incrementApplication(byId.get(app.programmeId) || unknown, app);

  return [...byId.values(), unknown]
    .filter((row) => row.leads || row.applications || row.enrolments)
    .map(finaliseBucket)
    .sort((a, b) => b.overallConversionRate - a.overallConversionRate || b.leads - a.leads);
}

export async function followUpSlaReport(user) {
  const [settings, leads] = await Promise.all([
    getSystemSettingsMap(),
    prisma.lead.findMany({
      where: scopedLeadWhere(user),
      include: {
        assignedStaff: { select: { id: true, name: true, email: true } },
        followUps: { orderBy: { followUpDate: "desc" }, take: 1 },
      },
    }),
  ]);

  const summary = {
    totalActive: 0,
    overdue: 0,
    withinSla: 0,
    unassigned: 0,
    byQuality: {},
  };
  const items = [];

  for (const lead of leads) {
    if (!["NEW", "CONTACTED", "INTERESTED"].includes(lead.status)) continue;
    summary.totalActive += 1;
    if (!lead.assignedStaffId) summary.unassigned += 1;
    const latestFollowUp = lead.followUps[0] || null;
    const state = getLeadOverdueState({ lead, latestFollowUp, settings, now: new Date() });
    summary.byQuality[lead.leadQuality] ||= { total: 0, overdue: 0, withinSla: 0 };
    summary.byQuality[lead.leadQuality].total += 1;
    if (state.overdue) {
      summary.overdue += 1;
      summary.byQuality[lead.leadQuality].overdue += 1;
    } else {
      summary.withinSla += 1;
      summary.byQuality[lead.leadQuality].withinSla += 1;
    }
    items.push({
      leadId: lead.id,
      leadName: lead.fullName,
      status: lead.status,
      leadQuality: lead.leadQuality,
      assignedStaff: lead.assignedStaff?.name || "",
      deadline: state.deadline,
      overdue: state.overdue,
      reason: state.reason,
    });
  }

  return {
    summary: {
      ...summary,
      overdueRate: round((summary.overdue / Math.max(summary.totalActive, 1)) * 100),
    },
    items: items.sort((a, b) => Number(b.overdue) - Number(a.overdue)),
  };
}

export async function duplicateLeadReport({ includePii = false } = {}) {
  const candidates = await prisma.leadMergeCandidate.findMany({
    include: {
      leadA: { include: { country: true, interestedProgramme: true } },
      leadB: { include: { country: true, interestedProgramme: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const rows = candidates.map((candidate) => duplicateLeadRow(candidate, { includePii }));
  const summary = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    },
    { total: 0 },
  );
  return { summary, rows };
}

export async function scholarshipAdjustedRevenueReport(user) {
  const enrolments = await prisma.enrolment.findMany({
    where: { application: scopedApplicationWhere(user) },
    include: {
      scholarship: true,
      sponsor: true,
      programme: { include: { faculty: true } },
      application: { include: { country: true, programme: { include: { faculty: true } } } },
    },
    orderBy: { enrolmentDate: "desc" },
  });

  const rows = enrolments.map((enrolment) => {
    const programme = enrolment.programme || enrolment.application.programme;
    return {
      enrolmentId: enrolment.id,
      enrolmentDate: enrolment.enrolmentDate,
      applicantName: enrolment.application.applicantName,
      country: enrolment.application.country?.name || "",
      faculty: programme?.faculty?.name || "",
      programme: programme?.name || "",
      revenueType: enrolment.revenueType,
      scholarship: enrolment.scholarship?.name || "",
      sponsor: enrolment.sponsor?.name || "",
      grossTuitionMyr: round(enrolment.grossTuitionMyr),
      scholarshipMyr: round(enrolment.scholarshipMyr),
      netTuitionMyr: round(enrolment.netTuitionMyr),
      revenueBasis: enrolment.revenueBasis,
    };
  });

  return {
    summary: {
      enrolments: rows.length,
      grossTuitionMyr: round(sumNumbers(rows, "grossTuitionMyr")),
      scholarshipMyr: round(sumNumbers(rows, "scholarshipMyr")),
      netTuitionMyr: round(sumNumbers(rows, "netTuitionMyr")),
    },
    rows,
  };
}
