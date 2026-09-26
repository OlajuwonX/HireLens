import { isSafeInternalHref } from "./safe-href";
import {
  EMPTY_SEARCH_RESPONSE,
  type SearchResponse,
  type SearchResultItem,
  type SearchResultKind,
} from "./types";

const KINDS: SearchResultKind[] = ["resume", "job", "document"];

function parseItem(value: unknown): SearchResultItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;

  if (
    typeof item.id !== "string" ||
    typeof item.title !== "string" ||
    typeof item.kind !== "string" ||
    !KINDS.includes(item.kind as SearchResultKind) ||
    !isSafeInternalHref(item.href)
  ) {
    return null;
  }

  return {
    id: item.id,
    kind: item.kind as SearchResultKind,
    title: item.title,
    subtitle: typeof item.subtitle === "string" ? item.subtitle : null,
    href: item.href,
  };
}

function parseGroup(value: unknown): SearchResultItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(parseItem)
    .filter((item): item is SearchResultItem => item !== null);
}

export function parseSearchResponse(value: unknown): SearchResponse {
  if (!value || typeof value !== "object") {
    return EMPTY_SEARCH_RESPONSE;
  }

  const body = value as Record<string, unknown>;

  return {
    resumes: parseGroup(body.resumes),
    jobs: parseGroup(body.jobs),
    documents: parseGroup(body.documents),
  };
}
