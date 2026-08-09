"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "./dashboard-sidebar";

export function AppShell({
  sidebarFooter,
  headerRight,
  children,
}: {
  sidebarFooter?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        footer={sidebarFooter}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              className="grid size-9 place-items-center rounded-icon text-text-secondary hover:bg-surface-elevated hover:text-text-primary md:hidden"
            >
              <Menu aria-hidden="true" className="size-5" />
            </button>
            <div className="min-w-0 flex-1" />
            {headerRight}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
