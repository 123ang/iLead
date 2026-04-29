import { Router } from "express";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  leadAssignSchema,
  leadCreateSchema,
  leadStatusSchema,
  leadUpdateSchema,
} from "../validators/lead.schema.js";
import { audit } from "../utils/audit.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/http.js";
import { scopedLeadWhere } from "../services/dashboard-scope.service.js";
import {
  createDuplicateCandidatesForLead,
  mergeLeadCandidate,
} from "../services/duplicate-lead.service.js";
import { buildDuplicateReport } from "../services/duplicate-report.service.js";
import {
  leadHasIdentifier,
  normalizeLeadIdentifiers,
} from "../services/lead-identity.service.js";

const router = Router();
const duplicateRoles = [
  "SUPER_ADMIN",
  "MANAGEMENT",
  "CIAC_ADMIN",
  "FACULTY_DEAN",
];
const leadDeleteRoles = ["SUPER_ADMIN", "MANAGEMENT", "CIAC_ADMIN"];
const leadAssignRoles = [
  "SUPER_ADMIN",
  "MANAGEMENT",
  "CIAC_ADMIN",
  "FACULTY_DEAN",
  "PROGRAMME_COORDINATOR",
];

router.use(requireAuth);

router.get(
  "/duplicates",
  requireRole(...duplicateRoles),
  asyncHandler(async (_req, res) =>
    res.json(
      await prisma.leadMergeCandidate.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        include: {
          leadA: true,
          leadB: true,
          reviewer: { select: { id: true, name: true, email: true } },
        },
      }),
    ),
  ),
);

router.get(
  "/duplicates/report",
  requireRole(...duplicateRoles),
  asyncHandler(async (_req, res) => {
    const [candidates, recentPending] = await Promise.all([
      prisma.leadMergeCandidate.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          reason: true,
          confidence: true,
          createdAt: true,
          reviewedAt: true,
        },
      }),
      prisma.leadMergeCandidate.findMany({
        where: { status: "PENDING" },
        take: 10,
        orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
        include: {
          leadA: true,
          leadB: true,
        },
      }),
    ]);

    res.json({
      summary: buildDuplicateReport(candidates),
      recentPending,
    });
  }),
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 50);
    const where = scopedLeadWhere(req.user);
    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          country: true,
          interestedProgramme: true,
          assignedStaff: true,
          touches: { include: { campaign: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.lead.count({ where }),
    ]);
    res.json({ items, total, page, pageSize });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = leadCreateSchema.parse(req.body);
    const normalized = normalizeLeadIdentifiers(data);
    const { campaignId, ...leadData } = normalized;

    const lead = await prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({
        data: {
          ...leadData,
          assignedAt: leadData.assignedStaffId ? new Date() : null,
          touches: campaignId
            ? {
                create: {
                  campaignId,
                  source: leadData.source ?? "MANUAL_ENTRY",
                },
              }
            : undefined,
        },
      });
      await tx.leadStatusHistory.create({
        data: {
          leadId: created.id,
          fromStatus: null,
          toStatus: created.status,
          changedById: req.user.id,
          reason: "Lead created",
        },
      });
      await createDuplicateCandidatesForLead(created.id, tx);
      return created;
    });

    await audit(req, "CREATE", "Lead", lead.id, null, lead);
    res.status(201).json(lead);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, ...scopedLeadWhere(req.user) },
      include: {
        followUps: true,
        applications: {
          include: { offers: true, enrolments: true },
        },
        touches: { include: { campaign: true } },
        country: true,
        interestedProgramme: true,
        statusHistory: {
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { changedAt: "desc" },
        },
        assignedStaff: true,
      },
    });
    if (!lead) throw new AppError(404, "Lead not found");
    res.json(lead);
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = leadUpdateSchema.parse(req.body);
    const current = await prisma.lead.findFirst({
      where: { id: req.params.id, ...scopedLeadWhere(req.user) },
    });
    if (!current) throw new AppError(404, "Lead not found");
    const merged = normalizeLeadIdentifiers({ ...current, ...data });
    if (!leadHasIdentifier(merged)) {
      return res.status(400).json({
        message:
          "Lead must include at least one identifier: email, phone, passportNumber, or externalLeadId",
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const { campaignId, ...leadData } = merged;
      const lead = await tx.lead.update({
        where: { id: req.params.id },
        data: {
          fullName: leadData.fullName,
          email: leadData.email,
          phone: leadData.phone,
          passportNumber: leadData.passportNumber,
          externalLeadId: leadData.externalLeadId,
          countryId: leadData.countryId,
          interestedProgrammeId: leadData.interestedProgrammeId,
          studyLevel: leadData.studyLevel,
          leadQuality: leadData.leadQuality,
          source: leadData.source,
          assignedStaffId: leadData.assignedStaffId,
          assignedAt:
            data.assignedStaffId && data.assignedStaffId !== current.assignedStaffId
              ? new Date()
              : current.assignedAt,
          notes: leadData.notes,
          status: leadData.status,
        },
      });

      if (campaignId) {
        await tx.leadCampaignTouch.upsert({
          where: {
            leadId_campaignId: {
              leadId: req.params.id,
              campaignId,
            },
          },
          update: {
            source: leadData.source ?? "MANUAL_ENTRY",
          },
          create: {
            leadId: req.params.id,
            campaignId,
            source: leadData.source ?? "MANUAL_ENTRY",
          },
        });
      }

      if (current.status !== lead.status) {
        await tx.leadStatusHistory.create({
          data: {
            leadId: lead.id,
            fromStatus: current.status,
            toStatus: lead.status,
            changedById: req.user.id,
            reason: "Lead updated",
          },
        });
      }

      await createDuplicateCandidatesForLead(lead.id, tx);
      return lead;
    });

    await audit(req, "UPDATE", "Lead", updated.id, current, updated);
    res.json(updated);
  }),
);

