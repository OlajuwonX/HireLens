import type { Page } from "playwright-core";
import type { FormField } from "../execution/fields";

export async function inspectForm(page: Page): Promise<FormField[]> {
  return page.evaluate(() => {
    const SKIP = new Set(["hidden", "submit", "button", "reset", "image", "search"]);
    const clean = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();

    const labelFor = (element: HTMLElement) => {
      const id = element.getAttribute("id");
      const explicit = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      const wrapping = element.closest("label");
      const labelledBy = element.getAttribute("aria-labelledby");
      const legend = element.closest("fieldset")?.querySelector("legend");

      if (element.getAttribute("type") === "radio" && legend) {
        return clean(legend.textContent);
      }

      return clean(
        explicit?.textContent ||
          element.getAttribute("aria-label") ||
          (labelledBy ? document.getElementById(labelledBy)?.textContent : "") ||
          wrapping?.textContent ||
          element.getAttribute("placeholder"),
      );
    };

    const selectorFor = (element: HTMLElement) => {
      const id = element.getAttribute("id");
      const name = element.getAttribute("name");

      return id ? `#${CSS.escape(id)}` : name ? `[name="${CSS.escape(name)}"]` : null;
    };

    const seenRadios = new Set<string>();
    const fields: FormField[] = [];

    for (const element of Array.from(document.querySelectorAll<HTMLElement>("input, select, textarea"))) {
      const type = (element.getAttribute("type") ?? "").toLowerCase();
      const tag = element.tagName.toLowerCase();

      if (SKIP.has(type) || element.hasAttribute("disabled")) {
        continue;
      }

      const name = element.getAttribute("name") ?? "";

      if (type === "radio") {
        if (seenRadios.has(name)) continue;
        seenRadios.add(name);
      }

      const selector = type === "radio" ? `[name="${CSS.escape(name)}"]` : selectorFor(element);
      const label = labelFor(element);

      if (!selector) {
        continue;
      }

      const kind = tag === "select" ? "select" : tag === "textarea" ? "textarea" : type === "file" ? "file" : type === "radio" ? "radio" : type === "checkbox" ? "checkbox" : "text";
      const radios = type === "radio" ? Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(name)}"]`)) : [];
      const options =
        tag === "select"
          ? Array.from((element as HTMLSelectElement).options).map((option) => clean(option.textContent)).filter(Boolean)
          : radios.map((radio) => clean(document.querySelector(`label[for="${CSS.escape(radio.id)}"]`)?.textContent || radio.value));

      fields.push({
        selector,
        kind,
        label: label.replace(/\s*\*\s*$/, ""),
        required:
          element.hasAttribute("required") ||
          element.getAttribute("aria-required") === "true" ||
          /\*\s*$/.test(label),
        options,
      });
    }

    return fields;
  });
}
