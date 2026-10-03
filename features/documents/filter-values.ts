const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseFilterDate(value: string | undefined) {
  if (!value || !ISO_DATE.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function parseFilterCursor(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function pickDocumentType<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
): T | null {
  return allowed.find((type) => type === value) ?? null;
}
