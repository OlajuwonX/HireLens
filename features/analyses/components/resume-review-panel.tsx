"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { queryKeys } from "@/lib/query/query-keys";
import { getResumeReviewAction, runResumeReviewAction } from "../actions/review-actions";
import type { ReviewView } from "../review-view";
import { ReviewResult } from "./review-result";

export function ResumeReviewPanel({ applicationPublicId }: { applicationPublicId: string }) {
  const queryClient = useQueryClient();
  const key = queryKeys.resumeReview(applicationPublicId);

  const current = useQuery({
    queryKey: key,
    queryFn: () => getResumeReviewAction(applicationPublicId),
  });

  const run = useMutation({
    mutationFn: () => runResumeReviewAction(applicationPublicId),
    onSuccess: (result) => {
      if (!result.ok) {
        notify.error(result.message);
        return;
      }

      queryClient.setQueryData<ReviewView | null>(key, result.review);
    },
    onError: () => notify.error("The review could not be completed. Please try again."),
  });

  const review = current.data ?? null;

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-mono text-system font-medium uppercase text-text-muted">
          Independent review
        </h4>
        {review ? (
          <Badge tone="neutral">Reviewed {new Date(review.reviewedAt).toLocaleDateString()}</Badge>
        ) : null}
      </div>

      {review ? (
        <ReviewResult review={review} />
      ) : (
        <p className="text-meta text-text-secondary">
          A second AI pass checks this resume against your original for invented
          claims, lost achievements and hidden requirements. Uses one daily review.
        </p>
      )}

      {review ? null : (
        <Button
          type="button"
          variant="outline"
          disabled={run.isPending || current.isLoading}
          onClick={() => run.mutate()}
        >
          <ShieldCheck className="size-4" aria-hidden />
          {run.isPending ? "Reviewing..." : "Run independent review"}
        </Button>
      )}
    </section>
  );
}
