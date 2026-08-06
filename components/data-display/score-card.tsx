import { Card, CardContent } from "@/components/ui/card";
import { ScoreRing } from "@/components/ui/score-ring";

export function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 pt-4 sm:pt-5">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-950">{score}/100</p>
        </div>
        <ScoreRing score={score} />
      </CardContent>
    </Card>
  );
}
