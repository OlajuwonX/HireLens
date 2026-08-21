"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type JobTitleOption = {
  publicId: string;
  title: string;
};

export function JobTitleCombobox({
  options,
  disabled,
  id,
}: {
  options: JobTitleOption[];
  disabled?: boolean;
  id?: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listId = `${inputId}-list`;

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term || selectedId) {
      return options;
    }

    return options.filter((option) =>
      option.title.toLowerCase().includes(term),
    );
  }, [options, query, selectedId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    listRef.current
      ?.querySelectorAll("li")
      ?.[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function commit(index: number) {
    const option = matches[index];

    if (option) {
      setSelectedId(option.publicId);
      setQuery(option.title);
    }

    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (disabled) {
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!open) {
      if (["ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === "Enter" && matches.length > 0) {
      event.preventDefault();
      commit(active);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % matches.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + matches.length) % matches.length);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        type="hidden"
        name="resumePublicId"
        value={selectedId ?? ""}
        disabled={disabled}
      />
      <input
        type="hidden"
        name="title"
        value={selectedId ? "" : query.trim()}
        disabled={disabled}
      />

      <div className="relative">
        <input
          id={inputId}
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          disabled={disabled}
          value={query}
          placeholder="Product Manager, Chef, Accountant..."
          maxLength={120}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedId(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(
            "h-10 w-full rounded-control border border-border bg-surface pl-3 pr-9 text-body text-text-primary transition-colors",
            "placeholder:text-text-muted",
            "hover:border-border-strong",
            "focus:border-accent-hover focus:outline-none focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        {options.length > 0 ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={open ? "Hide job titles" : "Show job titles"}
            disabled={disabled}
            onClick={() => setOpen((current) => !current)}
            className="absolute right-0 top-0 flex h-10 w-9 items-center justify-center text-text-muted"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        ) : null}
      </div>

      {open && matches.length > 0 ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Existing job titles"
          tabIndex={-1}
          className="hl-scroll absolute left-0 z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface p-1 shadow-lg"
        >
          {matches.map((option, index) => {
            const isSelected = option.publicId === selectedId;

            return (
              <li
                key={option.publicId}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActive(index)}
                onClick={() => commit(index)}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-control px-2.5 py-2 text-meta text-text-primary",
                  index === active && "bg-surface-secondary",
                )}
              >
                <Check
                  className={cn(
                    "mt-0.5 size-3.5 shrink-0",
                    isSelected ? "text-accent-hover" : "opacity-0",
                  )}
                  aria-hidden
                />
                <span className="min-w-0 truncate">{option.title}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
