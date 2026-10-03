import "server-only";

import { generatedDocuments } from "@/lib/db/schema";
import { likePattern, normalizeSearchQuery } from "@/lib/search/query";
import { EMPTY_SEARCH_RESPONSE, type SearchResponse } from "../types";
import { mapSearchResults, matchingDocumentTypes } from "./search.mapper";
import {
  searchDocumentRows,
  searchJobRows,
  searchResumeRows,
} from "./search.repository";

export const SEARCH_GROUP_LIMIT = 5;

export async function runSearch(
  userId: string,
  rawQuery: string | null | undefined,
): Promise<SearchResponse> {
  const query = normalizeSearchQuery(rawQuery);

  if (!query) {
    return EMPTY_SEARCH_RESPONSE;
  }

  const pattern = likePattern(query);
  const types = matchingDocumentTypes(
    query,
    generatedDocuments.type.enumValues,
  );

  const [resumes, jobs, documents] = await Promise.all([
    searchResumeRows({ userId, pattern, limit: SEARCH_GROUP_LIMIT }),
    searchJobRows({ userId, pattern, limit: SEARCH_GROUP_LIMIT }),
    searchDocumentRows({ userId, pattern, types, limit: SEARCH_GROUP_LIMIT }),
  ]);

  return mapSearchResults({ resumes, jobs, documents });
}
