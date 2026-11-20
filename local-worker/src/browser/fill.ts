import type { Page } from "playwright-core";
import { RESUME_FILE, type Fill } from "../execution/fields";
import { pickOption } from "./options";

export async function applyFill(page: Page, fill: Fill, resumeFile: string) {
  const target = page.locator(fill.field.selector).first();

  switch (fill.field.kind) {
    case "file":
      await target.setInputFiles(fill.value === RESUME_FILE ? resumeFile : []);
      return true;
    case "select": {
      const option = pickOption(fill.field.options, fill.value);

      if (!option) return false;
      await target.selectOption({ label: option });
      return true;
    }
    case "radio": {
      const option = pickOption(fill.field.options, fill.value);

      if (!option) return false;
      await page.getByLabel(option, { exact: true }).and(page.locator(fill.field.selector)).first().check();
      return true;
    }
    default:
      await target.fill(fill.value);
      return true;
  }
}

export async function readValue(page: Page, fill: Fill) {
  const target = page.locator(fill.field.selector);

  switch (fill.field.kind) {
    case "file":
      return target.first().evaluate((element) => ((element as HTMLInputElement).files?.length ?? 0) > 0 ? "attached" : "");
    case "select":
      return target.first().evaluate((element) => {
        const select = element as HTMLSelectElement;

        return select.options[select.selectedIndex]?.textContent?.trim() ?? "";
      });
    case "radio":
      return page.evaluate((selector) => {
        const checked = document.querySelector<HTMLInputElement>(`${selector}:checked`);

        return checked ? (document.querySelector(`label[for="${CSS.escape(checked.id)}"]`)?.textContent?.trim() ?? checked.value) : "";
      }, fill.field.selector);
    default:
      return target.first().inputValue();
  }
}
