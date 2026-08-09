"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateApplicationAction } from "@/features/applications/actions/application-actions";
import { initialApplicationFormState } from "@/features/applications/actions/application-form-state";
import {
  APPLICATION_STAGES,
  applicationStageLabels,
  type ApplicationStage,
} from "@/features/applications/constants";
import type { VersionOption } from "@/features/jobs/components/run-job-fit-form";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save application"}
    </Button>
  );
}

function toDateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function ApplicationDetailForm({
  publicId,
  stage,
  appliedAt,
  followUpAt,
  interviewAt,
  notes,
  resumeVersionPublicId,
  versions,
}: {
  publicId: string;
  stage: ApplicationStage;
  appliedAt: Date | null;
  followUpAt: Date | null;
  interviewAt: Date | null;
  notes: string | null;
  resumeVersionPublicId: string | null;
  versions: VersionOption[];
}) {
  const [state, formAction] = useActionState(
    updateApplicationAction,
    initialApplicationFormState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="publicId" value={publicId} />

      {state.status === "error" ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}
      {state.status === "saved" ? (
        <Alert tone="success">{state.message}</Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="stage">Stage</Label>
          <Select id="stage" name="stage" defaultValue={stage}>
            {APPLICATION_STAGES.map((value) => (
              <option key={value} value={value}>
                {applicationStageLabels[value]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="resumeVersionPublicId">Resume version</Label>
          <Select
            id="resumeVersionPublicId"
            name="resumeVersionPublicId"
            defaultValue={resumeVersionPublicId ?? ""}
          >
            <option value="">Not set</option>
            {versions.map((version) => (
              <option key={version.publicId} value={version.publicId}>
                {version.resumeTitle} — {version.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="appliedAt">Applied on</Label>
          <Input
            id="appliedAt"
            name="appliedAt"
            type="date"
            defaultValue={toDateInput(appliedAt)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="followUpAt">Follow up on</Label>
          <Input
            id="followUpAt"
            name="followUpAt"
            type="date"
            defaultValue={toDateInput(followUpAt)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="interviewAt">Interview on</Label>
          <Input
            id="interviewAt"
            name="interviewAt"
            type="date"
            defaultValue={toDateInput(interviewAt)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={5}
          maxLength={10_000}
          defaultValue={notes ?? ""}
        />
      </div>

      <SubmitButton />
    </form>
  );
}
