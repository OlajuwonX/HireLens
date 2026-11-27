import { ask, EXTENSION_SOURCE, PAGE_SOURCE } from "../shared/messages";
import type { Connection } from "../shared/types";

const post = (type: string, extra: Record<string, unknown> = {}) =>
  window.postMessage({ source: EXTENSION_SOURCE, type, ...extra }, location.origin);

window.addEventListener("message", async (event: MessageEvent) => {
  const message = event.data as { source?: string; type?: string; token?: string; bypass?: string | null; origin?: string };

  if (event.source !== window || event.origin !== location.origin || message?.source !== PAGE_SOURCE) return;
  if (message.type !== "extension-token" || typeof message.token !== "string") return;

  const connection: Connection = { origin: location.origin, token: message.token, bypass: message.bypass ?? null };
  const reply = await ask<boolean>({ type: "save-connection", connection });

  post(reply.ok ? "connected" : "connect-failed", reply.ok ? {} : { message: reply.message });
});

post("ready");
