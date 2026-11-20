import type { CandidateProfile } from "@/lib/db/schema";

export type ProfileFields = Omit<
  CandidateProfile,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

type Field = keyof ProfileFields;

const CHECKS: [field: Field, label: string, required: boolean][] = [
  ["targetRoles", "Target roles", true],
  ["seniority", "Seniority", true],
  ["yearsExperience", "Years of experience", true],
  ["currentLocation", "Current location", true],
  ["workArrangements", "Work arrangements", true],
  ["authorizedCountries", "Work authorization", true],
  ["requiresSponsorship", "Sponsorship", true],
  ["phone", "Phone", true],
  ["headline", "Headline", false],
  ["targetLocations", "Target locations", false],
  ["salaryMin", "Minimum salary", false],
  ["noticePeriodWeeks", "Notice period", false],
  ["linkedinUrl", "LinkedIn", false],
  ["githubUrl", "GitHub", false],
  ["portfolioUrl", "Portfolio", false],
];

function isFilled(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== null && value !== undefined && value !== "";
}

export type ProfileCompleteness = {
  percent: number;
  readyToApply: boolean;
  missingRequired: { field: Field; label: string }[];
};

export function profileCompleteness(
  profile: ProfileFields | null,
): ProfileCompleteness {
  const missing = CHECKS.filter(
    ([field]) => !profile || !isFilled(profile[field]),
  );
  const missingRequired = missing
    .filter(([, , required]) => required)
    .map(([field, label]) => ({ field, label }));

  return {
    percent: Math.round(((CHECKS.length - missing.length) / CHECKS.length) * 100),
    readyToApply: missingRequired.length === 0,
    missingRequired,
  };
}
