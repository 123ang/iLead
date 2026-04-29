import test from "node:test";
import assert from "node:assert/strict";
import { matchApplicationToLead } from "../src/services/application-matching.service.js";

function createLeadStore(leads) {
  return {
    lead: {
      async findFirst({ where }) {
        return (
          leads.find((lead) => {
            if (where.deletedAt === null && lead.deletedAt !== null) return false;
            if (where.passportNumber !== undefined) {
              return lead.passportNumber === where.passportNumber;
            }
            if (where.email !== undefined) {
              return lead.email === where.email;
            }
            if (where.phone !== undefined) {
              return lead.phone === where.phone;
            }
            if (where.countryId !== undefined || where.interestedProgrammeId !== undefined) {
              return (
                lead.countryId === where.countryId &&
                lead.interestedProgrammeId === where.interestedProgrammeId
              );
            }
            if (where.touches?.some?.campaignId) {
              return (
                lead.fullName === where.fullName &&
                lead.touches?.some(
                  (touch) => touch.campaignId === where.touches.some.campaignId,
                )
              );
            }
            return false;
          }) ?? null
        );
      },
      async findMany({ where }) {
        if (where.countryId === undefined && where.interestedProgrammeId === undefined) {
          return [];
        }
        return leads.filter((lead) => {
          if (where.deletedAt === null && lead.deletedAt !== null) return false;
          return (
            lead.countryId === where.countryId &&
            lead.interestedProgrammeId === where.interestedProgrammeId
          );
        });
      },
    },
  };
}

test("matchApplicationToLead returns exact passport match first", async () => {
  const tx = createLeadStore([
    {
      id: "lead-passport",
      fullName: "Jane Roe",
      email: "other@example.local",
      phone: "+60123456789",
      passportNumber: "A12345",
      deletedAt: null,
    },
  ]);

  const result = await matchApplicationToLead(
    {
      applicantName: "Jane Roe",
      passportNumber: " a12345 ",
      email: "nomatch@example.local",
    },
    tx,
  );

  assert.equal(result.status, "matched");
  assert.equal(result.reason, "passport");
  assert.equal(result.lead.id, "lead-passport");
});

test("matchApplicationToLead returns conflict when exact identifiers point to different leads", async () => {
  const tx = createLeadStore([
    {
      id: "lead-email",
      fullName: "Jane Roe",
      email: "jane@example.local",
      phone: null,
      passportNumber: null,
      deletedAt: null,
    },
    {
      id: "lead-phone",
      fullName: "Jane Roe",
      email: null,
      phone: "+0123456789",
      passportNumber: null,
      deletedAt: null,
    },
  ]);

  const result = await matchApplicationToLead(
    {
      applicantName: "Jane Roe",
      email: "jane@example.local",
      phone: "012-3456789",
    },
    tx,
  );

  assert.equal(result.status, "conflict");
  assert.equal(result.reason, "MATCH_CONFLICT");
  assert.equal(result.matches.length, 2);
});

test("matchApplicationToLead falls back to fuzzy name-country-programme match", async () => {
  const tx = createLeadStore([
    {
      id: "lead-fuzzy",
      fullName: "Jane Roe",
      email: null,
      phone: null,
      passportNumber: null,
      countryId: "country-1",
      interestedProgrammeId: "programme-1",
      deletedAt: null,
    },
  ]);

  const result = await matchApplicationToLead(
    {
      applicantName: "  jane roe ",
      countryId: "country-1",
      programmeId: "programme-1",
    },
    tx,
  );

  assert.equal(result.status, "matched");
  assert.equal(result.reason, "name_country_programme");
  assert.equal(result.lead.id, "lead-fuzzy");
});

test("matchApplicationToLead uses source campaign name fallback when no identifier matches", async () => {
  const tx = createLeadStore([
    {
      id: "lead-campaign",
      fullName: "Jane Roe",
      email: null,
      phone: null,
      passportNumber: null,
      touches: [{ campaignId: "campaign-1" }],
      deletedAt: null,
    },
  ]);

  const result = await matchApplicationToLead(
    {
      applicantName: "Jane Roe",
      sourceCampaignId: "campaign-1",
    },
    tx,
  );

  assert.equal(result.status, "matched");
  assert.equal(result.reason, "source_campaign_name");
  assert.equal(result.lead.id, "lead-campaign");
});
