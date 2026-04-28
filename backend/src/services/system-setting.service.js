import { prisma } from "../config/db.js";

export async function getSystemSettingsMap(tx = prisma) {
  const rows = await tx.systemSetting.findMany();
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

