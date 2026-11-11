import { Badge } from "@/components/ui/badge";
import type { ReviewVerdict } from "@/lib/ai/schemas/resume-review.schema";
import type { ReviewView } from "../review-view";

const verdicts: Record<ReviewVerdict, { label: string; tone: "green" | "yellow" | "red" }> = {
  APPROVED: { label: "Approved", tone: "green" },
  NEEDS_CHANGES: { label: "Needs changes", tone: "yellow" },
  REJECTED: { label: "Do not send yet", tone: "red" },
};

const scoreLabels: Record<keyof ReviewView["review"]["scores"], string> = {
  factualAccuracy: "Factual accuracy",
  requirementCoverage: "Requirement coverage",
  keywordRelevance: "Keyword relevance",
  bulletQuality: "Bullet quality",
  readability: "Readability",
  atsStructure: "ATS structure",
};

export function ReviewResult({ review }: { review: ReviewView }) {
  const verdict = verdicts[review.verdict];
  const scores = Object.entries(review.review.scores) as [keyof typeof scoreLabels, number][];

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <Badge tone={verdict.tone}>{verdict.label}</Badge>
        <p className="text-meta text-text-primary">{review.review.summary}</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        {scores.map(([key, value]) => (
          <div key={key} className="flex justify-between gap-2 text-label">
            <dt className="text-text-muted">{scoreLabels[key]}</dt>
            <dd className="font-mono text-text-primary">{value}</dd>
          </div>
        ))}
      </dl>

      {review.review.issues.length > 0 ? (
        <ul className="space-y-2">
          {review.review.issues.map((issue, index) => (
            <li key={index} className="space-y-0.5 text-meta">
              <p className="text-text-primary">
                <span className="font-medium">{issue.severity.toLowerCase()}</span>
                {issue.location ? ` · ${issue.location}` : ""}: {issue.problem}
              </p>
              {issue.fix ? <p className="text-text-secondary">Fix: {issue.fix}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-label text-text-muted">
        Scores are HireLens estimates, not an employer&apos;s real ATS result.
      </p>
    </div>
  );
}
