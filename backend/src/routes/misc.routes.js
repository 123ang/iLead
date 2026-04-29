import { Router } from "express";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { audit } from "../utils/audit.js";
import { AppError } from "../utils/http.js";
import { hashPassword } from "../services/auth.service.js";
import { adminUserCreateSchema, adminUserUpdateSchema } from "../validators/user.schema.js";

const userPublic = {
  id: true,
  name: true,
  email: true,
  role: true,
  facultyId: true,
  isActive: true,
  mustChangePassword: true,
  lastLoginAt: true,
  createdAt: true,
  faculty: true,
};

const router = Router();
router.use(requireAuth);

router.get(
  "/settings",
  asyncHandler(async (_req, res) =>
    res.json(await prisma.systemSetting.findMany({ orderBy: { key: "asc" } })),
  ),
);

router.patch(
  "/settings/:key",
  requireRole("SUPER_ADMIN"),
  asyncHandler(async (req, res) =>
    res.json(
      await prisma.systemSetting.upsert({
        where: { key: req.params.key },
        create: { key: req.params.key, value: req.body.value },
        update: { value: req.body.value },
      }),
    ),
  ),
);

router.get(
  "/audit-logs",
  requireRole("SUPER_ADMIN", "CIAC_ADMIN"),
  asyncHandler(async (req, res) => {
    const take = Math.min(Number(req.query.take || 200), 500);
    const where = {};
    if (req.query.action) where.action = String(req.query.action);
    if (req.query.entity) where.entity = String(req.query.entity);
    if (req.query.userId) where.userId = String(req.query.userId);
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt.gte = new Date(String(req.query.from));
      if (req.query.to) where.createdAt.lte = new Date(String(req.query.to));
    }
    if (req.query.search) {
      const search = String(req.query.search).trim();
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
      ];
    }

    res.json(
      await prisma.auditLog.findMany({
        where,
        take,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      }),
    );
  }),
);

router.get(
  "/users",
  requireRole("SUPER_ADMIN"),
  asyncHandler(async (_req, res) =>
    res.json(
      await prisma.user.findMany({
        take: 100,
        select: userPublic,
      }),
    ),
  ),
);

router.post(
  "/users",
  requireRole("SUPER_ADMIN"),
  asyncHandler(async (req, res) => {
    const data = adminUserCreateSchema.parse(req.body);
    const created = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        facultyId: data.facultyId || null,
        isActive: data.isActive ?? true,
        passwordHash: await hashPassword(data.temporaryPassword),
        mustChangePassword: true,
      },
      select: userPublic,
    });
    await audit(req, "CREATE", "User", created.id, null, created);
    res.status(201).json(created);
  }),
);

router.patch(
  "/users/:id",
  requireRole("SUPER_ADMIN"),
  asyncHandler(async (req, res) => {
    const data = adminUserUpdateSchema.parse(req.body);
    const before = await prisma.user.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: userPublic,
    });
    if (!before) throw new AppError(404, "User not found");

    const updateData = {
      name: data.name,
      email: data.email,
      role: data.role,
      facultyId: data.facultyId,
      isActive: data.isActive,
    };
    if (data.temporaryPassword) {
      updateData.passwordHash = await hashPassword(data.temporaryPassword);
      updateData.mustChangePassword = true;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: req.params.id },
        data: updateData,
        select: userPublic,
      });
      if (data.temporaryPassword || data.isActive === false) {
        await tx.refreshToken.updateMany({
          where: { userId: req.params.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return user;
    });
    await audit(req, "UPDATE", "User", updated.id, before, updated);
    res.json(updated);
  }),
);

router.delete(
  "/users/:id",
  requireRole("SUPER_ADMIN"),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) {
      throw new AppError(400, "You cannot deactivate your own account");
    }
    const before = await prisma.user.findFirst({
      where: { id: req.params.id, deletedAt: null },
      select: userPublic,
    });
    if (!before) throw new AppError(404, "User not found");
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: req.params.id },
        data: { isActive: false },
        select: userPublic,
      });
      await tx.refreshToken.updateMany({
        where: { userId: req.params.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return user;
    });
    await audit(req, "DEACTIVATE", "User", updated.id, before, updated);
    res.json(updated);
  }),
);

export default router;
