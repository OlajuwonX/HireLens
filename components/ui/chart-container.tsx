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
    <section className={cn("rounded-lg border border-gray-200 bg-white p-4", className)}>
      <h2 className="text-base font-semibold text-gray-950">{title}</h2>
      {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
