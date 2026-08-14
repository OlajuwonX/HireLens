"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { notify } from "@/components/ui/toast";
import { analyzeApplicationFormAction } from "@/features/applications/actions/application-actions";
import { initialApplicationFormState } from "@/features/applications/actions/application-form-state";

function ConfirmButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      <RefreshCw className="size-4" aria-hidden />
      {pending ? "Reanalyzing..." : "Reanalyze"}
    </Button>
  );
}

export function ReanalyzeButton({
  publicId,
  hasAnalysis,
}: {
  publicId: string;
  hasAnalysis: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    analyzeApplicationFormAction,
    initialApplicationFormState,
  );
  const handled = useRef(initialApplicationFormState);

  useEffect(() => {
    if (state === handled.current || state.status === "idle") {
      return;
    }

    handled.current = state;
    setOpen(false);

    if (state.status === "error") {
      notify.error(state.message);
    } else {
      notify.success("Resume reanalyzed against this job.");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="compact">
          <RefreshCw className="size-4" aria-hidden />
          {hasAnalysis ? "Reanalyze" : "Analyze"}
        </Button>
      </DialogTrigger>

      <DialogContent className="border border-border">
        <div className="space-y-2 pr-8">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            {hasAnalysis ? "Reanalyze this resume?" : "Analyze this resume?"}
          </DialogTitle>
          <DialogDescription className="text-meta leading-relaxed text-text-secondary">
            {hasAnalysis
              ? "HireLens will run the analysis again and replace the current results, including every AI result saved on this application. This uses one of your daily AI runs."
              : "HireLens will analyse your resume against this job. This uses one of your daily AI runs."}
          </DialogDescription>
        </div>

        <form
          action={formAction}
          className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
        >
          <input type="hidden" name="publicId" value={publicId} />
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <ConfirmButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
