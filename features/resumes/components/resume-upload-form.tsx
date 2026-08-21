"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/toast";
import { uploadResumeAction } from "@/features/resumes/actions/resume-version-actions";
import { initialUploadResumeState } from "@/features/resumes/actions/resume-form-state";
import { JobTitleCombobox, type JobTitleOption } from "./job-title-combobox";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} block>
      {pending ? "Uploading…" : label}
    </Button>
  );
}

export function ResumeUploadForm({
  options,
  resumePublicId,
  submitLabel = "Upload resume",
  onSuccess,
}: {
  options?: JobTitleOption[];
  resumePublicId?: string;
  submitLabel?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(
    uploadResumeAction,
    initialUploadResumeState,
  );
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const announced = useRef(initialUploadResumeState);

  useEffect(() => {
    if (state === announced.current || state.status === "idle") {
      return;
    }

    announced.current = state;

    if (state.status === "error") {
      notify.error(state.message);
      return;
    }

    notify.success(state.message);
    formRef.current?.reset();
    setSelectedFileName(null);
    setResetKey((key) => key + 1);
    onSuccess?.();
  }, [state, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {resumePublicId ? (
        <input type="hidden" name="resumePublicId" value={resumePublicId} />
      ) : null}

      {options ? (
        <div className="space-y-1.5">
          <Label htmlFor="jobTitle">Job title</Label>
          <JobTitleCombobox
            key={`title-${resetKey}`}
            id="jobTitle"
            options={options}
          />
          <p className="text-label text-text-muted">
            Pick a job title you already use, or type a new one.
          </p>
        </div>
      ) : null}

      <FileDropzone
        key={`file-${resetKey}`}
        id="file"
        name="file"
        required
        accept="application/pdf,.pdf"
        label={selectedFileName ?? "Select a resume PDF"}
        description="PDF only, up to 10MB. The file name becomes the version name."
        onChange={(event) =>
          setSelectedFileName(event.target.files?.[0]?.name ?? null)
        }
      />

      <SubmitButton label={submitLabel} />
    </form>
  );
}
