import { normalizeOrigin, originPattern } from "../shared/connection";

const SCRIPT_ID = "hirelens-connect";
const LAST_ORIGIN = "lastOrigin";

export async function lastOrigin() {
  const stored = await chrome.storage.local.get(LAST_ORIGIN);

  return (stored[LAST_ORIGIN] as string | undefined) ?? "";
}

export async function startConnect(input: string) {
  const origin = normalizeOrigin(input);

  if (!origin) {
    throw new Error("Enter the address you open HireLens at, for example https://your-app.vercel.app");
  }

  if (!(await chrome.permissions.request({ origins: [originPattern(origin)] }))) {
    throw new Error("HireLens needs permission to reach that address.");
  }

  await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] }).catch(() => undefined);
  await chrome.scripting.registerContentScripts([
    { id: SCRIPT_ID, matches: [`${origin}/settings/extension*`], js: ["connect.js"], runAt: "document_idle" },
  ]);
  await chrome.storage.local.set({ [LAST_ORIGIN]: origin });
  await chrome.tabs.create({ url: `${origin}/settings/extension?connect=1` });
}
