"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDiscoveryRefresh } from "./refresh-context";

export function RefreshButton() {
  const { checking, refresh } = useDiscoveryRefresh();

  return (
    <Button type="button" variant="outline" disabled={checking} onClick={refresh} className="shrink-0">
      <RefreshCw className={cn("size-4", checking && "animate-spin")} aria-hidden />
      {checking ? "Checking..." : "Check for new jobs"}
    </Button>
  );
}
