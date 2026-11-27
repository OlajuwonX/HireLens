import { pickOption } from "../../../local-worker/src/browser/options";
import type { FormField } from "../../../local-worker/src/execution/fields";

const elementsFor = (field: FormField) => Array.from(document.querySelectorAll<HTMLElement>(field.selector));

const first = (field: FormField) => elementsFor(field)[0] ?? null;

function announce(element: HTMLElement) {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new Event("blur", { bubbles: true }));
}

function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const prototype = Object.getPrototypeOf(element) as object;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  if (setter) {
    setter.call(element, value);
  } else {
    element.value = value;
  }
}

function radioLabel(radio: HTMLInputElement) {
  const label = radio.id ? document.querySelector(`label[for="${CSS.escape(radio.id)}"]`) : radio.closest("label");

  return (label?.textContent ?? radio.value).replace(/\s+/g, " ").trim();
}

export function hasValue(field: FormField) {
  const element = first(field);

  if (!element) return true;

  switch (field.kind) {
    case "radio":
      return elementsFor(field).some((radio) => (radio as HTMLInputElement).checked);
    case "checkbox":
      return (element as HTMLInputElement).checked;
    case "file":
      return ((element as HTMLInputElement).files?.length ?? 0) > 0;
    default:
      return (element as HTMLInputElement).value.trim() !== "";
  }
}

export function fillValue(field: FormField, value: string) {
  const element = first(field);

  if (!element) return false;

  if (field.kind === "select") {
    const select = element as HTMLSelectElement;
    const label = pickOption(field.options, value);
    const option = Array.from(select.options).find((item) => item.textContent?.replace(/\s+/g, " ").trim() === label);

    if (!option) return false;
    setNativeValue(select, option.value);
    announce(select);
    return true;
  }

  if (field.kind === "radio") {
    const radios = elementsFor(field) as HTMLInputElement[];
    const label = pickOption(radios.map(radioLabel), value);
    const radio = radios.find((item) => radioLabel(item) === label);

    if (!radio) return false;
    radio.click();
    return radio.checked;
  }

  const input = element as HTMLInputElement | HTMLTextAreaElement;

  input.focus();
  setNativeValue(input, value);
  announce(input);
  return true;
}

export function attachFile(field: FormField, file: File) {
  const input = first(field) as HTMLInputElement | null;

  if (!input) return false;

  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  announce(input);
  return (input.files?.length ?? 0) > 0;
}

export function highlight(field: FormField) {
  const element = first(field);

  if (!element || element.dataset.hirelensMissing) return;

  element.dataset.hirelensMissing = "true";
  element.style.outline = "2px solid #f59e0b";
  element.style.outlineOffset = "2px";
  element.title = "HireLens could not fill this. Please answer it yourself.";
  element.addEventListener(
    "input",
    () => {
      element.style.outline = "";
      delete element.dataset.hirelensMissing;
    },
    { once: true },
  );
}

export function maxLengthOf(field: FormField) {
  const element = first(field) as HTMLInputElement | null;

  return element && element.maxLength > 0 ? element.maxLength : null;
}

export function markWritten(field: FormField) {
  const element = first(field);

  if (!element) return;

  element.dataset.hirelensAi = "true";
  element.style.outline = "2px solid #3b82f6";
  element.style.outlineOffset = "2px";
  element.title = "Written by HireLens AI. Review it before you submit.";
  element.addEventListener(
    "input",
    () => {
      element.style.outline = "";
      delete element.dataset.hirelensAi;
    },
    { once: true },
  );
}
