import { env } from "../config/env.js";

/**
 * For cookie-based auth endpoints: require Origin/Referer to match trusted frontends.
 * Local scripts remain allowed in development/test; production must identify a trusted frontend.
 */
export function assertTrustedOrigin(req, res, next) {
  if (env.nodeEnv === "test") return next();
  const origin = req.get("Origin") || req.get("Referer") || "";
  if (!origin) {
    if (env.nodeEnv === "production") {
      return res.status(403).json({ error: "Forbidden origin" });
    }
    return next();
  }

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
