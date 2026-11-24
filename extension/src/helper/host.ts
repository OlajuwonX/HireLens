import { findClaude } from "./claude-path";
import { createMessageReader, encodeMessage } from "./protocol";
import { runClaude } from "./run-claude";

export const HELPER_VERSION = "1.0.0";

export type HostRequest = { type: "ping" } | { type: "complete"; system: string; prompt: string };

type Runner = (path: string, system: string, prompt: string) => Promise<string>;

export async function handleRequest(request: HostRequest, locate: () => string | null = findClaude, run: Runner = runClaude) {
  const path = locate();

  if (request.type === "ping") {
    return { ok: true, version: HELPER_VERSION, claude: Boolean(path) };
  }

  if (!path) {
    return { ok: false, message: "Claude Code was not found on this computer. Install it and sign in with your Claude account." };
  }

  try {
    return { ok: true, text: await run(path, request.system, request.prompt) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message.slice(0, 500) : "Claude could not answer." };
  }
}

function replyAndExit(message: unknown) {
  process.stdout.write(encodeMessage(message), () => process.exit(0));
}

export function startHost() {
  let started = false;
  const read = createMessageReader((message) => {
    started = true;
    void handleRequest(message as HostRequest).then(replyAndExit);
  });

  process.stdin.on("data", (chunk: Buffer) => {
    try {
      read(chunk);
    } catch (error) {
      replyAndExit({ ok: false, message: error instanceof Error ? error.message : "Unreadable message." });
    }
  });
  process.stdin.on("end", () => {
    if (!started) process.exit(0);
  });
}
