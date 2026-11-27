"use client";

import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveItem, tabNavigation } from "./navigation";

const cell =
  "pressable flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium";

export function BottomTabs({ onMore, moreOpen }: { onMore: () => void; moreOpen: boolean }) {
  const pathname = usePathname();
  const anyActive = tabNavigation.some((item) => isActiveItem(pathname, item));

  return (
    <nav
      aria-label="Sections"
      className="glass-bar fixed inset-x-0 bottom-0 z-30 flex border-t border-border/70 pb-[env(safe-area-inset-bottom,0px)] md:hidden"
    >
      {tabNavigation.map((item) => {
        const active = isActiveItem(pathname, item);
        const { Icon } = item;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(cell, active ? "text-text-primary" : "text-text-muted")}
          >
            <Icon aria-hidden="true" className={cn("size-5", active && "text-accent")} />
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onMore}
        aria-expanded={moreOpen}
        aria-haspopup="dialog"
        className={cn(cell, !anyActive ? "text-text-primary" : "text-text-muted")}
      >
        <Menu aria-hidden="true" className={cn("size-5", !anyActive && "text-accent")} />
        More
      </button>
    </nav>
  );
}
