"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { prepareTaskAction } from "../actions/task-actions";
import { MAX_PREPARE_STEPS } from "../constants";

export function PrepareButton({ publicId, label = "Prepare" }: { publicId: string; label?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const prepare = useMutation({
    mutationFn: async () => {
      for (let attempt = 1; attempt <= MAX_PREPARE_STEPS; attempt++) {
        setStep(attempt);
        const result = await prepareTaskAction(publicId);

        if (!result.ok || !result.more) {
          return result;
        }
      }

      return { ok: true as const, state: "PREPARING" as const, more: true };
    },
    onSettled: () => {
      setStep(0);
      router.refresh();
    },
    onSuccess: (result) => {
      if (!result.ok) {
        notify.error(result.message);
      }
    },
    onError: () => notify.error("Preparation stopped. Your progress is saved; try again."),
  });

  return (
    <Button type="button" size="compact" disabled={prepare.isPending} onClick={() => prepare.mutate()}>
      {prepare.isPending ? `Preparing (step ${step})...` : label}
    </Button>
  );
}
