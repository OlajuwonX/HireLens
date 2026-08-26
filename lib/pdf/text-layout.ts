export type TextMeasurer = (text: string) => number;

const whitespace = /\s+/;

const blankSpace = /[\u00a0\u2007\u202f\u200a]/g;

const unsupported =
  /[^\u0020-\u007e\u00a1-\u024f\u1e00-\u1eff\u2010-\u2015\u2018-\u201d\u2022\u2026\u20ac\n]/g;

export function sanitizePdfText(value: string, options?: { trim?: boolean }) {
  const cleaned = value
    .replace(/\r\n?/g, "\n")
    .replace(blankSpace, " ")
    .replace(/′/g, "'")
    .replace(/″/g, '"')
    .replace(/·/g, "•")
    .replace(unsupported, "")
    .replace(/[ \t]+/g, " ");

  return options?.trim === false ? cleaned : cleaned.trim();
}

function breakLongWord(word: string, measure: TextMeasurer, maxWidth: number) {
  const pieces: string[] = [];
  let current = "";
  let width = 0;

  for (const character of word) {
    const characterWidth = measure(character);

    if (current && width + characterWidth > maxWidth) {
      pieces.push(current);
      current = character;
      width = characterWidth;
      continue;
    }

    current += character;
    width += characterWidth;
  }

  if (current) {
    pieces.push(current);
  }

  return pieces;
}

export function wrapText(
  text: string,
  measure: TextMeasurer,
  maxWidth: number,
): string[] {
  const clean = sanitizePdfText(text);

  if (!clean) {
    return [];
  }

  const limit = maxWidth > 0 ? maxWidth : measure("nnnnnnnn");

  if (limit <= 0) {
    return [clean];
  }

  const lines: string[] = [];
  const spaceWidth = measure(" ");

  for (const paragraph of clean.split("\n")) {
    const words = paragraph.split(whitespace).filter(Boolean);

    if (words.length === 0) {
      continue;
    }

    let line = "";
    let width = 0;

    for (const word of words) {
      const wordWidth = measure(word);
      const candidate = line ? width + spaceWidth + wordWidth : wordWidth;

      if (candidate <= limit) {
        line = line ? `${line} ${word}` : word;
        width = candidate;
        continue;
      }

      if (line) {
        lines.push(line);
        line = "";
        width = 0;
      }

      if (wordWidth <= limit) {
        line = word;
        width = wordWidth;
        continue;
      }

      const pieces = breakLongWord(word, measure, limit);
      const tail = pieces[pieces.length - 1] ?? "";

      lines.push(...pieces.slice(0, -1));
      line = tail;
      width = tail ? measure(tail) : 0;
    }

    if (line) {
      lines.push(line);
    }
  }

  return lines;
}

export function joinNonEmpty(
  parts: (string | null | undefined)[],
  separator: string,
) {
  return parts
    .map((part) => (part ? sanitizePdfText(part) : ""))
    .filter(Boolean)
    .join(separator);
}

export function formatDateRange(
  startDate: string | null,
  endDate: string | null,
) {
  const start = startDate ? sanitizePdfText(startDate) : "";
  const end = endDate ? sanitizePdfText(endDate) : "";

  if (start && end) {
    return `${start} – ${end}`;
  }

  if (start) {
    return `${start} – Present`;
  }

  return end;
}
