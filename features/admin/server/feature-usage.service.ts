import { usageActionLabels, type AiUsageAction } from "@/lib/ai/usage";
import type { ActionStatusCount } from "./feature-usage.repository";

export type ActionBreakdownRow = {
  action: string;
  label: string;
  completed: number;
  failed: number;
  reserved: number;
  total: number;
};

function titleCase(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatActionLabel(action: string) {
  return usageActionLabels[action as AiUsageAction] ?? titleCase(action);
}

export function buildActionBreakdown(
  rows: ActionStatusCount[],
): ActionBreakdownRow[] {
  const byAction = new Map<string, ActionBreakdownRow>();

  for (const row of rows) {
    const entry = byAction.get(row.action) ?? {
      action: row.action,
      label: formatActionLabel(row.action),
      completed: 0,
      failed: 0,
      reserved: 0,
      total: 0,
    };

    if (row.status === "COMPLETED") {
      entry.completed += row.value;
    } else if (row.status === "FAILED") {
      entry.failed += row.value;
    } else {
      entry.reserved += row.value;
    }

    entry.total += row.value;
    byAction.set(row.action, entry);
  }

  return [...byAction.values()].sort((a, b) => b.total - a.total);
}

export function mostUsedActionLabel(breakdown: ActionBreakdownRow[]) {
  return breakdown[0]?.label ?? "None yet";
}

export function failureRate(breakdown: ActionBreakdownRow[]) {
  const totals = breakdown.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      failed: acc.failed + row.failed,
    }),
    { total: 0, failed: 0 },
  );

  return totals.total === 0 ? 0 : totals.failed / totals.total;
}

export function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
