import test from "node:test";
import assert from "node:assert/strict";
import { calculateRoi, safeDiv } from "../src/services/roi.service.js";

test("safeDiv returns zero when denominator is zero", () => {
  assert.equal(safeDiv(10, 0), 0);
});

test("calculateRoi computes first-year and full-programme ROI fields", () => {
  const roi = calculateRoi({
    leads: 50,
    applications: 15,
    offers: 9,
    enrolments: 4,
    spend: 20000,
    tuitionRevenue: 44000,
    scholarship: 5000,
    fullProgrammeRevenue: 88000,
  });

  assert.equal(roi.totalLeads, 50);
  assert.equal(roi.netRevenue, 39000);
  assert.equal(Number(roi.roiRatio.toFixed(2)), 1.95);
  assert.equal(Number(roi.fullProgrammeRoiRatio.toFixed(2)), 4.4);
});

