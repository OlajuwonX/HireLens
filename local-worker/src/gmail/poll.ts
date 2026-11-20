import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { HireLensApi } from "../communication/api";
import type { GmailApi } from "./client";
import { isRelevant } from "./filter";
import { parseMessage, type ParsedEmail } from "./parse";

export const STATE_FILE = join(process.cwd(), ".gmail-state.json");
const MAX_SEEN = 1_000;
const BATCH = 25;

export async function loadSeen(file = STATE_FILE) {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as { seen?: unknown };

    return Array.isArray(parsed.seen) ? parsed.seen.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export async function pollEmails(input: {
  gmail: GmailApi;
  api: Pick<HireLensApi, "emailWatch" | "sendEmails">;
  stateFile?: string;
}) {
  const seen = await loadSeen(input.stateFile);
  const known = new Set(seen);
  const ids = (await input.gmail.listIds()).filter((id) => !known.has(id));

  if (ids.length === 0) {
    return { checked: 0, sent: 0 };
  }

  const watch = await input.api.emailWatch();
  const relevant: ParsedEmail[] = [];

  for (const id of ids) {
    const email = parseMessage(await input.gmail.get(id));

    if (isRelevant(email, watch)) {
      relevant.push(email);
    }
  }

  for (let start = 0; start < relevant.length; start += BATCH) {
    await input.api.sendEmails(relevant.slice(start, start + BATCH));
  }

  await writeFile(input.stateFile ?? STATE_FILE, JSON.stringify({ seen: [...ids, ...seen].slice(0, MAX_SEEN) }), "utf8");

  return { checked: ids.length, sent: relevant.length };
}
