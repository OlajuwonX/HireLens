export type TextMeasurer = (text: string) => number;

const whitespace = /\s+/;

export function sanitizePdfText(value: string) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[•·]/g, "-")
    .replace(/[^\x20-\x7e\n]/g, "")
    .trim();
}

function breakLongWord(word: string, measure: TextMeasurer, maxWidth: number) {
  const pieces: string[] = [];
  let current = "";

  for (const character of word) {
    const candidate = current + character;

    if (current && measure(candidate) > maxWidth) {
      pieces.push(current);
      current = character;
    } else {
      current = candidate;
    }
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

  if (maxWidth <= 0) {
    return [clean];
  }

  const lines: string[] = [];

  for (const paragraph of clean.split("\n")) {
    const words = paragraph.split(whitespace).filter(Boolean);

    if (words.length === 0) {
      continue;
    }

    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;

      if (measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }

      if (line) {
        lines.push(line);
        line = "";
      }

      if (measure(word) <= maxWidth) {
        line = word;
        continue;
      }

      const pieces = breakLongWord(word, measure, maxWidth);

      lines.push(...pieces.slice(0, -1));
      line = pieces[pieces.length - 1] ?? "";
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
    return `${start} - ${end}`;
  }

  if (start) {
    return `${start} - Present`;
  }

  return end;
}
