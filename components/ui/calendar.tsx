"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  MONTH_LABELS,
  WEEKDAY_LABELS,
  addMonths,
  buildMonth,
  fromIsoDate,
  isBefore,
  isSameDay,
  isWithin,
  startOfDay,
  toIsoDate,
} from "@/lib/date/calendar";
import { cn } from "@/lib/utils";

export type CalendarSelection = { from: string | null; to: string | null };

export function Calendar({
  mode = "single",
  selection,
  onSelect,
  minIso,
  className,
}: {
  mode?: "single" | "range";
  selection: CalendarSelection;
  onSelect: (next: CalendarSelection) => void;
  minIso?: string;
  className?: string;
}) {
  const from = fromIsoDate(selection.from);
  const to = fromIsoDate(selection.to);
  const min = fromIsoDate(minIso);
  const today = startOfDay(new Date());

  const [month, setMonth] = useState(
    () => new Date((from ?? today).getFullYear(), (from ?? today).getMonth(), 1),
  );

  const days = useMemo(() => buildMonth(month), [month]);

  function pick(date: Date) {
    const iso = toIsoDate(date);

    if (mode === "single") {
      onSelect({ from: selection.from === iso ? null : iso, to: null });
      return;
    }

    if (!from || (from && to)) {
      onSelect({ from: iso, to: null });
      return;
    }

    if (isBefore(date, from)) {
      onSelect({ from: iso, to: selection.from });
      return;
    }

    onSelect({ from: selection.from, to: iso });
  }

  return (
    <div className={cn("w-full max-w-76 select-none", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setMonth((current) => addMonths(current, -1))}
          className="flex size-8 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        <p
          aria-live="polite"
          className="text-meta font-semibold text-text-primary"
        >
          {MONTH_LABELS[month.getMonth()]} {month.getFullYear()}
        </p>

        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          className="flex size-8 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            aria-hidden
            className="pb-1 text-center font-mono text-system uppercase text-text-muted"
          >
            {label}
          </div>
        ))}

        {days.map((day) => {
          const disabled = min ? isBefore(day.date, min) : false;
          const isStart = isSameDay(day.date, from);
          const isEnd = isSameDay(day.date, to);
          const inRange = mode === "range" && isWithin(day.date, from, to);
          const isEdge = isStart || isEnd;

          return (
            <button
              key={day.iso}
              type="button"
              disabled={disabled}
              aria-pressed={isEdge}
              aria-label={day.date.toDateString()}
              onClick={() => pick(day.date)}
              className={cn(
                "flex aspect-square min-h-9 items-center justify-center rounded-control text-meta transition-colors sm:min-h-8",
                day.inMonth ? "text-text-primary" : "text-text-muted/60",
                !isEdge && !inRange && "hover:bg-surface-secondary",
                inRange && "bg-accent/20",
                isEdge && "bg-accent font-semibold text-accent-text",
                isSameDay(day.date, today) &&
                  !isEdge &&
                  "ring-1 ring-inset ring-border-strong",
                disabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
              )}
            >
              {day.dayOfMonth}
            </button>
          );
        })}
      </div>
    </div>
  );
}
