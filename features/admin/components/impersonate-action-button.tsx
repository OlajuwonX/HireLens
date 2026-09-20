"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { notify } from "@/components/ui/toast";
import { startImpersonationAction } from "@/features/admin/actions/impersonation-actions";

export function ImpersonateActionButton({
  publicId,
  targetLabel,
}: {
  publicId: string;
  targetLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="compact">
          Impersonate
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-border">
        <div className="space-y-2 pr-8">
          <DialogTitle className="text-section-title font-semibold text-text-primary">
            Impersonate {targetLabel}?
          </DialogTitle>
          <DialogDescription className="text-meta leading-relaxed text-text-secondary">
            You&apos;ll view HireLens as this user for up to 15 minutes. This
            is logged, and you can&apos;t change their password or email, or
            delete their account, while impersonating.
          </DialogDescription>
        </div>

        <div className="mt-4 space-y-1.5">
          <label
            htmlFor="impersonate-reason"
            className="text-meta font-medium text-text-primary"
          >
            Reason
          </label>
          <textarea
            id="impersonate-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="Why are you impersonating this user?"
            className="w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-meta text-text-primary placeholder:text-text-muted"
          />
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="danger"
            disabled={pending || reason.trim().length < 10}
            onClick={() => {
              const formData = new FormData();
              formData.set("targetPublicId", publicId);
              formData.set("reason", reason);

              startTransition(async () => {
                try {
                  await startImpersonationAction(formData);
                } catch (error) {
                  if (
                    error instanceof Error &&
                    error.message.includes("NEXT_REDIRECT")
                  ) {
                    return;
                  }

                  notify.error(
                    error instanceof Error
                      ? error.message
                      : "Could not start impersonation.",
                  );
                }
              });
            }}
          >
            Start impersonating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
