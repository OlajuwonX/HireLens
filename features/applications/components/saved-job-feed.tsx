"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JobCardSkeleton } from "@/components/ui/skeletons";
import { ScoreRing } from "@/components/data-display/score-ring";
import type { ApplicationListRow } from "../server/application.repository";
import { shiftOffset } from "../feed-window";
import {
  loadMoreApplicationsAction,
  type ApplicationFeedPage,
} from "../actions/application-feed-actions";
import { ApplicationStatusBadge } from "./application-status-badge";
import { SavedJobCard } from "./saved-job-card";

const PREFETCH_MARGIN = "600px";
const SKELETON_COUNT = 4;

function shortDate(value: Date | null) {
  return value
    ? value.toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : "--";
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-system uppercase text-text-muted">
        {label}
      </dt>
      <dd className="truncate text-label text-text-secondary">{value}</dd>
    </div>
  );
}

export function SavedJobFeed({
  initialRows,
  initialNextOffset,
  filters,
  query,
}: {
  initialRows: ApplicationListRow[];
  initialNextOffset: number | null;
  filters: Record<string, string>;
  query: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [offset, setOffset] = useState(initialNextOffset);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  const shiftWindow = useCallback((delta: number) => {
    setOffset((current) => shiftOffset(current, delta));
  }, []);

  const loadMore = useCallback(async () => {
    if (inFlight.current || offset === null) {
      return;
    }

    inFlight.current = true;
    setLoading(true);
    setFailed(false);

    try {
      const page: ApplicationFeedPage = await loadMoreApplicationsAction({
        offset,
        filters,
      });

      setRows((current) => {
        const seen = new Set(current.map((row) => row.publicId));

        return [
          ...current,
          ...page.rows.filter((row) => !seen.has(row.publicId)),
        ];
      });
      setOffset(page.nextOffset);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [offset, filters]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || offset === null || failed) {
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
  }, [offset, failed, loadMore]);

  return (
    <div className="space-y-4">
      <ul
        aria-busy={loading}
        className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4"
      >
        {rows.map((row) => (
          <SavedJobCard
            key={row.publicId}
            publicId={row.publicId}
            title={row.title}
            archived={Boolean(row.archivedAt)}
            statusBadge={<ApplicationStatusBadge status={row.status} />}
            onLeave={() => shiftWindow(-1)}
            onReturn={() => shiftWindow(1)}
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/dashboard/jobs?${query ? `${query}&` : ""}open=${row.publicId}`}
                className="min-w-0 flex-1 before:absolute before:inset-0 before:content-['']"
              >
                <p className="truncate text-meta font-semibold text-text-primary">
                  {row.title}
                </p>
                <p className="truncate text-label text-text-secondary">
                  {row.company}
                </p>
              </Link>
              <ScoreRing
                score={row.matchScore}
                size={44}
                className="max-sm:hidden"
              />
              <ScoreRing
                score={row.matchScore}
                size={38}
                className="sm:hidden"
              />
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
              <Meta label="Resume" value={row.versionLabel ?? "Not set"} />
              <Meta label="Added" value={shortDate(row.createdAt)} />
              <Meta label="Deadline" value={shortDate(row.deadlineAt)} />
            </dl>
          </SavedJobCard>
        ))}

        {loading
          ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <li key={`skeleton-${index}`} aria-hidden>
                <JobCardSkeleton />
              </li>
            ))
          : null}
      </ul>

      <div ref={sentinelRef} aria-hidden className="h-px" />

      <p aria-live="polite" className="sr-only">
        {loading ? "Loading more saved jobs" : ""}
      </p>

      {failed ? (
        <div className="flex flex-col items-center gap-2 py-2">
          <p className="text-meta text-text-secondary">
            We could not load more saved jobs.
          </p>
          <Button type="button" variant="outline" onClick={() => loadMore()}>
            Try again
          </Button>
        </div>
      ) : null}

      {offset === null && !loading && rows.length > 0 ? (
        <p className="py-2 text-center font-mono text-system text-text-muted">
          End of your saved jobs
        </p>
      ) : null}
    </div>
  );
}
