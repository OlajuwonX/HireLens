import { auditResumeEvidence, extractYearClaims, normalizeEntity } from "./evidence-audit";
import type { ImprovedResume } from "./schemas/improved-resume.schema";
import type {
  ResumeValidation,
  ValidationCode,
  ValidationIssue,
} from "./schemas/resume-validation.schema";
import type { TraceEntry } from "./schemas/traceability.schema";
import type { SourceEvidence } from "./source-evidence";

const ERRORS = new Set<ValidationCode>([
  "UNSUPPORTED_NUMBER",
  "INFLATED_YEARS",
  "CHANGED_DATE",
  "MISSING_SECTION",
]);
const LIST_LIMIT = 6;
const YEAR = /\b(?:19|20)\d{2}\b/g;

export type ValidationInput = {
  sourceText: string;
  supplementText?: string;
  resume: ImprovedResume;
  resumeText: string;
  evidence: SourceEvidence[];
  traceability: TraceEntry[];
  now?: Date;
};

function issue(code: ValidationCode, items: (string | number)[], label: string) {
  if (items.length === 0) {
    return [];
  }

  const shown = items.slice(0, LIST_LIMIT).join(", ");
  const more = items.length > LIST_LIMIT ? ` and ${items.length - LIST_LIMIT} more` : "";

  return [
    {
      code,
      severity: ERRORS.has(code) ? "ERROR" : "WARNING",
      detail: `${label}: ${shown}${more}`,
    } satisfies ValidationIssue,
  ];
}

function inflatedYears(source: string, resumeText: string, now: Date) {
  const stated = extractYearClaims(source);
  const years = (source.match(YEAR) ?? []).map(Number);
  const ceiling =
    stated.length > 0
      ? Math.max(...stated)
      : years.length > 0
        ? now.getFullYear() - Math.min(...years)
        : null;

  return ceiling === null
    ? []
    : extractYearClaims(resumeText).filter((claim) => claim > ceiling);
}

function changedDates(source: string, resume: ImprovedResume) {
  const known = new Set(source.match(YEAR) ?? []);

  return resume.experience
    .flatMap((entry) => `${entry.startDate} ${entry.endDate}`.match(YEAR) ?? [])
    .filter((year) => !known.has(year));
}

function unsupportedTechnologies(source: string, resume: ImprovedResume) {
  const haystack = ` ${normalizeEntity(source)} `;
  const items = [
    ...resume.skills.flatMap((group) => group.items),
    ...resume.projects.flatMap((project) => project.technologies),
  ];

  return [...new Set(items)].filter((item) => {
    const needle = normalizeEntity(item);

    return needle.length > 0 && !haystack.includes(` ${needle} `);
  });
}

function traceGaps(evidence: SourceEvidence[], trace: TraceEntry[]) {
  const traced = new Set(trace.map((entry) => entry.sourceId));

  return {
    untraced: evidence.map((item) => item.id).filter((id) => !traced.has(id)),
    unexplained: trace
      .filter((entry) => entry.action === "DROP" && !entry.reason.trim())
      .map((entry) => entry.sourceId),
  };
}

function missingSections(resume: ImprovedResume, evidence: SourceEvidence[]) {
  return [
    ...(resume.professionalSummary.trim() ? [] : ["summary"]),
    ...(resume.experience.length === 0 && evidence.length > 0 ? ["experience"] : []),
  ];
}

export function validateOptimizedResume(input: ValidationInput): ResumeValidation {
  const source = [input.sourceText, input.supplementText ?? ""].join("\n");
  const audit = auditResumeEvidence({ sourceText: source, resumeText: input.resumeText });
  const trace = traceGaps(input.evidence, input.traceability);

  const issues = [
    ...issue("MISSING_SECTION", missingSections(input.resume, input.evidence), "Missing sections"),
    ...issue("UNSUPPORTED_NUMBER", audit.unsupported, "Numbers not found in your resume"),
    ...issue(
      "INFLATED_YEARS",
      inflatedYears(source, input.resumeText, input.now ?? new Date()),
      "Years of experience higher than your resume supports",
    ),
    ...issue("CHANGED_DATE", changedDates(source, input.resume), "Employment years not found in your resume"),
    ...issue("UNSUPPORTED_TECHNOLOGY", unsupportedTechnologies(source, input.resume), "Skills not found in your resume"),
    ...issue("LOST_NUMBER", audit.lost, "Numbers from your resume that were left out"),
    ...issue("UNTRACED_SOURCE", trace.untraced, "Original statements with no recorded decision"),
    ...issue("DROP_WITHOUT_REASON", trace.unexplained, "Statements removed without a reason"),
  ];

  return {
    issues,
    errorCount: issues.filter((item) => item.severity === "ERROR").length,
  };
}
