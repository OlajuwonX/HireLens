import { pickOption } from "../../../local-worker/src/browser/options";

const SELECTED = /(selected|active|checked|pressed)/i;

const choicesIn = (group: Element) => Array.from(group.querySelectorAll<HTMLElement>('[role="radio"], button'));

const choiceText = (choice: Element) => (choice.getAttribute("aria-label") || choice.textContent || "").replace(/\s+/g, " ").trim();

export function isChoiceGroup(element: Element) {
  return element.tagName !== "INPUT";
}

export function isChosen(choice: Element) {
  const state = choice.getAttribute("data-state");

  return (
    choice.getAttribute("aria-checked") === "true" ||
    choice.getAttribute("aria-pressed") === "true" ||
    state === "checked" ||
    state === "on" ||
    (typeof choice.className === "string" && SELECTED.test(choice.className) && !/inactive|unselected/i.test(choice.className))
  );
}

export function groupHasValue(group: Element) {
  return choicesIn(group).some(isChosen);
}

export function chooseInGroup(group: Element, value: string) {
  const choices = choicesIn(group);
  const label = pickOption(choices.map(choiceText), value);
  const choice = choices.find((item) => choiceText(item) === label);

  if (!choice) return false;

  choice.click();

  return true;
}
