"use client";

import { useQuery } from "@tanstack/react-query";
import { FormattedText } from "@/components/data-display/formatted-text";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { queryKeys } from "@/lib/query/query-keys";
import { getPostingAction } from "../actions/discovery-actions";
import { PostingActions } from "./posting-actions";

export function PostingDialog({ publicId, onClose }: { publicId: string; onClose: () => void }) {
  const posting = useQuery({
    queryKey: queryKeys.posting(publicId),
    queryFn: () => getPostingAction(publicId),
    staleTime: 5 * 60_000,
  });

  const data = posting.data;

  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border border-border sm:max-w-2xl">
        <div className="space-y-1 pr-8">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            {data?.title ?? "Job details"}
          </DialogTitle>
          <DialogDescription className="text-meta text-text-secondary">
            {data ? [data.company, data.location].filter(Boolean).join(" · ") : "Loading"}
          </DialogDescription>
        </div>

        {posting.isLoading ? (
          <div className="mt-4 space-y-2" aria-hidden>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        ) : data ? (
          <FormattedText text={data.description} className="mt-4" />
        ) : (
          <p className="mt-4 text-meta text-text-secondary">This job is no longer available.</p>
        )}

        {data ? <PostingActions publicId={publicId} href={data.applyUrl ?? data.url} /> : null}
      </DialogContent>
    </Dialog>
  );
}
