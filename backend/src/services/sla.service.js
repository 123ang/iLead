import { addDays } from "../utils/time.js";

const ACTIVE_STATUSES = new Set(["NEW", "CONTACTED", "INTERESTED"]);

function midnight(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addBusinessDays(date, days) {
  const cursor = new Date(date);
  let remaining = Number(days);
  while (remaining > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return cursor;
}

export function getSlaDays(settings, quality) {
  const map = {
    HOT: Number(settings["sla.hot.days"] ?? 1),
    WARM: Number(settings["sla.warm.days"] ?? 3),
    COLD: Number(settings["sla.cold.days"] ?? 7),
  };
  return map[quality] ?? map.WARM;
}

export function getLeadDeadline({ lead, latestFollowUp, settings }) {
  if (!lead?.assignedAt) return null;
  if (latestFollowUp?.nextFollowUpDate) {
    return new Date(latestFollowUp.nextFollowUpDate);
  }

  const assignedAt = midnight(new Date(lead.assignedAt));
  const slaDays = getSlaDays(settings, lead.leadQuality);
  return settings["sla.businessDaysOnly"]
    ? addBusinessDays(assignedAt, slaDays)
    : addDays(assignedAt, slaDays);
}

export function getLeadOverdueState({ lead, latestFollowUp, settings, now = new Date() }) {
  if (!lead || !ACTIVE_STATUSES.has(lead.status)) {
    return { overdue: false, reason: null, deadline: null };
  }

  if (latestFollowUp?.nextFollowUpDate) {
    const deadline = new Date(latestFollowUp.nextFollowUpDate);
    return {
      overdue: deadline < now,
      reason: "NEXT_FOLLOW_UP",
      deadline,
    };
  }

  if (!lead.assignedAt) {
    return { overdue: false, reason: null, deadline: null };
  }

  const deadline = getLeadDeadline({ lead, latestFollowUp, settings });
  return {
    overdue: deadline < now,
    reason: "ASSIGNMENT_SLA",
    deadline,
  };
}

