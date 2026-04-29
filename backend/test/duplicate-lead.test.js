import test from "node:test";
import assert from "node:assert/strict";
import {
  createDuplicateCandidatesForLead,
  mergeLeadCandidate,
  scorePossibleDuplicate,
} from "../src/services/duplicate-lead.service.js";
import { buildDuplicateReport } from "../src/services/duplicate-report.service.js";

test("scorePossibleDuplicate requires exact normalized name, country, and programme alignment", () => {
  assert.equal(
    scorePossibleDuplicate(
      {
        fullName: "Jane Roe",
        countryId: "country-1",
        interestedProgrammeId: "programme-1",
      },
      {
        fullName: "jane roe",
        countryId: "country-1",
        interestedProgrammeId: "programme-1",
      },
    ),
    true,
  );

  assert.equal(
    scorePossibleDuplicate(
      {
        fullName: "Jane Roe",
        countryId: "country-1",
        interestedProgrammeId: "programme-1",
      },
      {
        fullName: "Jane Roe",
        countryId: "country-2",
        interestedProgrammeId: "programme-1",
      },
    ),
    false,
  );
});

test("createDuplicateCandidatesForLead creates exact and fuzzy candidates without duplicate pending pairs", async () => {
  const leads = [
    {
      id: "lead-new",
      fullName: "Jane Roe",
      email: " jane@example.local ",
      phone: "012-3456789",
      passportNumber: " ab1234 ",
      countryId: "country-1",
      interestedProgrammeId: "programme-1",
      deletedAt: null,
    },
    {
      id: "lead-exact",
      fullName: "Jane Roe",
      email: "jane@example.local",
      phone: null,
      passportNumber: null,
      countryId: "country-9",
      interestedProgrammeId: "programme-9",
      deletedAt: null,
    },
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
  ];
  const created = [];

  const tx = {
    lead: {
      async findUnique({ where }) {
        return leads.find((lead) => lead.id === where.id) ?? null;
      },
      async findMany({ where }) {
        return leads.filter((lead) => {
          if (lead.id === where.id?.not) return false;
          if (where.deletedAt === null && lead.deletedAt !== null) return false;
          if (where.OR) {
            return where.OR.some((clause) =>
              Object.entries(clause).every(([key, value]) => lead[key] === value),
            );
          }
          return (
            lead.countryId === where.countryId &&
            lead.interestedProgrammeId === where.interestedProgrammeId
          );
        });
      },
    },
    leadMergeCandidate: {
      async findFirst() {
        return null;
      },
      create({ data }) {
        created.push(data);
        return Promise.resolve(data);
      },
    },
  };

  await createDuplicateCandidatesForLead("lead-new", tx);

  assert.equal(created.length, 2);
  assert.ok(created.some((item) => item.reason === "exact_email"));
  assert.ok(created.some((item) => item.reason === "name_country_programme"));
});

test("mergeLeadCandidate moves touches and child records to the primary lead", async () => {
  const candidate = {
    id: "candidate-1",
    leadA: {
      id: "lead-primary",
      touches: [{ leadId: "lead-primary", campaignId: "campaign-1" }],
    },
    leadB: {
      id: "lead-duplicate",
      notes: "Existing note",
      touches: [
        { leadId: "lead-duplicate", campaignId: "campaign-1", source: "CSV_UPLOAD" },
        { leadId: "lead-duplicate", campaignId: "campaign-2", source: "EVENT_FORM" },
      ],
    },
  };
  const operations = [];

  const tx = {
    leadMergeCandidate: {
      async findUnique() {
        return candidate;
      },
      update({ data }) {
        operations.push({ type: "candidate", data });
        return Promise.resolve(data);
      },
    },
    leadCampaignTouch: {
      createMany({ data, skipDuplicates }) {
        operations.push({ type: "touches", data, skipDuplicates });
        return Promise.resolve({ count: data.length });
      },
    },
    application: {
      updateMany({ where, data }) {
        operations.push({ type: "applications", where, data });
        return Promise.resolve({ count: 2 });
      },
    },
    followUp: {
      updateMany({ where, data }) {
        operations.push({ type: "followUps", where, data });
        return Promise.resolve({ count: 1 });
      },
    },
    lead: {
      update({ where, data }) {
        operations.push({ type: "lead", where, data });
        return Promise.resolve(data);
      },
    },
    async $transaction(promises) {
      return Promise.all(promises);
    },
  };

  const result = await mergeLeadCandidate({
    candidateId: "candidate-1",
    reviewerId: "reviewer-1",
  }, tx);

  assert.equal(result.id, "candidate-1");
  assert.deepEqual(
    operations.find((item) => item.type === "touches").data,
    [
      {
        leadId: "lead-primary",
        campaignId: "campaign-2",
        source: "EVENT_FORM",
        capturedAt: undefined,
        sourceNote: undefined,
      },
    ],
  );
  assert.equal(
    operations.find((item) => item.type === "lead").data.status,
    "DUPLICATE",
  );
});

test("buildDuplicateReport summarizes statuses and reasons", () => {
  const report = buildDuplicateReport([
    { status: "PENDING", reason: "exact_email" },
    { status: "MERGED", reason: "exact_phone" },
    { status: "NOT_DUPLICATE", reason: "name_country_programme" },
  ]);

  assert.deepEqual(report, {
    total: 3,
    pending: 1,
    merged: 1,
    notDuplicate: 1,
    ignored: 0,
    exact: 2,
    possible: 1,
    byReason: {
      exact_email: 1,
      exact_phone: 1,
      name_country_programme: 1,
    },
  });
});
