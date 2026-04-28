import { prisma } from '../config/db.js';
import { calculateRoi } from './roi.service.js';
export async function executiveDashboard() {
  const [campaigns, leads, applications, costs] = await Promise.all([
    prisma.campaign.count({ where: { deletedAt: null } }), prisma.lead.count({ where: { deletedAt: null } }),
    prisma.application.findMany({ where: { deletedAt: null } }), prisma.campaignCost.findMany()
  ]);
  const spend = costs.reduce((s,c)=>s+Number(c.amountMyr),0);
  const offers = applications.filter(a => ['OFFERED','ACCEPTED','ENROLLED'].includes(a.applicationStatus)).length;
  const enrolments = applications.filter(a => a.applicationStatus === 'ENROLLED').length;
  const tuitionRevenue = applications.reduce((s,a)=>s+Number(a.tuitionRevenueMyr || 0),0);
  const scholarship = applications.reduce((s,a)=>s+Number(a.scholarshipMyr || 0),0);
  return { campaigns, ...calculateRoi({ leads, applications: applications.length, offers, enrolments, spend, tuitionRevenue, scholarship }) };
}
