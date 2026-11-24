"use client";

import { useMutation } from "@tanstack/react-query";
import { ListChecks, Puzzle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { notify } from "@/components/ui/toast";
import { continueWithPostingAction, savePostingAction } from "../actions/discovery-actions";
import type { PostingStep } from "../server/posting-next-step.service";

const steps: { step: PostingStep; label: string; hint: string; pending: string; Icon: typeof Sparkles }[] = [
  {
    step: "analyze",
    label: "Analyze",
    hint: "Save it and create the match score, tailored resume and cover letter.",
    pending: "Analyzing...",
    Icon: Sparkles,
  },
  {
    step: "auto-apply",
    label: "Auto Apply",
    hint: "Save it and add it to your Auto Apply queue.",
    pending: "Adding to Auto Apply...",
    Icon: ListChecks,
  },
];

export function PostingActions({ publicId, href }: { publicId: string; href: string }) {
  const router = useRouter();

  const save = useMutation({
    mutationFn: () => savePostingAction(publicId),
    onSuccess: (result) =>
      result.ok
        ? notify.success(result.alreadySaved ? "Already in your saved jobs." : "Saved to your jobs.")
        : notify.error(result.message),
    onError: () => notify.error("The job could not be saved. Please try again."),
  });

  const next = useMutation({
    mutationFn: (step: PostingStep) => continueWithPostingAction(publicId, step),
    onSuccess: (result) => {
      if (result.ok) {
        router.push(result.href);
        return;
      }

      notify.error(result.saved ? `Saved to your jobs. ${result.message}` : result.message);
    },
    onError: () => notify.error("That did not finish. Please try again."),
  });

  const apply = useMutation({
    mutationFn: async (tab: Window | null) => ({ tab, result: await savePostingAction(publicId) }),
    onSuccess: ({ tab, result }) => {
      if (!result.ok) {
        tab?.close();
        notify.error(result.message);
        return;
      }

      if (tab) {
        tab.location.href = href;
      } else {
        window.open(href, "_blank", "noopener");
      }

      notify.success("Saved. Use the HireLens extension on the application page to fill it in.");
    },
    onError: () => notify.error("The job could not be saved. Please try again."),
  });

  const busy = save.isPending || next.isPending || apply.isPending;
  const running = steps.find((item) => next.isPending && item.step === next.variables);

  return (
    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button asChild variant="outline">
        <a href={href} target="_blank" rel="noopener noreferrer">
          Open original posting
        </a>
      </Button>
      <Button type="button" variant="outline" disabled={busy} onClick={() => save.mutate()}>
        {save.isPending ? "Saving..." : "Save to my jobs"}
      </Button>
      <Popover
        title="Job options"
        align="end"
        panelClassName="sm:bottom-full sm:mb-2 sm:mt-0 sm:w-72 p-1"
        trigger={(props) => (
          <Button type="button" disabled={busy} className="w-full sm:w-auto" {...props}>
            {running ? running.pending : "Options"}
          </Button>
        )}
      >
        {(close) => (
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  close();
                  apply.mutate(window.open("about:blank", "_blank"));
                }}
                className="flex w-full items-start gap-2.5 rounded-control px-3 py-2 text-left hover:bg-surface-secondary"
              >
                <Puzzle className="mt-0.5 size-4 shrink-0 text-text-secondary" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-meta font-medium text-text-primary">Apply with HireLens</span>
                  <span className="block text-label text-text-secondary">
                    Save it and open the application page, ready for the extension to fill.
                  </span>
                </span>
              </button>
            </li>
            {steps.map(({ step, label, hint, Icon }) => (
              <li key={step}>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    next.mutate(step);
                  }}
                  className="flex w-full items-start gap-2.5 rounded-control px-3 py-2 text-left hover:bg-surface-secondary"
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-text-secondary" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-meta font-medium text-text-primary">{label}</span>
                    <span className="block text-label text-text-secondary">{hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Popover>
    </div>
  );
}
