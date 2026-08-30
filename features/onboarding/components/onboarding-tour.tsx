"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { completeOnboardingAction } from "../actions/onboarding-actions";
import { ONBOARDING_STEPS, type OnboardingProgress } from "../constants";

const ACTIVE_KEY = "hirelens-onboarding-active";
const GREETED_KEY = "hirelens-onboarding-greeted";
const FIRST_STEP_DELAY_MS = 2000;
const BUBBLE_WIDTH = 320;
const GAP = 12;
const FLOATING_QUERY = "(min-width: 640px)";
const OPEN_MODAL_SELECTOR =
  '[role="dialog"][data-state="open"], [role="dialog"][aria-modal="true"]';

type AnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function safeStorage(kind: "local" | "session") {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readFlag(store: Storage | null, key: string) {
  try {
    return store?.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(store: Storage | null, key: string, value: boolean) {
  try {
    if (value) {
      store?.setItem(key, "1");
      return;
    }

    store?.removeItem(key);
  } catch {
    return;
  }
}

function sameRect(a: AnchorRect | null, b: AnchorRect) {
  return (
    a !== null &&
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height
  );
}

function scrollableAncestor(element: HTMLElement) {
  let node = element.parentElement;

  while (node) {
    const overflowY = window.getComputedStyle(node).overflowY;

    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }

    node = node.parentElement;
  }

  return null;
}

function revealAnchor(anchor: HTMLElement, bias: number) {
  const container = scrollableAncestor(anchor);

  if (!container) {
    return false;
  }

  const containerBox = container.getBoundingClientRect();
  const anchorBox = anchor.getBoundingClientRect();
  const offset = anchorBox.top - containerBox.top;
  const room = container.clientHeight - anchorBox.height;
  const target = container.scrollTop + offset - room * bias;
  const next = Math.max(
    0,
    Math.min(target, container.scrollHeight - container.clientHeight),
  );

  if (Math.abs(next - container.scrollTop) < 1) {
    return false;
  }

  container.scrollTop = next;
  return true;
}

function bubblePosition(rect: AnchorRect, height: number) {
  const viewport = window.innerHeight;
  const below = rect.top + rect.height + GAP;
  const above = rect.top - GAP - height;
  const highest = GAP;
  const lowest = Math.max(GAP, viewport - height - GAP);

  const top =
    below <= lowest ? below : above >= highest ? above : Math.max(highest, lowest);

  return {
    top,
    left: Math.min(
      Math.max(GAP, rect.left + rect.width / 2 - BUBBLE_WIDTH / 2),
      Math.max(GAP, window.innerWidth - BUBBLE_WIDTH - GAP),
    ),
  };
}

export function OnboardingTour({ progress }: { progress: OnboardingProgress }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [floating, setFloating] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [hiddenFor, setHiddenFor] = useState<string | null>(null);
  const [rect, setRect] = useState<AnchorRect | null>(null);
  const [bubbleHeight, setBubbleHeight] = useState(0);
  const [, startTransition] = useTransition();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const scrolledRef = useRef<string | null>(null);
  const titleId = useId();
  const bodyId = useId();

  const { hasResumeVersion, hasApplication, hasDocument } = progress;

  useEffect(() => {
    const query = window.matchMedia(FLOATING_QUERY);
    const sync = () => setFloating(query.matches);

    sync();
    query.addEventListener("change", sync);

    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!running) {
      return;
    }

    const session = safeStorage("session");

    if (readFlag(session, GREETED_KEY)) {
      setReady(true);
      return;
    }

    const timer = window.setTimeout(() => {
      writeFlag(session, GREETED_KEY, true);
      setReady(true);
    }, FIRST_STEP_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [running]);

  useEffect(() => {
    setCursor(0);
    setHiddenFor(null);
  }, [pathname]);

  const finish = useCallback(() => {
    if (finishedRef.current) {
      return;
    }

    finishedRef.current = true;
    writeFlag(safeStorage("local"), ACTIVE_KEY, false);
    setRunning(false);

    startTransition(async () => {
      await completeOnboardingAction();
    });
  }, []);

  useEffect(() => {
    setMounted(true);

    const local = safeStorage("local");
    const isNewAccount = !hasResumeVersion && !hasApplication && !hasDocument;

    if (!isNewAccount && !readFlag(local, ACTIVE_KEY)) {
      finish();
      return;
    }

    writeFlag(local, ACTIVE_KEY, true);
    setRunning(true);
  }, [hasResumeVersion, hasApplication, hasDocument, finish]);

  useEffect(() => {
    if (running && hasDocument) {
      finish();
    }
  }, [running, hasDocument, finish]);

  const candidates = useMemo(
    () =>
      ONBOARDING_STEPS.filter(
        (step) => step.route === pathname && !step.isDone(progress),
      ),
    [pathname, progress],
  );

  const step =
    candidates.length > 0
      ? candidates[Math.min(cursor, candidates.length - 1)]
      : null;

  const measuring = running && ready && step !== null;

  useEffect(() => {
    setBubbleHeight(0);
  }, [step?.id, floating]);

  useEffect(() => {
    if (!measuring || !step) {
      setRect((current) => (current === null ? current : null));
      return;
    }

    let frame = 0;

    const schedule = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(measure);
    };

    function measure() {
      frame = 0;

      const anchor = step!.anchors
        .map((name) =>
          document.querySelector<HTMLElement>(
            "[data-onboarding=" + JSON.stringify(name) + "]",
          ),
        )
        .find(
          (element): element is HTMLElement =>
            element !== null && element.offsetParent !== null,
        );

      if (!anchor) {
        setRect((current) => (current === null ? current : null));
        return;
      }

      const modal = document.querySelector<HTMLElement>(OPEN_MODAL_SELECTOR);

      if (modal && !modal.contains(anchor)) {
        setRect((current) => (current === null ? current : null));
        return;
      }

      const box = anchor.getBoundingClientRect();

      if (
        scrolledRef.current !== step!.id &&
        (box.top < GAP || box.bottom > window.innerHeight - GAP)
      ) {
        scrolledRef.current = step!.id;

        if (revealAnchor(anchor, floating ? 0.5 : 0.3)) {
          schedule();
          return;
        }
      }

      scrolledRef.current = step!.id;

      const next = {
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
      };

      setRect((current) => (sameRect(current, next) ? current : next));
    }

    measure();

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      observer.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [measuring, step, floating]);

  const visible =
    mounted &&
    measuring &&
    step !== null &&
    rect !== null &&
    hiddenFor !== step.id;

  useEffect(() => {
    const node = bubbleRef.current;

    if (!node) {
      return;
    }

    const sync = () => {
      const next = Math.round(node.getBoundingClientRect().height);

      setBubbleHeight((current) => (current === next ? current : next));
    };

    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(node);

    return () => observer.disconnect();
  }, [visible, step, floating]);

  useEffect(() => {
    if (!visible || !step) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setHiddenFor(step.id);
    };

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, step]);

  if (!visible || !step || !rect) {
    return null;
  }

  const position = floating ? bubblePosition(rect, bubbleHeight) : null;
  const isLast = cursor >= candidates.length - 1;
  const number = ONBOARDING_STEPS.findIndex((item) => item.id === step.id) + 1;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <div
        aria-hidden="true"
        style={{
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
        }}
        className="absolute rounded-card shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] ring-2 ring-accent"
      />

      <div
        ref={bubbleRef}
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        style={
          position
            ? { ...position, visibility: bubbleHeight ? undefined : "hidden" }
            : undefined
        }
        className={cn(
          "pointer-events-auto space-y-3 rounded-card border border-border bg-surface p-4 shadow-xl",
          "hl-scroll overflow-y-auto",
          floating
            ? "absolute max-h-[calc(100dvh-1.5rem)] w-80"
            : "fixed inset-x-3 bottom-3 max-h-[60dvh]",
        )}
      >
        <p className="font-mono text-system uppercase text-text-muted">
          Step {number} of {ONBOARDING_STEPS.length}
        </p>

        <div className="space-y-1.5">
          <h2
            id={titleId}
            className="text-section-title font-semibold text-text-primary"
          >
            {step.title}
          </h2>
          <p id={bodyId} className="text-meta text-text-secondary">
            {step.body}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button type="button" variant="ghost" size="compact" onClick={finish}>
            Skip tour
          </Button>

          <Button
            type="button"
            size="compact"
            onClick={() => {
              if (isLast) {
                setHiddenFor(step.id);
                return;
              }

              setCursor((current) => current + 1);
            }}
          >
            {isLast ? "Got it" : "Next"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
