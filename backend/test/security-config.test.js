import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveJwtSecret,
  resolveTrustedOrigins,
} from "../src/config/env.js";
import { resolveDatabaseUrl } from "../src/config/db.js";
import { generateTemporaryPassword } from "../src/utils/password.js";

test("production rejects missing or placeholder JWT secrets", () => {
  assert.throws(
    () => resolveJwtSecret("JWT_ACCESS_SECRET", undefined, "production"),
    /JWT_ACCESS_SECRET is required/,
  );
  assert.throws(
    () => resolveJwtSecret("JWT_REFRESH_SECRET", "change_me_64_random_chars", "production"),
    /JWT_REFRESH_SECRET must not use/,
  );
});

test("development may use explicit dev JWT fallbacks", () => {
  assert.equal(
    resolveJwtSecret("JWT_ACCESS_SECRET", undefined, "development"),
    "dev_access_secret_change_me",
  );
});

test("production rejects missing DATABASE_URL", () => {
  assert.throws(
    () => resolveDatabaseUrl({ nodeEnv: "production", databaseUrl: "" }),
    /DATABASE_URL is required/,
  );
});

test("development still resolves the local DATABASE_URL fallback", () => {
  assert.match(
    resolveDatabaseUrl({ nodeEnv: "development", databaseUrl: undefined }),
    /^postgresql:\/\/ilead_user:/,
  );
});

test("production requires explicit trusted origins", () => {
  assert.throws(
    () =>
      resolveTrustedOrigins({
        nodeEnv: "production",
        trustedOrigins: undefined,
        frontendUrl: "http://localhost:5173",
      }),
    /TRUSTED_ORIGINS is required/,
  );
});

test("temporary passwords are random strong values", () => {
  const first = generateTemporaryPassword();
  const second = generateTemporaryPassword();

  assert.notEqual(first, "iLead2026!");
  assert.notEqual(first, second);
  assert.ok(first.length >= 16);
  assert.match(first, /[A-Z]/);
  assert.match(first, /[a-z]/);
  assert.match(first, /[0-9]/);
});
