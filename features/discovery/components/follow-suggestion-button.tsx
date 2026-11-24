"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { followSuggestedBoardAction } from "../actions/source-actions";

export function FollowSuggestionButton({ publicId, companyName }: { publicId: string; companyName: string }) {
  const router = useRouter();
  const follow = useMutation({
    mutationFn: () => followSuggestedBoardAction(publicId),
    onSuccess: (result) => {
      if (!result.ok) {
        notify.error(result.message);
        return;
      }

      notify.success(`Following ${result.companyName}.`);
      router.refresh();
    },
    onError: () => notify.error(`${companyName} could not be followed. Please try again.`),
  });

  return (
    <Button type="button" variant="outline" size="compact" disabled={follow.isPending} onClick={() => follow.mutate()}>
      {follow.isPending ? "Following..." : "Follow"}
    </Button>
  );
}
