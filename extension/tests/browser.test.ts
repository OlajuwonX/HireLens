import { readFileSync } from "node:fs";
import { chromium, type Browser, type Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { APPLY_URL, applicationForm, fillData, resumeBase64 } from "./fixtures";

const contentScript = readFileSync("dist/content.js", "utf8");
const connectScript = readFileSync("dist/connect.js", "utf8");

async function openBrowser() {
  for (const channel of ["msedge", "chrome"]) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      continue;
    }
  }

  return null;
}

const browser: Browser | null = await openBrowser();

afterAll(async () => {
  await browser?.close();
});

function chromeStub(replies: Record<string, unknown>) {
  return `window.chrome = {
    runtime: {
      id: "hirelens-test",
      sendMessage: async (request) => (${JSON.stringify(replies)})[request.type] ?? { ok: false, message: "unexpected" },
      onMessage: { addListener: (listener) => { window.hirelensListener = listener; } },
    },
  };`;
}

async function openForm(html: string) {
  const page = await browser!.newPage();

  await page.route("https://jobs.example.test/**", (route) => route.fulfill({ contentType: "text/html", body: html }));
  await page.addInitScript(chromeStub({ "fill-data": { ok: true, value: fillData }, resume: { ok: true, value: resumeBase64 } }));
  await page.goto(APPLY_URL);
  await page.addScriptTag({ content: contentScript });

  return page;
}

const fill = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<unknown>((resolve) =>
        (window as unknown as { hirelensListener: (request: unknown, sender: unknown, respond: (value: unknown) => void) => void })
          .hirelensListener({ type: "fill" }, {}, resolve),
      ),
  ) as Promise<{ ok: boolean; value: { filled: number; missing: string[]; resumeAttached: boolean; tailored: boolean } }>;

describe.skipIf(!browser)("the extension on a real application form", () => {
  let page: Page;

  beforeAll(async () => {
    page = await openForm(applicationForm);
  });

  it("fills profile fields, saved answers and choices", async () => {
    const reply = await fill(page);

    expect(reply.ok).toBe(true);
    expect(await page.inputValue("#first")).toBe("Ada");
    expect(await page.inputValue("#last")).toBe("Lovelace");
    expect(await page.inputValue("#phone")).toBe("+44 7700 900123");
    expect(await page.inputValue("#linkedin")).toBe("https://linkedin.com/in/ada");
    expect(await page.inputValue("#sponsor")).toBe("n");
    expect(await page.isChecked("#rel-yes")).toBe(true);
    expect(await page.inputValue("#why")).toBe("I want to build tools engineers love.");
  });

  it("types the way a person does so React forms register the value", async () => {
    expect(await page.evaluate(() => (window as unknown as { reactSeen: string[] }).reactSeen)).toContain("Ada");
  });

  it("never overwrites what is already in a field", async () => {
    expect(await page.inputValue("#email")).toBe("kept@example.com");
  });

  it("attaches the tailored resume as a PDF", async () => {
    const reply = await fill(page);
    const file = await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>("#resume")!;

      return { name: input.files?.[0]?.name, type: input.files?.[0]?.type };
    });

    expect(file).toEqual({ name: "Ada-Lovelace-Resume.pdf", type: "application/pdf" });
    expect(reply.value.tailored).toBe(true);
  });

  it("leaves sensitive questions blank and highlights required ones it cannot answer", async () => {
    const reply = await fill(page);

    expect(await page.inputValue("#gender")).toBe("");
    expect(reply.value.missing).toContain("Favourite colour");
    expect(await page.getAttribute("#color", "data-hirelens-missing")).toBe("true");
  });

  it("fills the next page by itself after the user selects Next", async () => {
    await page.click("#next");

    await expect.poll(() => page.inputValue("#city"), { timeout: 5_000 }).toBe("London");
    await expect.poll(() => page.inputValue("#notice").catch(() => ""), { timeout: 5_000 }).toBe("4 weeks");
  });
});

describe.skipIf(!browser)("connecting from the HireLens settings page", () => {
  it("passes the token to the extension and tells the page it is connected", async () => {
    const page = await browser!.newPage();
    const settings = "https://hirelens.example.test/settings/extension?connect=1";

    await page.route("https://hirelens.example.test/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<script>window.events = []; addEventListener('message', (e) => e.data.source === 'hirelens-extension' && events.push(e.data.type));</script>",
      }),
    );
    await page.addInitScript(chromeStub({ "save-connection": { ok: true, value: true } }));
    await page.goto(settings);
    await page.addScriptTag({ content: connectScript });
    await page.evaluate(() =>
      window.postMessage({ source: "hirelens", type: "extension-token", token: "hlw_test", bypass: null }, location.origin),
    );

    await expect
      .poll(() => page.evaluate(() => (window as unknown as { events: string[] }).events))
      .toEqual(["ready", "connected"]);
  });
});

it.skipIf(Boolean(browser))("records that no browser was available for the extension tests", () => {
  expect(browser).toBeNull();
});
