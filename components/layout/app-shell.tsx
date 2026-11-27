"use client";

import { useUiStore } from "@/lib/stores/ui-store";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImpersonationBanner } from "@/features/admin/components/impersonation-banner";
import { BottomTabs } from "./bottom-tabs";
import { DashboardSidebar } from "./dashboard-sidebar";
import { MobileNavProvider } from "./mobile-nav-context";
import {
  adminEntry,
  adminNavigation,
  isActiveItem,
  primaryNavigation,
  utilityRoutes,
} from "./navigation";

function titleFromPathname(pathname: string) {
  const match = [
    ...primaryNavigation,
    ...utilityRoutes,
    adminEntry,
    ...adminNavigation,
  ].find((item) => isActiveItem(pathname, item));

  return match?.label ?? "";
}

export function AppShell({
  sidebarFooter,
  headerSlot,
  children,
  isAdmin = false,
  impersonation,
}: {
  sidebarFooter?: React.ReactNode;
  headerSlot?: React.ReactNode;
  children: React.ReactNode;
  isAdmin?: boolean;
  impersonation?: { targetEmail: string; expiresAt: string } | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = useUiStore((state) => state.pageTitle);
  const scrollRef = useRef<HTMLDivElement>(null);

  const closeMobileNav = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    useUiStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const title = pageTitle ?? titleFromPathname(pathname);

  return (
    <MobileNavProvider value={closeMobileNav}>
      <div data-app-shell className="flex h-dvh overflow-hidden bg-background">
        <DashboardSidebar
          footer={sidebarFooter}
          mobileOpen={mobileOpen}
          onMobileClose={closeMobileNav}
          isAdmin={isAdmin}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {impersonation ? (
            <ImpersonationBanner
              targetEmail={impersonation.targetEmail}
              expiresAt={impersonation.expiresAt}
            />
          ) : null}

          <div
            ref={scrollRef}
            className="hl-scroll min-h-0 flex-1 overflow-y-auto"
          >
            <header className="glass-bar sticky top-0 z-30 border-b border-border/70">
              <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
                <h1 className="min-w-0 flex-1 truncate text-section-title font-semibold text-text-primary">
                  {title}
                </h1>

                {headerSlot}
              </div>
            </header>

            <main className="px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-8">{children}</main>
          </div>
        </div>

        <BottomTabs onMore={() => setMobileOpen(true)} moreOpen={mobileOpen} />
      </div>
    </MobileNavProvider>
  );
}
