import { prisma } from "../config/db.js";

export const listAuditLogs = async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(logs);
};
