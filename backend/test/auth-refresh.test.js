import test from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/config/db.js";
import { rotateRefreshToken } from "../src/services/auth.service.js";

test("rotateRefreshToken revokes active sibling tokens when a revoked token is reused", async (t) => {
  const user = {
    id: "user-1",
    email: "user@example.com",
    role: "STAFF",
    name: "User",
    facultyId: null,
    mustChangePassword: false,
    isActive: true,
    deletedAt: null,
  };

  const originalFindUnique = prisma.refreshToken.findUnique;
  const originalUpdateMany = prisma.refreshToken.updateMany;
  let updateManyArgs = null;

  t.after(() => {
    prisma.refreshToken.findUnique = originalFindUnique;
    prisma.refreshToken.updateMany = originalUpdateMany;
  });

  prisma.refreshToken.findUnique = async () => ({
    id: "refresh-1",
    userId: user.id,
    revokedAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
    user,
  });
  prisma.refreshToken.updateMany = async (args) => {
    updateManyArgs = args;
    return { count: 2 };
  };

  await assert.rejects(
    () => rotateRefreshToken("reused-token"),
    /Refresh token invalid/,
  );

  assert.deepEqual(updateManyArgs, {
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: updateManyArgs.data.revokedAt },
  });
  assert.ok(updateManyArgs.data.revokedAt instanceof Date);
});
