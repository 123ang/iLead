import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { signAccessToken, sha256 } from "../utils/token.js";
import { AppError } from "../utils/http.js";

export const REFRESH_COOKIE_NAME = "ilead_refresh";

export const hashPassword = (password) => bcrypt.hash(password, 12);

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    name: u.name,
    facultyId: u.facultyId,
    mustChangePassword: u.mustChangePassword,
    isActive: u.isActive,
  };
}

async function createRefreshRow(userId) {
  const plain = crypto.randomBytes(48).toString("base64url");
  const tokenHash = sha256(plain);
  const expiresAt = new Date(Date.now() + env.refreshExpiresInMs);
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt },
  });
  return plain;
}

export async function login({ email, password }) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: normalized, deletedAt: null },
  });
  if (
    !user ||
    !user.passwordHash ||
    !(await bcrypt.compare(password, user.passwordHash))
  ) {
    throw new AppError(401, "Invalid credentials");
  }
  if (!user.isActive) throw new AppError(403, "Account disabled");

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const refreshToken = await createRefreshRow(user.id);
  const accessToken = signAccessToken(user);
  return { accessToken, refreshToken, user: publicUser(user) };
}

export async function rotateRefreshToken(plainIncoming) {
  if (!plainIncoming) throw new AppError(401, "Missing refresh token");
  const tokenHash = sha256(plainIncoming);
  const row = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: true,
    },
  });
  if (!row?.user) throw new AppError(401, "Refresh token invalid");

  const { user } = row;
  if (row.revokedAt) {
    await revokeAllRefresh(user.id);
    throw new AppError(401, "Refresh token invalid");
  }
  if (user.deletedAt || !user.isActive)
    throw new AppError(401, "Refresh token invalid");

  const now = new Date();
  if (row.expiresAt <= now) throw new AppError(401, "Refresh token expired");

  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: now },
  });

  const plain = await createRefreshRow(user.id);
  return { accessToken: signAccessToken(user), refreshToken: plain, user: publicUser(user) };
}

export async function logout(plainIncoming) {
  if (!plainIncoming) return { ok: true };
  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: sha256(plainIncoming),
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
  return { ok: true };
}

async function revokeAllRefresh(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Generic response — do not leak whether email exists */
export async function forgotPassword({ email }) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  const user = await prisma.user.findFirst({
    where: { email: normalized, deletedAt: null },
  });
  const generic = {
    ok: true,
    message: "If that email exists, password reset instructions have been queued.",
  };
  if (!user?.passwordHash || !user.isActive) return generic;

  const plain = crypto.randomBytes(40).toString("base64url");
  const tokenHash = sha256(plain);
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const publicBase =
    env.nodeEnv !== "production" ? env.frontendUrl : env.frontendUrl;
  const link = `${publicBase.replace(/\/$/, "")}/reset-password?t=${plain}`;

  if (env.nodeEnv !== "production") {
    console.info("[dev] password reset link:", link);
  }

  return { ...generic, devResetLink: env.nodeEnv !== "production" ? link : undefined };
}

export async function resetPassword({ token, newPassword }) {
  const plain = String(token || "").trim();
  if (!plain || plain.length < 10)
    throw new AppError(400, "Invalid or expired reset link");
  if (!newPassword || String(newPassword).length < 8)
    throw new AppError(400, "Password must be at least 8 characters");

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: sha256(plain) },
    include: { user: true },
  });
  if (!row?.user?.passwordHash || row.usedAt || row.expiresAt <= new Date())
    throw new AppError(400, "Invalid or expired reset link");

  const hash = await hashPassword(String(newPassword));
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash: hash, mustChangePassword: false },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
  await revokeAllRefresh(row.userId);
  return { ok: true };
}

export async function changePassword({
  userId,
  currentPassword,
  newPassword,
}) {
  if (!newPassword || String(newPassword).length < 8)
    throw new AppError(400, "Password must be at least 8 characters");
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user?.passwordHash) throw new AppError(400, "Password change not available");

  if (!(await bcrypt.compare(String(currentPassword), user.passwordHash)))
    throw new AppError(401, "Current password is incorrect");

  const hash = await hashPassword(String(newPassword));
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash, mustChangePassword: false },
  });
  await revokeAllRefresh(user.id);
  return { ok: true };
}

/** @deprecated use REFRESH_COOKIE_NAME */
export const refreshCookieName = REFRESH_COOKIE_NAME;
