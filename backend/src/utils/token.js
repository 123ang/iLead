import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "./http.js";

function isJwtVerifyError(e) {
  const n = e?.name;
  return n === "JsonWebTokenError" || n === "TokenExpiredError" || n === "NotBeforeError";
}

export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      facultyId: user.facultyId ?? null,
      mustChangePassword: Boolean(user.mustChangePassword),
    },
    env.jwtAccessSecret,
    { expiresIn: env.accessExpiresIn },
  );
}

/** Access token verification → throws AppError 401 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwtAccessSecret);
  } catch (e) {
    if (isJwtVerifyError(e)) {
      throw new AppError(401, "Invalid or expired access token");
    }
    throw e;
  }
}
