import { MatchPanel, type MatchPart } from "@/components/data-display/match-panel";
import type { StoredApplicationIntelligence } from "@/lib/ai/schemas/application-intelligence.schema";

type Scoring = StoredApplicationIntelligence["scoring"];

const parts: [keyof Scoring, string][] = [
  ["requirementsScore", "Requirements"],
  ["skillsScore", "Skills"],
  ["experienceScore", "Experience"],
  ["keywordScore", "Keywords"],
  ["atsScore", "ATS readability"],
];

export const REQUIREMENTS_ANCHOR = "requirements";

export function scoreParts(scoring: Scoring): MatchPart[] {
  return parts
    .map(([key, label]) => ({ label, score: scoring[key] }))
    .filter((part): part is MatchPart => typeof part.score === "number");
}

export function ScorePanel({
  scoring,
  context,
  showEvidence = false,
}: {
  scoring: Scoring;
  context?: string;
  showEvidence?: boolean;
}) {
  const breakdown = scoreParts(scoring);
  const total = typeof scoring.overallScore === "number" ? scoring.overallScore : null;

  if (total === null && breakdown.length === 0) {
    return null;
  }

  const footer =
    scoring.explanation || showEvidence ? (
      <div className="space-y-2">
        {scoring.explanation ? <p>{scoring.explanation}</p> : null}
        {showEvidence ? (
          <a href={`#${REQUIREMENTS_ANCHOR}`} className="inline-block text-ink-text underline underline-offset-4">
            See the evidence for each requirement
          </a>
        ) : null}
      </div>
    ) : null;

  return (
    <MatchPanel
      context={context}
      total={total ?? Math.round(breakdown.reduce((sum, part) => sum + part.score, 0) / breakdown.length)}
      parts={breakdown}
      footer={footer}
    />
  );
}
