import test from "node:test";
import assert from "node:assert/strict";
import { buildCampaignMetricSnapshot } from "../src/services/campaign-metric-refresh.service.js";

test("buildCampaignMetricSnapshot aggregates campaign funnel, spend, and net revenue", async () => {
  const tx = {
    lead: {
      findMany: async () => [
        { id: "lead-1", leadQuality: "HOT" },
        { id: "lead-2", leadQuality: "COLD" },
      ],
    },
    application: {
      findMany: async () => [{ id: "app-1" }],
    },
    campaignCost: {
      findMany: async () => [{ amountMyr: 1000 }, { amountMyr: 500 }],
    },
    enrolment: {
      findMany: async () => [
        {
          netTuitionMyr: 10000,
          revenueBasis: "FIRST_YEAR",
        },
        {
          netTuitionMyr: 24000,
          revenueBasis: "FULL_PROGRAMME",
        },
      ],
    },
    offer: {
      count: async () => 1,
    },
  };

  const snapshot = await buildCampaignMetricSnapshot("campaign-1", tx);

  assert.equal(snapshot.totalLeads, 2);
  assert.equal(snapshot.qualifiedLeads, 1);
  assert.equal(snapshot.totalApplications, 1);
  assert.equal(snapshot.totalOffers, 1);
  assert.equal(snapshot.totalEnrolments, 2);
  assert.equal(snapshot.actualSpendMyr, 1500);
  assert.equal(snapshot.firstYearRevenueMyr, 10000);
  assert.equal(snapshot.fullProgrammeRevenueMyr, 24000);
  assert.equal(snapshot.netRevenueMyr, 34000);
  assert.equal(Number(snapshot.conversionRate.toFixed(2)), 100);
});
