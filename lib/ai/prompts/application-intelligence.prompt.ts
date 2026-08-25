import { APPLICATION_EMAIL_PROMPT } from "./application-email.prompt";
import { BULLET_REWRITER_PROMPT } from "./bullet-rewriter.prompt";
import { COVER_LETTER_PROMPT } from "./cover-letter.prompt";
import { FOLLOW_UP_PROMPT } from "./follow-up.prompt";
import { IMPROVED_RESUME_PROMPT } from "./improved-resume.prompt";
import { KEYWORD_ANALYSIS_PROMPT } from "./keyword-analysis.prompt";
import { OPTIMIZATION_PLAN_PROMPT } from "./optimization-plan.prompt";
import { PROFESSIONAL_SUMMARY_PROMPT } from "./professional-summary.prompt";
import { RECOMMENDATIONS_PROMPT } from "./recommendations.prompt";
import { REFINEMENT_PASS_PROMPT } from "./refinement-pass.prompt";
import { REQUIREMENT_COVERAGE_PROMPT } from "./requirement-coverage.prompt";
import { SCORING_PROMPT } from "./scoring.prompt";

export const APPLICATION_INTELLIGENCE_PROMPT_VERSION =
  "application-intelligence-v2";

const sections = [
  REQUIREMENT_COVERAGE_PROMPT,
  KEYWORD_ANALYSIS_PROMPT,
  OPTIMIZATION_PLAN_PROMPT,
  IMPROVED_RESUME_PROMPT,
  BULLET_REWRITER_PROMPT,
  PROFESSIONAL_SUMMARY_PROMPT,
  COVER_LETTER_PROMPT,
  APPLICATION_EMAIL_PROMPT,
  FOLLOW_UP_PROMPT,
  RECOMMENDATIONS_PROMPT,
  SCORING_PROMPT,
];

export type EvidenceCorrection = {
  requirement: string;
  markedIncorrect: boolean;
  evidence: string | null;
  notes: string | null;
};

export type PreviousOptimization = {
  improvedResume: string;
  professionalSummary: string;
  unresolvedRequirements: string[];
  unresolvedKeywords: string[];
};

export function formatEvidenceCorrections(corrections: EvidenceCorrection[]) {
  if (corrections.length === 0) {
    return null;
  }

  const lines = corrections.map((correction) => {
    const parts = [`Requirement: ${correction.requirement}`];

    if (correction.markedIncorrect) {
      parts.push("The candidate says the earlier conclusion was wrong.");
    }

    if (correction.evidence) {
      parts.push(`Evidence they supplied: ${correction.evidence}`);
    }

    if (correction.notes) {
      parts.push(`Their note: ${correction.notes}`);
    }

    return `- ${parts.join(" ")}`;
  });

  return ["<candidate_corrections>", ...lines, "</candidate_corrections>"].join(
    "\n",
  );
}

export function formatPreviousOptimization(
  previous: PreviousOptimization | null | undefined,
) {
  if (!previous || !previous.improvedResume.trim()) {
    return null;
  }

  const lines = ["<previous_optimized_resume>", previous.improvedResume];

  if (previous.professionalSummary.trim()) {
    lines.push(
      "<previous_professional_summary>",
      previous.professionalSummary,
      "</previous_professional_summary>",
    );
  }

  if (previous.unresolvedRequirements.length > 0) {
    lines.push(
      "<requirements_still_unproven>",
      ...previous.unresolvedRequirements.map((item) => `- ${item}`),
      "</requirements_still_unproven>",
    );
  }

  if (previous.unresolvedKeywords.length > 0) {
    lines.push(
      "<wording_gaps_still_open>",
      ...previous.unresolvedKeywords.map((item) => `- ${item}`),
      "</wording_gaps_still_open>",
    );
  }

  lines.push("</previous_optimized_resume>");

  return lines.join("\n");
}

export function createApplicationIntelligencePrompt(
  corrections: EvidenceCorrection[] = [],
  options: { refinement?: boolean } = {},
) {
  const base = [
    "Analyze the supplied resume against the supplied job posting.",
    "Produce one complete HireLens application-intelligence response.",
    "The response must contain all requested sections.",
    "",
    ...sections,
  ];

  if (options.refinement) {
    base.push("", REFINEMENT_PASS_PROMPT);
  }

  const correctionBlock = formatEvidenceCorrections(corrections);

  if (!correctionBlock) {
    return base.join("\n\n");
  }

  return [
    ...base,
    "",
    "CANDIDATE CORRECTIONS:",
    "",
    "The candidate has previously corrected conclusions about their own experience.",
    "Their corrections describe their real experience and take precedence over what you infer from the resume alone.",
    "Do not repeat a conclusion they have marked as incorrect.",
    correctionBlock,
  ].join("\n\n");
}
