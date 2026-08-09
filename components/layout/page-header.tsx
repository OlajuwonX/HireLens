import * as React from "react";
import { cn } from "@/lib/utils";
import { PageTitle } from "./page-title";

export function PageHeader({
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
  const hasRow = Boolean(description || action);

  return (
    <>
      <PageTitle title={title} />
      {hasRow ? (
        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
            className,
          )}
        >
          {description ? (
            <p className="max-w-reading text-meta text-text-secondary">
              {description}
            </p>
          ) : (
            <span />
          )}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
    </>
  );
}
