"use client";

import { Button } from "@/components/ui/button";
import { useDiscoveryRefresh } from "./refresh-context";

export function RefreshButton() {
  const { checking, refresh } = useDiscoveryRefresh();

  return (
    <Button type="button" variant="outline" disabled={checking} onClick={refresh} className="shrink-0">
      {checking ? "Checking..." : "Check for new jobs"}
    </Button>
  );
}
