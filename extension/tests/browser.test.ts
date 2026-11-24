import { readFileSync } from "node:fs";
import { chromium, type Browser, type Page } from "playwright-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { APPLY_URL, PROJECT_ANSWER, applicationForm, fillData, postingPage, resumeBase64 } from "./fixtures";

const contentScript = readFileSync("dist/content.js", "utf8");
const connectScript = readFileSync("dist/connect.js", "utf8");

type Summary = {
  filled: number;
  written: number;
  missing: string[];
  resumeAttached: boolean;
  coverLetterAttached: boolean;
  tailored: boolean;
  match: { before: number | null; after: number | null; gaps: string[] } | null;
  notes: string[];
};
type Sent = { type: string; [key: string]: unknown };

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

function chromeStub(replies: Record<string, unknown>, settings?: Record<string, unknown>) {
  return `window.hirelensRequests = [];
  const replies = ${JSON.stringify(replies)};
  const next = (type) => {
    const queue = replies[type];
    if (!Array.isArray(queue)) return queue;
    return queue.length > 1 ? queue.shift() : queue[0];
  };
  window.chrome = {
    runtime: {
      id: "hirelens-test",
      sendMessage: async (request) => {
        window.hirelensRequests.push(request);
        return next(request.type) ?? { ok: false, message: "unexpected" };
      },
      onMessage: { addListener: (listener) => { window.hirelensListener = listener; } },
    },
    storage: { local: { get: async () => (${JSON.stringify(settings ? { settings } : {})}) } },
  };`;
}

const answer = (answers: { id: string; answer: string }[]) => ({ ok: true, value: { ok: true, answers } });
const data = (overrides: Record<string, unknown> = {}) => ({ ok: true, value: { ...fillData, ...overrides } });
const baseReplies = {
  "fill-data": data(),
  pdf: { ok: true, value: resumeBase64 },
  answers: answer([{ id: "#project", answer: PROJECT_ANSWER }]),
};

async function openPage(html: string, replies: Record<string, unknown>, settings?: Record<string, unknown>, url = APPLY_URL) {
  const page = await browser!.newPage();

  await page.route(`${new URL(url).origin}/**`, (route) => route.fulfill({ contentType: "text/html", body: html }));
  await page.addInitScript(chromeStub(replies, settings));
  await page.goto(url);
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
  ) as Promise<{ ok: boolean; value: Summary }>;

const sent = (page: Page, type: string) =>
  page.evaluate(
    (kind) => (window as unknown as { hirelensRequests: Sent[] }).hirelensRequests.filter((request) => request.type === kind),
    type,
  );

