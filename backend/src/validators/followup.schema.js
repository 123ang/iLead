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

export const followUpUpdateSchema = z
  .object({
    followUpType: z
      .enum([
        "EMAIL",
        "WHATSAPP",
        "CALL",
        "MEETING",
        "BROCHURE_SENT",
        "APPLICATION_GUIDE_SENT",
        "OTHER",
      ])
      .optional(),
    followUpDate: z.coerce.date().optional(),
    nextFollowUpDate: z.coerce.date().optional().nullable(),
    outcome: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    staffId: z.string().cuid().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const followUpCompleteSchema = z.object({
  outcome: z.string().trim().min(1).optional(),
  notes: z.string().optional().nullable(),
});
