"use client";

import { FeedStatus } from "@/components/ui/feed-status";
import { DocumentCardSkeleton } from "@/components/ui/skeletons";
import { queryKeys } from "@/lib/query/query-keys";
import { useFeed } from "@/lib/query/use-feed";
import { loadMoreDocumentsAction } from "../actions/document-feed-actions";
import type { DocumentListRow } from "../server/document.repository";
import { DocumentCard } from "./document-card";

const SKELETON_COUNT = 4;

export function DocumentFeed({
  initialRows,
  initialCursor,
  filters,
}: {
  initialRows: DocumentListRow[];
  initialCursor: string | null;
  filters: { type: string; from: string; to: string };
}) {
  const { rows, sentinelRef, loadMore, loading, failed, hasMore } = useFeed({
    queryKey: queryKeys.documents(filters),
    firstParam: "",
    initialPage: { rows: initialRows, next: initialCursor },
    fetchPage: async (cursor: string) => {
      const page = await loadMoreDocumentsAction({ cursor, ...filters });

      return { rows: page.rows, next: page.nextCursor };
    },
  });

  return (
    <div className="space-y-4">
      <ul
        aria-busy={loading}
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3"
      >
        {rows.map((row) => (
          <li key={row.publicId}>
            <DocumentCard row={row} />
          </li>
        ))}

        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <li key={`skeleton-${index}`} aria-hidden>
                <DocumentCardSkeleton />
              </li>
            ))
          : null}
      </ul>

      <FeedStatus
        sentinelRef={sentinelRef}
        noun="documents"
        loading={loading}
        failed={failed}
        hasMore={hasMore}
        isEmpty={rows.length === 0}
        onRetry={loadMore}
      />
    </div>
  );
}
