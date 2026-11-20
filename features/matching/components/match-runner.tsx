"use client";

import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { runMatchingAction } from "../actions/matching-actions";

function describe(outcome: { scored: number; screenedOut: number; waiting: number }) {
  const parts = [`Scored ${outcome.scored} jobs`];

  if (outcome.screenedOut > 0) {
    parts.push(`${outcome.screenedOut} screened out by your profile`);
  }

  if (outcome.waiting > 0) {
    parts.push(`${outcome.waiting} more waiting`);
  }

  return `${parts.join(", ")}.`;
}

export function MatchRunner() {
  const router = useRouter();

  const run = useMutation({
    mutationFn: () => runMatchingAction(),
    onSuccess: (outcome) => {
      router.refresh();

      if (!outcome.ok) {
        notify.error(outcome.message);
      } else if (outcome.scored === 0 && outcome.screenedOut === 0) {
        notify.success("You're up to date. No new jobs to match.");
      } else {
        notify.success(describe(outcome));
      }
    },
    onError: () => notify.error("Matching could not finish. Please try again."),
  });

  return (
    <div className="flex flex-col gap-1.5 sm:items-end">
      <Button type="button" disabled={run.isPending} onClick={() => run.mutate()}>
        <Sparkles className="size-4" aria-hidden />
        {run.isPending ? "Matching..." : "Find matches"}
      </Button>
      <p className="text-label text-text-muted">Scores up to 10 jobs. Uses one daily match.</p>
    </div>
  );
}
