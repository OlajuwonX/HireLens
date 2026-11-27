import type { Connection } from "./types";

const KEY = "connection";

export async function readConnection(): Promise<Connection | null> {
  const stored = await chrome.storage.local.get(KEY);

  return (stored[KEY] as Connection | undefined) ?? null;
}

export async function saveConnection(connection: Connection) {
  await chrome.storage.local.set({ [KEY]: connection });
}

export async function clearConnection() {
  await chrome.storage.local.remove(KEY);
}

export function normalizeOrigin(value: string) {
  try {
    const url = new URL(value.trim().includes("://") ? value.trim() : `https://${value.trim()}`);

    return url.protocol === "https:" || url.hostname === "localhost" ? url.origin : null;
  } catch {
    return null;
  }
}

export const originPattern = (origin: string) => `${origin}/*`;
