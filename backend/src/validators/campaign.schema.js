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
