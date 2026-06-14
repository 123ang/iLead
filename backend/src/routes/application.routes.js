import { Router } from "express";
import multer from "multer";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  applicationCreateSchema,
  applicationUpdateSchema,
} from "../validators/application.schema.js";
import { audit } from "../utils/audit.js";
import { syncApplicationOutcomeRecords } from "../services/application-outcome.service.js";
import { matchApplicationToLead } from "../services/application-matching.service.js";
import {
  APPLICATION_UPLOAD_FILE_LIMIT_BYTES,
  assertUploadType,
  buildUploadBatchSummary,
  parseCsvBuffer,
} from "../services/upload.service.js";
import {
  normalizeEmail,
  normalizePassport,
  normalizePhone,
} from "../services/lead-identity.service.js";
import { requireRole } from "../middleware/role.middleware.js";
import { scopedApplicationWhere } from "../services/dashboard-scope.service.js";
import { AppError } from "../utils/http.js";

const router = Router();
const applicationManagerRoles = [
  "SUPER_ADMIN",
  "MANAGEMENT",
  "CIAC_ADMIN",
  "REGISTRAR",
];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: APPLICATION_UPLOAD_FILE_LIMIT_BYTES,
    files: 1,
  },
  fileFilter(_req, file, callback) {
    const originalName = String(file.originalname || "").toLowerCase();
    const isCsvName = originalName.endsWith(".csv");
    const allowedMimeTypes = new Set([
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "text/plain",
      "application/octet-stream",
    ]);
    if (isCsvName && allowedMimeTypes.has(String(file.mimetype || ""))) {
      callback(null, true);
      return;
    }
    callback(new AppError(400, "Only CSV uploads are supported."));
  },
});
router.use(requireAuth);

async function buildReferenceMaps() {
  const [countries, programmes, campaigns] = await Promise.all([
    prisma.country.findMany(),
    prisma.programme.findMany(),
    prisma.campaign.findMany({ where: { deletedAt: null } }),
  ]);

  return {
    countriesByKey: new Map(
      countries.flatMap((country) => [
        [country.name.toLowerCase(), country.id],
        [String(country.iso2 || "").toLowerCase(), country.id],
        [String(country.iso3 || "").toLowerCase(), country.id],
      ]),
    ),
    programmesByKey: new Map(
      programmes.flatMap((programme) => [
        [String(programme.code || "").toLowerCase(), programme.id],
        [programme.name.toLowerCase(), programme.id],
      ]),
    ),
    campaignsByKey: new Map(
      campaigns.map((campaign) => [campaign.name.toLowerCase(), campaign.id]),
    ),
  };
}

function normalizeUploadRow(row, references) {
  const countryKey = String(row.country || row.countryCode || row.countryId || "")
    .trim()
    .toLowerCase();
  const programmeKey = String(
    row.programmeCode || row.programme || row.programmeId || "",
  )
    .trim()
    .toLowerCase();
  const campaignKey = String(
    row.sourceCampaign || row.sourceCampaignId || "",
  )
    .trim()
    .toLowerCase();

  return {
    applicantName: String(row.applicantName || row.name || "").trim(),
    email: normalizeEmail(row.email),
    phone: normalizePhone(row.phone),
    passportNumber: normalizePassport(row.passportNumber),
    countryId: references.countriesByKey.get(countryKey) || row.countryId || null,
    programmeId:
      references.programmesByKey.get(programmeKey) || row.programmeId || null,
    studyLevel: row.studyLevel || null,
    applicationStatus: row.applicationStatus || "APPLIED",
    applicationDate: row.applicationDate ? new Date(row.applicationDate) : null,
    offerDate: row.offerDate ? new Date(row.offerDate) : null,
    enrolmentDate: row.enrolmentDate ? new Date(row.enrolmentDate) : null,
    sourceCampaignId:
      references.campaignsByKey.get(campaignKey) || row.sourceCampaignId || null,
    sourceRaw: row.sourceRaw || null,
    scholarshipMyr: row.scholarshipMyr ? Number(row.scholarshipMyr) : 0,
    tuitionRevenueMyr: row.tuitionRevenueMyr ? Number(row.tuitionRevenueMyr) : 0,
  };
}

function applyColumnMapping(rowData, columnMapping) {
  if (!columnMapping || typeof columnMapping !== "object") return rowData;
  const mapped = { ...rowData };

  // columnMapping is { internalKey: headerName }
  for (const [internalKey, headerName] of Object.entries(columnMapping)) {
    const header = String(headerName ?? "").trim();
    if (!header) continue;
    if (Object.prototype.hasOwnProperty.call(rowData, header)) {
      mapped[internalKey] = rowData[header];
    }
  }

  return mapped;
}

