import { prisma } from "../config/db.js";
import {
  normalizeEmail,
  normalizeLeadIdentifiers,
  normalizePassport,
  normalizePhone,
} from "./lead-identity.service.js";

export function scorePossibleDuplicate({ fullName, countryId, interestedProgrammeId }, lead) {
  if (!fullName || !lead?.fullName) return false;
  const nameMatch =
    String(fullName).trim().toLowerCase() ===
    String(lead.fullName).trim().toLowerCase();
  return (
    nameMatch &&
    Boolean(countryId) &&
    countryId === lead.countryId &&
    Boolean(interestedProgrammeId) &&
    interestedProgrammeId === lead.interestedProgrammeId
  );
}

export async function createDuplicateCandidatesForLead(leadId, tx = prisma) {
  const lead = await tx.lead.findUnique({
    where: { id: leadId },
  });
  if (!lead || lead.deletedAt) return [];

  const normalized = normalizeLeadIdentifiers(lead);
  const exactClauses = [
    normalized.email ? { email: normalizeEmail(normalized.email) } : null,
    normalized.phone ? { phone: normalizePhone(normalized.phone) } : null,
    normalized.passportNumber
      ? { passportNumber: normalizePassport(normalized.passportNumber) }
      : null,
  ].filter(Boolean);

  const exactMatches = exactClauses.length
    ? await tx.lead.findMany({
        where: {
          id: { not: leadId },
          deletedAt: null,
          OR: exactClauses,
        },
      })
    : [];

  const possibleMatches = await tx.lead.findMany({
    where: {
      id: { not: leadId },
      deletedAt: null,
      countryId: lead.countryId ?? undefined,
      interestedProgrammeId: lead.interestedProgrammeId ?? undefined,
    },
  });

  const candidates = [];
  for (const match of exactMatches) {
    const reason =
      normalized.passportNumber &&
      normalizePassport(match.passportNumber) === normalized.passportNumber
        ? "exact_passport"
        : normalized.phone && normalizePhone(match.phone) === normalized.phone
          ? "exact_phone"
          : "exact_email";

    candidates.push({ leadAId: match.id, leadBId: leadId, confidence: 1, reason });
  }

  for (const match of possibleMatches) {
    if (scorePossibleDuplicate(lead, match)) {
      candidates.push({
        leadAId: match.id,
        leadBId: leadId,
        confidence: 0.86,
        reason: "name_country_programme",
      });
    }
  }

  const unique = new Map();
  for (const candidate of candidates) {
    const pair = [candidate.leadAId, candidate.leadBId].sort().join(":");
    const previous = unique.get(pair);
    if (!previous || Number(previous.confidence) < Number(candidate.confidence)) {
      unique.set(pair, candidate);
    }
  }

  const writes = [];
  for (const candidate of unique.values()) {
    const existing = await tx.leadMergeCandidate.findFirst({
      where: {
        OR: [
          { leadAId: candidate.leadAId, leadBId: candidate.leadBId },
          { leadAId: candidate.leadBId, leadBId: candidate.leadAId },
        ],
        status: "PENDING",
      },
    });
    if (!existing) {
      writes.push(
        tx.leadMergeCandidate.create({
          data: candidate,
        }),
      );
    }
  }
  return Promise.all(writes);
}

export async function mergeLeadCandidate({ candidateId, reviewerId }, tx = prisma) {
  const candidate = await tx.leadMergeCandidate.findUnique({
    where: { id: candidateId },
    include: {
      leadA: { include: { touches: true } },
      leadB: { include: { touches: true } },
    },
  });
  if (!candidate) return null;

  const primary = candidate.leadA;
  const duplicate = candidate.leadB;
  const touchPairs = new Set(primary.touches.map((touch) => `${touch.leadId}:${touch.campaignId}`));
  const touchCreates = duplicate.touches
    .filter((touch) => !touchPairs.has(`${primary.id}:${touch.campaignId}`))
    .map((touch) => ({
      leadId: primary.id,
      campaignId: touch.campaignId,
      source: touch.source,
      capturedAt: touch.capturedAt,
      sourceNote: touch.sourceNote,
    }));

  await tx.$transaction([
    tx.leadCampaignTouch.createMany({
      data: touchCreates,
      skipDuplicates: true,
    }),
    tx.application.updateMany({
      where: { leadId: duplicate.id },
      data: { leadId: primary.id },
    }),
    tx.followUp.updateMany({
      where: { leadId: duplicate.id },
      data: { leadId: primary.id },
    }),
    tx.lead.update({
      where: { id: duplicate.id },
      data: {
        status: "DUPLICATE",
        deletedAt: new Date(),
        notes: [duplicate.notes, `Merged into ${primary.id}`].filter(Boolean).join("\n"),
      },
    }),
    tx.leadMergeCandidate.update({
      where: { id: candidateId },
      data: {
        status: "MERGED",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    }),
  ]);

  return candidate;
}

