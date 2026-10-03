import { SEARCH_DEBOUNCE_MS } from "@/lib/search/constants";
import { createDebouncer } from "@/lib/search/debounce";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("createDebouncer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses a 300 ms delay by default in the shared constant", () => {
    expect(SEARCH_DEBOUNCE_MS).toBe(300);
  });

  it("does not run before the delay elapses", () => {
    const run = vi.fn();
    const debouncer = createDebouncer(run, 300);

    debouncer.schedule("a");
    vi.advanceTimersByTime(299);

    expect(run).not.toHaveBeenCalled();
  });

  it("runs once with the value after the delay", () => {
    const run = vi.fn();
    const debouncer = createDebouncer(run, 300);

    debouncer.schedule("a");
    vi.advanceTimersByTime(300);

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith("a");
  });

  it("collapses a burst of keystrokes into one call with the last value", () => {
    const run = vi.fn();
    const debouncer = createDebouncer(run, 300);

    for (const value of ["s", "so", "sof", "soft"]) {
      debouncer.schedule(value);
      vi.advanceTimersByTime(100);
    }

    vi.advanceTimersByTime(300);

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith("soft");
  });

  it("restarts the wait on every keystroke", () => {
    const run = vi.fn();
    const debouncer = createDebouncer(run, 300);

    debouncer.schedule("a");
    vi.advanceTimersByTime(250);
    debouncer.schedule("ab");
    vi.advanceTimersByTime(250);

    expect(run).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);

    expect(run).toHaveBeenCalledWith("ab");
  });

  it("fires again for a later, separate burst", () => {
    const run = vi.fn();
    const debouncer = createDebouncer(run, 300);

    debouncer.schedule("one");
    vi.advanceTimersByTime(300);
    debouncer.schedule("two");
    vi.advanceTimersByTime(300);

    expect(run.mock.calls).toEqual([["one"], ["two"]]);
  });

  it("flush runs immediately and drops the pending timer", () => {
    const run = vi.fn();
    const debouncer = createDebouncer(run, 300);

    debouncer.schedule("a");
    debouncer.flush("ab");
    vi.advanceTimersByTime(1000);

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith("ab");
  });

  it("cancel prevents the pending run", () => {
    const run = vi.fn();
    const debouncer = createDebouncer(run, 300);

    debouncer.schedule("a");
    debouncer.cancel();
    vi.advanceTimersByTime(1000);

    expect(run).not.toHaveBeenCalled();
  });

  it("reports whether a run is pending", () => {
    const debouncer = createDebouncer(vi.fn(), 300);

    expect(debouncer.isPending()).toBe(false);
    debouncer.schedule("a");
    expect(debouncer.isPending()).toBe(true);
    vi.advanceTimersByTime(300);
    expect(debouncer.isPending()).toBe(false);
  });

  it("cancel is safe when nothing is pending", () => {
    const debouncer = createDebouncer(vi.fn(), 300);

    expect(() => debouncer.cancel()).not.toThrow();
  });
});
