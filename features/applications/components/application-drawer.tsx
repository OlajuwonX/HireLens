"use client";

import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasOpenOverlay } from "../step-through";

const TABS = ["Overview", "Analysis", "AI Documents"] as const;

export function ApplicationDrawer({
  title,
  subtitle,
  closeHref,
  overview,
  analysis,
  documents,
  documentsDisabledReason = null,
  navigable = false,
}: {
  title: string;
  subtitle: string;
  closeHref: string;
  overview: React.ReactNode;
  analysis: React.ReactNode;
  documents: React.ReactNode;
  documentsDisabledReason?: string | null;
  navigable?: boolean;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && !hasOpenOverlay()) {
        router.push(closeHref, { scroll: false });
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeHref, router]);

  const panels = {
    Overview: overview,
    Analysis: analysis,
    "AI Documents": documents,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6 lg:pointer-events-none lg:items-stretch lg:justify-end lg:p-0">
      <Link
        href={closeHref}
        scroll={false}
        aria-label="Close"
        className="absolute inset-0 bg-black/50 lg:hidden"
      />

      <div
        role="dialog"
        aria-label={title}
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-card border border-border bg-surface shadow-2xl transition-[transform,opacity] duration-300 ease-[var(--ease-drawer)] starting:translate-y-6 starting:opacity-0 sm:max-h-[88dvh] sm:max-w-3xl sm:rounded-card lg:pointer-events-auto lg:h-full lg:max-h-none lg:max-w-[min(46rem,55vw)] lg:rounded-none lg:border-y-0 lg:border-r-0 lg:starting:translate-x-10 lg:starting:translate-y-0"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="truncate text-section-title font-semibold text-text-primary">
              {title}
            </h2>
            <p className="truncate text-meta text-text-secondary">{subtitle}</p>
            {navigable ? (
              <p className="mt-1 hidden font-mono text-system uppercase text-text-muted lg:block">
                ↑ ↓ next job · Esc close
              </p>
            ) : null}
          </div>
          <IconButton label="Close" asChild>
            <Link href={closeHref} scroll={false}>
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
            {TABS.map((name) => {
              const disabled =
                name === "AI Documents" && documentsDisabledReason !== null;

              return (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  data-onboarding={
                    name === "Analysis" ? "analysis-tab" : undefined
                  }
                  aria-selected={tab === name}
                  aria-disabled={disabled || undefined}
                  disabled={disabled}
                  title={disabled ? (documentsDisabledReason ?? undefined) : undefined}
                  onClick={() => setTab(name)}
                  className={cn(
                    "h-9 min-w-0 flex-auto truncate whitespace-nowrap rounded-control px-2 text-meta font-semibold transition-colors sm:px-3",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text-secondary",
                    tab === name
                      ? "bg-accent text-accent-text"
                      : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                  )}
                >
                  {name === "AI Documents" ? (
                    <>
                      <span className="sm:hidden">Documents</span>
                      <span className="hidden sm:inline">AI Documents</span>
                    </>
                  ) : (
                    name
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hl-scroll flex-1 overflow-y-auto p-4 sm:p-5">
          {panels[tab]}
        </div>
      </div>
    </div>
  );
}
