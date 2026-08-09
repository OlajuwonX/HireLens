"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/button";

const TABS = ["Overview", "Analysis", "AI Documents"] as const;

export function ApplicationDrawer({
  title,
  subtitle,
  closeHref,
  overview,
  analysis,
  documents,
}: {
  title: string;
  subtitle: string;
  closeHref: string;
  overview: React.ReactNode;
  analysis: React.ReactNode;
  documents: React.ReactNode;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const panels = { Overview: overview, Analysis: analysis, "AI Documents": documents };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <Link
        href={closeHref}
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full flex-col border-l border-border bg-surface sm:max-w-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div className="min-w-0">
            <h2 className="truncate text-section-title font-semibold text-text-primary">
              {title}
            </h2>
            <p className="truncate text-meta text-text-secondary">{subtitle}</p>
          </div>
          <IconButton label="Close" asChild>
            <Link href={closeHref}>
              <X aria-hidden="true" className="size-4" />
            </Link>
          </IconButton>
        </header>

        <div
          role="tablist"
          aria-label="Application sections"
          className="flex gap-1 border-b border-border px-3"
        >
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={cn(
                "h-10 px-3 text-meta font-medium transition-colors",
                tab === name
                  ? "border-b-2 border-accent text-text-primary"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">{panels[tab]}</div>
      </div>
    </div>
  );
}
