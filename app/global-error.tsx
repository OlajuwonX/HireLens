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
        <main className="flex min-h-screen items-center justify-center bg-white px-6 text-gray-950">
          <section className="max-w-md text-center">
            <p className="text-sm font-semibold text-red-700">Fatal error</p>
            <h1 className="mt-3 text-3xl font-semibold">
              HireLens needs to reload
            </h1>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-lg bg-green-500 px-4 py-2 font-semibold text-green-950"
            >
              Reload
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
