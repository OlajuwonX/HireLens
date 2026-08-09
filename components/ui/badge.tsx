import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "green" | "yellow" | "red" | "blue";

const tones: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface-secondary text-text-secondary",
  green: "border-transparent bg-accent text-accent-text",
  yellow: "border-warning/30 bg-warning/12 text-warning",
  red: "border-danger/30 bg-danger/12 text-danger",
  blue: "border-info/30 bg-info/12 text-info",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-control border px-2 py-0.5 font-mono text-system font-medium uppercase",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
