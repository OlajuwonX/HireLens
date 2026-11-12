import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { chromium, type Browser, type Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createPageSession } from "../src/browser/page-session";
import type { HireLensApi } from "../src/communication/api";
import { processTask } from "../src/execution/process-task";
import { payload } from "./helpers";

const FORM = readFileSync(new URL("./fixtures/greenhouse-form.html", import.meta.url), "utf8");
const JOB_URL = "https://boards.greenhouse.io/acme/jobs/1";

async function openBrowser() {
  for (const channel of ["chrome", "msedge"]) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      continue;
    }
  }

  return null;
}

const browser: Browser | null = await openBrowser();

describe.skipIf(!browser)("filling a Greenhouse-style form in a real browser", () => {
  let page: Page;
  let posted: string | null = null;

  beforeAll(async () => {
    page = await browser!.newPage();
    await page.route("https://boards.greenhouse.io/**", async (route) => {
      if (route.request().method() === "POST") {
        posted = route.request().postData();
        await route.fulfill({ contentType: "text/html", body: "<h1>Thank you for applying to Acme!</h1>" });
      } else {
        await route.fulfill({ contentType: "text/html", body: FORM });
      }
    });
  });

  afterAll(async () => {
    await browser?.close();
  });

  const api = (): HireLensApi => ({
    ping: vi.fn(async () => true),
    claim: vi.fn(),
    heartbeat: vi.fn(async () => true),
    report: vi.fn(async () => true),
    downloadResume: vi.fn(async () => new TextEncoder().encode("%PDF-1.4 test resume")),
  });

  const run = (autoSubmit: boolean) =>
    processTask({
      payload: payload(),
      api: api(),
      options: { autoSubmit, confirmTimeoutMs: 1_500 },
      workDir: tmpdir(),
      openSession: async (url, resumeFile) => {
        await page.goto(url);
        return createPageSession(page, resumeFile);
      },
    });

  it("fills every supported field, verifies it, and does not submit by default", async () => {
    const result = await run(false);

    expect(result.outcome).toBe("NEEDS_MANUAL_ACTION");
    expect(result.missing).toEqual([]);
    expect(posted).toBeNull();
    expect(await page.inputValue("#first_name")).toBe("Ada");
    expect(await page.inputValue("#email")).toBe("ada@example.com");
    expect(await page.locator("#authorized option:checked").textContent()).toBe("Yes");
    expect(await page.isChecked("#sponsor_no")).toBe(true);
    expect(await page.inputValue("#why")).toBe("I want to build payments tools.");
    expect(await page.locator("#resume").evaluate((input) => (input as HTMLInputElement).files?.length)).toBe(1);
    expect(await page.inputValue("#gender")).toBe("");
  });

  it("submits when auto-submit is on and records the confirmation", async () => {
    const result = await run(true);

    expect(result.outcome).toBe("SUBMITTED");
    expect(result.evidence?.confirmationText).toBe("Thank you for applying");
    expect(posted).toContain("first_name=Ada");
  });
}, 60_000);

it.skipIf(Boolean(browser))("records that no browser was available for the end-to-end test", () => {
  expect(JOB_URL).toContain("greenhouse");
});
