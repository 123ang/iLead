import test from "node:test";
import assert from "node:assert/strict";
import { getLeadDeadline, getLeadOverdueState } from "../src/services/sla.service.js";

const settings = {
  "sla.hot.days": 1,
  "sla.warm.days": 3,
  "sla.cold.days": 7,
  "sla.businessDaysOnly": false,
};

test("uses assignedAt plus configured SLA when no follow-up exists", () => {
  const deadline = getLeadDeadline({
    lead: {
      assignedAt: new Date("2025-01-01T10:00:00.000Z"),
      leadQuality: "HOT",
    },
    latestFollowUp: null,
    settings,
  });

  assert.equal(deadline.toISOString(), "2025-01-02T00:00:00.000Z");
});

test("marks lead overdue when next follow-up date is in the past", () => {
  const overdue = getLeadOverdueState({
    lead: {
      status: "INTERESTED",
      assignedAt: new Date("2025-01-01T10:00:00.000Z"),
      leadQuality: "WARM",
    },
    latestFollowUp: {
      nextFollowUpDate: new Date("2025-01-02T00:00:00.000Z"),
    },
    settings,
    now: new Date("2025-01-03T00:00:00.000Z"),
  });

  assert.equal(overdue.overdue, true);
  assert.equal(overdue.reason, "NEXT_FOLLOW_UP");
});

