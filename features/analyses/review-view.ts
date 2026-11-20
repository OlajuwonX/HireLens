import { z } from "zod";
import { resumeReviewSchema, reviewVerdicts } from "@/lib/ai/schemas/resume-review.schema";
import { resumeValidationSchema } from "@/lib/ai/schemas/resume-validation.schema";

export const storedReviewSchema = z.object({
  review: resumeReviewSchema,
  validation: resumeValidationSchema,
});

export type ReviewView = z.infer<typeof storedReviewSchema> & {
  verdict: (typeof reviewVerdicts)[number];
  reviewedAt: string;
};

export function toReviewView(row: {
  verdict: string;
  resultJson: unknown;
  createdAt: Date;
}): ReviewView | null {
  const parsed = storedReviewSchema.safeParse(row.resultJson);
  const verdict = z.enum(reviewVerdicts).safeParse(row.verdict);

  if (!parsed.success || !verdict.success) {
    return null;
  }

  return {
    ...parsed.data,
    verdict: verdict.data,
    reviewedAt: row.createdAt.toISOString(),
  };
}
