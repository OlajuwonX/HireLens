import { requireCurrentUser } from "@/features/auth/server/require-user";
import Image from "next/image";
import Link from "next/link";

export default async function AccountRecoveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCurrentUser();

  return (
    <main className="flex min-h-dvh flex-col bg-background px-6 py-6 sm:py-10">
      <div className="flex gap-2">
        <Image
          src="/hllogo-64.png"
          alt=""
          width={26}
          height={26}
          priority
          className="size-7 shrink-0 rounded-control object-contain"
        />
        <Link
          href="/"
          className="text-section-title font-semibold text-text-primary"
        >
          HireLens
        </Link>
      </div>
      <div className="flex flex-1 items-start justify-center pt-8 sm:items-center sm:pt-0">
        <div className="w-full max-w-form">{children}</div>
      </div>
    </main>
  );
}
