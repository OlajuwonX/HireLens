"use client";

import { IconButton } from "@/components/ui/button";
import { useUiStore } from "@/lib/stores/ui-store";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DashboardSidebar } from "./dashboard-sidebar";
import { MobileNavProvider } from "./mobile-nav-context";
import { isActivePath, primaryNavigation, utilityRoutes } from "./navigation";

function titleFromPathname(pathname: string) {
  const match = [...primaryNavigation, ...utilityRoutes].find((item) =>
    isActivePath(pathname, item.href),
  );

  return match?.label ?? "";
}

export function AppShell({
  sidebarFooter,
  children,
}: {
  sidebarFooter?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = useUiStore((state) => state.pageTitle);

  const closeMobileNav = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    useUiStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const title = pageTitle ?? titleFromPathname(pathname);

  return (
    <MobileNavProvider value={closeMobileNav}>
      <div data-app-shell className="flex h-dvh overflow-hidden bg-background">
        <DashboardSidebar
          footer={sidebarFooter}
          mobileOpen={mobileOpen}
          onMobileClose={closeMobileNav}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="z-30 shrink-0 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
              <IconButton
                label="Open navigation"
                onClick={() => setMobileOpen(true)}
                aria-expanded={mobileOpen}
                className="shrink-0 md:hidden"
              >
                <Menu aria-hidden="true" className="size-5" />
              </IconButton>

              <h1 className="min-w-0 flex-1 truncate text-section-title font-semibold text-text-primary">
                {title}
              </h1>
            </div>
          </header>

          <main className="hl-scroll min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
        </div>
      </div>
    </MobileNavProvider>
  );
}
