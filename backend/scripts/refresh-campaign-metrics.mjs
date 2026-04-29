#!/usr/bin/env node
import { prisma } from "../src/config/db.js";
import { refreshCampaignMetricSnapshots } from "../src/services/campaign-metric-refresh.service.js";

const [, , campaignIdArg, metricDateArg] = process.argv;

try {
  const result = await refreshCampaignMetricSnapshots({
    campaignId: campaignIdArg || null,
    metricDate: metricDateArg ? new Date(metricDateArg) : new Date(),
  });

  console.log(
    `Refreshed ${result.count} campaign metric snapshot(s) for ${result.metricDate.toISOString().slice(0, 10)}.`,
  );
} finally {
  await prisma.$disconnect();
}
