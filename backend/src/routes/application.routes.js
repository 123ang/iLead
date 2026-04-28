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
  assertUploadType,
  buildUploadBatchSummary,
  parseCsvBuffer,
} from "../services/upload.service.js";
import {
  normalizeEmail,
  normalizePassport,
  normalizePhone,
} from "../services/lead-identity.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
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

router.get(
  "/",
  asyncHandler(async (_req, res) =>
    res.json(
      await prisma.application.findMany({
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
  asyncHandler(async (req, res) => {
    const data = applicationUpdateSchema.parse(req.body);
    const current = await prisma.application.findUnique({ where: { id: req.params.id } });
    const updated = await prisma.application.update({
      where: { id: req.params.id },
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
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required." });
    }

    assertUploadType("APPLICATIONS");
    const parsedRows = parseCsvBuffer(req.file.buffer);
    const references = await buildReferenceMaps();
    const batch = await prisma.uploadBatch.create({
      data: {
        type: "APPLICATIONS",
        fileName: req.file.originalname,
        uploadedBy: req.user.id,
        status: "PROCESSING",
      },
    });

    const processedRows = [];
    for (const row of parsedRows) {
      const normalized = normalizeUploadRow(row.data, references);
      const parsed = applicationCreateSchema.safeParse(normalized);
      if (!parsed.success) {
        processedRows.push({
          rowNumber: row.rowNumber,
          rawData: row.data,
          normalizedData: normalized,
          status: "FAILED",
          errors: parsed.error.issues.map((issue) => issue.message),
        });
        continue;
      }

      const match = await matchApplicationToLead(parsed.data);
      const application = await prisma.application.create({
        data: {
          ...parsed.data,
          uploadBatchId: batch.id,
          leadId: match.status === "matched" ? match.lead.id : null,
        },
      });
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: null,
          toStatus: application.applicationStatus,
          changedById: req.user.id,
          reason: "Upload import",
        },
      });
      await syncApplicationOutcomeRecords(application.id);

      processedRows.push({
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

    const summary = buildUploadBatchSummary(processedRows);
    await prisma.$transaction([
      prisma.uploadBatchRow.createMany({
        data: processedRows.map((row) => ({
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
      }),
      prisma.uploadBatch.update({
        where: { id: batch.id },
        data: {
          ...summary,
          completedAt: new Date(),
        },
      }),
    ]);

    await audit(req, "UPLOAD", "UploadBatch", batch.id, null, summary);
    res.status(201).json({
      batchId: batch.id,
      ...summary,
      rows: processedRows,
    });
  }),
);

router.post(
  "/match-leads",
  asyncHandler(async (req, res) => {
    const batchId = req.body?.batchId || null;
    const applications = await prisma.application.findMany({
      where: {
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
  asyncHandler(async (_req, res) =>
    res.json(
      await prisma.application.findMany({
        where: { leadId: null, deletedAt: null },
        include: { uploadBatch: true },
      }),
    ),
  ),
);

export default router;
