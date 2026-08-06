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
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-gray-950">
      <section className="max-w-md text-center">
        <p className="text-sm font-semibold text-red-700">Error</p>
        <h1 className="mt-3 text-3xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-gray-600">
          HireLens could not load this view. Try again when you are ready.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-green-500 px-4 py-2 font-semibold text-green-950"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
