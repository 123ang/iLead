import { Router } from "express";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  followUpCompleteSchema,
  followUpCreateSchema,
  followUpUpdateSchema,
} from "../validators/followup.schema.js";
import { audit } from "../utils/audit.js";
import { AppError } from "../utils/http.js";
import { scopedLeadWhere } from "../services/dashboard-scope.service.js";
import { getSystemSettingsMap } from "../services/system-setting.service.js";
import { getLeadOverdueState } from "../services/sla.service.js";

const mayAssignOthers = ["SUPER_ADMIN", "MANAGEMENT", "CIAC_ADMIN"];

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) =>
    res.json(
      await prisma.followUp.findMany({
        where: { lead: scopedLeadWhere(req.user) },
        take: 100,
        include: { lead: true, staff: true },
        orderBy: { followUpDate: "desc" },
      }),
    ),
  ),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = followUpCreateSchema.parse(req.body);
    const lead = await prisma.lead.findFirst({
      where: { id: data.leadId, ...scopedLeadWhere(req.user) },
      select: { id: true },
    });
    if (!lead) throw new AppError(404, "Lead not found");

    let staffId = req.user.id;
    if (mayAssignOthers.includes(req.user.role)) {
      staffId = data.staffId || req.user.id;
    }

    const created = await prisma.followUp.create({
      data: {
        leadId: data.leadId,
        staffId,
        followUpType: data.followUpType,
        followUpDate: data.followUpDate ?? new Date(),
        nextFollowUpDate: data.nextFollowUpDate,
        outcome: data.outcome,
        notes: data.notes,
      },
    });
    await audit(req, "CREATE", "FollowUp", created.id, null, created);
    res.status(201).json(created);
  }),
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = followUpUpdateSchema.parse(req.body);
    const before = await prisma.followUp.findFirst({
      where: { id: req.params.id, lead: scopedLeadWhere(req.user) },
      include: { lead: true },
    });
    if (!before) throw new AppError(404, "Follow-up not found");

    const updateData = { ...data };
    if (!mayAssignOthers.includes(req.user.role)) delete updateData.staffId;

    const updated = await prisma.followUp.update({
      where: { id: req.params.id },
      data: updateData,
      include: { lead: true, staff: true },
    });
    await audit(req, "UPDATE", "FollowUp", updated.id, before, updated);
    res.json(updated);
  }),
);

router.post(
  "/:id/complete",
  asyncHandler(async (req, res) => {
    const data = followUpCompleteSchema.parse(req.body);
    const before = await prisma.followUp.findFirst({
      where: { id: req.params.id, lead: scopedLeadWhere(req.user) },
      include: { lead: true },
    });
    if (!before) throw new AppError(404, "Follow-up not found");

    const updated = await prisma.followUp.update({
      where: { id: req.params.id },
      data: {
        outcome: data.outcome || before.outcome || "Completed",
        notes: data.notes ?? before.notes,
        nextFollowUpDate: null,
      },
      include: { lead: true, staff: true },
    });
    await audit(req, "COMPLETE", "FollowUp", updated.id, before, updated);
    res.json(updated);
  }),
);

router.get(
  "/overdue",
  asyncHandler(async (req, res) => {
    const [settings, leads] = await Promise.all([
      getSystemSettingsMap(),
      prisma.lead.findMany({
        where: scopedLeadWhere(req.user),
        include: {
          assignedStaff: true,
          followUps: {
            orderBy: { followUpDate: "desc" },
            take: 1,
          },
          touches: { include: { campaign: true } },
        },
      }),
    ]);

    const items = leads
      .map((lead) => {
        const latestFollowUp = lead.followUps[0] ?? null;
        const overdueState = getLeadOverdueState({
          lead,
          latestFollowUp,
          settings,
          now: new Date(),
        });

        return overdueState.overdue
          ? {
              lead,
              latestFollowUp,
              reason: overdueState.reason,
              deadline: overdueState.deadline,
            }
          : null;
      })
      .filter(Boolean);

    await audit(req, "VIEW_OVERDUE", "Lead", null, null, { count: items.length });
    res.json(items);
  }),
);

router.get(
  "/lead/:leadId",
  asyncHandler(async (req, res) => {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.leadId, ...scopedLeadWhere(req.user) },
      select: { id: true },
    });
    if (!lead) throw new AppError(404, "Lead not found");

    res.json(
      await prisma.followUp.findMany({
        where: { leadId: req.params.leadId },
        orderBy: { followUpDate: "desc" },
      }),
    );
  }),
);

export default router;
