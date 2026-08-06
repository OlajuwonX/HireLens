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
  const percent = limit > 0 ? (used / limit) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {used} of {limit} used
        </span>
      </div>
      <Progress value={percent} />
    </div>
  );
}
