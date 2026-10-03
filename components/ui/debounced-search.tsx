"use client";

import { SEARCH_DEBOUNCE_MS } from "@/lib/search/constants";
import { createDraftSync, type DraftSync } from "@/lib/search/draft-sync";
import { useEffect, useRef, useState } from "react";
import { SearchInput } from "./search-input";

export function DebouncedSearch({
  value,
  onSearch,
  placeholder,
  label,
  delay = SEARCH_DEBOUNCE_MS,
  className,
}: {
  value: string;
  onSearch: (next: string) => void;
  placeholder?: string;
  label: string;
  delay?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(draft);
  const onSearchRef = useRef(onSearch);
  const syncRef = useRef<DraftSync | null>(null);

  if (syncRef.current === null) {
    syncRef.current = createDraftSync(value);
  }

  const sync = syncRef.current;

  useEffect(() => {
    draftRef.current = draft;
    onSearchRef.current = onSearch;
  });

  useEffect(() => {
    const next = sync.reconcile(draftRef.current, value);

    if (next !== draftRef.current) {
      setDraft(next);
    }
  }, [value, sync]);

  useEffect(() => {
    if (draft === sync.lastCommitted()) {
      return;
    }

    const timer = setTimeout(() => {
      if (draft === sync.lastCommitted()) {
        return;
      }

      sync.commit(draft);
      onSearchRef.current(draft);
    }, delay);

    return () => clearTimeout(timer);
  }, [draft, delay, sync]);

  return (
    <SearchInput
      value={draft}
      aria-label={label}
      placeholder={placeholder}
      className={className}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          if (draft !== sync.lastCommitted()) {
            sync.commit(draft);
            onSearchRef.current(draft);
          }
        }
      }}
    />
  );
}
