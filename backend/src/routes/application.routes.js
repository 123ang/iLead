import { Router } from "express";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { applicationCreateSchema } from "../validators/application.schema.js";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) =>
    res.json(
      await prisma.application.findMany({
        take: 100,
        include: { lead: true, programme: true, country: true },
        orderBy: { createdAt: "desc" },
      }),
    ),
  ),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = applicationCreateSchema.parse(req.body);
    const email =
      data.email === "" || data.email === null ? null : data.email;
    const created = await prisma.application.create({
      data: {
        ...data,
        email,
      },
    });
    res.status(201).json(created);
  }),
);

router.post("/upload", (_req, res) =>
  res.status(202).json({
    ok: true,
    message:
      "CSV/XLSX upload scaffold: column mapping and validation to be implemented.",
  }),
);

router.post("/match-leads", (_req, res) =>
  res.status(202).json({
    ok: true,
    message: "Matching job scaffold accepted.",
  }),
);

router.get(
  "/unmatched",
  asyncHandler(async (_req, res) =>
    res.json(
      await prisma.application.findMany({
        where: { leadId: null, deletedAt: null },
      }),
    ),
  ),
);

export default router;
