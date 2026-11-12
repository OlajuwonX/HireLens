"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/components/ui/toast";
import { queryKeys } from "@/lib/query/query-keys";
import { getPostingAction, savePostingAction } from "../actions/discovery-actions";

export function PostingDialog({ publicId, onClose }: { publicId: string; onClose: () => void }) {
  const posting = useQuery({
    queryKey: queryKeys.posting(publicId),
    queryFn: () => getPostingAction(publicId),
    staleTime: 5 * 60_000,
  });

  const save = useMutation({
    mutationFn: () => savePostingAction(publicId),
    onSuccess: (result) => {
      if (!result.ok) {
        notify.error(result.message);
        return;
      }

      notify.success(result.alreadySaved ? "Already in your saved jobs." : "Saved to your jobs.");
    },
    onError: () => notify.error("The job could not be saved. Please try again."),
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
          <p className="mt-4 whitespace-pre-line text-meta leading-relaxed text-text-primary">
            {data.description}
          </p>
        ) : (
          <p className="mt-4 text-meta text-text-secondary">This job is no longer available.</p>
        )}

        {data ? (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <a href={data.applyUrl ?? data.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden />
                Open original posting
              </a>
            </Button>
            <Button type="button" disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? "Saving..." : "Save to my jobs"}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
