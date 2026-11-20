"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DISCOVERY_PATH } from "../constants";

const tabs = [
  { href: DISCOVERY_PATH, label: "All jobs" },
  { href: `${DISCOVERY_PATH}/matches`, label: "Your matches" },
];

export function DiscoverTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Discover sections" className="flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-meta transition-colors",
              active
                ? "border-accent font-medium text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
