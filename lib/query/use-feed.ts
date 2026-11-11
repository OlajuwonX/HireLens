"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { feedOptions, mergeUniqueRows, type FeedConfig } from "./feed-options";
import { useSentinel } from "./use-sentinel";

export function useFeed<Row extends { publicId: string }, Param>(
  config: FeedConfig<Row, Param>,
) {
  const query = useInfiniteQuery(feedOptions(config));
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError } = query;
  const { fetchNextPage } = query;

  const rows = useMemo(
    () => mergeUniqueRows(query.data.pages),
    [query.data.pages],
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage({ cancelRefetch: false });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sentinelRef = useSentinel(
    hasNextPage && !isFetchNextPageError,
    loadMore,
  );

  return {
    rows,
    sentinelRef,
    loadMore,
    loading: isFetchingNextPage,
    failed: isFetchNextPageError,
    hasMore: hasNextPage,
  };
}
