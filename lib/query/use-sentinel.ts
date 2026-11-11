"use client";

import { useEffect, useRef } from "react";

export const PREFETCH_MARGIN = "600px";

export function useSentinel(enabled: boolean, onEnter: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef(onEnter);

  useEffect(() => {
    latest.current = onEnter;
  });

  useEffect(() => {
    const sentinel = ref.current;

    if (!sentinel || !enabled) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          latest.current();
        }
      },
      { rootMargin: `${PREFETCH_MARGIN} 0px` },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}
