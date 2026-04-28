import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenExpiresIn }
  );

export const signRefreshToken = (user) =>
  jwt.sign({ sub: user.id, type: "refresh" }, env.jwtRefreshSecret, {
    expiresIn: env.refreshTokenExpiresIn,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);
export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
