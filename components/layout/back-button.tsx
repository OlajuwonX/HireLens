"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const base =
  "inline-flex h-9 items-center gap-1.5 rounded-control px-2.5 text-meta font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary";

export function BackButton({
  href,
  label = "Back",
  className,
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();

  if (href) {
    return (
      <Link href={href} className={cn(base, className)}>
        <ArrowLeft className="size-4" aria-hidden />
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn(base, className)}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </button>
  );
}
