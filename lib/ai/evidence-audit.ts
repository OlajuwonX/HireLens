const NUMERIC_TOKEN = /\d[\d,]*(?:\.\d+)?(?:%|k\b|m\b|bn\b|b\b|x\b)?/gi;
const YEAR_CLAIM = /(?<![\d.])(\d{1,2})\s*\+?\s*(?:or more\s+)?years?\b/gi;

function normalizeToken(raw: string) {
  const cleaned = raw.toLowerCase().replace(/[\s,]/g, "");
  const match = /^(\d+(?:\.\d+)?)(%|k|m|bn|b|x)?$/.exec(cleaned);

  if (!match) {
    return null;
  }

  const value = String(Number(match[1]));
  const unit = match[2] === "bn" ? "b" : (match[2] ?? "");

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

export type EvidenceAudit = {
  sourceEvidenceCount: number;
  preserved: string[];
  lost: string[];
  unsupported: string[];
  inflatedYearClaims: number[];
};

export function auditResumeEvidence(input: {
  sourceText: string;
  resumeText: string;
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

  return {
    sourceEvidenceCount: source.length,
    preserved: source.filter((token) => resume.has(token)),
    lost: source.filter((token) => !resume.has(token)),
    unsupported: [...resume].filter((token) => !sourceSet.has(token)),
    inflatedYearClaims,
  };
}

export const regressionReasons = [
  "NO_SOURCE_TEXT",
  "NO_PREVIOUS_PASS",
  "NOT_WORSE",
  "LOST_EVIDENCE",
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
}): RegressionDecision {
  const sourceText = input.sourceText?.trim();
  const previousResumeText = input.previousResumeText?.trim();

  if (!sourceText || extractNumericEvidence(sourceText).length === 0) {
    return {
      keepPrevious: false,
      reason: "NO_SOURCE_TEXT",
      previous: null,
      next: null,
    };
  }

  if (!previousResumeText) {
    return {
      keepPrevious: false,
      reason: "NO_PREVIOUS_PASS",
      previous: null,
      next: auditResumeEvidence({
        sourceText,
        resumeText: input.nextResumeText,
      }),
    };
  }

  const previous = auditResumeEvidence({
    sourceText,
    resumeText: previousResumeText,
  });
  const next = auditResumeEvidence({
    sourceText,
    resumeText: input.nextResumeText,
  });

  const reason: RegressionReason | null =
    next.preserved.length < previous.preserved.length
      ? "LOST_EVIDENCE"
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
