function wordCounts(text: string) {
  const counts = new Map<string, number>();

  for (const word of text.toLowerCase().match(/[a-z0-9%+#.]+/g) ?? []) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return counts;
}

function total(counts: Map<string, number>) {
  let sum = 0;

  for (const value of counts.values()) {
    sum += value;
  }

  return sum;
}

export function measureChange(before: string, after: string) {
  const a = wordCounts(before);
  const b = wordCounts(after);
  const size = Math.max(total(a), total(b));

  if (size === 0) {
    return 0;
  }

  let shared = 0;

  for (const [word, count] of a) {
    shared += Math.min(count, b.get(word) ?? 0);
  }

  return 1 - shared / size;
}
