"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { runJobFitAnalysisAction } from "@/features/analyses/actions/analysis-actions";
import { initialAnalysisFormState } from "@/features/analyses/actions/analysis-form-state";

export type VersionOption = {
  publicId: string;
  label: string;
  resumeTitle: string;
  isDefault: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Analysing…" : "Run job-fit analysis"}
    </Button>
  );
}

export function RunJobFitForm({
  jobPublicId,
  versions,
}: {
  jobPublicId: string;
  versions: VersionOption[];
}) {
  const [state, formAction] = useActionState(
    runJobFitAnalysisAction,
    initialAnalysisFormState,
  );

  if (versions.length === 0) {
    return (
      <p className="text-meta text-text-secondary">
        Upload a resume version first, then analyse it against this job.
      </p>
    );
  }

  const preselected =
    versions.find((version) => version.isDefault)?.publicId ??
    versions[0].publicId;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="jobPublicId" value={jobPublicId} />

      {state.status === "error" ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="versionPublicId">Resume version</Label>
        <Select
          id="versionPublicId"
          name="versionPublicId"
          defaultValue={preselected}
        >
          {versions.map((version) => (
            <option key={version.publicId} value={version.publicId}>
              {version.resumeTitle} — {version.label}
              {version.isDefault ? " (default)" : ""}
            </option>
          ))}
        </Select>
      </div>

      <SubmitButton />
    </form>
  );
}
