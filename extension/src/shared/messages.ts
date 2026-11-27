import type { Reply, Request } from "./types";

export const PAGE_SOURCE = "hirelens";
export const EXTENSION_SOURCE = "hirelens-extension";

export async function ask<T>(request: Request): Promise<Reply<T>> {
  try {
    return ((await chrome.runtime.sendMessage(request)) as Reply<T>) ?? { ok: false, message: "No answer from HireLens." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "The extension could not respond." };
  }
}

export const ok = <T>(value: T): Reply<T> => ({ ok: true, value });
export const fail = (message: string): Reply<never> => ({ ok: false, message });
