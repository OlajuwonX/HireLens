import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: "up" | "down" | "flat";
}) {
  return (
    <Card>
      <CardContent className="px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-5">
        <p className="truncate font-mono text-[0.6875rem] font-medium uppercase leading-4 text-text-muted sm:text-system">
          {label}
        </p>
        <p className="mt-2 text-[1.5rem] font-semibold leading-none text-text-primary tabular-nums sm:mt-3 sm:text-card-metric">
          {value}
        </p>
        {hint ? (
          <p
            className={cn(
              "mt-1 text-[0.75rem] leading-4 sm:text-meta",
              trend === "up" && "text-text-primary",
              trend === "down" && "text-danger",
              (!trend || trend === "flat") && "text-text-secondary",
            )}
          >
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
