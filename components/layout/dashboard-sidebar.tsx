"use client";

import { Button, IconButton } from "@/components/ui/button";
import { useUiStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { SidebarNav } from "./sidebar-nav";

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/dashboard"
      aria-label="HireLens"
      className={cn(
        "flex h-10 items-center gap-2 text-section-title font-semibold text-text-primary",
        collapsed ? "justify-center px-0" : "px-3",
      )}
    >
      <Image
        src="/hllogo-64.png"
        alt=""
        width={28}
        height={28}
        priority
        className="size-7 shrink-0 rounded-control object-contain"
      />
      {collapsed ? null : <span className="truncate">HireLens</span>}
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
          "hidden h-screen shrink-0 border-r border-border bg-sidebar md:flex md:flex-col",
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

            <Button
              variant="ghost"
              size="row"
              align={collapsed ? "center" : "start"}
              block
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsed}
              title={collapsed ? "Expand sidebar" : undefined}
              className={cn(
                "gap-3 border-t border-border",
                collapsed && "px-0",
              )}
            >
              <ToggleIcon aria-hidden="true" className="size-4" />
              {collapsed ? null : "Collapse"}
            </Button>
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
          <IconButton
            label="Close navigation"
            onClick={onMobileClose}
            className="shrink-0"
          >
            <X aria-hidden="true" className="size-4" />
          </IconButton>
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
