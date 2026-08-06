import * as React from "react";
import { cn } from "@/lib/utils";

type AlertTone = "info" | "success" | "warning" | "error";

const tones: Record<AlertTone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

export function Alert({
  className,
  tone = "info",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: AlertTone }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-lg border p-4 text-sm", tones[tone], className)}
      {...props}
    />
  );
}
