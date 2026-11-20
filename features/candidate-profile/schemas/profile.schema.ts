import { z } from "zod";
import { blankToUndefined } from "@/lib/forms/blank-to-undefined";
import {
  PROFILE_LIMITS,
  PROFILE_WORK_ARRANGEMENTS,
  SENIORITY_LEVELS,
  SPONSORSHIP_OPTIONS,
} from "../constants";

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

const optionalUrl = z.preprocess(
  blankToUndefined,
  z.url("Enter a full link starting with https://").max(PROFILE_LIMITS.url).optional(),
);

const optionalInt = (max: number) =>
  z.preprocess(
    blankToUndefined,
    z.coerce.number().int("Use a whole number").min(0).max(max).optional(),
  );

export function splitList(value: unknown) {
  if (typeof value !== "string") {
    return [];
  }

  const items = value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.toLowerCase();

    return seen.has(key) ? false : Boolean(seen.add(key));
  });
}

const list = z.preprocess(
  splitList,
  z
    .array(z.string().max(PROFILE_LIMITS.listItemLength, "Keep each item short"))
    .max(PROFILE_LIMITS.listItems, `Add up to ${PROFILE_LIMITS.listItems} items`),
);

export const profileSchema = z.object({
  headline: optionalText(PROFILE_LIMITS.shortText),
  seniority: z.preprocess(blankToUndefined, z.enum(SENIORITY_LEVELS).optional()),
  yearsExperience: optionalInt(PROFILE_LIMITS.maxYears),
  currentLocation: optionalText(PROFILE_LIMITS.shortText),
  targetRoles: list,
  targetLocations: list,
  workArrangements: z.array(z.enum(PROFILE_WORK_ARRANGEMENTS)).max(3),
  authorizedCountries: list,
  requiresSponsorship: z.preprocess(
    blankToUndefined,
    z.enum(SPONSORSHIP_OPTIONS).optional(),
  ),
  willingToRelocate: z.boolean(),
  salaryMin: optionalInt(PROFILE_LIMITS.maxSalary),
  salaryCurrency: z.preprocess(
    blankToUndefined,
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code like USD")
      .optional(),
  ),
  noticePeriodWeeks: optionalInt(PROFILE_LIMITS.maxNoticeWeeks),
  phone: optionalText(40),
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
});

export type ProfileInput = z.infer<typeof profileSchema>;
