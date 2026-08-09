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
      <CardContent className="pt-5">
        <p className="font-mono text-system font-medium uppercase text-text-muted">
          {label}
        </p>
        <p className="mt-3 text-card-metric font-semibold text-text-primary tabular-nums">
          {value}
        </p>
        {hint ? (
          <p
            className={cn(
              "mt-1 text-meta",
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
