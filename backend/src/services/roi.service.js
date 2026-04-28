export const safeDiv = (n, d) => (!d || Number(d) === 0 ? 0 : Number(n) / Number(d));
export function calculateRoi({ leads=0, applications=0, offers=0, enrolments=0, spend=0, tuitionRevenue=0, scholarship=0 }) {
  const netRevenue = Number(tuitionRevenue) - Number(scholarship);
  const netReturn = netRevenue - Number(spend);
  return {
    totalLeads: leads, totalApplications: applications, totalOffers: offers, totalEnrolments: enrolments,
    leadToApplicationRate: safeDiv(applications, leads) * 100,
    applicationToOfferRate: safeDiv(offers, applications) * 100,
    offerToEnrolmentRate: safeDiv(enrolments, offers) * 100,
    overallConversionRate: safeDiv(enrolments, leads) * 100,
    costPerLead: safeDiv(spend, leads), costPerApplication: safeDiv(spend, applications), costPerOffer: safeDiv(spend, offers), costPerEnrolledStudent: safeDiv(spend, enrolments),
    tuitionRevenue, scholarship, netRevenue, netReturn, roiRatio: safeDiv(netRevenue, spend), roiPercentage: safeDiv(netReturn, spend) * 100
  };
}
