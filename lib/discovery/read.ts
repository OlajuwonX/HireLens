export type Raw = Record<string, unknown>;

export function asRecord(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function httpUrl(value: unknown) {
  const raw = text(value);

  if (!raw) {
    return null;
  }

  try {
    const url = new URL(raw);

    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function id(value: unknown) {
  return typeof value === "number" || typeof value === "string" ? String(value) : null;
}

export function isPosting<T extends { sourceId: string; title: string; url: string }>(
  value: T | null,
): value is T {
  return Boolean(value?.sourceId && value.title && value.url);
}
