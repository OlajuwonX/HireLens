import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "green" | "yellow" | "red" | "blue";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
