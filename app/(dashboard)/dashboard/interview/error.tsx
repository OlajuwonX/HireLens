"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/layout/page-title";

export default function InterviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="space-y-6">
      <PageTitle title="Interview" />
      <Card>
        <CardContent className="space-y-3 px-5 pb-5 pt-5">
          <p className="font-mono text-system font-medium uppercase text-danger">
            Interview
          </p>
          <p className="text-section-title font-semibold text-text-primary">
            This view could not load
          </p>
          <p className="text-meta text-text-secondary">
            Your interview progress is safe. The rest of HireLens is unaffected.
            Try again in a moment.
          </p>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
