"use client";

import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUiStore } from "@/lib/stores/ui-store";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const setLastErrorEventId = useUiStore((state) => state.setLastErrorEventId);

  useEffect(() => {
    setLastErrorEventId(Sentry.captureException(error) ?? null);
  }, [error, setLastErrorEventId]);

  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <Card>
      <CardContent className="space-y-3 px-5 pb-5 pt-5">
        <p className="font-mono text-system font-medium uppercase text-danger">Error</p>
        <p className="text-section-title font-semibold text-text-primary">This page could not load</p>
        <p className="text-meta text-text-secondary">
          Your data is safe and the rest of HireLens still works. Try again, or pick another page from the menu.
        </p>
        {error.digest ? <p className="font-mono text-system text-text-muted">Reference {error.digest}</p> : null}
        <Button onClick={retry}>Try again</Button>
      </CardContent>
    </Card>
  );
}
