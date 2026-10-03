import { createDraftSync } from "@/lib/search/draft-sync";
import { describe, expect, it } from "vitest";

describe("createDraftSync", () => {
  it("starts with the initial value as committed", () => {
    expect(createDraftSync("abc").lastCommitted()).toBe("abc");
  });

  it("keeps what the user typed when our own commit echoes back", () => {
    const sync = createDraftSync("");

    sync.commit("ab");

    expect(sync.reconcile("abc", "ab")).toBe("abc");
  });

  it("does not drop keystrokes typed while a navigation is in flight", () => {
    const sync = createDraftSync("");

    sync.commit("ab");

    const afterEcho = sync.reconcile("abcd", "ab");

    expect(afterEcho).toBe("abcd");
  });

  it("handles echoes arriving in order after several commits", () => {
    const sync = createDraftSync("");

    sync.commit("a");
    sync.commit("ab");

    expect(sync.reconcile("abc", "a")).toBe("abc");
    expect(sync.reconcile("abc", "ab")).toBe("abc");
  });

  it("does not let an older echo clobber a newer draft", () => {
    const sync = createDraftSync("");

    sync.commit("a");
    sync.commit("ab");

    expect(sync.reconcile("ab", "a")).toBe("ab");
  });

  it("adopts an external change when there is no unsent typing", () => {
    const sync = createDraftSync("react");

    expect(sync.reconcile("react", "")).toBe("");
    expect(sync.lastCommitted()).toBe("");
  });

  it("does not adopt an external change over unsent typing", () => {
    const sync = createDraftSync("react");

    expect(sync.reconcile("reactive", "")).toBe("reactive");
  });

  it("adopts a back-navigation to an earlier value after our commit landed", () => {
    const sync = createDraftSync("");

    sync.commit("ab");
    sync.reconcile("ab", "ab");

    expect(sync.reconcile("ab", "a")).toBe("a");
  });

  it("treats the initial mount reconcile as a no-op", () => {
    const sync = createDraftSync("hello");

    expect(sync.reconcile("hello", "hello")).toBe("hello");
  });

  it("is idempotent when reconcile runs twice with the same arguments", () => {
    const sync = createDraftSync("x");

    const first = sync.reconcile("x", "x");
    const second = sync.reconcile("x", "x");

    expect(first).toBe("x");
    expect(second).toBe("x");
  });

  it("bounds the in-flight history", () => {
    const sync = createDraftSync("");

    for (let index = 0; index < 50; index += 1) {
      sync.commit(`v${index}`);
    }

    expect(sync.lastCommitted()).toBe("v49");
    expect(sync.reconcile("v49", "v49")).toBe("v49");
  });
});
