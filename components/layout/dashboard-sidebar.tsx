"use client";

import { useUiStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { SidebarNav } from "./sidebar-nav";

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex h-10 items-center text-section-title font-semibold text-text-primary",
        collapsed ? "justify-center px-0" : "px-3",
      )}
    >
      {collapsed ? "HL" : "HireLens"}
    </Link>
  );
}

export function DashboardSidebar({
  footer,
  mobileOpen,
  onMobileClose,
}: {
  footer?: React.ReactNode;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleCollapsed = useUiStore((state) => state.toggleSidebar);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onMobileClose();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, onMobileClose]);

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <>
      <aside
        data-collapsed={collapsed}
        className={cn(
          "hidden shrink-0 border-r border-border bg-sidebar md:flex md:flex-col",
          collapsed ? "w-18" : "w-60",
        )}
      >
        <div className="p-3">
          <Brand collapsed={collapsed} />
        </div>

        <div className="flex flex-1 flex-col px-3 pb-3">
          <SidebarNav collapsed={collapsed} />

          <div className="mt-auto space-y-1 pt-3">
            {footer ? (
              <div className="border-t border-border pt-2">{footer}</div>
            ) : null}

            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsed}
              title={collapsed ? "Expand sidebar" : undefined}
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-control border-t border-border px-3 text-meta font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary",
                collapsed && "justify-center px-0",
              )}
            >
              <ToggleIcon aria-hidden="true" className="size-4 shrink-0" />
              {collapsed ? null : "Collapse"}
            </button>
          </div>
        </div>
      </aside>

      <div
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onMobileClose}
      />

      <aside
        aria-label="Main navigation"
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(88vw,20rem)] flex-col border-r border-border bg-sidebar transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-1 p-3">
          <Brand collapsed={false} />
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="grid size-9 shrink-0 place-items-center rounded-icon text-text-muted hover:bg-surface-elevated hover:text-text-primary"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-3 pb-3">
          <SidebarNav onNavigate={onMobileClose} />
          {footer ? (
            <div className="mt-auto border-t border-border pt-3">{footer}</div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
