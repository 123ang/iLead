import test from "node:test";
import assert from "node:assert/strict";
import {
  changePasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "../src/validators/auth.schema.js";

test("loginSchema requires a valid email and password", () => {
  assert.equal(
    loginSchema.parse({ email: "admin@example.com", password: "validpass" }).email,
    "admin@example.com",
  );
  assert.throws(
    () => loginSchema.parse({ email: "not-an-email", password: "validpass" }),
    /Invalid email/,
  );
});

test("resetPasswordSchema accepts newPassword and rejects the old password field", () => {
  assert.equal(
    resetPasswordSchema.parse({
      token: "long-enough-token",
      newPassword: "newpass123",
    }).newPassword,
    "newpass123",
  );

  assert.throws(
    () =>
      resetPasswordSchema.parse({
        token: "long-enough-token",
        password: "newpass123",
      }),
    /Required/,
  );
});

test("changePasswordSchema validates both current and new password fields", () => {
  const parsed = changePasswordSchema.parse({
    currentPassword: "oldpass123",
    newPassword: "newpass123",
  });

  assert.equal(parsed.currentPassword, "oldpass123");
  assert.equal(parsed.newPassword, "newpass123");
});
