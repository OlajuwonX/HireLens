import * as React from "react";
import { cn } from "@/lib/utils";

type AlertTone = "info" | "success" | "warning" | "error";

const tones: Record<AlertTone, string> = {
  info: "border-info/30 bg-info/8 text-text-primary",
  success: "border-accent bg-accent/15 text-text-primary",
  warning: "border-warning/40 bg-warning/10 text-text-primary",
  error: "border-danger/40 bg-danger/10 text-text-primary",
};

export function Alert({
  className,
  tone = "info",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: AlertTone }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-card border p-4 text-meta",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
