const PHONE_CLEAN_RE = /[^\d+]/g;

export function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return email || null;
}

export function normalizePhone(value) {
  const phone = String(value || "").trim().replace(PHONE_CLEAN_RE, "");
  if (!phone) return null;
  if (phone.startsWith("+")) return phone;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `+${digits}`;
}

export function normalizePassport(value) {
  const passport = String(value || "").trim().toUpperCase();
  return passport || null;
}

export function normalizeExternalLeadId(value) {
  const externalLeadId = String(value || "").trim().toUpperCase();
  return externalLeadId || null;
}

export function leadHasIdentifier(candidate) {
  return Boolean(
    normalizeEmail(candidate?.email) ||
      normalizePhone(candidate?.phone) ||
      normalizePassport(candidate?.passportNumber) ||
      normalizeExternalLeadId(candidate?.externalLeadId),
  );
}

export function normalizeLeadIdentifiers(candidate) {
  return {
    ...candidate,
    email: normalizeEmail(candidate?.email),
    phone: normalizePhone(candidate?.phone),
    passportNumber: normalizePassport(candidate?.passportNumber),
    externalLeadId: normalizeExternalLeadId(candidate?.externalLeadId),
  };
}

