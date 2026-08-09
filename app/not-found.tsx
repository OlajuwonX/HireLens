import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 text-text-primary">
      <section className="max-w-md text-center">
        <p className="text-meta font-semibold text-text-primary">404</p>
        <h1 className="mt-3 text-card-metric font-semibold">Page not found</h1>
        <p className="mt-3 text-text-secondary">
          The page you are looking for is not part of the HireLens workspace.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-card bg-accent px-4 py-2 font-semibold text-green-950"
        >
          Back to HireLens
        </Link>
      </section>
    </main>
  );
}
