"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateDocumentAction } from "../actions/document-actions";
import { initialDocumentFormState } from "../actions/document-form-state";
import { DOCUMENT_TYPES, documentTypeLabels } from "../constants";

type Option = { publicId: string; label: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="primary" disabled={pending}>
      {pending ? "Generating..." : "Generate document"}
    </Button>
  );
}

export function DocumentGenerateForm({
  jobs,
  versions,
  applications,
}: {
  jobs: Option[];
  versions: Option[];
  applications: Option[];
}) {
  const [state, formAction] = useActionState(
    generateDocumentAction,
    initialDocumentFormState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" ? (
        <p className="text-meta text-danger">{state.message}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="type">Document</Label>
          <select
            id="type"
            name="type"
            className="h-10 w-full border border-border bg-surface px-3 text-meta text-text-primary"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {documentTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="jobPublicId">Saved job</Label>
          <select
            id="jobPublicId"
            name="jobPublicId"
            required
            className="h-10 w-full border border-border bg-surface px-3 text-meta text-text-primary"
          >
            <option value="">Select job</option>
            {jobs.map((job) => (
              <option key={job.publicId} value={job.publicId}>
                {job.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="resumeVersionPublicId">Resume version</Label>
          <select
            id="resumeVersionPublicId"
            name="resumeVersionPublicId"
            className="h-10 w-full border border-border bg-surface px-3 text-meta text-text-primary"
          >
            <option value="">No resume version</option>
            {versions.map((version) => (
              <option key={version.publicId} value={version.publicId}>
                {version.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="applicationPublicId">Application</Label>
          <select
            id="applicationPublicId"
            name="applicationPublicId"
            className="h-10 w-full border border-border bg-surface px-3 text-meta text-text-primary"
          >
            <option value="">No tracked application</option>
            {applications.map((application) => (
              <option key={application.publicId} value={application.publicId}>
                {application.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Extra direction</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={5}
          maxLength={5_000}
          placeholder="Tone, hiring manager name, constraints, or evidence to emphasize."
        />
      </div>

      <SubmitButton />
    </form>
  );
}
