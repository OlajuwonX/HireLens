"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import type { TaskResult } from "../server/task.service";

export function TaskActionButton({
  publicId,
  action,
  label,
  pendingLabel,
  success,
  variant = "outline",
}: {
  publicId: string;
  action: (publicId: string) => Promise<TaskResult>;
  label: string;
  pendingLabel: string;
  success: string;
  variant?: "primary" | "outline";
}) {
  const router = useRouter();
  const run = useMutation({
    mutationFn: () => action(publicId),
    onSuccess: (result) => {
      if (!result.ok) {
        notify.error(result.message);
        return;
      }

      notify.success(success);
      router.refresh();
    },
    onError: () => notify.error("That did not work. Please try again."),
  });

  return (
    <Button type="button" size="compact" variant={variant} disabled={run.isPending} onClick={() => run.mutate()}>
      {run.isPending ? pendingLabel : label}
    </Button>
  );
}
