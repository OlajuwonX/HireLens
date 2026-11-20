import type { CandidateProfile } from "@/lib/db/schema";
import type { TextFieldConfig } from "./profile-text-field";

const LIST_HINT = "Separate with commas.";

export const roleFields: TextFieldConfig[] = [
  { name: "headline", label: "Headline", placeholder: "Frontend Engineer, React and TypeScript" },
  { name: "targetRoles", label: "Target roles", required: true, hint: LIST_HINT, placeholder: "Frontend Engineer, React Developer" },
  { name: "yearsExperience", label: "Years of experience", required: true, type: "number" },
];

export const locationFields: TextFieldConfig[] = [
  { name: "currentLocation", label: "Current location", required: true, placeholder: "Lagos, Nigeria" },
  { name: "targetLocations", label: "Target locations", hint: LIST_HINT, placeholder: "Remote, London" },
  { name: "authorizedCountries", label: "Countries you can work in without sponsorship", required: true, hint: LIST_HINT, placeholder: "Nigeria" },
];

export const compensationFields: TextFieldConfig[] = [
  { name: "salaryMin", label: "Minimum yearly salary", type: "number" },
  { name: "salaryCurrency", label: "Currency", placeholder: "USD" },
  { name: "noticePeriodWeeks", label: "Notice period (weeks)", type: "number" },
];

export const contactFields: TextFieldConfig[] = [
  { name: "phone", label: "Phone", required: true, type: "tel" },
  { name: "linkedinUrl", label: "LinkedIn", type: "url", placeholder: "https://linkedin.com/in/you" },
  { name: "githubUrl", label: "GitHub", type: "url", placeholder: "https://github.com/you" },
  { name: "portfolioUrl", label: "Portfolio", type: "url", placeholder: "https://you.dev" },
];

export function defaultValueFor(
  profile: CandidateProfile | null,
  name: string,
  submitted?: Record<string, string>,
): string {
  if (submitted) {
    return submitted[name] ?? "";
  }

  const value = profile?.[name as keyof CandidateProfile];

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return value === null || value === undefined ? "" : String(value);
}
