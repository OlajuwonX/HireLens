import type { FeedPage } from "@/lib/query/feed-options";

export function shiftOffset(
  current: number | null,
  delta: number,
): number | null {
  if (current === null) {
    return null;
  }

  return Math.max(0, current + delta);
}

export function createOffsetFetcher<Row>({
  pageSize,
  readShift,
  load,
}: {
  pageSize: number;
  readShift: () => number;
  load: (offset: number) => Promise<{ rows: Row[]; nextOffset: number | null }>;
}) {
  return async (base: number): Promise<FeedPage<Row, number>> => {
    const page = await load(shiftOffset(base, readShift()) ?? 0);

    return {
      rows: page.rows,
      next: page.nextOffset === null ? null : base + pageSize,
    };
  };
}
