import dotenv from "dotenv";

dotenv.config();

function parseCsv(s) {
  return String(s)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Convert e.g. 7d, 15m, 24h to milliseconds (jwt-style); default 7 days */
export function expiresSpecToMs(spec) {
  const m = String(spec || "").trim().match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!m) return 7 * 86400000;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  if (u === "ms") return n;
  if (u === "s") return n * 1000;
  if (u === "m") return n * 60000;
  if (u === "h") return n * 3600000;
  return n * 86400000;
}

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me";
const refreshExpiresMs = expiresSpecToMs(process.env.REFRESH_TOKEN_EXPIRES_IN || "7d");
const frontend = process.env.FRONTEND_URL || "http://localhost:5173";

export const env = {
  port: Number(process.env.PORT || 4016),
  nodeEnv: process.env.NODE_ENV || "development",

  frontendUrl: frontend,
  /** Comma-separated or single origin; POST /auth routes must match Origin/Referer in production-ish flows */
  trustedOrigins: process.env.TRUSTED_ORIGINS
    ? parseCsv(process.env.TRUSTED_ORIGINS)
    : parseCsv(frontend),

  timezone: process.env.TIMEZONE || "Asia/Kuala_Lumpur",

  jwtAccessSecret,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",
  /** Back-compat with older imports */
  accessSecret: jwtAccessSecret,
  refreshSecret: process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_change_me",

  accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshExpiresInMs: refreshExpiresMs,
  refreshExpiresInSpec: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
};
