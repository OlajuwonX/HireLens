import { MATCH_TARGET } from "../../../features/extension/match";
import type { FillSummary, MatchSummary } from "../shared/types";

const listItems = (items: string[], prefix = "") =>
  items.map((text) => Object.assign(document.createElement("li"), { textContent: `${prefix}${text}` }));

export function describeResult(summary: FillSummary) {
  const parts = [`Filled ${summary.filled} of ${summary.fields} fields.`];

  if (summary.written > 0) parts.push(`AI wrote ${summary.written} answer${summary.written === 1 ? "" : "s"}, outlined in blue. Review them before you submit.`);
  if (summary.resumeAttached) parts.push(summary.tailored ? "Tailored resume attached." : "Resume attached.");
  if (summary.coverLetterAttached) parts.push("Cover letter attached.");
  parts.push("New pages fill automatically when you select Next.");

  return parts.join(" ");
}

export function describeMatchLine(match: MatchSummary | null) {
  if (!match || match.after === null) return null;

  const change = match.before !== null && match.before !== match.after ? `${match.before}% → ${match.after}%` : `${match.after}%`;

  return match.after >= MATCH_TARGET ? `Resume match ${change}` : `Resume match ${change}. It cannot go higher without inventing experience.`;
}

export function renderSummary(summary: FillSummary, slots: { result: HTMLElement; match: HTMLElement; gaps: HTMLUListElement; notes: HTMLUListElement; missing: HTMLUListElement }) {
  const matchLine = describeMatchLine(summary.match);
  const gaps = summary.match && summary.match.after !== null && summary.match.after < MATCH_TARGET ? summary.match.gaps : [];

  slots.result.textContent = describeResult(summary);
  slots.match.hidden = !matchLine;
  slots.match.textContent = matchLine ?? "";
  slots.gaps.hidden = gaps.length === 0;
  slots.gaps.replaceChildren(...listItems(gaps, "Missing: "));
  slots.notes.replaceChildren(...listItems(summary.notes));
  slots.missing.replaceChildren(...listItems(summary.missing, "Needs you: "));
}
