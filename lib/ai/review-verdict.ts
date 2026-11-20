import type { ResumeReview, ReviewVerdict } from "./schemas/resume-review.schema";
import type { ResumeValidation } from "./schemas/resume-validation.schema";

const RANK: Record<ReviewVerdict, number> = {
  APPROVED: 0,
  NEEDS_CHANGES: 1,
  REJECTED: 2,
};

function strictest(...verdicts: ReviewVerdict[]) {
  return verdicts.reduce((worst, next) => (RANK[next] > RANK[worst] ? next : worst));
}

function fromIssues(review: ResumeReview): ReviewVerdict {
  if (review.issues.some((issue) => issue.severity === "CRITICAL")) {
    return "REJECTED";
  }

  return review.issues.some((issue) => issue.severity === "MAJOR")
    ? "NEEDS_CHANGES"
    : "APPROVED";
}

export function finalVerdict(
  review: ResumeReview,
  validation: ResumeValidation,
): ReviewVerdict {
  const deterministic: ReviewVerdict = validation.errorCount > 0 ? "REJECTED" : "APPROVED";

  return strictest(review.verdict, fromIssues(review), deterministic);
}
