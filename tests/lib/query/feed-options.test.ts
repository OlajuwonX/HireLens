import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  feedOptions,
  mergeUniqueRows,
  type FeedConfig,
} from "@/lib/query/feed-options";

type Row = { publicId: string };

const rows = (...ids: string[]): Row[] => ids.map((publicId) => ({ publicId }));

function observe(config: FeedConfig<Row, number>) {
  const client = new QueryClient();
  const observer = new InfiniteQueryObserver(client, feedOptions(config));
  const unsubscribe = observer.subscribe(() => undefined);

  return { observer, unsubscribe };
}

describe("mergeUniqueRows", () => {
  it("keeps page order and drops repeats", () => {
    const merged = mergeUniqueRows([
      { rows: rows("a", "b") },
      { rows: rows("b", "c") },
      { rows: rows("a", "d") },
    ]);

    expect(merged.map((row) => row.publicId)).toEqual(["a", "b", "c", "d"]);
  });

  it("returns nothing for no pages", () => {
    expect(mergeUniqueRows([])).toEqual([]);
  });
});

describe("feedOptions", () => {
  it("serves the server-rendered page without fetching", () => {
    const fetchPage = vi.fn();
    const { observer, unsubscribe } = observe({
      queryKey: ["feed", "initial"],
      firstParam: 0,
      initialPage: { rows: rows("a"), next: 1 },
      fetchPage,
    });

    expect(observer.getCurrentResult().data?.pages).toHaveLength(1);
    expect(observer.getCurrentResult().hasNextPage).toBe(true);
    expect(fetchPage).not.toHaveBeenCalled();
    unsubscribe();
  });

  it("reports no next page when the server says the list ended", () => {
    const { observer, unsubscribe } = observe({
      queryKey: ["feed", "ended"],
      firstParam: 0,
      initialPage: { rows: rows("a"), next: null },
      fetchPage: vi.fn(),
    });

    expect(observer.getCurrentResult().hasNextPage).toBe(false);
    unsubscribe();
  });

  it("fetches the next page with the param the last page returned", async () => {
    const fetchPage = vi.fn(async (param: number) => ({
      rows: rows(`p${param}`),
      next: param < 2 ? param + 1 : null,
    }));
    const { observer, unsubscribe } = observe({
      queryKey: ["feed", "paging"],
      firstParam: 0,
      initialPage: { rows: rows("p0"), next: 1 },
      fetchPage,
    });

    await observer.fetchNextPage();
    const result = await observer.fetchNextPage();

    expect(fetchPage.mock.calls.map(([param]) => param)).toEqual([1, 2]);
    expect(result.hasNextPage).toBe(false);
    expect(mergeUniqueRows(result.data!.pages)).toEqual(rows("p0", "p1", "p2"));
    unsubscribe();
  });

  it("surfaces a failed page without retrying, then recovers", async () => {
    const fetchPage = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ rows: rows("b"), next: null });
    const { observer, unsubscribe } = observe({
      queryKey: ["feed", "failure"],
      firstParam: 0,
      initialPage: { rows: rows("a"), next: 1 },
      fetchPage,
    });

    const failed = await observer.fetchNextPage();

    expect(failed.isFetchNextPageError).toBe(true);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(failed.data?.pages).toHaveLength(1);

    const recovered = await observer.fetchNextPage();

    expect(recovered.isFetchNextPageError).toBe(false);
    expect(mergeUniqueRows(recovered.data!.pages)).toEqual(rows("a", "b"));
    unsubscribe();
  });
});
