import { evaluateEligibility, type EligibilityProfile } from "@/lib/matching/eligibility";
import { relevanceHint } from "@/lib/matching/rank";

type Posting = {
  id: string;
  title: string;
  location: string | null;
  workArrangement: string;
  description: string;
};

export function screenPostings<P extends Posting>(input: {
  postings: P[];
  profile: EligibilityProfile | null;
  targets: string[];
  batchSize: number;
}) {
  const screened = input.postings.map((posting) => ({
    posting,
    ...evaluateEligibility(input.profile, posting),
    relevance: relevanceHint(posting.title, input.targets),
  }));

  const eligible = screened
    .filter((item) => item.verdict !== "FAIL")
    .sort((a, b) => b.relevance - a.relevance);

  return {
    rejected: screened.filter((item) => item.verdict === "FAIL"),
    batch: eligible.slice(0, input.batchSize),
    waiting: Math.max(0, eligible.length - input.batchSize),
  };
}

export type Screened<P extends Posting> = ReturnType<typeof screenPostings<P>>["batch"][number];
