import { join } from "node:path";
import { chromium, type BrowserContext } from "playwright-core";

const CHANNELS = ["chrome", "msedge"] as const;

export async function launchBrowser(preferred: (typeof CHANNELS)[number], headless = false): Promise<BrowserContext> {
  const order = [preferred, ...CHANNELS.filter((channel) => channel !== preferred)];
  const errors: string[] = [];

  for (const channel of order) {
    try {
      return await chromium.launchPersistentContext(join(process.cwd(), ".browser-profile"), {
        channel,
        headless,
        viewport: null,
      });
    } catch (error) {
      errors.push(`${channel}: ${error instanceof Error ? error.message.split("\n")[0] : "failed"}`);
    }
  }

  throw new Error(`Could not open Chrome or Edge.\n${errors.join("\n")}`);
}
