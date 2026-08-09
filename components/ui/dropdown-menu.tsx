"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function DropdownMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative inline-block text-left", className)} {...props} />;
}

export function DropdownMenuTrigger(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" aria-haspopup="menu" {...props} />;
}

export function DropdownMenuContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="menu"
      className={cn("absolute right-0 z-20 mt-2 min-w-44 rounded-card border border-border bg-surface p-1 shadow-lg", className)}
      {...props}
    />
  );
}

export function DropdownMenuItem({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn("flex w-full items-center rounded-control px-3 py-2 text-left text-meta text-text-secondary hover:bg-surface-secondary", className)}
      {...props}
    />
  );
}
