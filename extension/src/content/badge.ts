import type { FillSummary, MatchSummary } from "../shared/types";

const BADGE_ID = "hirelens-fill-badge";
const SUMMARY_MS = 9_000;

let timer: number | undefined;

export function describeMatch(match: MatchSummary | null) {
  if (!match || match.after === null) return null;
  if (match.before === null || match.before === match.after) return `resume match ${match.after}%`;

  return `resume match ${match.before}% → ${match.after}%`;
}

export function describeSummary(summary: FillSummary) {
  const parts = [`HireLens filled ${summary.filled} field${summary.filled === 1 ? "" : "s"}`];
  const match = describeMatch(summary.match);

  if (summary.written > 0) parts.push(`AI wrote ${summary.written} answer${summary.written === 1 ? "" : "s"} (blue, please review)`);
  if (match) parts.push(match);
  if (summary.resumeAttached) parts.push(summary.tailored ? "tailored resume attached" : "resume attached");
  if (summary.coverLetterAttached) parts.push("cover letter attached");
  if (summary.missing.length > 0) parts.push(`${summary.missing.length} need you (orange)`);

  return [parts.join(" · "), ...summary.notes].join("\n");
}

export function showBadge(text: string, sticky = false) {
  if (window.top !== window) return;

  window.clearTimeout(timer);
  document.getElementById(BADGE_ID)?.remove();

  const badge = document.createElement("div");
  badge.id = BADGE_ID;
  badge.setAttribute("role", "status");
  badge.textContent = text;
  Object.assign(badge.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    zIndex: "2147483647",
    maxWidth: "340px",
    padding: "10px 14px",
    borderRadius: "8px",
    background: "#111827",
    color: "#ffffff",
    font: "13px/1.4 system-ui, sans-serif",
    whiteSpace: "pre-line",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
  });

  document.body.append(badge);

  if (!sticky) {
    timer = window.setTimeout(() => badge.remove(), SUMMARY_MS);
  }
}

export function hideBadge() {
  window.clearTimeout(timer);
  document.getElementById(BADGE_ID)?.remove();
}
