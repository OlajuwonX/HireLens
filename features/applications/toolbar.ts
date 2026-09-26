import type { ApplicationFilters } from "./schemas/application.schema";

export function totalSavedCount(counts: Record<string, number>) {
  return Object.entries(counts).reduce(
    (sum, [key, count]) => (key === "ARCHIVED" ? sum : sum + count),
    0,
  );
}

export function hasActiveFilters(filters: ApplicationFilters) {
  return filters.tab !== "PENDING" || Boolean(filters.from || filters.to);
}

export function resolveJobsEmptyState(input: {
  counts: Record<string, number>;
}): "none-saved" | "filtered" {
  const nothingAtAll =
    totalSavedCount(input.counts) === 0 && (input.counts.ARCHIVED ?? 0) === 0;

  return nothingAtAll ? "none-saved" : "filtered";
}
