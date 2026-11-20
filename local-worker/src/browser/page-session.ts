import type { Page } from "playwright-core";
import type { FormSession } from "../execution/session";
import { detectCaptcha, detectConfirmation } from "../verification/confirmation";
import { applyFill, readValue } from "./fill";
import { inspectForm } from "./inspect";

const SUBMIT = 'button[type="submit"], input[type="submit"], button:has-text("Submit application"), button:has-text("Submit")';
const POLL_MS = 2_000;

export function createPageSession(page: Page, resumeFile: string): FormSession {
  let submitAttempted = false;

  page.on("request", (request) => {
    if (request.method() === "POST" && ["document", "xhr", "fetch"].includes(request.resourceType())) {
      submitAttempted = true;
    }
  });

  const confirmation = async () =>
    detectConfirmation({ url: page.url(), text: await page.locator("body").innerText().catch(() => "") });

  return {
    hasCaptcha: async () => detectCaptcha({ html: await page.content() }),
    fields: () => inspectForm(page),
    fill: (fill) => applyFill(page, fill, resumeFile).catch(() => false),
    read: (fill) => readValue(page, fill).catch(() => ""),
    submit: async () => {
      submitAttempted = true;
      await page.locator(SUBMIT).first().click();
    },
    waitForOutcome: async (timeoutMs) => {
      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline && !page.isClosed()) {
        const found = await confirmation();

        if (found) {
          return { confirmation: found, submitAttempted };
        }

        await page.waitForTimeout(POLL_MS).catch(() => undefined);
      }

      return { confirmation: page.isClosed() ? null : await confirmation(), submitAttempted };
    },
    submitAttempted: () => submitAttempted,
    close: () => page.close().catch(() => undefined),
  };
}
