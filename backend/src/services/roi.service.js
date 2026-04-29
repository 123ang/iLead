export const safeDiv = (n, d) =>
  !d || Number(d) === 0 ? 0 : Number(n) / Number(d);

/**
 * @returns ROI fields; `roiRatio` / `roiPercentage` are null when spend is zero (not comparable)
 */
export function calculateRoi({
  leads = 0,
  qualifiedLeads = leads,
  applications = 0,
  offers = 0,
  enrolments = 0,
  spend = 0,
  tuitionRevenue = 0,
  scholarship = 0,
  fullProgrammeRevenue = null,
}) {
  const netRevenue = Number(tuitionRevenue) - Number(scholarship);
  const netReturn = netRevenue - Number(spend);
  const hasSpend = Number(spend) > 0;
  const effectiveFullProgrammeRevenue =
    fullProgrammeRevenue == null ? Number(tuitionRevenue) : Number(fullProgrammeRevenue);

  return {
    totalLeads: leads,
    qualifiedLeads,
    totalApplications: applications,
    totalOffers: offers,
    totalEnrolments: enrolments,
    leadToApplicationRate: safeDiv(applications, leads) * 100,
    applicationToOfferRate: safeDiv(offers, applications) * 100,
    offerToEnrolmentRate: safeDiv(enrolments, offers) * 100,
    overallConversionRate: safeDiv(enrolments, leads) * 100,
    costPerLead: safeDiv(spend, leads),
    costPerApplication: safeDiv(spend, applications),
    costPerOffer: safeDiv(spend, offers),
    costPerEnrolledStudent: safeDiv(spend, enrolments),
    tuitionRevenue: Number(tuitionRevenue),
    fullProgrammeRevenue: effectiveFullProgrammeRevenue,
    scholarship: Number(scholarship),
    netRevenue,
    netReturn,
    roiRatio: hasSpend ? safeDiv(netRevenue, spend) : null,
    roiPercentage: hasSpend ? safeDiv(netReturn, spend) * 100 : null,
    fullProgrammeRoiRatio: hasSpend ? safeDiv(effectiveFullProgrammeRevenue, spend) : null,
    fullProgrammeRoiPercentage: hasSpend
      ? safeDiv(effectiveFullProgrammeRevenue - Number(spend), spend) * 100
      : null,
  };
}
