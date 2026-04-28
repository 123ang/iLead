import { prisma } from "../config/db.js";

function buildEnrolmentData(application, overrides = {}) {
  const scholarshipMyr = Number(overrides.scholarshipMyr ?? application.scholarshipMyr ?? 0);
  const netTuitionMyr = Number(overrides.tuitionRevenueMyr ?? application.tuitionRevenueMyr ?? 0);
  return {
    programmeId: overrides.programmeId ?? application.programmeId ?? null,
    enrolmentDate: overrides.enrolmentDate ?? application.enrolmentDate ?? new Date(),
    grossTuitionMyr: netTuitionMyr + scholarshipMyr,
    scholarshipMyr,
    netTuitionMyr,
    revenueType:
      scholarshipMyr > 0 ? "PARTIAL_SCHOLARSHIP" : "SELF_FUNDED",
    revenueBasis: "FIRST_YEAR",
    manualAttributionCampaignId: overrides.manualAttributionCampaignId ?? null,
  };
}

export async function syncApplicationOutcomeRecords(applicationId, tx = prisma) {
  const application = await tx.application.findUnique({
    where: { id: applicationId },
    include: {
      offers: true,
      enrolments: true,
    },
  });
  if (!application) return null;

  const writes = [];
  const shouldHaveOffer = ["OFFERED", "ACCEPTED", "ENROLLED"].includes(application.applicationStatus);
  const shouldHaveEnrolment = application.applicationStatus === "ENROLLED";

  if (shouldHaveOffer && application.offerDate) {
    const existingOffer = application.offers[0];
    const offerData = {
      programmeId: application.programmeId ?? null,
      offerDate: application.offerDate,
      status:
        application.applicationStatus === "ACCEPTED" || application.applicationStatus === "ENROLLED"
          ? "ACCEPTED"
          : "ISSUED",
    };
    writes.push(
      existingOffer
        ? tx.offer.update({ where: { id: existingOffer.id }, data: offerData })
        : tx.offer.create({ data: { applicationId, ...offerData } }),
    );
  }

  if (shouldHaveEnrolment && application.enrolmentDate) {
    const existingEnrolment = application.enrolments[0];
    const enrolmentData = buildEnrolmentData(application);
    writes.push(
      existingEnrolment
        ? tx.enrolment.update({ where: { id: existingEnrolment.id }, data: enrolmentData })
        : tx.enrolment.create({ data: { applicationId, ...enrolmentData } }),
    );
  }

  if (!shouldHaveOffer && application.offers.length) {
    writes.push(tx.offer.deleteMany({ where: { applicationId } }));
  }
  if (!shouldHaveEnrolment && application.enrolments.length) {
    writes.push(tx.enrolment.deleteMany({ where: { applicationId } }));
  }

  if (!writes.length) return application;
  await Promise.all(writes);
  return tx.application.findUnique({
    where: { id: applicationId },
    include: { offers: true, enrolments: true },
  });
}

