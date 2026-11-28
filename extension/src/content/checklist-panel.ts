import { checkCounts, mergeRows, statusText, type CheckRow, type CheckStatus } from "../shared/checklist";
import { panelStyles } from "./checklist-styles";

const HOST_ID = "hirelens-checklist";
const OPEN_STATUSES: ReadonlySet<CheckStatus> = new Set(["needs-you", "skipped"]);

let rows: CheckRow[] = [];
let collapsed = false;
const watched = new Set<string>();

const exists = (selector: string) => document.querySelector(selector) !== null;

function make<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = "") {
  return Object.assign(document.createElement(tag), { className, textContent: text });
}

function jumpTo(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);

  if (!element) return;

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.focus({ preventScroll: true });
  element.animate([{ outline: "3px solid #c5f85a" }, { outline: "3px solid transparent" }], { duration: 1200 });
}

function watchForAnswer(row: CheckRow) {
  if (!OPEN_STATUSES.has(row.status) || watched.has(row.selector)) return;

  const element = document.querySelector(row.selector);

  if (!element) return;

  watched.add(row.selector);
  element.addEventListener(
    /^(INPUT|SELECT|TEXTAREA)$/.test(element.tagName) ? "change" : "click",
    () => {
      rows = rows.map((item) => (item.selector === row.selector ? { ...item, status: "you", reason: null } : item));
      watched.delete(row.selector);
      render();
    },
    { once: true },
  );
}

function rowButton(row: CheckRow) {
  const button = make("button", `row ${row.status}`);
  const text = make("span", "text");

  button.type = "button";
  text.append(make("span", "label", row.label), make("span", "status", row.reason ?? statusText[row.status]));
  button.append(make("span", "dot"), text);
  button.addEventListener("click", () => jumpTo(row.selector));

  return button;
}

function render() {
  document.getElementById(HOST_ID)?.remove();

  if (rows.length === 0) return;

  const host = document.createElement("div");
  const root = host.attachShadow({ mode: "open" });
  const panel = make("section", collapsed ? "panel collapsed" : "panel");
  const header = make("header", "head");
  const counts = checkCounts(rows);
  const toggle = make("button", "icon", collapsed ? "+" : "–");
  const close = make("button", "icon", "×");
  const list = make("div", "list");

  host.id = HOST_ID;
  panel.setAttribute("aria-label", "HireLens checklist");
  toggle.setAttribute("aria-label", collapsed ? "Show checklist" : "Hide checklist");
  close.setAttribute("aria-label", "Close checklist");
  toggle.addEventListener("click", () => {
    collapsed = !collapsed;
    render();
  });
  close.addEventListener("click", () => host.remove());
  header.append(
    make("strong", "title", "HireLens checklist"),
    make("span", "count", `${counts.done} done · ${counts.needsYou} need you`),
    toggle,
    close,
  );
  list.append(...rows.map(rowButton));
  panel.append(header, list);
  root.append(Object.assign(document.createElement("style"), { textContent: panelStyles }), panel);
  document.body.append(host);
  rows.forEach(watchForAnswer);
}

export function showChecklist(next: CheckRow[]) {
  rows = mergeRows(rows, next, exists);
  render();
}
