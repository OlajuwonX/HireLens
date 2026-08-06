import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-gray-950">
      <section className="max-w-md text-center">
        <p className="text-sm font-semibold text-green-700">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-gray-600">
          The page you are looking for is not part of the HireLens workspace.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-green-500 px-4 py-2 font-semibold text-green-950"
        >
          Back to HireLens
        </Link>
      </section>
    </main>
  );
}
