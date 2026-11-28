import "server-only";

import { fetchJson as defaultFetchJson } from "@/lib/discovery/http";
import { postingRefFromUrl } from "@/lib/discovery/posting-ref";
import { adapters } from "@/lib/discovery/sources";
import type { DiscoveredPosting, FetchJson } from "@/lib/discovery/types";

export async function findAtsPosting(
  url: string,
  fetchJson: FetchJson = defaultFetchJson,
): Promise<DiscoveredPosting | null> {
  const ref = postingRefFromUrl(url);

  if (!ref) {
    return null;
  }

  try {
    const board = await adapters[ref.source].fetchBoard(ref.token, fetchJson);

    return board.postings.find((posting) => posting.sourceId === ref.jobId) ?? null;
  } catch {
    return null;
  }
}

export function describePosting(posting: DiscoveredPosting) {
  return [posting.title, posting.company, posting.location ?? "", "", posting.description].join("\n");
}
