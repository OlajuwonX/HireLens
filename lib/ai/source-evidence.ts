export type SourceEvidence = { id: string; text: string };

const BULLET_MARKER = /^\s*(?:[-•*▪●◦‣–]|\d{1,2}[.)])\s+/;
const MIN_WORDS = 4;
const MAX_ITEMS = 80;

function isContinuation(line: string) {
  return /^[a-z(]/.test(line);
}

function joinWrappedLines(text: string) {
  const lines: string[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();

    if (!line) {
      continue;
    }

    if (lines.length > 0 && !BULLET_MARKER.test(raw) && isContinuation(line)) {
      lines[lines.length - 1] += ` ${line}`;
    } else {
      lines.push(line);
    }
  }

  return lines;
}

function isEvidence(line: string) {
  const words = line.split(/\s+/).length;

  return words >= MIN_WORDS && /[a-z]/.test(line);
}

export function extractSourceEvidence(text: string | null): SourceEvidence[] {
  if (!text?.trim()) {
    return [];
  }

  const seen = new Set<string>();

  return joinWrappedLines(text)
    .map((line) => line.replace(BULLET_MARKER, "").replace(/\s+/g, " ").trim())
    .filter((line) => {
      const key = line.toLowerCase();

      if (!isEvidence(line) || seen.has(key)) {
        return false;
      }

      seen.add(key);

      return true;
    })
    .slice(0, MAX_ITEMS)
    .map((line, index) => ({
      id: `S-${String(index + 1).padStart(3, "0")}`,
      text: line,
    }));
}

export function formatSourceEvidence(items: SourceEvidence[]) {
  if (items.length === 0) {
    return null;
  }

  return [
    "<source_evidence>",
    ...items.map((item) => `${item.id}: ${item.text}`),
    "</source_evidence>",
  ].join("\n");
}
