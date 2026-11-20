"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { generatePrepAction } from "../actions/response-actions";

export function GeneratePrepButton({ publicId, label = "Prepare for this interview" }: { publicId: string; label?: string }) {
  const router = useRouter();
  const generate = useMutation({
    mutationFn: () => generatePrepAction(publicId),
    onSuccess: (result) => {
      if (!result.ok) {
        notify.error(result.message);
        return;
      }

      notify.success("Interview preparation is ready.");
      router.refresh();
    },
    onError: () => notify.error("Preparation could not be generated. Please try again."),
  });

  return (
    <Button type="button" size="compact" disabled={generate.isPending} onClick={() => generate.mutate()}>
      {generate.isPending ? "Preparing..." : label}
    </Button>
  );
}
