"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export function Tabs({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full", className)} {...props} />;
}

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto rounded-card bg-surface-elevated p-1",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  selected,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={cn(
        "rounded-control px-3 py-2 text-meta font-semibold text-text-secondary hover:bg-surface hover:text-text-primary",
        selected &&
          "bg-accent text-accent-text shadow-sm hover:bg-accent-hover hover:text-accent-text",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="tabpanel" className={cn("mt-4", className)} {...props} />;
}
