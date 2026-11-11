import { infiniteQueryOptions, type QueryKey } from "@tanstack/react-query";

export type FeedPage<Row, Param> = {
  rows: Row[];
  next: Param | null;
};

export type FeedConfig<Row, Param> = {
  queryKey: QueryKey;
  firstParam: Param;
  initialPage: FeedPage<Row, Param>;
  fetchPage: (param: Param) => Promise<FeedPage<Row, Param>>;
};

export function feedOptions<Row, Param>(config: FeedConfig<Row, Param>) {
  return infiniteQueryOptions({
    queryKey: config.queryKey,
    queryFn: ({ pageParam }) => config.fetchPage(pageParam as Param),
    initialPageParam: config.firstParam,
    getNextPageParam: (last: FeedPage<Row, Param>) => last.next,
    initialData: { pages: [config.initialPage], pageParams: [config.firstParam] },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
}

export function mergeUniqueRows<Row extends { publicId: string }>(
  pages: { rows: Row[] }[],
) {
  const seen = new Set<string>();

  return pages.flatMap((page) =>
    page.rows.filter((row) => {
      if (seen.has(row.publicId)) {
        return false;
      }

      seen.add(row.publicId);

      return true;
    }),
  );
}
