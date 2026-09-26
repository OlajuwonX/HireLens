"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isPaletteShortcut } from "../palette-state";
import { createResultCache } from "../result-cache";
import type { Command, SearchResponse } from "../types";
import { SearchPalette } from "./search-palette";

const RESULT_TTL_MS = 60_000;
const RESULT_MAX_ENTRIES = 30;

type SearchContextValue = {
  openSearch: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch() {
  return useContext(SearchContext);
}

export function SearchProvider({
  commands,
  recentsUserId,
  children,
}: {
  commands: Command[];
  recentsUserId: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const cache = useMemo(
    () =>
      createResultCache<SearchResponse>({
        ttlMs: RESULT_TTL_MS,
        maxEntries: RESULT_MAX_ENTRIES,
      }),
    [],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isPaletteShortcut(event)) {
        return;
      }

      event.preventDefault();
      setOpen((current) => !current);
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => () => cache.clear(), [cache]);

  const value = useMemo(() => ({ openSearch: () => setOpen(true) }), []);

  return (
    <SearchContext.Provider value={value}>
      {children}
      <SearchPalette
        open={open}
        onOpenChange={setOpen}
        commands={commands}
        recentsUserId={recentsUserId}
        cache={cache}
      />
    </SearchContext.Provider>
  );
}
