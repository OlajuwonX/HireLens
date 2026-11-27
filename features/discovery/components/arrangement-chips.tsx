"use client";

import { cn } from "@/lib/utils";

export const ARRANGEMENT_CHIPS = [
  { value: "", label: "Any" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ON_SITE", label: "On-site" },
] as const;

export function chipCount(value: string, counts: Record<string, number>) {
  return value ? (counts[value] ?? 0) : Object.values(counts).reduce((sum, count) => sum + count, 0);
}

export function ArrangementChips({
  active,
  counts,
  onSelect,
}: {
  active: string;
  counts: Record<string, number>;
  onSelect: (value: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Work arrangement" className="flex flex-wrap gap-1.5">
      {ARRANGEMENT_CHIPS.map((chip) => {
        const selected = chip.value === active;
        const count = chipCount(chip.value, counts);

        return (
          <button
            key={chip.label}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!selected && count === 0}
            onClick={() => onSelect(chip.value)}
            className={cn(
              "pressable inline-flex h-9 items-center gap-2 rounded-control border px-3 text-meta disabled:cursor-not-allowed disabled:opacity-40",
              selected
                ? "border-accent bg-accent font-medium text-accent-text"
                : "border-border-strong bg-surface text-text-secondary hover:text-text-primary",
            )}
          >
            {chip.label}
            <span data-numeric className={cn("font-mono text-system", selected ? "text-accent-text/80" : "text-text-muted")}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
