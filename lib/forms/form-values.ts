export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};

  for (const [key, value] of formData) {
    if (typeof value !== "string" || key.startsWith("$")) {
      continue;
    }

    values[key] = key in values ? `${values[key]},${value}` : value;
  }

  return values;
}
