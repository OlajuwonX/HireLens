"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, primaryNavigation, type NavItem } from "./navigation";

function NavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item.href);
  const { Icon } = item;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative flex h-10 items-center gap-3 rounded-control px-3 text-meta font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-surface-elevated text-text-primary"
          : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-0 w-0.5 bg-accent"
        />
      ) : null}
      {collapsed && item.badge ? (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent"
        />
      ) : null}
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      {collapsed ? (
        <span className="sr-only">
          {item.label}
          {item.badge ? " (new)" : null}
        </span>
      ) : (
        <>
          <span>{item.label}</span>
          {item.badge ? (
            <span className="ml-auto shrink-0 rounded-full border border-transparent bg-action-dark px-1.5 py-px font-mono text-[0.5625rem] font-semibold uppercase leading-[1.6] tracking-wide text-action-dark-text dark:border-accent-hover/50 dark:bg-accent dark:text-accent-text">
              {item.badge}
            </span>
          ) : null}
        </>
      )}
    </Link>
  );
}

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
      {primaryNavigation.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
