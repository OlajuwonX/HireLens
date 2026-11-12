import { normalizeText, RESUME_FILE, type Fill } from "../execution/fields";

export function matchesExpected(fill: Fill, actual: string) {
  if (fill.value === RESUME_FILE) {
    return actual === "attached";
  }

  const expected = normalizeText(fill.value);
  const got = normalizeText(actual);

  if (fill.field.kind === "select" || fill.field.kind === "radio") {
    return got === expected || got.startsWith(`${expected} `) || (expected.length > 2 && got.includes(expected));
  }

  return got === expected;
}

export async function verifyFills(fills: Fill[], read: (fill: Fill) => Promise<string>) {
  const mismatched: string[] = [];

  for (const fill of fills) {
    if (!matchesExpected(fill, await read(fill))) {
      mismatched.push(fill.field.label || fill.field.selector);
    }
  }

  return mismatched;
}
