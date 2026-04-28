import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { leadCreateSchema } from "../validators/lead.schema.js";
import { audit } from "../utils/audit.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { scopedLeadWhere } from "../services/dashboard-scope.service.js";

const statusSchema = z.object({
  status: z.enum([
    "NEW",
    "CONTACTED",
    "INTERESTED",
    "APPLIED",
    "OFFERED",
    "ENROLLED",
    "LOST",
    "DUPLICATE",
  ]),
});

const router = Router();
router.use(requireAuth);

router.get(
  "/duplicates",
  asyncHandler(async (_req, res) =>
    res.json(
      await prisma.leadMergeCandidate.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
      }),
    ),
  ),
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
    const { campaignId, ...leadData } = data;
    const lead = await prisma.lead.create({
      data: {
        ...leadData,
        email: leadData.email || null,
        touches: campaignId ? { create: { campaignId } } : undefined,
      },
    });
    await audit(req, "CREATE", "Lead", lead.id, null, lead);
    res.status(201).json(lead);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) =>
    res.json(
      await prisma.lead.findUnique({
        where: { id: req.params.id },
        include: {
          followUps: true,
          applications: true,
          touches: { include: { campaign: true } },
          country: true,
          interestedProgramme: true,
        },
      }),
    ),
  ),
);

router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    return res.json(
      await prisma.lead.update({
        where: { id: req.params.id },
        data: { status },
      }),
    );
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.lead.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.json({ ok: true });
  }),
);

export default router;
