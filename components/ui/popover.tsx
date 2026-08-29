"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export function Popover({
  trigger,
  title,
  children,
  align = "start",
  className,
  panelClassName,
  open,
  onOpenChange,
}: {
  trigger: (props: {
    id: string;
    "aria-expanded": boolean;
    "aria-controls": string | undefined;
    "aria-haspopup": "dialog";
    onClick: () => void;
  }) => ReactNode;
  title: string;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "start" | "end";
  className?: string;
  panelClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolled, setUncontrolled] = useState(false);
  const isOpen = open ?? uncontrolled;
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const panelId = `${baseId}-panel`;

  const controlled = open !== undefined;
  const changeRef = useRef(onOpenChange);

  changeRef.current = onOpenChange;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) {
        setUncontrolled(next);
      }

      changeRef.current?.(next);
    },
    [controlled],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    triggerRef.current =
      rootRef.current?.querySelector<HTMLElement>(
        `#${CSS.escape(triggerId)}`,
      ) ?? null;

    const focusable = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    focusable?.focus();

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, triggerId, setOpen]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {trigger({
        id: triggerId,
        "aria-expanded": isOpen,
        "aria-controls": isOpen ? panelId : undefined,
        "aria-haspopup": "dialog",
        onClick: () => setOpen(!isOpen),
      })}

      {isOpen ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={title}
          className={cn(
            "hl-scroll z-50 max-h-[min(26rem,calc(100vh-6rem))] overflow-y-auto rounded-card border border-border bg-surface p-3 shadow-lg",
            "max-sm:fixed max-sm:inset-x-3 max-sm:bottom-3 max-sm:w-auto",
            "sm:absolute sm:mt-2 sm:w-64",
            align === "end" ? "sm:right-0" : "sm:left-0",
            panelClassName,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      ) : null}
    </div>
  );
}

export function PopoverGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 font-mono text-system font-medium uppercase text-text-muted">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}

export function PopoverChip({
  checked,
  label,
  name,
  onSelect,
}: {
  checked: boolean;
  label: string;
  name: string;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "cursor-pointer select-none rounded-control border px-2 py-1 text-label transition-colors",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-accent-hover",
        checked
          ? "border-transparent bg-accent font-medium text-accent-text"
          : "border-border text-text-secondary hover:border-border-strong hover:text-text-primary",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      {label}
    </label>
  );
}
