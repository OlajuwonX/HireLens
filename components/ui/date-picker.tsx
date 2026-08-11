"use client";

import { formatDisplayDate, formatRangeLabel } from "@/lib/date/calendar";
import { cn } from "@/lib/utils";
import { CalendarDays, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { Calendar, type CalendarSelection } from "./calendar";

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        close();
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return ref;
}

const triggerClass =
  "flex h-10 w-full items-center justify-between gap-2 rounded-control border border-border bg-surface px-3 text-meta text-text-primary transition-colors hover:border-border-strong focus-visible:border-accent-hover disabled:cursor-not-allowed disabled:opacity-50";

const popoverClass =
  "absolute z-50 mt-1 w-max rounded-card border border-border bg-surface p-3 shadow-lg max-sm:fixed max-sm:inset-x-3 max-sm:bottom-3 max-sm:top-auto max-sm:mt-0 max-sm:w-auto";

function useEdgeAlignment(open: boolean) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [align, setAlign] = useState<"left" | "right">("left");

  useEffect(() => {
    if (!open || !anchorRef.current) {
      return;
    }

    function measure() {
      const anchor = anchorRef.current;

      if (!anchor || window.innerWidth < 640) {
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const estimatedWidth = 328;
      const overflowsRight =
        rect.left + estimatedWidth > window.innerWidth - 12;
      const fitsWhenRightAligned = rect.right - estimatedWidth > 12;

      setAlign(overflowsRight && fitsWhenRightAligned ? "right" : "left");
    }

    measure();
    window.addEventListener("resize", measure);

    return () => window.removeEventListener("resize", measure);
  }, [open]);

  return { anchorRef, align };
}

export function DatePicker({
  value,
  onChange,
  name,
  id,
  placeholder = "Pick a date",
  minIso,
  className,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  minIso?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const { anchorRef, align } = useEdgeAlignment(open);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div ref={anchorRef} className="absolute inset-x-0 top-0" aria-hidden />
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={triggerClass}
      >
        <span className={cn("truncate", !value && "text-text-muted")}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {value ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date"
              onClick={(event) => {
                event.stopPropagation();
                onChange("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation();
                  onChange("");
                }
              }}
              className="rounded-control p-0.5 text-text-muted hover:text-text-primary"
            >
              <X className="size-3.5" aria-hidden />
            </span>
          ) : null}
          <CalendarDays className="size-4 text-text-muted" aria-hidden />
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose a date"
          className={cn(popoverClass, align === "right" ? "right-0" : "left-0")}
        >
          <Calendar
            mode="single"
            minIso={minIso}
            selection={{ from: value || null, to: null }}
            onSelect={(next: CalendarSelection) => {
              onChange(next.from ?? "");
              setOpen(false);
            }}
            className="max-sm:max-w-none"
          />
        </div>
      ) : null}
    </div>
  );
}

export function DateRangePicker({
  from,
  to,
  onChange,
  fromName,
  toName,
  placeholder = "Any date",
  className,
}: {
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
  fromName?: string;
  toName?: string;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ from, to });
  const ref = useDismiss(open, () => setOpen(false));
  const { anchorRef, align } = useEdgeAlignment(open);
  const label = formatRangeLabel(from || null, to || null);

  useEffect(() => {
    if (open) {
      setDraft({ from, to });
    }
  }, [open, from, to]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div ref={anchorRef} className="absolute inset-x-0 top-0" aria-hidden />
      {fromName ? <input type="hidden" name={fromName} value={from} /> : null}
      {toName ? <input type="hidden" name={toName} value={to} /> : null}

      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={triggerClass}
      >
        <span className={cn("truncate", !label && "text-text-muted")}>
          {label || placeholder}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {label ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date range"
              onClick={(event) => {
                event.stopPropagation();
                onChange({ from: "", to: "" });
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation();
                  onChange({ from: "", to: "" });
                }
              }}
              className="rounded-control p-0.5 text-text-muted hover:text-text-primary"
            >
              <X className="size-3.5" aria-hidden />
            </span>
          ) : null}
          <CalendarDays className="size-4 text-text-muted" aria-hidden />
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose a date range"
          className={cn(popoverClass, align === "right" ? "right-0" : "left-0")}
        >
          <Calendar
            mode="range"
            selection={{ from: draft.from || null, to: draft.to || null }}
            onSelect={(next) =>
              setDraft({ from: next.from ?? "", to: next.to ?? "" })
            }
            className="max-sm:max-w-none"
          />

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-label text-text-muted">
              {draft.from && !draft.to
                ? "Pick the end of the range."
                : draft.from && draft.to
                  ? formatRangeLabel(draft.from, draft.to)
                  : "Select a date range."}
            </p>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="ghost"
                size="compact"
                onClick={() => {
                  setDraft({ from: "", to: "" });
                  onChange({ from: "", to: "" });
                  setOpen(false);
                }}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="compact"
                disabled={!draft.from}
                onClick={() => {
                  onChange({
                    from: draft.from,
                    to: draft.to || draft.from,
                  });
                  setOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
