import { normalizeSearchQuery } from "@/lib/search/query";

export const RECENTS_MAX = 8;

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function recentsStorageKey(userId: string) {
  return `hl:recent-searches:${userId}`;
}

export function addRecent(list: string[], query: string): string[] {
  const normalized = normalizeSearchQuery(query);

  if (!normalized) {
    return list;
  }

  const lowered = normalized.toLowerCase();
  const rest = list.filter((entry) => entry.toLowerCase() !== lowered);

  return [normalized, ...rest].slice(0, RECENTS_MAX);
}

export function parseRecents(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .reduce<string[]>((list, entry) => addRecentAtEnd(list, entry), []);
  } catch {
    return [];
  }
}

function addRecentAtEnd(list: string[], entry: string) {
  const normalized = normalizeSearchQuery(entry);

  if (!normalized || list.length >= RECENTS_MAX) {
    return list;
  }

  const lowered = normalized.toLowerCase();

  if (list.some((existing) => existing.toLowerCase() === lowered)) {
    return list;
  }

  return [...list, normalized];
}

export function loadRecents(
  storage: StorageLike | null,
  userId: string,
): string[] {
  if (!storage) {
    return [];
  }

  try {
    return parseRecents(storage.getItem(recentsStorageKey(userId)));
  } catch {
    return [];
  }
}

export function saveRecent(
  storage: StorageLike | null,
  userId: string,
  query: string,
): string[] {
  const current = loadRecents(storage, userId);
  const next = addRecent(current, query);

  if (!storage || next === current) {
    return next;
  }

  try {
    storage.setItem(recentsStorageKey(userId), JSON.stringify(next));
  } catch {
    return next;
  }

  return next;
}

export function clearRecents(storage: StorageLike | null, userId: string) {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(recentsStorageKey(userId));
  } catch {
    return;
  }
}
