"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { normalizeSearchQuery } from "@/lib/search/query";
import { useDebouncedValue } from "@/lib/search/use-debounced-value";
import {
  Briefcase,
  CornerDownLeft,
  FileText,
  History,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildPaletteSections,
  flattenSections,
  type PaletteItem,
} from "../palette-items";
import { clampActive, highlightSegments, moveActive } from "../palette-state";
import { parseSearchResponse } from "../parse-response";
import {
  clearRecents,
  loadRecents,
  saveRecent,
} from "../recents";
import { cacheKey, type ResultCache } from "../result-cache";
import { isSafeInternalHref } from "../safe-href";
import { getBrowserStorage } from "../storage";
import {
  EMPTY_SEARCH_RESPONSE,
  type Command,
  type SearchResponse,
} from "../types";

type Status = "idle" | "loading" | "ready" | "error";

const LISTBOX_ID = "global-search-listbox";

function optionId(index: number) {
  return `global-search-option-${index}`;
}

function ItemIcon({ kind }: { kind: PaletteItem["kind"] }) {
  const className = "size-4 shrink-0 text-text-muted";

  if (kind === "recent") {
    return <History aria-hidden="true" className={className} />;
  }

  if (kind === "resume") {
    return <FileText aria-hidden="true" className={className} />;
  }

  if (kind === "job") {
    return <Briefcase aria-hidden="true" className={className} />;
  }

  if (kind === "document") {
    return <Sparkles aria-hidden="true" className={className} />;
  }

  return <Zap aria-hidden="true" className={className} />;
}

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightSegments(text, query).map((segment, index) =>
        segment.match ? (
          <mark
            key={index}
            className="bg-transparent font-semibold text-text-primary underline decoration-accent decoration-2 underline-offset-2"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

function PaletteBody({
  commands,
  recentsUserId,
  cache,
  onClose,
}: {
  commands: Command[];
  recentsUserId: string | null;
  cache: ResultCache<SearchResponse>;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [response, setResponse] = useState<SearchResponse>(EMPTY_SEARCH_RESPONSE);
  const [recents, setRecents] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const debounced = useDebouncedValue(query);
  const typed = normalizeSearchQuery(query);
  const settled = normalizeSearchQuery(debounced);
  const waiting = typed !== null && typed !== settled;
  const responseReady = !waiting && status === "ready";

  useEffect(() => {
    if (recentsUserId) {
      setRecents(loadRecents(getBrowserStorage(), recentsUserId));
    }
  }, [recentsUserId]);

  useEffect(() => {
    if (!settled) {
      setStatus("idle");
      setResponse(EMPTY_SEARCH_RESPONSE);
      return;
    }

    const key = cacheKey(settled);
    const cached = cache.get(key);

    if (cached) {
      setResponse(cached);
      setStatus("ready");
      return;
    }

    const controller = new AbortController();

    setStatus("loading");

    fetch(`/api/search?q=${encodeURIComponent(settled)}`, {
      signal: controller.signal,
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (result) => {
        if (!result.ok) {
          throw new Error(String(result.status));
        }

        return parseSearchResponse(await result.json());
      })
      .then((data) => {
        cache.set(key, data);
        setResponse(data);
        setStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus("error");
        }
      });

    return () => controller.abort();
  }, [settled, cache]);

  const sections = useMemo(
    () =>
      buildPaletteSections({
        query,
        recents,
        commands,
        response,
        responseReady,
      }),
    [query, recents, commands, response, responseReady],
  );
  const items = useMemo(() => flattenSections(sections), [sections]);
  const active = clampActive(activeIndex, items.length);

  useEffect(() => {
    if (active >= 0) {
      document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    }
  }, [active]);

  function activate(item: PaletteItem) {
    if (item.kind === "recent") {
      setQuery(item.title);
      setActiveIndex(0);
      inputRef.current?.focus();
      return;
    }

    if (!isSafeInternalHref(item.href)) {
      return;
    }

    if (recentsUserId && typed) {
      setRecents(saveRecent(getBrowserStorage(), recentsUserId, query));
    }

    onClose();
    router.push(item.href);
  }

  function statusMessage() {
    if (!typed) {
      return "";
    }

    if (waiting || status === "loading") {
      return "Searching";
    }

    if (status === "error") {
      return "Search is unavailable right now";
    }

    return `${items.length} ${items.length === 1 ? "result" : "results"}`;
  }

  const showEmpty = typed !== null && items.length === 0 && !waiting && status !== "loading" && status !== "error";
  let runningIndex = -1;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 pr-14 sm:px-4">
        <Search aria-hidden="true" className="size-4 shrink-0 text-text-muted" />
        <input
          ref={inputRef}
          autoFocus
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={LISTBOX_ID}
          aria-activedescendant={active >= 0 ? optionId(active) : undefined}
          aria-autocomplete="list"
          aria-label="Search HireLens"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          enterKeyHint="search"
          maxLength={100}
          value={query}
          placeholder="Search resumes, jobs, documents, settings…"
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex(moveActive(active, items.length, 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex(moveActive(active, items.length, -1));
            } else if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();

              const item = items[active];

              if (item) {
                activate(item);
              }
            }
          }}
          className="h-14 min-w-0 flex-1 bg-transparent text-[16px] text-text-primary placeholder:text-text-muted focus:outline-none sm:h-12 sm:text-body"
        />
      </div>

      <div
        id={LISTBOX_ID}
        role="listbox"
        aria-label="Search results"
        className="hl-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        {sections.map((section) => (
          <div
            key={section.key}
            role="group"
            aria-label={section.label}
            className="pb-2"
          >
            <div className="flex items-center justify-between px-2 pb-1 pt-2">
              <p className="font-mono text-system uppercase text-text-muted">
                {section.label}
              </p>
              {section.key === "recent" && recentsUserId ? (
                <button
                  type="button"
                  onClick={() => {
                    clearRecents(getBrowserStorage(), recentsUserId);
                    setRecents([]);
                  }}
                  className="rounded-control px-2 py-1 text-label text-text-secondary underline underline-offset-4 hover:text-text-primary"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {section.items.map((item) => {
              runningIndex += 1;

              const index = runningIndex;
              const selected = index === active;

              return (
                <button
                  key={item.id}
                  id={optionId(index)}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => activate(item)}
                  onMouseMove={() => setActiveIndex(index)}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-control px-3 py-2 text-left transition-colors",
                    selected ? "bg-surface-elevated" : "hover:bg-surface-secondary",
                  )}
                >
                  <ItemIcon kind={item.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-meta font-medium text-text-primary">
                      <Highlighted text={item.title} query={typed ?? ""} />
                    </span>
                    {item.subtitle ? (
                      <span className="block truncate text-label text-text-muted">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                  {selected ? (
                    <CornerDownLeft
                      aria-hidden="true"
                      className="hidden size-3.5 shrink-0 text-text-muted sm:block"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}

        {typed && (waiting || status === "loading") && sections.length === 0 ? (
          <p className="px-3 py-8 text-center text-meta text-text-muted">
            Searching…
          </p>
        ) : null}

        {status === "error" && typed && !waiting ? (
          <p role="alert" className="px-3 py-4 text-center text-meta text-text-muted">
            Search is unavailable right now. Pages and actions still work.
          </p>
        ) : null}

        {showEmpty ? (
          <p className="px-3 py-8 text-center text-meta text-text-muted">
            Nothing found for &ldquo;{typed}&rdquo;. Try a company, job title or a
            document type like &ldquo;cover letter&rdquo;.
          </p>
        ) : null}
      </div>

      <p aria-live="polite" role="status" className="sr-only">
        {statusMessage()}
      </p>

      <div className="hidden shrink-0 items-center justify-between border-t border-border px-4 py-2 font-mono text-system text-text-muted sm:flex">
        <span>↑↓ to move · Enter to open · Esc to close</span>
      </div>
    </div>
  );
}

export function SearchPalette({
  open,
  onOpenChange,
  commands,
  recentsUserId,
  cache,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  recentsUserId: string | null;
  cache: ResultCache<SearchResponse>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby="global-search-description"
        className="left-0 top-0 h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 p-0 sm:left-1/2 sm:top-[12vh] sm:h-auto sm:max-h-[70vh] sm:w-[calc(100%-2rem)] sm:max-w-xl sm:-translate-x-1/2 sm:translate-y-0 sm:rounded-card sm:border sm:border-border"
      >
        <DialogTitle className="sr-only">Search HireLens</DialogTitle>
        <DialogDescription id="global-search-description" className="sr-only">
          Search your resumes, saved jobs and documents, or jump to a page or
          setting.
        </DialogDescription>
        <div className="flex h-dvh min-h-0 flex-col sm:h-auto sm:max-h-[70vh]">
          <PaletteBody
            commands={commands}
            recentsUserId={recentsUserId}
            cache={cache}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
