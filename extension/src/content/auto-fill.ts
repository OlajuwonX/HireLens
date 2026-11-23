import { showBadge, describeSummary } from "./badge";
import { fillPage, unseenFields } from "./fill-page";

const AUTO_KEY = "hirelens-auto-fill";
const SETTLE_MS = 700;

let observer: MutationObserver | null = null;
let timer: number | undefined;
let running = false;

async function fillNewFields() {
  if (running || unseenFields().length === 0) return;

  running = true;

  try {
    const summary = await fillPage("new");

    if (summary.filled > 0 || summary.missing.length > 0) showBadge(describeSummary(summary));
  } catch {
    stopAutoFill();
  } finally {
    running = false;
  }
}

export function startAutoFill() {
  try {
    sessionStorage.setItem(AUTO_KEY, "1");
  } catch {
    return watch();
  }

  watch();
}

function watch() {
  if (observer) return;

  observer = new MutationObserver(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void fillNewFields(), SETTLE_MS);
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "hidden"] });
}

export function stopAutoFill() {
  observer?.disconnect();
  observer = null;

  try {
    sessionStorage.removeItem(AUTO_KEY);
  } catch {
    return;
  }
}

export function resumeAutoFill() {
  let enabled = false;

  try {
    enabled = sessionStorage.getItem(AUTO_KEY) === "1";
  } catch {
    enabled = false;
  }

  if (enabled) {
    watch();
    window.setTimeout(() => void fillNewFields(), SETTLE_MS);
  }
}
