import type { FillSummary } from "../shared/types";

const BADGE_ID = "hirelens-fill-badge";

export function describeSummary(summary: FillSummary) {
  const parts = [`HireLens filled ${summary.filled} field${summary.filled === 1 ? "" : "s"}`];

  if (summary.resumeAttached) parts.push(summary.tailored ? "tailored resume attached" : "resume attached");
  if (summary.missing.length > 0) parts.push(`${summary.missing.length} need you (highlighted)`);

  return parts.join(" · ");
}

export function showBadge(text: string) {
  if (window.top !== window) return;

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
    maxWidth: "320px",
    padding: "10px 14px",
    borderRadius: "8px",
    background: "#111827",
    color: "#ffffff",
    font: "13px/1.4 system-ui, sans-serif",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
  });

  document.body.append(badge);
  window.setTimeout(() => badge.remove(), 6_000);
}
