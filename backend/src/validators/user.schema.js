import { z } from "zod";

const roles = [
  "SUPER_ADMIN",
  "MANAGEMENT",
  "CIAC_ADMIN",
  "FACULTY_DEAN",
  "PROGRAMME_COORDINATOR",
  "STAFF",
  "REGISTRAR",
  "FINANCE",
];

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  role: z.enum(roles),
  facultyId: z.string().cuid().optional().nullable(),
  temporaryPassword: z.string().min(8),
  isActive: z.boolean().optional(),
});

export const adminUserUpdateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    email: z.string().trim().email().transform((value) => value.toLowerCase()).optional(),
    role: z.enum(roles).optional(),
    facultyId: z.string().cuid().optional().nullable(),
    isActive: z.boolean().optional(),
    temporaryPassword: z.string().min(8).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });
