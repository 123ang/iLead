import { Router } from "express";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  campaignCostSchema,
  campaignCreateSchema,
  campaignUpdateSchema,
} from "../validators/campaign.schema.js";
import { campaignRoi } from "../services/metrics.service.js";
import { audit } from "../utils/audit.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { scopedCampaignWhere } from "../services/dashboard-scope.service.js";
import { refreshCampaignActualSpend } from "../services/campaign-cost.service.js";
import { parsePagination } from "../utils/pagination.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, pageSize, skip } = parsePagination(req.query);
    const where = scopedCampaignWhere(req.user);
    const [items, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          countries: { include: { country: true } },
          faculties: { include: { faculty: true } },
          programmes: { include: { programme: true } },
          costs: true,
        },
        orderBy: { startDate: "desc" },
      }),
      prisma.campaign.count({ where }),
    ]);
    res.json({ items, total, page, pageSize });
  }),
);

router.post(
  "/",
  requireRole("SUPER_ADMIN", "MANAGEMENT", "CIAC_ADMIN"),
  asyncHandler(async (req, res) => {
    const data = campaignCreateSchema.parse(req.body);
    const created = await prisma.campaign.create({
      data: {
        name: data.name,
        campaignType: data.campaignType,
        startDate: data.startDate,
        endDate: data.endDate,
        objective: data.objective ?? undefined,
        status: data.status ?? undefined,
        approvedBudgetMyr: data.approvedBudgetMyr ?? 0,
        countries: {
          create: (data.countryIds || []).map((countryId) => ({ countryId })),
        },
        faculties: {
          create: (data.facultyIds || []).map((facultyId) => ({ facultyId })),
        },
        programmes: {
          create: (data.programmeIds || []).map((programmeId) => ({
            programmeId,
          })),
        },
      },
    });
    await audit(req, "CREATE", "Campaign", created.id, null, created);
    res.status(201).json(created);
  }),
);

router.patch(
  "/:id",
  requireRole("SUPER_ADMIN", "MANAGEMENT", "CIAC_ADMIN"),
  asyncHandler(async (req, res) => {
    const data = campaignUpdateSchema.parse(req.body);
    const before = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { countries: true, faculties: true, programmes: true },
    });

    const updated = await prisma.$transaction(async (tx) => {
      if (data.countryIds) {
        await tx.campaignCountry.deleteMany({ where: { campaignId: req.params.id } });
      }
      if (data.facultyIds) {
        await tx.campaignFaculty.deleteMany({ where: { campaignId: req.params.id } });
      }
      if (data.programmeIds) {
        await tx.campaignProgramme.deleteMany({ where: { campaignId: req.params.id } });
      }

      return tx.campaign.update({
        where: { id: req.params.id },
        data: {
          name: data.name,
          campaignType: data.campaignType,
          startDate: data.startDate,
          endDate: data.endDate,
          objective: data.objective,
          status: data.status,
          approvedBudgetMyr: data.approvedBudgetMyr,
          countries: data.countryIds
            ? { create: data.countryIds.map((countryId) => ({ countryId })) }
            : undefined,
          faculties: data.facultyIds
            ? { create: data.facultyIds.map((facultyId) => ({ facultyId })) }
            : undefined,
          programmes: data.programmeIds
            ? {
                create: data.programmeIds.map((programmeId) => ({
                  programmeId,
                })),
              }
            : undefined,
        },
        include: {
          countries: { include: { country: true } },
          faculties: { include: { faculty: true } },
          programmes: { include: { programme: true } },
        },
      });
    });

    await audit(req, "UPDATE", "Campaign", updated.id, before, updated);
    res.json(updated);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) =>
    res.json(
      await prisma.campaign.findUnique({
        where: { id: req.params.id },
        include: {
          countries: { include: { country: true } },
          faculties: { include: { faculty: true } },
          programmes: { include: { programme: true } },
          costs: true,
          leadTouches: true,
          metrics: { orderBy: { metricDate: "desc" }, take: 30 },
        },
      }),
    ),
  ),
);

router.get(
  "/:id/roi",
  asyncHandler(async (req, res) =>
    res.json(await campaignRoi(req.params.id, req.user)),
  ),
);

router.delete(
  "/:id",
  requireRole("SUPER_ADMIN", "MANAGEMENT", "CIAC_ADMIN"),
  asyncHandler(async (req, res) => {
    const before = await prisma.campaign.findUnique({
      where: { id: req.params.id },
    });
    const deleted = await prisma.campaign.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    await audit(req, "SOFT_DELETE", "Campaign", deleted.id, before, deleted);
    res.json({ ok: true });
  }),
);

router.post(
  "/:id/costs",
  requireRole("SUPER_ADMIN", "CIAC_ADMIN", "FINANCE"),
  asyncHandler(async (req, res) => {
    const data = campaignCostSchema.parse(req.body);
    const created = await prisma.$transaction(async (tx) => {
      const cost = await tx.campaignCost.create({
        data: {
          campaignId: req.params.id,
          currencyId: data.currencyId,
          costType: data.costType,
          description: data.description ?? null,
          amountOriginal: data.amountOriginal,
          fxRateToMyr: data.fxRateToMyr,
          amountMyr: data.amountMyr ?? data.amountOriginal * data.fxRateToMyr,
          costDate: data.costDate ?? new Date(),
        },
      });
      await refreshCampaignActualSpend(req.params.id, tx);
      return cost;
    });

    await audit(req, "CREATE_COST", "CampaignCost", created.id, null, created);
    res.status(201).json(created);
  }),
);

router.patch(
  "/:id/costs/:costId",
  requireRole("SUPER_ADMIN", "CIAC_ADMIN", "FINANCE"),
  asyncHandler(async (req, res) => {
    const data = campaignCostSchema.parse(req.body);
    const before = await prisma.campaignCost.findUnique({
      where: { id: req.params.costId },
    });

    const updated = await prisma.$transaction(async (tx) => {
      const cost = await tx.campaignCost.update({
        where: { id: req.params.costId },
        data: {
          currencyId: data.currencyId,
          costType: data.costType,
          description: data.description ?? null,
          amountOriginal: data.amountOriginal,
          fxRateToMyr: data.fxRateToMyr,
          amountMyr: data.amountMyr ?? data.amountOriginal * data.fxRateToMyr,
          costDate: data.costDate ?? new Date(),
        },
      });
      await refreshCampaignActualSpend(req.params.id, tx);
      return cost;
    });

    await audit(req, "UPDATE_COST", "CampaignCost", updated.id, before, updated);
    res.json(updated);
  }),
);

router.delete(
  "/:id/costs/:costId",
  requireRole("SUPER_ADMIN", "CIAC_ADMIN", "FINANCE"),
  asyncHandler(async (req, res) => {
    const before = await prisma.campaignCost.findUnique({
      where: { id: req.params.costId },
    });
    await prisma.$transaction(async (tx) => {
      await tx.campaignCost.delete({ where: { id: req.params.costId } });
      await refreshCampaignActualSpend(req.params.id, tx);
    });
    await audit(req, "DELETE_COST", "CampaignCost", req.params.costId, before, null);
    res.json({ ok: true });
  }),
);

export default router;
