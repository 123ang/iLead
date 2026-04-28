import { prisma } from "../config/db.js";
import {
  normalizeEmail,
  normalizePassport,
  normalizePhone,
} from "./lead-identity.service.js";

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

export async function matchApplicationToLead(application, tx = prisma) {
  const passportNumber = normalizePassport(application.passportNumber);
  const email = normalizeEmail(application.email);
  const phone = normalizePhone(application.phone);
  const baseWhere = { deletedAt: null };

  const matches = [];
  if (passportNumber) {
    const lead = await tx.lead.findFirst({ where: { ...baseWhere, passportNumber } });
    if (lead) matches.push({ type: "passport", lead });
  }
  if (email) {
    const lead = await tx.lead.findFirst({ where: { ...baseWhere, email } });
    if (lead) matches.push({ type: "email", lead });
  }
  if (phone) {
    const lead = await tx.lead.findFirst({ where: { ...baseWhere, phone } });
    if (lead) matches.push({ type: "phone", lead });
  }

  const uniqueLeadIds = [...new Set(matches.map((match) => match.lead.id))];
  if (uniqueLeadIds.length > 1) {
    return {
      status: "conflict",
      reason: "MATCH_CONFLICT",
      matches,
    };
  }
  if (uniqueLeadIds.length === 1) {
    return {
      status: "matched",
      reason: matches[0].type,
      lead: matches[0].lead,
    };
  }

  const fuzzy = await tx.lead.findFirst({
    where: {
      ...baseWhere,
      countryId: application.countryId ?? undefined,
      interestedProgrammeId: application.programmeId ?? undefined,
      fullName: application.applicantName,
    },
  });
  if (fuzzy && normalizeName(fuzzy.fullName) === normalizeName(application.applicantName)) {
    return { status: "matched", reason: "name_country_programme", lead: fuzzy };
  }

  if (application.sourceCampaignId) {
    const campaignLead = await tx.lead.findFirst({
      where: {
        ...baseWhere,
        touches: { some: { campaignId: application.sourceCampaignId } },
        fullName: application.applicantName,
      },
    });
    if (campaignLead) {
      return {
        status: "matched",
        reason: "source_campaign_name",
        lead: campaignLead,
      };
    }
  }

  return { status: "unmatched", reason: "NO_MATCH" };
}

