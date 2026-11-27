import { MATCH_TARGET } from "../../../features/extension/match";
import { clampScore, scoreToneFor } from "../../../lib/design/score-band";
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

export function matchRows(match: MatchSummary | null) {
  if (!match || match.after === null) return [];

  const now = { label: "Now", score: clampScore(match.after) };

  return match.before !== null && match.before !== match.after
    ? [{ label: "Before", score: clampScore(match.before) }, now]
    : [now];
}

function bar(row: { label: string; score: number }) {
  const item = document.createElement("div");
  const head = document.createElement("div");
  const track = document.createElement("span");
  const fill = document.createElement("span");

  item.className = "meter";
  item.setAttribute("role", "meter");
  item.setAttribute("aria-label", row.label);
  item.setAttribute("aria-valuemin", "0");
  item.setAttribute("aria-valuemax", "100");
  item.setAttribute("aria-valuenow", String(row.score));
  head.className = "meter-head";
  head.append(Object.assign(document.createElement("span"), { textContent: row.label }), Object.assign(document.createElement("em"), { textContent: `${row.score} / 100` }));
  track.className = "track";
  fill.className = `fill ${scoreToneFor(row.score).tone}`;
  fill.style.setProperty("--score-rest", `${100 - row.score}%`);
  track.append(fill);
  item.append(head, track);

  return item;
}

export function renderSummary(summary: FillSummary, slots: { result: HTMLElement; match: HTMLElement; gaps: HTMLUListElement; notes: HTMLUListElement; missing: HTMLUListElement }) {
  const matchLine = describeMatchLine(summary.match);
  const gaps = summary.match && summary.match.after !== null && summary.match.after < MATCH_TARGET ? summary.match.gaps : [];

  slots.result.textContent = describeResult(summary);
  slots.match.hidden = !matchLine;
  slots.match.replaceChildren(
    Object.assign(document.createElement("p"), { className: "panel-title", textContent: "Resume match" }),
    ...matchRows(summary.match).map(bar),
    Object.assign(document.createElement("p"), { className: "panel-note", textContent: matchLine ?? "" }),
  );
  slots.gaps.hidden = gaps.length === 0;
  slots.gaps.replaceChildren(...listItems(gaps, "Missing: "));
  slots.notes.replaceChildren(...listItems(summary.notes));
  slots.missing.replaceChildren(...listItems(summary.missing, "Needs you: "));
}
