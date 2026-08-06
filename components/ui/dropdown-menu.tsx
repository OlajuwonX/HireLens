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
      className={cn("absolute right-0 z-20 mt-2 min-w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-lg", className)}
      {...props}
    />
  );
}

export function DropdownMenuItem({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn("flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50", className)}
      {...props}
    />
  );
}
