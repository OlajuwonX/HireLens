import { APPLICATION_EMAIL_PROMPT } from "./application-email.prompt";
import { BULLET_REWRITER_PROMPT } from "./bullet-rewriter.prompt";
import { COVER_LETTER_PROMPT } from "./cover-letter.prompt";
import { FOLLOW_UP_PROMPT } from "./follow-up.prompt";
import { IMPROVED_RESUME_PROMPT } from "./improved-resume.prompt";
import { KEYWORD_ANALYSIS_PROMPT } from "./keyword-analysis.prompt";
import { PROFESSIONAL_SUMMARY_PROMPT } from "./professional-summary.prompt";
import { RECOMMENDATIONS_PROMPT } from "./recommendations.prompt";
import { REQUIREMENT_COVERAGE_PROMPT } from "./requirement-coverage.prompt";
import { SCORING_PROMPT } from "./scoring.prompt";

export const APPLICATION_INTELLIGENCE_PROMPT_VERSION =
  "application-intelligence-v1";

const sections = [
  SCORING_PROMPT,
  RECOMMENDATIONS_PROMPT,
  KEYWORD_ANALYSIS_PROMPT,
  REQUIREMENT_COVERAGE_PROMPT,
  IMPROVED_RESUME_PROMPT,
  BULLET_REWRITER_PROMPT,
  PROFESSIONAL_SUMMARY_PROMPT,
  COVER_LETTER_PROMPT,
  APPLICATION_EMAIL_PROMPT,
  FOLLOW_UP_PROMPT,
];

export type EvidenceCorrection = {
  requirement: string;
  markedIncorrect: boolean;
  evidence: string | null;
  notes: string | null;
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

export function createApplicationIntelligencePrompt(
  corrections: EvidenceCorrection[] = [],
) {
  const base = [
    "Analyze the supplied resume against the supplied job posting.",
    "Produce one complete HireLens application-intelligence response.",
    "The response must contain all requested sections.",
    "",
    ...sections,
  ];

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
