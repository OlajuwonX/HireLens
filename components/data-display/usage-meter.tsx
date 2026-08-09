import { Progress } from "@/components/ui/progress";

export function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const safeLimit = Math.max(1, limit);
  const percent = Math.min(100, Math.round((used / safeLimit) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-meta text-text-secondary">{label}</span>
        <span className="font-mono text-system text-text-muted tabular-nums">
          {used} / {limit}
        </span>
      </div>
      <Progress value={percent} aria-label={`${label} ${used} of ${limit} used`} />
    </div>
  );
}
