"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { FeedStatus } from "@/components/ui/feed-status";
import { JobCardSkeleton } from "@/components/ui/skeletons";
import { queryKeys } from "@/lib/query/query-keys";
import { useFeed } from "@/lib/query/use-feed";
import { loadPostingsAction } from "../actions/discovery-actions";
import type { PostingListRow } from "../server/feed.repository";
import { PostingCard } from "./posting-card";

const PostingDialog = dynamic(
  () => import("./posting-dialog").then((module) => module.PostingDialog),
  { ssr: false },
);

const SKELETON_COUNT = 4;

export function PostingFeed({
  initialRows,
  initialCursor,
  filters,
}: {
  initialRows: PostingListRow[];
  initialCursor: string | null;
  filters: { q: string; arrangement: string };
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = useCallback((publicId: string) => setOpenId(publicId), []);

  const { rows, sentinelRef, loadMore, loading, failed, hasMore } = useFeed({
    queryKey: queryKeys.discovery(filters),
    firstParam: "",
    initialPage: { rows: initialRows, next: initialCursor },
    fetchPage: async (cursor: string) => {
      const page = await loadPostingsAction({ cursor, ...filters });

      return { rows: page.rows, next: page.nextCursor };
    },
  });

  return (
    <div className="space-y-4">
      <ul
        aria-busy={loading}
        className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4"
      >
        {rows.map((row) => (
          <PostingCard key={row.publicId} row={row} onOpen={open} />
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
        noun="discovered jobs"
        loading={loading}
        failed={failed}
        hasMore={hasMore}
        isEmpty={rows.length === 0}
        onRetry={loadMore}
      />

      {openId ? <PostingDialog publicId={openId} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
