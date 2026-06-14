import { PrismaClient } from "@prisma/client";

const DEV_DATABASE_URL =
  "postgresql://ilead_user:password@127.0.0.1:55432/ilead_db";

function isDevelopmentLike(nodeEnv) {
  return nodeEnv === "development" || nodeEnv === "test";
}

export function resolveDatabaseUrl({
  nodeEnv = process.env.NODE_ENV || "development",
  databaseUrl = process.env.DATABASE_URL,
} = {}) {
  if (databaseUrl) return databaseUrl;
  if (isDevelopmentLike(nodeEnv)) return DEV_DATABASE_URL;
  throw new Error("DATABASE_URL is required outside development");
}

process.env.DATABASE_URL = resolveDatabaseUrl();

export const prisma = new PrismaClient();
