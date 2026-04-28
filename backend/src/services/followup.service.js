import { prisma } from "../config/db.js";
import { getSetting } from "./settings.service.js";

export const listFollowUps = async () =>
  prisma.followUp.findMany({
    include: {
      lead: true,
      staff: { select: { id: true, name: true, email: true } },
    },
    orderBy: { followUpDate: "desc" },
  });

export const createFollowUp = async (payload) =>
  prisma.followUp.create({
    data: {
      ...payload,
      followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : new Date(),
      nextFollowUpDate: payload.nextFollowUpDate ? new Date(payload.nextFollowUpDate) : null,
    },
    include: {
      lead: true,
      staff: { select: { id: true, name: true, email: true } },
    },
  });

export const listLeadFollowUps = async (leadId) =>
  prisma.followUp.findMany({
    where: { leadId },
    include: { staff: { select: { id: true, name: true } } },
    orderBy: { followUpDate: "desc" },
  });

export const listOverdueLeads = async () => {
  const leads = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      status: { in: ["NEW", "CONTACTED", "INTERESTED"] },
      assignedAt: { not: null },
    },
    include: {
      followUps: { orderBy: { followUpDate: "desc" }, take: 1 },
      assignedStaff: { select: { id: true, name: true } },
    },
  });

  const [hotDays, warmDays, coldDays] = await Promise.all([
    getSetting("sla.hot.days"),
    getSetting("sla.warm.days"),
    getSetting("sla.cold.days"),
  ]);

  const slaMap = { HOT: Number(hotDays), WARM: Number(warmDays), COLD: Number(coldDays) };
  const now = Date.now();

  return leads.filter((lead) => {
    const latestFollowUp = lead.followUps[0];
    if (latestFollowUp?.nextFollowUpDate) {
      return new Date(latestFollowUp.nextFollowUpDate).getTime() < now;
    }

    const assignedAt = new Date(lead.assignedAt).getTime();
    const thresholdMs = (slaMap[lead.leadQuality] || 3) * 24 * 60 * 60 * 1000;
    return !latestFollowUp && now - assignedAt > thresholdMs;
  });
};
