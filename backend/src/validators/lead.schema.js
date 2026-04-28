import { z } from "zod";
import { leadHasIdentifier } from "../services/lead-identity.service.js";

const leadStatus = z.enum([
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "APPLIED",
  "OFFERED",
  "ENROLLED",
  "LOST",
  "DUPLICATE",
]);

const studyLevel = z.enum([
  "FOUNDATION",
  "BACHELOR",
  "MASTER",
  "PHD",
  "EXECUTIVE",
  "MOBILITY",
  "OTHER",
]);

const baseLeadSchema = z
  .object({
    fullName: z.string().min(1),
    email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
    phone: z.string().optional().nullable(),
    passportNumber: z.string().optional().nullable(),
    externalLeadId: z.string().optional().nullable(),
    countryId: z.string().cuid().optional().nullable(),
    interestedProgrammeId: z.string().cuid().optional().nullable(),
    studyLevel: studyLevel.optional().nullable(),
    leadQuality: z.enum(["HOT", "WARM", "COLD"]).default("WARM"),
    assignedStaffId: z.string().cuid().optional().nullable(),
    notes: z.string().optional().nullable(),
    campaignId: z.string().cuid().optional().nullable(),
    source: z
      .enum([
        "EVENT_FORM",
        "CSV_UPLOAD",
        "QR_CODE",
        "WEBSITE",
        "MANUAL_ENTRY",
        "AGENT_REFERRAL",
        "OTHER",
      ])
      .optional()
      .nullable(),
    status: leadStatus.optional(),
  })
  .refine(leadHasIdentifier, {
    message:
      "Lead must include at least one identifier: email, phone, passportNumber, or externalLeadId",
  });

export const leadCreateSchema = baseLeadSchema;

export const leadUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  phone: z.string().optional().nullable(),
  passportNumber: z.string().optional().nullable(),
  externalLeadId: z.string().optional().nullable(),
  countryId: z.string().cuid().optional().nullable(),
  interestedProgrammeId: z.string().cuid().optional().nullable(),
  studyLevel: studyLevel.optional().nullable(),
  leadQuality: z.enum(["HOT", "WARM", "COLD"]).optional(),
  assignedStaffId: z.string().cuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  campaignId: z.string().cuid().optional().nullable(),
  source: z
    .enum([
      "EVENT_FORM",
      "CSV_UPLOAD",
      "QR_CODE",
      "WEBSITE",
      "MANUAL_ENTRY",
      "AGENT_REFERRAL",
      "OTHER",
    ])
    .optional()
    .nullable(),
  status: leadStatus.optional(),
});

export const leadAssignSchema = z.object({
  assignedStaffId: z.string().cuid(),
});

export const leadStatusSchema = z.object({
  status: leadStatus,
  reason: z.string().optional(),
});
