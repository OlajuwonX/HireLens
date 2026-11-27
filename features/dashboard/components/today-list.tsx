import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TodayItem } from "../today-items";

export function TodayList({ items }: { items: TodayItem[] }) {
  return (
    <ul className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="pressable group flex items-start gap-4 py-4 sm:gap-6 sm:py-5"
          >
            <span
              data-numeric
              className={cn(
                "w-10 shrink-0 pt-0.5 text-right font-mono text-section-title font-semibold",
                item.urgent ? "text-accent" : "text-text-muted",
              )}
            >
              {item.count ?? "—"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body font-medium text-text-primary underline-offset-4 group-hover:underline">
                {item.title}
              </span>
              <span className="mt-0.5 block text-meta text-text-secondary">{item.detail}</span>
            </span>
            <span aria-hidden className="pt-0.5 font-mono text-meta text-text-muted transition-transform duration-150 ease-out group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
