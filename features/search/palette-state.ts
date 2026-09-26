export function moveActive(
  current: number,
  count: number,
  direction: 1 | -1,
): number {
  if (count <= 0) {
    return -1;
  }

  if (current < 0 || current >= count) {
    return direction === 1 ? 0 : count - 1;
  }

  return (current + direction + count) % count;
}

export function clampActive(current: number, count: number): number {
  if (count <= 0) {
    return -1;
  }

  if (current < 0) {
    return 0;
  }

  return Math.min(current, count - 1);
}

export type ShortcutEvent = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  repeat?: boolean;
  isComposing?: boolean;
};

export function isPaletteShortcut(event: ShortcutEvent): boolean {
  if (event.isComposing || event.repeat) {
    return false;
  }

  if (event.shiftKey || event.altKey) {
    return false;
  }

  if (!event.ctrlKey && !event.metaKey) {
    return false;
  }

  return event.key.toLowerCase() === "k";
}

export function highlightSegments(text: string, query: string) {
  const needle = query.trim().toLowerCase();

  if (needle.length === 0) {
    return [{ text, match: false }];
  }

  const haystack = text.toLowerCase();
  const segments: { text: string; match: boolean }[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const index = haystack.indexOf(needle, cursor);

    if (index === -1) {
      segments.push({ text: text.slice(cursor), match: false });
      break;
    }

    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), match: false });
    }

    segments.push({ text: text.slice(index, index + needle.length), match: true });
    cursor = index + needle.length;
  }

  return segments.length > 0 ? segments : [{ text, match: false }];
}