router.get(
  "/",
  asyncHandler(async (req, res) =>
    res.json(
      await prisma.application.findMany({
        where: scopedApplicationWhere(req.user),
        take: 100,
        include: {
          lead: true,
          programme: true,
          country: true,
          offers: true,
          enrolments: true,
          uploadBatch: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ),
  ),
);

router.post(
  "/",
  requireRole(...applicationManagerRoles),
  asyncHandler(async (req, res) => {
    const data = applicationCreateSchema.parse(req.body);
    const created = await prisma.application.create({
      data: {
        ...data,
        email: data.email === "" || data.email === null ? null : data.email,
        phone: normalizePhone(data.phone),
        passportNumber: normalizePassport(data.passportNumber),
      },
    });
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: created.id,
        fromStatus: null,
        toStatus: created.applicationStatus,
        changedById: req.user.id,
        reason: "Application created",
      },
    });
    await syncApplicationOutcomeRecords(created.id);
    await audit(req, "CREATE", "Application", created.id, null, created);
    res.status(201).json(created);
  }),
);

router.patch(
  "/:id",
  requireRole(...applicationManagerRoles),
  asyncHandler(async (req, res) => {
    const data = applicationUpdateSchema.parse(req.body);
    const current = await prisma.application.findFirst({
      where: {
        id: req.params.id,
        ...scopedApplicationWhere(req.user),
      },
    });
    if (!current) throw new AppError(404, "Application not found");

    const updated = await prisma.application.update({
      where: { id: current.id },
      data: {
        ...data,
        email:
          data.email === undefined
            ? undefined
            : data.email === "" || data.email === null
              ? null
              : data.email,
        phone: data.phone === undefined ? undefined : normalizePhone(data.phone),
        passportNumber:
          data.passportNumber === undefined
            ? undefined
            : normalizePassport(data.passportNumber),
      },
    });
    if (data.applicationStatus && data.applicationStatus !== current.applicationStatus) {
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: updated.id,
          fromStatus: current.applicationStatus,
          toStatus: data.applicationStatus,
          changedById: req.user.id,
          reason: data.reason ?? null,
        },
      });
    }
    await syncApplicationOutcomeRecords(updated.id);
    await audit(req, "UPDATE", "Application", updated.id, current, updated);
    res.json(updated);
  }),
);

router.post(
  "/upload",
  requireRole(...applicationManagerRoles),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "File is required." });
    }

    assertUploadType("APPLICATIONS");
    const originalName = String(req.file.originalname || "");
    const parsedRows = parseCsvBuffer(req.file.buffer);

    // columnMapping is optional JSON string from the client.
    let columnMapping = null;
    if (req.body?.columnMapping) {
      try {
        columnMapping = JSON.parse(req.body.columnMapping);
      } catch {
        columnMapping = null;
      }
    }

    const references = await buildReferenceMaps();
    const { batchId, summary, rows: processedRows } = await prisma.$transaction(
      async (tx) => {
        const batch = await tx.uploadBatch.create({
          data: {
            type: "APPLICATIONS",
            fileName: originalName,
            uploadedBy: req.user.id,
            status: "PROCESSING",
          },
        });

        const rows = [];
        for (const row of parsedRows) {
          const mapped = applyColumnMapping(row.data, columnMapping);
          const normalized = normalizeUploadRow(mapped, references);
          const parsed = applicationCreateSchema.safeParse(normalized);

          if (!parsed.success) {
            rows.push({
              rowNumber: row.rowNumber,
              rawData: row.data,
              normalizedData: normalized,
              status: "FAILED",
              errors: parsed.error.issues.map((issue) => issue.message),
            });
            continue;
          }

          const match = await matchApplicationToLead(parsed.data, tx);
          const application = await tx.application.create({
            data: {
              ...parsed.data,
              uploadBatchId: batch.id,
              leadId: match.status === "matched" ? match.lead.id : null,
            },
          });

          await tx.applicationStatusHistory.create({
            data: {
              applicationId: application.id,
              fromStatus: null,
              toStatus: application.applicationStatus,
              changedById: req.user.id,
              reason: "Upload import",
            },
          });

          await syncApplicationOutcomeRecords(application.id, tx);

          rows.push({
            rowNumber: row.rowNumber,
            rawData: row.data,
            normalizedData: parsed.data,
            status:
              match.status === "conflict"
                ? "CONFLICT"
                : match.status === "matched"
                  ? "MATCHED"
                  : "CREATED",
            errors: match.status === "conflict" ? [match.reason] : [],
            result: match,
            applicationId: application.id,
            leadId: match.status === "matched" ? match.lead.id : null,
          });
        }

        const summary = buildUploadBatchSummary(rows);

        await tx.uploadBatchRow.createMany({
          data: rows.map((row) => ({
            uploadBatchId: batch.id,
            rowNumber: row.rowNumber,
            rawData: row.rawData,
            normalizedData: row.normalizedData ?? null,
            status: row.status,
            errors: row.errors?.length ? row.errors : null,
            result: row.result ?? null,
            leadId: row.leadId ?? null,
            applicationId: row.applicationId ?? null,
          })),
        });

        await tx.uploadBatch.update({
          where: { id: batch.id },
          data: {
            ...summary,
            completedAt: new Date(),
          },
        });

        return { batchId: batch.id, summary, rows };
      },
    );

    await audit(req, "UPLOAD", "UploadBatch", batchId, null, summary);
    res.status(201).json({ batchId, ...summary, rows: processedRows });
  }),
);

