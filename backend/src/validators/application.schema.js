import { z } from "zod";

export const applicationCreateSchema = z.object({
  applicantName: z.string().min(1),
  leadId: z.string().cuid().optional().nullable(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  phone: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
  countryId: z.string().cuid().optional().nullable(),
  programmeId: z.string().cuid().optional().nullable(),
  studyLevel: z
    .enum([
      "FOUNDATION",
      "BACHELOR",
      "MASTER",
      "PHD",
      "EXECUTIVE",
      "MOBILITY",
      "OTHER",
    ])
    .optional()
    .nullable(),
  applicationStatus: z
    .enum([
      "APPLIED",
      "UNDER_REVIEW",
      "OFFERED",
      "REJECTED",
      "ACCEPTED",
      "ENROLLED",
      "WITHDRAWN",
    ])
    .optional(),
  applicationDate: z.coerce.date().optional().nullable(),
  offerDate: z.coerce.date().optional().nullable(),
  enrolmentDate: z.coerce.date().optional().nullable(),
  sourceCampaignId: z.string().cuid().optional().nullable(),
  scholarshipMyr: z.coerce.number().nonnegative().optional(),
  tuitionRevenueMyr: z.coerce.number().nonnegative().optional(),
});
