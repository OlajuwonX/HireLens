"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { queueApplicationAction } from "../actions/task-actions";
import { stageHref } from "@/features/applications/stages";

export function AddToAutoApplyButton({ applicationPublicId }: { applicationPublicId: string }) {
  const router = useRouter();
  const queue = useMutation({
    mutationFn: () => queueApplicationAction(applicationPublicId),
    onSuccess: (result) => {
      if (!result.ok) {
        notify.error(result.message);
        return;
      }

      router.push(stageHref("preparing"));
    },
    onError: () => notify.error("That job could not be added. Please try again."),
  });

  return (
    <Button type="button" variant="outline" size="compact" disabled={queue.isPending} onClick={() => queue.mutate()}>
      {queue.isPending ? "Adding..." : "Auto Apply"}
    </Button>
  );
}
