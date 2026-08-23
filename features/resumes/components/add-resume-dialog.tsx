"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { JobTitleOption } from "./job-title-combobox";
import { ResumeUploadForm } from "./resume-upload-form";

export function AddResumeDialog({
  options,
  label = "Add resume",
  variant = "primary",
  redirectTo,
  triggerClassName,
}: {
  options: JobTitleOption[];
  label?: string;
  variant?: ButtonProps["variant"];
  redirectTo?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = useCallback(() => {
    setOpen(false);

    if (redirectTo) {
      router.push(redirectTo);
    }
  }, [redirectTo, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={variant} className={triggerClassName}>
          <Plus className="size-4" aria-hidden />
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-md">
        <div className="shrink-0 border-b border-border p-4 pr-12 sm:p-5">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            Add a resume
          </DialogTitle>
          <DialogDescription className="mt-1 text-meta text-text-secondary">
            Give it a job title, or add it to a job title you already use. The
            file name becomes the resume name.
          </DialogDescription>
        </div>

        <div className="p-4 sm:p-5">
          <ResumeUploadForm
            options={options}
            submitLabel="Add resume"
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
