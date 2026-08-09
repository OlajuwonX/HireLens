"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 text-text-primary">
      <section className="max-w-md text-center">
        <p className="font-mono text-system font-medium uppercase text-danger">
          Error
        </p>
        <h1 className="mt-3 text-card-metric font-semibold">
          Something went wrong
        </h1>
        <p className="mt-3 text-meta text-text-secondary">
          HireLens could not load this view. Try again when you are ready.
        </p>
        <div className="mt-6 flex justify-center">
          <Button onClick={reset}>Try again</Button>
        </div>
      </section>
    </main>
  );
}
