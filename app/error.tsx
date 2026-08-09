"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 text-text-primary">
      <section className="max-w-md text-center">
        <p className="text-meta font-semibold text-red-700">Error</p>
        <h1 className="mt-3 text-card-metric font-semibold">Something went wrong</h1>
        <p className="mt-3 text-text-secondary">
          HireLens could not load this view. Try again when you are ready.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-card bg-accent px-4 py-2 font-semibold text-green-950"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
