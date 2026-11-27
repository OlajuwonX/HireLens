"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";

export function UndoableButton({
  label,
  pendingLabel,
  doneMessage,
  failMessage,
  run,
  undo,
  variant = "outline",
  size = "compact",
}: {
  label: string;
  pendingLabel: string;
  doneMessage: string;
  failMessage: string;
  run: () => Promise<boolean>;
  undo: () => Promise<boolean>;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const router = useRouter();
  const restore = useMutation({
    mutationFn: undo,
    onSuccess: (ok) => (ok ? router.refresh() : notify.error("That could not be undone. Please try again.")),
    onError: () => notify.error("That could not be undone. Please try again."),
  });
  const act = useMutation({
    mutationFn: run,
    onSuccess: (ok) => {
      if (!ok) {
        notify.error(failMessage);
        return;
      }

      router.refresh();
      notify.undo(doneMessage, () => restore.mutate());
    },
    onError: () => notify.error(failMessage),
  });

  return (
    <Button type="button" variant={variant} size={size} disabled={act.isPending} onClick={() => act.mutate()}>
      {act.isPending ? pendingLabel : label}
    </Button>
  );
}
