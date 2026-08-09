import { Card, CardContent } from "@/components/ui/card";
import { ScoreBlock } from "@/components/ui/score-block";

export function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <ScoreBlock label={label} score={score} />
      </CardContent>
    </Card>
  );
}
