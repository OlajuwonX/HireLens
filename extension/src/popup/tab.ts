import type { HeldDescription } from "../shared/job-posting";
import type { FillSummary, Reply } from "../shared/types";

async function activeTabId(message = "Open a job application page first.") {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab.url?.startsWith("http")) {
    throw new Error(message);
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

export async function captureActiveTab(): Promise<HeldDescription> {
  const tabId = await activeTabId("Open the job description page first.");

  await ensureContentScript(tabId);

  const reply = (await chrome.tabs.sendMessage(tabId, { type: "capture" })) as Reply<HeldDescription> | undefined;

  if (!reply?.ok) {
    throw new Error("HireLens could not read this page.");
  }

  return reply.value;
}
