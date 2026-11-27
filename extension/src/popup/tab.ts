import type { FillSummary, Reply } from "../shared/types";

async function activeTabId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab.url?.startsWith("http")) {
    throw new Error("Open a job application page first.");
  }

  return tab.id;
}

async function ensureContentScript(tabId: number) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "ping" });
  } catch {
    await chrome.scripting
      .executeScript({ target: { tabId, allFrames: true }, files: ["content.js"] })
      .catch(() => chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] }));
  }
}

export async function fillActiveTab(): Promise<FillSummary> {
  const tabId = await activeTabId();

  await ensureContentScript(tabId);

  const reply = (await chrome.tabs.sendMessage(tabId, { type: "fill" })) as Reply<FillSummary> | undefined;

  if (!reply) {
    throw new Error("No application form was found on this page.");
  }

  if (!reply.ok) {
    throw new Error(reply.message);
  }

  return reply.value;
}
