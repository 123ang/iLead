import { z } from 'zod';
export const campaignCreateSchema = z.object({
  name: z.string().min(2), campaignType: z.string(), startDate: z.coerce.date(), endDate: z.coerce.date(),
  objective: z.string().optional(), status: z.string().optional(), approvedBudgetMyr: z.coerce.number().optional(),
  countryIds: z.array(z.string()).optional(), facultyIds: z.array(z.string()).optional(), programmeIds: z.array(z.string()).optional()
});