router.patch(
  "/:id/assign",
  requireRole(...leadAssignRoles),
  asyncHandler(async (req, res) => {
    const { assignedStaffId } = leadAssignSchema.parse(req.body);
    const current = await prisma.lead.findFirst({
      where: { id: req.params.id, ...scopedLeadWhere(req.user) },
    });
    if (!current) throw new AppError(404, "Lead not found");
    const updated = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.update({
        where: { id: req.params.id },
        data: {
          assignedStaffId,
          assignedAt: new Date(),
        },
      });
      await tx.notification.create({
        data: {
          userId: assignedStaffId,
          title: "Lead assigned",
          message: `${lead.fullName} has been assigned to you.`,
          type: "LEAD_ASSIGNED",
          link: `/leads/${lead.id}`,
        },
      });
      return lead;
    });
    await audit(req, "ASSIGN", "Lead", updated.id, current, updated);
    res.json(updated);
  }),
);

router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status, reason } = leadStatusSchema.parse(req.body);
    const current = await prisma.lead.findFirst({
      where: { id: req.params.id, ...scopedLeadWhere(req.user) },
    });
    if (!current) throw new AppError(404, "Lead not found");
    const updated = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.update({
        where: { id: req.params.id },
        data: { status },
      });
      await tx.leadStatusHistory.create({
        data: {
          leadId: lead.id,
          fromStatus: current.status,
          toStatus: status,
          changedById: req.user.id,
          reason: reason ?? null,
        },
      });
      return lead;
    });
    await audit(req, "STATUS_UPDATE", "Lead", updated.id, current, updated);
    res.json(updated);
  }),
);

router.post(
  "/duplicates/:id/merge",
  requireRole(...duplicateRoles),
  asyncHandler(async (req, res) => {
    const merged = await mergeLeadCandidate({
      candidateId: req.params.id,
      reviewerId: req.user.id,
    });
    await audit(req, "MERGE_DUPLICATE", "LeadMergeCandidate", req.params.id, null, merged);
    res.json({ ok: true, merged });
  }),
);

router.post(
  "/duplicates/:id/reject",
  requireRole(...duplicateRoles),
  asyncHandler(async (req, res) => {
    const updated = await prisma.leadMergeCandidate.update({
      where: { id: req.params.id },
      data: {
        status: "NOT_DUPLICATE",
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
    });
    await audit(req, "REJECT_DUPLICATE", "LeadMergeCandidate", updated.id, null, updated);
    res.json(updated);
  }),
);

router.post(
  "/duplicates/:id/ignore",
  requireRole(...duplicateRoles),
  asyncHandler(async (req, res) => {
    const updated = await prisma.leadMergeCandidate.update({
      where: { id: req.params.id },
      data: {
        status: "IGNORED",
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
    });
    await audit(req, "IGNORE_DUPLICATE", "LeadMergeCandidate", updated.id, null, updated);
    res.json(updated);
  }),
);

router.delete(
  "/:id",
  requireRole(...leadDeleteRoles),
  asyncHandler(async (req, res) => {
    const before = await prisma.lead.findFirst({
      where: { id: req.params.id, ...scopedLeadWhere(req.user) },
    });
    if (!before) throw new AppError(404, "Lead not found");
    const deleted = await prisma.lead.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    await audit(req, "SOFT_DELETE", "Lead", req.params.id, before, deleted);
    res.json({ ok: true });
  }),
);

export default router;
