const SEPARATOR = "~";
const UUID = /^[0-9a-f-]{36}$/i;

export type FeedCursor = { sortAt: Date; publicId: string };

export function encodeCursor(row: FeedCursor) {
  return `${row.sortAt.toISOString()}${SEPARATOR}${row.publicId}`;
}

export function decodeCursor(value: string | undefined): FeedCursor | null {
  const [iso, publicId] = (value ?? "").split(SEPARATOR);
  const sortAt = new Date(iso ?? "");

  if (!publicId || !UUID.test(publicId) || Number.isNaN(sortAt.getTime())) {
    return null;
  }

  return { sortAt, publicId };
}
