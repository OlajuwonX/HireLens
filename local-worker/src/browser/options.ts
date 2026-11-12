import { normalizeText } from "../execution/fields";

export function pickOption(options: string[], value: string) {
  const wanted = normalizeText(value);

  if (!wanted) {
    return null;
  }

  const normalized = options.map((option) => ({ option, text: normalizeText(option) }));

  return (
    normalized.find((entry) => entry.text === wanted)?.option ??
    normalized.find((entry) => entry.text.startsWith(`${wanted} `))?.option ??
    normalized.find((entry) => wanted.length > 2 && entry.text.includes(wanted))?.option ??
    null
  );
}
