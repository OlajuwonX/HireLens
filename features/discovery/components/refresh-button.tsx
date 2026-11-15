"use client";

import { useMutation } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { refreshDiscoveryAction } from "../actions/discovery-actions";

export function RefreshButton() {
  const router = useRouter();
  const refresh = useMutation({
    mutationFn: () => refreshDiscoveryAction(),
    onSuccess: (report) => {
      notify.success(
        report.synced > 0 ? `Checked ${report.synced} sources for new jobs.` : "Everything was checked recently. You're up to date.",
      );
      router.refresh();
    },
    onError: () => notify.error("The check could not finish. Please try again."),
  });

  return (
    <Button type="button" variant="outline" disabled={refresh.isPending} onClick={() => refresh.mutate()}>
      <RefreshCw className={refresh.isPending ? "size-4 animate-spin" : "size-4"} aria-hidden />
      {refresh.isPending ? "Checking..." : "Check for new jobs"}
    </Button>
  );
}
