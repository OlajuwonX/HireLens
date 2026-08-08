"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Input } from "@/components/ui/input";
import {
  createResumeVersionAction,
  type CreateResumeVersionFormState,
} from "@/features/resumes/actions/resume-version-actions";

const initialState: CreateResumeVersionFormState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Uploading…" : "Create version"}
    </Button>
  );
}

export function CreateResumeVersionForm({
  resumePublicId,
}: {
  resumePublicId: string;
}) {
  const [state, formAction] = useActionState(
    createResumeVersionAction,
    initialState,
  );
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="resumePublicId" value={resumePublicId} />

      {state.status === "error" ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="label" className="text-sm font-medium text-gray-700">
          Version label
        </label>
        <Input
          id="label"
          name="label"
          required
          maxLength={120}
          placeholder="Job-specific version"
        />
      </div>

      <div className="space-y-2">
        <FileDropzone
          id="file"
          name="file"
          required
          accept="application/pdf,.pdf"
          label={selectedFileName ?? "Select a resume PDF"}
          description="PDF only, up to 10MB."
          onChange={(event) =>
            setSelectedFileName(event.target.files?.[0]?.name ?? null)
          }
        />
      </div>

      <SubmitButton />
    </form>
  );
}
