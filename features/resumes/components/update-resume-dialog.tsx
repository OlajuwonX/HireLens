"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ResumeUploadForm } from "./resume-upload-form";

export function UpdateResumeDialog({
  resumePublicId,
  resumeTitle,
}: {
  resumePublicId: string;
  resumeTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <Upload className="size-4" aria-hidden />
          Update resume
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <div className="shrink-0 border-b border-border p-4 pr-12 sm:p-5">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            Update resume
          </DialogTitle>
          <DialogDescription className="mt-1 text-meta text-text-secondary">
            Upload a new PDF for {resumeTitle}. It is added as the newest
            version and the file name becomes its name.
          </DialogDescription>
        </div>

        <div className="p-4 sm:p-5">
          <ResumeUploadForm
            resumePublicId={resumePublicId}
            submitLabel="Upload resume"
            onSuccess={close}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
