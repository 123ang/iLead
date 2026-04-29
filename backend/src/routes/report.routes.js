import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { refreshCampaignMetricSnapshots } from "../services/campaign-metric-refresh.service.js";
import {
  countryPerformanceReport,
  duplicateLeadReport,
  facultyPerformanceReport,
  followUpSlaReport,
  programmeConversionReport,
  scholarshipAdjustedRevenueReport,
} from "../services/reports.service.js";
import { getSystemSettingsMap } from "../services/system-setting.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { audit } from "../utils/audit.js";
import { AppError } from "../utils/http.js";
import {
  canRoleExportPii,
  filterReportPayload,
  reportExportAuditPayload,
  toCsv,
} from "../services/report-calculations.service.js";

const router = Router();
router.use(requireAuth);

const reportRoles = [
  "SUPER_ADMIN",
  "MANAGEMENT",
  "CIAC_ADMIN",
  "FACULTY_DEAN",
  "PROGRAMME_COORDINATOR",
  "REGISTRAR",
  "FINANCE",
];
const refreshRoles = ["SUPER_ADMIN", "CIAC_ADMIN"];
const piiReportNames = new Set([
  "follow-up-sla",
  "duplicates",
  "scholarship-revenue",
]);

const reportHandlers = {
  "country-performance": (req) => countryPerformanceReport(req.user),
  "faculty-performance": (req) => facultyPerformanceReport(req.user),
  "programme-conversion": (req) => programmeConversionReport(req.user),
  "follow-up-sla": (req) => followUpSlaReport(req.user),
  duplicates: (_req, includePii) => duplicateLeadReport({ includePii }),
  "scholarship-revenue": (req) => scholarshipAdjustedRevenueReport(req.user),
};

function rowsForReport(report) {
  if (Array.isArray(report)) return report;
  return report.rows || report.items || [];
}

function reportFilters(req) {
  return {
    q: req.query.q || "",
    from: req.query.from || "",
    to: req.query.to || "",
  };
}

async function canExportPii(user) {
  const settings = await getSystemSettingsMap();
  return canRoleExportPii(settings, user.role);
}

function sendCsv(res, name, rows) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="ilead-${name}-${new Date().toISOString().slice(0, 10)}.csv"`,
  );
  res.send(toCsv(rows));
}

for (const [name, handler] of Object.entries(reportHandlers)) {
  router.get(
    `/${name}`,
    requireRole(...reportRoles),
    asyncHandler(async (req, res) => {
      const includePii = name === "duplicates" && req.query.includePii === "true";
      if (includePii && !(await canExportPii(req.user))) {
        await audit(req, "VIEW_PII_DENIED", "Report", name, null, {
          report: name,
          includesPii: true,
          role: req.user.role,
        });
        throw new AppError(403, "PII access is not allowed for this role");
      }
      res.json(filterReportPayload(await handler(req, includePii), reportFilters(req)));
    }),
  );

  router.get(
    `/${name}/export.csv`,
    requireRole(...reportRoles),
    asyncHandler(async (req, res) => {
      const isPii = piiReportNames.has(name);
      const includePii = isPii;
      if (isPii && !(await canExportPii(req.user))) {
        await audit(req, "EXPORT_CSV_DENIED", "Report", name, null, {
          ...reportExportAuditPayload({
            report: name,
            includesPii: true,
            role: req.user.role,
            filters: reportFilters(req),
            denied: true,
          }),
        });
        throw new AppError(403, "PII export is not allowed for this role");
      }

      const report = filterReportPayload(await handler(req, includePii), reportFilters(req));
      const rows = rowsForReport(report);
      await audit(req, "EXPORT_CSV", "Report", name, null, {
        ...reportExportAuditPayload({
          report: name,
          rowCount: rows.length,
          includesPii: isPii,
          role: req.user.role,
          filters: reportFilters(req),
        }),
      });
      sendCsv(res, name, rows);
    }),
  );
}

router.post(
  "/campaign-metrics/refresh",
  requireRole(...refreshRoles),
  asyncHandler(async (req, res) => {
    const result = await refreshCampaignMetricSnapshots({
      campaignId: req.body?.campaignId || null,
      metricDate: req.body?.metricDate ? new Date(req.body.metricDate) : new Date(),
    });
    await audit(req, "REFRESH", "CampaignMetric", req.body?.campaignId || null, null, {
      metricDate: result.metricDate,
      count: result.count,
    });
    res.json(result);
  }),
);

export default router;
