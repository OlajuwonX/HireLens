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
      rootRef.current?.querySelector<HTMLElement>(`#${CSS.escape(triggerId)}`) ??
      null;

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
            "hl-scroll z-50 max-h-[min(28rem,calc(100vh-6rem))] overflow-y-auto rounded-card border border-border bg-surface p-4 shadow-lg",
            "max-sm:fixed max-sm:inset-x-3 max-sm:bottom-3 max-sm:w-auto",
            "sm:absolute sm:mt-2 sm:w-80",
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
    <fieldset className="space-y-2">
      <legend className="font-mono text-system font-medium uppercase text-text-muted">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

export function PopoverOption({
  checked,
  label,
  hint,
  name,
  onSelect,
}: {
  checked: boolean;
  label: string;
  hint?: string;
  name: string;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2 rounded-control border px-2.5 py-2 transition-colors",
        checked
          ? "border-accent-hover bg-surface-secondary"
          : "border-border hover:border-border-strong",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 size-3.5 shrink-0 accent-[var(--color-accent-hover)]"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label font-medium text-text-primary">
          {label}
        </span>
        {hint ? (
          <span className="block truncate text-label text-text-muted">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}
