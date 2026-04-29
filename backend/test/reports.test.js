import test from "node:test";
import assert from "node:assert/strict";
import {
  canRoleExportPii,
  conversionRates,
  duplicateLeadRow,
  filterReportPayload,
  filterReportRows,
  reportExportAuditPayload,
  toCsv,
} from "../src/services/report-calculations.service.js";

test("conversionRates computes funnel percentages safely", () => {
  assert.deepEqual(
    conversionRates({ leads: 20, applications: 10, offers: 5, enrolments: 2 }),
    {
      leadToApplicationRate: 50,
      applicationToOfferRate: 50,
      offerToEnrolmentRate: 40,
      overallConversionRate: 10,
    },
  );

  assert.equal(conversionRates({ leads: 0 }).overallConversionRate, 0);
});

test("duplicateLeadRow masks PII unless explicitly requested", () => {
  const candidate = {
    id: "candidate-1",
    status: "PENDING",
    confidence: 0.95,
    reason: "exact_email",
    leadA: {
      fullName: "Jane Roe",
      email: "jane.roe@example.local",
      phone: "60123456789",
      passportNumber: "A1234567",
      country: { name: "Malaysia" },
      interestedProgramme: { name: "MBA" },
    },
    leadB: {
      fullName: "Jane Roe",
      email: "jane.roe@example.local",
      phone: "60123456789",
      passportNumber: "A1234567",
      country: { name: "Malaysia" },
      interestedProgramme: { name: "MBA" },
    },
  };

  const masked = duplicateLeadRow(candidate);
  assert.equal(masked.leadAEmail, "ja******@example.local");
  assert.equal(masked.leadAPhone, "*******6789");

  const raw = duplicateLeadRow(candidate, { includePii: true });
  assert.equal(raw.leadAEmail, "jane.roe@example.local");
  assert.equal(raw.leadAPassport, "A1234567");
});

test("toCsv escapes values and includes sparse row headers", () => {
  const csv = toCsv([
    { name: "Jane Roe", notes: "fair, booth 2" },
    { name: "John Doe", extra: 'said "yes"' },
  ]);

  assert.equal(csv.split("\n")[0], "name,notes,extra");
  assert.match(csv, /"fair, booth 2"/);
  assert.match(csv, /"said ""yes"""/);
});

test("canRoleExportPii honors configured roles and secure defaults", () => {
  assert.equal(
    canRoleExportPii({ "pii.export.allowed_roles": ["SUPER_ADMIN"] }, "CIAC_ADMIN"),
    false,
  );
  assert.equal(
    canRoleExportPii({ "pii.export.allowed_roles": ["SUPER_ADMIN"] }, "SUPER_ADMIN"),
    true,
  );
  assert.equal(canRoleExportPii({}, "CIAC_ADMIN"), true);
  assert.equal(canRoleExportPii({}, "MANAGEMENT"), false);
});

test("filterReportRows applies search and date filters consistently", () => {
  const rows = [
    { name: "Malaysia fair", createdAt: "2026-04-01T08:00:00.000Z" },
    { name: "Indonesia webinar", createdAt: "2026-04-15T08:00:00.000Z" },
    { name: "Malaysia alumni", createdAt: "2026-05-01T08:00:00.000Z" },
  ];

  assert.deepEqual(
    filterReportRows(rows, { q: "malaysia", from: "2026-04-01", to: "2026-04-30" }),
    [rows[0]],
  );
});

test("filterReportPayload preserves report shape while filtering rows or items", () => {
  const reportWithRows = {
    summary: { total: 2 },
    rows: [
      { name: "Alpha", enrolmentDate: "2026-04-01T00:00:00.000Z" },
      { name: "Beta", enrolmentDate: "2026-05-01T00:00:00.000Z" },
    ],
  };
  const reportWithItems = {
    summary: { total: 2 },
    items: [
      { leadName: "Jane", deadline: "2026-04-10T00:00:00.000Z" },
      { leadName: "John", deadline: "2026-04-20T00:00:00.000Z" },
    ],
  };

  assert.equal(filterReportPayload(reportWithRows, { to: "2026-04-30" }).rows.length, 1);
  assert.equal(filterReportPayload(reportWithItems, { q: "john" }).items[0].leadName, "John");
});

test("reportExportAuditPayload records successful and denied export context", () => {
  assert.deepEqual(
    reportExportAuditPayload({
      report: "duplicates",
      rowCount: 3,
      includesPii: true,
      role: "SUPER_ADMIN",
      filters: { q: "jane" },
    }),
    {
      report: "duplicates",
      rowCount: 3,
      includesPii: true,
      role: "SUPER_ADMIN",
      filters: { q: "jane" },
      denied: false,
    },
  );

  assert.equal(
    reportExportAuditPayload({
      report: "scholarship-revenue",
      includesPii: true,
      role: "MANAGEMENT",
      denied: true,
    }).denied,
    true,
  );
});
