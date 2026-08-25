import type { ImprovedResume } from "./schemas/improved-resume.schema";

const NUMERIC_TOKEN =
  /\d[\d,]*(?:\.\d+)?(?:\s*percent\b|%|k\b|m\b|bn\b|b\b|x\b)?/gi;
const YEAR_CLAIM = /(?<![\d.])(\d{1,2})\s*\+?\s*(?:or more\s+)?years?\b/gi;
const ENTITY_MIN_LENGTH = 3;

function normalizeToken(raw: string) {
  const cleaned = raw.toLowerCase().replace(/[\s,]/g, "");
  const match = /^(\d+(?:\.\d+)?)(percent|%|k|m|bn|b|x)?$/.exec(cleaned);

  if (!match) {
    return null;
  }

  const value = String(Number(match[1]));
  const suffix = match[2] ?? "";
  const unit = suffix === "bn" ? "b" : suffix === "percent" ? "%" : suffix;

  return `${value}${unit}`;
}

export function extractNumericEvidence(text: string): string[] {
  const found = new Set<string>();

  for (const match of text.matchAll(NUMERIC_TOKEN)) {
    const token = normalizeToken(match[0]);

    if (token) {
      found.add(token);
    }
  }

  return [...found];
}

export function extractYearClaims(text: string): number[] {
  const claims: number[] = [];

  for (const match of text.matchAll(YEAR_CLAIM)) {
    const value = Number(match[1]);

    if (Number.isFinite(value) && value > 0) {
      claims.push(value);
    }
  }

  return claims;
}

export function normalizeEntity(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function collectResumeEntities(resume: ImprovedResume): string[] {
  const found = new Set<string>();

  const add = (value: string | null | undefined) => {
    if (!value) {
      return;
    }

    const normalized = normalizeEntity(value);

    if (normalized.length >= ENTITY_MIN_LENGTH) {
      found.add(normalized);
    }
  };

  for (const entry of resume.experience) {
    add(entry.company);
    add(entry.title);
  }

  for (const entry of resume.education) {
    add(entry.institution);
    add(entry.qualification);
  }

  for (const entry of resume.certifications) {
    add(entry.name);
    add(entry.issuer);
  }

  for (const project of resume.projects) {
    add(project.name);

    for (const item of project.technologies) {
      add(item);
    }
  }

  for (const group of resume.skills) {
    for (const item of group.items) {
      add(item);
    }
  }

  return [...found];
}

export type EvidenceAudit = {
  sourceEvidenceCount: number;
  preserved: string[];
  lost: string[];
  unsupported: string[];
  inflatedYearClaims: number[];
  preservedEntities: string[];
  lostEntities: string[];
};

export function auditResumeEvidence(input: {
  sourceText: string;
  resumeText: string;
  entities?: string[];
}): EvidenceAudit {
  const source = extractNumericEvidence(input.sourceText);
  const resume = new Set(extractNumericEvidence(input.resumeText));
  const sourceSet = new Set(source);

  const supportedYears = extractYearClaims(input.sourceText);
  const maxSupported =
    supportedYears.length > 0 ? Math.max(...supportedYears) : null;

  const inflatedYearClaims =
    maxSupported === null
      ? []
      : extractYearClaims(input.resumeText).filter(
          (claim) => claim > maxSupported,
        );

  const normalizedSource = normalizeEntity(input.sourceText);
  const normalizedResume = normalizeEntity(input.resumeText);
  const supportedEntities = (input.entities ?? []).filter((entity) =>
    normalizedSource.includes(entity),
  );

  return {
    sourceEvidenceCount: source.length,
    preserved: source.filter((token) => resume.has(token)),
    lost: source.filter((token) => !resume.has(token)),
    unsupported: [...resume].filter((token) => !sourceSet.has(token)),
    inflatedYearClaims,
    preservedEntities: supportedEntities.filter((entity) =>
      normalizedResume.includes(entity),
    ),
    lostEntities: supportedEntities.filter(
      (entity) => !normalizedResume.includes(entity),
    ),
  };
}

export const regressionReasons = [
  "NO_SOURCE_TEXT",
  "NO_PREVIOUS_PASS",
  "NOT_WORSE",
  "LOST_EVIDENCE",
  "LOST_NAMED_EVIDENCE",
  "ADDED_UNSUPPORTED_NUMBERS",
  "INFLATED_EXPERIENCE",
] as const;

export type RegressionReason = (typeof regressionReasons)[number];

export type RegressionDecision = {
  keepPrevious: boolean;
  reason: RegressionReason;
  previous: EvidenceAudit | null;
  next: EvidenceAudit | null;
};

export function compareOptimizationPasses(input: {
  sourceText: string | null;
  previousResumeText: string | null;
  nextResumeText: string;
  previousEntities?: string[];
  nextEntities?: string[];
}): RegressionDecision {
  const sourceText = input.sourceText?.trim();
  const previousResumeText = input.previousResumeText?.trim();

  if (!sourceText) {
    return {
      keepPrevious: false,
      reason: "NO_SOURCE_TEXT",
      previous: null,
      next: null,
    };
  }

  const entities = [
    ...new Set([
      ...(input.previousEntities ?? []),
      ...(input.nextEntities ?? []),
    ]),
  ];

  if (!previousResumeText) {
    return {
      keepPrevious: false,
      reason: "NO_PREVIOUS_PASS",
      previous: null,
      next: auditResumeEvidence({
        sourceText,
        resumeText: input.nextResumeText,
        entities,
      }),
    };
  }

  const previous = auditResumeEvidence({
    sourceText,
    resumeText: previousResumeText,
    entities,
  });
  const next = auditResumeEvidence({
    sourceText,
    resumeText: input.nextResumeText,
    entities,
  });

  const reason: RegressionReason | null =
    next.preserved.length < previous.preserved.length
      ? "LOST_EVIDENCE"
      : next.preservedEntities.length < previous.preservedEntities.length
        ? "LOST_NAMED_EVIDENCE"
        : next.inflatedYearClaims.length > previous.inflatedYearClaims.length
          ? "INFLATED_EXPERIENCE"
          : next.unsupported.length > previous.unsupported.length
            ? "ADDED_UNSUPPORTED_NUMBERS"
            : null;

  return {
    keepPrevious: reason !== null,
    reason: reason ?? "NOT_WORSE",
    previous,
    next,
  };
}
