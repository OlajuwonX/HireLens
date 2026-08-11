import { useId } from "react";
import { scoreBandFor } from "@/lib/design/score-band";
import { cn } from "@/lib/utils";

export function ScoreRing({
  score,
  size = 52,
  className,
}: {
  score: number | null;
  size?: number;
  className?: string;
}) {
  const gradientId = useId();

  if (score === null) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong text-label text-text-muted",
          className,
        )}
      >
        --
      </div>
    );
  }

  const clamped = Math.min(100, Math.max(0, Math.round(score)));
  const { from, to, label } = scoreBandFor(clamped);
  const stroke = size < 48 ? 4 : 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div
      role="img"
      aria-label={`${label}, ${clamped} out of 100`}
      style={{ width: size, height: size }}
      className={cn("relative shrink-0", className)}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="size-full -rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`url(#${gradientId})`}
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-mono font-semibold tabular-nums text-text-primary"
        style={{ fontSize: size < 48 ? 11 : 13 }}
      >
        {clamped}%
      </span>
    </div>
  );
}
