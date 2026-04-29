import { Router } from "express";
import { prisma } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { audit } from "../utils/audit.js";
import { AppError } from "../utils/http.js";
import { masterResources } from "../validators/master.schema.js";

const router = Router();
router.use(requireAuth);

const writeRoles = ["SUPER_ADMIN", "CIAC_ADMIN"];

for (const [path, resource] of Object.entries(masterResources)) {
  router.get(
    `/${path}`,
    asyncHandler(async (_req, res) =>
      res.json(
        await prisma[resource.model].findMany({
          take: 500,
          include: resource.include,
          orderBy: resource.orderBy,
        }),
      ),
    ),
  );

  router.post(
    `/${path}`,
    requireRole(...writeRoles),
    asyncHandler(async (req, res) => {
      const data = resource.createSchema.parse(req.body);
      const created = await prisma[resource.model].create({
        data,
        include: resource.include,
      });
      await audit(req, "CREATE", resource.entity, created.id, null, created);
      res.status(201).json(created);
    }),
  );

  router.patch(
    `/${path}/:id`,
    requireRole(...writeRoles),
    asyncHandler(async (req, res) => {
      const data = resource.updateSchema.parse(req.body);
      const before = await prisma[resource.model].findUnique({
        where: { id: req.params.id },
        include: resource.include,
      });
      if (!before) throw new AppError(404, `${resource.entity} not found`);

      const updated = await prisma[resource.model].update({
        where: { id: req.params.id },
        data,
        include: resource.include,
      });
      await audit(req, "UPDATE", resource.entity, updated.id, before, updated);
      res.json(updated);
    }),
  );

  router.delete(
    `/${path}/:id`,
    requireRole(...writeRoles),
    asyncHandler(async (req, res) => {
      const before = await prisma[resource.model].findUnique({
        where: { id: req.params.id },
        include: resource.include,
      });
      if (!before) throw new AppError(404, `${resource.entity} not found`);

      if (resource.softDisable) {
        const updated = await prisma[resource.model].update({
          where: { id: req.params.id },
          data: { isActive: false },
          include: resource.include,
        });
        await audit(req, "DISABLE", resource.entity, updated.id, before, updated);
        return res.json(updated);
      }

      if (resource.hardDelete) {
        await prisma[resource.model].delete({ where: { id: req.params.id } });
        await audit(req, "DELETE", resource.entity, req.params.id, before, null);
        return res.json({ ok: true });
      }

      throw new AppError(405, `${resource.entity} cannot be disabled safely`);
    }),
  );
}

export default router;