describe.skipIf(!browser)("the extension on a real application form", () => {
  let page: Page;

  beforeAll(async () => {
    page = await openPage(applicationForm, baseReplies);
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

  it("attaches the tailored resume and the cover letter as PDFs", async () => {
    const reply = await fill(page);
    const files = await page.evaluate(() =>
      ["#resume", "#letter"].map((selector) => {
        const file = document.querySelector<HTMLInputElement>(selector)!.files?.[0];

        return { name: file?.name, type: file?.type };
      }),
    );

    expect(files).toEqual([
      { name: "Ada-Lovelace-Resume.pdf", type: "application/pdf" },
      { name: "Ada-Lovelace-Cover-Letter.pdf", type: "application/pdf" },
    ]);
    expect(reply.value.tailored).toBe(true);
  });

  it("asks the AI only about open questions and marks its answers for review", async () => {
    const [request] = await sent(page, "answers");
    const ids = (request.body as { questions: { id: string }[] }).questions.map((question) => question.id);

    expect(ids).toEqual(["#project", "#color"]);
    expect(await page.inputValue("#project")).toBe(PROJECT_ANSWER);
    expect(await page.getAttribute("#project", "data-hirelens-ai")).toBe("true");
  });

  it("does not spend the AI allowance twice on the same questions", async () => {
    await fill(page);

    expect(await sent(page, "answers")).toHaveLength(1);
  });

  it("skips resume improvement when the match is already 85% or more", async () => {
    expect(await sent(page, "boost")).toHaveLength(0);
  });

  it("leaves sensitive questions blank and highlights required ones nobody could answer", async () => {
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

describe.skipIf(!browser)("improving a weak resume before applying", () => {
  it("refines the resume until it reaches 90% and reports the change", async () => {
    const page = await openPage(applicationForm, {
      ...baseReplies,
      "fill-data": data({ match: { score: 70, analyzed: true } }),
      boost: [
        { ok: true, value: { ok: true, score: 84, previousScore: 70, finished: false, gaps: [] } },
        { ok: true, value: { ok: true, score: 91, previousScore: 84, finished: true, gaps: [] } },
      ],
    });
    const reply = await fill(page);

    expect(reply.value.match).toEqual({ before: 70, after: 91, gaps: [] });
    expect(await sent(page, "boost")).toHaveLength(2);
    expect(await page.textContent("#hirelens-fill-badge")).toContain("resume match 70% → 91%");
  });

  it("falls back to the current resume when the AI allowance is used up", async () => {
    const page = await openPage(applicationForm, {
      ...baseReplies,
      "fill-data": data({ match: { score: 70, analyzed: true } }),
      boost: { ok: true, value: { ok: false, limited: true, message: "Limit reached." } },
    });
    const reply = await fill(page);

    expect(reply.value.match).toEqual({ before: 70, after: 70, gaps: [] });
    expect(reply.value.notes[0]).toContain("allowance for today is used up");
    expect(reply.value.resumeAttached).toBe(true);
  });

  it("does nothing with AI when both options are switched off", async () => {
    const page = await openPage(
      applicationForm,
      { ...baseReplies, "fill-data": data({ match: { score: 40, analyzed: true } }) },
      { improveResume: false, writeAnswers: false },
    );
    const reply = await fill(page);

    expect(reply.value.written).toBe(0);
    expect(await sent(page, "boost")).toHaveLength(0);
    expect(await sent(page, "answers")).toHaveLength(0);
  });
});

describe.skipIf(!browser)("applying to a job that is not in HireLens yet", () => {
  it("saves the posting, links it and answers with that job in mind", async () => {
    const linked = { publicId: "app-2", title: "Platform Engineer", company: "Globex" };
    const page = await openPage(
      postingPage,
      {
        ...baseReplies,
        "fill-data": [
          data({ application: null, match: { score: null, analyzed: false }, coverLetterPath: null }),
          data({ application: linked, match: { score: 88, analyzed: true }, coverLetterPath: null }),
        ],
        import: { ok: true, value: { ok: true, applicationPublicId: "app-2", created: true } },
        answers: answer([{ id: "#motivation", answer: "Globex runs the platforms I love building." }]),
      },
      undefined,
      "https://careers.globex.test/jobs/7",
    );
    const reply = await fill(page);
    const [imported] = await sent(page, "import");
    const [answers] = await sent(page, "answers");

    expect((imported.page as { title: string; text: string }).title).toBe("Platform Engineer at Globex");
    expect((imported.page as { text: string }).text).toContain("Kubernetes");
    expect(answers.body).toMatchObject({ applicationPublicId: "app-2", pageText: "" });
    expect(await page.inputValue("#name")).toBe("Ada Lovelace");
    expect(await page.inputValue("#motivation")).toBe("Globex runs the platforms I love building.");
    expect(reply.value.match).toEqual({ before: 88, after: 88, gaps: [] });
    expect(await sent(page, "boost")).toHaveLength(0);
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

describe.skipIf(!browser)("writing answers with the Claude subscription", () => {
  const claudeSettings = { improveResume: true, writeAnswers: true };

  it("uses Claude through the helper and never touches the Gemini allowance", async () => {
    const page = await openPage(
      applicationForm,
      { ...baseReplies, "claude-answers": answer([{ id: "#project", answer: "Written by Claude." }]) },
      { ...claudeSettings, writer: "claude" },
    );
    const reply = await fill(page);

    expect(await page.inputValue("#project")).toBe("Written by Claude.");
    expect(await sent(page, "answers")).toHaveLength(0);
    expect(reply.value.notes).toEqual([]);
  });

  it("falls back to Gemini when the helper is not installed", async () => {
    const page = await openPage(
      applicationForm,
      { ...baseReplies, "claude-answers": { ok: false, message: "The Claude helper is not installed on this computer." } },
      { ...claudeSettings, writer: "claude" },
    );
    const reply = await fill(page);

    expect(await page.inputValue("#project")).toBe(PROJECT_ANSWER);
    expect(reply.value.notes[0]).toContain("Claude was not available");
  });
});
