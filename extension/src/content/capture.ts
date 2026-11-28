import { describeHeld, readJobPosting, type HeldDescription } from "../shared/job-posting";
import { readPageText } from "./page-text";

const PAGE_LIMIT = 60_000;

export function captureDescription(): HeldDescription {
  const blocks = Array.from(document.querySelectorAll('script[type="application/ld+json"]'), (script) => script.textContent ?? "");
  const posting = readJobPosting(blocks);
  const text = describeHeld(posting, readPageText(PAGE_LIMIT)).slice(0, PAGE_LIMIT);

  return { url: location.href, title: posting?.title || document.title, text, savedAt: Date.now() };
}
