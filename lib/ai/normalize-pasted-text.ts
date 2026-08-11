const CONTROL_CHARACTERS = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]",
  "g",
);
const INVISIBLE_CHARACTERS = new RegExp(
  "[\\u200B-\\u200F\\u202A-\\u202E\\uFEFF]",
  "g",
);
const EXOTIC_SPACES = new RegExp(
  "[\\u00A0\\u2000-\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000]",
  "g",
);

export function normalizePastedText(raw: string) {
  return raw
    .replace(CONTROL_CHARACTERS, "")
    .replace(INVISIBLE_CHARACTERS, "")
    .replace(EXOTIC_SPACES, " ")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function looksLikeJobPosting(text: string) {
  const trimmed = text.trim();

  return trimmed.length >= 50 && /\s/.test(trimmed);
}
