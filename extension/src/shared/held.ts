import type { HeldDescription } from "./job-posting";

const KEY = "heldDescription";

export async function readHeld(): Promise<HeldDescription | null> {
  try {
    return ((await chrome.storage.session.get(KEY))[KEY] as HeldDescription | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function saveHeld(held: HeldDescription) {
  await chrome.storage.session.set({ [KEY]: held });
}

export async function releaseHeld() {
  await chrome.storage.session.remove(KEY);
}
