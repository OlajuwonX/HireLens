import type { ProfileFields } from "./completeness";
import type { ProfileInput } from "./schemas/profile.schema";

export function toProfileFields(input: ProfileInput): ProfileFields {
  return {
    headline: input.headline ?? null,
    seniority: input.seniority ?? null,
    yearsExperience: input.yearsExperience ?? null,
    currentLocation: input.currentLocation ?? null,
    targetRoles: input.targetRoles,
    targetLocations: input.targetLocations,
    workArrangements: input.workArrangements,
    authorizedCountries: input.authorizedCountries,
    requiresSponsorship:
      input.requiresSponsorship === undefined
        ? null
        : input.requiresSponsorship === "YES",
    willingToRelocate: input.willingToRelocate,
    salaryMin: input.salaryMin ?? null,
    salaryCurrency: input.salaryCurrency ?? null,
    noticePeriodWeeks: input.noticePeriodWeeks ?? null,
    phone: input.phone ?? null,
    linkedinUrl: input.linkedinUrl ?? null,
    githubUrl: input.githubUrl ?? null,
    portfolioUrl: input.portfolioUrl ?? null,
  };
}

export function sponsorshipValue(value: boolean | null) {
  if (value === null) {
    return "";
  }

  return value ? "YES" : "NO";
}
