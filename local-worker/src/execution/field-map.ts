import type { Candidate } from "../contract";
import { findAnswer } from "./answer-match";
import { RESUME_FILE, type Fill, type FillPlan, type FormField } from "./fields";

export type FillData = {
  candidate: Candidate;
  answers: { question: string; answer: string }[];
  coverLetter: string | null;
};

const SENSITIVE = /\b(gender|sex|pronoun|race|ethnic|hispanic|latino|veteran|disabilit|sexual orientation|transgender|age)\b/i;
const yesNo = (value: boolean | null) => (value === null ? null : value ? "Yes" : "No");

type Rule = [RegExp, (data: FillData, label: string) => string | null];

const RULES: Rule[] = [
  [/\bfirst name|given name\b/i, (d) => d.candidate.firstName || null],
  [/\blast name|surname|family name\b/i, (d) => d.candidate.lastName || null],
  [/^(full )?name$|\bfull name\b/i, (d) => d.candidate.fullName || null],
  [/\be-?mail\b/i, (d) => d.candidate.email || null],
  [/\bphone|mobile\b/i, (d) => d.candidate.phone],
  [/\blinkedin\b/i, (d) => d.candidate.linkedinUrl],
  [/\bgithub\b/i, (d) => d.candidate.githubUrl],
  [/\b(website|portfolio|personal site)\b/i, (d) => d.candidate.portfolioUrl],
  [/\bsponsor/i, (d) => yesNo(d.candidate.requiresSponsorship)],
  [/\brelocat/i, (d) => yesNo(d.candidate.willingToRelocate)],
  [/\b(authori[sz]ed|eligible|right) to work\b/i, (d, label) => authorized(d.candidate.authorizedCountries, label)],
  [/\b(salary|compensation|pay) (expectation|requirement|expected)|expected (salary|compensation)\b/i, (d) => salary(d.candidate)],
  [/\bnotice period\b/i, (d) => (d.candidate.noticePeriodWeeks === null ? null : `${d.candidate.noticePeriodWeeks} weeks`)],
  [/\byears of (professional )?experience\b/i, (d) => (d.candidate.yearsExperience === null ? null : String(d.candidate.yearsExperience))],
  [/\b(current )?(location|city)\b/i, (d) => d.candidate.location],
];

function authorized(countries: string[], label: string) {
  const lower = label.toLowerCase();

  return countries.some((country) => country.trim() && lower.includes(country.trim().toLowerCase())) ? "Yes" : null;
}

function salary(candidate: Candidate) {
  return candidate.salaryMin === null ? null : [candidate.salaryMin, candidate.salaryCurrency].filter(Boolean).join(" ");
}

function valueFor(field: FormField, data: FillData): Omit<Fill, "field"> | null {
  if (field.kind === "file") {
    return /\b(resume|cv)\b/i.test(field.label) ? { value: RESUME_FILE, source: "resume" } : null;
  }

  if (/\bcover letter\b/i.test(field.label)) {
    return field.kind === "textarea" && data.coverLetter ? { value: data.coverLetter, source: "cover-letter" } : null;
  }

  for (const [pattern, read] of RULES) {
    if (pattern.test(field.label)) {
      const value = read(data, field.label);

      return value ? { value, source: "profile" } : null;
    }
  }

  const answer = findAnswer(field.label, data.answers);

  return answer ? { value: answer, source: "answer" } : null;
}

export function planFields(fields: FormField[], data: FillData): FillPlan {
  const fills: Fill[] = [];
  const missing: string[] = [];

  for (const field of fields) {
    const planned = field.kind === "checkbox" || SENSITIVE.test(field.label) ? null : valueFor(field, data);

    if (planned) {
      fills.push({ field, ...planned });
    } else if (field.required) {
      missing.push(field.label || field.selector);
    }
  }

  return { fills, missing };
}
