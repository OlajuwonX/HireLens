import { parseClaudeAnswers } from "../shared/claude-answers";
import { NATIVE_HOST } from "../shared/native-host";
import type { AnswersBody, Connection } from "../shared/types";
import { fetchAnswersPrompt } from "./api";

export type HelperStatus = { installed: boolean; claude: boolean };

type HostReply = { ok: true; text?: string; claude?: boolean } | { ok: false; message: string };

async function sendToHelper(message: object): Promise<HostReply> {
  return (await chrome.runtime.sendNativeMessage(NATIVE_HOST, message)) as unknown as HostReply;
}

export async function helperStatus(): Promise<HelperStatus> {
  try {
    const reply = await sendToHelper({ type: "ping" });

    return { installed: true, claude: reply.ok && Boolean(reply.claude) };
  } catch {
    return { installed: false, claude: false };
  }
}

export async function answerWithClaude(connection: Connection, body: AnswersBody) {
  const prompt = await fetchAnswersPrompt(connection, body);

  if (!prompt.ok) {
    throw new Error(prompt.message);
  }

  let reply: HostReply;

  try {
    reply = await sendToHelper({ type: "complete", system: prompt.system, prompt: prompt.prompt });
  } catch {
    throw new Error("The Claude helper is not installed on this computer.");
  }

  if (!reply.ok) {
    throw new Error(reply.message);
  }

  return { ok: true as const, answers: parseClaudeAnswers(reply.text ?? "", body.questions) };
}
