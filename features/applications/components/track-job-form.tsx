"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { trackApplicationAction } from "@/features/applications/actions/application-actions";
import { initialApplicationFormState } from "@/features/applications/actions/application-form-state";
import {
  APPLICATION_STAGES,
  applicationStageLabels,
} from "@/features/applications/constants";
import type { VersionOption } from "@/features/jobs/components/run-job-fit-form";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Adding…" : "Track application"}
    </Button>
  );
}

export function TrackJobForm({
  jobPublicId,
  versions,
  existingApplicationPublicId,
}: {
  jobPublicId: string;
  versions: VersionOption[];
  existingApplicationPublicId: string | null;
}) {
  const [state, formAction] = useActionState(
    trackApplicationAction,
    initialApplicationFormState,
  );

  if (existingApplicationPublicId) {
    return (
      <div className="space-y-3">
        <p className="text-meta text-text-secondary">
          You are already tracking this job.
        </p>
        <Button asChild variant="outline">
          <Link href={`/dashboard/applications/${existingApplicationPublicId}`}>
            Open application
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="jobPublicId" value={jobPublicId} />

      {state.status === "error" ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="track-stage">Starting stage</Label>
        <Select id="track-stage" name="stage" defaultValue="SAVED">
          {APPLICATION_STAGES.map((value) => (
            <option key={value} value={value}>
              {applicationStageLabels[value]}
            </option>
          ))}
        </Select>
      </div>

      {versions.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor="track-version">Resume version</Label>
          <Select
            id="track-version"
            name="resumeVersionPublicId"
            defaultValue=""
          >
            <option value="">Decide later</option>
            {versions.map((version) => (
              <option key={version.publicId} value={version.publicId}>
                {version.resumeTitle} — {version.label}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
