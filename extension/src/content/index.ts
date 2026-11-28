import type { Request } from "../shared/types";
import { fail, ok } from "../shared/messages";
import { resumeAutoFill, startAutoFill } from "./auto-fill";
import { describeSummary, showBadge } from "./badge";
import { captureDescription } from "./capture";
import { countFields, fillPage } from "./fill-page";

declare global {
  interface Window {
    hirelensContentLoaded?: boolean;
  }
}

async function fillNow() {
  const summary = await fillPage("all", (text) => showBadge(text, true));

  startAutoFill();
  showBadge(describeSummary(summary));

  return summary;
}

if (!window.hirelensContentLoaded) {
  window.hirelensContentLoaded = true;

  chrome.runtime.onMessage.addListener((request: Request, _sender, respond) => {
    if (request.type === "ping") {
      respond(ok(true));
      return false;
    }

    if (request.type === "capture") {
      if (window.top !== window) return false;
      respond(ok(captureDescription()));
      return false;
    }

    if (request.type !== "fill" || countFields() === 0) {
      return false;
    }

    fillNow()
      .then((summary) => respond(ok(summary)))
      .catch((error: Error) => {
        showBadge(error.message);
        respond(fail(error.message));
      });

    return true;
  });

  resumeAutoFill();
}
