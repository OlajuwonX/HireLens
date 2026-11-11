import type { RefObject } from "react";
import { Button } from "@/components/ui/button";

export function FeedStatus({
  sentinelRef,
  noun,
  loading,
  failed,
  hasMore,
  isEmpty,
  onRetry,
}: {
  sentinelRef: RefObject<HTMLDivElement | null>;
  noun: string;
  loading: boolean;
  failed: boolean;
  hasMore: boolean;
  isEmpty: boolean;
  onRetry: () => void;
}) {
  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px" />

      <p aria-live="polite" className="sr-only">
        {loading ? `Loading more ${noun}` : ""}
      </p>

      {failed ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <p className="text-meta text-text-secondary">
            We could not load more {noun}.
          </p>
          <Button type="button" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}

      {!hasMore && !loading && !isEmpty ? (
        <p className="py-2 text-center font-mono text-system text-text-muted">
          End of your {noun}
        </p>
      ) : null}
    </>
  );
}
