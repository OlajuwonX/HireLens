import { clearConnection, readConnection } from "../shared/connection";
import { ask } from "../shared/messages";
import type { FillSummary } from "../shared/types";
import { lastOrigin, startConnect } from "./connect";
import { fillActiveTab } from "./tab";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const views = { connect: $("connect-view"), fill: $("fill-view") };
const result = $("result");
const missing = $<HTMLUListElement>("missing");
const application = $("application");
let matched: FillSummary["application"] = null;

async function busy<T>(button: HTMLButtonElement, label: string, run: () => Promise<T>) {
  const original = button.textContent;

  button.disabled = true;
  button.textContent = label;

  try {
    return await run();
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function showSummary(summary: FillSummary) {
  const resume = summary.resumeAttached ? (summary.tailored ? " Tailored resume attached." : " Resume attached.") : "";

  result.textContent = `Filled ${summary.filled} of ${summary.fields} fields.${resume} New pages fill automatically when you select Next.`;
  missing.replaceChildren(
    ...summary.missing.map((label) => Object.assign(document.createElement("li"), { textContent: `Needs you: ${label}` })),
  );
  matched = summary.application;
  application.hidden = !matched;
  $("application-name").textContent = matched ? `${matched.title} at ${matched.company}` : "";
}

async function render() {
  const connection = await readConnection();

  views.connect.hidden = Boolean(connection);
  views.fill.hidden = !connection;
  $("status").textContent = connection ? new URL(connection.origin).host : "Not connected";
  $<HTMLAnchorElement>("open").href = connection?.origin ?? "#";
  $<HTMLInputElement>("origin").value ||= await lastOrigin();
}

$<HTMLButtonElement>("connect").addEventListener("click", (event) =>
  busy(event.currentTarget as HTMLButtonElement, "Opening HireLens...", () =>
    startConnect($<HTMLInputElement>("origin").value).then(() => window.close()),
  ).catch((error: Error) => ($("connect-error").textContent = error.message)),
);

$<HTMLButtonElement>("fill").addEventListener("click", (event) =>
  busy(event.currentTarget as HTMLButtonElement, "Filling...", fillActiveTab)
    .then(showSummary)
    .catch((error: Error) => (result.textContent = error.message)),
);

$<HTMLButtonElement>("applied").addEventListener("click", async (event) => {
  if (!matched) return;

  const reply = await busy(event.currentTarget as HTMLButtonElement, "Saving...", () =>
    ask<void>({ type: "applied", applicationPublicId: matched!.publicId }),
  );

  result.textContent = reply.ok ? "Marked as applied in HireLens." : reply.message;
  application.hidden = reply.ok;
});

$<HTMLButtonElement>("disconnect").addEventListener("click", () => void clearConnection().then(render));

chrome.storage.onChanged.addListener(() => void render());

void render();
