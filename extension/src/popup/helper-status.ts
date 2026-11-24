import { ask } from "../shared/messages";
import type { Writer } from "../shared/settings";

type HelperStatus = { installed: boolean; claude: boolean };

export function describeHelper(status: HelperStatus) {
  if (!status.installed) {
    return "Install the Claude helper once: in the extension folder run pnpm helper:install, then restart the browser. Until then Gemini writes the answers.";
  }

  return status.claude
    ? "Claude helper ready. Answers use your Claude subscription."
    : "The helper is installed, but Claude Code was not found. Install Claude Code and sign in, then run pnpm helper:install again.";
}

export async function showHelperStatus(element: HTMLElement, writer: Writer) {
  element.hidden = writer !== "claude";

  if (writer !== "claude") return;

  element.textContent = "Checking the Claude helper...";

  const reply = await ask<HelperStatus>({ type: "claude-status" });

  element.textContent = reply.ok ? describeHelper(reply.value) : reply.message;
}
