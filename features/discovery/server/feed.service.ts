import "server-only";

import { DISCOVERY_LIMITS } from "../constants";
import { decodeCursor, encodeCursor } from "../feed-cursor";
import type { FeedFilters } from "../schemas/discovery.schema";
import { listFeed, type PostingListRow } from "./feed.repository";
import type { Audience } from "./visibility";

export type PostingFeedPage = {
  rows: PostingListRow[];
  nextCursor: string | null;
};

export async function getPostingFeed(input: {
  audience: Audience;
  filters: FeedFilters;
  cursor?: string;
}): Promise<PostingFeedPage> {
  const rows = await listFeed({
    audience: input.audience,
    filters: input.filters,
    cursor: decodeCursor(input.cursor),
    limit: DISCOVERY_LIMITS.pageSize + 1,
  });
  const page = rows.slice(0, DISCOVERY_LIMITS.pageSize);
  const last = page.at(-1);

  return {
    rows: page,
    nextCursor: rows.length > DISCOVERY_LIMITS.pageSize && last ? encodeCursor(last) : null,
  };
}
