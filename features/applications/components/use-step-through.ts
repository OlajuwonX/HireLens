"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { directionFor, hasOpenOverlay, isTypingTarget, neighbourId, openHref } from "../step-through";

export function useStepThrough(ids: string[], query: string) {
  const router = useRouter();
  const open = useSearchParams().get("open");

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      const direction = directionFor(event.key);

      if (!direction || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target) || hasOpenOverlay()) {
        return;
      }

      const next = neighbourId(ids, open, direction);

      if (next) {
        event.preventDefault();
        router.replace(openHref(query, next), { scroll: false });
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [ids, open, query, router]);
}
