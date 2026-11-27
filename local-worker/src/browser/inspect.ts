import type { Page } from "playwright-core";
import type { FormField } from "../execution/fields";
import { inspectDocument } from "./dom-inspect";

export async function inspectForm(page: Page): Promise<FormField[]> {
  return page.evaluate(inspectDocument);
}
