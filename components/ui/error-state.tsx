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
    <section role="alert" className={cn("rounded-lg border border-red-200 bg-red-50 p-6", className)}>
      <h2 className="text-lg font-semibold text-red-950">{title}</h2>
      {description ? <p className="mt-2 text-sm text-red-800">{description}</p> : null}
      {onRetry ? (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </section>
  );
}