// Conflict queue: list and manual resolution.
router.get(
  "/upload/:batchId/conflicts",
  requireRole(...applicationManagerRoles),
  asyncHandler(async (req, res) => {
    const items = await prisma.uploadBatchRow.findMany({
      where: { uploadBatchId: req.params.batchId, status: "CONFLICT" },
      orderBy: { rowNumber: "asc" },
      select: {
        id: true,
        rowNumber: true,
        applicationId: true,
        rawData: true,
        normalizedData: true,
        status: true,
        errors: true,
        leadId: true,
        result: true,
      },
    });
    res.json({ items });
  }),
);

router.post(
  "/upload/:batchId/conflicts/resolve",
  requireRole("SUPER_ADMIN", "CIAC_ADMIN"),
  asyncHandler(async (req, res) => {
    const { applicationId, chosenLeadId } = req.body || {};
    if (!applicationId || !chosenLeadId) {
      return res.status(400).json({ message: "applicationId and chosenLeadId are required." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.uploadBatchRow.findFirst({
        where: { applicationId, uploadBatchId: req.params.batchId },
      });
      if (!row) throw new Error("Conflict row not found.");
      if (row.status !== "CONFLICT") throw new Error("Row is not a conflict.");

      const chosenLead = await tx.lead.findUnique({ where: { id: chosenLeadId } });
      if (!chosenLead) throw new Error("Chosen lead not found.");

      const before = row.result;

      const updatedApplication = await tx.application.update({
        where: { id: applicationId },
        data: { leadId: chosenLeadId },
      });

      await tx.applicationStatusHistory.create({
        data: {
          applicationId: updatedApplication.id,
          fromStatus: updatedApplication.applicationStatus,
          toStatus: updatedApplication.applicationStatus,
          changedById: req.user.id,
          reason: "Manual conflict resolution",
        },
      });

      const newResult = {
        status: "matched",
        reason: "MANUAL_REVIEW",
        lead: chosenLead,
      };

      const updatedRow = await tx.uploadBatchRow.update({
        where: { id: row.id },
        data: {
          status: "MATCHED",
          leadId: chosenLeadId,
          errors: null,
          result: newResult,
        },
      });

      await syncApplicationOutcomeRecords(updatedApplication.id, tx);

      return { updatedRow, before, newResult };
    });

    // audit best-effort outside tx
    await audit(req, "RESOLVE_CONFLICT", "UploadBatchRow", result.updatedRow.id, result.before, result.newResult);
    res.json({ ok: true });
  }),
);

router.post(
  "/upload/:batchId/rollback",
  requireRole("SUPER_ADMIN", "CIAC_ADMIN"),
  asyncHandler(async (req, res) => {
    const batchId = req.params.batchId;

    await prisma.$transaction(async (tx) => {
      await tx.application.deleteMany({ where: { uploadBatchId: batchId } });
      await tx.uploadBatchRow.deleteMany({ where: { uploadBatchId: batchId } });
      await tx.uploadBatch.delete({ where: { id: batchId } });
    });

    await audit(req, "ROLLBACK_UPLOAD", "UploadBatch", batchId, null, { batchId });
    res.json({ ok: true });
  }),
);

router.post(
  "/match-leads",
  requireRole(...applicationManagerRoles),
  asyncHandler(async (req, res) => {
    const batchId = req.body?.batchId || null;
    const applications = await prisma.application.findMany({
      where: {
        ...scopedApplicationWhere(req.user),
        deletedAt: null,
        leadId: null,
        uploadBatchId: batchId ?? undefined,
      },
    });

    const results = [];
    for (const application of applications) {
      const match = await matchApplicationToLead(application);
      if (match.status === "matched") {
        await prisma.application.update({
          where: { id: application.id },
          data: { leadId: match.lead.id },
        });
      }
      await prisma.uploadBatchRow.updateMany({
        where: { applicationId: application.id },
        data: {
          status:
            match.status === "matched"
              ? "MATCHED"
              : match.status === "conflict"
                ? "CONFLICT"
                : "SKIPPED",
          result: match,
          leadId: match.status === "matched" ? match.lead.id : null,
          errors: match.status === "conflict" ? [match.reason] : null,
        },
      });
      results.push({
        applicationId: application.id,
        status: match.status,
        reason: match.reason,
        leadId: match.lead?.id ?? null,
      });
    }

    await audit(req, "MATCH_LEADS", "Application", batchId, null, {
      count: results.length,
      results,
    });
    res.json({ ok: true, count: results.length, results });
  }),
);

router.get(
  "/unmatched",
  asyncHandler(async (req, res) =>
    res.json(
      await prisma.application.findMany({
        where: {
          ...scopedApplicationWhere(req.user),
          leadId: null,
          deletedAt: null,
        },
        include: { uploadBatch: true },
      }),
    ),
  ),
);

export default router;
