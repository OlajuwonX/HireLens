const SENSITIVE_KEY =
  /resume|document|content|description|coverletter|cover_letter|requirement|extracted|result_?json|raw_?response|token|secret|password|passwordhash|api[_-]?key|authorization|cookie|dsn/i;

const REDACTED = "[redacted]";
const MAX_DEPTH = 6;

export function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return REDACTED;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => scrubValue(entry, depth + 1));
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(source)) {
      output[key] = SENSITIVE_KEY.test(key)
        ? REDACTED
        : scrubValue(entry, depth + 1);
    }

    return output;
  }

  return value;
}

export function isSensitiveKey(key: string) {
  return SENSITIVE_KEY.test(key);
}
