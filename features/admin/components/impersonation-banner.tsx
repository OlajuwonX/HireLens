"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { endImpersonationAction } from "@/features/admin/actions/impersonation-actions";

export function ImpersonationBanner({
  targetEmail,
  expiresAt,
}: {
  targetEmail: string;
  expiresAt: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warning/30 bg-warning/12 px-4 py-2 text-meta text-warning sm:px-6">
      <p>
        Viewing as <span className="font-semibold">{targetEmail}</span> —
        ends automatically at{" "}
        {new Date(expiresAt).toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
      <Button
        type="button"
        variant="dark"
        size="compact"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            try {
              await endImpersonationAction();
            } catch (error) {
              if (
                error instanceof Error &&
                error.message.includes("NEXT_REDIRECT")
              ) {
                return;
              }

              notify.error("Could not exit impersonation.");
            }
          });
        }}
      >
        {pending ? "Exiting..." : "Exit impersonation"}
      </Button>
    </div>
  );
}
