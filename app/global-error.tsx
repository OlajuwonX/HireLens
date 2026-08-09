"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-surface px-6 text-text-primary">
          <section className="max-w-md text-center">
            <p className="text-meta font-semibold text-red-700">Fatal error</p>
            <h1 className="mt-3 text-card-metric font-semibold">
              HireLens needs to reload
            </h1>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-card bg-accent px-4 py-2 font-semibold text-green-950"
            >
              Reload
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
