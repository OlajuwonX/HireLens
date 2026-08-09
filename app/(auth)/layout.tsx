import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col bg-background px-6 py-10">
      <Link
        href="/"
        className="text-section-title font-semibold text-text-primary"
      >
        HireLens
      </Link>
      <div className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-form">{children}</div>
      </div>
    </main>
  );
}
