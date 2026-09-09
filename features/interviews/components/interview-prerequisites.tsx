import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { InterviewEligibility } from "../server/interview-eligibility.service";

export function InterviewPrerequisites({
  eligibility,
}: {
  eligibility: InterviewEligibility;
}) {
  const steps = [
    {
      href: "/dashboard/resumes",
      label: "Upload a resume",
      done: eligibility.hasResume,
    },
    {
      href: "/dashboard/jobs",
      label: "Save a job",
      done: eligibility.hasJobContext,
    },
  ];

  const next = steps.find((step) => !step.done);

  return (
    <EmptyState
      title="Prepare for interviews tailored to your career"
      description="Weekly interview practice is built from your resume and a saved job. Add both to unlock your first set."
      action={
        <div className="mx-auto flex max-w-xs flex-col gap-4">
          <ul className="space-y-2 text-left">
            {steps.map((step) => (
              <li
                key={step.href}
                className="flex items-center gap-2 text-meta text-text-secondary"
              >
                {step.done ? (
                  <Check
                    className="size-4 shrink-0 text-accent-hover"
                    aria-hidden
                  />
                ) : (
                  <Circle
                    className="size-4 shrink-0 text-text-muted"
                    aria-hidden
                  />
                )}
                <span className="sr-only">
                  {step.done ? "Done: " : "To do: "}
                </span>
                <span className={step.done ? "text-text-muted line-through" : ""}>
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
          {next ? (
            <Button asChild>
              <Link href={next.href}>{next.label}</Link>
            </Button>
          ) : null}
        </div>
      }
    />
  );
}
