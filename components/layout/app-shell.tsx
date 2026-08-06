import * as React from "react";
import { cn } from "@/lib/utils";

export function AppShell({
  sidebar,
  header,
  children,
  className,
}: {
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-gray-50 text-gray-950", className)}>
      {header}
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {sidebar ? <div className="hidden w-64 shrink-0 lg:block">{sidebar}</div> : null}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
