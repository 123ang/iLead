import { PrismaClient } from "@prisma/client";

// Ensure Prisma can initialize even when the caller didn't set DATABASE_URL.
// (Your scripts set this too, but this makes runtime/debug runs safe.)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://ilead_user:password@127.0.0.1:55432/ilead_db";
}

export const prisma = new PrismaClient();
