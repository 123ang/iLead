import { z } from 'zod';
export const leadCreateSchema = z.object({
  fullName: z.string().min(1), email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(), passportNumber: z.string().optional(), externalLeadId: z.string().optional(),
  countryId: z.string().optional(), interestedProgrammeId: z.string().optional(), studyLevel: z.string().optional(),
  leadQuality: z.enum(['HOT','WARM','COLD']).default('WARM'), assignedStaffId: z.string().optional(), notes: z.string().optional(),
  campaignId: z.string().optional()
}).refine(v => [v.email, v.phone, v.passportNumber, v.externalLeadId].some(Boolean), { message: 'Lead must include at least one identifier: email, phone, passportNumber, or externalLeadId' });
