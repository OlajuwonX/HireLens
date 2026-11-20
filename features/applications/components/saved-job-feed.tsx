"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { FeedStatus } from "@/components/ui/feed-status";
import { JobCardSkeleton } from "@/components/ui/skeletons";
import { queryKeys } from "@/lib/query/query-keys";
import { useFeed } from "@/lib/query/use-feed";
import type { ApplicationListRow } from "../server/application.repository";
import { APPLICATION_PAGE_SIZE } from "../constants";
import { createOffsetFetcher } from "../feed-window";
import { loadMoreApplicationsAction } from "../actions/application-feed-actions";
import { ApplicationStatusBadge } from "./application-status-badge";
import { JobScoreSlot } from "./job-score-slot";
import { SavedJobCard } from "./saved-job-card";

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
  const shift = useRef(0);

  const shiftWindow = useCallback((delta: number) => {
    shift.current += delta;
  }, []);

  const { rows, sentinelRef, loadMore, loading, failed, hasMore } = useFeed({
    queryKey: queryKeys.savedJobs(filters),
    firstParam: 0,
    initialPage: { rows: initialRows, next: initialNextOffset },
    fetchPage: createOffsetFetcher({
      pageSize: APPLICATION_PAGE_SIZE,
      readShift: () => shift.current,
      load: (offset) => loadMoreApplicationsAction({ offset, filters }),
    }),
  });

  return (
    <div className="space-y-4">
      <ul
        aria-busy={loading}
        className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4"
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
              <JobScoreSlot
                saveOnly={row.saveOnly}
                matchScore={row.matchScore}
                size={44}
                className="max-sm:hidden"
              />
              <JobScoreSlot
                saveOnly={row.saveOnly}
                matchScore={row.matchScore}
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

      <FeedStatus
        sentinelRef={sentinelRef}
        noun="saved jobs"
        loading={loading}
        failed={failed}
        hasMore={hasMore}
        isEmpty={rows.length === 0}
        onRetry={loadMore}
      />
    </div>
  );
}
