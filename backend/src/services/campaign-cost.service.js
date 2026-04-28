import { prisma } from "../config/db.js";

export async function refreshCampaignActualSpend(campaignId, tx = prisma) {
  const aggregate = await tx.campaignCost.aggregate({
    where: { campaignId },
    _sum: { amountMyr: true },
  });

  return tx.campaign.update({
    where: { id: campaignId },
    data: { actualSpendMyr: aggregate._sum.amountMyr ?? 0 },
  });
}

