import { z } from "zod";

export const followUpCreateSchema = z.object({
  leadId: z.string().cuid(),
  followUpType: z.enum([
    "EMAIL",
    "WHATSAPP",
    "CALL",
    "MEETING",
    "BROCHURE_SENT",
    "APPLICATION_GUIDE_SENT",
    "OTHER",
  ]),
  followUpDate: z.coerce.date().optional(),
  nextFollowUpDate: z.coerce.date().optional().nullable(),
  outcome: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  staffId: z.string().cuid().optional(),
});
