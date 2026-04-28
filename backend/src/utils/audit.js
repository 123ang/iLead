import { prisma } from "../config/db.js";

export async function audit(req, action, entity, entityId, oldValue, newValue) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id ?? null,
        action,
        entity,
        entityId,
        oldValue,
        newValue,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null,
      },
    });
  } catch (e) {
    console.error("audit failed", e);
  }
}
