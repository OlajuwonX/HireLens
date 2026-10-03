import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "./constants";

export function normalizeSearchQuery(raw: string | null | undefined) {
  const collapsed = (raw ?? "").replace(/\s+/g, " ").trim();
  const capped = collapsed.slice(0, SEARCH_MAX_LENGTH).trim();

  return capped.length >= SEARCH_MIN_LENGTH ? capped : null;
}

export function escapeLike(input: string) {
  return input.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export function likePattern(input: string) {
  return `%${escapeLike(input)}%`;
}
