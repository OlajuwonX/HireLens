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
    <section
      className={cn(
        "rounded-card border border-dashed border-border-strong bg-surface p-8 text-center",
        className,
      )}
    >
      <h2 className="text-section-title font-semibold text-text-primary">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-reading text-meta text-text-secondary">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
