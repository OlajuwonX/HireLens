import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-page items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-1.5">
          <Image
            src="/hllogo-64.png"
            alt=""
            width={26}
            height={26}
            priority
            className="size-7 shrink-0 rounded-control object-contain"
          />
          <span className="text-section-title font-semibold text-text-primary">
            HireLens
          </span>
        </Link>
        <Button asChild variant="ghost" size="compact">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </div>
    </header>
  );
}
