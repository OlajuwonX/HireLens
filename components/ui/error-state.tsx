import * as React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function ErrorState({
  title,
  description,
  onRetry,
  className,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <section role="alert" className={cn("rounded-card border border-red-200 bg-red-50 p-6", className)}>
      <h2 className="text-section-title font-semibold text-red-950">{title}</h2>
      {description ? <p className="mt-2 text-meta text-red-800">{description}</p> : null}
      {onRetry ? (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </section>
  );
}
