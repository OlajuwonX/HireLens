import { setTimeout as wait } from "node:timers/promises";
import { launchBrowser } from "./browser/launch";
import { createPageSession } from "./browser/page-session";
import { createClaudeWriter } from "./claude/writer";
import { createApi } from "./communication/api";
import { readConfig } from "./config";
import { processTask } from "./execution/process-task";

try {
  process.loadEnvFile();
} catch {
  console.log("No .env file found; using environment variables.");
}

const config = readConfig();
const api = createApi({ baseUrl: config.HIRELENS_URL, token: config.HIRELENS_WORKER_TOKEN });

if (!(await api.ping())) {
  console.error("HireLens rejected the worker token. Create a new one in Settings > Local worker.");
  process.exit(1);
}

const browser = await launchBrowser(config.BROWSER_CHANNEL);
let running = true;

process.on("SIGINT", () => {
  running = false;
  console.log("Stopping after the current application.");
});

console.log(`Connected to ${config.HIRELENS_URL}. Waiting for approved applications.`);

while (running) {
  const { task, reason } = await api.claim().catch((error: Error) => {
    console.error(error.message);
    return { task: null, reason: "ERROR" };
  });

  if (!task) {
    if (reason === "DAILY_LIMIT") console.log("Today's application limit is reached.");
    await wait(config.POLL_SECONDS * 1000);
    continue;
  }

  console.log(`Filling: ${task.job.title} at ${task.job.company}`);

  const result = await processTask({
    payload: task,
    api,
    options: {
      autoSubmit: config.AUTO_SUBMIT,
      confirmTimeoutMs: config.CONFIRM_TIMEOUT_MINUTES * 60_000,
      draftAnswer: config.USE_CLAUDE ? createClaudeWriter(task) : undefined,
    },
    openSession: async (url, resumeFile, provider) => {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await provider.prepare(page);

      return createPageSession(page, resumeFile);
    },
  });

  console.log(`${result.outcome}: ${result.reason}`);
}

await browser.close();
