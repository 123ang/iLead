#!/usr/bin/env node
/**
 * HTTP smoke test — run this while the API is up (e.g. `npm run start` in another terminal).
 *
 *   API_BASE=http://127.0.0.1:4016 ORIGIN=http://localhost:5173 node scripts/smoke-api.mjs
 *
 * Default login (after `npm run seed`): admin@ilead.local / iLead2026!
 */

const BASE = (process.env.API_BASE || "http://127.0.0.1:4016").replace(/\/$/, "");
const ORIGIN = process.env.ORIGIN || "http://localhost:5173";
const EMAIL = process.env.TEST_EMAIL || "admin@ilead.local";
const PASSWORD = process.env.TEST_PASSWORD || "iLead2026!";

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

async function main() {
  const health = await fetch(`${BASE}/health`).then((r) => r.json());
  if (!health.ok) fail(`GET /health: ${JSON.stringify(health)}`);
  console.log("OK  GET /health");

  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const login = await loginRes.json();
  if (!loginRes.ok) fail(`POST /api/auth/login ${loginRes.status}: ${JSON.stringify(login)}`);
  if (!login.accessToken || !login.user?.id) fail("Login response missing accessToken or user");
  console.log("OK  POST /api/auth/login");

  const token = login.accessToken;

  const me = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  if (!me.user?.email) fail(`GET /api/auth/me: ${JSON.stringify(me)}`);
  console.log("OK  GET /api/auth/me");

  const dash = await fetch(`${BASE}/api/dashboard/executive`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  if (typeof dash.campaigns !== "number" || typeof dash.totalLeads !== "number") {
    fail(`GET /api/dashboard/executive: ${JSON.stringify(dash)}`);
  }
  console.log(
    `OK  GET /api/dashboard/executive (campaigns=${dash.campaigns}, leads=${dash.totalLeads})`,
  );

  const setCookies = loginRes.headers.getSetCookie?.() || [];
  const refreshLine = setCookies.find((c) => c.startsWith("ilead_refresh="));
  if (refreshLine) {
    const cookieHeader = refreshLine.split(";")[0];
    const ref = await fetch(`${BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { Origin: ORIGIN, Cookie: cookieHeader },
    }).then((r) => r.json());
    if (!ref.accessToken) fail(`POST /api/auth/refresh: ${JSON.stringify(ref)}`);
    console.log("OK  POST /api/auth/refresh (cookie rotation)");
  } else {
    console.warn("SKIP POST /api/auth/refresh (no Set-Cookie from login — check Node/fetch)");
  }

  const settings = await fetch(`${BASE}/api/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());
  if (!Array.isArray(settings)) fail(`GET /api/settings: ${JSON.stringify(settings)}`);
  console.log(`OK  GET /api/settings (${settings.length} rows)`);

  console.log("\nAll smoke checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
