"use client";

import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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

  const panels = {
    Overview: overview,
    Analysis: analysis,
    "AI Documents": documents,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <Link
        href={closeHref}
        aria-label="Close"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-card border border-border bg-surface shadow-2xl sm:max-h-[88vh] sm:max-w-3xl sm:rounded-card"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
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

        <div className="shrink-0 border-b border-border bg-surface-secondary p-2 sm:px-4">
          <div
            role="tablist"
            aria-label="Application sections"
            className="hl-scroll flex gap-1 overflow-x-auto rounded-control border border-border bg-surface p-1"
          >
            {TABS.map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                data-onboarding={name === "Analysis" ? "analysis-tab" : undefined}
                aria-selected={tab === name}
                onClick={() => setTab(name)}
                className={cn(
                  "h-9 flex-1 shrink-0 whitespace-nowrap rounded-control px-3 text-meta font-semibold transition-colors",
                  tab === name
                    ? "bg-accent text-accent-text"
                    : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="hl-scroll flex-1 overflow-y-auto p-4 sm:p-5">
          {panels[tab]}
        </div>
      </div>
    </div>
  );
}
