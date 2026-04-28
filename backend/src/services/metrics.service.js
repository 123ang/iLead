import { prisma } from '../config/db.js';
import { calculateRoi } from './roi.service.js';
export async function campaignRoi(campaignId) {
  const [touches, apps, costs] = await Promise.all([
    prisma.leadCampaignTouch.count({ where: { campaignId } }),
    prisma.application.findMany({ where: { deletedAt: null } }),
    prisma.campaignCost.findMany({ where: { campaignId } })
  ]);
  const spend = costs.reduce((s,c)=>s+Number(c.amountMyr),0);
  const linkedApps = apps.filter(a => a.leadId);
  const offers = linkedApps.filter(a => ['OFFERED','ACCEPTED','ENROLLED'].includes(a.applicationStatus)).length;
  const enrolments = linkedApps.filter(a => a.applicationStatus === 'ENROLLED').length;
  return calculateRoi({ leads: touches, applications: linkedApps.length, offers, enrolments, spend, tuitionRevenue: linkedApps.reduce((s,a)=>s+Number(a.tuitionRevenueMyr || 0),0), scholarship: linkedApps.reduce((s,a)=>s+Number(a.scholarshipMyr || 0),0) });
}
