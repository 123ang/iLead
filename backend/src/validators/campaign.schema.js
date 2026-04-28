import { z } from "zod";

const campaignType = z.enum([
  "EDUCATION_FAIR",
  "UNIVERSITY_VISIT",
  "ROADSHOW",
  "ACADEMIC_COLLABORATION",
  "CONFERENCE",
  "AGENT_EVENT",
  "DIGITAL_CAMPAIGN",
  "CIAC_UMBRELLA",
  "OTHER",
]);

const campaignStatus = z.enum(["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"]);

export const campaignCreateSchema = z.object({
  name: z.string().min(2),
  campaignType,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  objective: z.string().optional(),
  status: campaignStatus.optional(),
  approvedBudgetMyr: z.coerce.number().optional(),
  countryIds: z.array(z.string().cuid()).optional(),
  facultyIds: z.array(z.string().cuid()).optional(),
  programmeIds: z.array(z.string().cuid()).optional(),
});

export const campaignUpdateSchema = campaignCreateSchema.partial().extend({
  name: z.string().min(2).optional(),
});

export const campaignCostSchema = z.object({
  currencyId: z.string().cuid(),
  costType: z.enum([
    "TRAVEL",
    "ACCOMMODATION",
    "BOOTH",
    "MARKETING",
    "ALLOWANCE",
    "AGENCY",
    "DIGITAL",
    "OTHER",
  ]),
  description: z.string().optional().nullable(),
  amountOriginal: z.coerce.number().nonnegative(),
  fxRateToMyr: z.coerce.number().positive(),
  amountMyr: z.coerce.number().nonnegative().optional(),
  costDate: z.coerce.date().optional().nullable(),
});
