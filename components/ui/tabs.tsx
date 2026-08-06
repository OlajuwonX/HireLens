"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("w-full", className)} {...props} />;
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1", className)}
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
        "rounded-md px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-white hover:text-gray-950",
        selected && "bg-white text-gray-950 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="tabpanel" className={cn("mt-4", className)} {...props} />;
}
