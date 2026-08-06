import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-dashed border-gray-300 p-6 text-center", className)}>
      <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
      {description ? <p className="mt-2 text-sm text-gray-600">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
