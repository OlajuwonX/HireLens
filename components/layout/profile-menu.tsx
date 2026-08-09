"use client";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

function initialsFrom(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "";

  if (!source) {
    return "?";
  }

  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]);

  return letters.join("").toUpperCase() || "?";
}

function formatLastLogin(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export function ProfileMenu({
  name,
  email,
  lastLoginAt,
  signOutSlot,
}: {
  name: string | null;
  email: string | null;
  lastLoginAt: string | null;
  signOutSlot: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-panel border border-border bg-surface p-1 shadow-lg"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-label font-medium text-text-primary">
              {name ?? "Signed in"}
            </p>
            {email ? (
              <p className="truncate font-mono text-system text-text-muted">
                {email}
              </p>
            ) : null}
          </div>

          <Link
            href="/settings/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-control px-3 py-2 text-meta text-text-secondary hover:bg-surface-secondary hover:text-text-primary border-b border-border"
          >
            <Settings aria-hidden="true" className="size-4" />
            Settings
          </Link>

          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
            <p className="text-meta font-medium text-text-secondary">Themes</p>
            <ThemeToggle block />
          </div>

          <div className="border-t border-border px-3 py-2.5">
            <p className="font-mono text-system uppercase text-text-muted">
              Last signed in
            </p>
            <p className="mt-1 text-label text-text-secondary">
              {formatLastLogin(lastLoginAt)}
            </p>
          </div>

          <div className="border-t border-border p-1" role="menuitem">
            <div className="flex items-center gap-2.5 px-2 text-text-secondary">
              <LogOut aria-hidden="true" className="size-4 shrink-0" />
              <div className="min-w-0 flex-1">{signOutSlot}</div>
            </div>
          </div>
        </div>
      ) : null}

      <Button
        variant="ghost"
        size="profile"
        align={collapsed ? "center" : "start"}
        block
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        title={collapsed ? (name ?? email ?? "Account") : undefined}
        className={cn("gap-2.5", collapsed && "px-0")}
      >
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-icon bg-surface-elevated font-mono text-system font-medium text-text-primary"
        >
          {initialsFrom(name, email)}
        </span>
        {collapsed ? (
          <span className="sr-only">{name ?? email ?? "Account"}</span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-meta font-medium text-text-primary">
            {name ?? email ?? "Account"}
          </span>
        )}
      </Button>
    </div>
  );
}
