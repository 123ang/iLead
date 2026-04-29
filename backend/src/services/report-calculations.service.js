import { safeDiv } from "./roi.service.js";

export function round(value, precision = 2) {
  return Number(Number(value || 0).toFixed(precision));
}

export function sumNumbers(rows, key) {
  return rows.reduce((total, row) => total + Number(row?.[key] || 0), 0);
}

export function conversionRates({ leads = 0, applications = 0, offers = 0, enrolments = 0 }) {
  return {
    leadToApplicationRate: round(safeDiv(applications, leads) * 100),
    applicationToOfferRate: round(safeDiv(offers, applications) * 100),
    offerToEnrolmentRate: round(safeDiv(enrolments, offers) * 100),
    overallConversionRate: round(safeDiv(enrolments, leads) * 100),
  };
}

export function maskEmail(value) {
  if (!value) return "";
  const [name, domain] = String(value).split("@");
  if (!domain) return "***";
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

export function maskIdentifier(value) {
  if (!value) return "";
  const raw = String(value);
  if (raw.length <= 4) return "*".repeat(raw.length);
  return `${"*".repeat(raw.length - 4)}${raw.slice(-4)}`;
}

export function duplicateLeadRow(candidate, { includePii = false } = {}) {
  const leadA = candidate.leadA || {};
  const leadB = candidate.leadB || {};
  return {
    id: candidate.id,
    status: candidate.status,
    confidence: Number(candidate.confidence || 0),
    reason: candidate.reason,
    leadAName: includePii ? leadA.fullName : maskIdentifier(leadA.fullName),
    leadBName: includePii ? leadB.fullName : maskIdentifier(leadB.fullName),
    leadAEmail: includePii ? leadA.email || "" : maskEmail(leadA.email),
    leadBEmail: includePii ? leadB.email || "" : maskEmail(leadB.email),
    leadAPhone: includePii ? leadA.phone || "" : maskIdentifier(leadA.phone),
    leadBPhone: includePii ? leadB.phone || "" : maskIdentifier(leadB.phone),
    leadAPassport: includePii
      ? leadA.passportNumber || ""
      : maskIdentifier(leadA.passportNumber),
    leadBPassport: includePii
      ? leadB.passportNumber || ""
      : maskIdentifier(leadB.passportNumber),
    leadACountry: leadA.country?.name || "",
    leadBCountry: leadB.country?.name || "",
    leadAProgramme: leadA.interestedProgramme?.name || "",
    leadBProgramme: leadB.interestedProgramme?.name || "",
    createdAt: candidate.createdAt,
  };
}

export function canRoleExportPii(settings, role) {
  const configured = settings?.["pii.export.allowed_roles"];
  const allowed = Array.isArray(configured) ? configured : ["SUPER_ADMIN", "CIAC_ADMIN"];
  return allowed.includes(role);
}

function rowDateValue(row) {
  return row.createdAt || row.enrolmentDate || row.deadline || row.metricDate || null;
}

export function filterReportRows(rows, { q = "", from = "", to = "" } = {}) {
  const query = String(q || "").trim().toLowerCase();
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(`${to}T23:59:59.999`) : null;

  return rows.filter((row) => {
    if (query && !JSON.stringify(row).toLowerCase().includes(query)) return false;

    const value = rowDateValue(row);
    if (!value || (!fromDate && !toDate)) return true;

    const rowDate = new Date(value);
    if (Number.isNaN(rowDate.getTime())) return true;
    if (fromDate && rowDate < fromDate) return false;
    if (toDate && rowDate > toDate) return false;
    return true;
  });
}

export function filterReportPayload(report, filters = {}) {
  if (Array.isArray(report)) return filterReportRows(report, filters);
  if (Array.isArray(report?.rows)) return { ...report, rows: filterReportRows(report.rows, filters) };
  if (Array.isArray(report?.items)) {
    return { ...report, items: filterReportRows(report.items, filters) };
  }
  return report;
}

export function reportExportAuditPayload({
  report,
  rowCount = 0,
  includesPii = false,
  role = "",
  filters = {},
  denied = false,
} = {}) {
  return {
    report,
    rowCount,
    includesPii,
    role,
    filters,
    denied,
  };
}

export function toCsv(rows) {
  if (!rows.length) return "";
  const headers = [
    ...rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set()),
  ];
  const escape = (value) => {
    if (value == null) return "";
    const raw = value instanceof Date ? value.toISOString() : String(value);
    return /[",\n\r]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join(
    "\n",
  );
}
