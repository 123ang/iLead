import { z } from "zod";

const optionalString = z.string().trim().min(1).optional().nullable();
const cuid = z.string().cuid();
const decimal = z.coerce.number().finite().nonnegative();
const active = z.boolean().optional();
const studyLevel = z.enum([
  "FOUNDATION",
  "BACHELOR",
  "MASTER",
  "PHD",
  "EXECUTIVE",
  "MOBILITY",
  "OTHER",
]);

function partial(schema) {
  return schema.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });
}

const country = z.object({
  name: z.string().trim().min(1),
  iso2: optionalString,
  iso3: optionalString,
  region: optionalString,
  isActive: active,
});

const faculty = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  isActive: active,
});

const programme = z.object({
  name: z.string().trim().min(1),
  code: optionalString,
  facultyId: cuid.optional().nullable(),
  studyLevel,
  durationYears: z.coerce.number().positive().optional(),
  isActive: active,
});

const currency = z.object({
  code: z.string().trim().min(3).max(3).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1),
  symbol: optionalString,
});

const fxRate = z.object({
  currencyId: cuid,
  rateToMyr: decimal,
  rateDate: z.coerce.date(),
  source: optionalString,
});

const tuitionFee = z.object({
  programmeId: cuid,
  studyLevel,
  amountMyr: decimal,
  academicYear: z.string().trim().min(1),
  annualFeeMyr: decimal.optional().nullable(),
  fullProgrammeFeeMyr: decimal.optional().nullable(),
  effectiveFrom: z.coerce.date().optional().nullable(),
  effectiveTo: z.coerce.date().optional().nullable(),
  isActive: active,
});

const scholarship = z.object({
  name: z.string().trim().min(1),
  type: optionalString,
  discountPercent: decimal.max(100).optional().nullable(),
  amountMyr: decimal.optional().nullable(),
  valueMyr: decimal.optional().nullable(),
  isPercent: z.boolean().optional(),
  isActive: active,
});

const sponsor = z.object({
  name: z.string().trim().min(1),
  countryId: cuid.optional().nullable(),
  isActive: active,
});

export const masterResources = {
  countries: {
    model: "country",
    entity: "Country",
    createSchema: country,
    updateSchema: partial(country),
    softDisable: true,
    orderBy: { name: "asc" },
  },
  faculties: {
    model: "faculty",
    entity: "Faculty",
    createSchema: faculty,
    updateSchema: partial(faculty),
    softDisable: true,
    orderBy: { name: "asc" },
  },
  programmes: {
    model: "programme",
    entity: "Programme",
    createSchema: programme,
    updateSchema: partial(programme),
    softDisable: true,
    include: { faculty: true },
    orderBy: { name: "asc" },
  },
  currencies: {
    model: "currency",
    entity: "Currency",
    createSchema: currency,
    updateSchema: partial(currency),
    softDisable: false,
    orderBy: { code: "asc" },
  },
  fxRates: {
    model: "fXRate",
    entity: "FXRate",
    createSchema: fxRate,
    updateSchema: partial(fxRate),
    softDisable: false,
    hardDelete: true,
    include: { currency: true },
    orderBy: { rateDate: "desc" },
  },
  tuitionFees: {
    model: "tuitionFee",
    entity: "TuitionFee",
    createSchema: tuitionFee,
    updateSchema: partial(tuitionFee),
    softDisable: true,
    include: { programme: true },
    orderBy: { createdAt: "desc" },
  },
  scholarships: {
    model: "scholarship",
    entity: "Scholarship",
    createSchema: scholarship,
    updateSchema: partial(scholarship),
    softDisable: true,
    orderBy: { name: "asc" },
  },
  sponsors: {
    model: "sponsor",
    entity: "Sponsor",
    createSchema: sponsor,
    updateSchema: partial(sponsor),
    softDisable: true,
    include: { country: true },
    orderBy: { name: "asc" },
  },
};
