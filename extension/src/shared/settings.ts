export type Settings = { improveResume: boolean; writeAnswers: boolean };

export const DEFAULT_SETTINGS: Settings = { improveResume: true, writeAnswers: true };

const KEY = "settings";

export async function readSettings(): Promise<Settings> {
  try {
    const stored = (await chrome.storage.local.get(KEY))[KEY] as Partial<Settings> | undefined;

    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings) {
  await chrome.storage.local.set({ [KEY]: settings });
}
