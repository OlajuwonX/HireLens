export type ResultCache<T> = {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
  clear: () => void;
  size: () => number;
};

export function createResultCache<T>(options: {
  ttlMs: number;
  maxEntries: number;
  now?: () => number;
}): ResultCache<T> {
  const now = options.now ?? Date.now;
  const entries = new Map<string, { value: T; expiresAt: number }>();

  return {
    get(key) {
      const entry = entries.get(key);

      if (!entry) {
        return undefined;
      }

      if (entry.expiresAt <= now()) {
        entries.delete(key);
        return undefined;
      }

      entries.delete(key);
      entries.set(key, entry);

      return entry.value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, { value, expiresAt: now() + options.ttlMs });

      while (entries.size > options.maxEntries) {
        const oldest = entries.keys().next().value;

        if (oldest === undefined) {
          break;
        }

        entries.delete(oldest);
      }
    },
    clear() {
      entries.clear();
    },
    size() {
      return entries.size;
    },
  };
}

export function cacheKey(normalizedQuery: string) {
  return normalizedQuery.toLowerCase();
}
