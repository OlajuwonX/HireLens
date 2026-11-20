import { collectResumeEntities, compareOptimizationPasses } from "@/lib/ai/evidence-audit";
import { measureChange } from "@/lib/ai/resume-diff";
import { validateOptimizedResume } from "@/lib/ai/resume-validation";
import type {
  ApplicationIntelligence,
  StoredApplicationIntelligence,
} from "@/lib/ai/schemas/application-intelligence.schema";
import type { ResumeValidation } from "@/lib/ai/schemas/resume-validation.schema";
import type { SourceEvidence } from "@/lib/ai/source-evidence";
import { improvedResumeToText } from "./analysis.mapper";

export const MEANINGFUL_CHANGE = 0.03;

export type OptimizationOutcome =
  | "FIRST_PASS"
  | "IMPROVED"
  | "ALREADY_OPTIMIZED"
  | "KEPT_PREVIOUS";

type Pass = Pick<StoredApplicationIntelligence, "improvedResume" | "traceability">;

export type GateInput = {
  sourceText: string;
  supplementText?: string;
  evidence: SourceEvidence[];
  previous: (Pass & { validation: ResumeValidation | null }) | null;
  next: ApplicationIntelligence;
};

export type GateDecision = {
  result: ApplicationIntelligence & { validation: ResumeValidation };
  outcome: OptimizationOutcome;
  reason: string;
};

function validate(input: GateInput, pass: Pass) {
  return validateOptimizedResume({
    sourceText: input.sourceText,
    supplementText: input.supplementText,
    resume: pass.improvedResume,
    resumeText: improvedResumeToText(pass.improvedResume),
    evidence: input.evidence,
    traceability: pass.traceability,
  });
}

export function decideOptimization(input: GateInput): GateDecision {
  const nextValidation = validate(input, input.next);
  const accepted = { ...input.next, validation: nextValidation };
  const previous = input.previous;

  if (!previous || !input.sourceText.trim()) {
    return { result: accepted, outcome: "FIRST_PASS", reason: "NO_PREVIOUS_PASS" };
  }

  const previousText = improvedResumeToText(previous.improvedResume);
  const nextText = improvedResumeToText(input.next.improvedResume);
  const previousValidation = previous.validation ?? validate(input, previous);

  const regression = compareOptimizationPasses({
    sourceText: input.sourceText,
    previousResumeText: previousText,
    nextResumeText: nextText,
    previousEntities: collectResumeEntities(previous.improvedResume),
    nextEntities: collectResumeEntities(input.next.improvedResume),
  });

  const reason = regression.keepPrevious
    ? regression.reason
    : nextValidation.errorCount > previousValidation.errorCount
      ? "MORE_VALIDATION_ERRORS"
      : null;

  if (reason) {
    return {
      result: {
        ...input.next,
        improvedResume: previous.improvedResume,
        traceability: previous.traceability,
        validation: previousValidation,
      },
      outcome: "KEPT_PREVIOUS",
      reason,
    };
  }

  return measureChange(previousText, nextText) < MEANINGFUL_CHANGE
    ? { result: accepted, outcome: "ALREADY_OPTIMIZED", reason: "NO_MEANINGFUL_CHANGE" }
    : { result: accepted, outcome: "IMPROVED", reason: "NOT_WORSE" };
}
