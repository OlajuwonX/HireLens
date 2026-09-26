"use client";

import { IconButton } from "@/components/ui/button";
import { useCloseMobileNav } from "@/components/layout/mobile-nav-context";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearch } from "./search-provider";

function usePlatformShortcut() {
  const [label, setLabel] = useState("Ctrl K");

  useEffect(() => {
    const platform =
      typeof navigator === "undefined" ? "" : navigator.userAgent.toLowerCase();

    if (platform.includes("mac") || platform.includes("iphone")) {
      setLabel("⌘K");
    }
  }, []);

  return label;
}

export function SearchTrigger({ variant }: { variant: "header" | "row" }) {
  const search = useSearch();
  const shortcut = usePlatformShortcut();
  const closeMobileNav = useCloseMobileNav();

  if (!search) {
    return null;
  }

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={() => {
          closeMobileNav();
          search.openSearch();
        }}
        aria-haspopup="dialog"
        className="flex h-11 w-full items-center gap-3 rounded-control border border-border bg-surface px-3 text-meta text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary"
      >
        <Search aria-hidden="true" className="size-4 shrink-0" />
        Search
      </button>
    );
  }

  return (
    <>
      <IconButton
        label="Search"
        onClick={search.openSearch}
        aria-haspopup="dialog"
        className="shrink-0 sm:hidden"
      >
        <Search aria-hidden="true" className="size-5" />
      </IconButton>

      <button
        type="button"
        onClick={search.openSearch}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        className="hidden h-10 shrink-0 items-center gap-2 rounded-control border border-border-strong bg-surface px-3 text-meta text-text-muted transition-colors hover:border-accent-hover hover:text-text-primary sm:flex sm:w-44 md:w-52 lg:w-72 xl:w-96"
      >
        <Search aria-hidden="true" className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">
          <span className="lg:hidden">Search</span>
          <span className="hidden lg:inline">
            Search resumes, jobs, documents…
          </span>
        </span>
        <kbd className="ml-auto shrink-0 rounded-control border border-border bg-surface-secondary px-1.5 py-0.5 font-mono text-system text-text-muted">
          {shortcut}
        </kbd>
      </button>
    </>
  );
}
