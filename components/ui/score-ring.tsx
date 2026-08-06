import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  size = 72,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const safeScore = Math.min(100, Math.max(0, score));
  const background = `conic-gradient(#22c55e ${safeScore * 3.6}deg, #e5e7eb 0deg)`;

  return (
    <div
      className={cn("grid place-items-center rounded-full", className)}
      style={{ width: size, height: size, background }}
      aria-label={`Score ${safeScore} out of 100`}
    >
      <div className="grid size-[72%] place-items-center rounded-full bg-white text-sm font-bold text-gray-950">
        {safeScore}
      </div>
    </div>
  );
}
