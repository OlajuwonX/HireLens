"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type DropdownOption<T extends string = string> = {
  value: T;
  label: string;
  hint?: string;
};

export function Dropdown<T extends string = string>({
  value,
  options,
  onChange,
  label,
  placeholder = "Select",
  name,
  id,
  className,
  triggerClassName,
  disabled,
  align = "start",
}: {
  value: T | "";
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listId = `${triggerId}-list`;

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    setActive(selectedIndex >= 0 ? selectedIndex : 0);

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    listRef.current
      ?.querySelectorAll("li")
      ?.[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function commit(index: number) {
    const option = options[index];

    if (option) {
      onChange(option.value);
    }

    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (disabled) {
      return;
    }

    if (!open && ["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (!open) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(active);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % options.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + options.length) % options.length);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setActive(options.length - 1);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <button
        type="button"
        id={triggerId}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-haspopup="listbox"
        aria-label={label}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-control border border-border bg-surface px-3 text-meta text-text-primary transition-colors",
          "hover:border-border-strong focus-visible:border-accent-hover",
          "disabled:cursor-not-allowed disabled:opacity-50",
          triggerClassName,
        )}
      >
        <span className={cn("truncate", !selected && "text-text-muted")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-text-muted transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={triggerId}
          tabIndex={-1}
          className="hl-scroll absolute z-50 mt-1 max-h-64 w-full min-w-max max-w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-card border border-border bg-surface p-1 shadow-lg"
          style={align === "end" ? { right: 0 } : { left: 0 }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;

            return (
              <li
                key={option.value}
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
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.hint ? (
                    <span className="block text-label text-text-muted">
                      {option.hint}
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
