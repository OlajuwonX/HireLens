import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProfileCompleteness } from "../completeness";

export function CompletenessCard({
  completeness,
}: {
  completeness: ProfileCompleteness;
}) {
  const { percent, readyToApply, missingRequired } = completeness;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Profile {percent}% complete</CardTitle>
        <Badge tone={readyToApply ? "green" : "neutral"}>
          {readyToApply ? "Ready to apply" : "Needs details"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={percent} aria-label="Profile completeness" />
        {readyToApply ? (
          <p className="text-meta text-text-secondary">
            HireLens has everything it needs to prepare applications for you.
          </p>
        ) : (
          <p className="text-meta text-text-secondary">
            Still needed before HireLens can prepare applications:{" "}
            {missingRequired.map((item) => item.label).join(", ")}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
