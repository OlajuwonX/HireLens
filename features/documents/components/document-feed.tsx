"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentCardSkeleton } from "@/components/ui/skeletons";
import {
  loadMoreDocumentsAction,
  type DocumentFeedPage,
} from "../actions/document-feed-actions";
import type { DocumentListRow } from "../server/document.repository";
import { DocumentCard } from "./document-card";

const PREFETCH_MARGIN = "600px";
const SKELETON_COUNT = 4;

export function DocumentFeed({
  initialRows,
  initialCursor,
  filters,
}: {
  initialRows: DocumentListRow[];
  initialCursor: string | null;
  filters: { q: string; type: string; from: string; to: string };
}) {
  const [rows, setRows] = useState(initialRows);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  const loadMore = useCallback(async () => {
    if (inFlight.current || !cursor) {
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setFailed(false);

    try {
      const page: DocumentFeedPage = await loadMoreDocumentsAction({
        cursor,
        ...filters,
      });

      setRows((current) => {
        const seen = new Set(current.map((row) => row.publicId));

        return [
          ...current,
          ...page.rows.filter((row) => !seen.has(row.publicId)),
        ];
      });
      setCursor(page.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [cursor, filters]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !cursor || failed) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: `${PREFETCH_MARGIN} 0px` },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [cursor, failed, loadMore]);

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

      <div ref={sentinelRef} aria-hidden className="h-px" />

      <p aria-live="polite" className="sr-only">
        {loading ? "Loading more documents" : ""}
      </p>

      {failed ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <p className="text-meta text-text-secondary">
            We could not load more documents.
          </p>
          <Button type="button" variant="outline" onClick={() => loadMore()}>
            Try again
          </Button>
        </div>
      ) : null}

      {!cursor && !loading && rows.length > 0 ? (
        <p className="py-2 text-center font-mono text-system text-text-muted">
          End of your documents
        </p>
      ) : null}
    </div>
  );
}
