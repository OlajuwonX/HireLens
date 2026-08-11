"use client";

import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        if (canGoBack) {
          router.back();
          return;
        }

        router.push(href ?? "/dashboard");
      }}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-control px-2.5 text-meta font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary",
        className,
      )}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </button>
  );
}
