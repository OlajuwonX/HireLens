import * as React from "react";
import { cn } from "@/lib/utils";

export function ChartContainer({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card border border-border bg-surface p-4", className)}>
      <h2 className="text-body font-semibold text-text-primary">{title}</h2>
      {description ? <p className="mt-1 text-meta text-text-secondary">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
