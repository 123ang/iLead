import test from "node:test";
import assert from "node:assert/strict";
import {
  isGlobalDashboardRole,
  scopedCampaignWhere,
  scopedLeadWhere,
} from "../src/services/dashboard-scope.service.js";

test("isGlobalDashboardRole recognizes global roles", () => {
  assert.equal(isGlobalDashboardRole("SUPER_ADMIN"), true);
  assert.equal(isGlobalDashboardRole("CIAC_ADMIN"), true);
  assert.equal(isGlobalDashboardRole("STAFF"), false);
});

test("scopedLeadWhere limits staff to their assigned leads", () => {
  assert.deepEqual(scopedLeadWhere({ role: "STAFF", id: "staff-1" }), {
    deletedAt: null,
    assignedStaffId: "staff-1",
  });
});

test("scopedLeadWhere limits faculty roles to programme or campaign faculty visibility", () => {
  const where = scopedLeadWhere({
    role: "FACULTY_DEAN",
    facultyId: "faculty-1",
  });

  assert.equal(where.deletedAt, null);
  assert.equal(where.OR.length, 2);
  assert.deepEqual(where.OR[0], { interestedProgramme: { facultyId: "faculty-1" } });
});

test("scopedCampaignWhere limits staff campaigns to assigned-lead touches", () => {
  assert.deepEqual(scopedCampaignWhere({ role: "STAFF", id: "staff-1" }), {
    deletedAt: null,
    leadTouches: {
      some: { lead: { deletedAt: null, assignedStaffId: "staff-1" } },
    },
  });
});
