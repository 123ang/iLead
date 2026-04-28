import test from "node:test";
import assert from "node:assert/strict";
import {
  leadHasIdentifier,
  normalizeEmail,
  normalizeLeadIdentifiers,
  normalizePassport,
  normalizePhone,
} from "../src/services/lead-identity.service.js";

test("normalizes lead identifiers consistently", () => {
  const normalized = normalizeLeadIdentifiers({
    email: "  USER@Example.COM ",
    phone: "012-345 6789",
    passportNumber: " ab1234 ",
    externalLeadId: " ext-99 ",
  });

  assert.equal(normalized.email, "user@example.com");
  assert.equal(normalized.phone, "+0123456789");
  assert.equal(normalized.passportNumber, "AB1234");
  assert.equal(normalized.externalLeadId, "EXT-99");
});

test("leadHasIdentifier enforces at least one identifier", () => {
  assert.equal(leadHasIdentifier({ fullName: "Missing" }), false);
  assert.equal(leadHasIdentifier({ email: "test@example.local" }), true);
  assert.equal(normalizeEmail(""), null);
  assert.equal(normalizePhone(""), null);
  assert.equal(normalizePassport(""), null);
});

