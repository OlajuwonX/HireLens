"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveEvidenceCorrectionAction } from "@/features/analyses/actions/analysis-actions";
import { initialAnalysisFormState } from "@/features/analyses/actions/analysis-form-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="compact" variant="outline" disabled={pending}>
      {pending ? "Saving…" : "Save correction"}
    </Button>
  );
}

export function RequirementCorrectionForm({
  matchId,
  analysisPublicId,
  markedIncorrect,
  evidence,
  notes,
}: {
  matchId: string;
  analysisPublicId: string;
  markedIncorrect: boolean;
  evidence: string | null;
  notes: string | null;
}) {
  const hasCorrection = markedIncorrect || Boolean(evidence) || Boolean(notes);
  const [open, setOpen] = useState(hasCorrection);
  const [state, formAction] = useActionState(
    saveEvidenceCorrectionAction,
    initialAnalysisFormState,
  );

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="compact"
        onClick={() => setOpen(true)}
      >
        Correct this
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 border-t border-border pt-4">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="analysisPublicId" value={analysisPublicId} />

      <div className="flex items-start gap-2.5">
        <Checkbox
          id={`incorrect-${matchId}`}
          name="markedIncorrect"
          defaultChecked={markedIncorrect}
          className="mt-0.5"
        />
        <Label htmlFor={`incorrect-${matchId}`} className="text-meta">
          This conclusion is wrong
        </Label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`evidence-${matchId}`}>Your evidence</Label>
        <Textarea
          id={`evidence-${matchId}`}
          name="evidence"
          rows={3}
          maxLength={5_000}
          defaultValue={evidence ?? ""}
          placeholder="Where in your experience does this show up?"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`notes-${matchId}`}>Note</Label>
        <Textarea
          id={`notes-${matchId}`}
          name="notes"
          rows={2}
          maxLength={2_000}
          defaultValue={notes ?? ""}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <Button
          type="button"
          variant="ghost"
          size="compact"
          onClick={() => setOpen(false)}
        >
          Close
        </Button>
        {state.status !== "idle" ? (
          <span
            role="status"
            className={
              state.status === "error"
                ? "text-label text-danger"
                : "text-label text-text-secondary"
            }
          >
            {state.message}
          </span>
        ) : null}
      </div>

      <p className="text-label text-text-muted">
        Saved corrections are sent with future analyses of this resume version.
      </p>
    </form>
  );
}
