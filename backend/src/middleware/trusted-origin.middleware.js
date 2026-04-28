import { env } from "../config/env.js";

/**
 * For cookie-based auth endpoints: require Origin/Referer to match trusted frontends.
 * Skips when no Origin (e.g. curl) so local scripts still work in dev.
 */
export function assertTrustedOrigin(req, res, next) {
  if (env.nodeEnv === "test") return next();
  const origin = req.get("Origin") || req.get("Referer") || "";
  if (!origin) return next();

  try {
    const u = origin.startsWith("http") ? new URL(origin) : new URL(`http://${origin}`);
    const canonical = `${u.protocol}//${u.host}`;
    const ok =
      env.trustedOrigins.includes(canonical) || env.trustedOrigins.includes(origin);
    if (ok) return next();
  } catch {
    /* invalid URL */
  }
  return res.status(403).json({ error: "Forbidden origin" });
}
