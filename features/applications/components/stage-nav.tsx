import Link from "next/link";
import { cn } from "@/lib/utils";
import { STAGES, stageDetails, stageHref, type Stage } from "../stages";

const attention: Stage[] = ["needs-you", "ready"];

export function StageNav({ active, counts }: { active: Stage; counts: Record<Stage, number> }) {
  return (
    <nav aria-label="Application stages" className="hl-scroll -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ol className="flex min-w-max gap-1 border-b border-border">
        {STAGES.map((stage) => {
          const current = stage === active;
          const count = counts[stage];
          const flagged = attention.includes(stage) && count > 0;

          return (
            <li key={stage}>
              <Link
                href={stageHref(stage)}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "pressable -mb-px flex h-11 items-center gap-2 border-b-2 px-3 text-meta",
                  current
                    ? "border-accent font-medium text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary",
                )}
              >
                {stageDetails[stage].label}
                <span
                  data-numeric
                  className={cn(
                    "rounded-control px-1.5 font-mono text-system",
                    flagged ? "bg-accent text-accent-text" : "bg-surface-secondary text-text-muted",
                  )}
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
