import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-gray-950">{value}</p>
        {hint ? <p className="mt-1 text-sm text-gray-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
