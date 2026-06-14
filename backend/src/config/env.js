import dotenv from "dotenv";

dotenv.config();

function parseCsv(s) {
  return String(s)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

const DEV_ACCESS_SECRET = "dev_access_secret_change_me";
const DEV_REFRESH_SECRET = "dev_refresh_secret_change_me";

function isDevelopmentLike(nodeEnv) {
  return nodeEnv === "development" || nodeEnv === "test";
}

function isPlaceholderSecret(value) {
  const normalized = String(value || "").trim();
  return (
    !normalized ||
    normalized === "change_me_64_random_chars" ||
    normalized === DEV_ACCESS_SECRET ||
    normalized === DEV_REFRESH_SECRET ||
    normalized.toLowerCase().includes("change_me")
  );
}

export function resolveJwtSecret(name, value, nodeEnv) {
  const fallback =
    name === "JWT_REFRESH_SECRET" ? DEV_REFRESH_SECRET : DEV_ACCESS_SECRET;

  if (!isPlaceholderSecret(value)) return value;
  if (isDevelopmentLike(nodeEnv)) return value || fallback;

  if (!value) {
    throw new Error(`${name} is required outside development`);
  }

  throw new Error(`${name} must not use placeholder or development values`);
}

export function resolveTrustedOrigins({ nodeEnv, trustedOrigins, frontendUrl }) {
  if (trustedOrigins) return parseCsv(trustedOrigins);
  if (isDevelopmentLike(nodeEnv)) return parseCsv(frontendUrl);
  throw new Error("TRUSTED_ORIGINS is required outside development");
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

const nodeEnv = process.env.NODE_ENV || "development";
const jwtAccessSecret = resolveJwtSecret(
  "JWT_ACCESS_SECRET",
  process.env.JWT_ACCESS_SECRET,
  nodeEnv,
);
const jwtRefreshSecret = resolveJwtSecret(
  "JWT_REFRESH_SECRET",
  process.env.JWT_REFRESH_SECRET,
  nodeEnv,
);
const refreshExpiresMs = expiresSpecToMs(process.env.REFRESH_TOKEN_EXPIRES_IN || "7d");
const frontend = process.env.FRONTEND_URL || "http://localhost:5173";

export const env = {
  port: Number(process.env.PORT || 4016),
  nodeEnv,

  frontendUrl: frontend,
  /** Comma-separated or single origin; POST /auth routes must match Origin/Referer in production-ish flows */
  trustedOrigins: resolveTrustedOrigins({
    nodeEnv,
    trustedOrigins: process.env.TRUSTED_ORIGINS,
    frontendUrl: frontend,
  }),

  timezone: process.env.TIMEZONE || "Asia/Kuala_Lumpur",

  jwtAccessSecret,
  jwtRefreshSecret,
  /** Back-compat with older imports */
  accessSecret: jwtAccessSecret,
  refreshSecret: jwtRefreshSecret,

  accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshExpiresInMs: refreshExpiresMs,
  refreshExpiresInSpec: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
};
